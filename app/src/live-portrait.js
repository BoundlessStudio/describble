import { createStage, boilFrame } from './stage.js';

export const DRAWING_SETTLE_MS = 1400;

export function trackPortraitPointer() {
  const pointer = { clientX: null, clientY: null };
  addEventListener('pointermove', (event) => {
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
  });
  return pointer;
}

const blinkDelay = () => 2200 + Math.random() * 3800;

export function createBlink(now, firstDelay = blinkDelay()) {
  let nextBlink = now + firstDelay;
  let startedAt = -Infinity;
  return (now) => {
    if (now >= nextBlink) {
      startedAt = now;
      nextBlink = now + blinkDelay();
    }
    const progress = (now - startedAt) / 170;
    return progress < 1 ? Math.sin(Math.PI * progress) : 0;
  };
}

export function idlePose(now) {
  return {
    yaw: 0.38 * Math.sin(now / 1900) + 0.12 * Math.sin(now / 730),
    roll: 2.2 * Math.sin(now / 2300),
    bob: 3 * Math.sin(now / 1100),
  };
}

export function createLivePortrait(svg, { calm, fillScale = 1 }) {
  const stage = createStage(svg, { instant: calm, fillScale });
  const pose = { yaw: 0, turn: 0, turnAt: -1e9, drag: null };
  const blinkAt = createBlink(performance.now(), 2500);
  let gaze = [0, 0];
  let shown = -1;

  if (!calm) {
    svg.addEventListener('pointerdown', (event) => {
      pose.drag = event.pointerId;
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener('pointermove', (event) => {
      if (pose.drag !== event.pointerId) return;
      const rect = svg.getBoundingClientRect();
      pose.yaw = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2.4));
    });
    svg.addEventListener('lostpointercapture', (event) => {
      if (pose.drag === event.pointerId) pose.drag = null;
    });
  }

  return {
    update(scene, now) {
      stage.update(scene, now);
      shown = -1;
    },
    glance(now) {
      pose.turn = pose.turn >= 0 ? -1 : 1;
      pose.turnAt = now;
    },
    draw(now, pointer) {
      if (!calm) {
        // Idle sway and a quick look to one side while the portrait changes.
        const since = (now - pose.turnAt) / 1000;
        const glance = since < 1.6 ? pose.turn * Math.sin(Math.PI * Math.min(1, since / 1.6)) * 0.85 : 0;
        const { yaw, roll, bob } = idlePose(now);
        const target = pose.drag !== null ? pose.yaw : yaw + glance;
        pose.yaw += (target - pose.yaw) * 0.12;
        stage.setPose({ yaw: pose.yaw, roll, bob });
        const pointerX = (pointer.clientX ?? innerWidth / 2) / innerWidth - 0.5;
        const pointerY = (pointer.clientY ?? innerHeight / 2) / innerHeight - 0.5;
        const gazeTarget = [pose.yaw * 0.7 + pointerX, pointerY * 1.2];
        gaze = gaze.map((v, i) => v + (Math.max(-1, Math.min(1, gazeTarget[i])) - v) * 0.15);
        stage.setLife({ blink: blinkAt(now), gaze });
      }
      const frame = calm ? 0 : boilFrame(now);
      if (stage.busy(now) || frame !== shown) {
        shown = frame;
        stage.draw(now, frame);
      } else if (!calm) {
        stage.draw(now, frame, { faceOnly: true });
      }
    },
  };
}
