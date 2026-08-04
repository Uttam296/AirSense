// AQI helper utilities — logic ported 1:1 from the original script.js

export function getAqiStatus(aqi) {
  if (aqi <= 50) return { status: "🟢 Good", recommendation: "Air quality is satisfactory." };
  if (aqi <= 100) return { status: "🟡 Moderate", recommendation: "Acceptable air quality." };
  if (aqi <= 150)
    return {
      status: "🟠 Unhealthy for Sensitive Groups",
      recommendation: "Sensitive people should limit outdoor activity.",
    };
  if (aqi <= 200)
    return { status: "🔴 Unhealthy", recommendation: "Reduce prolonged outdoor exertion." };
  if (aqi <= 300)
    return { status: "🟣 Very Unhealthy", recommendation: "Avoid outdoor activity." };
  return { status: "⚫ Hazardous", recommendation: "Stay indoors and wear masks." };
}

export function getPredictionText(predicted) {
  if (predicted <= 50) return "🟢 Good";
  if (predicted <= 100) return "🟡 Moderate";
  if (predicted <= 150) return "🟠 Unhealthy for Sensitive Groups";
  if (predicted <= 200) return "🔴 Unhealthy";
  if (predicted <= 300) return "🟣 Very Unhealthy";
  return "⚫ Hazardous";
}

export function aqiBadgeColor(aqi) {
  if (aqi <= 50) return "#00c853";
  if (aqi <= 100) return "#ffd600";
  if (aqi <= 150) return "#ff6d00";
  if (aqi <= 200) return "#d50000";
  if (aqi <= 300) return "#aa00ff";
  return "#4e342e";
}

export function aqiValueColor(aqi) {
  let color = "#00e676";
  if (aqi > 50) color = "#ffeb3b";
  if (aqi > 100) color = "#ff9800";
  if (aqi > 150) color = "#f44336";
  if (aqi > 200) color = "#9c27b0";
  if (aqi > 300) color = "#6d1a1a";
  return color;
}

export function gaugeDashArray(aqi) {
  const maxAqi = 500;
  const totalDash = 283; // circumference of the half-arc path
  const clampedAqi = Math.min(aqi, maxAqi);
  const filled = (clampedAqi / maxAqi) * totalDash;
  return `${filled} ${totalDash}`;
}
