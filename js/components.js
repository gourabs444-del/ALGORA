/* ============================================================
   COMPONENTS — Dynamic HTML component loader
   Portfolio / js/components.js
   ============================================================ */

"use strict";

/**
 * Fetch an HTML partial from /components/ and inject it into
 * the element matching `targetSelector`.
 *
 * @param {string} componentFile   e.g. "navbar.html"
 * @param {string} targetSelector  CSS selector for injection target
 */
async function loadComponent(componentFile, targetSelector) {
    try {
        const res = await fetch(`components/${componentFile}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const target = document.querySelector(targetSelector);
        if (target) {
            target.innerHTML = html;
        } else {
            console.warn(`[components] Target not found: ${targetSelector}`);
        }
    } catch (err) {
        console.warn(`[components] Could not load components/${componentFile}:`, err.message);
    }
}

export { loadComponent };
