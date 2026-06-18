import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

// 1×1 transparent GIF handed to qr-code-styling as a centre "image" purely so
// `hideBackgroundDots` carves a clean square clearing in the middle for the
// share arrow — the library's native equivalent of the old excavate. The image
// itself is invisible; the arrow is overlaid by the caller.
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

// Soft, rounded-dot QR for the room share button. qr-code-styling is imperative
// (append/update against a DOM node), so we drive it from refs. The background
// is transparent so the code sits flush on the panel with no surrounding white
// square; dots use the theme's dark ink (--color-ink) for solid contrast.
// Level-H error correction keeps it scannable with the centre cleared.
const INK = '#243743';

export function StyledQRCode({ value, size = 176 }: { value: string; size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data: value,
      margin: 0,
      image: TRANSPARENT_PIXEL,
      qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: { color: INK, type: 'rounded' },
      backgroundOptions: { color: 'transparent' },
      cornersSquareOptions: { color: INK, type: 'extra-rounded' },
      cornersDotOptions: { color: INK, type: 'dot' },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.32, margin: 2 },
    });
    qrRef.current = qr;
    const node = containerRef.current;
    if (node) qr.append(node);
    return () => {
      if (node) node.replaceChildren();
      qrRef.current = null;
    };
    // Re-create only on size change; data changes flow through the update effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  useEffect(() => {
    qrRef.current?.update({ data: value });
  }, [value]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ width: size, height: size }}
    />
  );
}
