//
// NOTE: this functionality is obsolete. The SDK no longer uses the Shady DOM polyfill.
//

const path = require('path');
const fs = require('fs');

// Default Location of theme repo
const twThemeRepo = path.join('..', 'tw-theme-engine');

// The meta folder (the input)
const metaFolder = path.join(twThemeRepo, 'theme-designer', 'wc-meta');

if (!fs.existsSync(metaFolder)) {
    throw Error(`ERROR: ${metaFolder} does not exist.\nSee src/utils/ptcs-style-unit/compile-parts.md`);
}

// Result filename
const output = path.join('src', 'utils', 'ptcs-style-unit', 'map-parts.js');

// Create parts database
const reg = {};


function copyWcName(name) {
    if ((name.startsWith('ptcs') || name.startsWith('ptc1')) && name[4] !== '-') {
        return name.substring(0, 4) + '-' + name.substring(4);
    }
    return name;
}


function copyWC(wc) {
    if (typeof wc === 'string') {
        return {name: copyWcName(wc)};
    }
    return {name: copyWcName(wc.name), variant: wc.variant};
}


fs.readdirSync(metaFolder, 'utf8').forEach(wc => {
    if (wc.startsWith('ptcs-') || wc.startsWith('ptc1-')) {
        const meta = JSON.parse(fs.readFileSync(`${metaFolder}/${wc}/meta.json`, 'utf8'));
        const parts = {};
        let b = false;
        for (const k in meta.part) {
            if (meta.part[k].$wc) {
                parts[k] = copyWC(meta.part[k].$wc);
                b = true;
            }
        }
        if (b) {
            reg[wc] = parts;
        }
    }
});


// The result file
const result = `// See compile-parts.md for information about how to generate this file

export const mapPart = (() => {
const partMap = ${JSON.stringify(reg, null, 2)};

return (wc, part) => {
    const a = partMap[wc];
    return a ? a[part] : undefined;
}
})();`;

// Save result file
fs.writeFileSync(output, result);
