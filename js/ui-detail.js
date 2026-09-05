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

// Preset Icons Bank
const ICONS_MAP = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34c0-.75.39-1.44 1.03-1.83L8 12.2V9h8v3.2l.97.63c.64.39 1.03 1.08 1.03 1.83V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34"/>',
    tree: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    match: '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="4" y2="20"/><line x1="3" y1="19" x2="5" y2="21"/>',
    profile: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    admin: '<rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'
};

const DEFAULT_NAV_TABS = [
    { label: "Arena", icon: "home" },
    { label: "Ranks", icon: "trophy" },
    { label: "Tree", icon: "tree" },
    { label: "Match", icon: "match" },
    { label: "Profile", icon: "profile" },
    { label: "Admin", icon: "admin" }
];

let currentNavTabs = [...DEFAULT_NAV_TABS];
let activeTabIndex = 1; // Ranks is active default

function isNavigationComponent() {
    return folderParam.toLowerCase().includes('nav') || initialHTMLCode.includes('guild-dock') || initialHTMLCode.includes('dock-link');
}

function generateNavHTML(tabs, activeIdx) {
    const linksHTML = tabs.map((tab, idx) => {
        const isActive = idx === activeIdx;
        const iconSvg = ICONS_MAP[tab.icon] || ICONS_MAP.star;
        const tabId = tab.label.toLowerCase().replace(/\s+/g, '-');
        return `
    <!-- ${idx + 1}. ${tab.label.toUpperCase()} -->
    <a href="#${tabId}" class="dock-link${isActive ? ' active' : ''}" data-tab="${tabId}">
      <svg class="dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${iconSvg}
      </svg>
      <span>${tab.label}</span>
    </a>`;
    }).join('\n');

    return `<div class="dock-container">
  <!-- FLOATING CAPSULE NAVIGATION DOCK -->
  <nav class="guild-dock" id="guildDock">
${linksHTML}
  </nav>
</div>

<script>
  document.querySelectorAll('.dock-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.dock-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
</script>`;
}

