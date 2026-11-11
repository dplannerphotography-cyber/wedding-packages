/**
 * DPlanner Photography — Division Interactions
 * Route: /photography/
 * Official WhatsApp: +234 816 820 4080 (link format: 2348168204080)
 * Lead Photographer: Samuel Damilare
 * Studio: 82 De ACE HALL, besides Turaya Food Canteen, Yemetu, Ibadan
 */

(function () {
  'use strict';

  const DPLANNER_CONFIG = {
    whatsappNumber: '2348168204080',
    email: 'dplannerphotography@gmail.com',
    studioLocation: '82 De ACE HALL, besides Turaya Food Canteen, Yemetu, Ibadan, Oyo State'
  };

  function initAll() {
    initPortfolioFiltering();
    initLightbox();
    initInquiryForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  /**
   * 1. Portfolio Category Filtering
   */
  function initPortfolioFiltering() {
    const filterTabs = document.querySelectorAll('.portfolio-tab-btn');
    const items = document.querySelectorAll('.portfolio-folio-item');

    if (!filterTabs.length || !items.length) return;

    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const filter = tab.getAttribute('data-filter');

        filterTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        items.forEach((item) => {
          const cat = item.getAttribute('data-category');
          if (filter === 'all' || cat === filter) {
            item.style.display = '';
            item.removeAttribute('aria-hidden');
          } else {
            item.style.display = 'none';
            item.setAttribute('aria-hidden', 'true');
          }
        });
      });
    });
  }

  /**
   * 2. Accessible Lightbox System
   */
  function initLightbox() {
    const lightbox = document.getElementById('portfolio-lightbox');
    if (!lightbox) return;

    const lbImage = lightbox.querySelector('.lightbox-image');
    const lbTitle = lightbox.querySelector('.lightbox-title');
    const lbTag = lightbox.querySelector('.lightbox-tag');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    const lbCounter = lightbox.querySelector('.lightbox-counter');
    const lbCta = lightbox.querySelector('.lightbox-cta-btn');
    const btnClose = lightbox.querySelector('.lightbox-close-btn');
    const btnPrev = lightbox.querySelector('.lightbox-prev-btn');
    const btnNext = lightbox.querySelector('.lightbox-next-btn');

    let currentIndex = 0;
    let activeItems = [];
    let lastFocusedElement = null;

    function getVisibleItems() {
      const all = Array.from(document.querySelectorAll('.portfolio-folio-item'));
      return all.filter((el) => el.style.display !== 'none');
    }

    function openLightbox(item) {
      activeItems = getVisibleItems();
      currentIndex = activeItems.indexOf(item);
      if (currentIndex === -1) currentIndex = 0;

      lastFocusedElement = document.activeElement;
      updateLightboxContent();

      lightbox.removeAttribute('hidden');
      lightbox.classList.add('is-open');
      document.body.classList.add('lightbox-active');

      if (btnClose) btnClose.focus();
    }

    function closeLightbox() {
      lightbox.setAttribute('hidden', '');
      lightbox.classList.remove('is-open');
      document.body.classList.remove('lightbox-active');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    function updateLightboxContent() {
      const item = activeItems[currentIndex];
      if (!item) return;

      const img = item.querySelector('img');
      const title = item.querySelector('h4')?.textContent || 'DPlanner Photography';
      const tag = item.querySelector('.folio-tag')?.textContent || 'Portfolio';
      const caption = item.getAttribute('data-caption') || item.querySelector('.folio-desc')?.textContent || '';
      const ctaLink = item.getAttribute('data-cta-link') || `https://wa.me/${DPLANNER_CONFIG.whatsappNumber}?text=${encodeURIComponent('Hello DPlanner Photography, I am inquiring about ' + title)}`;
      const ctaText = item.getAttribute('data-cta-text') || 'Book on WhatsApp';

      if (lbImage && img) {
        lbImage.src = img.src;
        lbImage.alt = img.alt || title;
      }
      if (lbTitle) lbTitle.textContent = title;
      if (lbTag) lbTag.textContent = tag;
      if (lbCaption) lbCaption.textContent = caption;
      if (lbCounter) lbCounter.textContent = `${currentIndex + 1} of ${activeItems.length}`;
      if (lbCta) {
        lbCta.href = ctaLink;
        lbCta.textContent = ctaText;
        if (ctaLink.startsWith('http')) {
          lbCta.target = '_blank';
          lbCta.rel = 'noopener noreferrer';
        } else {
          lbCta.removeAttribute('target');
          lbCta.removeAttribute('rel');
        }
      }
    }

    function nextImage() {
      if (!activeItems.length) return;
      currentIndex = (currentIndex + 1) % activeItems.length;
      updateLightboxContent();
    }

    function prevImage() {
      if (!activeItems.length) return;
      currentIndex = (currentIndex - 1 + activeItems.length) % activeItems.length;
      updateLightboxContent();
    }

    // Attach click listeners to cards and trigger buttons
    document.querySelectorAll('.portfolio-folio-item').forEach((item) => {
      const trigger = item.querySelector('.folio-lightbox-trigger') || item.querySelector('.folio-media-box');
      if (trigger) {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          openLightbox(item);
        });
        trigger.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(item);
          }
        });
      }
    });

    if (btnClose) btnClose.addEventListener('click', closeLightbox);
    if (btnNext) btnNext.addEventListener('click', nextImage);
    if (btnPrev) btnPrev.addEventListener('click', prevImage);

    // Backdrop click closes lightbox
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-backdrop')) {
        closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    });
  }

  /**
   * 3. Interactive Pre-filled Inquiry Form
   */
  function initInquiryForm() {
    const form = document.getElementById('inquiry-form');
    if (!form) return;

    const btnWhatsApp = document.getElementById('btn-inquiry-whatsapp');
    const btnEmail = document.getElementById('btn-inquiry-email');

    function getFormData() {
      const name = (form.querySelector('[name="client_name"]')?.value || '').trim();
      const service = (form.querySelector('[name="service_type"]')?.value || 'Photography Session').trim();
      const date = (form.querySelector('[name="preferred_date"]')?.value || '').trim();
      const location = (form.querySelector('[name="location"]')?.value || '').trim();
      const notes = (form.querySelector('[name="notes"]')?.value || '').trim();

      return { name, service, date, location, notes };
    }

    function validateName(data) {
      if (!data.name) {
        const nameInput = form.querySelector('[name="client_name"]');
        if (nameInput) {
          nameInput.focus();
          nameInput.reportValidity?.() || alert('Please enter your name to send an inquiry.');
        }
        return false;
      }
      return true;
    }

    if (btnWhatsApp) {
      btnWhatsApp.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getFormData();
        if (!validateName(data)) return;

        let msg = `Hello DPlanner Photography! My name is ${data.name}. I would like to inquire about booking: ${data.service}.`;
        if (data.date) {
          msg += ` Preferred date: ${data.date}.`;
        }
        if (data.location) {
          msg += ` Location/Venue: ${data.location}.`;
        }
        if (data.notes) {
          msg += ` Notes: ${data.notes}`;
        }

        const encoded = encodeURIComponent(msg);
        const waUrl = `https://wa.me/${DPLANNER_CONFIG.whatsappNumber}?text=${encoded}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      });
    }

    if (btnEmail) {
      btnEmail.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getFormData();
        if (!validateName(data)) return;

        const subject = encodeURIComponent(`Photography Inquiry: ${data.service} - ${data.name}`);
        let body = `Hello Samuel and the DPlanner Photography Team,\n\n`;
        body += `My name is ${data.name}.\n`;
        body += `Service requested: ${data.service}\n`;
        if (data.date) body += `Preferred date: ${data.date}\n`;
        if (data.location) body += `Location/Venue: ${data.location}\n`;
        if (data.notes) body += `\nAdditional Details:\n${data.notes}\n`;
        body += `\nLooking forward to hearing from you.`;

        const mailtoUrl = `mailto:${DPLANNER_CONFIG.email}?subject=${subject}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
      });
    }
  }
})();
