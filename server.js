require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS - Allow all origins for now
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

// Configure Nodemailer
// Create email transporter
let transporter = null;

function getEmailTransporter() {
    if (!transporter && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        console.log('Email transporter configured');
    }
    return transporter;
}

// API endpoint to send diamond inquiry with email
app.post('/api/diamonds/send-inquiry', async (req, res) => {
    try {
        const { customer, diamond, quantity, totalPrice, totalPriceFormatted, message } = req.body;
        console.log('Received inquiry:', { customer: customer.email, diamond: diamond.sku });

        // Validate required fields
        if (!customer || !customer.name || !customer.email || !customer.phone) {
            return res.status(400).json({ error: 'Customer details are required' });
        }

        if (!diamond || !diamond.sku) {
            return res.status(400).json({ error: 'Diamond details are required' });
        }

        const ownerEmail = process.env.OWNER_EMAIL || 'owner@example.com';
        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

        // Owner Email HTML
        const ownerEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .section { margin-bottom: 20px; }
    .section h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    td:first-child { font-weight: bold; width: 40%; }
    .highlight { background: #fff; padding: 15px; border-left: 4px solid #3498db; margin: 10px 0; }
    .diamond-image { max-width: 100%; height: auto; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔷 New Diamond Inquiry</h1>
    </div>
    <div class="content">
      <div class="section">
        <h3>👤 Customer Information</h3>
        <table>
          <tr><td>Name:</td><td>${customer.name}</td></tr>
          <tr><td>Email:</td><td><a href="mailto:${customer.email}">${customer.email}</a></td></tr>
          <tr><td>Phone:</td><td><a href="tel:${customer.phone}">${customer.phone}</a></td></tr>
        </table>
      </div>

      <div class="section">
        <h3>💎 Diamond Details</h3>
        <table>
          <tr><td>SKU:</td><td>${diamond.sku}</td></tr>
          <tr><td>Name:</td><td>${diamond.name}</td></tr>
          <tr><td>Shape:</td><td>${diamond.shape || 'N/A'}</td></tr>
          <tr><td>Carat:</td><td>${diamond.size || 'N/A'}</td></tr>
          <tr><td>Color:</td><td>${diamond.color || 'N/A'}</td></tr>
          <tr><td>Clarity:</td><td>${diamond.clarity || 'N/A'}</td></tr>
          <tr><td>Cut:</td><td>${diamond.cut || 'N/A'}</td></tr>
          <tr><td>Polish:</td><td>${diamond.polish || 'N/A'}</td></tr>
          <tr><td>Symmetry:</td><td>${diamond.symmetry || 'N/A'}</td></tr>
          <tr><td>Lab:</td><td>${diamond.lab || 'N/A'}</td></tr>
          <tr><td>Certificate:</td><td>${diamond.cert_num || 'N/A'}</td></tr>
        </table>
      </div>

      <div class="section">
        <h3>💰 Pricing</h3>
        <table>
          <tr><td>Price per unit:</td><td>${diamond.priceFormatted}</td></tr>
          <tr><td>Quantity:</td><td>${quantity}</td></tr>
          <tr><td><strong>Total Price:</strong></td><td><strong>${totalPriceFormatted}</strong></td></tr>
        </table>
      </div>

      ${message ? `
      <div class="section">
        <h3>💬 Customer Message</h3>
        <div class="highlight">${message}</div>
      </div>
      ` : ''}

      ${diamond.image ? `
      <div class="section">
        <h3>📸 Diamond Image</h3>
        <img src="${diamond.image}" alt="${diamond.name}" class="diamond-image">
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
    `;

        // Customer Email HTML
        const customerEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3498db; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .section { margin-bottom: 20px; }
    .section h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    td:first-child { font-weight: bold; width: 40%; }
    .diamond-image { max-width: 100%; height: auto; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Thank You for Your Inquiry!</h1>
    </div>
    <div class="content">
      <p>Dear ${customer.name},</p>
      <p>Thank you for your interest in our diamond. We have received your inquiry and our team will get back to you shortly.</p>

      <div class="section">
        <h3>💎 Your Inquiry Details</h3>
        <table>
          <tr><td>Diamond:</td><td>${diamond.name}</td></tr>
          <tr><td>SKU:</td><td>${diamond.sku}</td></tr>
          <tr><td>Shape:</td><td>${diamond.shape || 'N/A'}</td></tr>
          <tr><td>Carat:</td><td>${diamond.size || 'N/A'}</td></tr>
          <tr><td>Color:</td><td>${diamond.color || 'N/A'}</td></tr>
          <tr><td>Clarity:</td><td>${diamond.clarity || 'N/A'}</td></tr>
          <tr><td>Cut:</td><td>${diamond.cut || 'N/A'}</td></tr>
          <tr><td>Price per unit:</td><td>${diamond.priceFormatted}</td></tr>
          <tr><td>Quantity:</td><td>${quantity}</td></tr>
          <tr><td><strong>Total:</strong></td><td><strong>${totalPriceFormatted}</strong></td></tr>
        </table>
      </div>

      ${diamond.image ? `
      <div class="section">
        <img src="${diamond.image}" alt="${diamond.name}" class="diamond-image">
      </div>
      ` : ''}

      <p>We will review your inquiry and contact you within 24 hours.</p>
      <p>If you have any urgent questions, please feel free to contact us directly.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br><strong>Your Diamond Store Team</strong></p>
    </div>
  </div>
</body>
</html>
    `;

        // Try to send emails
        const emailTransporter = getEmailTransporter();

        if (emailTransporter) {
            try {
                // Send email to owner
                await emailTransporter.sendMail({
                    from: `"Diamond Inquiry" <${fromEmail}>`,
                    to: ownerEmail,
                    subject: `🔷 New Diamond Inquiry - ${diamond.name}`,
                    html: ownerEmailHTML
                });
                console.log('Owner email sent successfully');

                // Send confirmation email to customer
                await emailTransporter.sendMail({
                    from: `"Diamond Store" <${fromEmail}>`,
                    to: customer.email,
                    subject: `✨ Your Diamond Inquiry - ${diamond.name}`,
                    html: customerEmailHTML
                });
                console.log('Customer email sent successfully');

                res.json({
                    success: true,
                    message: 'Inquiry sent successfully. You will receive a confirmation email shortly.',
                    emailSent: true
                });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                res.json({
                    success: true,
                    message: 'Inquiry received but email notification failed. We will contact you soon.',
                    emailSent: false,
                    emailError: emailError.message
                });
            }
        } else {
            console.log('Email not configured, inquiry logged only');
            res.json({
                success: true,
                message: 'Inquiry received successfully. We will contact you soon.',
                emailSent: false,
                note: 'Email service not configured'
            });
        }

    } catch (error) {
        console.error('Error processing inquiry:', error);
        res.status(500).json({
            error: 'Failed to process inquiry',
            details: error.message
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
            console.error('SHOPIFY_STORE:', process.env.SHOPIFY_STORE ? 'Set' : 'Missing');
            console.error('SHOPIFY_ACCESS_TOKEN:', process.env.SHOPIFY_ACCESS_TOKEN ? 'Set' : 'Missing');
            return res.status(400).json({
                error: 'Shopify not configured',
                message: 'Please add SHOPIFY_STORE and SHOPIFY_ACCESS_TOKEN to .env file',
                details: {
                    shopify_store: process.env.SHOPIFY_STORE ? 'configured' : 'missing',
                    shopify_token: process.env.SHOPIFY_ACCESS_TOKEN ? 'configured' : 'missing'
                }
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
