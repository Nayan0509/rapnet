/**
 * Diamond Search - Collection Grid Style
 * Generates the exact same HTML structure as your collection.liquid
 */

(function() {
  'use strict';

  const API_ENDPOINT = window.DIAMOND_API_ENDPOINT || 'https://rapnet.vercel.app/api/diamonds/search';
  
  let currentPage = 1;
  let currentSearchParams = null;
  let totalDiamonds = 0;

  // Wizard state
  let wizardState = {
    origin: null,
    shape: null,
    budget: null,
    preference: null
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    setupEventListeners();
    setupWizard();
    searchDiamonds();
  }

  function setupEventListeners() {
    document.querySelectorAll('.shape-item').forEach(item => {
      item.addEventListener('click', () => item.classList.toggle('active'));
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => btn.classList.toggle('active'));
    });

    document.querySelectorAll('.clarity-btn').forEach(btn => {
      btn.addEventListener('click', () => btn.classList.toggle('active'));
    });

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        currentPage = 1;
        searchDiamonds();
      });
    }

    // Setup price slider
    setupPriceSlider();
  }

  // ========================================
  // WIZARD FUNCTIONALITY
  // ========================================
  
  function setupWizard() {
    const modal = document.getElementById('diamondWizardModal');
    const openBtn = document.getElementById('openWizardBtn');
    const closeBtn = document.getElementById('closeWizardBtn');
    const overlay = modal?.querySelector('.wizard-overlay');
    
    if (!modal || !openBtn) return;
    
    // Open wizard
    openBtn.addEventListener('click', () => {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      resetWizard();
    });
    
    // Close wizard
    const closeWizard = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };
    
    closeBtn?.addEventListener('click', closeWizard);
    overlay?.addEventListener('click', closeWizard);
    
    // Slide 1: Origin selection (auto-select Natural and enable next)
    document.querySelectorAll('.origin-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.origin-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        wizardState.origin = card.dataset.origin;
        document.getElementById('wizardNextBtn1').disabled = false;
      });
    });
    
    // Slide 2: Shape selection (MULTIPLE selection allowed)
    document.querySelectorAll('.wizard-shape-item').forEach(item => {
      item.addEventListener('click', () => {
        // Toggle selection instead of single select
        item.classList.toggle('selected');
        
        // Get all selected shapes
        const selectedShapes = Array.from(document.querySelectorAll('.wizard-shape-item.selected'))
          .map(el => el.dataset.shape);
        
        wizardState.shapes = selectedShapes;
        
        // Enable next button if at least one shape is selected
        document.getElementById('wizardNextBtn2').disabled = selectedShapes.length === 0;
      });
    });
    
    // Slide 3: Budget and preference
    const budgetInput = document.getElementById('wizardBudget');
    budgetInput?.addEventListener('input', checkSlide3Complete);
    
    document.querySelectorAll('.preference-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preference-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        wizardState.preference = btn.dataset.preference;
        checkSlide3Complete();
      });
    });
    
    // Navigation buttons
    document.getElementById('wizardNextBtn1')?.addEventListener('click', () => goToSlide(2));
    document.getElementById('wizardNextBtn2')?.addEventListener('click', () => goToSlide(3));
    document.getElementById('wizardBackBtn2')?.addEventListener('click', () => goToSlide(1));
    document.getElementById('wizardBackBtn3')?.addEventListener('click', () => goToSlide(2));
    document.getElementById('wizardViewResults')?.addEventListener('click', applyWizardFilters);
  }
  
  function checkSlide3Complete() {
    const budget = document.getElementById('wizardBudget')?.value;
    const viewResultsBtn = document.getElementById('wizardViewResults');
    
    if (budget && parseFloat(budget) >= 10000 && wizardState.preference) {
      wizardState.budget = parseFloat(budget);
      viewResultsBtn.disabled = false;
    } else {
      viewResultsBtn.disabled = true;
    }
  }
  
  function goToSlide(slideNumber) {
    // Update slides
    document.querySelectorAll('.wizard-slide').forEach(slide => {
      slide.classList.remove('active');
    });
    document.querySelector(`.wizard-slide[data-slide="${slideNumber}"]`)?.classList.add('active');
    
    // Update progress tabs
    document.querySelectorAll('.progress-tab').forEach((tab, index) => {
      tab.classList.remove('active', 'completed');
      const tabStep = index + 1;
      
      if (tabStep < slideNumber) {
        tab.classList.add('completed');
      } else if (tabStep === slideNumber) {
        tab.classList.add('active');
      }
    });
    
    // Update progress labels
    document.querySelectorAll('.progress-labels span').forEach((label, index) => {
      label.classList.remove('active');
      if (index + 1 === slideNumber) {
        label.classList.add('active');
      }
    });
  }
  
  function resetWizard() {
    wizardState = {
      origin: 'natural', // Auto-select natural
      shapes: [], // Changed from shape to shapes (array)
      budget: null,
      preference: null
    };
    
    goToSlide(1);
    
    // Auto-select Natural origin
    document.querySelectorAll('.origin-card').forEach(c => c.classList.remove('selected'));
    const naturalCard = document.querySelector('.origin-card[data-origin="natural"]');
    if (naturalCard) {
      naturalCard.classList.add('selected');
      document.getElementById('wizardNextBtn1').disabled = false;
    }
    
    document.querySelectorAll('.wizard-shape-item').forEach(i => i.classList.remove('selected'));
    document.querySelectorAll('.preference-btn').forEach(b => b.classList.remove('selected'));
    
    document.getElementById('wizardBudget').value = '';
    document.getElementById('wizardNextBtn2').disabled = true;
    document.getElementById('wizardViewResults').disabled = true;
  }
  
  function applyWizardFilters() {
    const modal = document.getElementById('diamondWizardModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Calculate price range with 10% buffer (increased from 10% for more results)
    const budget = wizardState.budget;
    const priceFrom = Math.floor(budget * 0.9);
    const priceTo = Math.ceil(budget * 1.1);
    
    // Set price filters
    const priceFromSlider = document.getElementById('priceFromSlider');
    const priceToSlider = document.getElementById('priceToSlider');
    const priceFromInput = document.getElementById('priceFromInput');
    const priceToInput = document.getElementById('priceToInput');
    
    if (priceFromSlider && priceToSlider) {
      priceFromSlider.value = priceFrom;
      priceToSlider.value = priceTo;
      priceFromInput.value = priceFrom;
      priceToInput.value = priceTo;
      priceFromSlider.dispatchEvent(new Event('input'));
    }
    
    // Clear and set shapes (multiple)
    document.querySelectorAll('.shape-item').forEach(item => item.classList.remove('active'));
    wizardState.shapes.forEach(shapeName => {
      const shapeItem = document.querySelector(`.shape-item[data-shape="${shapeName}"]`);
      if (shapeItem) {
        shapeItem.classList.add('active');
      }
    });
    
    // Determine rating range based on preference
    let ratingFrom, ratingTo;
    const hasRound = wizardState.shapes.includes('Round');
    
    if (wizardState.preference === 'size') {
      ratingFrom = 6.5;  // Slightly lower to include more diamonds
      ratingTo = 7.74;
    } else if (wizardState.preference === 'balance') {
      ratingFrom = 7.5;  // Slightly lower to include more diamonds
      ratingTo = 8.59;
    } else { // quality
      ratingFrom = 8.4;  // Slightly lower to include more diamonds
      ratingTo = 10;
    }
    
    // Store wizard preferences for filtering
    window.wizardPreferences = {
      ratingFrom,
      ratingTo,
      hasRound,
      shapes: wizardState.shapes,
      preference: wizardState.preference,
      budget: budget
    };
    
    // Scroll to results
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Trigger search
    currentPage = 1;
    searchDiamonds();
  }

  function setupPriceSlider() {
    const priceFromSlider = document.getElementById('priceFromSlider');
    const priceToSlider = document.getElementById('priceToSlider');
    const priceFromInput = document.getElementById('priceFromInput');
    const priceToInput = document.getElementById('priceToInput');
    const sliderRange = document.getElementById('sliderRange');

    if (!priceFromSlider || !priceToSlider) return;

    const maxPrice = 10000000;

    function updateSlider() {
      let minVal = parseInt(priceFromSlider.value);
      let maxVal = parseInt(priceToSlider.value);

      // Ensure min doesn't exceed max
      if (minVal > maxVal - 10000) {
        if (this === priceFromSlider) {
          minVal = maxVal - 10000;
          priceFromSlider.value = minVal;
        } else {
          maxVal = minVal + 10000;
          priceToSlider.value = maxVal;
        }
      }

      // Update input values
      if (priceFromInput) priceFromInput.value = minVal;
      if (priceToInput) priceToInput.value = maxVal;

      // Update colored range
      const percentMin = (minVal / maxPrice) * 100;
      const percentMax = (maxVal / maxPrice) * 100;
      sliderRange.style.left = percentMin + '%';
      sliderRange.style.width = (percentMax - percentMin) + '%';
    }

    function updateFromInput() {
      let minVal = parseInt(priceFromInput.value) || 0;
      let maxVal = parseInt(priceToInput.value) || maxPrice;

      // Ensure valid range
      if (minVal < 0) minVal = 0;
      if (maxVal > maxPrice) maxVal = maxPrice;
      if (minVal > maxVal - 10000) minVal = maxVal - 10000;

      priceFromSlider.value = minVal;
      priceToSlider.value = maxVal;
      priceFromInput.value = minVal;
      priceToInput.value = maxVal;

      // Update colored range
      const percentMin = (minVal / maxPrice) * 100;
      const percentMax = (maxVal / maxPrice) * 100;
      sliderRange.style.left = percentMin + '%';
      sliderRange.style.width = (percentMax - percentMin) + '%';
    }

    priceFromSlider.addEventListener('input', updateSlider);
    priceToSlider.addEventListener('input', updateSlider);
    
    if (priceFromInput) {
      priceFromInput.addEventListener('change', updateFromInput);
      priceFromInput.addEventListener('blur', updateFromInput);
    }
    
    if (priceToInput) {
      priceToInput.addEventListener('change', updateFromInput);
      priceToInput.addEventListener('blur', updateFromInput);
    }

    updateSlider();
  }

  window.selectAllShapes = function() {
    document.querySelectorAll('.shape-item').forEach(item => item.classList.add('active'));
  };

  window.resetAllFilters = function() {
    // Clear all shape selections
    document.querySelectorAll('.shape-item').forEach(item => item.classList.remove('active'));
    
    // Clear all color selections
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    
    // Clear all clarity selections
    document.querySelectorAll('.clarity-btn').forEach(btn => btn.classList.remove('active'));
    
    // Reset size inputs
    document.getElementById('sizeFrom').value = '';
    document.getElementById('sizeTo').value = '';
    
    // Reset price sliders to 0-2 lacs default
    const priceFromSlider = document.getElementById('priceFromSlider');
    const priceToSlider = document.getElementById('priceToSlider');
    const priceFromInput = document.getElementById('priceFromInput');
    const priceToInput = document.getElementById('priceToInput');
    if (priceFromSlider && priceToSlider) {
      priceFromSlider.value = 0;
      priceToSlider.value = 1000000;
      if (priceFromInput) priceFromInput.value = 0;
      if (priceToInput) priceToInput.value = 1000000;
      // Trigger update
      priceFromSlider.dispatchEvent(new Event('input'));
    }
    
    // Check all fluorescence checkboxes
    document.querySelectorAll('[id^="fluor-"]').forEach(cb => cb.checked = true);
    
    // Check default lab certifications
    document.querySelectorAll('#labCheckboxes input[type="checkbox"]').forEach(cb => {
      cb.checked = cb.value === 'GIA';
    });
    
    // Reset to page 1 and search
    currentPage = 1;
    searchDiamonds();
  };
  window.setSizeRange = function(from, to) {
    document.getElementById('sizeFrom').value = from;
    document.getElementById('sizeTo').value = to;
  };

  function getSelectedShapes() {
    const shapes = [];
    document.querySelectorAll('.shape-item.active').forEach(item => shapes.push(item.dataset.shape));
    return shapes.length > 0 ? shapes : ["Round", "Pear", "Princess", "Marquise", "Oval", "Radiant", "Emerald", "Heart", "Cushion", "Asscher"];
  }

  function getSelectedColors() {
    const colors = [];
    document.querySelectorAll('.color-btn.active').forEach(btn => colors.push(btn.dataset.color));
    if (colors.length === 0) return { from: 'D', to: 'Z' };
    const colorOrder = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
    const sortedColors = colors.sort((a, b) => colorOrder.indexOf(a) - colorOrder.indexOf(b));
    return { from: sortedColors[0], to: sortedColors[sortedColors.length - 1] };
  }

  function getSelectedClarity() {
    const clarities = [];
    document.querySelectorAll('.clarity-btn.active').forEach(btn => clarities.push(btn.dataset.clarity));
    if (clarities.length === 0) return { from: 'FL', to: 'I3' };
    const clarityOrder = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'SI3', 'I1', 'I2', 'I3'];
    const sortedClarities = clarities.sort((a, b) => clarityOrder.indexOf(a) - clarityOrder.indexOf(b));
    return { from: sortedClarities[0], to: sortedClarities[sortedClarities.length - 1] };
  }

  function getCheckedValues(containerId) {
    const values = [];
    document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`).forEach(cb => values.push(cb.value));
    return values;
  }

  function getSelectedLabs() {
    const labs = getCheckedValues('labCheckboxes');
    return labs.length > 0 ? labs : ["GIA", "IGI", "HRD", "AGS", "GCAL", "NONE"];
  }

  function getSelectedFluorescence() {
    const fluor = [];
    if (document.getElementById('fluor-none')?.checked) fluor.push('None');
    if (document.getElementById('fluor-faint')?.checked) fluor.push('Faint');
    if (document.getElementById('fluor-vslight')?.checked) fluor.push('Very Slight');
    if (document.getElementById('fluor-slight')?.checked) fluor.push('Slight');
    if (document.getElementById('fluor-medium')?.checked) fluor.push('Medium');
    if (document.getElementById('fluor-strong')?.checked) fluor.push('Strong');
    if (document.getElementById('fluor-vstrong')?.checked) fluor.push('Very Strong');
    return fluor.length > 0 ? fluor : ["None", "Faint", "Very Slight", "Slight", "Medium", "Strong", "Very Strong"];
  }

  async function searchDiamonds(pageNumber = currentPage) {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const results = document.getElementById('results');

    error.style.display = 'none';
    if (pageNumber === 1) results.innerHTML = '';
    loading.style.display = 'block';

    const colors = getSelectedColors();
    const clarity = getSelectedClarity();
    const sizeFrom = document.getElementById('sizeFrom').value;
    const sizeTo = document.getElementById('sizeTo').value;
    const priceFrom = document.getElementById('priceFromInput')?.value || document.getElementById('priceFromSlider')?.value || '0';
    const priceTo = document.getElementById('priceToInput')?.value || document.getElementById('priceToSlider')?.value || '1000000';
    
    const searchParams = {
      search_type: "White",
      shapes: getSelectedShapes(),
      labs: getSelectedLabs(),
      fluorescence_intensities: getSelectedFluorescence(),
      fluorescence_colors: [],
      size_from: sizeFrom || "0.01",
      size_to: sizeTo || "50",
      color_from: colors.from,
      color_to: colors.to,
      clarity_from: clarity.from,
      clarity_to: clarity.to,
      price_total_from: priceFrom,
      price_total_to: priceTo,
      cut_from: "",
      cut_to: "",
      polish_from: "",
      polish_to: "",
      symmetry_from: "",
      symmetry_to: "",
      fancy_color_intensity_from: "",
      fancy_color_intensity_to: "",
      cut_from: "",
      cut_to: "",
      polish_from: "",
      polish_to: "",
      symmetry_from: "",
      symmetry_to: "",
      sort_by: "Price",
      sort_direction: "Desc",
      page_number: pageNumber.toString(),
      page_size: "20"
    };

    currentSearchParams = searchParams;
    currentPage = pageNumber;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  window.goToPage = function(page) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    searchDiamonds(page);
  };

  window.viewDiamond = function(diamondId) {
    const searchResults = sessionStorage.getItem('searchResults');
    if (searchResults) {
      const allDiamonds = JSON.parse(searchResults);
      const diamond = allDiamonds.find(d => d.diamond_id === diamondId);
      if (diamond) {
        sessionStorage.setItem('currentDiamond', JSON.stringify(diamond));
        window.open(`/pages/contact?view=diamond-product&id=${diamondId}`, '_blank');
      }
    }
  };

  /**
   * Calculate diamond rating based on grading attributes
   * Uses grading tables from diamond-grading-tables.js
   * - ROUND diamonds: includes Cut grade - requires cut data
   * - FANCY shapes: no Cut grade
   * Uses individual colors and clarities (no category mapping)
   */
  function calculateDiamondRating(diamond) {
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
      const cut = diamond.cut || '';
      
      // If Round diamond but no cut data, use Fancy table as fallback
      if (!cut || cut === 'N/A' || cut.trim() === '') {
        key = `${color}-${clarity}-${symmetryCategory}-${polishCategory}-${fluorCategory}`;
        const fancyGradingTable = window.FANCY_GRADING_TABLE || {};
        score = fancyGradingTable[key];
      } else {
        let cutCategory = 'N/A';
        if (cut.includes('Excellent') || cut === 'EX') cutCategory = 'EX';
        else if (cut.includes('Very Good') || cut === 'VG') cutCategory = 'VG';
        else if (cut.includes('Good') || cut === 'GOOD' || cut === 'G') cutCategory = 'GOOD';
        else cutCategory = 'POOR';
        
        key = `${color}-${clarity}-${symmetryCategory}-${polishCategory}-${fluorCategory}-${cutCategory}`;
        const roundGradingTable = window.ROUND_GRADING_TABLE || {};
        score = roundGradingTable[key];
      }
    } else {
      key = `${color}-${clarity}-${symmetryCategory}-${polishCategory}-${fluorCategory}`;
      const fancyGradingTable = window.FANCY_GRADING_TABLE || {};
      score = fancyGradingTable[key];
    }
    
    return score ? parseFloat(score).toFixed(2) : null;
  }

  /**
   * Generate rating bar HTML - premium enterprise styling
   */
  function generateRatingBar(rating) {
    if (!rating) return '';
    
    const ratingNum = parseFloat(rating);
    const percentage = (ratingNum / 10) * 100;
    
    return `
      <div class="diamond-rating">
        <span class="rating-label">Rating</span>
        <span class="rating-value">${rating}<span style="font-size: 12px; font-weight: 400; color: #999; margin-left: 3px;">/10</span></span>
      </div>
    `;
  }

  function displayResults(data) {
    const results = document.getElementById('results');
    let diamonds = data?.response?.body?.diamonds || [];
    
    if (diamonds.length === 0) {
      results.innerHTML = '<div style="text-align: center; padding: 60px 20px;">No diamonds found matching your criteria.</div>';
      updateTotalValue(0, 0);
      return;
    }
    
    // Calculate rating for each diamond
    diamonds = diamonds.map(diamond => {
      const rating = calculateDiamondRating(diamond);
      return { ...diamond, calculatedRating: rating ? parseFloat(rating) : 0 };
    });
    
    // Apply wizard rating filter if active
    if (window.wizardPreferences) {
      const { ratingFrom, ratingTo, hasRound, shapes, preference, budget } = window.wizardPreferences;
      
      // Filter by rating range
      diamonds = diamonds.filter(d => {
        const rating = d.calculatedRating;
        return rating >= ratingFrom && rating <= ratingTo;
      });
      
      // For ROUND diamonds (if Round is in selected shapes), filter by cut grade "Very Good Plus"
      if (hasRound) {
        diamonds = diamonds.map(d => {
          const shape = (d.shape || '').toUpperCase();
          const isRound = shape === 'ROUND' || shape === 'RD' || shape.includes('ROUND');
          
          if (isRound) {
            const cut = (d.cut || '').toUpperCase();
            const hasGoodCut = cut.includes('VERY GOOD') || cut.includes('VG') || 
                               cut.includes('EXCELLENT') || cut.includes('EX') || 
                               cut.includes('IDEAL');
            return { ...d, passesFilter: hasGoodCut };
          }
          return { ...d, passesFilter: true };
        }).filter(d => d.passesFilter);
      }
      
      // Sort by size (descending) to get highest size
      diamonds.sort((a, b) => (b.size || 0) - (a.size || 0));
      
      // Take top 10 diamonds (increased from 5 to show more options)
      const topDiamonds = diamonds.slice(0, 10);
      
      // If we have fewer than 3 diamonds, show a helpful message
      if (topDiamonds.length < 3) {
        console.log(`Only ${topDiamonds.length} diamonds found. Consider adjusting budget or preferences.`);
      }
      
      diamonds = topDiamonds;
    } else {
      // Default: sort by rating (high to low)
      diamonds.sort((a, b) => b.calculatedRating - a.calculatedRating);
    }
    
    // Calculate total value
    const totalValue = diamonds.reduce((sum, d) => sum + (d.total_sales_price_in_currency || d.total_sales_price || 0), 0);
    updateTotalValue(totalValue, diamonds.length);

    const searchResults = data?.response?.body?.search_results || {};
    totalDiamonds = searchResults.total_diamonds_found || diamonds.length;
    const pageSize = parseInt(currentSearchParams.page_size);
    const totalPages = Math.ceil(totalDiamonds / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalDiamonds);
    
    // Use EXACT structure from collection.liquid
    let html = `
      <div class="collection__title title-wrapper" style="text-align: center; margin-bottom: 30px;">
        <h2 class="title">${window.wizardPreferences ? 'Your Top Matches' : `Found ${totalDiamonds.toLocaleString()} Diamonds`}</h2>
        <p class="collection__description subtitle" style="opacity: 0.7;">${window.wizardPreferences ? `Showing ${diamonds.length} diamond${diamonds.length !== 1 ? 's' : ''} matching your preferences (sorted by size)` : `Showing ${startIndex}-${endIndex} of ${totalDiamonds.toLocaleString()} results`}</p>
      </div>
      
      <slider-component class="slider-mobile-gutter">
        <ul
          id="DiamondSlider"
          class="grid product-grid contains-card contains-card--product grid--4-col-desktop grid--2-col-tablet-down"
          role="list"
        >
    `;

    diamonds.forEach((diamond, index) => {
      const hasImage = diamond.has_image_file && diamond.image_file;
      const hasVideo = diamond.has_video && diamond.video_url;
      const diamondName = `${diamond.lab || ''} ${diamond.size || 'N/A'} Carat ${diamond.color || ''}-${diamond.clarity || ''} ${diamond.cut || ''} Cut ${diamond.shape || ''} Diamond`.trim();
      const price = diamond.total_sales_price_in_currency || diamond.total_sales_price || 0;
      
      // Use pre-calculated rating
      const rating = diamond.calculatedRating > 0 ? diamond.calculatedRating.toFixed(2) : null;
      const ratingHTML = generateRatingBar(rating);
      
      // EXACT card structure matching Shopify card-product snippet
      html += `
        <li
          id="Slide-diamond-${index}"
          class="grid__item scroll-trigger animate--slide-in"
          data-cascade
          style="--animation-order: ${index + 1};"
        >
          <div class="card-wrapper product-card-wrapper underline-links-hover">
            <div class="card card--standard card--media" style="--ratio-percent: 100%;">
              <div class="card__inner color-background-2 gradient ratio" style="--ratio-percent: 100%;">
                <div class="card__media">
                  <div class="media media--transparent media--hover-effect" style="padding-bottom: 100%; position: relative;">
                    ${hasVideo && diamond.video_url ? `
                      <iframe
                        src="${diamond.video_url}"
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                        loading="lazy"
                        allowfullscreen
                      ></iframe>
                    ` : hasImage ? `
                      <img
                        srcset="${diamond.image_file}"
                        src="${diamond.image_file}"
                        sizes="(min-width: 1400px) 350px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                        alt="${diamondName}"
                        class="motion-reduce"
                        loading="lazy"
                        width="533"
                        height="533"
                      >
                    ` : `
                      <div class="card__media-placeholder" style="background: rgba(var(--color-foreground), 0.04); display: flex; align-items: center; justify-content: center; height: 100%; position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
                        <span style="opacity: 0.5;">No Image</span>
                      </div>
                    `}
                  </div>
                </div>
                ${diamond.size ? `<div class="card__badge bottom left"><span class="badge badge--bottom-left color-accent-1">${diamond.size} ct</span></div>` : ''}
              </div>
              <div class="card__content">
                <div class="card__information">
                  <h3 class="card__heading h5">
                    <a href="#" onclick="event.preventDefault(); viewDiamond(${diamond.diamond_id});"  target="_blank" class="full-unstyled-link">
                      ${diamondName}
                    </a>
                  </h3>
                  <div class="card-information" style="margin-bottom: 8px;">
                    ${diamond.lab ? `<span class="caption-large light">${diamond.lab} Certified</span>` : ''}
                  </div>
                               <!-- Rating -->
              ${rating ? `
                <div style="margin: 14px 0; padding: 12px 0; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.8px; color: #999; text-transform: uppercase;">Rating</span>
                  <span style="font-size: 18px; font-weight: 700; color: #1a1a1a; font-family: 'Georgia', serif;">${rating}<span style="font-size: 11px; font-weight: 400; color: #999; margin-left: 3px;">/10</span></span>
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

    html += '</ul></slider-component>';
    
    sessionStorage.setItem('searchResults', JSON.stringify(diamonds));
    
    // Pagination (only show if not wizard mode)
    if (!window.wizardPreferences && totalPages > 1) {
      html += '<div class="pagination-wrapper" style="margin-top: 40px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">';
      
      if (currentPage > 1) {
        html += `<a href="#" onclick="event.preventDefault(); goToPage(${currentPage - 1});" class="button button--secondary">
          <svg aria-hidden="true" focusable="false" class="icon icon-caret" viewBox="0 0 10 6">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor"></path>
          </svg>
          Previous
        </a>`;
      }
      
      for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        if (i === currentPage) {
          html += `<span class="button button--primary">${i}</span>`;
        } else {
          html += `<a href="#" onclick="event.preventDefault(); goToPage(${i});" class="button button--secondary">${i}</a>`;
        }
      }
      
      if (currentPage < totalPages) {
        html += `<a href="#" onclick="event.preventDefault(); goToPage(${currentPage + 1});" class="button button--secondary">
          Next
          <svg aria-hidden="true" focusable="false" class="icon icon-caret" viewBox="0 0 10 6">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor"></path>
          </svg>
        </a>`;
      }
      
      html += '</div>';
    }
    
    results.innerHTML = html;
  }

  function updateTotalValue(totalValue, count) {
    const totalValueEl = document.getElementById('totalValue');
    if (totalValueEl) {
      if (count > 0) {
        totalValueEl.innerHTML = `
          <strong>Total Value:</strong> Rs.${totalValue.toLocaleString('en-IN')} 
          <span style="margin-left: 10px; opacity: 0.7;">(${count} diamonds)</span>
        `;
      } else {
        totalValueEl.innerHTML = '';
      }
    }
  }

})();
