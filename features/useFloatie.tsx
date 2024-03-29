import { useEffect, useRef } from "react";

interface Particle {
  direction: number;
  element: HTMLElement;
  left: number;
  size: number;
  speedHorz: number;
  speedUp: number;
  spinSpeed: number;
  spinVal: number;
  top: number;
}

var updateFn;

export const useFloatie = (fn: Function, enabled: boolean) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    updateFn = fn;

    enabled && makeElementCool(ref.current);
  }, [enabled]);

  return ref;
};

const getContainer = () => {
  const id = "_rk_coolMode";
  const existingContainer = document.getElementById(id);

  if (existingContainer) {
    return existingContainer;
  }

  const container = document.createElement("div");
  container.setAttribute("id", id);
  container.setAttribute(
    "style",
    [
      "overflow:hidden",
      "position:fixed",
      "height:100%",
      "top:0",
      "left:0",
      "right:0",
      "bottom:0",
      "pointer-events:none",
      "z-index:2147483647",
    ].join(";")
  );

  document.body.appendChild(container);

  return container;
};

let instanceCounter = 0;

function makeElementCool(element: HTMLElement): () => void {
  instanceCounter++;

  const sizes = [20, 30, 40];
  const limit = 5;

  let particles: Particle[] = [];
  let autoAddParticle = false;
  let mouseX = 0;
  let mouseY = 0;

  const container = getContainer();

  function createParticle(content, styles) {
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const speedHorz = Math.random() * 10;
    const speedUp = Math.random() * 15;
    const spinVal = 0;
    const spinSpeed = 0;
    const top = mouseY - size / 2;
    const left = mouseX - size / 2;
    const direction = Math.random() <= 0.5 ? -1 : 1;

    const particle = document.createElement("div");
    particle.innerHTML = `<p style="${(styles || []).join(
      ";"
    )}">${content}</p>`;
    particle.setAttribute(
      "style",
      [
        "position:absolute",
        "will-change:transform",
        `top:${top}px`,
        `left:${left}px`,
        `transform:rotate(${spinVal}deg)`,
      ].join(";")
    );

    container.appendChild(particle);

    particles.push({
      direction,
      element: particle,
      left,
      size,
      speedHorz,
      speedUp,
      spinSpeed,
      spinVal,
      top,
    });
  }

  function updateParticles() {
    for (const p of particles) {
      p.left = p.left - p.speedHorz * p.direction;
      p.top = p.top - p.speedUp;
      p.speedUp = Math.min(p.size, p.speedUp - 1);
      p.spinVal = p.spinVal + p.spinSpeed;

      if (
        p.top >=
        Math.max(window.innerHeight, document.body.clientHeight) + p.size
      ) {
        particles = particles.filter((o) => o !== p);
        p.element.remove();
      }

      p.element.setAttribute(
        "style",
        [
          `font-size:${p.size}px`,
          "font-weight:bold",
          "position:absolute",
          "will-change:transform",
          `top:${p.top}px`,
          `left:${p.left}px`,
          `transform:rotate(${p.spinVal}deg)`,
        ].join(";")
      );
    }
  }

  let animationFrame: number | undefined;

  function loop() {
    if (autoAddParticle && particles.length < limit) {
      updateFn(createParticle);
    }

    updateParticles();

    animationFrame = requestAnimationFrame(loop);
  }

  loop();

  const isTouchInteraction =
    "ontouchstart" in window ||
    // @ts-expect-error
    navigator.msMaxTouchPoints;

  const tap = isTouchInteraction ? "touchstart" : "mousedown";
  const tapEnd = isTouchInteraction ? "touchend" : "mouseup";
  const tapCancel = isTouchInteraction ? "touchcancel" : "mouseleave";
  const move = isTouchInteraction ? "touchmove" : "mousemove";

  const updateMousePosition = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      mouseX = e.touches?.[0].clientX;
      mouseY = e.touches?.[0].clientY;
    } else {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
  };

  const tapHandler = (e: MouseEvent | TouchEvent) => {
    updateMousePosition(e);
    autoAddParticle = true;
  };

  const disableAutoAddParticle = () => {
    // autoAddParticle = false;
    setTimeout(() => (autoAddParticle = false), 100);
  };

  element.addEventListener(move, updateMousePosition, { passive: false });
  element.addEventListener(tap, tapHandler);
  element.addEventListener(tapCancel, disableAutoAddParticle);
  document.body.addEventListener(tapCancel, disableAutoAddParticle);
  element.addEventListener(tapEnd, disableAutoAddParticle);
  // element.addEventListener('mouseleave', disableAutoAddParticle);

  return () => {
    element.removeEventListener(move, updateMousePosition);
    element.removeEventListener(tap, tapHandler);
    element.removeEventListener(tapCancel, disableAutoAddParticle);
    document.body.removeEventListener(tapCancel, disableAutoAddParticle);
    element.removeEventListener(tapEnd, disableAutoAddParticle);
    // element.removeEventListener('mouseleave', disableAutoAddParticle);

    // Cancel animation loop once animations are done
    const interval = setInterval(() => {
      if (animationFrame && particles.length === 0) {
        cancelAnimationFrame(animationFrame);
        clearInterval(interval);

        // Clean up container if this is the last instance
        if (--instanceCounter === 0) {
          container.remove();
        }
      }
    }, 500);
  };
}
