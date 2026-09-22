/**
 * Builds girasol/tulip-model.js from girasol/models/tulip_flower.glb.
 *
 * The source is a photoreal Sketchfab tulip (Z-up, 2.46 MB, two coincident
 * copies, three 1024px maps) which clashes with the meadow's voxel look.
 * This script restyles it to match the grass/sunflower blocks:
 *   - keeps a single copy and drops the unreferenced normal map
 *   - rotates Z-up -> Y-up and normalises the height to a meadow-sized block
 *   - recolours the violet petals to golden yellow, leaving foliage green
 *   - merges the opaque stem and alpha petal materials into one atlas so the
 *     block works with the meadow's single alphaTest material
 *
 * Usage: node scripts/build-tulip-model.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GLB = join(root, 'girasol/models/tulip_flower.glb');
const OUT = join(root, 'girasol/tulip-model.js');

const TARGET_HEIGHT = 1.5;   // matches the sunflower block, so the same scale range works
const TILE = 128;            // per-material tile inside the atlas
const YELLOW_HUE = 0.142;    // ~51deg golden yellow
const GREEN_MIN = 0.16;      // hue band that must stay green (foliage)
const GREEN_MAX = 0.55;

// ---------------------------------------------------------------- glTF parsing
const buf = readFileSync(GLB);
let offset = 12;
let gltf = null;
let bin = null;
while (offset < buf.length) {
  const len = buf.readUInt32LE(offset);
  const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
  if (type.startsWith('JSON')) gltf = JSON.parse(buf.subarray(offset + 8, offset + 8 + len).toString('utf8'));
  if (type.startsWith('BIN')) bin = buf.subarray(offset + 8, offset + 8 + len);
  offset += 8 + len;
}

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const TYPED = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };

function readAccessor(index) {
  const acc = gltf.accessors[index];
  const view = gltf.bufferViews[acc.bufferView];
  const n = COMPONENTS[acc.type];
  const start = (view.byteOffset || 0) + (acc.byteOffset || 0);
  const ArrayType = TYPED[acc.componentType];
  const out = [];
  for (let i = 0; i < acc.count; i++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      const at = start + (i * n + c) * ArrayType.BYTES_PER_ELEMENT;
      row.push(ArrayType === Float32Array ? bin.readFloatLE(at) : ArrayType === Uint16Array ? bin.readUInt16LE(at) : ArrayType === Uint32Array ? bin.readUInt32LE(at) : bin.readUInt8(at));
    }
    out.push(row);
  }
  return out;
}

function imageBuffer(imageIndex) {
  const view = gltf.bufferViews[gltf.images[imageIndex].bufferView];
  return bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
}

// --------------------------------------------------------------- colour maths
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hsl2rgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

/** Turns violet petals golden while leaving green foliage untouched. */
function recolourPetals(data) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 16) continue;
    const [h, s, l] = rgb2hsl(data[i], data[i + 1], data[i + 2]);
    if (l < 0.05 || s < 0.1) continue;
    if (h >= GREEN_MIN && h <= GREEN_MAX) continue;
    const [r, g, b] = hsl2rgb(YELLOW_HUE, Math.min(1, s * 1.05), l);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

// ------------------------------------------------------------- build the atlas
const stemTex = await sharp(imageBuffer(0)).ensureAlpha().resize(TILE, TILE, { fit: 'fill' }).raw().toBuffer();
recolourPetals(stemTex);
// The opaque material paints its background solid black; make that transparent
// so the meadow's alphaTest material cuts it out instead of drawing black quads.
for (let i = 0; i < stemTex.length; i += 4) {
  const lum = 0.299 * stemTex[i] + 0.587 * stemTex[i + 1] + 0.114 * stemTex[i + 2];
  stemTex[i + 3] = lum < 22 ? 0 : 255;
}

const petalTex = await sharp(imageBuffer(2)).ensureAlpha().resize(TILE, TILE, { fit: 'fill' }).raw().toBuffer();
recolourPetals(petalTex);

const atlasW = TILE * 2;
const atlas = Buffer.alloc(atlasW * TILE * 4);
for (let y = 0; y < TILE; y++) {
  stemTex.copy(atlas, (y * atlasW) * 4, y * TILE * 4, (y + 1) * TILE * 4);
  petalTex.copy(atlas, (y * atlasW + TILE) * 4, y * TILE * 4, (y + 1) * TILE * 4);
}
const atlasPng = await sharp(atlas, { raw: { width: atlasW, height: TILE, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();

// ------------------------------------------------------- merge the two meshes
const positions = [];
const normals = [];
const uvs = [];
const indices = [];
let vertexBase = 0;

// mesh 0 = opaque stem/leaf (atlas left), mesh 1 = alpha petals (atlas right)
for (const [meshIndex, uOffset, uvScale] of [[0, 0, 0.5], [1, 0.5, 0.5]]) {
  const prim = gltf.meshes[meshIndex].primitives[0];
  const pos = readAccessor(prim.attributes.POSITION);
  const nor = readAccessor(prim.attributes.NORMAL);
  const tex = readAccessor(prim.attributes.TEXCOORD_0);
  const idx = readAccessor(prim.indices).map((v) => v[0]);

  for (let i = 0; i < pos.length; i++) {
    // glTF here is Z-up: rotate -90deg about X so the stem grows along +Y
    const [x, y, z] = pos[i];
    positions.push(x, z, -y);
    const [nx, ny, nz] = nor[i];
    normals.push(nx, nz, -ny);
    uvs.push(tex[i][0] * uvScale + uOffset, tex[i][1]);
  }
  for (const v of idx) indices.push(v + vertexBase);
  vertexBase += pos.length;
}

// Centre on the origin and scale to the block height
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (let i = 0; i < positions.length; i += 3) {
  minX = Math.min(minX, positions[i]); maxX = Math.max(maxX, positions[i]);
  minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
  minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
}
const scale = TARGET_HEIGHT / (maxY - minY);
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;
for (let i = 0; i < positions.length; i += 3) {
  positions[i] = (positions[i] - cx) * scale;
  positions[i + 1] = (positions[i + 1] - minY) * scale;
  positions[i + 2] = (positions[i + 2] - cz) * scale;
}

const round = (v) => Math.round(v * 10000) / 10000;
const payload = {
  positions: positions.map(round),
  normals: normals.map(round),
  uvs: uvs.map(round),
  indices,
  textureDataUrl: `data:image/png;base64,${atlasPng.toString('base64')}`,
};

writeFileSync(OUT, `// Auto-generated by scripts/build-tulip-model.mjs — do not edit by hand\nexport const TULIP_BLOCK_DATA = ${JSON.stringify(payload)};\n`);

const size = { x: +(maxX - minX).toFixed(3), y: +(maxY - minY).toFixed(3), z: +(maxZ - minZ).toFixed(3) };
console.log(`wrote ${OUT}`);
console.log(`  vertices: ${positions.length / 3}  triangles: ${indices.length / 3}`);
console.log(`  source bbox (pre-scale): ${JSON.stringify(size)} -> normalised height ${TARGET_HEIGHT}, footprint ${(size.x * scale).toFixed(3)} x ${(size.z * scale).toFixed(3)}`);
console.log(`  atlas: ${atlasW}x${TILE} (${(atlasPng.length / 1024).toFixed(1)} KB png)`);
