import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

// Soft, rounded-dot QR for the room share button. qr-code-styling is imperative
// (append/update against a DOM node), so we drive it from refs. A radial mask
// dissolves the dots into a round, soft-edged clearing in the centre where the
// share arrow sits — replacing the old hard white excavated square. Level-H
// error correction keeps it scannable behind the faded centre.
//
// Pixel stops (the QR is a fixed square): a transparent core that frames the
// ~20px arrow with margin, then a soft band back to a fully opaque QR. The
// cleared footprint stays close to the old 42px excavated square that scanned
// fine, so level-H correction still recovers the centre. White fades to white
// against the button background, so visually only the dark dots fade out.
const FADE =
  'radial-gradient(circle at center, transparent 20px, #000 34px)';

export function StyledQRCode({ value, size = 140 }: { value: string; size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data: value,
      margin: 0,
      qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: { color: '#243743', type: 'rounded' },
      backgroundOptions: { color: '#FFFFFF' },
      cornersSquareOptions: { color: '#243743', type: 'extra-rounded' },
      cornersDotOptions: { color: '#243743', type: 'dot' },
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
      style={{ width: size, height: size, WebkitMaskImage: FADE, maskImage: FADE }}
    />
  );
}
