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

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
    
    // On mobile / touch devices, keep background fixed to preserve locked 60/120fps
    if (isTouchDevice) {
        bg.style.transform = 'translateZ(0)';
        return;
    }

    /* Subtle parallax on desktop with requestAnimationFrame */
    let ticking = false;
    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const offset = window.scrollY * 0.06;
                bg.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

}

/* Auto-init once DOM is ready */
document.addEventListener("DOMContentLoaded", initAnimations);

