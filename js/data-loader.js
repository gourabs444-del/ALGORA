/* ============================================================
   DATA LOADER — Async JSON fetcher for dynamic sections
   Portfolio / js/data-loader.js
   ============================================================ */

"use strict";

/**
 * Load a JSON data file from the /data directory.
 * @param {string} filename  e.g. "projects.json"
 * @returns {Promise<any>}
 */
async function loadData(filename) {
    try {
        const res = await fetch(`data/${filename}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn(`[data-loader] Could not load data/${filename}:`, err.message);
        return null;
    }
}

export { loadData };
