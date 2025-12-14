require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Token management
let tokenData = {
    access_token: null,
    expires_at: null
};

// Get access token with auto-refresh
async function getAccessToken() {
    const now = Date.now();

    // Check if token exists and is still valid (refresh 5 minutes before expiry)
    if (tokenData.access_token && tokenData.expires_at && now < tokenData.expires_at - 300000) {
        return tokenData.access_token;
    }

    // Fetch new token
    try {
        const response = await axios.post('https://authztoken.api.rapaport.com/api/get', {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        tokenData.access_token = response.data.access_token;
        tokenData.expires_at = now + (response.data.expires_in * 1000);

        console.log('New token obtained, expires in', response.data.expires_in, 'seconds');
        return tokenData.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.response?.data || error.message);
        throw new Error('Failed to obtain access token');
    }
}

// Health check endpoint (must be before catch-all)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        tokenValid: tokenData.access_token && Date.now() < tokenData.expires_at
    });
});

// API endpoint to search diamonds (must be before catch-all)
app.post('/api/diamonds/search', async (req, res) => {
    try {
        console.log('Received search request:', req.body);
        const token = await getAccessToken();

        const searchParams = req.body;

        const response = await axios.post(
            'https://technet.rapnetapis.com/instant-inventory/api/Diamonds',
            { request: { body: searchParams } },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Error searching diamonds:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to search diamonds',
            details: error.response?.data || error.message
        });
    }
});

// API endpoint to create Shopify product for diamond (must be before catch-all)
app.post('/apps/diamond/createProduct', async (req, res) => {
    try {
        const diamond = req.body;
        console.log('Creating Shopify product for diamond:', diamond.diamond_id || diamond.stock_num);

        // Check if Shopify credentials are configured
        if (!process.env.SHOPIFY_STORE || !process.env.SHOPIFY_ACCESS_TOKEN) {
            console.error('Shopify credentials not configured');
            return res.status(500).json({
                error: 'Shopify not configured',
                message: 'Please add SHOPIFY_STORE and SHOPIFY_ACCESS_TOKEN to .env file'
            });
        }

        const shopifyStore = process.env.SHOPIFY_STORE;
        const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;

        // Check if product already exists by SKU
        const sku = diamond.stock_num || diamond.diamond_id;
        const searchUrl = `https://${shopifyStore}/admin/api/2024-01/products.json?fields=id,variants&limit=250`;

        let existingProduct = null;
        try {
            const searchResponse = await axios.get(searchUrl, {
                headers: {
                    'X-Shopify-Access-Token': shopifyAccessToken,
                    'Content-Type': 'application/json'
                }
            });

            // Search for product with matching SKU
            for (const product of searchResponse.data.products) {
                const variant = product.variants.find(v => v.sku === sku);
                if (variant) {
                    existingProduct = { id: product.id, variant_id: variant.id };
                    console.log('Found existing product:', existingProduct);
                    break;
                }
            }
        } catch (searchError) {
            console.log('Error searching for existing product:', searchError.message);
        }

        // If product exists, return it
        if (existingProduct) {
            return res.json({
                id: `gid://shopify/ProductVariant/${existingProduct.variant_id}`,
                product_id: `gid://shopify/Product/${existingProduct.id}`,
                variants: [{ id: existingProduct.variant_id }]
            });
        }

        // Create new product
        const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.cut || ''} Cut ${diamond.shape || ''} Diamond`.trim();
        const price = diamond.total_sales_price_in_currency || diamond.total_sales_price || 0;

        const productData = {
            product: {
                title: diamondName,
                body_html: generateDiamondDescription(diamond),
                vendor: diamond.lab || 'Diamond Vendor',
                product_type: 'Diamond',
                tags: ['Diamond', diamond.shape, diamond.lab, diamond.color, diamond.clarity].filter(Boolean).join(', '),
                variants: [
                    {
                        price: price.toString(),
                        sku: sku,
                        inventory_management: null, // Don't track inventory for vendor products
                        inventory_policy: 'continue', // Allow selling when out of stock
                        weight: diamond.size || 0,
                        weight_unit: 'ct'
                    }
                ],
                images: diamond.image_file ? [{ src: diamond.image_file }] : []
            }
        };

        const createUrl = `https://${shopifyStore}/admin/api/2024-01/products.json`;
        const createResponse = await axios.post(createUrl, productData, {
            headers: {
                'X-Shopify-Access-Token': shopifyAccessToken,
                'Content-Type': 'application/json'
            }
        });

        const createdProduct = createResponse.data.product;
        console.log('Product created successfully:', createdProduct.id);

        res.json({
            id: `gid://shopify/ProductVariant/${createdProduct.variants[0].id}`,
            product_id: `gid://shopify/Product/${createdProduct.id}`,
            variants: createdProduct.variants
        });

    } catch (error) {
        console.error('Error creating Shopify product:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to create product',
            details: error.response?.data?.errors || error.message
        });
    }
});

// Helper function to generate diamond description
function generateDiamondDescription(diamond) {
    return `
    <h3>Diamond Specifications</h3>
    <ul>
      ${diamond.shape ? `<li><strong>Shape:</strong> ${diamond.shape}</li>` : ''}
      ${diamond.size ? `<li><strong>Carat:</strong> ${diamond.size}</li>` : ''}
      ${diamond.color ? `<li><strong>Color:</strong> ${diamond.color}</li>` : ''}
      ${diamond.clarity ? `<li><strong>Clarity:</strong> ${diamond.clarity}</li>` : ''}
      ${diamond.cut ? `<li><strong>Cut:</strong> ${diamond.cut}</li>` : ''}
      ${diamond.polish ? `<li><strong>Polish:</strong> ${diamond.polish}</li>` : ''}
      ${diamond.symmetry ? `<li><strong>Symmetry:</strong> ${diamond.symmetry}</li>` : ''}
      ${diamond.fluor_intensity ? `<li><strong>Fluorescence:</strong> ${diamond.fluor_intensity}</li>` : ''}
      ${diamond.lab ? `<li><strong>Lab:</strong> ${diamond.lab}</li>` : ''}
      ${diamond.cert_num ? `<li><strong>Certificate:</strong> ${diamond.cert_num}</li>` : ''}
    </ul>
    ${diamond.meas_length && diamond.meas_width && diamond.meas_depth ? `
    <h3>Measurements</h3>
    <p>${diamond.meas_length} x ${diamond.meas_width} x ${diamond.meas_depth} mm</p>
    ` : ''}
    ${diamond.depth_percent ? `<p><strong>Depth:</strong> ${diamond.depth_percent}%</p>` : ''}
    ${diamond.table_percent ? `<p><strong>Table:</strong> ${diamond.table_percent}%</p>` : ''}
  `;
}

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve product.html for product page
app.get('/product.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Catch-all route for SPA - serve index.html for any other routes (MUST BE LAST)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Environment check:');
    console.log('- CLIENT_ID:', process.env.CLIENT_ID ? 'Set ✓' : 'Missing ✗');
    console.log('- CLIENT_SECRET:', process.env.CLIENT_SECRET ? 'Set ✓' : 'Missing ✗');
    console.log('- PORT:', PORT);
    console.log('\nAPI Endpoints:');
    console.log('- POST /api/diamonds/search');
    console.log('- GET  /api/health');
});
