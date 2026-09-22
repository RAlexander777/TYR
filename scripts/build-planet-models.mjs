/**
 * Builds src/golden-planet-model.js and src/purple-planet-model.js from the two
 * Sketchfab planet downloads, so the hub can render those bodies from the real
 * assets instead of its procedural icosahedra.
 *
 * Only the body is taken: little_purple_planet also ships a flat green ring
 * ("ringen"), which is dropped because the hub grows its own rings and satellites
 * and the purple world is themed as ringless.
 *
 * Both bodies are recentred and scaled so their furthest vertex sits at 1, matching
 * the convention of THREE.IcosahedronGeometry(radius) the other planets use. That is
 * what keeps the hit spheres, the framing maths and the ship's landing radius valid.
 *
 * Usage: node scripts/build-planet-models.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TEXTURE_SIZE = 1024;

const MODELS = [
  {
    glb: join(root, 'models/golden_planet.glb'),
    out: join(root, 'src/golden-planet-model.js'),
    exported: 'GOLDEN_PLANET_DATA',
    // Two coincident icospheres sharing one material; the inner one is enclosed.
    keep: [[0, 0], [1, 0]],
    attribution: 'lowpoly planet by wjs991 (CC-BY-4.0) - https://sketchfab.com/3d-models/lowpoly-planet-9644beab61d544de8fb93fe8faeb99be',
  },
  {
    glb: join(root, 'models/little_purple_planet.glb'),
    out: join(root, 'src/purple-planet-model.js'),
    exported: 'PURPLE_PLANET_DATA',
    // [0,0] is "ringen"; only the body is kept.
    keep: [[1, 0]],
    attribution: 'Little Purple Planet by Michinata (CC-BY-4.0) - https://sketchfab.com/3d-models/little-purple-planet-a4d1c83e660944049a7b7a6b833191db',
  },
];

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const BYTES = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

function parseGlb(path) {
  const buf = readFileSync(path);
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
  return { json, bin };
}

function makeReader(json, bin) {
  return (index) => {
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
          : bin.readUInt8(at));
      }
      out.push(row);
    }
    return out;
  };
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

for (const model of MODELS) {
  const { json, bin } = parseGlb(model.glb);
  const read = makeReader(json, bin);

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const textureSources = new Set();

  for (const [meshIndex, primIndex] of model.keep) {
    const prim = json.meshes[meshIndex].primitives[primIndex];
    const pos = read(prim.attributes.POSITION);
    const nor = read(prim.attributes.NORMAL);
    const uv = read(prim.attributes.TEXCOORD_0);
    const idx = read(prim.indices).map((v) => v[0]);
    const base = positions.length;

    for (const v of pos) positions.push(v[0], v[1], v[2]);
    for (const v of nor) normals.push(v[0], v[1], v[2]);
    for (const v of uv) uvs.push(v[0], v[1]);
    for (const v of idx) indices.push(v + base);

    const material = json.materials[prim.material];
    const colorTexture = material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture;
    if (!colorTexture) throw new Error(`${model.glb}: kept primitive has no base colour texture`);
    textureSources.add(json.textures[colorTexture.index].source);
  }

  if (textureSources.size !== 1) {
    throw new Error(`${model.glb}: expected exactly one base colour texture, got ${textureSources.size}`);
  }

  // Recentre on the body and normalise the furthest vertex to 1.
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < positions.length; i += 3) {
    cx += positions[i]; cy += positions[i + 1]; cz += positions[i + 2];
  }
  const count = positions.length / 3;
  cx /= count; cy /= count; cz /= count;

  let maxDistance = 0;
  for (let i = 0; i < positions.length; i += 3) {
    maxDistance = Math.max(maxDistance, Math.hypot(positions[i] - cx, positions[i + 1] - cy, positions[i + 2] - cz));
  }

  const round = (v) => Math.round(v * 10000) / 10000;
  const outPositions = [];
  for (let i = 0; i < positions.length; i += 3) {
    outPositions.push(
      round((positions[i] - cx) / maxDistance),
      round((positions[i + 1] - cy) / maxDistance),
      round((positions[i + 2] - cz) / maxDistance),
    );
  }

  // Uniform scale keeps the authored normals valid.
  const sourceImage = json.images[[...textureSources][0]];
  const sourceView = json.bufferViews[sourceImage.bufferView];
  const sourceBuffer = bin.subarray(sourceView.byteOffset || 0, (sourceView.byteOffset || 0) + sourceView.byteLength);

  const asBuffer = async (format) => {
    const pipeline = sharp(sourceBuffer).resize(TEXTURE_SIZE, TEXTURE_SIZE, { fit: 'fill' }).removeAlpha();
    return format === 'jpeg'
      ? pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
      : pipeline.png({ compressionLevel: 9 }).toBuffer();
  };

  // Re-encoding can cost more than it saves (the golden source is already an efficient
  // flat-colour png), so the untouched bytes stay in the running when the size matches.
  const sourceMeta = await sharp(sourceBuffer).metadata();
  const candidates = [];
  if (sourceMeta.width === TEXTURE_SIZE && sourceMeta.height === TEXTURE_SIZE && sourceMeta.channels <= 3) {
    candidates.push({ buffer: Buffer.from(sourceBuffer), mime: sourceImage.mimeType || 'image/png' });
  }
  candidates.push({ buffer: await asBuffer('png'), mime: 'image/png' });
  candidates.push({ buffer: await asBuffer('jpeg'), mime: 'image/jpeg' });
  const encoded = candidates.reduce((best, c) => (c.buffer.length < best.buffer.length ? c : best));

  const material = json.materials[json.meshes[model.keep[0][0]].primitives[model.keep[0][1]].material];

  const payload = {
    positions: outPositions,
    normals: normals.map(round),
    uvs: uvs.map(round),
    indices,
    textureDataUrl: `data:${encoded.mime};base64,${encoded.buffer.toString('base64')}`,
    roughness: material.pbrMetallicRoughness.roughnessFactor !== undefined
      ? +material.pbrMetallicRoughness.roughnessFactor.toFixed(3)
      : 1,
    attribution: model.attribution,
  };

  writeFileSync(model.out, `// Auto-generated by scripts/build-planet-models.mjs - do not edit by hand\nexport const ${model.exported} = ${JSON.stringify(payload)};\n`);

  console.log(`wrote ${model.out}`);
  console.log(`  kept ${model.keep.length} primitive(s): ${indices.length / 3} triangles, ${count} vertices`);
  console.log(`  recentred on (${cx.toFixed(2)}, ${cy.toFixed(2)}, ${cz.toFixed(2)}), furthest vertex ${maxDistance.toFixed(3)} -> 1`);
  console.log(`  picked ${encoded.mime} ${kb(encoded.buffer.length)} from ${candidates.map((c) => `${c.mime} ${kb(c.buffer.length)}`).join(' | ')}`);
  console.log(`  module ${kb(Buffer.byteLength(readFileSync(model.out)))} on disk\n`);
}
