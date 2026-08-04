import styles from "../styles/Dashboard.module.css";
import { gaugeDashArray, aqiValueColor } from "../utils/aqi";

export default function AqiGauge({ aqi }) {
  const hasValue = aqi !== null && aqi !== undefined;
  const dashArray = hasValue ? gaugeDashArray(aqi) : "0 283";
  const color = hasValue ? aqiValueColor(aqi) : "#ff9800";

  return (
    <div className={styles["gauge-wrap"]}>
      <svg className={styles["arc-gauge"]} viewBox="0 0 220 130" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 20 120 A 90 90 0 0 1 200 120"
          fill="none"
          stroke="#1a2a2a"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M 20 120 A 90 90 0 0 1 200 120"
          fill="none"
          stroke="url(#aqiGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          id="aqiArc"
          strokeDasharray={dashArray}
        />
        <defs>
          <linearGradient id="aqiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#00e676" }} />
            <stop offset="30%" style={{ stopColor: "#ffeb3b" }} />
            <stop offset="55%" style={{ stopColor: "#ff9800" }} />
            <stop offset="75%" style={{ stopColor: "#f44336" }} />
            <stop offset="90%" style={{ stopColor: "#9c27b0" }} />
            <stop offset="100%" style={{ stopColor: "#6d1a1a" }} />
          </linearGradient>
        </defs>
        <text x="14" y="138" fill="#aaa" fontSize="9">0</text>
        <text x="44" y="50" fill="#aaa" fontSize="9">50</text>
        <text x="89" y="28" fill="#aaa" fontSize="9">100</text>
        <text x="137" y="38" fill="#aaa" fontSize="9">150</text>
        <text x="168" y="65" fill="#aaa" fontSize="9">200</text>
        <text x="183" y="100" fill="#aaa" fontSize="9">300</text>
        <text x="192" y="138" fill="#aaa" fontSize="9">500</text>
        <text x="110" y="110" id="gaugeValue" textAnchor="middle" fill={color} fontSize="36" fontWeight="bold">
          {hasValue ? aqi : "--"}
        </text>
        <text x="110" y="126" textAnchor="middle" fill="#aaa" fontSize="9">AQI (US)</text>
      </svg>
    </div>
  );
}
