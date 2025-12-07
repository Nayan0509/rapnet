const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const results = document.getElementById('results');

let currentPage = 1;
let currentSearchParams = null;
let totalDiamonds = 0;

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
    // Hide previous results and errors
    error.style.display = 'none';
    if (pageNumber === 1) {
        results.innerHTML = '';
    }
    loading.style.display = 'block';

    // Gather form data
    const searchParams = {
        search_type: document.getElementById('searchType').value,
        shapes: ["Round", "Pear", "Princess", "Marquise", "Oval", "Radiant", "Emerald", "Heart", "Cushion", "Asscher"],
        labs: ["GIA", "IGI", "NONE"],
        fluorescence_intensities: ["Faint"],
        fluorescence_colors: ["Blue", "Yellow", "Green", "Red", "Orange", "White"],
        size_from: document.getElementById('sizeFrom').value,
        size_to: document.getElementById('sizeTo').value,
        color_from: document.getElementById('colorFrom').value,
        color_to: document.getElementById('colorTo').value,
        clarity_from: document.getElementById('clarityFrom').value,
        clarity_to: document.getElementById('clarityTo').value,
        price_total_from: document.getElementById('priceFrom').value,
        price_total_to: document.getElementById('priceTo').value,
        fancy_color_intensity_from: "",
        fancy_color_intensity_to: "",
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
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoIframe');
    const title = document.getElementById('videoTitle');
    
    title.textContent = diamondName;
    iframe.src = videoUrl;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoIframe');
    
    iframe.src = '';
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
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
    
    // Store search results for product page
    sessionStorage.setItem('searchResults', JSON.stringify(diamonds));
    
    // Add pagination
    if (totalPages > 1) {
        html += '<div class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})">← Previous</button>`;
        } else {
            html += `<button class="page-btn disabled" disabled>← Previous</button>`;
        }
        
        // Page numbers
        html += '<div class="page-numbers">';
        
        // Always show first page
        if (currentPage > 3) {
            html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
            if (currentPage > 4) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        // Show pages around current page
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                html += `<button class="page-btn active">${i}</button>`;
            } else {
                html += `<button class="page-btn" onclick="goToPage(${i})">${i}</button>`;
            }
        }
        
        // Always show last page
        if (currentPage < totalPages - 2) {
            if (currentPage < totalPages - 3) {
                html += `<span class="page-ellipsis">...</span>`;
            }
            html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        html += '</div>';
        
        // Next button
        if (currentPage < totalPages) {
            html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">Next →</button>`;
        } else {
            html += `<button class="page-btn disabled" disabled>Next →</button>`;
        }
        
        html += '</div>';
    }
    
    results.innerHTML = html;
}
