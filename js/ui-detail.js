/**
 * UI Component Detail Page Script
 */

const urlParams = new URLSearchParams(window.location.search);
const folderParam = urlParams.get('folder') || 'button-01';

let currentActiveTab = 'html';
let rawHTMLCode = '';
let rawCSSCode = '';

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

        if (htmlRes && htmlRes.ok) rawHTMLCode = await htmlRes.text();
        if (cssRes && cssRes.ok) rawCSSCode = await cssRes.text();
    } catch (e) {
        console.warn('Error loading component files', e);
    }

    rawHTMLCode = stripLiveServerScript(rawHTMLCode);
    rawCSSCode = rawCSSCode.trim();

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
        // Render sandboxed iframe preview safely
        const iframe = document.createElement('iframe');
        iframe.className = "w-full h-[400px] border-none rounded-xl bg-slate-50/50";
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

    // Initial Tab Display
    switchTab('html');

    // Load Similar Components
    loadSimilarComponents();
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

// Make functions global for onclick attributes
window.switchTab = switchTab;
window.copyActiveCode = copyActiveCode;

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
