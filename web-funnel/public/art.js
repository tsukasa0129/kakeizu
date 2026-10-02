// Web ports of the app's drawings, so the funnel looks exactly like the in-app onboarding:
//   mascot()      ← src/components/Mascot.tsx (まめた, with moods, bobbing and blinking)
//   appIcon()     ← src/components/Icon.tsx (the flat two-tone icons)
//   ion()         ← the Ionicons glyphs the app uses via @expo/vector-icons (ionicons 7, MIT)
//   bookOpening() ← src/components/BookOpening.tsx

const C = {
  bg: '#FFFFFF', surface: '#F7F7F7', border: '#E5E5E5', locked: '#AFAFAF', text: '#3C3C3C', textMuted: '#777777',
  green: '#58CC02', greenDark: '#58A700', greenLight: '#D7FFB8', blue: '#1CB0F6', blueDark: '#1899D6', blueLight: '#DDF4FF',
  orange: '#FF9600', orangeDark: '#CD7900', yellow: '#FFC800', yellowDark: '#E5A800', purple: '#CE82FF', red: '#FF4B4B',
  redDark: '#EA2B2B', male: '#1CB0F6', female: '#FF86D0',
};
window.C = C;

// ---- まめた ----

const FUR = '#EBA466';
const DARK = '#5B3A26';
const INK = '#2B1C13';
const CREAM = '#FFF3E2';

function eyes(mood) {
  const big = mood === 'wow';
  const look = mood === 'think' ? { x: 1.8, y: -2.6 } : { x: 0, y: 1 };
  const p = big ? 7.2 : 6.3;
  return [44, 76]
    .map((cx) => {
      const x = cx + look.x;
      const y = 59 + look.y;
      return `<ellipse cx="${cx}" cy="59" rx="${big ? 9 : 8.2}" ry="${big ? 10.4 : 9.6}" fill="#fff"/>
        <ellipse cx="${x}" cy="${y}" rx="${p}" ry="${p + 1.2}" fill="${INK}"/>
        <circle cx="${x + 2}" cy="${y - 2.6}" r="${big ? 2.6 : 2.2}" fill="#fff"/>
        <circle cx="${x - 2}" cy="${y + 2.4}" r="1" fill="#fff"/>`;
    })
    .join('');
}

const MOUTHS = {
  wow: '<ellipse cx="60" cy="79" rx="4.2" ry="4.8" fill="#D9475B"/><ellipse cx="60" cy="81" rx="2.6" ry="1.8" fill="#FF9AAE"/>',
  think: `<path d="M55.5 78.5 Q58 77 60 78.5 Q62 80 64.5 78.5" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  happy: `<path d="M54.5 76.5 Q57.3 80.5 60 77 Q62.7 80.5 65.5 76.5" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
};

