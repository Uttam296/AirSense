const API_BASE = "http://localhost:3000/api/auth";

/* ============ helpers ============ */
function showError(msg) {
  const box = document.getElementById("errorBox");
  if (!box) return;
  box.textContent = msg;
  box.classList.add("show");
}

function clearError() {
  const box = document.getElementById("errorBox");
  if (!box) return;
  box.classList.remove("show");
  box.textContent = "";
}

function setLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : label;
}

async function readJsonSafe(res) {
  try { return await res.json(); } catch { return {}; }
}

/* ============ LOGIN ============ */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    if (!email || !password) {
      showError("Enter your email and password.");
      return;
    }

    const btn = document.getElementById("submitBtn");
    setLoading(btn, true, "Log in");

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await readJsonSafe(res);

      if (!res.ok) {
        showError(data.message || data.error || "Incorrect email or password.");
        setLoading(btn, false, "Log in");
        return;
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("userId", data.userId);
      window.location.href = "index.html";

    } catch (err) {
      showError("Can't reach the server. Check that it's running and try again.");
      setLoading(btn, false, "Log in");
    }
  });
}

/* ============ SIGNUP ============ */
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!username || !email || !password) {
      showError("Fill in all fields.");
      return;
    }
    if (password.length < 6) {
      showError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords don't match.");
      return;
    }

    const btn = document.getElementById("submitBtn");
    setLoading(btn, true, "Create account");

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      const data = await readJsonSafe(res);

      if (!res.ok) {
        showError(data.message || data.error || "Couldn't create your account.");
        setLoading(btn, false, "Create account");
        return;
      }

      if (data.token) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("userId", data.userId);
        window.location.href = "index.html";
      } else {
        window.location.href = "login.html";
      }

    } catch (err) {
      showError("Can't reach the server. Check that it's running and try again.");
      setLoading(btn, false, "Create account");
    }
  });
}

/* ============ particle atmosphere ============ */
(function particles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  const colors = ["#00e676", "#6fe3d4", "#ffd54f", "#ff8a65"];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const COUNT = 46;
  const particlesArr = Array.from({ length: COUNT }, () => spawn());

  function spawn(randomY) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : h + Math.random() * 60,
      r: 1.4 + Math.random() * 2.6,
      speed: 0.15 + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.25 + Math.random() * 0.45
    };
  }

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
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();
  particlesArr.forEach((p) => (p.y = Math.random() * h));
  tick();
})();

/* ============ live AQI pill (decorative) ============ */
(function livePill() {
  const valueEl = document.getElementById("liveAqiValue");
  const labelEl = document.getElementById("liveAqiLabel");
  const swatchEl = document.getElementById("liveSwatch");
  if (!valueEl) return;

  const states = [
    { max: 50, label: "Good", color: "#00e676" },
    { max: 100, label: "Moderate", color: "#ffd54f" },
    { max: 150, label: "Sensitive", color: "#ff8a65" }
  ];

  function step() {
    const target = 20 + Math.floor(Math.random() * 110);
    const state = states.find((s) => target <= s.max) || states[states.length - 1];
    valueEl.textContent = target;
    labelEl.textContent = state.label;
    swatchEl.style.background = state.color;
  }

  step();
  setInterval(step, 3200);
})();