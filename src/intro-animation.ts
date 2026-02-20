import * as THREE from "three";
import gsap from "gsap";
import type { Doors } from "./doors";

/**
 * Cinematic intro for a 5-story building:
 * Camera starts far back, slowly approaches,
 * doors open, camera glides inside, doors close.
 */
export function playIntro(camera: THREE.PerspectiveCamera, doors: Doors): Promise<void> {
  return new Promise((resolve) => {
    camera.position.set(0, 6, 90);
    camera.lookAt(0, 12, 0);

    const tl = gsap.timeline({ onComplete: resolve });

    // Slow approach (0 → 8s)
    tl.to(camera.position, {
      z: 28,
      y: 5,
      duration: 8,
      ease: "power1.inOut",
    }, 0);

    // Look target gradually lowers to door level
    const lookTarget = { y: 12 };
    tl.to(lookTarget, {
      y: 5,
      duration: 8,
      ease: "power1.inOut",
      onUpdate: () => {
        camera.lookAt(0, lookTarget.y, 0);
      },
    }, 0);

    // Doors open (7s)
    tl.add(doors.open(), 7);

    // Enter building and glide to final position (8 → 11.5s)
    tl.to(camera.position, {
      z: 0,
      y: 5,
      duration: 3.5,
      ease: "power2.inOut",
    }, 8);

    // Doors close (10s)
    tl.add(doors.close(), 10);
  });
}