/** まめた as inline SVG. `animate` bobs it and blinks every few seconds (like the app's idle loop). */
window.mascot = (size = 120, mood = 'happy', animate = false) => `
  <span class="mascot${animate ? ' bob' : ''}" style="width:${size}px;height:${size}px;--lift:${-size * 0.04}px" aria-hidden="true">
  <svg width="${size}" height="${size}" viewBox="0 0 120 120">
    <ellipse cx="60" cy="113" rx="30" ry="4.5" fill="#000" opacity=".08"/>
    <path d="M84 100 C100 102 112 92 110 78 C109 70 101 69 98 75 C96 80 99 86 92 90 C88 92 84 92 82 92 Z" fill="${FUR}"/>
    <path d="M101 72.5 C105 70 109 72.5 110 77 L103.5 79 C102.5 76.5 100.5 75.5 98.6 76 Z" fill="${DARK}"/>
    <path d="M97.4 82.5 L105.5 86 C104 89 101.5 91.5 98.5 93 L94 88 C96 86.6 97 84.8 97.4 82.5 Z" fill="${DARK}"/>
    <circle cx="34" cy="31" r="12.5" fill="${FUR}"/><circle cx="86" cy="31" r="12.5" fill="${FUR}"/>
    <circle cx="34.5" cy="32" r="7" fill="${DARK}"/><circle cx="85.5" cy="32" r="7" fill="${DARK}"/>
    <path d="M60 21 C90 21 102 41 102 66 C102 92 85 109 60 109 C35 109 18 92 18 66 C18 41 30 21 60 21 Z" fill="${FUR}"/>
    <path d="M96 46 C100.5 54 102 61 102 66 C102 92 85 109 60 109 C77 103 91 89 93 68 C94 60 95.5 52 96 46 Z" fill="#D98C4C" opacity=".7"/>
    <ellipse cx="60" cy="98" rx="16" ry="8.5" fill="${CREAM}"/>
    <ellipse cx="46" cy="108" rx="8" ry="4" fill="${DARK}"/><ellipse cx="74" cy="108" rx="8" ry="4" fill="${DARK}"/>
    <ellipse cx="43" cy="60" rx="14" ry="12" fill="#9C5F38" transform="rotate(-14 43 60)"/>
    <ellipse cx="77" cy="60" rx="14" ry="12" fill="#9C5F38" transform="rotate(14 77 60)"/>
    <ellipse cx="60" cy="75" rx="15" ry="11" fill="${CREAM}"/>
    <g class="eyes-open">${eyes(mood)}</g>
    <g class="eyes-closed">
      <path d="M38 60 Q44 54 50 60" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M70 60 Q76 54 82 60" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
    <ellipse cx="31" cy="76" rx="5.5" ry="3.4" fill="#FF9FB2" opacity=".75"/>
    <ellipse cx="89" cy="76" rx="5.5" ry="3.4" fill="#FF9FB2" opacity=".75"/>
    <path d="M55.6 70 Q60 67.6 64.4 70 Q63.2 73.6 60 74.2 Q56.8 73.6 55.6 70 Z" fill="${INK}"/>
    ${MOUTHS[mood]}
    <path d="M60 22 C56 16 52 9 55 3 C63 4 66 12 61.5 21.5 Z" fill="#58CC02"/>
    <path d="M60.6 20 C58.5 15 57 10 56 6" stroke="#3F9A00" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    ${mood === 'think' ? '<path d="M99 36 Q103 43 99 46 Q95 43 99 36 Z" fill="#8ED3FF"/>' : ''}
    ${
      mood === 'wow'
        ? `<path d="M22 26 l1.6 -4 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 Z" fill="${C.yellow}"/>
           <path d="M98 18 l1.2 -3 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 Z" fill="${C.yellow}"/>`
        : ''
    }
  </svg></span>`;

// Blink every animated mascot for a moment every few seconds.
setInterval(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const all = document.querySelectorAll('.mascot.bob');
  all.forEach((m) => m.classList.add('blink'));
  setTimeout(() => all.forEach((m) => m.classList.remove('blink')), 140);
}, 3200);

/** Mascot with a speech bubble to its right; the bubble pops in. */
window.mascotSays = (text, mood = 'happy') =>
  `<div class="says">${mascot(84, mood, true)}<div class="bubble pop-in" style="--d:120ms"><i></i>${text}</div></div>`;

// ---- flat icons (24×24, app palette) ----

