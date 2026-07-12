/* ============================================================
   ANIMATION — SVG & Page Motion Controller
   Portfolio / js/animation.js
   ============================================================ */

"use strict";

/**
 * Initialise all SVG-driven SMIL-independent animations.
 * CSS keyframes handle the hero entrance; this module handles
 * JS-driven interactions (e.g. parallax scroll on SVG glows).
 */
function initAnimations() {

    const bg = document.getElementById("background");
    if (!bg) return;

    /* Subtle parallax: move background slightly on scroll */
    window.addEventListener("scroll", () => {
        const offset = window.scrollY * 0.08;
        bg.style.transform = `translateY(${offset}px)`;
    }, { passive: true });

}

/* Auto-init once DOM is ready */
document.addEventListener("DOMContentLoaded", initAnimations);
