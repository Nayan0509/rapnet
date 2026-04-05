// Modern Email Templates with Dark Mode Support for Diamond Inquiry System

function generateOwnerEmail({ customer, diamond, quantity, totalPriceFormatted, message, brandName, brandLogo, brandColor, storeUrl, diamondViewUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a1a1a !important; }
      .email-container { background-color: #2d2d2d !important; }
      .text-primary { color: #ffffff !important; }
      .text-secondary { color: #b0b0b0 !important; }
      .bg-light { background-color: #3a3a3a !important; }
      .border-color { border-color: #404040 !important; }
      .link-color { color: #6ba3ff !important; }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px; text-align: center; background: linear-gradient(135deg, ${brandColor} 0%, #334fb4 100%);">
              ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-width: 120px; height: auto; margin-bottom: 16px;">` : `<div style="font-size: 28px; font-weight: 700; color: #ffffff;">${brandName}</div>`}
              <div style="width: 48px; height: 48px; margin: 12px auto; background: rgba(255,255,255,0.2); border-radius: 50%; line-height: 48px; font-size: 24px;">💎</div>
            </td>
          </tr>
          
          <!-- Customer Info -->
          <tr>
            <td style="padding: 32px;">
              <div style="margin-bottom: 20px;">
                <span style="font-size: 18px; margin-right: 8px;">👤</span>
                <strong class="text-primary" style="font-size: 16px; color: #1a1a1a;">Customer Information</strong>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-light" style="background-color: #f8f9fa; border-radius: 8px;">
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef; width: 35%;">Name</td>
                  <td class="text-primary border-color" style="padding: 14px 20px; font-size: 14px; color: #1a1a1a; font-weight: 500; border-bottom: 1px solid #e9ecef;">${customer.name}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef;">Email Address</td>
                  <td class="border-color" style="padding: 14px 20px; font-size: 14px; border-bottom: 1px solid #e9ecef;"><a href="mailto:${customer.email}" class="link-color" style="color: #0066cc; text-decoration: none;">${customer.email}</a></td>
                </tr>
                <tr>
                  <td class="text-secondary" style="padding: 14px 20px; font-size: 13px; color: #6c757d;">Phone Number</td>
                  <td style="padding: 14px 20px; font-size: 14px;"><a href="tel:${customer.phone}" class="link-color" style="color: #0066cc; text-decoration: none;">${customer.phone}</a></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Diamond Details -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="margin-bottom: 16px;">
                <span style="font-size: 18px; margin-right: 8px;">💎</span>
                <strong class="text-primary" style="font-size: 16px; color: #1a1a1a;">Diamond Details</strong>
              </div>
              <p class="text-secondary" style="margin: 0 0 16px 0; font-size: 13px; color: #6c757d;">💡 Tip: Click on diamond names to view complete details on your website</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="border-color" style="border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr class="bg-light">
                    <th class="text-secondary" style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e9ecef; width: 8%;">#</th>
                    <th class="text-secondary" style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e9ecef;">Diamond (Click to View)</th>
                    <th class="text-secondary" style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e9ecef;">Shape</th>
                    <th class="text-secondary" style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e9ecef;">Carat</th>
                    <th class="text-secondary" style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e9ecef;">Color</th>
                    <th class="text-secondary" style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e9ecef;">Clarity</th>
                    <th class="text-secondary" style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e9ecef;">Cut</th>
                    <th class="text-secondary" style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e9ecef;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-primary" style="padding: 16px; text-align: center; font-size: 14px; font-weight: 600; color: #1a1a1a;">1</td>
                    <td style="padding: 16px;">
                      <a href="${diamondViewUrl}" class="link-color" style="color: #0066cc; text-decoration: none; font-weight: 500; font-size: 14px;" target="_blank">${diamond.name}</a>
                      ${diamond.lab ? `<div class="text-secondary" style="font-size: 12px; color: #6c757d; margin-top: 4px;">Certificate: ${diamond.lab}</div>` : ''}
                    </td>
                    <td class="text-primary" style="padding: 16px; text-align: center; font-size: 14px; color: #1a1a1a;">${diamond.shape || 'N/A'}</td>
                    <td class="text-primary" style="padding: 16px; text-align: center; font-size: 14px; color: #1a1a1a;">${diamond.size || 'N/A'}</td>
                    <td class="text-primary" style="padding: 16px; text-align: center; font-size: 14px; color: #1a1a1a;">${diamond.color || 'N/A'}</td>
                    <td class="text-primary" style="padding: 16px; text-align: center; font-size: 14px; color: #1a1a1a;">${diamond.clarity || 'N/A'}</td>
                    <td class="text-primary" style="padding: 16px; text-align: center; font-size: 14px; color: #1a1a1a;">${diamond.cut || 'N/A'}</td>
                    <td class="text-primary" style="padding: 16px; text-align: right; font-size: 14px; font-weight: 600; color: #1a1a1a;">${diamond.priceFormatted}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-light">
                    <td colspan="7" class="text-primary" style="padding: 16px; text-align: right; font-size: 14px; font-weight: 600; color: #1a1a1a;">TOTAL INQUIRY VALUE</td>
                    <td class="text-primary" style="padding: 16px; text-align: right; font-size: 16px; font-weight: 700; color: #1a1a1a;">${totalPriceFormatted}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>
          
          ${message ? `
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 18px; margin-right: 8px;">💬</span>
                <strong class="text-primary" style="font-size: 16px; color: #1a1a1a;">Customer Message</strong>
              </div>
              <div class="bg-light text-primary" style="padding: 16px; background-color: #f8f9fa; border-left: 3px solid ${brandColor}; border-radius: 4px; font-size: 14px; color: #1a1a1a; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          ` : ''}
          
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #856404;">⏰ <strong>Please respond to this inquiry within 24 hours</strong></p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td class="bg-light" style="padding: 24px 32px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">${brandName}</p>
              <p style="margin: 0; font-size: 13px; color: #6c757d;"><a href="${storeUrl}" class="link-color" style="color: #0066cc; text-decoration: none;">${storeUrl}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateCustomerEmail({ customer, diamond, quantity, totalPriceFormatted, brandName, brandLogo, brandColor, storeUrl, diamondViewUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a1a1a !important; }
      .email-container { background-color: #2d2d2d !important; }
      .text-primary { color: #ffffff !important; }
      .text-secondary { color: #b0b0b0 !important; }
      .bg-light { background-color: #3a3a3a !important; }
      .border-color { border-color: #404040 !important; }
      .link-color { color: #6ba3ff !important; }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <tr>
            <td style="padding: 32px; text-align: center; background: linear-gradient(135deg, ${brandColor} 0%, #334fb4 100%);">
              ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-width: 120px; height: auto; margin-bottom: 16px;">` : `<div style="font-size: 28px; font-weight: 700; color: #ffffff;">${brandName}</div>`}
              <div style="width: 48px; height: 48px; margin: 12px auto; background: rgba(255,255,255,0.2); border-radius: 50%; line-height: 48px; font-size: 24px;">💎</div>
              <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 600;">Thank You for Your Inquiry</h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">Inquiry received on ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px;">
              <p class="text-primary" style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 15px;">Dear <strong>${customer.name}</strong>,</p>
              <p class="text-primary" style="color: #1a1a1a; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">Thank you for your interest in our diamond collection. We have received your inquiry and our team will contact you shortly.</p>
              
              <div style="margin-bottom: 16px;">
                <span style="font-size: 18px; margin-right: 8px;">💎</span>
                <strong class="text-primary" style="font-size: 16px; color: #1a1a1a;">Your Inquiry Details</strong>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="border-color" style="border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef; width: 35%;">Stock Number</td>
                  <td class="text-primary border-color" style="padding: 14px 20px; font-size: 14px; color: #1a1a1a; font-weight: 600; border-bottom: 1px solid #e9ecef;">${diamond.sku}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef;">Description</td>
                  <td class="text-primary border-color" style="padding: 14px 20px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e9ecef;">${diamond.name}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef;">Shape</td>
                  <td class="text-primary border-color" style="padding: 14px 20px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e9ecef;">${diamond.shape || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef;">Carat</td>
                  <td class="text-primary border-color" style="padding: 14px 20px; font-size: 14px; color: #1a1a1a; font-weight: 500; border-bottom: 1px solid #e9ecef;">${diamond.size || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef;">Color / Clarity</td>
                  <td class="text-primary border-color" style="padding: 14px 20px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e9ecef;">${diamond.color || 'N/A'} / ${diamond.clarity || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef;">Cut</td>
                  <td class="text-primary border-color" style="padding: 14px 20px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e9ecef;">${diamond.cut || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef;">Unit Price</td>
                  <td class="text-primary border-color" style="padding: 14px 20px; font-size: 14px; color: #1a1a1a; font-weight: 500; border-bottom: 1px solid #e9ecef;">${diamond.priceFormatted}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 14px 20px; font-size: 13px; color: #6c757d; border-bottom: 1px solid #e9ecef;">Quantity</td>
                  <td class="text-primary border-color" style="padding: 14px 20px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e9ecef;">${quantity}</td>
                </tr>
                <tr class="bg-light">
                  <td class="text-primary" style="padding: 16px 20px; font-size: 14px; color: #1a1a1a; font-weight: 600;">Total Value</td>
                  <td class="text-primary" style="padding: 16px 20px; font-size: 16px; color: #1a1a1a; font-weight: 700;">${totalPriceFormatted}</td>
                </tr>
              </table>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="${diamondViewUrl}" style="display: inline-block; padding: 14px 32px; background: ${brandColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;" target="_blank">View Full Details</a>
              </div>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404; text-align: center;">⏰ <strong>Response Time:</strong> Our diamond specialist will review your inquiry and contact you within 24 hours.</p>
              </div>
              
              <p class="text-primary" style="color: #1a1a1a; margin: 24px 0 0 0; font-size: 14px;">For immediate assistance, please feel free to contact us directly.</p>
            </td>
          </tr>
          
          <tr>
            <td class="bg-light" style="padding: 24px 32px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">Best regards,</p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #1a1a1a;">${brandName} Team</p>
              <p style="margin: 0; font-size: 13px; color: #6c757d;"><a href="${storeUrl}" class="link-color" style="color: #0066cc; text-decoration: none;">${storeUrl}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = {
  generateOwnerEmail,
  generateCustomerEmail
};
