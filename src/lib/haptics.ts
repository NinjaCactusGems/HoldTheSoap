// Centralized haptic patterns. Each cue fires on both platforms we care about:
//
//  - Android / Chrome: the Vibration API (`navigator.vibrate`). Single-number
//    durations only — some builds honor `vibrate(n)` but silently ignore pattern
//    arrays, and very short pulses (<~80ms) are dropped. Durations scale small
//    -> large for tick/go/elimination.
//
//  - iOS Safari: there is no Vibration API at all, so `navigator.vibrate` is a
//    no-op. The one way to reach the Taptic Engine from the web (iOS 17.4+) is
//    toggling a native `<input type="checkbox" switch>` control — each toggle
//    fires a light system haptic. We can't vary the strength, so "bigger" cues
//    are approximated with a short burst of taps.
//
// Both paths are fired unconditionally per cue: whichever the device lacks is a
// no-op, so callers never need to feature-detect.

// Lazily-created hidden switch used for the iOS Taptic trick. Kept offscreen and
// transparent rather than `display:none`, which can suppress the haptic.
let iosSwitch: HTMLLabelElement | null = null;

function getIosSwitch(): HTMLLabelElement | null {
  if (typeof document === 'undefined') return null;
  if (!iosSwitch) {
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.position = 'absolute';
    label.style.opacity = '0';
    label.style.pointerEvents = 'none';
    label.style.width = '0';
    label.style.height = '0';
    label.style.overflow = 'hidden';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);
    document.body.appendChild(label);
    iosSwitch = label;
  }
  return iosSwitch;
}

// A burst of `times` light iOS taps, ~70ms apart. Clicking the label toggles the
// switch, which fires the Taptic Engine on iOS 17.4+ (no-op elsewhere).
function iosTaps(times: number) {
  const label = getIosSwitch();
  if (!label) return;
  for (let i = 0; i < times; i++) {
    window.setTimeout(() => label.click(), i * 70);
  }
}

// Fire a cue: `ms` drives Android vibration, `taps` drives the iOS burst.
function fire(ms: number, taps: number) {
  navigator.vibrate?.(ms);
  iosTaps(taps);
}

export const haptics = {
  // Small, light per-second tick during the "Get Ready" countdown — the
  // smallest of the cues, building up to the Go/elimination buzzes.
  tick: () => fire(120, 1),
  // Larger buzz on "Go".
  go: () => fire(300, 2),
  // Big, unmistakable buzz when a player is eliminated.
  elimination: () => fire(600, 3),
  // Generic shake pulse (used by the motion-sensor demo).
  shake: () => fire(200, 2),
  // Light "be careful" pulse when nearing the elimination threshold.
  warn: () => fire(150, 1),
};
