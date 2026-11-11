// DPlanner Photography — site script. No dependencies.
(function () {
  "use strict";

  var promoEnd = new Date(window.DP_PROMO_END || "2026-12-31T23:59:59+01:00").getTime();

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileNav();
    setupCountdowns();
    setupShareButtons();
    setupPackageHighlight();
  });

  /* ---------- Mobile menu ---------- */
  function setupMobileNav() {
    var toggle = document.getElementById("nav-toggle");
    var links = document.getElementById("nav-links");
    if (!toggle || !links) return;

    function setOpen(open) {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!links.classList.contains("open"));
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Promo countdown and end-of-promo switch ---------- */
  function endPromo() {
    document.documentElement.classList.add("promo-ended");
    // WhatsApp messages stop quoting the promo price
    document.querySelectorAll("a[data-wa-post]").forEach(function (a) {
      a.href = a.getAttribute("data-wa-post");
    });
  }

  function setupCountdowns() {
    var boxes = document.querySelectorAll("[data-countdown]");
    var timer = null;

    function tick() {
      var left = promoEnd - Date.now();
      if (isNaN(promoEnd)) return;

      if (left <= 0) {
        boxes.forEach(function (box) { box.hidden = true; });
        endPromo();
        if (timer) clearInterval(timer);
        return;
      }

      var parts = {
        days: Math.floor(left / 86400000),
        hours: Math.floor((left % 86400000) / 3600000),
        minutes: Math.floor((left % 3600000) / 60000),
        seconds: Math.floor((left % 60000) / 1000)
      };
      boxes.forEach(function (box) {
        Object.keys(parts).forEach(function (key) {
          var el = box.querySelector('[data-cd="' + key + '"]');
          if (el) el.textContent = String(parts[key]).padStart(2, "0");
        });
        box.hidden = false;
      });
    }

    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------- Share / copy link ---------- */
  var toastTimer = null;
  function toast(message) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers and non-HTTPS previews
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(area);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  function setupShareButtons() {
    document.querySelectorAll(".share-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = new URL(btn.getAttribute("data-share-url"), location.origin).href;
        var data = {
          title: btn.getAttribute("data-share-title") || document.title,
          text: btn.getAttribute("data-share-text") || "",
          url: url
        };
        var isTouch = window.matchMedia("(pointer: coarse)").matches;

        if (navigator.share && isTouch) {
          navigator.share(data).catch(function () { /* user closed the share sheet */ });
          return;
        }
        copyText(url).then(
          function () { toast("Link copied: " + url.replace(/^https?:\/\//, "")); },
          function () { toast("Copy this link: " + url); }
        );
      });
    });
  }

  /* ---------- Highlight the package a link points to ---------- */
  function setupPackageHighlight() {
    var anchors = ["essential", "classic", "signature", "addon"];

    function highlight() {
      var id = location.hash.replace("#", "");
      if (anchors.indexOf(id) === -1) return;
      var card = document.getElementById(id);
      if (!card) return;
      card.scrollIntoView({ behavior: "instant", block: "start" });
      // Scroll once more after fonts and images have settled, in case the layout moved
      setTimeout(function () {
        if (location.hash === "#" + id) card.scrollIntoView({ behavior: "instant", block: "start" });
      }, 1200);
      card.classList.remove("is-highlighted");
      void card.offsetWidth; // restart the animation
      card.classList.add("is-highlighted");
      setTimeout(function () { card.classList.remove("is-highlighted"); }, 3200);
    }

    window.addEventListener("hashchange", highlight);
    // Wait a moment so fonts and images settle before scrolling
    if (location.hash) setTimeout(highlight, 350);
  }
})();
