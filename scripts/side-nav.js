// Reusable Side Navigation Handler
// Works for both robots page (with year-based navigation) and resources page (with topic-based navigation)
function initializeSideNavigation(options = {}) {
  const {
    navSelector = '#sideNav',
    linkSelector = '.side-nav-link',
    sectionSelector = null, // Auto-detect if not provided
    sectionAttribute = 'id'
  } = options;

  const sideNav = document.querySelector(navSelector);
  const sideLinks = document.querySelectorAll(linkSelector);
  
  // Auto-detect section selector if not provided
  let sections;
  if (sectionSelector) {
    sections = document.querySelectorAll(sectionSelector);
  } else {
    // Find sections that have IDs matching the navigation links
    const linkTargets = Array.from(sideLinks).map(link => 
      link.getAttribute('href').substring(1)
    );
    sections = document.querySelectorAll(
      linkTargets.map(target => `[${sectionAttribute}="${target}"]`).join(', ')
    );
  }

  if (!sideNav || sideLinks.length === 0 || sections.length === 0) return;

  // Track navigation state
  let isClickNavigation = false;
  let hasInitialHashNavigated = false;
  const initialHash = window.location.hash;

  // Enable smooth scrolling after initial load (only if no hash)
  if (!initialHash) {
    document.documentElement.classList.add('smooth-scroll');
  }

  function updateActiveSection() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    
    let currentSection = null;
    
    // Find which section is currently in view
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const sectionTop = scrollTop + rect.top;
      
      // Check if section is in the upper half of the viewport
      if (sectionTop <= scrollTop + windowHeight * 0.4) {
        currentSection = section;
      }
    });

    // Update active link
    sideLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent default anchor jump
    
    const targetId = this.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);
if (targetSection) {
  const headerOffset = 120; // height of your sticky header/sidebar in px
  const elementPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth"
  });
}

    
    // Set active state
    sideLinks.forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    
    this.blur();
    
    // Set click navigation flag
    isClickNavigation = true;
  });
});


    // Update URL hash only during manual scrolling (not click navigation)
    if (!isClickNavigation && hasInitialHashNavigated && currentSection) {
      const sectionId = currentSection.getAttribute(sectionAttribute);
      const currentHash = window.location.hash.substring(1);
      if (currentHash !== sectionId) {
        history.replaceState(null, null, '#' + sectionId);
      }
    }
  }

  // Handle click navigation
  sideLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Enable smooth scrolling for click navigation
      document.documentElement.classList.add('smooth-scroll');
      
      // Set flag to prevent URL updates during click navigation
      isClickNavigation = true;
      
      // Update active state immediately for responsive feel
      sideLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      
      // Remove focus and blur the element to prevent sticky hover on mobile
      this.blur();
    });
  });

  // Detect when smooth scrolling ends using scroll event
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    // Clear existing timeout
    clearTimeout(scrollTimeout);
    
    // Update active state immediately
    updateActiveSection();
    
    // Detect scroll end and reset click navigation flag
    if (isClickNavigation) {
      scrollTimeout = setTimeout(() => {
        isClickNavigation = false;
        // Force update active section after click navigation ends
        updateActiveSection();
      }, 150); // Short timeout to detect scroll end
    }
  });

  // Handle touch events on mobile to ensure proper state management
  window.addEventListener('touchstart', function() {
    // On touch start, ensure we update active states properly
    setTimeout(() => {
      if (!isClickNavigation) {
        updateActiveSection();
      }
    }, 50);
  });

  // Handle initial hash navigation
  window.addEventListener('load', function() {
    if (initialHash) {
      // Wait for initial navigation to complete
      requestAnimationFrame(() => {
        hasInitialHashNavigated = true;
        // Enable smooth scrolling after initial hash navigation
        document.documentElement.classList.add('smooth-scroll');
      });
    } else {
      hasInitialHashNavigated = true;
    }
  });
  
  // Initial update
  updateActiveSection();
}

// Auto-initialize for common page types
document.addEventListener('DOMContentLoaded', function() {
  // Check if we have side navigation on the page
  if (document.querySelector('#sideNav')) {
    // Determine page type and initialize accordingly
    if (document.querySelector('.robot-card')) {
      // Robots page
      initializeSideNavigation({
        sectionSelector: '.robot-card[id]'
      });
    } else if (document.querySelector('.notion-card[id]')) {
      // Resources page
      initializeSideNavigation({
        sectionSelector: '.notion-card[id]'
      });
    } else {
      // Generic fallback
      initializeSideNavigation();
    }
  }
});