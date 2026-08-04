import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import L from "leaflet";

import Navbar from "../components/Navbar";
import AqiGauge from "../components/AqiGauge";
import { useAuth } from "../context/AuthContext";
import {
  fetchAirData,
  fetchCityByLocation,
  fetchPrediction,
  saveHistory,
  fetchHistory,
  addFavorite,
  fetchFavorites,
  deleteFavorite,
  fetchProfile,
} from "../services/api";
import { getAqiStatus, getPredictionText, aqiBadgeColor } from "../utils/aqi";
import styles from "../styles/Dashboard.module.css";

const emptyAqiData = {
  aqi: null,
  pm25: "--",
  pm10: "--",
  co: "--",
  no2: "--",
  o3: "--",
  so2: "--",
  temperature: "--",
  humidity: "--",
  wind: "--",
  icon: "",
  description: "--",
  pressure: "--",
  visibility: "--",
  uvIndex: "--",
  feelsLike: "",
  lat: null,
  lon: null,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { token, userId, logout } = useAuth();

  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [aqiData, setAqiData] = useState(emptyAqiData);
  const [aqiStatusText, setAqiStatusText] = useState("--");
  const [recommendation, setRecommendation] = useState("Search a city to get recommendations.");
  const [predictedAQI, setPredictedAQI] = useState("--");
  const [predictionMessage, setPredictionMessage] = useState("Search a city to predict AQI");
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [profileName, setProfileName] = useState("Loading...");
  const [currentCityLabel, setCurrentCityLabel] = useState("");

  // Map & chart instances live in refs to persist across renders without re-creating them
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const pollutionChartCanvasRef = useRef(null);
  const pollutionChartRef = useRef(null);
  const pieChartCanvasRef = useRef(null);
  const pieChartRef = useRef(null);
  const historyChartCanvasRef = useRef(null);
  const historyChartRef = useRef(null);

  /* ===== INITIAL LOAD: profile, favorites, history ===== */
  useEffect(() => {
    fetchProfile(token, userId)
      .then((data) => setProfileName(data.username))
      .catch((err) => console.log(err));

    refreshFavorites();
    refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshFavorites = useCallback(async () => {
    try {
      const data = await fetchFavorites(token, userId);
      setFavorites(data);
    } catch (err) {
      console.log(err);
    }
  }, [token, userId]);

  const refreshHistory = useCallback(async () => {
    try {
      const data = await fetchHistory(token, userId);
      setHistory(data);
    } catch (err) {
      console.log(err);
    }
  }, [token, userId]);

  /* ===== SEARCH ===== */
  const handleSearch = useCallback(
    async (cityOverride) => {
      const city = cityOverride ?? cityInput;
      if (!city) return;

      setLoading(true);
      try {
        const data = await fetchAirData(city);
        setCurrentCityLabel(city);

        await saveHistory(token, userId, city, data.aqi);

        setLoading(false);
        setAqiData(data);

        const { status, recommendation: rec } = getAqiStatus(data.aqi);
        setAqiStatusText(status);
        setRecommendation(rec);

        if (data.aqi > 200) {
          alert("⚠ Very unhealthy air quality detected!");
        }

        // AI prediction
        try {
          const predictionData = await fetchPrediction({
            pm25: data.pm25,
            pm10: data.pm10,
            no2: data.no2,
            co: data.co,
            so2: data.so2,
            o3: data.o3,
          });
          const predicted = Number(predictionData.predictedAQI);
          setPredictedAQI(predictionData.predictedAQI);
          setPredictionMessage(getPredictionText(predicted));
        } catch (predErr) {
          console.log(predErr);
        }

        refreshHistory();
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    },
    [cityInput, token, userId, refreshHistory]
  );

  /* ===== SAVE CITY ===== */
  async function handleSaveCity() {
    if (!cityInput) {
      alert("Please enter a city.");
      return;
    }
    try {
      const data = await addFavorite(token, userId, cityInput);
      alert(data.message);
      refreshFavorites();
    } catch (error) {
      console.log(error);
    }
  }

  async function handleDeleteFavorite(e, id) {
    e.stopPropagation();
    try {
      await deleteFavorite(token, id);
      refreshFavorites();
    } catch (error) {
      console.log(error);
    }
  }

  function handleFavoriteClick(city) {
    setCityInput(city);
    handleSearch(city);
  }

  /* ===== GEOLOCATION ===== */
  function handleUseLocation() {
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const data = await fetchCityByLocation(lat, lon);
        setCityInput(data.city);
        handleSearch(data.city);
      } catch (error) {
        console.log(error);
      }
    });
  }

  /* ===== THEME TOGGLE ===== */
  function handleThemeToggle() {
    setDarkMode((prev) => !prev);
  }

  useEffect(() => {
    // CSS Modules hashes ".dark-mode" like any other class, so we must use the
    // resolved token (styles["dark-mode"]) rather than the literal string, or the
    // selectors in Dashboard.module.css (e.g. ".dark-mode .glass-card") won't match.
    const hashedClass = styles["dark-mode"];
    if (hashedClass) {
      document.body.classList.toggle(hashedClass, darkMode);
    }
    return () => {
      if (hashedClass) document.body.classList.remove(hashedClass);
    };
  }, [darkMode]);

  /* ===== LOGOUT ===== */
  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleHistoryItemClick(city) {
    setCityInput(city);
    handleSearch(city);
  }

  /* ===== MAP: create once, update view/marker when coordinates change ===== */
  useEffect(() => {
    if (aqiData.lat == null || aqiData.lon == null) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([aqiData.lat, aqiData.lon], 10);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([aqiData.lat, aqiData.lon], 10);
    }

    if (markerRef.current) mapRef.current.removeLayer(markerRef.current);
    markerRef.current = L.marker([aqiData.lat, aqiData.lon])
      .addTo(mapRef.current)
      .bindPopup(`<b>${currentCityLabel}</b><br>AQI: ${aqiData.aqi}`)
      .openPopup();
  }, [aqiData.lat, aqiData.lon, aqiData.aqi, currentCityLabel]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /* ===== BAR + PIE CHART ===== */
  useEffect(() => {
    if (aqiData.aqi == null) return;

    // Coerce to numbers defensively — if the backend omits a pollutant field for
    // some cities, Chart.js can throw on `undefined`, which (since this used to be
    // one synchronous block) silently prevented BOTH charts from rendering.
    const safe = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const chartValues = [safe(aqiData.pm25), safe(aqiData.pm10), safe(aqiData.co), safe(aqiData.no2)];

    try {
      if (pollutionChartRef.current) pollutionChartRef.current.destroy();
      pollutionChartRef.current = new Chart(pollutionChartCanvasRef.current, {
        type: "bar",
        data: {
          labels: ["PM2.5", "PM10", "CO", "NO₂"],
          datasets: [
            {
              label: "Pollutant Levels",
              data: chartValues,
              backgroundColor: [
                "rgba(0, 230, 118, 0.7)",
                "rgba(0, 176, 255, 0.7)",
                "rgba(255, 152, 0, 0.7)",
                "rgba(156, 39, 176, 0.7)",
              ],
              borderRadius: 8,
              borderWidth: 0,
            },
          ],
        },
        options: {
          plugins: { legend: { labels: { color: "#ccc" } } },
          scales: {
            x: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } },
          },
        },
      });
    } catch (err) {
      console.error("Bar chart failed to render:", err);
    }

    try {
      if (pieChartRef.current) pieChartRef.current.destroy();
      pieChartRef.current = new Chart(pieChartCanvasRef.current, {
        type: "doughnut",
        data: {
          labels: ["PM2.5", "PM10", "CO", "NO₂"],
          datasets: [
            {
              data: chartValues,
              backgroundColor: [
                "rgba(0, 230, 118, 0.8)",
                "rgba(0, 176, 255, 0.8)",
                "rgba(255, 152, 0, 0.8)",
                "rgba(156, 39, 176, 0.8)",
              ],
              borderWidth: 0,
            },
          ],
        },
        options: {
          plugins: { legend: { labels: { color: "#ccc" } } },
          cutout: "65%",
        },
      });
    } catch (err) {
      console.error("Pie chart failed to render:", err);
    }

    return () => {
      if (pollutionChartRef.current) pollutionChartRef.current.destroy();
      if (pieChartRef.current) pieChartRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aqiData.aqi, aqiData.pm25, aqiData.pm10, aqiData.co, aqiData.no2]);

  /* ===== HISTORY LINE CHART ===== */
  useEffect(() => {
    if (!historyChartCanvasRef.current) return;
    if (historyChartRef.current) historyChartRef.current.destroy();

    const safe = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

    try {
      historyChartRef.current = new Chart(historyChartCanvasRef.current, {
        type: "line",
        data: {
          labels: history.map((item) => item.city),
          datasets: [
            {
              label: "AQI",
              data: history.map((item) => safe(item.aqi)),
              fill: true,
              tension: 0.4,
              borderColor: "#4caf50",
              backgroundColor: "rgba(76,175,80,0.15)",
              pointBackgroundColor: "#4caf50",
              pointRadius: 5,
            },
          ],
        },
        options: {
          plugins: { legend: { labels: { color: "#ccc" } } },
          scales: {
            x: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } },
          },
        },
      });
    } catch (err) {
      console.error("History chart failed to render:", err);
    }

    return () => {
      if (historyChartRef.current) historyChartRef.current.destroy();
    };
  }, [history]);

  const recentHistory = [...history].slice(-5).reverse();

  return (
    <div className={styles.page}>
      <Navbar
        profileName={profileName}
        darkMode={darkMode}
        onThemeToggle={handleThemeToggle}
        onLogout={handleLogout}
      />

      {/* SEARCH */}
      <div className={styles["search-box"]}>
        <div className={styles["search-inner"]}>
          <span className={styles["search-icon"]}>🔍</span>
          <input
            type="text"
            id="cityInput"
            placeholder="Enter city name"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button id="updateBtn" onClick={() => handleSearch()}>
            Search
          </button>
        </div>
      </div>

      <div id="loading" style={{ display: loading ? "block" : "none" }}>
        Loading...
      </div>

      {/* ACTION BUTTONS */}
      <div className={styles["action-buttons"]}>
        <button id="locationBtn" onClick={handleUseLocation}>
          📍 Use My Location
        </button>
        <button id="saveCityBtn" onClick={handleSaveCity}>
          ⭐ Save City
        </button>
      </div>

      {/* FAVORITES */}
      <div id="favoriteCities" className={styles["favorite-chips"]}>
        {favorites.map((item) => (
          <button
            key={item._id}
            className={styles["favorite-city"]}
            onClick={() => handleFavoriteClick(item.city)}
          >
            {item.city}{" "}
            <span
              className={styles["delete-city"]}
              onClick={(e) => handleDeleteFavorite(e, item._id)}
            >
              ❌
            </span>
          </button>
        ))}
      </div>

      {/* ROW 1: AQI Status + Pollutant Composition */}
      <div className={`${styles["row-grid"]} ${styles["two-col"]}`}>
        <div className={`${styles["glass-card"]} ${styles["aqi-status-card"]}`}>
          <h2 className={styles["card-title"]}>AQI Status</h2>
          <AqiGauge aqi={aqiData.aqi} />
          <div className={styles["aqi-label"]} id="aqiStatus">
            {aqiStatusText}
          </div>
          <div className={styles["aqi-rec"]} id="recommendation">
            {recommendation}
          </div>
          <hr className={styles["ai-divider"]} />

          <div className={styles["ai-prediction"]}>
            <div className={styles["ai-title"]}>🤖 AI AQI Prediction</div>
            <div id="predictedAQI" className={styles["ai-value"]}>
              {predictedAQI}
            </div>
            <div id="predictionMessage" className={styles["ai-status"]}>
              {predictionMessage}
            </div>
          </div>
        </div>

        <div className={`${styles["glass-card"]} ${styles["pollutant-composition-card"]}`}>
          <h2 className={styles["card-title"]}>Pollutant Composition</h2>
          <div className={styles["pollutant-grid"]}>
            <div className={styles["pollutant-item"]}>
              <div className={`${styles["poll-icon"]} ${styles["pm25-icon"]}`}>💠</div>
              <div className={styles["poll-value"]} id="pm25">{aqiData.pm25}</div>
              <div className={styles["poll-unit"]}>μg/m³</div>
              <div className={styles["poll-label"]}>PM2.5</div>
            </div>
            <div className={styles["pollutant-item"]}>
              <div className={`${styles["poll-icon"]} ${styles["pm10-icon"]}`}>🔵</div>
              <div className={styles["poll-value"]} id="pm10">{aqiData.pm10 ?? "N/A"}</div>
              <div className={styles["poll-unit"]}>μg/m³</div>
              <div className={styles["poll-label"]}>PM10</div>
            </div>
            <div className={styles["pollutant-item"]}>
              <div className={`${styles["poll-icon"]} ${styles["no2-icon"]}`}>🟢</div>
              <div className={styles["poll-value"]} id="no2">{aqiData.no2 ?? "N/A"}</div>
              <div className={styles["poll-unit"]}>μg/m³</div>
              <div className={styles["poll-label"]}>NO₂</div>
            </div>
            <div className={styles["pollutant-item"]}>
              <div className={`${styles["poll-icon"]} ${styles["co-icon"]}`}>🟠</div>
              <div className={styles["poll-value"]} id="co">{aqiData.co ?? "N/A"}</div>
              <div className={styles["poll-unit"]}>mg/m³</div>
              <div className={styles["poll-label"]}>CO</div>
            </div>
            <div className={styles["pollutant-item"]}>
              <div className={`${styles["poll-icon"]} ${styles["o3-icon"]}`}>🔷</div>
              <div className={styles["poll-value"]} id="o3">{aqiData.o3 ?? "N/A"}</div>
              <div className={styles["poll-unit"]}>μg/m³</div>
              <div className={styles["poll-label"]}>O₃</div>
            </div>
            <div className={styles["pollutant-item"]}>
              <div className={`${styles["poll-icon"]} ${styles["so2-icon"]}`}>🟡</div>
              <div className={styles["poll-value"]} id="so2">{aqiData.so2 ?? "N/A"}</div>
              <div className={styles["poll-unit"]}>μg/m³</div>
              <div className={styles["poll-label"]}>SO₂</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: Map + AQI Trend + Search History */}
      <div className={`${styles["row-grid"]} ${styles["three-col"]}`}>
        <div className={`${styles["glass-card"]} ${styles["map-card"]}`}>
          <h2 className={styles["card-title"]}>Air Quality Map</h2>
          <div id="map" ref={mapContainerRef}>
            {aqiData.lat == null && (
              <p style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>
                Map will appear here once a city is searched (needs lat/lon from the backend).
              </p>
            )}
          </div>
        </div>

        <div className={`${styles["glass-card"]} ${styles["trend-card"]}`}>
          <div className={styles["trend-header"]}>
            <h2 className={styles["card-title"]}>AQI Trend (Last 7 Days)</h2>
            <select id="aqiUnit" className={styles["unit-select"]}>
              <option>AQI (US)</option>
            </select>
          </div>
          <canvas id="historyChart" ref={historyChartCanvasRef}></canvas>
        </div>

        <div className={`${styles["glass-card"]} ${styles["history-card"]}`}>
          <h2 className={styles["card-title"]}>Search History</h2>
          <div id="searchHistoryList" className={styles["history-list"]}>
            {recentHistory.map((item, idx) => (
              <div
                key={item._id ?? idx}
                className={styles["history-item"]}
                onClick={() => handleHistoryItemClick(item.city)}
              >
                <div className={styles["history-info"]}>
                  <div className={styles["city-name"]}>{item.city}</div>
                  <div className={styles["city-time"]}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                  </div>
                </div>
                <span
                  className={styles["aqi-badge"]}
                  style={{ background: aqiBadgeColor(item.aqi) }}
                >
                  {item.aqi}
                </span>
              </div>
            ))}
          </div>
          <div className={styles["view-all"]} id="viewAllHistory">
            View All History →
          </div>
        </div>
      </div>

      {/* ROW 3: Weather */}
      <div className={`${styles["glass-card"]} ${styles["weather-full-card"]}`}>
        <h2 className={styles["card-title"]}>Weather Information</h2>
        <div className={styles["weather-row"]}>
          <div className={styles["weather-main"]}>
            {aqiData.icon ? (
              <img
                id="weatherIcon"
                src={`https://openweathermap.org/img/wn/${aqiData.icon}@2x.png`}
                alt=""
              />
            ) : (
              <img id="weatherIcon" alt="" style={{ display: "none" }} />
            )}
            <div>
              <div className={styles["weather-temp"]} id="temperature">
                {aqiData.temperature === "--" ? "--" : `${aqiData.temperature} °C`}
              </div>
              <div className={styles["weather-desc"]} id="weatherDescription">
                {aqiData.description}
              </div>
              <div className={styles["feels-like"]} id="feelsLike">
                {aqiData.feelsLike ? `Feels like ${aqiData.feelsLike} °C` : ""}
              </div>
            </div>
          </div>
          <div className={styles["weather-stat"]}>
            <span className={styles["w-icon"]}>💧</span>
            <div>
              <div className={styles["w-label"]}>Humidity</div>
              <div className={styles["w-val"]} id="humidity">
                {aqiData.humidity === "--" ? "--" : `${aqiData.humidity} %`}
              </div>
            </div>
          </div>
          <div className={styles["weather-stat"]}>
            <span className={styles["w-icon"]}>💨</span>
            <div>
              <div className={styles["w-label"]}>Wind Speed</div>
              <div className={styles["w-val"]} id="wind">
                {aqiData.wind === "--" ? "--" : `${aqiData.wind} m/s`}
              </div>
            </div>
          </div>
          <div className={styles["weather-stat"]}>
            <span className={styles["w-icon"]}>🎯</span>
            <div>
              <div className={styles["w-label"]}>Pressure</div>
              <div className={styles["w-val"]} id="pressure">
                {(aqiData.pressure ?? "--") + " hPa"}
              </div>
            </div>
          </div>
          <div className={styles["weather-stat"]}>
            <span className={styles["w-icon"]}>👁</span>
            <div>
              <div className={styles["w-label"]}>Visibility</div>
              <div className={styles["w-val"]} id="visibility">
                {aqiData.visibility ? (aqiData.visibility / 1000).toFixed(0) + " km" : "--"}
              </div>
            </div>
          </div>
          <div className={styles["weather-stat"]}>
            <span className={styles["w-icon"]}>☀️</span>
            <div>
              <div className={styles["w-label"]}>UV Index</div>
              <div className={styles["w-val"]} id="uvIndex">
                {aqiData.uvIndex ?? "--"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles["charts-row"]}>
        <div className={`${styles["glass-card"]} ${styles["chart-card"]}`}>
          <h2 className={styles["card-title"]}>📊 Pollutants Comparison</h2>
          <canvas id="pollutionChart" ref={pollutionChartCanvasRef}></canvas>
        </div>
        <div className={`${styles["glass-card"]} ${styles["chart-card"]}`}>
          <h2 className={styles["card-title"]}>🥧 Pollutant Distribution</h2>
          <canvas id="pieChart" ref={pieChartCanvasRef}></canvas>
        </div>
      </div>

      <footer className={styles.footer}>© 2025 Air Quality Dashboard. All rights reserved.</footer>
    </div>
  );
}