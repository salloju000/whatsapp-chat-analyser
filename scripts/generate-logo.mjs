// Generates every logo asset from one geometry definition, so the favicon,
// touch icon and in-app mark can never drift apart.
//
//   node scripts/generate-logo.mjs
//
// Writes public/logo.svg, public/logo.ico (16/32/48) and
// public/apple-touch-icon.png. Rasterizing is done here with analytic shapes
// and supersampling — no image dependencies needed.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const INK = '#0f172a';
const INK_DARK = '#e2e8f0';
const ACCENT = '#0d9488';
const ACCENT_DARK = '#2dd4bf';

// All geometry lives on a 32-unit grid centered at (16, 16).
const C = 16;
const HUB_R = 3.75;
const NODE_DIST = 11.75;

// Small sizes swap the satellite rings for solid dots and thicken strokes:
// a 1px ring with a sub-pixel hole reads as a smudge in a browser tab.
const variant = (small) => ({
  hubR: small ? 4.4 : HUB_R,
  hubStroke: small ? 3 : 2.1,
  nodeR: small ? 2.3 : 2.4,
  nodeStroke: small ? null : 1.9,
  spoke: small ? 2.6 : 2,
  diagonalSpokes: !small,
});

// Raster icons sit on tab strips of either theme and can't use a media query,
// so they get a light rounded tile to stay visible on dark.
const TILE = '#ffffff';

const nodes = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4 - Math.PI / 2;
  return { x: C + NODE_DIST * Math.cos(a), y: C + NODE_DIST * Math.sin(a), cardinal: i % 2 === 0 };
});

const round = (n) => Math.round(n * 100) / 100;

// --- SVG --------------------------------------------------------------------

const buildSvg = () => {
  const v = variant(false);
  const spokes = nodes.map((n) => {
    const ux = (n.x - C) / NODE_DIST;
    const uy = (n.y - C) / NODE_DIST;
    const from = HUB_R;
    const to = NODE_DIST - v.nodeR;
    return `<line class="${n.cardinal ? 'a' : 'i'}" x1="${round(C + ux * from)}" y1="${round(C + uy * from)}" x2="${round(C + ux * to)}" y2="${round(C + uy * to)}"/>`;
  });
  const rings = nodes.map((n) => `<circle cx="${round(n.x)}" cy="${round(n.y)}" r="${v.nodeR}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    .i{stroke:${INK}}.a{stroke:${ACCENT}}
    @media (prefers-color-scheme:dark){.i{stroke:${INK_DARK}}.a{stroke:${ACCENT_DARK}}}
  </style>
  <g fill="none" stroke-linecap="round" stroke-width="${v.spoke}">
    ${spokes.join('\n    ')}
  </g>
  <g class="i" fill="none" stroke-width="${v.nodeStroke}">
    <circle cx="${C}" cy="${C}" r="${v.hubR}" stroke-width="${v.hubStroke}"/>
    ${rings.join('\n    ')}
  </g>
</svg>
`;
};

// --- Rasterizer ---------------------------------------------------------------

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const distToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};

// Returns the color of the topmost shape covering (x, y) in grid units, or
// null.
const shapeAt = (x, y, small) => {
  const v = variant(small);
  let color = null;
  for (const n of nodes) {
    if (!n.cardinal && !v.diagonalSpokes) continue;
    if (distToSegment(x, y, C, C, n.x, n.y) <= v.spoke / 2) color = n.cardinal ? ACCENT : INK;
  }
  // Clear the spokes inside the hub and node holes so rings stay open.
  const hubD = Math.hypot(x - C, y - C);
  if (hubD < v.hubR - v.hubStroke / 2) color = null;
  if (Math.abs(hubD - v.hubR) <= v.hubStroke / 2) color = INK;
  for (const n of nodes) {
    const d = Math.hypot(x - n.x, y - n.y);
    if (v.nodeStroke === null) {
      if (d <= v.nodeR) color = INK;
    } else {
      if (d < v.nodeR - v.nodeStroke / 2) color = null;
      if (Math.abs(d - v.nodeR) <= v.nodeStroke / 2) color = INK;
    }
  }
  return color;
};

const inRoundedSquare = (px, py, size, radius) => {
  const dx = Math.max(radius - px, px - (size - radius), 0);
  const dy = Math.max(radius - py, py - (size - radius), 0);
  return dx * dx + dy * dy <= radius * radius;
};

const render = (size, { background = null, padding = 0, tileRadius = 0 } = {}) => {
  const SS = 8;
  const small = size < 24;
  const inner = size - padding * 2;
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const gx = ((px - padding + (sx + 0.5) / SS) / inner) * 32;
          const gy = ((py - padding + (sy + 0.5) / SS) / inner) * 32;
          const ox = px + (sx + 0.5) / SS;
          const oy = py + (sy + 0.5) / SS;
          const bg = background && (!tileRadius || inRoundedSquare(ox, oy, size, tileRadius)) ? background : null;
          const hex = shapeAt(gx, gy, small) ?? bg;
          if (!hex) continue;
          const [cr, cg, cb] = hexToRgb(hex);
          r += cr; g += cg; b += cb; a += 1;
        }
      }
      const o = (py * size + px) * 4;
      if (a) {
        rgba[o] = Math.round(r / a);
        rgba[o + 1] = Math.round(g / a);
        rgba[o + 2] = Math.round(b / a);
        rgba[o + 3] = Math.round((a / (SS * SS)) * 255);
      }
    }
  }
  return rgba;
};

// --- Encoders -------------------------------------------------------------------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const encodePng = (rgba, size) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

// PNG-compressed ICO entries are supported by every browser that runs this app.
const encodeIco = (images) => {
  const dir = Buffer.alloc(6 + images.length * 16);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(images.length, 4);
  let offset = dir.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + i * 16;
    dir[e] = size;
    dir[e + 1] = size;
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(png.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([dir, ...images.map((img) => img.png)]);
};

// --- Output ---------------------------------------------------------------------

const out = new URL('../public/', import.meta.url);

writeFileSync(new URL('logo.svg', out), buildSvg());

const icoImages = [16, 32, 48].map((size) => ({
  size,
  png: encodePng(render(size, { background: TILE, padding: Math.max(1, Math.round(size / 14)), tileRadius: size * 0.22 }), size),
}));
writeFileSync(new URL('logo.ico', out), encodeIco(icoImages));

// iOS ignores transparency, so the touch icon gets an explicit light tile.
writeFileSync(new URL('apple-touch-icon.png', out), encodePng(render(180, { background: '#ffffff', padding: 26 }), 180));

console.log('Wrote logo.svg, logo.ico (16/32/48) and apple-touch-icon.png to public/');
