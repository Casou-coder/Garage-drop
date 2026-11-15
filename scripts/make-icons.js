// Génère l'icône, l'icône adaptative Android et l'image de lancement dans assets/.
// Lancer : node scripts/make-icons.js (nécessite playwright, utilisé seulement pour ce rendu)
const { chromium } = require('playwright');
const path = require('path');

const BG = '#1C2128', YELLOW = '#FFC93C', RED = '#C1121F';

// Voiture de profil, même construction que CarArt (segment « sport »), dans un repère 160 × 84
const car = (paint, mono) => `
  <g>
    <path d="M46 48 V44 a22 22 0 0 1 22 -22 h28 a10 10 0 0 1 10 10 V48 Z" fill="${paint}"/>
    ${mono ? '' : '<path d="M52 44 V42 a15 15 0 0 1 15 -15 h28 a5 5 0 0 1 5 5 V44 Z" fill="#BFD7EA"/>'}
    <rect x="4" y="40" width="152" height="20" rx="10" fill="${paint}"/>
    ${mono ? '' : '<rect x="148" y="45" width="6" height="5" rx="2" fill="#FFF3B0"/><rect x="6" y="45" width="5" height="5" rx="2" fill="#7A0B13"/><rect x="12" y="50" width="136" height="3" fill="#F2EFE6" opacity="0.9"/>'}
    <circle cx="35" cy="59" r="13" fill="${mono ? paint : '#111418'}"/><circle cx="125" cy="59" r="13" fill="${mono ? paint : '#111418'}"/>
    ${mono ? '' : '<circle cx="35" cy="59" r="5.5" fill="#B8BEC6"/><circle cx="125" cy="59" r="5.5" fill="#B8BEC6"/>'}
  </g>`;

// scale = part de la largeur occupée par le motif (0,66 = zone sûre des icônes adaptatives)
const art = ({ bg, scale, ring = true, mono = false }) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">
    ${ring ? `<circle cx="512" cy="512" r="400" fill="${mono ? 'none' : '#303844'}"/><circle cx="512" cy="512" r="436" fill="none" stroke="${mono ? '#000' : YELLOW}" stroke-width="22" stroke-dasharray="46 30"/>` : ''}
    <g transform="translate(112 290) scale(5)">${car(mono ? '#000' : RED, mono)}</g>
  </g>
</svg>`;

const files = {
  'icon.png': { svg: art({ bg: BG, scale: 0.86 }), transparent: false },
  'android-icon-foreground.png': { svg: art({ bg: null, scale: 0.6 }), transparent: true },
  'android-icon-background.png': { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${BG}"/></svg>`, transparent: false },
  'android-icon-monochrome.png': { svg: art({ bg: null, scale: 0.6, mono: true }), transparent: true },
  'splash-icon.png': { svg: art({ bg: null, scale: 0.9 }), transparent: true },
  'favicon.png': { svg: art({ bg: BG, scale: 0.86 }), transparent: false, size: 48 },
};

(async () => {
  const browser = await chromium.launch();
  for (const [name, f] of Object.entries(files)) {
    const size = f.size || 1024;
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px">${f.svg.replace('width="1024" height="1024"', `width="${size}" height="${size}"`)}</div></body>`);
    await page.screenshot({ path: path.join(__dirname, '..', 'assets', name), omitBackground: f.transparent });
    await page.close();
    console.log(name);
  }
  await browser.close();
})();
