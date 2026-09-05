/**
 * UI Component Detail Page Script
 * Includes Live Text Customizer & Code Sync
 */

const urlParams = new URLSearchParams(window.location.search);
const folderParam = urlParams.get('folder') || 'button-01';

let currentActiveTab = 'html';
let initialHTMLCode = '';
let rawHTMLCode = '';
let rawCSSCode = '';
let textNodesMetadata = [];

// Strip live-server injected scripts
function stripLiveServerScript(html) {
    if (!html) return '';
    return html
        .replace(/<!-- Code injected by live-server -->[\s\S]*?<\/script>/gi, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim();
}

async function initDetailView() {
    let title = folderParam.replace(/-/g, ' ').toUpperCase();
    const pageTitleEl = document.getElementById('page-title');
    const badgeEl = document.getElementById('component-id-badge');

    if (pageTitleEl) pageTitleEl.textContent = title;
    document.title = title + ' | Algora UI';
    if (badgeEl) badgeEl.textContent = `components/ui/${folderParam}`;

    // Fetch component files directly from component folder root
    try {
        let [htmlRes, cssRes] = await Promise.all([
            fetch(`components/ui/${encodeURIComponent(folderParam)}/index.html?v=` + Date.now()).catch(() => null),
            fetch(`components/ui/${encodeURIComponent(folderParam)}/style.css?v=` + Date.now()).catch(() => null)
        ]);

        if (htmlRes && htmlRes.ok) initialHTMLCode = await htmlRes.text();
        if (cssRes && cssRes.ok) rawCSSCode = await cssRes.text();
    } catch (e) {
        console.warn('Error loading component files', e);
    }

    initialHTMLCode = stripLiveServerScript(initialHTMLCode);
    rawHTMLCode = initialHTMLCode;
    rawCSSCode = rawCSSCode.trim();

    // Render Preview and Build Text Customizer
    renderComponentPreview();
    buildTextCustomizerPanel();

    // Initial Code Display
    switchTab('html');

    // Load Similar Components
    loadSimilarComponents();
}

function renderComponentPreview() {
    const previewContainer = document.getElementById('live-preview-box');
    if (!previewContainer) return;

    if (!rawHTMLCode && !rawCSSCode) {
        previewContainer.innerHTML = `
            <div class="text-center py-12 px-6">
                <span class="material-symbols-outlined text-4xl text-slate-400 mb-3 block">folder_open</span>
                <h4 class="font-headline font-bold text-base text-slate-700">Component folder is empty</h4>
                <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Add HTML to <code class="text-purple-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">components/ui/${folderParam}/index.html</code> and CSS to <code class="text-purple-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">style.css</code></p>
            </div>
        `;
    } else {
        const iframe = document.createElement('iframe');
        iframe.className = "w-full h-[460px] border-none rounded-xl bg-slate-50/50";
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        previewContainer.innerHTML = '';
        previewContainer.appendChild(iframe);

        const srcdoc = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 16px;
            background: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        ${rawCSSCode}
    </style>
</head>
<body>
    ${rawHTMLCode}
</body>
</html>`;
        iframe.srcdoc = srcdoc;
    }
}

/**
 * Text Extractor & Customizer Engine
 * Extracts text nodes from HTML and builds clean input fields
 */
function extractTextItems(html) {
    if (!html) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const items = [];

    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const val = node.nodeValue.trim();
            if (val.length > 0 && !/^[\s\n\r]*$/.test(val)) {
                const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : 'text';
                items.push({
                    type: 'text',
                    parentTag: parentTag,
                    originalText: val
                });
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (tag !== 'script' && tag !== 'style' && tag !== 'svg') {
                if (node.hasAttribute('placeholder')) {
                    items.push({
                        type: 'placeholder',
                        parentTag: tag,
                        originalText: node.getAttribute('placeholder')
                    });
                }
                for (let child of node.childNodes) {
                    walk(child);
                }
            }
        }
    }

    walk(doc.body);
    return items;
}

function updateHTMLWithEdits(originalHTML, newValuesMap) {
    if (!originalHTML) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHTML, 'text/html');
    const nodeItems = [];

    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const val = node.nodeValue.trim();
            if (val.length > 0 && !/^[\s\n\r]*$/.test(val)) {
                nodeItems.push({ type: 'text', node: node });
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (tag !== 'script' && tag !== 'style' && tag !== 'svg') {
                if (node.hasAttribute('placeholder')) {
                    nodeItems.push({ type: 'placeholder', element: node });
                }
                for (let child of node.childNodes) {
                    walk(child);
                }
            }
        }
    }

    walk(doc.body);

    nodeItems.forEach((item, index) => {
        if (newValuesMap[index] !== undefined) {
            const newVal = newValuesMap[index];
            if (item.type === 'text') {
                item.node.nodeValue = newVal;
            } else if (item.type === 'placeholder') {
                item.element.setAttribute('placeholder', newVal);
            }
        }
    });

    return doc.body.innerHTML;
}

function buildTextCustomizerPanel() {
    const customizerCol = document.getElementById('text-customizer-column');
    const previewCol = document.getElementById('preview-column');
    const codeCol = document.getElementById('code-column');
    const container = document.getElementById('text-customizer-fields');

    textNodesMetadata = extractTextItems(initialHTMLCode);

    if (textNodesMetadata.length === 0) {
        if (customizerCol) customizerCol.classList.add('hidden');
        if (previewCol) previewCol.className = 'lg:col-span-6';
        if (codeCol) codeCol.className = 'lg:col-span-6';
        return;
    }

    if (customizerCol) customizerCol.classList.remove('hidden');
    if (previewCol) previewCol.className = 'lg:col-span-4';
    if (codeCol) codeCol.className = 'lg:col-span-5';

    let fieldsHtml = '';
    textNodesMetadata.forEach((item, idx) => {
        const tagLabel = item.type === 'placeholder' ? `placeholder` : `<${item.parentTag}>`;
        fieldsHtml += `
            <div class="group/field relative flex flex-col gap-1.5 bg-slate-50/70 hover:bg-slate-50/90 border border-slate-200/80 hover:border-slate-300/90 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/15 p-2.5 rounded-xl transition-all duration-150">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 min-w-0">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-300 group-focus-within/field:bg-sky-500 transition-colors shrink-0"></span>
                        <label class="text-[11px] font-sans font-semibold text-slate-700 truncate tracking-tight">Text Node ${idx + 1}</label>
                    </div>
                    <span class="text-[9.5px] font-mono font-medium text-slate-500 bg-white group-focus-within/field:text-sky-700 group-focus-within/field:bg-sky-50 border border-slate-200/80 group-focus-within/field:border-sky-200 px-1.5 py-0.5 rounded-md transition-colors">${tagLabel}</span>
                </div>
                <input 
                    type="text" 
                    data-text-idx="${idx}"
                    value="${item.originalText.replace(/"/g, '&quot;')}"
                    oninput="handleTextInputChange(event)"
                    class="w-full text-[12px] font-sans font-medium text-slate-900 bg-white border border-slate-200/90 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500 transition-colors shadow-2xs placeholder:text-slate-400" 
                    placeholder="Enter custom text..."
                />
            </div>
        `;
    });

    if (container) container.innerHTML = fieldsHtml;
}

function handleTextInputChange() {
    const inputs = document.querySelectorAll('[data-text-idx]');
    const editsMap = {};

    inputs.forEach(input => {
        const idx = parseInt(input.getAttribute('data-text-idx'), 10);
        editsMap[idx] = input.value;
    });

    // Update global rawHTMLCode
    rawHTMLCode = updateHTMLWithEdits(initialHTMLCode, editsMap);

    // Refresh live preview iframe
    renderComponentPreview();

    // Refresh code viewer if HTML tab is active
    if (currentActiveTab === 'html') {
        const codeOutput = document.getElementById('code-output');
        if (codeOutput) {
            codeOutput.innerHTML = highlightHTML(rawHTMLCode || '<!-- No HTML found -->');
        }
    }
}

function switchTab(tab) {
    currentActiveTab = tab;
    const htmlBtn = document.getElementById('tab-html-btn');
    const cssBtn = document.getElementById('tab-css-btn');
    const activeFilename = document.getElementById('active-filename');
    const codeOutput = document.getElementById('code-output');

    if (!codeOutput) return;

    if (tab === 'html') {
        if (htmlBtn) htmlBtn.classList.add('active');
        if (cssBtn) cssBtn.classList.remove('active');
        if (activeFilename) activeFilename.textContent = 'index.html';
        codeOutput.innerHTML = highlightHTML(rawHTMLCode || '<!-- No HTML found in index.html -->');
    } else {
        if (cssBtn) cssBtn.classList.add('active');
        if (htmlBtn) htmlBtn.classList.remove('active');
        if (activeFilename) activeFilename.textContent = 'style.css';
        codeOutput.innerHTML = highlightCSS(rawCSSCode || '/* No CSS found in style.css */');
    }
}

function highlightHTML(code) {
    let escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escaped
        .replace(/(&lt;!--.*?--&gt;)/g, '<span class="hl-comment">$1</span>')
        .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-tag">$2</span>')
        .replace(/([\w-]+)(=)(&quot;|")(.*?)(\3)/g, '<span class="hl-attr">$1</span>$2<span class="hl-value">$3$4$5</span>');
}

function highlightCSS(code) {
    let escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escaped
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
        .replace(/([^{]+)\s*\{/g, '<span class="hl-tag">$1</span> {')
        .replace(/([\w-]+)\s*:/g, '<span class="hl-attr">$1</span>:');
}

function copyActiveCode() {
    const codeToCopy = currentActiveTab === 'html' ? rawHTMLCode : rawCSSCode;
    const btn = document.getElementById('copy-btn');
    const icon = document.getElementById('copy-icon');
    const text = document.getElementById('copy-text');

    navigator.clipboard.writeText(codeToCopy).then(() => {
        if (btn) btn.classList.add('copied');
        if (icon) icon.textContent = 'check_circle';
        if (text) text.textContent = 'Copied!';

        setTimeout(() => {
            if (btn) btn.classList.remove('copied');
            if (icon) icon.textContent = 'content_copy';
            if (text) text.textContent = 'Copy Code';
        }, 2000);
    });
}

function resetTextEdits() {
    rawHTMLCode = initialHTMLCode;
    renderComponentPreview();
    buildTextCustomizerPanel();
    if (currentActiveTab === 'html') {
        switchTab('html');
    }
}

// Make functions global for inline onclick/oninput handlers
window.switchTab = switchTab;
window.copyActiveCode = copyActiveCode;
window.handleTextInputChange = handleTextInputChange;
window.resetTextEdits = resetTextEdits;

async function loadSimilarComponents() {
    try {
        const res = await fetch('components/ui/manifest.json?v=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        const list = data.components || [];

        // Filter out current folder and pick up to 4 items
        const similar = list.filter(item => item.folder !== folderParam).slice(0, 4);

        const grid = document.getElementById('similar-components-grid');
        if (!grid) return;

        grid.innerHTML = similar.map(item => `
            <a href="ui-detail.html?folder=${encodeURIComponent(item.folder)}" class="group bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-sky-300 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                    <div class="h-28 rounded-xl bg-slate-900/90 flex items-center justify-center p-3 mb-3 border border-slate-800 group-hover:scale-[1.02] transition-transform">
                        <span class="text-xs font-mono text-sky-400 group-hover:text-sky-300 transition-colors">${item.folder}</span>
                    </div>
                    <h4 class="font-headline font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">${item.folder}</h4>
                    <p class="text-xs text-slate-400 mt-0.5">${item.subtitle || 'UI Micro Component'}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[10px] font-mono text-slate-400">components/ui/${item.folder}</span>
                    <span class="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
                </div>
            </a>
        `).join('');
    } catch (e) {
        console.warn('Failed to load similar components', e);
    }
}

document.addEventListener('DOMContentLoaded', initDetailView);
