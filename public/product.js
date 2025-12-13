const loading = document.getElementById('loading');
const error = document.getElementById('error');
const productDetail = document.getElementById('productDetail');
const relatedProducts = document.getElementById('relatedProducts');
const relatedGrid = document.getElementById('relatedGrid');

// Get diamond ID from URL
const urlParams = new URLSearchParams(window.location.search);
const diamondId = urlParams.get('id');

if (!diamondId) {
    error.textContent = 'No diamond ID provided';
    error.style.display = 'block';
    loading.style.display = 'none';
} else {
    loadDiamondDetails();
}

async function loadDiamondDetails() {
    try {
        // Get diamond details from sessionStorage if available
        const cachedData = sessionStorage.getItem('currentDiamond');
        const searchResults = sessionStorage.getItem('searchResults');
        
        if (cachedData) {
            const diamond = JSON.parse(cachedData);
            displayDiamondDetails(diamond);
            
            if (searchResults) {
                const allDiamonds = JSON.parse(searchResults);
                displayRelatedDiamonds(diamond, allDiamonds);
            }
        } else {
            // If no cached data, redirect back to search
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error('Error loading diamond:', err);
        error.textContent = `Error: ${err.message}`;
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function displayDiamondDetails(diamond) {
    const hasImage = diamond.has_image_file && diamond.image_file;
    const hasVideo = diamond.has_video && diamond.video_url;
    const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.cut || ''} Cut ${diamond.shape || ''} Diamond`.trim();
    
    let html = `
        <div class="page-width">
            <div class="product product--medium product--left product--thumbnail_slider product--mobile-show grid grid--1-col grid--2-col-tablet">
                <div class="grid__item product__media-wrapper">
                    <div class="product-media-container media-type-image media-fit-cover global-media-settings gradient constrain-height">
                        ${hasImage ? `
                            <div class="product__media media media--transparent">
                                <img src="${diamond.image_file}" alt="${diamondName}" />
                            </div>
                        ` : hasVideo ? `
                            <div class="video-preview" onclick="openVideoModal('${diamond.video_url}', '${diamondName.replace(/'/g, "\\'")}')">
                                <div class="video-play-overlay">
                                    <svg class="play-icon" viewBox="0 0 24 24" fill="white">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <span>Click to Play 360° Video</span>
                                </div>
                            </div>
                        ` : `
                            <div class="product-image-placeholder">
                                <svg class="diamond-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                </svg>
                                <span>No Image Available</span>
                            </div>
                        `}
                    </div>
                    
                    ${hasImage ? `
                    <div class="product-thumbnails">
                        <div class="thumbnail-item">
                            <img src="${diamond.image_file}" alt="${diamondName}" />
                        </div>
                        ${hasVideo ? `
                        <div class="thumbnail-item thumbnail-video" onclick="openVideoModal('${diamond.video_url}', '${diamondName.replace(/'/g, "\\'")}')">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                    
                    ${hasVideo && !hasImage ? `
                        <button class="product-video-btn" onclick="openVideoModal('${diamond.video_url}', '${diamondName.replace(/'/g, "\\'")}')">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            Watch 360° Video
                        </button>
                    ` : ''}
                </div>
                
                <div class="product__info-wrapper grid__item scroll-trigger animate--slide-in">
                    <section id="ProductInfo-main" class="product__info-container">
                        <p class="product__text inline-richtext caption-with-letter-spacing">
                            ${diamond.lab ? diamond.lab + ' Certified Diamond' : 'Diamond'}
                        </p>
                        
                        <div class="product__title">
                            <h1>${diamondName}</h1>
                        </div>
                        
                        ${diamond.stock_num ? `
                        <p class="product__sku" role="status">
                            SKU: ${diamond.stock_num}
                        </p>
                        ` : ''}
                        
                        <div id="price-main" role="status">
                            <div class="price price--large">
                                <div class="price__container">
                                    <div class="price__regular">
                                        <span class="price-item price-item--regular">
                                            Rs. ${diamond.total_sales_price_in_currency?.toLocaleString() || diamond.total_sales_price?.toLocaleString() || '199.99'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="product-form">
                            <div class="product-form__buttons">
                                <button type="button" class="product-form__submit button button--full-width button--primary">
                                    <span>Add to Cart</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="meta-details">
                            ${diamond.color ? `
                            <div class="meta-detail meta-clarity">
                                <div class="meta-detail-value">${diamond.color}</div>
                                <div class="meta-detail-lable">Colour</div>
                            </div>
                            ` : ''}
                            
                            ${diamond.clarity ? `
                            <div class="meta-detail meta-clarity">
                                <div class="meta-detail-value">${diamond.clarity}</div>
                                <div class="meta-detail-lable">Clarity</div>
                            </div>
                            ` : ''}
                            
                            ${diamond.cut ? `
                            <div class="meta-detail meta-cut">
                                <div class="meta-detail-value">${diamond.cut}</div>
                                <div class="meta-detail-lable">Cut</div>
                            </div>
                            ` : ''}
                            
                            ${diamond.size ? `
                            <div class="meta-detail meta-carat">
                                <div class="meta-detail-value">${diamond.size}</div>
                                <div class="meta-detail-lable">Carat</div>
                            </div>
                            ` : ''}
                            
                            ${diamond.cert_num ? `
                            <div class="meta-detail meta-carat">
                                <div class="meta-detail-value">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="33" height="32" viewBox="0 0 33 32" fill="none">
                                        <path d="M16.5003 20.7694L11.7817 16.052L12.7257 15.092L15.8337 18.2V6.66669H17.167V18.2L20.2737 15.0934L21.219 16.052L16.5003 20.7694ZM7.16699 25.3334V19.9494H8.50033V24H24.5003V19.9494H25.8337V25.3334H7.16699Z" fill="#2E2E2E" stroke="#2E2E2E" stroke-width="0.5"/>
                                    </svg>
                                </div>
                                <div class="meta-detail-lable">Certificate</div>
                            </div>
                            ` : ''}
                        </div>
                        
                        ${diamond.shape || diamond.polish || diamond.symmetry || diamond.fluor_intensity ? `
                        <div class="product-specs-section">
                            <h3>Specifications</h3>
                            <div class="product-specs-grid">
                                ${diamond.shape ? `
                                <div class="spec-item">
                                    <span class="spec-label">Shape</span>
                                    <span class="spec-value">${diamond.shape}</span>
                                </div>
                                ` : ''}
                                ${diamond.polish ? `
                                <div class="spec-item">
                                    <span class="spec-label">Polish</span>
                                    <span class="spec-value">${diamond.polish}</span>
                                </div>
                                ` : ''}
                                ${diamond.symmetry ? `
                                <div class="spec-item">
                                    <span class="spec-label">Symmetry</span>
                                    <span class="spec-value">${diamond.symmetry}</span>
                                </div>
                                ` : ''}
                                ${diamond.fluor_intensity ? `
                                <div class="spec-item">
                                    <span class="spec-label">Fluorescence</span>
                                    <span class="spec-value">${diamond.fluor_intensity}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${diamond.meas_length || diamond.meas_width || diamond.meas_depth ? `
                        <div class="product-measurements">
                            <h3>Measurements</h3>
                            <div class="measurement-grid">
                                ${diamond.meas_length ? `
                                <div class="spec-item">
                                    <span class="spec-label">Length</span>
                                    <span class="spec-value">${diamond.meas_length} mm</span>
                                </div>
                                ` : ''}
                                ${diamond.meas_width ? `
                                <div class="spec-item">
                                    <span class="spec-label">Width</span>
                                    <span class="spec-value">${diamond.meas_width} mm</span>
                                </div>
                                ` : ''}
                                ${diamond.meas_depth ? `
                                <div class="spec-item">
                                    <span class="spec-label">Depth</span>
                                    <span class="spec-value">${diamond.meas_depth} mm</span>
                                </div>
                                ` : ''}
                                ${diamond.depth_percent ? `
                                <div class="spec-item">
                                    <span class="spec-label">Depth %</span>
                                    <span class="spec-value">${diamond.depth_percent}%</span>
                                </div>
                                ` : ''}
                                ${diamond.table_percent ? `
                                <div class="spec-item">
                                    <span class="spec-label">Table %</span>
                                    <span class="spec-value">${diamond.table_percent}%</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}
                    </section>
                </div>
            </div>
        </div>
    `;
    
    productDetail.innerHTML = html;
    productDetail.style.display = 'block';
}

function displayRelatedDiamonds(currentDiamond, allDiamonds) {
    // Filter related diamonds (same shape, similar size, different from current)
    const related = allDiamonds
        .filter(d => d.diamond_id !== currentDiamond.diamond_id)
        .filter(d => d.shape === currentDiamond.shape)
        .slice(0, 4);
    
    if (related.length === 0) return;
    
    let html = '';
    related.forEach(diamond => {
        const hasImage = diamond.has_image_file && diamond.image_file;
        const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.cut || ''} Cut ${diamond.shape || ''} Diamond`.trim();
        
        html += `
            <div class="diamond-card" onclick="viewDiamond(${diamond.diamond_id})" style="cursor: pointer;">
                ${hasImage ? `
                    <div class="diamond-image">
                        ${diamond.size ? `<span class="cert-badge">${diamond.size}</span>` : ''}
                        <img src="${diamond.image_file}" alt="${diamondName}" loading="lazy" />
                    </div>
                ` : '<div class="diamond-image-placeholder">No Image Available</div>'}
                
                <div class="diamond-info">
                    <h3>${diamondName}</h3>
                    <div class="diamond-price">
                        Rs. ${diamond.total_sales_price_in_currency?.toLocaleString() || diamond.total_sales_price?.toLocaleString() || '199.99'}
                    </div>
                </div>
            </div>
        `;
    });
    
    relatedGrid.innerHTML = html;
    relatedProducts.style.display = 'block';
}

function viewDiamond(diamondId) {
    const searchResults = sessionStorage.getItem('searchResults');
    if (searchResults) {
        const allDiamonds = JSON.parse(searchResults);
        const diamond = allDiamonds.find(d => d.diamond_id === diamondId);
        if (diamond) {
            sessionStorage.setItem('currentDiamond', JSON.stringify(diamond));
            window.location.href = `product.html?id=${diamondId}`;
        }
    }
}

function openVideoModal(videoUrl, diamondName) {
    // Remove existing modal if any
    const existingModal = document.getElementById('videoModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'videoModal';
    modal.className = 'video-modal';
    modal.style.display = 'flex';
    
    // Check if it's a video file or iframe URL
    const isVideoFile = videoUrl.match(/\.(mp4|webm|ogg)$/i);
    
    modal.innerHTML = `
        <div class="video-modal-content">
            <div class="video-modal-header">
                <h3>${diamondName}</h3>
                <button class="video-modal-close" onclick="closeVideoModal()">&times;</button>
            </div>
            <div class="video-modal-body">
                ${isVideoFile ? `
                    <video controls autoplay>
                        <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                ` : `
                    <iframe src="${videoUrl}" frameborder="0" allowfullscreen allow="autoplay"></iframe>
                `}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideoModal();
        }
    });
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}
