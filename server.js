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

        // Cache the diamonds from search results for direct link access
        if (response.data && response.data.response && response.data.response.body && response.data.response.body.diamonds) {
            const diamonds = response.data.response.body.diamonds;
            diamonds.forEach(diamond => {
                const diamondId = diamond.diamond_id || diamond.stock_num;
                if (diamondId) {
                    diamondCache.set(String(diamondId), {
                        data: diamond,
                        timestamp: Date.now()
                    });
                }
            });
            console.log(`Cached ${diamonds.length} diamonds for direct access`);
        }

        res.json(response.data);
    } catch (error) {
        console.error('Error searching diamonds:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to search diamonds',
            details: error.response?.data || error.message
        });
    }
});

// Simple in-memory cache for diamonds (stores recently viewed diamonds)
const diamondCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// API endpoint to get diamond by ID using SingleDiamond API
app.get('/api/diamonds/get-by-id/:diamondId', async (req, res) => {
    try {
        const { diamondId } = req.params;
        console.log('Fetching diamond by ID:', diamondId);

        // Check cache first
        const cached = diamondCache.get(diamondId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Returning cached diamond');
            return res.json({ diamond: cached.data, seller: cached.seller });
        }

        const token = await getAccessToken();

        // Use SingleDiamond API endpoint
        const response = await axios.post(
            'https://technet.rapnetapis.com/instant-inventory/api/SingleDiamond',
            {
                request: {
                    header: {},
                    body: {
                        diamond_id: parseInt(diamondId)
                    }
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        // Check if response is successful
        if (response.data && response.data.response) {
            const { header, body } = response.data.response;

            // Check for errors in response
            if (header.error_code !== 0) {
                console.log('API returned error:', header.error_message);
                return res.status(404).json({
                    error: 'Diamond not found',
                    message: header.error_message || 'This diamond may no longer be available.'
                });
            }

            if (body && body.diamond) {
                const diamond = body.diamond;
                const seller = body.seller;

                console.log('Diamond found via SingleDiamond API');

                // Cache the diamond for future requests
                diamondCache.set(diamondId, {
                    data: diamond,
                    seller: seller,
                    timestamp: Date.now()
                });

                return res.json({
                    diamond: diamond,
                    seller: seller
                });
            }
        }

        // Diamond not found
        console.log('Diamond not found in API response');
        res.status(404).json({
            error: 'Diamond not found',
            message: 'This diamond may no longer be available. Please search for similar diamonds.'
        });

    } catch (error) {
        console.error('Error fetching diamond by ID:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch diamond',
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
        const storeUrl = process.env.STORE_URL || 'https://yourstore.com';
        const brandName = process.env.BRAND_NAME || 'Diamond Store';
        const brandLogo = process.env.BRAND_LOGO_URL || '';
        const brandColor = process.env.BRAND_COLOR || '#667eea';

        // Owner Email HTML - Enterprise Design
        const ownerEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e0e0e0;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e0e0e0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 20px; color: #1a1a1a; font-weight: 600;">New Diamond Inquiry</h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666666;">Inquiry ID: ${Date.now()} | ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </td>
                  <td align="right">
                    <div style="background-color: #f5f5f5; padding: 8px 16px; border-radius: 4px;">
                      <p style="margin: 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Total Value</p>
                      <p style="margin: 4px 0 0 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">${totalPriceFormatted}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Customer Information -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Customer Information</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e0e0e0;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; width: 140px; font-size: 13px; color: #666666;">Name</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${customer.name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Email</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px;"><a href="mailto:${customer.email}" style="color: #0066cc; text-decoration: none;">${customer.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #666666;">Phone</td>
                  <td style="padding: 12px 16px; font-size: 14px;"><a href="tel:${customer.phone}" style="color: #0066cc; text-decoration: none;">${customer.phone}</a></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Diamond Details -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Diamond Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e0e0e0;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; width: 140px; font-size: 13px; color: #666666;">Stock Number</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 600;">${diamond.sku}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Description</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a;">${diamond.name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Shape</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a;">${diamond.shape || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Carat</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${diamond.size || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Color / Clarity</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${diamond.color || 'N/A'} / ${diamond.clarity || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Cut / Polish / Symmetry</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a;">${diamond.cut || 'N/A'} / ${diamond.polish || 'N/A'} / ${diamond.symmetry || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Certification</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${diamond.lab || 'N/A'}${diamond.cert_num ? ` #${diamond.cert_num}` : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Unit Price</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${diamond.priceFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Quantity</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a;">${quantity}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 14px 16px; font-size: 13px; color: #1a1a1a; font-weight: 600;">Total Value</td>
                  <td style="padding: 14px 16px; font-size: 16px; color: #1a1a1a; font-weight: 600;">${totalPriceFormatted}</td>
                </tr>
              </table>
              <p style="margin: 12px 0 0 0; font-size: 13px; color: #666666;">
                <a href="${storeUrl}/pages/diamonds?id=${diamond.id}&view=diamond-product" style="color: #0066cc; text-decoration: none;" target="_blank">View full details →</a>
              </p>
            </td>
          </tr>
          
          ${message ? `
          <!-- Customer Message -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Customer Message</h2>
              <div style="padding: 16px; background-color: #f9f9f9; border-left: 3px solid #0066cc; font-size: 14px; color: #1a1a1a; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          ` : ''}
          
          ${diamond.image ? `
          <!-- Diamond Image -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Product Image</h2>
              <img src="${diamond.image}" alt="${diamond.name}" style="max-width: 100%; height: auto; border: 1px solid #e0e0e0; display: block;">
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px; border-top: 1px solid #e0e0e0; margin-top: 32px;">
              <p style="margin: 0; font-size: 13px; color: #666666;">This inquiry was submitted via ${brandName}. Please respond within 24 hours.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

        // Customer Email HTML - Enterprise Design
        const customerEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e0e0e0;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #e0e0e0; text-align: center;">
              ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-width: 140px; height: auto; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;">` : ''}
              <h1 style="margin: 0; font-size: 20px; color: #1a1a1a; font-weight: 600;">Thank You for Your Inquiry</h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #666666;">Inquiry received on ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 14px;">Dear <strong>${customer.name}</strong>,</p>
              <p style="color: #1a1a1a; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">Thank you for your interest in our diamond collection. We have received your inquiry and our team will contact you shortly.</p>
              
              <!-- Inquiry Details -->
              <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Inquiry Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; width: 140px; font-size: 13px; color: #666666;">Stock Number</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 600;">${diamond.sku}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Description</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a;">${diamond.name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Shape</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a;">${diamond.shape || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Carat</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${diamond.size || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Color / Clarity</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a;">${diamond.color || 'N/A'} / ${diamond.clarity || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Cut</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a;">${diamond.cut || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Unit Price</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${diamond.priceFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Quantity</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a;">${quantity}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 14px 16px; font-size: 13px; color: #1a1a1a; font-weight: 600;">Total Value</td>
                  <td style="padding: 14px 16px; font-size: 16px; color: #1a1a1a; font-weight: 600;">${totalPriceFormatted}</td>
                </tr>
              </table>
              
              ${diamond.image ? `
              <h2 style="margin: 24px 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Product Image</h2>
              <img src="${diamond.image}" alt="${diamond.name}" style="max-width: 100%; height: auto; border: 1px solid #e0e0e0; display: block; margin-bottom: 24px;">
              ` : ''}
              
              <!-- Response Time Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #fffbf0; border: 1px solid #f0e5d0; padding: 16px; font-size: 13px; color: #1a1a1a; line-height: 1.6;">
                    <strong>Response Time:</strong> Our diamond specialist will review your inquiry and contact you within 24 hours.
                  </td>
                </tr>
              </table>
              
              <p style="color: #1a1a1a; margin: 24px 0 0 0; font-size: 14px;">For immediate assistance, please feel free to contact us directly.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #1a1a1a; font-weight: 600;">Best regards,</p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #1a1a1a;">${brandName} Team</p>
              <p style="margin: 0; font-size: 13px; color: #666666;">
                <a href="${storeUrl}" style="color: #0066cc; text-decoration: none;">${storeUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
                    subject: `New Diamond Inquiry - ${diamond.name}`,
                    html: ownerEmailHTML
                });
                console.log('Owner email sent successfully');

                // Send confirmation email to customer
                await emailTransporter.sendMail({
                    from: `"Diamond Store" <${fromEmail}>`,
                    to: customer.email,
                    subject: `Your Diamond Inquiry - ${diamond.name}`,
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

// API endpoint to send wishlist inquiry (multiple diamonds)
app.post('/api/diamonds/send-wishlist-inquiry', async (req, res) => {
    try {
        const { customer, diamonds, totalValue, totalValueFormatted, message, isMultiple } = req.body;
        console.log('Received wishlist inquiry:', {
            customer: customer.email,
            diamondCount: diamonds.length
        });

        // Validate required fields
        if (!customer || !customer.name || !customer.email || !customer.phone) {
            return res.status(400).json({ error: 'Customer details are required' });
        }

        if (!diamonds || diamonds.length === 0) {
            return res.status(400).json({ error: 'At least one diamond is required' });
        }

        const ownerEmail = process.env.OWNER_EMAIL || 'owner@example.com';
        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

        // Get branding and store URL from environment variables
        const storeUrl = process.env.STORE_URL || 'https://yourstore.com';
        const brandName = process.env.BRAND_NAME || 'Diamond Store';
        const brandLogo = process.env.BRAND_LOGO_URL || '';
        const brandColor = process.env.BRAND_COLOR || '#667eea';

        // Build diamond table rows for email
        const diamondRows = diamonds.map(d => `
          <tr>
            <td style="padding: 15px 10px; border-bottom: 1px solid #ddd; text-align: center; color: #000; font-weight: 600;">${d.index}</td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #ddd; color: #000;">
              <a href="${storeUrl}/pages/diamonds?id=${d.diamond_id}&view=diamond-product" 
                 style="color: #1a5490; text-decoration: underline; font-weight: 600;"
                 target="_blank">
                ${d.name}
              </a>
              ${d.lab ? `<br><span style="color: #666; font-size: 12px;">Certificate: ${d.lab}</span>` : ''}
            </td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #ddd; text-align: center; color: #000; font-weight: 600;">${d.sku}</td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #ddd; text-align: center; color: #000;">${d.shape}</td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #ddd; text-align: center; color: #000;">${d.size}</td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #ddd; text-align: center; color: #000;">${d.color}</td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #ddd; text-align: center; color: #000;">${d.clarity}</td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #ddd; text-align: center; color: #000;">${d.cut}</td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #ddd; text-align: right; color: #000; font-weight: 600;">${d.priceFormatted}</td>
          </tr>
        `).join('');

        // Owner Email HTML - Enterprise Design
        const ownerEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="900" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e0e0e0;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e0e0e0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 20px; color: #1a1a1a; font-weight: 600;">New Diamond Inquiry</h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666666;">Inquiry ID: ${Date.now()} | ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} | ${diamonds.length} Item${diamonds.length > 1 ? 's' : ''}</p>
                  </td>
                  <td align="right">
                    <div style="background-color: #f5f5f5; padding: 8px 16px; border-radius: 4px;">
                      <p style="margin: 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Total Value</p>
                      <p style="margin: 4px 0 0 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">${totalValueFormatted}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Customer Information -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Customer Information</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e0e0e0;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; width: 140px; font-size: 13px; color: #666666;">Name</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${customer.name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666666;">Email</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 14px;"><a href="mailto:${customer.email}" style="color: #0066cc; text-decoration: none;">${customer.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #666666;">Phone</td>
                  <td style="padding: 12px 16px; font-size: 14px;"><a href="tel:${customer.phone}" style="color: #0066cc; text-decoration: none;">${customer.phone}</a></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Diamond Details -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Diamond Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; font-size: 13px;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 40px;">#</th>
                    <th style="padding: 12px 10px; text-align: left; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">Stock / Description</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 80px;">Shape</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 70px;">Carat</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 80px;">Color</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 80px;">Clarity</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 70px;">Cut</th>
                    <th style="padding: 12px 10px; text-align: right; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 110px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${diamonds.map(d => `
                  <tr>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #666666; font-weight: 500;">${d.index}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; color: #1a1a1a;">
                      <div style="font-weight: 600; margin-bottom: 2px;">${d.sku}</div>
                      <div style="font-size: 12px; color: #666666;">${d.name}</div>
                      ${d.lab ? `<div style="font-size: 11px; color: #999999; margin-top: 2px;">${d.lab}${d.cert_num ? ` #${d.cert_num}` : ''}</div>` : ''}
                      <a href="${storeUrl}/pages/diamonds?id=${d.diamond_id}&view=diamond-product" style="font-size: 12px; color: #0066cc; text-decoration: none; display: inline-block; margin-top: 4px;" target="_blank">View details →</a>
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #1a1a1a;">${d.shape}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #1a1a1a; font-weight: 500;">${d.size}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #1a1a1a;">${d.color}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #1a1a1a;">${d.clarity}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #1a1a1a;">${d.cut}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #1a1a1a; font-weight: 500;">${d.priceFormatted}</td>
                  </tr>
                  `).join('')}
                  <tr style="background-color: #f5f5f5;">
                    <td colspan="7" style="padding: 14px 10px; text-align: right; font-weight: 600; color: #1a1a1a; font-size: 14px;">Total Value</td>
                    <td style="padding: 14px 10px; text-align: right; font-weight: 600; color: #1a1a1a; font-size: 16px;">${totalValueFormatted}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          ${message ? `
          <!-- Customer Message -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Customer Message</h2>
              <div style="padding: 16px; background-color: #f9f9f9; border-left: 3px solid #0066cc; font-size: 14px; color: #1a1a1a; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px; border-top: 1px solid #e0e0e0; margin-top: 32px;">
              <p style="margin: 0; font-size: 13px; color: #666666;">This inquiry was submitted via ${brandName}. Please respond within 24 hours.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        // Customer Email HTML - Diamond table rows
        const customerDiamondRows = diamonds.map(d => `
          <tr>
            <td style="padding: 14px 10px; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #d5dae0; background-color: #fafafa;">${d.index}</td>
            <td style="padding: 14px 10px; color: #1a1a1a; border-bottom: 1px solid #d5dae0; background-color: #fafafa;">${d.name}</td>
            <td style="padding: 14px 10px; text-align: center; color: #1a1a1a; border-bottom: 1px solid #d5dae0; background-color: #fafafa;">${d.shape}</td>
            <td style="padding: 14px 10px; text-align: center; color: #1a1a1a; border-bottom: 1px solid #d5dae0; background-color: #fafafa;">${d.size}</td>
            <td style="padding: 14px 10px; text-align: center; color: #1a1a1a; border-bottom: 1px solid #d5dae0; background-color: #fafafa;">${d.color}-${d.clarity}</td>
            <td style="padding: 14px 10px; text-align: right; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #d5dae0; background-color: #fafafa;">${d.priceFormatted}</td>
          </tr>
        `).join('');

        // Customer Email HTML - Enterprise Design
        const customerEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e0e0e0;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #e0e0e0; text-align: center;">
              ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-width: 140px; height: auto; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;">` : ''}
              <h1 style="margin: 0; font-size: 20px; color: #1a1a1a; font-weight: 600;">Thank You for Your Inquiry</h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #666666;">Inquiry received on ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 14px;">Dear <strong>${customer.name}</strong>,</p>
              <p style="color: #1a1a1a; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">Thank you for your interest in our diamond collection. We have received your inquiry for ${diamonds.length} diamond${diamonds.length > 1 ? 's' : ''} and our team will contact you shortly.</p>
              
              <!-- Selected Diamonds -->
              <h2 style="margin: 0 0 16px 0; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Selected Diamonds (${diamonds.length} Item${diamonds.length > 1 ? 's' : ''})</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e0e0e0; font-size: 13px; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 40px;">#</th>
                    <th style="padding: 12px 10px; text-align: left; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">Diamond</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 80px;">Shape</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 70px;">Carat</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 90px;">Grade</th>
                    <th style="padding: 12px 10px; text-align: right; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; width: 110px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${diamonds.map(d => `
                  <tr>
                    <td style="padding: 12px 10px; font-weight: 500; color: #666666; border-bottom: 1px solid #e0e0e0; text-align: center;">${d.index}</td>
                    <td style="padding: 12px 10px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${d.name}</td>
                    <td style="padding: 12px 10px; text-align: center; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${d.shape}</td>
                    <td style="padding: 12px 10px; text-align: center; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; font-weight: 500;">${d.size}</td>
                    <td style="padding: 12px 10px; text-align: center; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${d.color}-${d.clarity}</td>
                    <td style="padding: 12px 10px; text-align: right; font-weight: 500; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${d.priceFormatted}</td>
                  </tr>
                  `).join('')}
                  <tr style="background-color: #f5f5f5;">
                    <td colspan="5" style="padding: 14px 10px; text-align: right; font-weight: 600; color: #1a1a1a; font-size: 14px;">Total Value</td>
                    <td style="padding: 14px 10px; text-align: right; font-weight: 600; color: #1a1a1a; font-size: 16px;">${totalValueFormatted}</td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Response Time Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #fffbf0; border: 1px solid #f0e5d0; padding: 16px; font-size: 13px; color: #1a1a1a; line-height: 1.6;">
                    <strong>Response Time:</strong> Our diamond specialist will review your inquiry and contact you within 24 hours.
                  </td>
                </tr>
              </table>
              
              <p style="color: #1a1a1a; margin: 24px 0 0 0; font-size: 14px;">For immediate assistance, please feel free to contact us directly.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #1a1a1a; font-weight: 600;">Best regards,</p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #1a1a1a;">${brandName} Team</p>
              <p style="margin: 0; font-size: 13px; color: #666666;">
                <a href="${storeUrl}" style="color: #0066cc; text-decoration: none;">${storeUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
                    subject: `New Diamond Inquiry - ${diamonds.length} Diamond${diamonds.length > 1 ? 's' : ''} (${totalValueFormatted})`,
                    html: ownerEmailHTML
                });
                console.log('Owner wishlist email sent successfully');

                // Send confirmation email to customer
                await emailTransporter.sendMail({
                    from: `"Diamond Store" <${fromEmail}>`,
                    to: customer.email,
                    subject: `Thank You for Your Diamond Inquiry - ${diamonds.length} Diamond${diamonds.length > 1 ? 's' : ''}`,
                    html: customerEmailHTML
                });
                console.log('Customer wishlist email sent successfully');

                res.json({
                    success: true,
                    message: 'Inquiry sent successfully. You will receive a confirmation email shortly.',
                    emailSent: true
                });
            } catch (emailError) {
                console.error('Error sending wishlist email:', emailError);
                res.json({
                    success: true,
                    message: 'Inquiry received but email notification failed. We will contact you soon.',
                    emailSent: false,
                    emailError: emailError.message
                });
            }
        } else {
            console.log('Email not configured, wishlist inquiry logged only');
            res.json({
                success: true,
                message: 'Inquiry received successfully. We will contact you soon.',
                emailSent: false,
                note: 'Email service not configured'
            });
        }

    } catch (error) {
        console.error('Error processing wishlist inquiry:', error);
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
    console.log('- CLIENT_ID:', process.env.CLIENT_ID ? 'Set ?' : 'Missing ?');
    console.log('- CLIENT_SECRET:', process.env.CLIENT_SECRET ? 'Set ?' : 'Missing ?');
    console.log('- PORT:', PORT);
    console.log('\nAPI Endpoints:');
    console.log('- POST /api/diamonds/search');
    console.log('- GET  /api/health');
});