function buildNavigationCustomizerPanel() {
    const container = document.getElementById('text-customizer-fields');
    if (!container) return;

    let html = `
        <div class="space-y-3">
            <!-- Preset Selector -->
            <div>
                <label class="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Presets &amp; Sizes</label>
                <div class="grid grid-cols-2 gap-1.5">
                    <button type="button" onclick="applyNavPreset('arena')" class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-between transition-all">
                        <span>Guild Arena</span>
                        <span class="text-[10px] text-purple-600 font-mono font-bold bg-purple-50 px-1.5 rounded">6 Tabs</span>
                    </button>
                    <button type="button" onclick="applyNavPreset('numbered5')" class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-between transition-all">
                        <span>Numbered</span>
                        <span class="text-[10px] text-sky-600 font-mono font-bold bg-sky-50 px-1.5 rounded">5 Opts</span>
                    </button>
                    <button type="button" onclick="applyNavPreset('compact3')" class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-between transition-all">
                        <span>Compact</span>
                        <span class="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 px-1.5 rounded">3 Opts</span>
                    </button>
                    <button type="button" onclick="applyNavPreset('expanded8')" class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-between transition-all">
                        <span>Expanded</span>
                        <span class="text-[10px] text-amber-600 font-mono font-bold bg-amber-50 px-1.5 rounded">8 Opts</span>
                    </button>
                </div>
            </div>

            <!-- Add / Remove Action Header -->
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-700">Tabs / Options (${currentNavTabs.length})</span>
                <button type="button" onclick="addNavTab()" class="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95">
                    <span class="material-symbols-outlined text-[14px]">add</span>
                    <span>Add Option</span>
                </button>
            </div>

            <!-- Dynamic Tab List -->
            <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="nav-tabs-list">
    `;

    currentNavTabs.forEach((tab, idx) => {
        const isActive = idx === activeTabIndex;
        html += `
            <div class="flex items-center gap-1.5 p-1.5 rounded-xl border ${isActive ? 'border-sky-400 bg-sky-50/40' : 'border-slate-200 bg-slate-50/70'} transition-all">
                <button type="button" onclick="selectActiveTab(${idx})" title="Click to test active animation" class="w-6 h-6 rounded-lg ${isActive ? 'bg-sky-500 text-white' : 'bg-white text-slate-400 hover:text-slate-700 border border-slate-200'} flex items-center justify-center shrink-0 text-[10px] font-bold transition-all shadow-2xs">
                    ${idx + 1}
                </button>
                <input 
                    type="text" 
                    value="${tab.label}" 
                    oninput="handleNavTabLabelChange(${idx}, this.value)" 
                    class="flex-1 text-[11.5px] font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-sky-500 transition-colors shadow-2xs" 
                    placeholder="Option name..."
                />
                <button type="button" onclick="selectActiveTab(${idx})" class="px-1.5 py-1 text-[10px] font-bold rounded ${isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200/70'} transition-all">
                    ${isActive ? 'Active' : 'Test'}
                </button>
                ${currentNavTabs.length > 2 ? `
                    <button type="button" onclick="removeNavTab(${idx})" title="Remove Option" class="w-6 h-6 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors">
                        <span class="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                ` : ''}
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function addNavTab() {
    const iconKeys = Object.keys(ICONS_MAP);
    const nextIdx = currentNavTabs.length + 1;
    const randomIcon = iconKeys[nextIdx % iconKeys.length];
    currentNavTabs.push({
        label: `Option ${nextIdx}`,
        icon: randomIcon
    });
    activeTabIndex = currentNavTabs.length - 1; // switch to newly added tab
    syncNavChanges();
}

function removeNavTab(index) {
    if (currentNavTabs.length <= 2) return;
    currentNavTabs.splice(index, 1);
    if (activeTabIndex >= currentNavTabs.length) {
        activeTabIndex = currentNavTabs.length - 1;
    }
    syncNavChanges();
}

function handleNavTabLabelChange(index, newLabel) {
    if (currentNavTabs[index]) {
        currentNavTabs[index].label = newLabel || `Option ${index + 1}`;
        syncNavChanges();
    }
}

function selectActiveTab(index) {
    activeTabIndex = index;
    syncNavChanges();
}

function applyNavPreset(preset) {
    if (preset === 'arena') {
        currentNavTabs = [...DEFAULT_NAV_TABS];
        activeTabIndex = 1;
    } else if (preset === 'numbered5') {
        currentNavTabs = [
            { label: "Option 1", icon: "home" },
            { label: "Option 2", icon: "trophy" },
            { label: "Option 3", icon: "tree" },
            { label: "Option 4", icon: "match" },
            { label: "Option 5", icon: "profile" }
        ];
        activeTabIndex = 0;
    } else if (preset === 'compact3') {
        currentNavTabs = [
            { label: "Option 1", icon: "home" },
            { label: "Option 2", icon: "trophy" },
            { label: "Option 3", icon: "profile" }
        ];
        activeTabIndex = 0;
    } else if (preset === 'expanded8') {
        currentNavTabs = [
            { label: "Option 1", icon: "home" },
            { label: "Option 2", icon: "trophy" },
            { label: "Option 3", icon: "tree" },
            { label: "Option 4", icon: "match" },
            { label: "Option 5", icon: "profile" },
            { label: "Option 6", icon: "admin" },
            { label: "Option 7", icon: "star" },
            { label: "Option 8", icon: "settings" }
        ];
        activeTabIndex = 1;
    }
    syncNavChanges();
}

function syncNavChanges() {
    rawHTMLCode = generateNavHTML(currentNavTabs, activeTabIndex);
    renderComponentPreview();
    buildNavigationCustomizerPanel();

    if (currentActiveTab === 'html') {
        const codeOutput = document.getElementById('code-output');
        if (codeOutput) {
            codeOutput.innerHTML = highlightHTML(rawHTMLCode || '<!-- No HTML found -->');
        }
    }
}

// Global functions for inline HTML calls
window.addNavTab = addNavTab;
window.removeNavTab = removeNavTab;
window.handleNavTabLabelChange = handleNavTabLabelChange;
window.selectActiveTab = selectActiveTab;
window.applyNavPreset = applyNavPreset;

function buildTextCustomizerPanel() {
    const customizerCol = document.getElementById('text-customizer-column');
    const previewCol = document.getElementById('preview-column');
    const codeCol = document.getElementById('code-column');
    const container = document.getElementById('text-customizer-fields');

    if (isNavigationComponent()) {
        if (customizerCol) customizerCol.classList.remove('hidden');
        if (previewCol) previewCol.className = 'lg:col-span-4';
        if (codeCol) codeCol.className = 'lg:col-span-5';
        buildNavigationCustomizerPanel();
        return;
    }

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