const WOOD = '#C98B4B';
const WOOD_DARK = '#A0672E';
const FLAT_ICONS = {
  scroll: `<rect x="5" y="4" width="14" height="16" fill="#FFF3D6" stroke="${WOOD}" stroke-width="1.4"/>
    <path d="M8.5 9.5h7M8.5 12.5h7M8.5 15.5h4.5" stroke="${WOOD}" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="3" y="2.5" width="18" height="3.5" rx="1.75" fill="${WOOD_DARK}"/><rect x="3" y="18" width="18" height="3.5" rx="1.75" fill="${WOOD_DARK}"/>`,
  office: `<rect x="5" y="3" width="14" height="18.5" rx="1" fill="${C.textMuted}"/>
    ${[6, 10, 14].map((y) => `<rect x="7.5" y="${y}" width="3" height="2.2" rx=".4" fill="${C.blueLight}"/><rect x="13.5" y="${y}" width="3" height="2.2" rx=".4" fill="${C.blueLight}"/>`).join('')}
    <rect x="10.5" y="17.5" width="3" height="4" fill="${C.blueLight}"/>`,
  search: `<path d="M15 15l5.5 5.5" stroke="${C.text}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="10.5" cy="10.5" r="6" fill="${C.blueLight}" stroke="${C.blue}" stroke-width="2.4"/>`,
  flag: `<path d="M5.5 3v18.5" stroke="${C.textMuted}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M6.5 4h12l-3 4 3 4h-12z" fill="${C.green}" stroke-linejoin="round"/>`,
  tree: `<rect x="10.5" y="13" width="3" height="8.5" rx="1" fill="${WOOD_DARK}"/>
    <circle cx="7.5" cy="12" r="4.5" fill="${C.greenDark}"/><circle cx="16.5" cy="12" r="4.5" fill="${C.greenDark}"/>
    <circle cx="12" cy="8" r="6" fill="${C.green}"/>`,
  rocket: `<path d="M8 12l-3 4v2.5l3-2zM16 12l3 4v2.5l-3-2z" fill="${C.red}"/><path d="M10 16h4l-2 5.5z" fill="${C.orange}"/>
    <path d="M12 2c4 3 5 8 4 14H8C7 10 8 5 12 2z" fill="${C.blueLight}" stroke="${C.blue}" stroke-width="1.3"/>
    <circle cx="12" cy="9" r="2.2" fill="${C.blue}"/>`,
  flame: `<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3.5 2-5 3-7.5 1 2.5 2 3 2.5 3.5 1-2.5 1-5.5.5-8z" fill="${C.orange}"/>
    <path d="M12 11c1 2 3 3 3 5.5a3 3 0 0 1-6 0c0-2 2-3 3-5.5z" fill="${C.yellow}"/>`,
  books: `<rect x="3" y="16.5" width="18" height="4.5" rx="1" fill="${C.blue}"/><rect x="4.5" y="11.5" width="15" height="4.5" rx="1" fill="${C.green}"/>
    <rect x="3.5" y="6.5" width="16" height="4.5" rx="1" fill="${C.red}"/>
    <path d="M6 18.75h3M7.5 13.75h3M6.5 8.75h3" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
  hourglass: `<path d="M7 4.5h10c0 4.5-4 6-4 7.5s4 3 4 7.5H7c0-4.5 4-6 4-7.5s-4-3-4-7.5z" fill="${C.blueLight}" stroke="${C.blue}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M9 7.5h6c-.5 1.5-2.5 2.5-3 3.5-.5-1-2.5-2-3-3.5zM8.5 19c.5-2.5 2.5-3 3.5-4 1 1 3 1.5 3.5 4z" fill="${C.yellow}"/>
    <rect x="5" y="2" width="14" height="2.5" rx="1" fill="${C.textMuted}"/><rect x="5" y="19.5" width="14" height="2.5" rx="1" fill="${C.textMuted}"/>`,
  pin: `<path d="M12 22s-7-7.5-7-12.5a7 7 0 0 1 14 0C19 14.5 12 22 12 22z" fill="${C.red}"/><circle cx="12" cy="9.5" r="2.8" fill="#fff"/>`,
  check: `<path d="M5 12.5l5 5L19 7" fill="none" stroke="${C.green}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  cross: `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="${C.red}" stroke-width="3.2" stroke-linecap="round"/>`,
};
window.appIcon = (name, size = 24) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${FLAT_ICONS[name]}</svg>`;

// ---- Ionicons ----

const ION = {
  'arrow-forward': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M268 112l144 144-144 144M392 256H100"/>',
  'book': '<path d="M202.24 74C166.11 56.75 115.61 48.3 48 48a31.36 31.36 0 00-17.92 5.33A32 32 0 0016 79.9V366c0 19.34 13.76 33.93 32 33.93 71.07 0 142.36 6.64 185.06 47a4.11 4.11 0 006.94-3V106.82a15.89 15.89 0 00-5.46-12A143 143 0 00202.24 74zM481.92 53.3A31.33 31.33 0 00464 48c-67.61.3-118.11 8.71-154.24 26a143.31 143.31 0 00-32.31 20.78 15.93 15.93 0 00-5.45 12v337.13a3.93 3.93 0 006.68 2.81c25.67-25.5 70.72-46.82 185.36-46.81a32 32 0 0032-32v-288a32 32 0 00-14.12-26.61z"/>',
  'briefcase': '<path d="M336 80H176a16 16 0 00-16 16v16h192V96a16 16 0 00-16-16z" fill="none"/><path d="M496 176a64.07 64.07 0 00-64-64h-48V96a48.05 48.05 0 00-48-48H176a48.05 48.05 0 00-48 48v16H80a64.07 64.07 0 00-64 64v48h480zm-144-64H160V96a16 16 0 0116-16h160a16 16 0 0116 16zM336 264a24 24 0 01-24 24H200a24 24 0 01-24-24v-4a4 4 0 00-4-4H16v144a64 64 0 0064 64h352a64 64 0 0064-64V256H340a4 4 0 00-4 4z"/>',
  'chatbubbles': '<path d="M60.44 389.17c0 .07 0 .2-.08.38.03-.12.05-.25.08-.38zM439.9 405.6a26.77 26.77 0 01-9.59-2l-56.78-20.13-.42-.17a9.88 9.88 0 00-3.91-.76 10.32 10.32 0 00-3.62.66c-1.38.52-13.81 5.19-26.85 8.77-7.07 1.94-31.68 8.27-51.43 8.27-50.48 0-97.68-19.4-132.89-54.63A183.38 183.38 0 01100.3 215.1a175.9 175.9 0 014.06-37.58c8.79-40.62 32.07-77.57 65.55-104A194.76 194.76 0 01290.3 32c52.21 0 100.86 20 137 56.18 34.16 34.27 52.88 79.33 52.73 126.87a177.86 177.86 0 01-30.3 99.15l-.19.28-.74 1c-.17.23-.34.45-.5.68l-.15.27a21.63 21.63 0 00-1.08 2.09l15.74 55.94a26.42 26.42 0 011.12 7.11 24 24 0 01-24.03 24.03z"/><path d="M299.87 425.39a15.74 15.74 0 00-10.29-8.1c-5.78-1.53-12.52-1.27-17.67-1.65a201.78 201.78 0 01-128.82-58.75A199.21 199.21 0 0186.4 244.16C85 234.42 85 232 85 232a16 16 0 00-28-10.58s-7.88 8.58-11.6 17.19a162.09 162.09 0 0011 150.06C59 393 59 395 58.42 399.5c-2.73 14.11-7.51 39-10 51.91a24 24 0 008 22.92l.46.39A24.34 24.34 0 0072 480a23.42 23.42 0 009-1.79l53.51-20.65a8.05 8.05 0 015.72 0c21.07 7.84 43 12 63.78 12a176 176 0 0074.91-16.66c5.46-2.56 14-5.34 19-11.12a15 15 0 001.95-16.39z"/>',
  'checkmark-circle': '<path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/>',
  'compass': '<circle cx="256" cy="256" r="24"/><path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm105.07 113.33l-46.88 117.2a64 64 0 01-35.66 35.66l-117.2 46.88a8 8 0 01-10.4-10.4l46.88-117.2a64 64 0 0135.66-35.66l117.2-46.88a8 8 0 0110.4 10.4z"/>',
  'document-text': '<path d="M428 224H288a48 48 0 01-48-48V36a4 4 0 00-4-4h-92a64 64 0 00-64 64v320a64 64 0 0064 64h224a64 64 0 0064-64V228a4 4 0 00-4-4zm-92 160H176a16 16 0 010-32h160a16 16 0 010 32zm0-80H176a16 16 0 010-32h160a16 16 0 010 32z"/><path d="M419.22 188.59L275.41 44.78a2 2 0 00-3.41 1.41V176a16 16 0 0016 16h129.81a2 2 0 001.41-3.41z"/>',
  'gift': '<path d="M200 144h40v-40a40 40 0 10-40 40zM352 104a40 40 0 00-80 0v40h40a40 40 0 0040-40z" fill="none"/><path d="M80 416a64 64 0 0064 64h92a4 4 0 004-4V292a4 4 0 00-4-4H88a8 8 0 00-8 8zM240 252V144h32v108a4 4 0 004 4h140a47.93 47.93 0 0016-2.75A48.09 48.09 0 00464 208v-16a48 48 0 00-48-48h-40.54a2 2 0 01-1.7-3A72 72 0 00256 58.82 72 72 0 00138.24 141a2 2 0 01-1.7 3H96a48 48 0 00-48 48v16a48.09 48.09 0 0032 45.25A47.93 47.93 0 0096 256h140a4 4 0 004-4zm32-148a40 40 0 1140 40h-40zm-74.86-39.9A40 40 0 01240 104v40h-40a40 40 0 01-2.86-79.89zM276 480h92a64 64 0 0064-64V296a8 8 0 00-8-8H276a4 4 0 00-4 4v184a4 4 0 004 4z"/>',
  'heart': '<path d="M256 448a32 32 0 01-18-5.57c-78.59-53.35-112.62-89.93-131.39-112.8-40-48.75-59.15-98.8-58.61-153C48.63 114.52 98.46 64 159.08 64c44.08 0 74.61 24.83 92.39 45.51a6 6 0 009.06 0C278.31 88.81 308.84 64 352.92 64c60.62 0 110.45 50.52 111.08 112.64.54 54.21-18.63 104.26-58.61 153-18.77 22.87-52.8 59.45-131.39 112.8a32 32 0 01-18 5.56z"/>',
  'infinite': '<path d="M256 256s-48-96-126-96c-54.12 0-98 43-98 96s43.88 96 98 96c30 0 56.45-13.18 78-32M256 256s48 96 126 96c54.12 0 98-43 98-96s-43.88-96-98-96c-29.37 0-56.66 13.75-78 32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="48"/>',
  'location': '<circle cx="256" cy="192" r="32"/><path d="M256 32c-88.22 0-160 68.65-160 153 0 40.17 18.31 93.59 54.42 158.78 29 52.34 62.55 99.67 80 123.22a31.75 31.75 0 0051.22 0c17.42-23.55 51-70.88 80-123.22C397.69 278.61 416 225.19 416 185c0-84.35-71.78-153-160-153zm0 224a64 64 0 1164-64 64.07 64.07 0 01-64 64z"/>',
  'people': '<path d="M336 256c-20.56 0-40.44-9.18-56-25.84-15.13-16.25-24.37-37.92-26-61-1.74-24.62 5.77-47.26 21.14-63.76S312 80 336 80c23.83 0 45.38 9.06 60.7 25.52 15.47 16.62 23 39.22 21.26 63.63-1.67 23.11-10.9 44.77-26 61C376.44 246.82 356.57 256 336 256zm66-88zM467.83 432H204.18a27.71 27.71 0 01-22-10.67 30.22 30.22 0 01-5.26-25.79c8.42-33.81 29.28-61.85 60.32-81.08C264.79 297.4 299.86 288 336 288c36.85 0 71 9 98.71 26.05 31.11 19.13 52 47.33 60.38 81.55a30.27 30.27 0 01-5.32 25.78A27.68 27.68 0 01467.83 432zM147 260c-35.19 0-66.13-32.72-69-72.93-1.42-20.6 5-39.65 18-53.62 12.86-13.83 31-21.45 51-21.45s38 7.66 50.93 21.57c13.1 14.08 19.5 33.09 18 53.52-2.87 40.2-33.8 72.91-68.93 72.91zM212.66 291.45c-17.59-8.6-40.42-12.9-65.65-12.9-29.46 0-58.07 7.68-80.57 21.62-25.51 15.83-42.67 38.88-49.6 66.71a27.39 27.39 0 004.79 23.36A25.32 25.32 0 0041.72 400h111a8 8 0 007.87-6.57c.11-.63.25-1.26.41-1.88 8.48-34.06 28.35-62.84 57.71-83.82a8 8 0 00-.63-13.39c-1.57-.92-3.37-1.89-5.42-2.89z"/>',
  'sparkles': '<path d="M208 512a24.84 24.84 0 01-23.34-16l-39.84-103.6a16.06 16.06 0 00-9.19-9.19L32 343.34a25 25 0 010-46.68l103.6-39.84a16.06 16.06 0 009.19-9.19L184.66 144a25 25 0 0146.68 0l39.84 103.6a16.06 16.06 0 009.19 9.19l103 39.63a25.49 25.49 0 0116.63 24.1 24.82 24.82 0 01-16 22.82l-103.6 39.84a16.06 16.06 0 00-9.19 9.19L231.34 496A24.84 24.84 0 01208 512zm66.85-254.84zM88 176a14.67 14.67 0 01-13.69-9.4l-16.86-43.84a7.28 7.28 0 00-4.21-4.21L9.4 101.69a14.67 14.67 0 010-27.38l43.84-16.86a7.31 7.31 0 004.21-4.21L74.16 9.79A15 15 0 0186.23.11a14.67 14.67 0 0115.46 9.29l16.86 43.84a7.31 7.31 0 004.21 4.21l43.84 16.86a14.67 14.67 0 010 27.38l-43.84 16.86a7.28 7.28 0 00-4.21 4.21l-16.86 43.84A14.67 14.67 0 0188 176zM400 256a16 16 0 01-14.93-10.26l-22.84-59.37a8 8 0 00-4.6-4.6l-59.37-22.84a16 16 0 010-29.86l59.37-22.84a8 8 0 004.6-4.6l22.67-58.95a16.45 16.45 0 0113.17-10.57 16 16 0 0116.86 10.15l22.84 59.37a8 8 0 004.6 4.6l59.37 22.84a16 16 0 010 29.86l-59.37 22.84a8 8 0 00-4.6 4.6l-22.84 59.37A16 16 0 01400 256z"/>',
};
window.ion = (name, size, color) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 512 512" fill="currentColor" style="color:${color}" aria-hidden="true">${ION[name]}</svg>`;

