// Procedural soap-bar assets, generated entirely in code (no model/image files).
//
// `makeSoapGeometry` builds a superellipsoid — a rounded "pillow" — which is the
// classic bar-of-soap silhouette. `makeStampTexture` paints a canvas with a
// debossed "HOLD THE SOAP" brand plus fine grain, used as a bump map so the
// surface reads as real stamped soap.

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
 * A superellipsoid surface sampled into a BufferGeometry. With a roundness
 * exponent near ~0.35 and a flat-ish Y radius it looks like a pillowy bar of
 * soap. `half*` are the half-extents (length X, height Y, depth Z).
 */
export function makeSoapGeometry(
  halfX = 1.0,
  halfY = 0.32,
  halfZ = 0.62,
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
      // the broad top face; the thin side walls just get vertical streaks.
      uvs[t++] = nx * 0.5 + 0.5;
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

/**
 * A bump map: mid-grey base (no displacement), darker debossed brand text, and
 * faint grain. Wrapped so the brand reads on the broad faces of the bar.
 */
export function makeStampTexture(): CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Neutral mid-grey = flat surface for a bump map.
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);

  paintGrain(ctx, w, h);

  // Debossed brand: darker text = recessed. A soft light halo above sells the
  // bevel. Rounded system font to match the app's Fredoka vibe.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const font = '700 96px "Fredoka", ui-rounded, system-ui, sans-serif';

  ctx.font = font;
  // light bevel highlight, nudged up-left
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('HOLD', w / 2 - 2, h / 2 - 60 - 2);
  ctx.fillText('THE SOAP', w / 2 - 2, h / 2 + 60 - 2);
  // recessed dark body
  ctx.fillStyle = 'rgba(40,40,40,0.95)';
  ctx.fillText('HOLD', w / 2, h / 2 - 60);
  ctx.fillText('THE SOAP', w / 2, h / 2 + 60);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
