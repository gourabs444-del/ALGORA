/**
 * UI Component Detail Page Script
 * Live Component Preview, Tab Customizer & Source Code Viewer
 */

const urlParams = new URLSearchParams(window.location.search);
const folderParam = urlParams.get('folder') || 'navigation-01';

let currentActiveTab = 'html';
let rawHTMLCode = '';
let rawCSSCode = '';

// Navigation tabs state
let navTabs = [
    { label: "Home", hasIcon: true },
    { label: "Option 1", hasIcon: false },
    { label: "Option 2", hasIcon: false },
    { label: "Option 3", hasIcon: false },
    { label: "Option 4", hasIcon: false },
    { label: "Option 5", hasIcon: false }
];
let activeTabIndex = 0; // Default Home is active

function isNavigationComponent() {
    return folderParam.toLowerCase().includes('nav') || folderParam.toLowerCase().includes('dock');
}

// Strip live-server injected scripts
function stripLiveServerScript(html) {
    if (!html) return '';
    return html
        .replace(/<!-- Code injected by live-server -->[\s\S]*?<\/script>/gi, '')
        .replace(/<script\b[^>]*>(?:(?!<\/script>)[\s\S])*?ws:\/\/[\s\S]*?<\/script>/gi, '')
        .trim();
}

function generateNavigationHTML() {
    const buttonsHTML = navTabs.map((tab, idx) => {
        const isActive = idx === activeTabIndex;
        const iconHTML = tab.hasIcon ? `
      <svg class="guild-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>` : '';

        return `    <!-- ${idx + 1}. ${tab.label.toUpperCase()} -->
    <button type="button" class="guild-nav-btn${isActive ? ' active' : ''}" onclick="switchGuildNav(this)">${iconHTML}
      <span class="guild-nav-label">${tab.label}</span>
    </button>`;
    }).join('\n\n');

    return `<div class="guild-nav-wrapper">
  <!-- GUILD RANKING GLOWING GLASS DOCK -->
  <nav class="guild-dock-nav" id="guildDockNav">

${buttonsHTML}

  </nav>
</div>

<script>
  function switchGuildNav(el) {
    var buttons = document.querySelectorAll('.guild-nav-btn');
    buttons.forEach(function(btn) {
      btn.classList.remove('active');
    });
    if (el) {
      el.classList.add('active');
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    var buttons = document.querySelectorAll('.guild-nav-btn');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        switchGuildNav(this);
      });
    });
  });
</script>`;
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
    rawCSSCode = (rawCSSCode || '').trim();

    if (isNavigationComponent()) {
        rawHTMLCode = generateNavigationHTML();
        buildCustomizerPanel();
    } else {
        const customizerCol = document.getElementById('customizer-column');
        const previewCol = document.getElementById('preview-column');
        const codeCol = document.getElementById('code-column');
        if (customizerCol) customizerCol.classList.add('hidden');
        if (previewCol) previewCol.className = 'lg:col-span-6';
        if (codeCol) codeCol.className = 'lg:col-span-6';
    }

    // Render Preview
    renderComponentPreview();

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
            background: #09090c;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Plus Jakarta Sans', sans-serif;
            overflow: hidden;
        }
        ${rawCSSCode}
    </style>
</head>
<body>
    ${rawHTMLCode}
