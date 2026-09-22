/**
 * Builds src/spaceship-model.js from strawberry_milk_spaceship.glb.
 *
 * Source: "Strawberry Milk Delivery Spaceship" by Eleanore Falck (CC-BY-4.0).
 * A single 7.5k-triangle mesh exported from Sketchfab in working units of
 * 448 x 257 x 315, Y-up, base resting just under y = 0.
 *
 * The project ships no GLTFLoader, so - like the tulip and the meadow blocks -
 * the hull is baked into a module the runtime rebuilds with
 * buildGeometryFromData(). Two things make that worth doing carefully here:
 *
 *   - the source carries 1.9 MB of 1024px PBR maps, far too much to inline as
 *     data URLs on a phone over LAN, so the maps are re-encoded at the sizes
 *     configured below and the ones that do not earn their bytes are dropped
 *   - the ship lands on a planet, so the pivot is re-based onto the hull's
 *     underside instead of the bounding-box centre
 *
 * Usage: node scripts/build-spaceship-model.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GLB = join(root, 'models/strawberry_milk_spaceship.glb');
const OUT = join(root, 'src/spaceship-model.js');

const LONGEST_AXIS = 1;      // hull length after normalisation; the caller scales from this
const PRECISION = 3;         // decimals kept on every vertex attribute
const BASE_COLOR_SIZE = 512;
const EMISSIVE_SIZE = 256;
const NORMAL_SIZE = 512;
// As PNG these two cost 163 KB and 470 KB; they are pure high-frequency noise, so
// jpeg holds up fine and brings the pair down to about 25 KB. The normal map is the
// one texture the runtime must load with a linear colour space.
const DATA_MAP_FORMAT = 'jpeg';
const KEEP_NORMAL = true;    // costs the tangent array; the panel and rivet detail lives here
const KEEP_METAL_ROUGH = true;
const METALNESS = 1;         // factors multiplied into the ORM map, i.e. use it as authored
const ROUGHNESS = 1;

// ---------------------------------------------------------------- glTF parsing
const buf = readFileSync(GLB);
let offset = 12;
let json = null;
let bin = null;
while (offset < buf.length) {
  const len = buf.readUInt32LE(offset);
  const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
  if (type.startsWith('JSON')) json = JSON.parse(buf.subarray(offset + 8, offset + 8 + len).toString('utf8'));
  if (type.startsWith('BIN')) bin = buf.subarray(offset + 8, offset + 8 + len);
  offset += 8 + len;
}

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const BYTES = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

function readAccessor(index) {
  const acc = json.accessors[index];
  const view = json.bufferViews[acc.bufferView];
  const n = COMPONENTS[acc.type];
  const bpc = BYTES[acc.componentType];
  const stride = view.byteStride || n * bpc;
  const start = (view.byteOffset || 0) + (acc.byteOffset || 0);
  const out = [];
  for (let i = 0; i < acc.count; i++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      const at = start + i * stride + c * bpc;
      row.push(acc.componentType === 5126 ? bin.readFloatLE(at)
        : acc.componentType === 5125 ? bin.readUInt32LE(at)
        : acc.componentType === 5123 ? bin.readUInt16LE(at)
        : acc.componentType === 5121 ? bin.readUInt8(at)
        : bin.readInt16LE(at));
    }
    out.push(row);
  }
  return out;
}

function imageBuffer(index) {
  const view = json.bufferViews[json.images[index].bufferView];
  return bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
}

// ------------------------------------------------------------------- geometry
const prim = json.meshes[0].primitives[0];
const positions = readAccessor(prim.attributes.POSITION);
const normals = readAccessor(prim.attributes.NORMAL);
const uvs = readAccessor(prim.attributes.TEXCOORD_0);
const tangents = prim.attributes.TANGENT !== undefined ? readAccessor(prim.attributes.TANGENT) : null;
const indices = readAccessor(prim.indices).map((v) => v[0]);

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, y, z] of positions) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const sourceSize = [maxX - minX, maxY - minY, maxZ - minZ];
const scale = LONGEST_AXIS / Math.max(...sourceSize);
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;

// Uniform scale keeps normals and tangents valid; only the pivot moves.
const outPositions = [];
for (const [x, y, z] of positions) {
  outPositions.push((x - cx) * scale, (y - minY) * scale, (z - cz) * scale);
}
const round = (v) => {
  const factor = 10 ** PRECISION;
  return Math.round(v * factor) / factor;
};

// ------------------------------------------------------------------- textures
const toDataUrl = (buffer, mime) => `data:${mime};base64,${buffer.toString('base64')}`;

async function encode(index, size, format) {
  const pipeline = sharp(imageBuffer(index)).resize(size, size, { fit: 'fill' }).removeAlpha();
  const buffer = format === 'jpeg'
    ? await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    : await pipeline.png({ compressionLevel: 9 }).toBuffer();
  return { buffer, mime: format === 'jpeg' ? 'image/jpeg' : 'image/png' };
}

const orm = await sharp(imageBuffer(1)).stats();
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const asDataUrl = (n) => `${(n * 4 / 3 / 1024).toFixed(1)} KB inlined`;

console.log('source maps:');
json.images.forEach((img, i) => {
  const view = json.bufferViews[img.bufferView];
  console.log(`  image[${i}] ${img.mimeType} ${kb(view.byteLength)}`);
});
console.log(`  ORM means - occlusion(R)=${orm.channels[0].mean.toFixed(0)} roughness(G)=${orm.channels[1].mean.toFixed(0)} metalness(B)=${orm.channels[2].mean.toFixed(0)}`);

const baseColor = await encode(0, BASE_COLOR_SIZE, 'jpeg');
const emissive = await encode(2, EMISSIVE_SIZE, 'jpeg');
const normal = await encode(3, NORMAL_SIZE, DATA_MAP_FORMAT);
const metalRough = await encode(1, NORMAL_SIZE, DATA_MAP_FORMAT);

console.log('\nre-encoded (sizes are the base64 payload the module carries):');
console.log(`  base colour ${BASE_COLOR_SIZE}px jpeg ${kb(baseColor.buffer.length)} (${asDataUrl(baseColor.buffer.length)})`);
console.log(`  emissive    ${EMISSIVE_SIZE}px jpeg ${kb(emissive.buffer.length)} (${asDataUrl(emissive.buffer.length)})`);
console.log(`  normal      ${NORMAL_SIZE}px ${DATA_MAP_FORMAT} ${kb(normal.buffer.length)} (${asDataUrl(normal.buffer.length)})`);
console.log(`  metal/rough ${NORMAL_SIZE}px ${DATA_MAP_FORMAT} ${kb(metalRough.buffer.length)} (${asDataUrl(metalRough.buffer.length)})`);

// --------------------------------------------------------------- emit module
const extent = [sourceSize[0] * scale, sourceSize[1] * scale, sourceSize[2] * scale];
const attribution = 'Strawberry Milk Delivery Spaceship by Eleanore Falck (CC-BY-4.0) - https://sketchfab.com/3d-models/strawberry-milk-delivery-spaceship-9214b0d216314da5b9a6e9a4e626599a';

const payload = {
  positions: outPositions.map(round),
  normals: normals.flat().map(round),
  uvs: uvs.flat().map(round),
  indices,
  textureDataUrl: toDataUrl(baseColor.buffer, baseColor.mime),
  emissiveDataUrl: toDataUrl(emissive.buffer, emissive.mime),
  metalness: METALNESS,
  roughness: ROUGHNESS,
  size: extent.map((v) => +v.toFixed(4)),
  attribution,
};
if (KEEP_NORMAL) {
  payload.normalDataUrl = toDataUrl(normal.buffer, normal.mime);
  if (tangents) payload.tangents = tangents.flat().map(round);
}
if (KEEP_METAL_ROUGH) payload.metalRoughDataUrl = toDataUrl(metalRough.buffer, metalRough.mime);

writeFileSync(OUT, `// Auto-generated by scripts/build-spaceship-model.mjs - do not edit by hand\nexport const SPACESHIP_DATA = ${JSON.stringify(payload)};\n`);

console.log(`\nwrote ${OUT}`);
console.log(`  vertices: ${positions.length}  triangles: ${indices.length / 3}`);
console.log(`  source size ${sourceSize.map((v) => v.toFixed(1)).join(' x ')} -> normalised ${extent.map((v) => v.toFixed(3)).join(' x ')} (longest axis ${LONGEST_AXIS})`);
console.log(`  kept: base colour, emissive${KEEP_NORMAL ? ', normal + tangents' : ''}${KEEP_METAL_ROUGH ? ', metal/rough' : ''}`);
console.log(`  total module ${kb(Buffer.byteLength(readFileSync(OUT)))} on disk`);

