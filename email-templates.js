// Modern Email Templates with Dark Mode Support for Diamond Inquiry System

function generateOwnerEmail({ customer, diamond, quantity, totalPriceFormatted, message, brandName, brandLogo, brandColor, storeUrl, diamondViewUrl }) {
    const inquiryId = Date.now();
    const inquiryDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <style>
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a1a1a !important; }
      .email-container { background-color: #2d2d2d !important; }
      .text-primary { color: #ffffff !important; }
      .text-secondary { color: #b0b0b0 !important; }
      .section-bg { background-color: #3a3a3a !important; }
      .border-color { border-color: #404040 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="700" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #ffffff;">
              ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-height: 50px; width: auto;">` : `<div style="font-size: 24px; font-weight: 600; color: ${brandColor};">${brandName}</div>`}
              <div style="font-size: 40px; margin: 10px 0;">💎</div>
            </td>
          </tr>

          <!-- Title Section -->
          <tr>
            <td style="padding: 25px 40px; background-color: #fafafa; border-bottom: 1px solid #e8e8e8;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">New Diamond Inquiry</h1>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #666666;">Inquiry ID: ${inquiryId} | ${inquiryDate} | 1 Item</p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <div style="text-align: right;">
                      <p style="margin: 0; font-size: 11px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL VALUE</p>
                      <p style="margin: 3px 0 0 0; font-size: 20px; font-weight: 700; color: #1a1a1a;">${totalPriceFormatted}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Information Section -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">
                <span style="color: #4A90E2; margin-right: 8px;">👤</span>Customer Information
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border-radius: 6px;">
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e8e8e8; width: 35%;">
                    <span style="font-size: 13px; color: #666666;">Name</span>
                  </td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e8e8e8;">
                    <span style="font-size: 14px; color: #1a1a1a; font-weight: 500;">${customer.name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e8e8e8;">
                    <span style="font-size: 13px; color: #666666;">Email Address</span>
                  </td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e8e8e8;">
                    <a href="mailto:${customer.email}" style="font-size: 14px; color: #4A90E2; text-decoration: none;">${customer.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px;">
                    <span style="font-size: 13px; color: #666666;">Phone Number</span>
                  </td>
                  <td style="padding: 15px 20px;">
                    <a href="tel:${customer.phone}" style="font-size: 14px; color: #4A90E2; text-decoration: none;">${customer.phone}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Diamond Details Section -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h2 style="margin: 0 0 15px 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">
                <span style="color: #4A90E2; margin-right: 8px;">💎</span>Diamond Details
              </h2>
              <p style="margin: 0 0 15px 0; font-size: 12px; color: #f39c12; background-color: #fff9e6; padding: 10px 15px; border-radius: 4px; border-left: 3px solid #f39c12;">
                💡 Tip: Click on diamond names to view complete details on your website
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #fafafa;">
                    <th style="padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8; width: 5%;">#</th>
                    <th style="padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Diamond (Click to View)</th>
                    <th style="padding: 12px 15px; text-align: center; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">SKU / Stock #</th>
                    <th style="padding: 12px 15px; text-align: center; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Shape</th>
                    <th style="padding: 12px 15px; text-align: center; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Carat</th>
                    <th style="padding: 12px 15px; text-align: center; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Color</th>
                    <th style="padding: 12px 15px; text-align: center; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Clarity</th>
                    <th style="padding: 12px 15px; text-align: center; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Cut</th>
                    <th style="padding: 12px 15px; text-align: right; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 15px; text-align: center; font-size: 14px; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">1</td>
                    <td style="padding: 15px; border-bottom: 1px solid #e8e8e8;">
                      <a href="${diamondViewUrl}" style="color: #4A90E2; text-decoration: underline; font-weight: 500; font-size: 13px;" target="_blank">${diamond.name}</a>
                      ${diamond.lab ? `<div style="font-size: 11px; color: #999999; margin-top: 3px;">Certificate: ${diamond.lab}${diamond.cert_num ? ` #${diamond.cert_num}` : ''}</div>` : ''}
                    </td>
                    <td style="padding: 15px; text-align: center; font-size: 13px; color: #1a1a1a; font-weight: 600; border-bottom: 1px solid #e8e8e8;">${diamond.sku || 'N/A'}</td>
                    <td style="padding: 15px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">${diamond.shape || 'N/A'}</td>
                    <td style="padding: 15px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">${diamond.size || 'N/A'}</td>
                    <td style="padding: 15px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">${diamond.color || 'N/A'}</td>
                    <td style="padding: 15px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">${diamond.clarity || 'N/A'}</td>
                    <td style="padding: 15px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">${diamond.cut || 'N/A'}</td>
                    <td style="padding: 15px; text-align: right; font-size: 14px; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">${diamond.priceFormatted}</td>
                  </tr>
                  <tr style="background-color: #fafafa;">
                    <td colspan="8" style="padding: 15px; text-align: right; font-size: 13px; font-weight: 600; color: #1a1a1a;">Total Value</td>
                    <td style="padding: 15px; text-align: right; font-size: 16px; font-weight: 700; color: #1a1a1a;">${totalPriceFormatted}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          ${message ? `
          <!-- Customer Message -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h2 style="margin: 0 0 15px 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">
                <span style="color: #4A90E2; margin-right: 8px;">💬</span>Customer Message
              </h2>
              <div style="padding: 15px 20px; background-color: #fafafa; border-left: 3px solid ${brandColor}; border-radius: 4px; font-size: 13px; color: #1a1a1a; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Response Notice -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="background-color: #fff9e6; border: 1px solid #f39c12; border-radius: 6px; padding: 15px 20px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #856404;">⏰ Please respond to this inquiry within 24 hours</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #fafafa; text-align: center; border-top: 1px solid #e8e8e8;">
              <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">${brandName}</p>
              <p style="margin: 0; font-size: 13px;"><a href="${storeUrl}" style="color: #4A90E2; text-decoration: none;">${storeUrl}</a></p>
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
  <style>
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a1a1a !important; }
      .email-container { background-color: #2d2d2d !important; }
      .text-primary { color: #ffffff !important; }
      .text-secondary { color: #b0b0b0 !important; }
      .section-bg { background-color: #3a3a3a !important; }
      .border-color { border-color: #404040 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="700" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header with Logo and Diamond Icon -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; text-align: center; background-color: #ffffff;">
              ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-height: 50px; width: auto;">` : `<div style="font-size: 24px; font-weight: 600; color: ${brandColor};">${brandName}</div>`}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px 40px; text-align: center; background-color: #ffffff;">
              <div style="font-size: 40px; margin: 0;">💎</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #1a1a1a;">Dear <strong>${customer.name}</strong>,</p>
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #666666; line-height: 1.6;">Thank you for your interest in our diamonds. We have received your inquiry for <strong>1 diamond</strong> and our team will get back to you shortly.</p>
              
              <!-- Your Selected Diamonds -->
              <h2 style="margin: 0 0 20px 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">
                <span style="color: #4A90E2; margin-right: 8px;">💎</span>Your Selected Diamonds
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden; margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: #fafafa;">
                    <th style="padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8; width: 5%;">#</th>
                    <th style="padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Diamond</th>
                    <th style="padding: 12px 15px; text-align: center; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Shape</th>
                    <th style="padding: 12px 15px; text-align: center; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Carat</th>
                    <th style="padding: 12px 15px; text-align: center; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Grade</th>
                    <th style="padding: 12px 15px; text-align: right; font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; border-bottom: 1px solid #e8e8e8;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 15px; text-align: center; font-size: 14px; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">1</td>
                    <td style="padding: 15px; border-bottom: 1px solid #e8e8e8;">
                      <a href="${diamondViewUrl}" style="color: #4A90E2; text-decoration: none; font-weight: 500; font-size: 13px;" target="_blank">${diamond.name}</a>
                      ${diamond.lab ? `<div style="font-size: 11px; color: #999999; margin-top: 3px;">Certificate: ${diamond.lab}${diamond.cert_num ? ` #${diamond.cert_num}` : ''}</div>` : ''}
                    </td>
                    <td style="padding: 15px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">${diamond.shape || 'N/A'}</td>
                    <td style="padding: 15px; text-align: center; font-size: 13px; color: #1a1a1a; font-weight: 600; border-bottom: 1px solid #e8e8e8;">${diamond.size || 'N/A'}</td>
                    <td style="padding: 15px; text-align: center; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #e8e8e8;">${diamond.color || 'N/A'}-${diamond.clarity || 'N/A'}</td>
                    <td style="padding: 15px; text-align: right; font-size: 14px; font-weight: 600; color: #f39c12; border-bottom: 1px solid #e8e8e8;">${diamond.priceFormatted}</td>
                  </tr>
                  <tr style="background-color: #fafafa;">
                    <td colspan="5" style="padding: 15px; text-align: right; font-size: 13px; font-weight: 700; color: #1a1a1a; text-transform: uppercase;">TOTAL VALUE:</td>
                    <td style="padding: 15px; text-align: right; font-size: 16px; font-weight: 700; color: #1a1a1a;">${totalPriceFormatted}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Yellow Alert Box -->
              <div style="background-color: #fff9e6; border: 1px solid #f39c12; border-radius: 6px; padding: 15px 20px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 13px; color: #856404; line-height: 1.6;">
                  We will review your inquiry and contact you within <strong>24 hours</strong>.
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">If you have any urgent questions, please feel free to contact us directly.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #fafafa; text-align: center; border-top: 1px solid #e8e8e8;">
              <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">Best regards,</p>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #1a1a1a;">${brandName} Team</p>
              <p style="margin: 0; font-size: 13px;"><a href="${storeUrl}" style="color: #4A90E2; text-decoration: none;">${storeUrl}</a></p>
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
