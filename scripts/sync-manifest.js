import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uiDir = path.join(__dirname, '..', 'components', 'ui');
const manifestPath = path.join(uiDir, 'manifest.json');

function syncManifest() {
  if (!fs.existsSync(uiDir)) {
    console.error('Directory components/ui does not exist.');
    return;
  }

  const entries = fs.readdirSync(uiDir, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory()).map(e => e.name);

  let manifestData = { components: [] };
  if (fs.existsSync(manifestPath)) {
    try {
      manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      console.warn('Could not parse existing manifest.json, creating new.');
    }
  }

  const existingMap = new Map();
  (manifestData.components || []).forEach(item => {
    existingMap.set(item.folder || item.id, item);
  });

  const updatedComponents = folders.map(folder => {
    if (existingMap.has(folder)) {
      const existing = existingMap.get(folder);
      return {
        ...existing,
        id: folder,
        folder: folder,
        title: folder
      };
    } else {
      const category = folder.split('-')[0].charAt(0).toUpperCase() + folder.split('-')[0].slice(1);
      return {
        id: folder,
        folder: folder,
        title: folder,
        category: category,
        subtitle: 'UI Component'
      };
    }
  });

  fs.writeFileSync(manifestPath, JSON.stringify({ components: updatedComponents }, null, 2), 'utf8');
  console.log(`Successfully synced manifest.json. Found ${updatedComponents.length} component folders.`);
}

syncManifest();
