// Procedural soap-bar assets, generated entirely in code (no model/image files).
//
// `makeSoapGeometry` builds a superellipsoid — a rounded "pillow" — the classic
// bar-of-soap silhouette (a chunky horizontal bar). `makeSoapTextures` paints
// "HOLD ME" along the long side into BOTH a colour map (recess tinted darker, so
// the engraving always reads) and a tangent-space normal map (the bevel), plus
// faint grain.

import {
  BufferGeometry,
  BufferAttribute,
  CanvasTexture,
  SRGBColorSpace,
} from 'three';

/** Signed power: keeps the sign while raising |v| to an exponent. */
function spow(v: number, p: number): number {
  return Math.sign(v) * Math.abs(v) ** p;
}

/**
 * A superellipsoid surface sampled into a BufferGeometry. The default extents
 * make a chunky horizontal bar (X is the long axis). `half*` are the
 * half-extents (length X, thickness Y, depth Z).
 */
export function makeSoapGeometry(
  halfX = 1.0,
  halfY = 0.36,
  halfZ = 0.78,
  roundness = 0.35,
  segU = 160,
  segV = 96,
): BufferGeometry {
  const cols = segU + 1;
  const rows = segV + 1;
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);

  let p = 0;
  let t = 0;
  for (let iv = 0; iv < rows; iv++) {
    // v: latitude from -PI/2 (bottom) to +PI/2 (top)
    const v = -Math.PI / 2 + (iv / segV) * Math.PI;
    const cv = Math.cos(v);
    const sv = Math.sin(v);
    for (let iu = 0; iu < cols; iu++) {
      // u: longitude from -PI to +PI
      const u = -Math.PI + (iu / segU) * Math.PI * 2;
      const cu = Math.cos(u);
      const su = Math.sin(u);

      const nx = spow(cv, roundness) * spow(cu, roundness);
      const ny = spow(sv, roundness);
      const nz = spow(cv, roundness) * spow(su, roundness);

      positions[p++] = halfX * nx;
      positions[p++] = halfY * ny;
      positions[p++] = halfZ * nz;
      // Planar top-down (XZ) projection, so the stamp lies flat and readable on
      // the broad top face; the thin side walls just get vertical streaks. U is
      // negated so the brand reads the right way round on the camera-facing face.
      uvs[t++] = -nx * 0.5 + 0.5;
      uvs[t++] = nz * 0.5 + 0.5;
    }
  }

  const indices: number[] = [];
  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * cols + iu;
      const b = a + cols;
      indices.push(a, b, a + 1);
      indices.push(a + 1, b, b + 1);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('uv', new BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Cheap value-noise speckle drawn straight onto the 2D context. */
function paintGrain(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const dots = Math.floor((w * h) / 90);
  for (let i = 0; i < dots; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.6 + 0.2;
    const shade = 110 + Math.random() * 60; // around mid grey
    ctx.fillStyle = `rgba(${shade},${shade},${shade},0.25)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draws "HOLD ME" centred and horizontal, blurred for a soft bevel ramp. */
function drawBrand(ctx: CanvasRenderingContext2D, w: number, h: number, fill: string): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 220px "Fredoka", ui-rounded, system-ui, sans-serif';
  ctx.filter = 'blur(3px)';
  ctx.fillStyle = fill;
  ctx.fillText('HOLD ME', w / 2, h / 2);
  ctx.restore();
  ctx.filter = 'none';
}

/**
 * The soap's surface textures, both laid out identically so they line up:
 *  - `colorMap`: white base with the recessed text tinted darker grey. Because
 *    it multiplies the material's pink, the engraving always reads as a darker
 *    recess regardless of lighting.
 *  - `normalMap`: a tangent-space normal map from a "HOLD ME" height field (+
 *    grain) for the bevel, so the recess also catches light.
 * The canvas is landscape (long U × short V) to match the horizontal bar.
 */
export function makeSoapTextures(): {
  colorMap: CanvasTexture;
  normalMap: CanvasTexture;
} {
  const w = 1024;
  const h = 768;

  // --- Colour map: white base, darker-grey recessed text. ---
  const color = document.createElement('canvas');
  color.width = w;
  color.height = h;
  const cctx = color.getContext('2d')!;
  cctx.fillStyle = '#ffffff';
  cctx.fillRect(0, 0, w, h);
  drawBrand(cctx, w, h, '#9f8e97'); // multiplies pink → clearly darker recess
  const colorMap = new CanvasTexture(color);
  colorMap.colorSpace = SRGBColorSpace;
  colorMap.anisotropy = 4;

  // --- Height field → normal map (bevel). ---
  const height = document.createElement('canvas');
  height.width = w;
  height.height = h;
  const hctx = height.getContext('2d')!;
  hctx.fillStyle = '#808080';
  hctx.fillRect(0, 0, w, h);
  paintGrain(hctx, w, h);
  drawBrand(hctx, w, h, '#0c0c0c'); // dark = deep recess

  const src = hctx.getImageData(0, 0, w, h).data;
  const out = new ImageData(w, h);
  const strength = 4;
  const at = (x: number, y: number) => {
    const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
    const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
    return src[(cy * w + cx) * 4] / 255; // red channel as height
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (at(x - 1, y) - at(x + 1, y)) * strength;
      const ny = (at(x, y - 1) - at(x, y + 1)) * strength;
      const inv = 1 / Math.hypot(nx, ny, 1);
      const i = (y * w + x) * 4;
      out.data[i] = (nx * inv * 0.5 + 0.5) * 255;
      out.data[i + 1] = (ny * inv * 0.5 + 0.5) * 255;
      out.data[i + 2] = (inv * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  const normal = document.createElement('canvas');
  normal.width = w;
  normal.height = h;
  normal.getContext('2d')!.putImageData(out, 0, 0);
  const normalMap = new CanvasTexture(normal);
  normalMap.anisotropy = 4; // linear data — must NOT be tagged sRGB

  return { colorMap, normalMap };
}
