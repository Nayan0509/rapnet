/**
 * Wishlist Header Badge
 * Updates the wishlist count badge in the header
 */

(function() {
  'use strict';

  const WL_KEY = 'dp_diamond_wishlist';

  function getWishlistCount() {
    try {
      const wishlist = JSON.parse(localStorage.getItem(WL_KEY)) || {};
      return Object.keys(wishlist).length;
    } catch(e) {
      return 0;
    }
  }

  function updateWishlistBadge() {
    const badge = document.querySelector('.wishlist-count-badge');
    if (!badge) return;

    const count = getWishlistCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  // Update on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateWishlistBadge);
  } else {
    updateWishlistBadge();
  }

  // Listen for storage changes (when wishlist is updated in another tab)
  window.addEventListener('storage', function(e) {
    if (e.key === WL_KEY) {
      updateWishlistBadge();
    }
  });

  // Listen for custom wishlist update events
  window.addEventListener('wishlistUpdated', updateWishlistBadge);

  // Expose function globally for other scripts to trigger updates
  window.updateWishlistBadge = updateWishlistBadge;
})();