// ---- the printed book, opening (← src/components/BookOpening.tsx) ----

const BW = 136; // one page
const BH = 176;
const GOLD = '#E8C872';
const BOOK_INK = '#5B4636';

/** Ahnentafel layout (slot 1 = you) for `gens` generations across `width`. */
function pedigree(width, height, gens, margin, top = 0) {
  const gen = (s) => Math.floor(Math.log2(s));
  const pos = (s) => {
    const g = gen(s);
    const i = s - 2 ** g;
    const span = 2 ** (gens - 1 - g);
    return { x: margin + g * ((width - margin * 2) / (gens - 1)), y: top + ((i * span + span / 2) * (height - top)) / 2 ** (gens - 1) };
  };
  const slots = Array.from({ length: 2 ** gens - 1 }, (_, i) => i + 1);
  const lines = slots
    .filter((s) => gen(s) < gens - 1)
    .map((s) => {
      const a = pos(s);
      const f = pos(s * 2);
      const m = pos(s * 2 + 1);
      const xm = (a.x + f.x) / 2;
      return `M${a.x} ${a.y} H${xm} M${xm} ${f.y} V${m.y} M${xm} ${f.y} H${f.x} M${xm} ${m.y} H${m.x}`;
    })
    .join(' ');
  return { slots, pos, lines, gen };
}

