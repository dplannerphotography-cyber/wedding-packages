// ==========================================
// DPLANNER PHOTOGRAPHY - CONFIGURATION
// ==========================================
// Change this phone number to your active WhatsApp phone number (with country code, no + or spaces)
// e.g. "2348012345678" for Nigeria (+234)
const CONFIG = {
  whatsappNumber: "2348168204080", // <-- UPDATE YOUR WHATSAPP NUMBER HERE
  photographerName: "DPlanner Photography",
  promoEndDate: "2026-12-31T23:59:59+01:00" // 31 Dec 2026, 23:59 Africa/Lagos (WAT, UTC+1, no daylight saving)
};

// Initialize dynamic WhatsApp links
document.addEventListener("DOMContentLoaded", () => {
  setupWhatsAppLinks();
  startCountdownTimer();
  setupMobileNav();
});

/**
 * Mobile hamburger menu toggle
 */
function setupMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  if (!toggle || !navLinks) return;

  const closeMenu = () => {
    navLinks.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };

  toggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  // Close the menu after tapping any in-page link
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });
}

/**
 * Configure all WhatsApp buttons with the configured phone number
 */
function setupWhatsAppLinks() {
  const whatsappLinks = document.querySelectorAll(".whatsapp-link, .whatsapp-contact-link, .btn-hero-book, .btn-nav-book, .btn-mobile-book, .quick-pill");
  
  whatsappLinks.forEach(link => {
    const packageName = link.getAttribute("data-package");
    let message = "";

    if (packageName) {
      const isAddon = /add-on/i.test(packageName);
      message = isAddon
        ? `Hello ${CONFIG.photographerName}! I'd like to add the *${packageName}* to my wedding package. I'll share my wedding date and venue here.`
        : `Hello ${CONFIG.photographerName}! I'd like to book the *${packageName}* wedding package. I'll share my wedding date and venue here.`;
    } else {
      message = `Hello ${CONFIG.photographerName}! I'd like to check availability for our wedding. I'll share our date and venue here.`;
    }

    const encodedMessage = encodeURIComponent(message);
    const fullUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;
    
    link.href = fullUrl;
  });
}

/**
 * Promo countdown timer
 */
function startCountdownTimer() {
  const targetDate = new Date(CONFIG.promoEndDate).getTime();

  const wrapper = document.getElementById("countdown");
  const endedEl = document.getElementById("promo-ended");
  const els = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds")
  };

  if (!wrapper || !els.days || !els.hours || !els.minutes || !els.seconds || isNaN(targetDate)) return;

  let timerId = null;

  function updateTimer() {
    const distance = targetDate - Date.now();

    if (distance <= 0) {
      wrapper.hidden = true;
      if (endedEl) endedEl.hidden = false;
      if (timerId) clearInterval(timerId);
      return;
    }

    const values = {
      days: Math.floor(distance / 86400000),
      hours: Math.floor((distance % 86400000) / 3600000),
      minutes: Math.floor((distance % 3600000) / 60000),
      seconds: Math.floor((distance % 60000) / 1000)
    };

    Object.keys(values).forEach(key => {
      els[key].textContent = String(values[key]).padStart(2, "0");
    });
    wrapper.hidden = false;
  }

  updateTimer();
  timerId = setInterval(updateTimer, 1000);
}
