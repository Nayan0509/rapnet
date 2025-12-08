const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const results = document.getElementById('results');

let currentPage = 1;
let currentSearchParams = null;
let totalDiamonds = 0;

// Shape selection
document.querySelectorAll('.shape-item').forEach(item => {
    item.addEventListener('click', () => {
        item.classList.toggle('active');
    });
});

// Color selection
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
    });
});

// Clarity selection
document.querySelectorAll('.clarity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
    });
});

// Helper functions
function selectAllShapes() {
    document.querySelectorAll('.shape-item').forEach(item => {
        item.classList.add('active');
    });
}

function setSizeRange(from, to) {
    document.getElementById('sizeFrom').value = from;
    document.getElementById('sizeTo').value = to;
}

function setFinish(preset) {
    const finishMap = {
        '3X': { cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent' },
        'EX-': { cut: 'Excellent', polish: 'Very Good', symmetry: 'Very Good' },
        'VG+': { cut: 'Very Good', polish: 'Excellent', symmetry: 'Excellent' },
        'VG-': { cut: 'Very Good', polish: 'Good', symmetry: 'Good' }
    };
    
    const finish = finishMap[preset];
    if (finish) {
        document.getElementById('cutFrom').value = finish.cut;
        document.getElementById('cutTo').value = finish.cut;
        document.getElementById('polishFrom').value = finish.polish;
        document.getElementById('polishTo').value = finish.polish;
        document.getElementById('symmetryFrom').value = finish.symmetry;
        document.getElementById('symmetryTo').value = finish.symmetry;
    }
}

// Get selected shapes
function getSelectedShapes() {
    const shapes = [];
    document.querySelectorAll('.shape-item.active').forEach(item => {
        shapes.push(item.dataset.shape);
    });
    // Return all shapes if none selected
    return shapes.length > 0 ? shapes : ["Round", "Pear", "Princess", "Marquise", "Oval", "Radiant", "Emerald", "Heart", "Cushion", "Asscher"];
}

// Get selected colors
function getSelectedColors() {
    const colors = [];
    document.querySelectorAll('.color-btn.active').forEach(btn => {
        colors.push(btn.dataset.color);
    });
    
    // Return all colors if none selected
    if (colors.length === 0) return { from: 'D', to: 'Z' };
    
    const colorOrder = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
    const sortedColors = colors.sort((a, b) => colorOrder.indexOf(a) - colorOrder.indexOf(b));
    
    return {
        from: sortedColors[0],
        to: sortedColors[sortedColors.length - 1]
    };
}

// Get selected clarity
function getSelectedClarity() {
    const clarities = [];
    document.querySelectorAll('.clarity-btn.active').forEach(btn => {
        clarities.push(btn.dataset.clarity);
    });
    
    // Return all clarities if none selected
    if (clarities.length === 0) return { from: 'FL', to: 'I3' };
    
    const clarityOrder = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'SI3', 'I1', 'I2', 'I3'];
    const sortedClarities = clarities.sort((a, b) => clarityOrder.indexOf(a) - clarityOrder.indexOf(b));
    
    return {
        from: sortedClarities[0],
        to: sortedClarities[sortedClarities.length - 1]
    };
}

