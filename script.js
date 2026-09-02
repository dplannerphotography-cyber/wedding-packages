// ==========================================
// DPLANNER PHOTOGRAPHY - CONFIGURATION
// ==========================================
// Change this phone number to your active WhatsApp phone number (with country code, no + or spaces)
// e.g. "2348012345678" for Nigeria (+234)
const CONFIG = {
  whatsappNumber: "2348000000000", // <-- UPDATE YOUR WHATSAPP NUMBER HERE
  photographerName: "DPlanner Photography",
  promoEndDate: "December 31, 2026 23:59:59"
};

// Initialize dynamic WhatsApp links
document.addEventListener("DOMContentLoaded", () => {
  setupWhatsAppLinks();
  startCountdownTimer();
});

/**
 * Configure all WhatsApp buttons with the configured phone number
 */
function setupWhatsAppLinks() {
  const whatsappLinks = document.querySelectorAll(".whatsapp-link, .whatsapp-contact-link");
  
  whatsappLinks.forEach(link => {
    const packageName = link.getAttribute("data-package");
    let message = "";

    if (packageName) {
      message = `Hello ${CONFIG.photographerName}! I am interested in booking the *${packageName}* for our wedding (September - December 2026 Promo). Could you please check date availability and send more details?`;
    } else {
      message = `Hello ${CONFIG.photographerName}! I'm visiting your website and I'd love to inquire about your wedding photography and cinematic film packages.`;
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
  
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      daysEl.innerText = "00";
      hoursEl.innerText = "00";
      minutesEl.innerText = "00";
      secondsEl.innerText = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.innerText = days.toString().padStart(2, "0");
    hoursEl.innerText = hours.toString().padStart(2, "0");
    minutesEl.innerText = minutes.toString().padStart(2, "0");
    secondsEl.innerText = seconds.toString().padStart(2, "0");
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}
