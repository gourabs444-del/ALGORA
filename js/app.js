/* ============================================================
   APP — Main Entry & Background Pre-warmer Controller
   Portfolio / js/app.js
   ============================================================ */

"use strict";

/**
 * Intelligent background asset pre-warmer.
 * Silently caches projects.html, JSON datasets, stylesheets, and drawer scripts
 * during browser idle time so transitions & drawer animations execute with 0ms lag.
 */
function initBackgroundPrewarmer() {
    const prewarmTargets = [
        "projects.html",
        "landing-pages.html",
        "ui.html",
        "js/notification-center.js",
        "js/auth-service.js"
    ];

    const runPreload = () => {
        prewarmTargets.forEach((url) => {
            try {
                // Fetch in background with lowest priority to never block the main thread
                fetch(url, { priority: "low", cache: "force-cache" }).catch(() => {});
            } catch (e) {}
        });

        // Preload hidden iframe in idle callback to warm browser DOM & CSSOM parser cache
        try {
            const frame = document.createElement("iframe");
            frame.src = "projects.html";
            frame.style.display = "none";
            frame.style.width = "0px";
            frame.style.height = "0px";
            frame.style.position = "absolute";
            frame.style.opacity = "0";
            frame.style.pointerEvents = "none";
            frame.setAttribute("aria-hidden", "true");
            frame.tabIndex = -1;
            document.body.appendChild(frame);
        } catch (e) {}
    };

    // Use requestIdleCallback or defer by 800ms after the initial hero text has settled
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(runPreload, { timeout: 2000 });
    } else {
        setTimeout(runPreload, 800);
    }
}

/**
 * Cinematic smooth transition on CTAs.
 */
function initSmoothTransitions() {
    const exploreBtn = document.getElementById("btn-explore-projects");
    if (!exploreBtn) return;

    exploreBtn.addEventListener("click", (e) => {
        const targetHref = exploreBtn.getAttribute("href");
        if (!targetHref || targetHref.startsWith("#") || e.metaKey || e.ctrlKey) return;

        e.preventDefault();
        document.body.classList.add("is-transitioning");

        setTimeout(() => {
            window.location.href = targetHref;
        }, 220);
    });
}

/**
 * Application bootstrap.
 * Called after all deferred scripts are loaded and DOM is ready.
 */
document.addEventListener("DOMContentLoaded", () => {
    console.info("[app] Portfolio initialised.");
    initBackgroundPrewarmer();
    initSmoothTransitions();
});

