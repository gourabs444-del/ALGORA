/* ============================================================
   UTILS — Shared helpers
   Portfolio / js/utils.js
   ============================================================ */

"use strict";

/**
 * Select a single element (shorthand for querySelector).
 * @param {string} selector
 * @param {Element} [ctx=document]
 * @returns {Element|null}
 */
const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Select all matching elements.
 * @param {string} selector
 * @param {Element} [ctx=document]
 * @returns {NodeList}
 */
const $$ = (selector, ctx = document) => ctx.querySelectorAll(selector);

/**
 * Safely fetch JSON from a URL.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetchJSON: ${res.status} ${res.statusText} — ${url}`);
    return res.json();
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} delay ms
 * @returns {Function}
 */
function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export { $, $$, fetchJSON, debounce };