</body>
</html>`;
        iframe.srcdoc = srcdoc;

        iframe.onload = () => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (!doc) return;

                // Click delegation for interactive navigation and buttons
                doc.addEventListener('click', (e) => {
                    const btn = e.target.closest('.guild-nav-btn, .dock-link, button, a');
                    if (btn && (btn.classList.contains('guild-nav-btn') || btn.classList.contains('dock-link'))) {
                        e.preventDefault();
                        const container = btn.closest('.guild-dock-nav, .guild-dock, nav') || doc;
                        const allBtns = Array.from(container.querySelectorAll('.guild-nav-btn, .dock-link'));
                        allBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');

                        const clickedIdx = allBtns.indexOf(btn);
                        if (clickedIdx !== -1) {
                            activeTabIndex = clickedIdx;
                            buildCustomizerPanel();
                        }
                    }
                });
            } catch (err) {
                console.warn('Iframe interactive delegation attach error', err);
            }
        };
    }
}

function buildCustomizerPanel() {
    const container = document.getElementById('customizer-fields-container');
    if (!container) return;

    let html = `
        <div class="space-y-3">
            <!-- Plus (+) and Minus (-) Tab Counter -->
            <div class="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
                <div>
                    <span class="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 block">Total Tabs</span>
                    <span class="text-[13px] font-headline font-extrabold text-slate-900 leading-tight"><span class="text-sky-600 font-mono">${navTabs.length}</span> Options</span>
                </div>
                <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button type="button" onclick="removeLastTab()" title="Remove Option (-)" class="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 flex items-center justify-center font-bold transition-all active:scale-95 border border-slate-200/80 cursor-pointer">
                        <span class="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span class="px-1.5 text-xs font-mono font-black text-slate-800">${navTabs.length}</span>
                    <button type="button" onclick="addTabOption()" title="Add Option (+)" class="w-8 h-8 rounded-lg bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center font-bold transition-all active:scale-95 shadow-sm cursor-pointer">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                    </button>
                </div>
            </div>

            <!-- Dynamic Options List with Rename Fields -->
            <div class="pt-2 border-t border-slate-100">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-bold text-slate-700">Rename Tabs (${navTabs.length})</span>
                    <button type="button" onclick="addTabOption()" class="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-[13px]">add_circle</span>
                        <span>+ Add Option</span>
                    </button>
                </div>

                <div class="space-y-2 max-h-[250px] overflow-y-auto pr-1" id="nav-tabs-list">
    `;

    navTabs.forEach((tab, idx) => {
        const isActive = idx === activeTabIndex;
        html += `
            <div class="flex items-center gap-1.5 p-1.5 rounded-xl border ${isActive ? 'border-sky-400 bg-sky-50/40' : 'border-slate-200 bg-slate-50/70'} transition-all">
                <button type="button" onclick="selectActiveTab(${idx})" title="Click to test active animation" class="w-6 h-6 rounded-lg ${isActive ? 'bg-sky-500 text-white font-black' : 'bg-white text-slate-400 hover:text-slate-700 border border-slate-200 font-bold'} flex items-center justify-center shrink-0 text-[10px] transition-all shadow-2xs">
                    ${idx + 1}
                </button>
                <input 
                    type="text" 
                    value="${tab.label}" 
                    oninput="handleTabRename(${idx}, this.value)" 
                    class="flex-1 text-[11.5px] font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 outline-none focus:border-sky-500 transition-colors shadow-2xs" 
                    placeholder="Tab name..."
                />
                <button type="button" onclick="selectActiveTab(${idx})" class="px-2 py-1 text-[10px] font-bold rounded-lg ${isActive ? 'bg-slate-900 text-white' : 'text-slate-500 bg-white hover:bg-slate-100 border border-slate-200'} transition-all">
                    ${isActive ? 'Active' : 'Test'}
                </button>
                ${navTabs.length > 2 && idx > 0 ? `
                    <button type="button" onclick="deleteTabOption(${idx})" title="Delete Option" class="w-6 h-6 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors">
                        <span class="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                ` : ''}
            </div>
        `;
    });

    html += `
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function addTabOption() {
    const nextIdx = navTabs.length;
    navTabs.push({
        label: `Option ${nextIdx}`,
        hasIcon: false
    });
    activeTabIndex = navTabs.length - 1; // switch to newly created tab
    syncChanges();
}

function removeLastTab() {
    if (navTabs.length <= 2) return;
    navTabs.pop();
    if (activeTabIndex >= navTabs.length) {
        activeTabIndex = navTabs.length - 1;
    }
    syncChanges();
}

function deleteTabOption(index) {
    if (navTabs.length <= 2) return;
    navTabs.splice(index, 1);
    if (activeTabIndex >= navTabs.length) {
        activeTabIndex = navTabs.length - 1;
    }
    syncChanges();
}

function handleTabRename(index, newLabel) {
    if (navTabs[index]) {
        navTabs[index].label = newLabel || (index === 0 ? 'Home' : `Option ${index}`);
        syncChanges();
    }
}

function selectActiveTab(index) {
    activeTabIndex = index;
    syncChanges();
}

function syncChanges() {
    rawHTMLCode = generateNavigationHTML();
    renderComponentPreview();
    buildCustomizerPanel();

    if (currentActiveTab === 'html') {
        const codeOutput = document.getElementById('code-output');
        if (codeOutput) {
            codeOutput.innerHTML = highlightHTML(rawHTMLCode || '<!-- No HTML found -->');
        }
    }
}

// Global functions for inline HTML calls
window.addTabOption = addTabOption;
window.removeLastTab = removeLastTab;
window.deleteTabOption = deleteTabOption;
window.handleTabRename = handleTabRename;
window.selectActiveTab = selectActiveTab;

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

// Make functions global for inline onclick handlers
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