function bookCover() {
  const t = pedigree(84, 54, 4, 4);
  const dots = t.slots.map((s) => { const p = t.pos(s); return `<circle cx="${p.x}" cy="${p.y}" r="${s === 1 ? 3.4 : 2.4}" fill="${GOLD}"/>`; }).join('');
  return `<div class="bk-cover"><div class="bk-spine"></div><div class="bk-frame">
    <div class="bk-title">わが家</div><div class="bk-sub">家 系 図</div>
    <svg width="84" height="54" aria-hidden="true"><path d="${t.lines}" stroke="${GOLD}" stroke-opacity=".5" stroke-width="1" fill="none"/>${dots}</svg>
  </div></div>`;
}

function bookPaper(side, inner) {
  return `<div class="bk-paper ${side}">${inner}<span class="bk-gutter"></span></div>`;
}

function treeHalf(side) {
  const t = pedigree(BW * 2, BH - 12, 4, 22, 22);
  const boxes = t.slots
    .map((s) => {
      const p = t.pos(s);
      const w = t.gen(s) === 0 ? 30 : 26;
      const fill = s === 1 ? C.greenLight : s % 2 === 0 ? C.blueLight : '#FFE3F3';
      return `<rect x="${p.x - w / 2}" y="${p.y - 5.5}" width="${w}" height="11" rx="2.5" fill="${fill}" stroke="${BOOK_INK}" stroke-opacity=".35" stroke-width=".6"/>`;
    })
    .join('');
  return bookPaper(
    side ? 'right' : 'left',
    `${side ? '' : '<div class="bk-head">わが家の家系図</div>'}
     <svg class="bk-tree" width="${BW * 2}" height="${BH}" style="left:${-side * BW}px" aria-hidden="true">
       <path d="${t.lines}" stroke="${BOOK_INK}" stroke-opacity=".45" stroke-width=".8" fill="none"/>${boxes}
     </svg>`,
  );
}

