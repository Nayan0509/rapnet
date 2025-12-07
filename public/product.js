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
        <div class="product-layout">
            <div class="product-gallery">
                <div class="product-main-image">
                    ${hasImage ? `
                        <img src="${diamond.image_file}" alt="${diamondName}" />
                    ` : `
                        <div class="product-image-placeholder">No Image Available</div>
                    `}
                </div>
                ${hasVideo ? `
                    <button class="product-video-btn" onclick="openVideoModal('${diamond.video_url}', '${diamondName.replace(/'/g, "\\'")}')">
                        📹 Watch 360° Video
                    </button>
                ` : ''}
            </div>
            
            <div class="product-info">
                <div class="product-badges">
                    ${diamond.lab ? `<span class="badge badge-cert">${diamond.lab} Certified</span>` : ''}
                    ${diamond.eye_clean === 'Yes' ? `<span class="badge badge-eye-clean">Eye Clean</span>` : ''}
                </div>
                
                <h1 class="product-title">${diamondName}</h1>
                <p class="product-stock">Stock #: ${diamond.stock_num || 'N/A'} | Certificate #: ${diamond.cert_num || 'N/A'}</p>
                
                <div class="product-price">
                    ${diamond.currency_symbol || '$'}${diamond.total_sales_price_in_currency?.toLocaleString() || diamond.total_sales_price?.toLocaleString() || 'N/A'}
                </div>
                ${diamond.currency_code && diamond.currency_code !== 'USD' ? `
                    <div class="product-price-usd">
                        Approximately $${diamond.total_sales_price?.toLocaleString()} USD
                    </div>
                ` : ''}
                
                <div class="product-specs-grid">
                    <div class="spec-item">
                        <span class="spec-label">Shape</span>
                        <span class="spec-value">${diamond.shape || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Carat Weight</span>
                        <span class="spec-value">${diamond.size || 'N/A'} ct</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Color</span>
                        <span class="spec-value">${diamond.color || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Clarity</span>
                        <span class="spec-value">${diamond.clarity || 'N/A'}</span>
                    </div>
                    ${diamond.cut ? `
                    <div class="spec-item">
                        <span class="spec-label">Cut Grade</span>
                        <span class="spec-value">${diamond.cut}</span>
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
                
                ${diamond.meas_length || diamond.meas_width || diamond.meas_depth ? `
                <div class="product-measurements">
                    <h3>📏 Measurements</h3>
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
                        ${diamond.ratio ? `
                        <div class="spec-item">
                            <span class="spec-label">Ratio</span>
                            <span class="spec-value">${diamond.ratio}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                
                ${diamond.girdle_min || diamond.culet_size || diamond.shade || diamond.milky ? `
                <div class="product-additional">
                    <h3>ℹ️ Additional Information</h3>
                    <div class="additional-grid">
                        ${diamond.girdle_min ? `
                        <div class="additional-item">
                            <span class="label">Girdle:</span>
                            <span class="value">${diamond.girdle_min}${diamond.girdle_max ? ' - ' + diamond.girdle_max : ''}</span>
                        </div>
                        ` : ''}
                        ${diamond.culet_size ? `
                        <div class="additional-item">
                            <span class="label">Culet:</span>
                            <span class="value">${diamond.culet_size}</span>
                        </div>
                        ` : ''}
                        ${diamond.shade && diamond.shade !== 'Unknown' ? `
                        <div class="additional-item">
                            <span class="label">Shade:</span>
                            <span class="value">${diamond.shade}</span>
                        </div>
                        ` : ''}
                        ${diamond.milky && diamond.milky !== 'Unknown' ? `
                        <div class="additional-item">
                            <span class="label">Milky:</span>
                            <span class="value">${diamond.milky}</span>
                        </div>
                        ` : ''}
                        ${diamond.rough_source ? `
                        <div class="additional-item">
                            <span class="label">Origin:</span>
                            <span class="value">${diamond.rough_source}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
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
        const hasVideo = diamond.has_video && diamond.video_url;
        const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.cut || ''} Cut ${diamond.shape || ''} Diamond`.trim();
        
        html += `
            <div class="diamond-card" onclick="viewDiamond(${diamond.diamond_id})" style="cursor: pointer;">
                ${hasImage ? `
                    <div class="diamond-image">
                        ${diamond.lab ? `<span class="cert-badge">${diamond.lab}</span>` : ''}
                        <img src="${diamond.image_file}" alt="${diamondName}" loading="lazy" />
                        ${hasVideo ? '<span class="video-badge">📹 360° View</span>' : ''}
                    </div>
                ` : '<div class="diamond-image-placeholder">No Image Available</div>'}
                
                <div class="diamond-info">
                    <h3>${diamondName}</h3>
                    
                    <div class="diamond-price">
                        ${diamond.currency_symbol || '$'}${diamond.total_sales_price_in_currency?.toLocaleString() || diamond.total_sales_price?.toLocaleString() || 'N/A'}
                        ${diamond.currency_code && diamond.currency_code !== 'USD' ? `<span class="price-usd">($${diamond.total_sales_price?.toLocaleString()})</span>` : ''}
                    </div>
                    
                    <div class="diamond-specs">
                        <div class="spec-row">
                            <span class="label">Color:</span>
                            <span class="value">${diamond.color || 'N/A'}</span>
                        </div>
                        <div class="spec-row">
                            <span class="label">Clarity:</span>
                            <span class="value">${diamond.clarity || 'N/A'}</span>
                        </div>
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
    const modal = document.createElement('div');
    modal.id = 'videoModal';
    modal.className = 'video-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="video-modal-content">
            <div class="video-modal-header">
                <h3>${diamondName}</h3>
                <button class="video-modal-close" onclick="closeVideoModal()">&times;</button>
            </div>
            <div class="video-modal-body">
                <iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}
