// Procedural soap-bar assets, generated entirely in code (no model/image files).
//
// `makeSoapGeometry` builds a superellipsoid — a rounded "pillow" — which is the
// classic bar-of-soap silhouette. The default proportions make a longer bar
// meant to stand vertically. `makeStampNormalMap` paints a height field
// ("Hold Me" running along the long side + fine grain) and converts it to a
// tangent-space normal map, so the engraving reads even through a glossy clearcoat.

import { BufferGeometry, BufferAttribute, CanvasTexture } from 'three';

/** Signed power: keeps the sign while raising |v| to an exponent. */
function spow(v: number, p: number): number {
  return Math.sign(v) * Math.abs(v) ** p;
}

/**
 * A superellipsoid surface sampled into a BufferGeometry. The default extents
 * make a long, slim bar (Z is the long axis) that stands vertically on screen.
 * `half*` are the half-extents (width X, thickness Y, length Z).
 */
export function makeSoapGeometry(
  halfX = 0.6,
  halfY = 0.34,
  halfZ = 1.4,
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
 * A tangent-space normal map for the soap surface: a height field with "Hold Me"
 * debossed (darker = recessed) along the long axis, plus faint grain, converted
 * to normals via finite differences. Applied as both normalMap and
 * clearcoatNormalMap so the engraving survives the glossy top coat. The canvas
 * is portrait (short U × long V) to match the bar; the word is rotated to run
 * up the long (V) axis.
 */
export function makeStampNormalMap(): CanvasTexture {
  const w = 640;
  const h = 1280;

  // 1) Height field: mid-grey base, faint grain, recessed (dark) brand text.
  const height = document.createElement('canvas');
  height.width = w;
  height.height = h;
  const hctx = height.getContext('2d')!;
  hctx.fillStyle = '#808080';
  hctx.fillRect(0, 0, w, h);
  paintGrain(hctx, w, h);
  // "Hold Me" rotated to run along the long axis. A slight blur widens the
  // bevel ramp so the engraving catches light and reads clearly.
  hctx.save();
  hctx.translate(w / 2, h / 2);
  hctx.rotate(-Math.PI / 2);
  hctx.textAlign = 'center';
  hctx.textBaseline = 'middle';
  hctx.font = '700 220px "Fredoka", ui-rounded, system-ui, sans-serif';
  hctx.filter = 'blur(3px)';
  hctx.fillStyle = '#0c0c0c'; // dark = deep recess
  hctx.fillText('Hold Me', 0, 0);
  hctx.restore();
  hctx.filter = 'none';

  // 2) Convert the height field to a normal map (finite-difference gradient).
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

  const tex = new CanvasTexture(normal);
  tex.anisotropy = 4;
  return tex; // linear data — must NOT be tagged sRGB
}
