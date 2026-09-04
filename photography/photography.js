/**
 * ==========================================================================
 * DPLANNER PHOTOGRAPHY — DIVISION INTERACTION SCRIPT
 * Route: /photography/
 * Official WhatsApp: +234 816 820 4080 (link format: 2348168204080)
 * ==========================================================================
 */

(function () {
  'use strict';

  const DPLANNER_CONFIG = {
    whatsappNumber: '2348168204080',
    studioLocation: 'Yemetu, Ibadan, Oyo State, Nigeria',
    defaultMessage: 'Hello DPlanner Photography, I would like to book a photography session.',
    messages: {
      studio: 'Hello DPlanner Photography, I would like to book a standard studio portrait session at your Yemetu, Ibadan studio.',
      creative: 'Hello DPlanner Photography, I would like to inquire about a creative portrait concept session.',
      wedding: 'Hello DPlanner Photography, I would like to inquire about wedding photography coverage for our upcoming wedding.',
      birthday: 'Hello DPlanner Photography, I would like to book a birthday photography shoot.',
      corporate: 'Hello DPlanner Photography, I would like to inquire about corporate / event documentary coverage.',
      general: 'Hello DPlanner Photography, I would like to book a photography session.'
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    initMobileNavigation();
    initPortfolioFiltering();
    initWhatsAppLinks();
  });

  /**
   * Accessible Mobile Navigation
   */
  function initMobileNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (!navToggle || !navMenu) return;

    const closeMenu = () => {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation menu');
    };

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    });

    // Close on navigation link click
    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close if clicked outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        if (navMenu.classList.contains('open')) {
          closeMenu();
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  /**
   * Portfolio Category Filter Tabs
   */
  function initPortfolioFiltering() {
    const filterTabs = document.querySelectorAll('.portfolio-tabs-bar .portfolio-tab-btn, .portfolio-tabs .tab-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-editorial-grid .portfolio-folio-item, .portfolio-grid .portfolio-item');

    if (!filterTabs.length || !portfolioItems.length) return;

    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const filter = tab.getAttribute('data-filter');

        // Update active tab state
        filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        // Filter items
        portfolioItems.forEach((item) => {
          const category = item.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  /**
   * Configure Contextual WhatsApp Booking Links
   */
  function initWhatsAppLinks() {
    const waLinks = document.querySelectorAll('[data-wa-type]');

    waLinks.forEach((link) => {
      const type = link.getAttribute('data-wa-type') || 'general';
      const text = DPLANNER_CONFIG.messages[type] || DPLANNER_CONFIG.defaultMessage;
      const encoded = encodeURIComponent(text);
      link.href = `https://wa.me/${DPLANNER_CONFIG.whatsappNumber}?text=${encoded}`;
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }
})();
