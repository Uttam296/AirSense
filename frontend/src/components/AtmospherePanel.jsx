import { useEffect, useRef } from "react";

// Ported 1:1 from auth.js — particle canvas animation + decorative live AQI pill.
export default function AtmospherePanel({ styles, headline, subline }) {
  const canvasRef = useRef(null);
  const valueRef = useRef(null);
  const labelRef = useRef(null);
  const swatchRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const colors = ["#00e676", "#6fe3d4", "#ffd54f", "#ff8a65"];
    let animationFrame;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const COUNT = 46;
    function spawn(randomY) {
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : h + Math.random() * 60,
        r: 1.4 + Math.random() * 2.6,
        speed: 0.15 + Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.25 + Math.random() * 0.45,
      };
    }

    resize();
    const particlesArr = Array.from({ length: COUNT }, () => spawn());
    particlesArr.forEach((p) => (p.y = Math.random() * h));

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particlesArr) {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) Object.assign(p, spawn(false));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animationFrame = requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize);
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const valueEl = valueRef.current;
    const labelEl = labelRef.current;
    const swatchEl = swatchRef.current;
    if (!valueEl) return;

    const states = [
      { max: 50, label: "Good", color: "#00e676" },
      { max: 100, label: "Moderate", color: "#ffd54f" },
      { max: 150, label: "Sensitive", color: "#ff8a65" },
    ];

    function step() {
      const target = 20 + Math.floor(Math.random() * 110);
      const state = states.find((s) => target <= s.max) || states[states.length - 1];
      valueEl.textContent = target;
      labelEl.textContent = state.label;
      swatchEl.style.background = state.color;
    }

    step();
    const interval = setInterval(step, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.atmosphere}>
      <canvas ref={canvasRef} id="particleCanvas" />

      <div className={styles["atmosphere-content"]}>
        <div className={styles.brand}>
          <span className={styles.dot}></span> AIR QUALITY DASHBOARD
        </div>
        <h1 className={styles.headline}>{headline}</h1>
        <p className={styles.subline}>{subline}</p>

        <div className={styles["live-pill"]}>
          <span className={styles.swatch} ref={swatchRef} id="liveSwatch"></span>
          Live sample · AQI <b ref={valueRef} id="liveAqiValue">42</b> ·{" "}
          <span ref={labelRef} id="liveAqiLabel">Good</span>
        </div>
      </div>

      <div className={styles["atmosphere-foot"]}>SECURE CONNECTION · SESSION ENCRYPTED</div>
    </div>
  );
}