function personPage() {
  const rows = [['生まれ', '明治12年'], ['出生地', '〇〇県〇〇村'], ['本籍', '〇〇県〇〇郡']]
    .map(([k, v]) => `<div class="bk-kv"><span>${k}</span><b>${v}</b></div>`)
    .join('');
  return bookPaper(
    'left',
    `<div class="bk-head">曾祖父</div><div class="bk-body">
      <span class="bk-avatar"><svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4.5" fill="#D9CDB8"/><path d="M3.5 22a8.5 7.5 0 0 1 17 0z" fill="#D9CDB8"/></svg></span>
      <div class="bk-kana">やまだ せいきち</div><div class="bk-name">山田 清吉</div>${rows}
      <i class="bk-line" style="width:90%;margin-top:6px"></i><i class="bk-line" style="width:70%"></i>
    </div>`,
  );
}

function timelinePage() {
  const rows = [
    ['明治', '清吉 生まれ', C.orange],
    ['大正', '祖父 生まれ', C.purple],
    ['昭和', '父 生まれ', C.blue],
    ['平成', 'あなた 生まれ', C.green],
    ['令和', '家系図 完成', C.greenDark],
  ]
    .map(([era, what, color]) => `<div class="bk-era"><span style="background:${color}">${era}</span><b>${what}</b></div>`)
    .join('');
  return bookPaper('right', `<div class="bk-head">年表</div><div class="bk-body"><div class="bk-eras">${rows}</div></div>`);
}

/**
 * The family-tree book. Layers on the right half, bottom to top: the timeline page, a leaf
 * (front: tree right half / back: person page) and the cover (front: cover / back: tree left half).
 * `.open` swings the cover over to the left; `.turned` turns the leaf (funnel.js runBook drives both).
 */
window.bookOpening = () => `
  <div class="ob-book-wrap"><div class="ob-book" style="--bw:${BW}px;--bh:${BH}px">
    <span class="bk-edge"></span>
    <div class="bk-half">${timelinePage()}</div>
    <div class="bk-leaf bk-page"><div class="bk-face">${treeHalf(1)}</div><div class="bk-face bk-back">${personPage()}</div></div>
    <div class="bk-leaf bk-front"><div class="bk-face">${bookCover()}</div><div class="bk-face bk-back">${treeHalf(0)}</div></div>
  </div></div>`;
