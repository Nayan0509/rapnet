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
<body class="email-body" style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Simple Header -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; background-color: ${brandColor};">
              ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-width: 100px; height: auto;">` : `<div style="font-size: 24px; font-weight: 600; color: #ffffff;">${brandName}</div>`}
              <div style="font-size: 32px; margin-top: 8px;">💎</div>
            </td>
          </tr>
          
          <!-- Customer Info -->
          <tr>
            <td style="padding: 32px;">
              <h2 class="text-primary" style="margin: 0 0 16px 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">Customer Information</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="border-color" style="border: 1px solid #e0e0e0; border-radius: 4px;">
                <tr>
                  <td class="text-secondary border-color" style="padding: 12px 16px; font-size: 13px; color: #666666; border-bottom: 1px solid #e0e0e0; width: 30%;">Name</td>
                  <td class="text-primary border-color" style="padding: 12px 16px; font-size: 14px; color: #1a1a1a; font-weight: 500; border-bottom: 1px solid #e0e0e0;">${customer.name}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 12px 16px; font-size: 13px; color: #666666; border-bottom: 1px solid #e0e0e0;">Email</td>
                  <td class="border-color" style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e0e0e0;"><a href="mailto:${customer.email}" class="link-color" style="color: ${brandColor}; text-decoration: none;">${customer.email}</a></td>
                </tr>
                <tr>
                  <td class="text-secondary" style="padding: 12px 16px; font-size: 13px; color: #666666;">Phone</td>
                  <td style="padding: 12px 16px; font-size: 14px;"><a href="tel:${customer.phone}" class="link-color" style="color: ${brandColor}; text-decoration: none;">${customer.phone}</a></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Diamond Details -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h2 class="text-primary" style="margin: 0 0 16px 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">Diamond Details</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="border-color" style="border: 1px solid #e0e0e0; border-radius: 4px;">
                <thead>
                  <tr class="bg-light" style="background-color: #f8f8f8;">
                    <th class="text-secondary border-color" style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #666666; border-bottom: 1px solid #e0e0e0;">Diamond</th>
                    <th class="text-secondary border-color" style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #666666; border-bottom: 1px solid #e0e0e0;">Shape</th>
                    <th class="text-secondary border-color" style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #666666; border-bottom: 1px solid #e0e0e0;">Carat</th>
                    <th class="text-secondary border-color" style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #666666; border-bottom: 1px solid #e0e0e0;">Color</th>
                    <th class="text-secondary border-color" style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #666666; border-bottom: 1px solid #e0e0e0;">Clarity</th>
                    <th class="text-secondary border-color" style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #666666; border-bottom: 1px solid #e0e0e0;">Cut</th>
                    <th class="text-secondary border-color" style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #666666; border-bottom: 1px solid #e0e0e0;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-primary border-color" style="padding: 14px 12px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">
                      <a href="${diamondViewUrl}" class="link-color" style="color: ${brandColor}; text-decoration: none; font-weight: 500;" target="_blank">${diamond.name}</a>
                      ${diamond.lab ? `<div class="text-secondary" style="font-size: 11px; color: #999999; margin-top: 2px;">${diamond.lab}${diamond.cert_num ? ` #${diamond.cert_num}` : ''}</div>` : ''}
                    </td>
                    <td class="text-primary border-color" style="padding: 14px 12px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.shape || 'N/A'}</td>
                    <td class="text-primary border-color" style="padding: 14px 12px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.size || 'N/A'}</td>
                    <td class="text-primary border-color" style="padding: 14px 12px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.color || 'N/A'}</td>
                    <td class="text-primary border-color" style="padding: 14px 12px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.clarity || 'N/A'}</td>
                    <td class="text-primary border-color" style="padding: 14px 12px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.cut || 'N/A'}</td>
                    <td class="text-primary border-color" style="padding: 14px 12px; text-align: right; font-size: 14px; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.priceFormatted}</td>
                  </tr>
                  <tr class="bg-light" style="background-color: #f8f8f8;">
                    <td colspan="6" class="text-primary" style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color: #1a1a1a;">Total</td>
                    <td class="text-primary" style="padding: 12px; text-align: right; font-size: 15px; font-weight: 700; color: #1a1a1a;">${totalPriceFormatted}</td>
                  </tr>
                </tbody>
              </table>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="${diamondViewUrl}" style="display: inline-block; padding: 12px 28px; background-color: ${brandColor}; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px;" target="_blank">View Full Details</a>
              </div>
            </td>
          </tr>
          
          ${message ? `
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h2 class="text-primary" style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">Customer Message</h2>
              <div class="bg-light text-primary" style="padding: 14px; background-color: #f8f8f8; border-left: 3px solid ${brandColor}; border-radius: 4px; font-size: 14px; color: #1a1a1a; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          ` : ''}
          
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="background-color: #fffbf0; border: 1px solid #f0e5d0; border-radius: 4px; padding: 14px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #856404;">⏰ Please respond within 24 hours</p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td class="bg-light border-color" style="padding: 20px 32px; background-color: #f8f8f8; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">${brandName}</p>
              <p style="margin: 0; font-size: 13px; color: #666666;"><a href="${storeUrl}" class="link-color" style="color: ${brandColor}; text-decoration: none;">${storeUrl}</a></p>
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
<body class="email-body" style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Simple Header -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; background-color: ${brandColor};">
              ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-width: 100px; height: auto;">` : `<div style="font-size: 24px; font-weight: 600; color: #ffffff;">${brandName}</div>`}
              <div style="font-size: 32px; margin-top: 8px;">💎</div>
              <h1 style="margin: 12px 0 0 0; font-size: 18px; color: #ffffff; font-weight: 600;">Thank You for Your Inquiry</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px;">
              <p class="text-primary" style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 14px;">Dear <strong>${customer.name}</strong>,</p>
              <p class="text-primary" style="color: #1a1a1a; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">Thank you for your interest in our diamond collection. We have received your inquiry and our team will contact you shortly.</p>
              
              <h2 class="text-primary" style="margin: 0 0 16px 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">Your Inquiry Details</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="border-color" style="border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 20px;">
                <tr>
                  <td class="text-secondary border-color" style="padding: 12px 16px; font-size: 13px; color: #666666; border-bottom: 1px solid #e0e0e0; width: 30%;">Stock Number</td>
                  <td class="text-primary border-color" style="padding: 12px 16px; font-size: 14px; color: #1a1a1a; font-weight: 600; border-bottom: 1px solid #e0e0e0;">${diamond.sku}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 12px 16px; font-size: 13px; color: #666666; border-bottom: 1px solid #e0e0e0;">Description</td>
                  <td class="text-primary border-color" style="padding: 12px 16px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.name}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 12px 16px; font-size: 13px; color: #666666; border-bottom: 1px solid #e0e0e0;">Shape</td>
                  <td class="text-primary border-color" style="padding: 12px 16px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.shape || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 12px 16px; font-size: 13px; color: #666666; border-bottom: 1px solid #e0e0e0;">Carat</td>
                  <td class="text-primary border-color" style="padding: 12px 16px; font-size: 14px; color: #1a1a1a; font-weight: 500; border-bottom: 1px solid #e0e0e0;">${diamond.size || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 12px 16px; font-size: 13px; color: #666666; border-bottom: 1px solid #e0e0e0;">Color / Clarity</td>
                  <td class="text-primary border-color" style="padding: 12px 16px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.color || 'N/A'} / ${diamond.clarity || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-secondary border-color" style="padding: 12px 16px; font-size: 13px; color: #666666; border-bottom: 1px solid #e0e0e0;">Cut</td>
                  <td class="text-primary border-color" style="padding: 12px 16px; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e0e0e0;">${diamond.cut || 'N/A'}</td>
                </tr>
                <tr class="bg-light" style="background-color: #f8f8f8;">
                  <td class="text-primary" style="padding: 12px 16px; font-size: 14px; color: #1a1a1a; font-weight: 600;">Price</td>
                  <td class="text-primary" style="padding: 12px 16px; font-size: 15px; color: #1a1a1a; font-weight: 700;">${diamond.priceFormatted}</td>
                </tr>
              </table>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="${diamondViewUrl}" style="display: inline-block; padding: 12px 28px; background-color: ${brandColor}; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px;" target="_blank">View Full Details</a>
              </div>
              
              <div style="background-color: #fffbf0; border: 1px solid #f0e5d0; border-radius: 4px; padding: 14px; margin: 24px 0;">
                <p style="margin: 0; font-size: 13px; color: #856404; text-align: center;">⏰ Our diamond specialist will contact you within 24 hours</p>
              </div>
              
              <p class="text-primary" style="color: #1a1a1a; margin: 20px 0 0 0; font-size: 14px;">For immediate assistance, please feel free to contact us directly.</p>
            </td>
          </tr>
          
          <tr>
            <td class="bg-light border-color" style="padding: 20px 32px; background-color: #f8f8f8; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #1a1a1a; font-weight: 600;">Best regards,</p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #1a1a1a;">${brandName} Team</p>
              <p style="margin: 0; font-size: 13px; color: #666666;"><a href="${storeUrl}" class="link-color" style="color: ${brandColor}; text-decoration: none;">${storeUrl}</a></p>
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
