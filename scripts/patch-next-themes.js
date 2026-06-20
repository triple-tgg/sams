/**
 * Patches next-themes to not render an inline <script> tag,
 * which triggers a React 19 console error:
 *   "Encountered a script tag while rendering React component..."
 *
 * The FOUC prevention is handled by <Script strategy="beforeInteractive">
 * in providers/theme-provider.tsx instead.
 */
const fs = require('fs');
const path = require('path');

const filePaths = [
  path.join(__dirname, '..', 'node_modules', 'next-themes', 'dist', 'index.js'),
  path.join(__dirname, '..', 'node_modules', 'next-themes', 'dist', 'index.mjs')
];

for (const filePath of filePaths) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}, skipping.`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // The exact string we're looking for in the minified next-themes code.
    // The script component Y renders: return t.createElement("script",{...})
    // We replace it with: return null
    const search = 'return t.createElement("script"';
    const idx = content.indexOf(search);

    if (idx !== -1) {
      // Replace from "return t.createElement("script"" up to the matching closing
      // of the memo callback: ...dangerouslySetInnerHTML:{__html:`(${I.toString()})(${p})`}})}),
      // We find the pattern "})})" which closes: createElement args "}" + memo callback ")" + t.memo call ")" 
      const after = content.substring(idx);
      // Find: ...dangerouslySetInnerHTML:{__html:`(${I.toString()})(${p})`}})})
      const endPattern = '`}})})';
      const endIdx = after.indexOf(endPattern);

      if (endIdx !== -1) {
        const fullMatch = after.substring(0, endIdx + endPattern.length);
        content = content.replace(fullMatch, 'return null})');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Patched next-themes: removed inline <script> tag in ${path.basename(filePath)} (React 19 compat)`);
      } else {
        console.warn(`⚠️  Could not find end pattern in ${path.basename(filePath)}, skipping patch.`);
      }
    } else {
      console.log(`ℹ️  next-themes ${path.basename(filePath)} already patched or structure changed, skipping.`);
    }
  } catch (err) {
    console.warn(`⚠️  Could not patch ${path.basename(filePath)}:`, err.message);
  }
}