// Get checked values from checkbox group
function getCheckedValues(containerId) {
    const values = [];
    document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`).forEach(cb => {
        values.push(cb.value);
    });
    return values;
}

// Get labs
function getSelectedLabs() {
    const labs = getCheckedValues('labCheckboxes');
    // Return all labs if none selected
    return labs.length > 0 ? labs : ["GIA", "IGI", "HRD", "AGS", "GCAL", "NONE"];
}

// Get fluorescence
function getFluorescenceIntensities() {
    const intensities = getCheckedValues('fluorIntensity');
    // Return all intensities if none selected
    return intensities.length > 0 ? intensities : ["None", "Faint", "Very Slight", "Slight", "Medium", "Strong", "Very Strong"];
}

function getFluorescenceColors() {
    const colors = getCheckedValues('fluorColor');
    // Return all colors if none selected
    return colors.length > 0 ? colors : ["Blue", "Yellow", "Green", "Red", "Orange", "White"];
}

searchBtn.addEventListener('click', () => {
    currentPage = 1;
    searchDiamonds();
});

// Load initial diamonds on page load
window.addEventListener('DOMContentLoaded', () => {
    currentPage = 1;
    searchDiamonds();
});

async function searchDiamonds(pageNumber = currentPage) {
    error.style.display = 'none';
    if (pageNumber === 1) {
        results.innerHTML = '';
    }
    loading.style.display = 'block';

    const colors = getSelectedColors();
    const clarity = getSelectedClarity();
    const sizeFrom = document.getElementById('sizeFrom').value;
    const sizeTo = document.getElementById('sizeTo').value;
    const priceFrom = document.getElementById('priceFrom').value;
    const priceTo = document.getElementById('priceTo').value;
    
    const searchParams = {
        search_type: "White",
        shapes: getSelectedShapes(),
        labs: getSelectedLabs(),
        fluorescence_intensities: getFluorescenceIntensities(),
        fluorescence_colors: getFluorescenceColors(),
        size_from: sizeFrom || "0.01",
        size_to: sizeTo || "99",
        color_from: colors.from,
        color_to: colors.to,
        clarity_from: clarity.from,
        clarity_to: clarity.to,
        price_total_from: priceFrom || "1",
        price_total_to: priceTo || "99999999",
        fancy_color_intensity_from: document.getElementById('fancyIntensityFrom').value || "",
        fancy_color_intensity_to: document.getElementById('fancyIntensityTo').value || "",
        cut_from: document.getElementById('cutFrom').value || "",
        cut_to: document.getElementById('cutTo').value || "",
        polish_from: document.getElementById('polishFrom').value || "",
        polish_to: document.getElementById('polishTo').value || "",
        symmetry_from: document.getElementById('symmetryFrom').value || "",
        symmetry_to: document.getElementById('symmetryTo').value || "",
        eye_clean: document.getElementById('eyeClean').value || "",
        sort_by: "Price",
        sort_direction: "Asc",
        page_number: pageNumber.toString(),
        page_size: document.getElementById('pageSize').value
    };

    currentSearchParams = searchParams;
    currentPage = pageNumber;

    try {
        const response = await fetch('/api/diamonds/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchParams)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayResults(data);
    } catch (err) {
        console.error('Search error:', err);
        error.textContent = `Error: ${err.message}`;
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function goToPage(page) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    searchDiamonds(page);
}

function openVideoModal(videoUrl, diamondName) {
    // Remove existing modal if any
    let modal = document.getElementById('videoModal');
    if (modal) {
        modal.remove();
    }
    
    // Create new modal
    modal = document.createElement('div');
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

window.onclick = function (event) {
    const modal = document.getElementById("videoModal");
    if (event.target === modal) {
        closeVideoModal();
    }
};

function viewDiamond(diamondId) {
    const searchResults = sessionStorage.getItem("searchResults");
    if (searchResults) {
        const allDiamonds = JSON.parse(searchResults);
        const diamond = allDiamonds.find((d) => d.diamond_id === diamondId);
        if (diamond) {
            sessionStorage.setItem("currentDiamond", JSON.stringify(diamond));
            window.location.href = `product.html?id=${diamondId}`;
        }
    }
}

function displayResults(data) {
    const diamonds = data?.response?.body?.diamonds || [];
    
    if (diamonds.length === 0) {
        results.innerHTML = '<div class="no-results">No diamonds found matching your criteria.</div>';
        return;
    }

    const searchResults = data?.response?.body?.search_results || {};
    totalDiamonds = searchResults.total_diamonds_found || diamonds.length;
    const pageSize = parseInt(currentSearchParams.page_size);
    const totalPages = Math.ceil(totalDiamonds / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalDiamonds);
    
    let html = `
        <div class="results-header">
            <h2>Found ${totalDiamonds.toLocaleString()} Diamonds</h2>
            <p class="results-info">Showing ${startIndex}-${endIndex} of ${totalDiamonds.toLocaleString()} results</p>
        </div>
    `;
    
    html += '<div class="diamond-grid">';

    diamonds.forEach(diamond => {
        const hasImage = diamond.has_image_file && diamond.image_file;
        const hasVideo = diamond.has_video && diamond.video_url;
        const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.cut || ''} Cut ${diamond.shape || ''} Diamond`.trim();
        
        html += `
            <div class="diamond-card" onclick="viewDiamond(${diamond.diamond_id})" style="cursor: pointer;">
                ${hasImage ? `
                    <div class="diamond-image">
                        ${diamond.lab ? `<span class="cert-badge">${diamond.lab}</span>` : ''}
                        <img src="${diamond.image_file}" alt="${diamondName}" loading="lazy" />
                        ${hasVideo ? `
                            <div class="video-play-icon" onclick="event.stopPropagation(); openVideoModal('${diamond.video_url}', '${diamondName.replace(/'/g, "\\'")}')">
                                <svg viewBox="0 0 24 24" fill="white">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                        ` : ''}
                    </div>
                ` : hasVideo ? `
                    <div class="diamond-image diamond-video-preview" onclick="event.stopPropagation(); openVideoModal('${diamond.video_url}', '${diamondName.replace(/'/g, "\\'")}')">
                        ${diamond.lab ? `<span class="cert-badge">${diamond.lab}</span>` : ''}
                        <div class="video-play-icon-large">
                            <svg viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                        <span class="video-text">Click to Play Video</span>
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
                        ${diamond.cut ? `
                        <div class="spec-row">
                            <span class="label">Cut:</span>
                            <span class="value">${diamond.cut}</span>
                        </div>
                        ` : ''}
                        <div class="spec-row">
                            <span class="label">Lab:</span>
                            <span class="value">${diamond.lab || 'N/A'}</span>
                        </div>
                        <div class="spec-row">
                            <span class="label">Cert #:</span>
                            <span class="value cert-num">${diamond.cert_num || 'N/A'}</span>
                        </div>
                        ${diamond.fluor_intensity ? `
                        <div class="spec-row">
                            <span class="label">Fluor:</span>
                            <span class="value">${diamond.fluor_intensity}</span>
                        </div>
                        ` : ''}
                        ${diamond.eye_clean ? `
                        <div class="spec-row">
                            <span class="label">Eye Clean:</span>
                            <span class="value">${diamond.eye_clean}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${hasVideo ? `
                    <button class="video-link" onclick="event.stopPropagation(); openVideoModal('${diamond.video_url}', '${diamondName.replace(/'/g, "\\'")}')">
                        View 360° Video
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    });

    html += '</div>';
    
    sessionStorage.setItem('searchResults', JSON.stringify(diamonds));
    
    if (totalPages > 1) {
        html += '<div class="pagination">';
        
        if (currentPage > 1) {
            html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})">← Previous</button>`;
        } else {
            html += `<button class="page-btn disabled" disabled>← Previous</button>`;
        }
        
        html += '<div class="page-numbers">';
        
        if (currentPage > 3) {
            html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
            if (currentPage > 4) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                html += `<button class="page-btn active">${i}</button>`;
            } else {
                html += `<button class="page-btn" onclick="goToPage(${i})">${i}</button>`;
            }
        }
        
        if (currentPage < totalPages - 2) {
            if (currentPage < totalPages - 3) {
                html += `<span class="page-ellipsis">...</span>`;
            }
            html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        html += '</div>';
        
        if (currentPage < totalPages) {
            html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">Next →</button>`;
        } else {
            html += `<button class="page-btn disabled" disabled>Next →</button>`;
        }
        
        html += '</div>';
    }
    
    results.innerHTML = html;
}
