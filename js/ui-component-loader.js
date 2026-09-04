/**
 * Dynamic UI Component Folder Loader
 * Automatically discovers all component folders directly inside components/ui/{folder}/
 * Direct folder structure: components/ui/{folder}/index.html & style.css
 * If user creates a new folder in components/ui/, card automatically renders!
 */

(async function () {
  const container = document.getElementById('cards-container');
  if (!container) return;

  try {
    let folderItems = [];
    const knownFoldersSet = new Set();

    // 1. Try reading manifest.json
    try {
      const manifestRes = await fetch('components/ui/manifest.json?v=' + Date.now());
      if (manifestRes.ok) {
        const manifestData = await manifestRes.json();
        (manifestData.components || []).forEach(item => {
          const folderName = item.folder || item.id || item.title;
          if (folderName && !knownFoldersSet.has(folderName)) {
            knownFoldersSet.add(folderName);
            let cat = item.category || folderName.split('-')[0];
            if (/^load/i.test(cat) || /^load/i.test(folderName)) cat = 'Loader';
            folderItems.push({
              id: item.id || folderName,
              folder: folderName,
              title: item.title || folderName,
              category: cat,
              subtitle: item.subtitle || 'UI Micro Component',
              keywords: item.keywords || ''
            });
          }
        });
      }
    } catch (e) {
      console.warn('Manifest fetch skipped or failed', e);
    }

    // 2. Try auto-discovering new folders from local server directory listing HTML
    try {
      const dirRes = await fetch('components/ui/?v=' + Date.now());
      if (dirRes.ok) {
        const htmlText = await dirRes.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const links = Array.from(doc.querySelectorAll('a'));

        links.forEach(a => {
          const href = a.getAttribute('href') || '';
          // Normalize folder name
          const cleanName = decodeURIComponent(href.replace(/\/$/, '').split('/').pop());
          if (
            cleanName &&
            !cleanName.includes('.') &&
            cleanName !== '..' &&
            cleanName !== 'components' &&
            cleanName !== 'ui' &&
            !knownFoldersSet.has(cleanName)
          ) {
            knownFoldersSet.add(cleanName);
            let cat = cleanName.split('-')[0];
            if (/^load/i.test(cat) || /^load/i.test(cleanName)) cat = 'Loader';
            else cat = cat.charAt(0).toUpperCase() + cat.slice(1);
            folderItems.push({
              id: cleanName,
              folder: cleanName,
              title: cleanName,
              category: cat,
              subtitle: 'Dynamic UI Component',
              keywords: ''
            });
          }
        });
      }
    } catch (e) {
      // Directory indexing disabled on static hosting; manifest.json fallback handles it
    }

    if (folderItems.length === 0) return;

    // Clear static fallback slots
    container.innerHTML = '';

    for (let i = 0; i < folderItems.length; i++) {
      const item = folderItems[i];
      const folderName = item.folder;
      const folderPath = `components/ui/${encodeURIComponent(folderName)}`;

      let htmlContent = '';
      let cssContent = '';
      let hasLiveCode = false;

      try {
        // Direct folder file fetch: index.html & style.css (with Style.css fallback)
        let [htmlRes, cssRes] = await Promise.all([
          fetch(`${folderPath}/index.html?v=` + Date.now()).catch(() => null),
          fetch(`${folderPath}/style.css?v=` + Date.now()).catch(() => null)
        ]);

        if (htmlRes && htmlRes.ok) {
          htmlContent = await htmlRes.text();
        }
        if (cssRes && cssRes.ok) {
          cssContent = await cssRes.text();
        } else {
          // Fallback to Style.css if style.css returned 404
          const altCssRes = await fetch(`${folderPath}/Style.css?v=` + Date.now()).catch(() => null);
          if (altCssRes && altCssRes.ok) {
            cssContent = await altCssRes.text();
          }
        }

        // Check if there is actual non-comment code inside index.html
        const cleanHtml = htmlContent.replace(/<!--[\s\S]*?-->/g, '').trim();
        hasLiveCode = cleanHtml.length > 0;
      } catch (err) {
        console.warn(`Could not load files for ${folderName}`, err);
      }

      let category = (item.category || folderName.split('-')[0] || '').trim();
      if (/^load/i.test(category) || /^load/i.test(folderName)) category = 'Loader';

      const displayTitle = item.title || folderName;
      const keywords = `${category.toLowerCase()} ${displayTitle.toLowerCase()} ${folderName.toLowerCase()} ${item.keywords || ''} ${item.subtitle || ''} ui component components/ui/${folderName}`;

      // Card wrapper element
      const cardEl = document.createElement('div');
      cardEl.className = 'ui-item group apple-elevated-card flex flex-col justify-between rounded-none p-0 bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300';
      cardEl.setAttribute('data-category', category.toLowerCase());
      cardEl.setAttribute('data-keywords', keywords.toLowerCase());
      cardEl.setAttribute('data-id', item.id || folderName);

      // Visual preview area (Iframe if live code, placeholder if empty)
      let previewHtml = '';

      if (hasLiveCode) {
        // Strip live server script if present
        const cleanedHtml = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();

        const srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      background: transparent;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
      overflow: hidden;
    }
    ${cssContent}
  </style>
</head>
<body>
  ${cleanedHtml}
</body>
</html>`;

        previewHtml = `
        <a href="ui-detail.html?folder=${encodeURIComponent(folderName)}" class="block aspect-[16/10.5] w-full rounded-none overflow-hidden relative group/img bg-[#f8fafc] border-b border-slate-200/80 shadow-xs flex items-center justify-center p-2 select-none">
          <iframe srcdoc="${srcdoc.replace(/"/g, '&quot;')}" class="w-full h-full border-0 pointer-events-none rounded-none" title="${folderName}"></iframe>
          <div class="absolute inset-0 bg-transparent group-hover/img:bg-purple-900/5 transition-colors pointer-events-none"></div>
        </a>`;
      } else {
        previewHtml = `
        <a href="ui-detail.html?folder=${encodeURIComponent(folderName)}" class="block aspect-[16/10.5] w-full rounded-none overflow-hidden apple-image-container relative cursor-pointer group/img bg-[#f8fafc] border-b border-dashed border-slate-300 hover:border-purple-400 hover:bg-purple-50/20 transition-all flex flex-col items-center justify-center text-center p-5 select-none">
          <div class="w-10 h-10 rounded-none bg-white border border-slate-200/80 shadow-2xs group-hover/img:shadow-md group-hover/img:scale-110 text-slate-400 group-hover/img:text-purple-600 flex items-center justify-center mb-2 transition-all">
            <span class="material-symbols-outlined text-[22px]">folder_open</span>
          </div>
          <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 group-hover/img:text-purple-700 transition-colors">Folder: ${folderName}</span>
          <span class="text-[9.5px] font-sans font-medium text-slate-400 mt-1">Paste HTML in index.html & CSS in style.css</span>
        </a>`;
      }

      const rating = (4.7 + ((i % 4) * 0.1)).toFixed(1);
      const count = 24 + ((i + 1) * 3);

      cardEl.innerHTML = `
        ${previewHtml}
        <div class="pt-3 px-3 pb-3 w-full flex flex-col justify-between flex-1">
          <div class="flex items-center justify-between gap-3 w-full min-w-0">
            <div class="min-w-0 flex-1">
              <a href="ui-detail.html?folder=${encodeURIComponent(folderName)}" class="card-title text-[14.5px] sm:text-[15.5px] font-mono font-bold text-slate-900 group-hover:text-purple-600 transition-colors truncate block leading-snug card-title-text" title="Folder Name: ${folderName}">
                ${folderName}
              </a>
              <span class="card-subtitle text-[11.5px] sm:text-[12px] font-medium text-slate-500 tracking-wide truncate block mt-0.5">
                ${item.category || 'Component'} &middot; ${item.subtitle || 'Folder UI Primitive'}
              </span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <div class="project-rating-badge flex items-center text-[#00e054] text-[12px] sm:text-[13px] font-bold select-none cursor-pointer tracking-tight hover:brightness-125 transition-all" data-project-id="${item.id}" data-rating="${rating}" data-rating-count="${count}" title="Rating: ${rating} ★">
                <span class="letterboxd-stars text-[#00e054] font-mono tracking-tighter">★★★★★</span>
              </div>
              <button type="button" class="fav-toggle-btn card-action-btn w-6 h-6 sm:w-7 sm:h-7 bg-transparent hover:text-red-500 text-slate-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center p-0 border-0 outline-none" data-project-id="${item.id}" aria-label="Toggle Favorite" onclick="toggleHeart(event, this)">
                <span class="material-symbols-outlined text-[18px] sm:text-[19px]" style="font-variation-settings: 'FILL' 0;">favorite</span>
              </button>
              <a href="ui-detail.html?folder=${encodeURIComponent(folderName)}" class="card-action-btn w-6 h-6 sm:w-7 sm:h-7 bg-transparent text-slate-400 hover:text-purple-600 active:scale-90 transition-all flex items-center justify-center p-0 border-0 outline-none" title="View Code / Component">
                <svg class="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2.5" y="3" width="19" height="13.5" rx="3.5" ry="3.5"></rect>
                  <path d="M8 7.5L5.5 9.75L8 12"></path>
                  <line x1="13" y1="6.5" x2="11" y2="13"></line>
                  <path d="M16 7.5L18.5 9.75L16 12"></path>
                  <line x1="8" y1="20" x2="16" y2="20"></line>
                </svg>
              </a>
            </div>
          </div>

          <!-- Explicit Folder Path Badge matching main folder name -->
          <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600 bg-slate-50/90 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
            <div class="flex items-center gap-1.5 truncate" title="Folder Location: components/ui/${folderName}">
              <span class="material-symbols-outlined text-[14px] text-purple-600">folder</span>
              <span class="font-bold text-slate-800 tracking-tight">components/ui/<span class="text-purple-700">${folderName}</span></span>
            </div>
            <span class="text-[9px] text-purple-700 font-bold bg-purple-100/90 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ml-1">html / css</span>
          </div>
        </div>
      `;

      container.appendChild(cardEl);
    }

    // Re-initialize pagination & filtering if main script functions exist
    if (typeof window.initUIPagination === 'function') {
      window.initUIPagination();
    }
  } catch (e) {
    console.error('Error loading UI component folders:', e);
  }
})();
