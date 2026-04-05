/**
 * Diamond Product Detail Page
 * Works with Shopify's product-form.js and product-info.js
 */

(function() {
  'use strict';

  const CURRENCY = 'Rs.';
  // Your backend server URL - update this to your actual backend URL
  const BACKEND_URL = window.DIAMOND_BACKEND_URL || 'https://rapnet.vercel.app';
  const CREATE_PRODUCT_ENDPOINT = `${BACKEND_URL}/apps/diamond/createProduct`;
  
  /**
   * Calculate diamond score based on grading attributes
   * Uses updated grading tables from diamond-grading-tables.js
   * - ROUND diamonds: includes Cut grade - requires cut data
   * - FANCY shapes: no Cut grade
   * Uses individual colors and clarities (no category mapping)
   */
  function calculateDiamondScore(diamond) {
    // Normalize shape
    const shape = (diamond.shape || '').toUpperCase();
    const isRound = shape === 'ROUND' || shape === 'RD' || shape.includes('ROUND');
    
    // Use individual color (no category mapping)
    const color = (diamond.color || '').toUpperCase();

    // Use individual clarity (no category mapping)
    const clarity = (diamond.clarity || '').toUpperCase();

    // Normalize symmetry
    const symmetry = diamond.symmetry || 'N/A';
    let symmetryCategory = 'N/A';
    if (symmetry.includes('Excellent') || symmetry === 'EX') symmetryCategory = 'EX';
    else if (symmetry.includes('Very Good') || symmetry === 'VG') symmetryCategory = 'VG';
    else if (symmetry.includes('Good') || symmetry === 'GOOD' || symmetry === 'G') symmetryCategory = 'GOOD';
    else symmetryCategory = 'POOR';

    // Normalize polish
    const polish = diamond.polish || 'N/A';
    let polishCategory = 'N/A';
    if (polish.includes('Excellent') || polish === 'EX') polishCategory = 'EX';
    else if (polish.includes('Very Good') || polish === 'VG') polishCategory = 'VG';
    else if (polish.includes('Good') || polish === 'GOOD' || polish === 'G') polishCategory = 'GOOD';
    else polishCategory = 'POOR';

    // Normalize fluorescence
    const fluor = diamond.fluor_intensity || 'None';
    let fluorCategory = 'NONE';
    if (fluor.includes('None') || fluor === 'NON') fluorCategory = 'NONE';
    else if (fluor.includes('Faint') || fluor.includes('Very Slight') || fluor === 'VSL' || fluor === 'FNT') fluorCategory = 'FAINT';
    else if (fluor.includes('Slight') || fluor.includes('Medium') || fluor === 'MED' || fluor === 'SLT') fluorCategory = 'MEDIUM';
    else if (fluor.includes('Strong') || fluor.includes('Very Strong') || fluor === 'STG' || fluor === 'VST') fluorCategory = 'STRONG';

    let key, score;
    
    if (isRound) {
      // ROUND diamonds - with Cut grade
      const cut = diamond.cut || '';
      
      // If Round diamond but no cut data, use Fancy table as fallback
      if (!cut || cut === 'N/A' || cut.trim() === '') {
        key = `${color}-${clarity}-${symmetryCategory}-${polishCategory}-${fluorCategory}`;
        const fancyGradingTable = window.FANCY_GRADING_TABLE || {};
        score = fancyGradingTable[key];
        
        console.log('ROUND diamond (no cut data) using FANCY table:', {
          shape, key,
          color,
          clarity,
          symmetry, symmetryCategory,
          polish, polishCategory,
          fluor, fluorCategory,
          score
        });
      } else {
        let cutCategory = 'N/A';
        if (cut.includes('Excellent') || cut === 'EX') cutCategory = 'EX';
        else if (cut.includes('Very Good') || cut === 'VG') cutCategory = 'VG';
        else if (cut.includes('Good') || cut === 'GOOD' || cut === 'G') cutCategory = 'GOOD';
        else cutCategory = 'POOR';
        
        // Key format: COLOR-CLARITY-SYMMETRY-POLISH-FLUORESCENCE-CUT
        key = `${color}-${clarity}-${symmetryCategory}-${polishCategory}-${fluorCategory}-${cutCategory}`;
        
        // ROUND grading table
        const roundGradingTable = window.ROUND_GRADING_TABLE || {};
        score = roundGradingTable[key];
        
        console.log('ROUND diamond score lookup:', {
          shape, key,
          color,
          clarity,
          symmetry, symmetryCategory,
          polish, polishCategory,
          fluor, fluorCategory,
          cut, cutCategory,
          score
        });
      }
    } else {
      // FANCY shapes - no Cut grade
      // Key format: COLOR-CLARITY-SYMMETRY-POLISH-FLUORESCENCE
      key = `${color}-${clarity}-${symmetryCategory}-${polishCategory}-${fluorCategory}`;
      
      // FANCY grading table
      const fancyGradingTable = window.FANCY_GRADING_TABLE || {};
      score = fancyGradingTable[key];
      
      console.log('FANCY diamond score lookup:', {
        shape, key,
        color,
        clarity,
        symmetry, symmetryCategory,
        polish, polishCategory,
        fluor, fluorCategory,
        score
      });
    }
    
    if (score) {
      console.log('Found score:', score);
      return score ? parseFloat(score).toFixed(2) : null;
    }

    console.log('Score not found for key:', key, '- using fallback');
    return 5.0; // Fallback score (on 1-10 scale)
  }

  /**
   * Format score value for display
   * New grading tables already use 1-10 scale
   * @param {number} value - Value in 1-10 range
   * @returns {number} - Value formatted to 1 decimal place
   */
  function convertTo10Scale(value) {
    if (!value || isNaN(value)) return null;
    // New grading system already uses 1-10 scale, just format it
    return parseFloat(value).toFixed(2);
  }

  /**
   * Update Diamond Rating display
   * Converts score from 0-100 to 1-10 scale
   */
  function updateDiamondRating(diamond) {
    const ratingContainer = document.getElementById('diamond-rating-container');
    
    if (!ratingContainer) {
      console.log('diamond-rating-container not found in DOM');
      return;
    }

    // Check for score field, or calculate it
    let scoreValue = diamond.score || diamond.rating || diamond.grade || diamond.quality_score;
    
    if (!scoreValue) {
      // Calculate score from diamond attributes
      scoreValue = calculateDiamondScore(diamond);
      console.log('Calculated score from attributes:', scoreValue);
    }
    
    console.log('Diamond rating check:', {
      score: diamond.score,
      rating: diamond.rating,
      grade: diamond.grade,
      quality_score: diamond.quality_score,
      calculatedScore: scoreValue
    });
    
    if (!scoreValue) {
      console.log('No score value found, hiding rating');
      ratingContainer.style.display = 'none';
      return;
    }

    // Convert to 1-10 scale
    const rating = convertTo10Scale(scoreValue);
    const ratingNum = parseFloat(rating);
    
    console.log('Displaying rating:', rating, 'from score:', scoreValue);
    
    // Calculate percentage for the slider (0-100%)
    const percentage = (ratingNum / 10) * 100;
    
    // Determine color based on rating
    let color = '#4CAF50'; // Green for high ratings
    if (ratingNum < 5) {
      color = '#f44336'; // Red for low ratings
    } else if (ratingNum < 7) {
      color = '#ff9800'; // Orange for medium ratings
    } else if (ratingNum < 8.5) {
      color = '#CDDC39'; // Yellow-green for good ratings
    }

const pct = Math.min(Math.max((rating / 10) * 100, 0), 100);

ratingContainer.innerHTML = `
  <div style="
    display:flex;
    align-items:center;
    gap:12px;
    font-family:Arial, sans-serif;
    width:100%;
  ">

    <!-- Label -->
    <span style="
      font-size:14px;
      font-weight:600;
      color:#333;
      white-space:nowrap;
    ">
      Diamond Rating:
    </span>

    <!-- Bar wrapper -->
    <div style="
      position:relative;
      flex:1;
      display:flex;
      align-items:center;
      height:22px;
    ">

      <!-- Rating value -->
      <div style="
        position:absolute;
        left:${pct}%;
        transform:translateX(-50%);
        top:-14px;
        font-size:13px;
        font-weight:600;
        color:#333;
        white-space:nowrap;
      ">
        ${rating}
      </div>

      <!-- Gradient bar -->
      <div style="
        position:relative;
        width:100%;
        height:6px;
        background:linear-gradient(to right,
          #f44336 0%,
          #ff9800 25%,
          #CDDC39 50%,
          #8BC34A 75%,
          #4CAF50 100%);
        border-radius:4px;
          overflow:visible;   /* 👈 THIS IS THE FIX */

      ">

        <!-- Marker -->
        <div style="
          position:absolute;
          left:${pct}%;
          top:50%;
          transform:translate(-50%, -50%);
          width:12px;
          height:12px;
          background:#fff;
          border:2px solid #666;
          border-radius:50%;
          box-shadow:0 1px 3px rgba(0,0,0,0.3);
        "></div>

      </div>
    </div>

    <!-- Info icon -->
    <span 
      onclick="showRatingInfo(event)"
      style="
        font-size:14px;
        cursor:pointer;
        margin-left:4px;
        position:relative;
      "
      title="Click for more information"
    >ⓘ</span>

  </div>
`;




    console.log("NEW RATING CODE LOADED");

    ratingContainer.style.display = 'block';
    console.log('Rating displayed successfully');
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.log('Diamond product page initialized');
    loadDiamondDetails();
    initializeInquiryModal();
    initializeCertificateModal();
  }

  function loadDiamondDetails() {
    try {
      const cachedData = sessionStorage.getItem('currentDiamond');
      const searchResults = sessionStorage.getItem('searchResults');
      
      if (cachedData) {
        const diamond = JSON.parse(cachedData);
        populateDiamondData(diamond);
        
        if (searchResults) {
          const allDiamonds = JSON.parse(searchResults);
          displayRelatedDiamonds(diamond, allDiamonds);
        }
      } else {
        window.location.href = '/pages/contact?view=diamond-search';
      }
    } catch (err) {
      console.error('Error loading diamond:', err);
      showError(`Error: ${err.message}`);
    }
  }

  function populateDiamondData(diamond) {
    console.log('Populating diamond data:', diamond);
    
    const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.cut || ''} Cut ${diamond.shape || ''} Diamond`.trim();
    const price = diamond.total_sales_price_in_currency || diamond.total_sales_price || 0;

    // Update Main Product Media (Image, Video, or 360 Viewer)
    const mainImage = document.getElementById('diamond-image');
    const mainVideo = document.getElementById('diamond-video');
    const mediaContainer = document.getElementById('diamond-media-container');
    
    // Check if has 360 viewer (Vision360)
    if (diamond.has_video && diamond.video_url) {
      // Show 360 viewer iframe
      const iframe = document.createElement('iframe');
      iframe.src = diamond.video_url;
      iframe.style.cssText = 'width: 100%; height: 600px; border: none; border-radius: 8px;';
      iframe.setAttribute('allowfullscreen', '');
      
      if (mainImage) mainImage.style.display = 'none';
      if (mainVideo) mainVideo.style.display = 'none';
      
      // Clear container and add iframe
      if (mediaContainer) {
        const existingIframe = mediaContainer.querySelector('iframe');
        if (existingIframe) existingIframe.remove();
        mediaContainer.appendChild(iframe);
      }
    } else if (diamond.image_file) {
      // Check if it's a direct video file
      const isDirectVideo = diamond.image_file.toLowerCase().endsWith('.mp4') ||
                           diamond.image_file.toLowerCase().endsWith('.webm') ||
                           diamond.image_file.toLowerCase().endsWith('.mov');
      
      if (isDirectVideo && mainVideo) {
        // Show video player
        mainVideo.querySelector('source').src = diamond.image_file;
        mainVideo.load();
        mainVideo.style.display = 'block';
        mainVideo.play().catch(e => console.log('Autoplay prevented:', e));
        if (mainImage) mainImage.style.display = 'none';
      } else if (mainImage) {
        // Show image
        mainImage.src = diamond.image_file;
        mainImage.alt = diamondName;
        mainImage.style.display = 'block';
        if (mainVideo) mainVideo.style.display = 'none';
        mainImage.onerror = function() {
          this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Crect width='500' height='500' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3EImage Not Available%3C/text%3E%3C/svg%3E";
        };
      }
    } else {
      // No media available - show placeholder
      if (mainImage) {
        mainImage.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Crect width='500' height='500' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ENo Media Available%3C/text%3E%3C/svg%3E";
        mainImage.style.display = 'block';
      }
      if (mainVideo) mainVideo.style.display = 'none';
    }

    // Update Lab Text
    const labElement = document.getElementById('diamond-lab');
    if (labElement) {
      labElement.textContent = diamond.lab ? `${diamond.lab} Certified Diamond` : 'Certified Diamond';
    }

    // Update Title
    const titleElement = document.getElementById('diamond-title');
    if (titleElement) {
      titleElement.textContent = diamondName;
    }

    // Update SKU
    const skuElement = document.getElementById('diamond-sku');
    if (skuElement) {
      skuElement.innerHTML = `<span class="visually-hidden">SKU:</span> SKU: ${diamond.stock_num || diamond.diamond_id}`;
    }

    // Update Price
    const priceElement = document.getElementById('diamond-price');
    if (priceElement) {
      priceElement.textContent = `${CURRENCY}${price.toLocaleString()}`;
    }

    // Update Meta Details
    updateMetaDetails(diamond);
    
    // Update Product Details (includes rating)
    updateProductDetails(diamond);
    
    // Update Accordions
    updateSpecifications(diamond);
    updateMeasurements(diamond);
    updateCertificate(diamond);
    
    // Update Tabs
    updateDescriptionTab(diamond, diamondName, price);
    updateDetailsTab(diamond, price);
    updateCertificationTab(diamond);

    // Store diamond data for add to cart
    window.currentDiamond = diamond;
  }

  function updateMetaDetails(diamond) {
    const metaDetails = document.getElementById('diamond-meta-details');
    if (!metaDetails) return;
    
    let metaHTML = '';
    
    if (diamond.color) {
      metaHTML += `
        <div class="meta-detail meta-clarity">
          <div class="meta-detail-value">${diamond.color}</div>
          <div class="meta-detail-lable">Colour</div>
        </div>
      `;
    }
    
    if (diamond.clarity) {
      metaHTML += `
        <div class="meta-detail meta-clarity">
          <div class="meta-detail-value">${diamond.clarity}</div>
          <div class="meta-detail-lable">Clarity</div>
        </div>
      `;
    }
    
    if (diamond.cut) {
      metaHTML += `
        <div class="meta-detail meta-cut">
          <div class="meta-detail-value">${diamond.cut}</div>
          <div class="meta-detail-lable">Cut</div>
        </div>
      `;
    }
    
    if (diamond.size) {
      metaHTML += `
        <div class="meta-detail meta-carat">
          <div class="meta-detail-value">${diamond.size}</div>
          <div class="meta-detail-lable">Carat</div>
        </div>
      `;
    }
    
    if (diamond.cert_num) {
      metaHTML += `
        <div class="meta-detail meta-carat certificate-trigger" onclick="openCertificateModal('${diamond.diamond_id}', '${diamond.cert_num}')" style="cursor: pointer;">
          <div class="meta-detail-value">
            <svg xmlns="http://www.w3.org/2000/svg" width="33" height="32" viewBox="0 0 33 32" fill="none">
              <path d="M16.5003 20.7694L11.7817 16.052L12.7257 15.092L15.8337 18.2V6.66669H17.167V18.2L20.2737 15.0934L21.219 16.052L16.5003 20.7694ZM7.16699 25.3334V19.9494H8.50033V24H24.5003V19.9494H25.8337V25.3334H7.16699Z" fill="#2E2E2E" stroke="#2E2E2E" stroke-width="0.5"/>
            </svg>
          </div>
          <div class="meta-detail-lable">Certificate</div>
        </div>
      `;
    }
    
    metaDetails.innerHTML = metaHTML;
  }

  function updateProductDetails(diamond) {
    const proDetails = document.getElementById('diamond-pro-details');
    if (!proDetails) return;
    
    // Calculate and display rating first
    let scoreValue = diamond.score || diamond.rating || diamond.grade || diamond.quality_score;
    if (!scoreValue) {
      scoreValue = calculateDiamondScore(diamond);
    }
    
    let ratingHTML = '';
    if (scoreValue) {
      const rating = convertTo10Scale(scoreValue);
      const ratingNum = parseFloat(rating);
      const percentage = (ratingNum / 10) * 100;
      
      let color = '#4CAF50';
      if (ratingNum < 5) {
        color = '#f44336';
      } else if (ratingNum < 7) {
        color = '#ff9800';
      } else if (ratingNum < 8.5) {
        color = '#CDDC39';
      }
      
      ratingHTML = `
<div id="diamond-rating-container"
     style="margin: 5px 0; overflow: visible; position: relative;"></div>      `;
    }
    
    let detailsHTML = ratingHTML;
    
    if (diamond.stock_num || diamond.diamond_id) {
      detailsHTML += `
        <div class="pro_detail">
          <div class="pro_detail-lable">Product Number:</div>
          <div class="pro_detail-velue">${diamond.stock_num || diamond.diamond_id}</div>
        </div>
      `;
    }
    
    if (diamond.shape) {
      detailsHTML += `
        <div class="pro_detail">
          <div class="pro_detail-lable">Shape:</div>
          <div class="pro_detail-velue">${diamond.shape}</div>
        </div>
      `;
    }
    
    if (diamond.lab) {
      detailsHTML += `
        <div class="pro_detail">
          <div class="pro_detail-lable">Lab:</div>
          <div class="pro_detail-velue">${diamond.lab}</div>
        </div>
      `;
    }
    
    detailsHTML += `
      <div class="pro_detail">
        <div class="pro_detail-lable">Product Type:</div>
        <div class="pro_detail-velue">Diamond</div>
      </div>
    `;
    
    proDetails.innerHTML = detailsHTML;
    
    // Now update the diamond rating after the container is in the DOM
    updateDiamondRating(diamond);
  }

  function updateSpecifications(diamond) {
    const specificationsElement = document.getElementById('diamond-specifications');
    if (!specificationsElement) return;
    
    let specsHTML = '<table style="width: 100%; border-collapse: collapse;"><tbody>';
    
    const specs = [
      { label: 'Shape', value: diamond.shape },
      { label: 'Cut', value: diamond.cut },
      { label: 'Polish', value: diamond.polish },
      { label: 'Symmetry', value: diamond.symmetry },
      { label: 'Fluorescence', value: diamond.fluor_intensity }
    ];
    
    specs.forEach((spec) => {
      if (spec.value) {
        specsHTML += `
          <tr>
            <td style="padding: 18px 24px; color: #999; font-size: 14px;">${spec.label}</td>
            <td style="padding: 18px 24px; font-weight: 500; text-align: right; color: #333; font-size: 14px;">${spec.value}</td>
          </tr>`;
      }
    });
    
    specsHTML += '</tbody></table>';
    specificationsElement.innerHTML = specsHTML;
  }

  function updateMeasurements(diamond) {
    const measurementsElement = document.getElementById('diamond-measurements');
    if (!measurementsElement) return;
    
    let measHTML = '<table style="width: 100%; border-collapse: collapse;"><tbody>';
    
    const measurements = [
      { label: 'Length', value: diamond.meas_length ? `${diamond.meas_length} mm` : null },
      { label: 'Width', value: diamond.meas_width ? `${diamond.meas_width} mm` : null },
      { label: 'Depth', value: diamond.meas_depth ? `${diamond.meas_depth} mm` : null },
      { label: 'Depth %', value: diamond.depth_percent ? `${diamond.depth_percent}%` : null },
      { label: 'Table %', value: diamond.table_percent ? `${diamond.table_percent}%` : null }
    ];
    
    measurements.forEach((meas) => {
      if (meas.value) {
        measHTML += `
          <tr>
            <td style="padding: 18px 24px; color: #999; font-size: 14px;">${meas.label}</td>
            <td style="padding: 18px 24px; font-weight: 500; text-align: right; color: #333; font-size: 14px;">${meas.value}</td>
          </tr>`;
      }
    });
    
    measHTML += '</tbody></table>';
    measurementsElement.innerHTML = measHTML;
  }

  function updateCertificate(diamond) {
    const certificateElement = document.getElementById('diamond-certificate');
    if (!certificateElement) return;
    
    if (diamond.lab || diamond.cert_num) {
      let certHTML = '<table style="width: 100%; border-collapse: collapse;"><tbody>';
      
      const certData = [
        { label: 'Lab', value: diamond.lab },
        { label: 'Cert #', value: diamond.cert_num }
      ];
      
      certData.forEach((cert) => {
        if (cert.value) {
          certHTML += `
            <tr>
              <td style="padding: 18px 24px; color: #999; font-size: 14px;">${cert.label}</td>
              <td style="padding: 18px 24px; font-weight: 500; text-align: right; color: #333; font-size: 14px;">${cert.value}</td>
            </tr>`;
        }
      });
      
      certHTML += '</tbody></table>';
      certificateElement.innerHTML = certHTML;
    } else {
      certificateElement.innerHTML = '<div style="padding: 24px; text-align: center; color: #999; font-size: 13px;">Not available</div>';
    }
  }

  function updateDescriptionTab(diamond, diamondName, price) {
    const descriptionElement = document.getElementById('diamond-description');
    if (!descriptionElement) return;
    
    descriptionElement.innerHTML = `
      <h3>${diamondName}</h3>
      <p>This exquisite ${diamond.shape || ''} diamond features ${diamond.color || ''} color and ${diamond.clarity || ''} clarity, with ${diamond.cut || ''} cut quality. ${diamond.lab ? `Certified by ${diamond.lab}.` : ''}</p>
      ${diamond.size ? `<p><strong>Carat Weight:</strong> ${diamond.size} ct</p>` : ''}
      ${diamond.cert_num ? `<p><strong>Certificate Number:</strong> ${diamond.cert_num}</p>` : ''}
    `;
  }

  function updateDetailsTab(diamond, price) {
    const detailsTab = document.getElementById('diamond-details-table');
    if (!detailsTab) return;
    
    let detailsHTML = '<div class="pc_details">';
    
    // First Row
    detailsHTML += '<div class="pc_detail_row">';
    if (diamond.stock_num) detailsHTML += `<div class="pc_detail_item"><p>Stone ID:</p><p>${diamond.stock_num}</p></div>`;
    if (diamond.shape) detailsHTML += `<div class="pc_detail_item"><p>Shape:</p><p>${diamond.shape}</p></div>`;
    if (diamond.size) detailsHTML += `<div class="pc_detail_item"><p>Carat:</p><p>${diamond.size}</p></div>`;
    if (diamond.color) detailsHTML += `<div class="pc_detail_item"><p>Color:</p><p>${diamond.color}</p></div>`;
    if (diamond.clarity) detailsHTML += `<div class="pc_detail_item"><p>Clarity:</p><p>${diamond.clarity}</p></div>`;
    detailsHTML += '</div>';
    
    // Second Row
    detailsHTML += '<div class="pc_detail_row">';
    if (price) {
      const pricePerCarat = diamond.size ? (price / diamond.size).toFixed(2) : price;
      detailsHTML += `<div class="pc_detail_item"><p>Selling Price<br>Per Carat:</p><p>${CURRENCY}${parseFloat(pricePerCarat).toLocaleString()}</p></div>`;
      detailsHTML += `<div class="pc_detail_item"><p>Total Per<br>Stone:</p><p>${CURRENCY}${price.toLocaleString()}</p></div>`;
    }
    if (diamond.polish) detailsHTML += `<div class="pc_detail_item"><p>Polish:</p><p>${diamond.polish}</p></div>`;
    if (diamond.symmetry) detailsHTML += `<div class="pc_detail_item"><p>Symmetry:</p><p>${diamond.symmetry}</p></div>`;
    if (diamond.fluor_intensity) detailsHTML += `<div class="pc_detail_item"><p>Fluorescence:</p><p>${diamond.fluor_intensity}</p></div>`;
    if (diamond.meas_length && diamond.meas_width && diamond.meas_depth) {
      detailsHTML += `<div class="pc_detail_item"><p>Measurement:</p><p>${diamond.meas_length}*${diamond.meas_width}*${diamond.meas_depth}</p></div>`;
    }
    detailsHTML += '</div>';
    
    // Third Row
    detailsHTML += '<div class="pc_detail_row">';
    if (diamond.depth_percent) detailsHTML += `<div class="pc_detail_item"><p>TD%:</p><p>${diamond.depth_percent}</p></div>`;
    if (diamond.table_percent) detailsHTML += `<div class="pc_detail_item"><p>Tab%:</p><p>${diamond.table_percent}</p></div>`;
    if (diamond.lab) detailsHTML += `<div class="pc_detail_item"><p>Lab:</p><p>${diamond.lab}</p></div>`;
    if (diamond.cert_num) detailsHTML += `<div class="pc_detail_item"><p>Certificate:</p><p>${diamond.cert_num}</p></div>`;
    detailsHTML += '</div>';
    
    detailsHTML += '</div>';
    detailsTab.innerHTML = detailsHTML;
  }

  function updateCertificationTab(diamond) {
    const certificationElement = document.getElementById('diamond-certification');
    if (!certificationElement) return;
    
    let certHTML = '<div style="padding: 20px;">';
    if (diamond.lab) {
      certHTML += `<h3>${diamond.lab} Certification</h3>`;
      certHTML += `<p>This diamond has been certified by ${diamond.lab}, one of the world's leading gemological laboratories.</p>`;
    }
    if (diamond.cert_num) {
      certHTML += `<p><strong>Certificate Number:</strong> ${diamond.cert_num}</p>`;
      certHTML += `<p>You can verify this certificate on the ${diamond.lab || 'laboratory'} website.</p>`;
    }
    if (!diamond.lab && !diamond.cert_num) {
      certHTML += '<p>Certification information will be provided upon request.</p>';
    }
    certHTML += '</div>';
    certificationElement.innerHTML = certHTML;
  }

  function displayRelatedDiamonds(currentDiamond, allDiamonds) {
    const related = allDiamonds
      .filter(d => d.diamond_id !== currentDiamond.diamond_id)
      .filter(d => d.shape === currentDiamond.shape)
      .slice(0, 4);
    
    if (related.length === 0) return;

    const relatedSection = document.getElementById('related-diamonds-section');
    const relatedGrid = document.getElementById('related-diamonds-grid');
    
    if (!relatedGrid) return;

    let html = '';
    related.forEach(diamond => {
      const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.shape || ''} Diamond`.trim();
      const price = diamond.total_sales_price_in_currency || diamond.total_sales_price || 0;
      
      // Calculate rating for similar diamond
      const rating = calculateDiamondScore(diamond);
      const ratingHTML = rating ? generateRatingHTML(rating) : '';
      
      // Check if it's a video
      const isVideo = diamond.image_file && (
        diamond.image_file.toLowerCase().endsWith('.mp4') ||
        diamond.image_file.toLowerCase().endsWith('.webm') ||
        diamond.image_file.toLowerCase().endsWith('.mov') ||
        diamond.image_file.toLowerCase().includes('video')
      );

      html += `
        <li class="grid__item">
          <div class="card-wrapper product-card-wrapper underline-links-hover">
            <div class="card card--standard card--media">
              <div class="card__inner color-background-2 gradient ratio" style="--ratio-percent: 100%;">
                <div class="card__media">
                  <div class="media media--transparent media--hover-effect">
                    ${diamond.image_file ? (
                      isVideo ? `
                        <video autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover;">
                          <source src="${diamond.image_file}" type="video/mp4">
                        </video>
                      ` : `
                        <img src="${diamond.image_file}"
                             alt="${diamondName}"
                             loading="lazy"
                             width="533"
                             height="533"
                             onerror="this.src='https://via.placeholder.com/533x533?text=No+Image'">
                      `
                    ) : `
                      <div style="background: #f5f5f5; display: flex; align-items: center; justify-content: center; height: 100%;">
                        <span style="color: #999;">No Image</span>
                      </div>
                    `}
                  </div>
                </div>
              </div>
              <div class="card__content">
                <div class="card__information">
                  <h3 class="card__heading">
                    <a href="#" onclick="event.preventDefault(); viewDiamond(${diamond.diamond_id});" class="full-unstyled-link">
                      ${diamondName}
                    </a>
                  </h3>
                               <!-- Rating -->
              ${rating ? `
                <div style="margin: 14px 0; padding: 12px 0; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.8px; color: #999; text-transform: uppercase;">Rating</span>
                  <span style="font-size: 18px; font-weight: 700; color: #1a1a1a;">${rating}<span style="font-size: 11px; font-weight: 400; color: #999; margin-left: 3px;">/10</span></span>
                </div>
              ` : ''}
              <!-- Price -->
              <div style="text-align: center; margin-top: 14px;">
                <span style="font-size: 18px; font-weight: 700; color: #1a1a1a;">
                  Rs. ${price.toLocaleString('en-IN')}
                </span>
              </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      `;
    });

    relatedGrid.innerHTML = html;
    if (relatedSection) relatedSection.style.display = 'block';
  }

  /**
   * Generate rating HTML for similar diamonds
   */
  function generateRatingHTML(rating) {
    if (!rating) return '';
    
    const ratingNum = parseFloat(rating);
    const ratingDisplay = ratingNum.toFixed(1); // One decimal place
    const percentage = (ratingNum / 10) * 100;
    
    return `
      <div class="diamond-rating-display" style="margin: 12px 0; padding: 0;">
        <div style="margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: 500; color: #999; letter-spacing: 0.3px;">Diamond Rating:</span>
        </div>
        <div style="position: relative; width: 100%; margin-top: 6px;">
          <div style="position: absolute; top: -22px; left: ${percentage}%; transform: translateX(-50%); font-size: 16px; font-weight: 700; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${ratingDisplay}</div>
          <div style="width: 100%; height: 5px; background: linear-gradient(to right, #ff0000 0%, #ff6600 20%, #ffcc00 40%, #ffff00 50%, #ccff00 60%, #66ff00 80%, #00ff00 100%); border-radius: 2.5px; position: relative; overflow: hidden;">
            <div style="position: absolute; right: 0; top: 0; bottom: 0; width: ${100 - percentage}%; background: rgba(240, 240, 240, 0.9);"></div>
          </div>
        </div>
      </div>
    `;
  }

  window.viewDiamond = function(diamondId) {
    const searchResults = sessionStorage.getItem('searchResults');
    if (searchResults) {
      const allDiamonds = JSON.parse(searchResults);
      const diamond = allDiamonds.find(d => d.diamond_id === diamondId);
      if (diamond) {
        sessionStorage.setItem('currentDiamond', JSON.stringify(diamond));
        window.location.href = `/pages/contact?view=diamond-product&id=${diamondId}`;
      }
    }
  };



  function showError(message) {
    const productInfo = document.querySelector('.product__info-container');
    if (productInfo) {
      productInfo.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <h2>Error</h2>
          <p>${message}</p>
          <a href="/pages/contact?view=diamond-search" class="button">Back to Search</a>
        </div>
      `;
    }
  }

  /**
   * Initialize inquiry modal functionality
   */
  function initializeInquiryModal() {
    const modal = document.getElementById('inquiry-modal');
    const inquiryBtn = document.getElementById('InquiryButton-diamond');
    const closeBtn = document.getElementById('close-inquiry-modal');
    const inquiryForm = document.getElementById('inquiry-form');
    const successMessage = document.getElementById('inquiry-success-message');
    const errorMessage = document.getElementById('inquiry-error-message');

    if (!modal || !inquiryBtn) return;

    // Initialize quantity controls in inquiry form
    initializeInquiryQuantityControls();

    // Open modal
    inquiryBtn.addEventListener('click', function() {
      const diamond = window.currentDiamond;
      if (!diamond) {
        alert('Diamond data not loaded');
        return;
      }

      // Populate diamond info in modal
      populateInquiryDiamondInfo(diamond);
      
      // Reset form and messages
      inquiryForm.reset();
      successMessage.style.display = 'none';
      errorMessage.style.display = 'none';
      
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    // Close modal
    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Close on outside click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Handle form submission
    inquiryForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const diamond = window.currentDiamond;
      if (!diamond) {
        alert('Diamond data not loaded');
        return;
      }

      const submitBtn = document.getElementById('inquiry-submit-btn');
      const formData = new FormData(inquiryForm);
      
      const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.cut || ''} Cut ${diamond.shape || ''} Diamond`.trim();
      const price = diamond.total_sales_price_in_currency || diamond.total_sales_price || 0;
      const quantity = parseInt(formData.get('quantity'));
      const totalPrice = (price * quantity).toLocaleString();
      
      // Prepare inquiry message for Shopify contact form
      const inquiryMessage = `
═══════════════════════════════════════
        DIAMOND INQUIRY REQUEST
═══════════════════════════════════════

CUSTOMER DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     ${formData.get('name')}
Email:    ${formData.get('email')}
Phone:    ${formData.get('phone')}

DIAMOND DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Product:  ${diamondName}
SKU:      ${diamond.stock_num || diamond.diamond_id}
Shape:    ${diamond.shape || 'N/A'}
Carat:    ${diamond.size || 'N/A'}
Color:    ${diamond.color || 'N/A'}
Clarity:  ${diamond.clarity || 'N/A'}
Cut:      ${diamond.cut || 'N/A'}
Polish:   ${diamond.polish || 'N/A'}
Symmetry: ${diamond.symmetry || 'N/A'}
Lab:      ${diamond.lab || 'N/A'}
Cert #:   ${diamond.cert_num || 'N/A'}

PRICING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Price per unit: ${CURRENCY}${price.toLocaleString()}
Quantity:       ${quantity}
Total Price:    ${CURRENCY}${totalPrice}

${formData.get('message') ? `CUSTOMER MESSAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formData.get('message')}
` : ''}
═══════════════════════════════════════
      `.trim();

      // Prepare inquiry data
      const inquiryData = {
        customer: {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone')
        },
        diamond: {
          id: diamond.diamond_id || diamond.stock_num,
          name: diamondName,
          sku: diamond.stock_num || diamond.diamond_id,
          shape: diamond.shape,
          size: diamond.size,
          color: diamond.color,
          clarity: diamond.clarity,
          cut: diamond.cut,
          polish: diamond.polish,
          symmetry: diamond.symmetry,
          lab: diamond.lab,
          cert_num: diamond.cert_num,
          price: price,
          priceFormatted: `${CURRENCY}${price.toLocaleString()}`,
          image: diamond.image_file
        },
        quantity: quantity,
        totalPrice: price * quantity,
        totalPriceFormatted: `${CURRENCY}${totalPrice}`,
        message: formData.get('message') || ''
      };

      // Send to backend
      fetch(`${BACKEND_URL}/api/diamonds/send-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to send inquiry');
        }
        return response.json();
      })
      .then(data => {
        console.log('Inquiry sent successfully:', data);
        
        // Show success message
        successMessage.textContent = 'Your inquiry has been sent successfully! We\'ll get back to you soon.';
        successMessage.style.display = 'block';
        inquiryForm.style.display = 'none';
        
        // Close modal after 3 seconds
        setTimeout(() => {
          closeModal();
          inquiryForm.style.display = 'block';
          inquiryForm.reset();
          successMessage.style.display = 'none';
        }, 3000);
      })
      .catch(error => {
        console.error('Error sending inquiry:', error);
        errorMessage.textContent = 'Failed to send inquiry. Please try again or contact us directly.';
        errorMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Inquiry';
      });
    });
  }

  /**
   * Initialize quantity controls in inquiry form
   */
  function initializeInquiryQuantityControls() {
    const quantityInput = document.getElementById('inquiry-quantity');
    if (!quantityInput) return;

    const container = quantityInput.closest('quantity-input');
    if (!container) return;

    const minusBtn = container.querySelector('button[name="minus"]');
    const plusBtn = container.querySelector('button[name="plus"]');

    if (minusBtn) {
      minusBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value) || 1;
        const minValue = parseInt(quantityInput.getAttribute('min')) || 1;
        if (currentValue > minValue) {
          quantityInput.value = currentValue - 1;
        }
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value) || 1;
        quantityInput.value = currentValue + 1;
      });
    }
  }

  /**
   * Populate diamond info in inquiry modal
   */
  function populateInquiryDiamondInfo(diamond) {
    const infoContainer = document.getElementById('inquiry-diamond-info');
    if (!infoContainer) return;

    const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.cut || ''} Cut ${diamond.shape || ''} Diamond`.trim();
    const price = diamond.total_sales_price_in_currency || diamond.total_sales_price || 0;

    infoContainer.innerHTML = `
      <h3>Diamond Details</h3>
      <p><strong>Name:</strong> ${diamondName}</p>
      <p><strong>SKU:</strong> ${diamond.stock_num || diamond.diamond_id}</p>
      <p><strong>Price:</strong> ${CURRENCY}${price.toLocaleString()}</p>
      ${diamond.shape ? `<p><strong>Shape:</strong> ${diamond.shape}</p>` : ''}
      ${diamond.size ? `<p><strong>Carat:</strong> ${diamond.size}</p>` : ''}
      ${diamond.color ? `<p><strong>Color:</strong> ${diamond.color}</p>` : ''}
      ${diamond.clarity ? `<p><strong>Clarity:</strong> ${diamond.clarity}</p>` : ''}
    `;
  }

  /**
   * Initialize certificate modal functionality
   */
  function initializeCertificateModal() {
    console.log('Initializing certificate modal...');
    
    // Create modal HTML if it doesn't exist
    let modal = document.getElementById('certificate-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'certificate-modal';
      modal.className = 'certificate-modal';
      
      // Apply inline styles to modal
      modal.style.display = 'none';
      modal.style.position = 'fixed';
      modal.style.zIndex = '999999';
      modal.style.left = '0';
      modal.style.top = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.backgroundColor = 'transparent';
      
      modal.innerHTML = `
        <div class="certificate-modal-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.75); cursor: pointer; z-index: 1;"></div>
        <div class="certificate-modal-content" style="position: relative; background: white; border-radius: 12px; width: 90%; max-width: 1200px; height: 90vh; max-height: 900px; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); z-index: 2;">
          <div class="certificate-modal-header" style="padding: 20px 30px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #333;">Diamond Certificate</h2>
            <button class="certificate-modal-close" id="close-certificate-modal" aria-label="Close" style="background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: background 0.2s; color: #666;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="certificate-modal-body" style="flex: 1; padding: 0; overflow: hidden; position: relative; background: #f5f5f5;">
            <iframe id="certificate-iframe" src="" frameborder="0" allowfullscreen style="width: 100%; height: 100%; border: none; display: block;"></iframe>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      console.log('Certificate modal created and appended to body');
    }

    // Close modal handlers
    const closeBtn = document.getElementById('close-certificate-modal');
    const overlay = modal.querySelector('.certificate-modal-overlay');

    function closeModal() {
      console.log('Closing certificate modal');
      modal.style.display = 'none';
      modal.classList.remove('active');
      document.body.style.overflow = '';
      // Clear iframe src to stop loading
      const iframe = document.getElementById('certificate-iframe');
      if (iframe) iframe.src = '';
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
      // Add hover effect
      closeBtn.addEventListener('mouseenter', function() {
        this.style.background = '#e0e0e0';
        this.style.color = '#000';
      });
      closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'none';
        this.style.color = '#666';
      });
    }

    if (overlay) {
      overlay.addEventListener('click', closeModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  /**
   * Show rating information tooltip
   * Exposed globally for onclick handlers
   */
  window.showRatingInfo = function(event) {
    event.stopPropagation();
    
    // Remove any existing tooltip
    const existingTooltip = document.getElementById('rating-info-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
      return; // Toggle behavior - close if already open
    }
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'rating-info-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      width: 90%;
      font-family: Arial, sans-serif;
    `;
    
    tooltip.innerHTML = `
      <div style="position: relative;">
        <button 
          onclick="document.getElementById('rating-info-tooltip').remove()"
          style="
            position: absolute;
            top: -10px;
            right: -10px;
            background: #f5f5f5;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            color: #666;
          "
        >×</button>
        
        <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #333;">Diamond Rating System</h3>
        
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #666; line-height: 1.6;">
          Our diamond rating system evaluates diamonds on a scale of 1-10 based on multiple quality factors including cut, color, clarity, polish, symmetry, and fluorescence.
        </p>
        
        <a 
          href="/" 
          onclick="event.preventDefault(); window.location.href='/pages/diamondgrading'; setTimeout(() => { const section = document.querySelector('.diamond-grading'); if(section) section.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 500);"
          style="
            display: inline-block;
            background: #333;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.3s;
          "
          onmouseover="this.style.background='#555'"
          onmouseout="this.style.background='#333'"
        >Learn More About Our Grading System</a>
      </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closeTooltip(e) {
        if (!tooltip.contains(e.target)) {
          tooltip.remove();
          document.removeEventListener('click', closeTooltip);
        }
      });
    }, 100);
  };

  /**
   * Open certificate modal with diamond certificate
   * Exposed globally for onclick handlers
   */
  window.openCertificateModal = function(diamondId, certNum) {
    console.log('Opening certificate modal for diamond:', diamondId);
    
    const modal = document.getElementById('certificate-modal');
    const iframe = document.getElementById('certificate-iframe');
    
    if (!modal) {
      console.error('Certificate modal not found, initializing...');
      initializeCertificateModal();
      // Try again after initialization
      setTimeout(() => window.openCertificateModal(diamondId, certNum), 100);
      return;
    }
    
    if (!iframe) {
      console.error('Certificate iframe not found');
      return;
    }

    // Build certificate URL
    const certificateUrl = `https://www.diamondselections.com/GetCertificate.aspx?diamondid=${diamondId}`;
    console.log('Loading certificate URL:', certificateUrl);
    
    // Set iframe source
    iframe.src = certificateUrl;
    
    // Apply inline styles to ensure visibility
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.zIndex = '999999';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Debug: Check modal state
    console.log('Modal element:', modal);
    console.log('Modal classes:', modal.className);
    console.log('Modal display style:', window.getComputedStyle(modal).display);
    console.log('Modal z-index:', window.getComputedStyle(modal).zIndex);
    console.log('Modal position:', window.getComputedStyle(modal).position);
    console.log('Certificate modal opened');
  };

})();
