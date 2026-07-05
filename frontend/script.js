const token = sessionStorage.getItem("token");
const userId = sessionStorage.getItem("userId");

if (!token) {
    window.location.href = "login.html";
}

const locationBtn = document.getElementById("locationBtn");
const saveCityBtn = document.getElementById("saveCityBtn");
const favoriteCitiesDiv = document.getElementById("favoriteCities");

let map;
let marker;
let pieChart;
let myChart;
let historyChart;

// ===== THEME TOGGLE =====
const themeBtn = document.getElementById("themeBtn");
themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    themeBtn.textContent = document.body.classList.contains("dark-mode")
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
});

// ===== AQI GAUGE (Semicircular SVG Arc) =====
function updateGauge(aqi) {
    const maxAqi = 500;
    const totalDash = 283; // circumference of the half-arc path
    const clampedAqi = Math.min(aqi, maxAqi);
    const filled = (clampedAqi / maxAqi) * totalDash;

    const arc = document.getElementById("aqiArc");
    if (arc) arc.setAttribute("stroke-dasharray", `${filled} ${totalDash}`);

    const valEl = document.getElementById("gaugeValue");
    if (valEl) valEl.textContent = aqi;

    // Color the AQI value text by level
    let color = "#00e676";
    if (aqi > 50) color = "#ffeb3b";
    if (aqi > 100) color = "#ff9800";
    if (aqi > 150) color = "#f44336";
    if (aqi > 200) color = "#9c27b0";
    if (aqi > 300) color = "#6d1a1a";
    if (valEl) valEl.setAttribute("fill", color);
}

// ===== AQI BADGE COLOR =====
function aqiBadgeColor(aqi) {
    if (aqi <= 50) return "#00c853";
    if (aqi <= 100) return "#ffd600";
    if (aqi <= 150) return "#ff6d00";
    if (aqi <= 200) return "#d50000";
    if (aqi <= 300) return "#aa00ff";
    return "#4e342e";
}

// ===== SEARCH =====
const updateBtn = document.getElementById("updateBtn");
updateBtn.addEventListener("click", async () => {
    try {
        const city = document.getElementById("cityInput").value;
        document.getElementById("loading").style.display = "block";

        const response = await fetch(`http://localhost:3000/api/air?city=${city}`);
        const data = await response.json();

        // Save to history (unchanged backend call)
        await fetch("http://localhost:3000/api/history", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({ userId, city, aqi: data.aqi })
        });

        document.getElementById("loading").style.display = "none";

        // ===== POLLUTANT VALUES =====
        document.getElementById("pm25").innerText = data.pm25;
        document.getElementById("pm10").innerText = data.pm10;
        document.getElementById("co").innerText = data.co;
        document.getElementById("no2").innerText = data.no2;
        document.getElementById("o3").innerText = data.o3 ?? "--"; // O₃ slot reuses AQI for now
        document.getElementById("so2").innerText = data.so2 ?? "N/A";

        // ===== WEATHER =====
        document.getElementById("temperature").innerText = data.temperature + " °C";
        document.getElementById("humidity").innerText = data.humidity + " %";
        document.getElementById("wind").innerText = data.wind + " m/s";
        document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
        document.getElementById("weatherDescription").innerText = data.description;
        document.getElementById("pressure").innerText = (data.pressure ?? "--") + " hPa";
        document.getElementById("visibility").innerText = data.visibility ? (data.visibility / 1000).toFixed(0) + " km" : "--";
        document.getElementById("uvIndex").innerText = data.uvIndex ?? "--";
        document.getElementById("feelsLike").innerText = data.feelsLike ? `Feels like ${data.feelsLike} °C` : "";

        // ===== AQI STATUS =====
        let status = "";
        let recommendation = "";

        if (data.aqi <= 50) {
            status = "🟢 Good";
            recommendation = "Air quality is satisfactory.";
        } else if (data.aqi <= 100) {
            status = "🟡 Moderate";
            recommendation = "Acceptable air quality.";
        } else if (data.aqi <= 150) {
            status = "🟠 Unhealthy for Sensitive Groups";
            recommendation = "Sensitive people should limit outdoor activity.";
        } else if (data.aqi <= 200) {
            status = "🔴 Unhealthy";
            recommendation = "Reduce prolonged outdoor exertion.";
        } else if (data.aqi <= 300) {
            status = "🟣 Very Unhealthy";
            recommendation = "Avoid outdoor activity.";
        } else {
            status = "⚫ Hazardous";
            recommendation = "Stay indoors and wear masks.";
        }

        document.getElementById("aqiStatus").innerText = status;
        document.getElementById("recommendation").innerText = recommendation;

        if (data.aqi > 200) {
            alert("⚠ Very unhealthy air quality detected!");
        }

        // ===== GAUGE =====
        updateGauge(data.aqi);
        // ===== AI Prediction =====

const predictionResponse = await fetch(

`http://localhost:3000/api/predict?pm25=${data.pm25}&pm10=${data.pm10}&no2=${data.no2}&co=${data.co}&so2=${data.so2}&o3=${data.o3}`

);

const predictionData = await predictionResponse.json();

document.getElementById(

"predictedAQI"

).innerText = predictionData.predictedAQI;

const predicted = Number(predictionData.predictedAQI);

let predictionText = "";

if(predicted <= 50){

    predictionText = "🟢 Good";

}

else if(predicted <=100){

    predictionText = "🟡 Moderate";

}

else if(predicted <=150){

    predictionText = "🟠 Unhealthy for Sensitive Groups";

}

else if(predicted <=200){

    predictionText = "🔴 Unhealthy";

}

else if(predicted <=300){

    predictionText = "🟣 Very Unhealthy";

}

else{

    predictionText = "⚫ Hazardous";

}

document.getElementById(

"predictionMessage"

).innerText = predictionText;

        // ===== MAP =====
        if (!map) {
            map = L.map("map").setView([data.lat, data.lon], 10);
            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19
            }).addTo(map);
        } else {
            map.setView([data.lat, data.lon], 10);
        }

        if (marker) map.removeLayer(marker);
        marker = L.marker([data.lat, data.lon])
            .addTo(map)
            .bindPopup(`<b>${city}</b><br>AQI: ${data.aqi}`)
            .openPopup();

        // ===== BAR CHART =====
        if (myChart) myChart.destroy();
        const ctx = document.getElementById("pollutionChart");
        myChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["PM2.5", "PM10", "CO", "NO₂"],
                datasets: [{
                    label: "Pollutant Levels",
                    data: [data.pm25, data.pm10, data.co, data.no2],
                    backgroundColor: [
                        "rgba(0, 230, 118, 0.7)",
                        "rgba(0, 176, 255, 0.7)",
                        "rgba(255, 152, 0, 0.7)",
                        "rgba(156, 39, 176, 0.7)"
                    ],
                    borderRadius: 8,
                    borderWidth: 0
                }]
            },
            options: {
                plugins: { legend: { labels: { color: "#ccc" } } },
                scales: {
                    x: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } },
                    y: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } }
                }
            }
        });

        // ===== PIE CHART =====
        if (pieChart) pieChart.destroy();
        pieChart = new Chart(document.getElementById("pieChart"), {
            type: "doughnut",
            data: {
                labels: ["PM2.5", "PM10", "CO", "NO₂"],
                datasets: [{
                    data: [data.pm25, data.pm10, data.co, data.no2],
                    backgroundColor: [
                        "rgba(0, 230, 118, 0.8)",
                        "rgba(0, 176, 255, 0.8)",
                        "rgba(255, 152, 0, 0.8)",
                        "rgba(156, 39, 176, 0.8)"
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                plugins: { legend: { labels: { color: "#ccc" } } },
                cutout: "65%"
            }
        });

        drawHistoryChart();

    } catch (error) {
        console.log(error);
        document.getElementById("loading").style.display = "none";
    }
});

// ===== SAVE CITY =====
saveCityBtn.addEventListener("click", async () => {
    try {
        const city = document.getElementById("cityInput").value;
        if (!city) { alert("Please enter a city."); return; }

        const response = await fetch("http://localhost:3000/api/favorites", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({ userId, city })
        });

        const data = await response.json();
        alert(data.message);
        displayFavorites();
    } catch (error) {
        console.log(error);
    }
});

// ===== DISPLAY FAVORITES =====
async function displayFavorites() {
    favoriteCitiesDiv.innerHTML = "";
    try {
        const response = await fetch(`http://localhost:3000/api/favorites/${userId}`, {
            headers: { "Authorization": token }
        });

        const favorites = await response.json();

        favorites.forEach(item => {
            const button = document.createElement("button");
            button.className = "favorite-city";
            button.innerHTML = `${item.city} <span class="delete-city">❌</span>`;

            button.addEventListener("click", () => {
                document.getElementById("cityInput").value = item.city;
                updateBtn.click();
            });

            button.querySelector(".delete-city").addEventListener("click", async (e) => {
                e.stopPropagation();
                await fetch(`http://localhost:3000/api/favorites/${item._id}`, {
                    method: "DELETE",
                    headers: { "Authorization": token }
                });
                displayFavorites();
            });

            favoriteCitiesDiv.appendChild(button);
        });
    } catch (error) {
        console.log(error);
    }
}

displayFavorites();

// ===== GEOLOCATION =====
locationBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const response = await fetch(`http://localhost:3000/api/location?lat=${lat}&lon=${lon}`);
            const data = await response.json();
            document.getElementById("cityInput").value = data.city;
            updateBtn.click();
        } catch (error) {
            console.log(error);
        }
    });
});

// ===== HISTORY CHART (Line) =====
async function drawHistoryChart() {
    try {
        const response = await fetch(`http://localhost:3000/api/history/${userId}`, {
            headers: { "Authorization": token }
        });

        const history = await response.json();

        if (historyChart) historyChart.destroy();

        historyChart = new Chart(document.getElementById("historyChart"), {
            type: "line",
            data: {
                labels: history.map(item => item.city),
                datasets: [{
                    label: "AQI",
                    data: history.map(item => item.aqi),
                    fill: true,
                    tension: 0.4,
                    borderColor: "#4caf50",
                    backgroundColor: "rgba(76,175,80,0.15)",
                    pointBackgroundColor: "#4caf50",
                    pointRadius: 5
                }]
            },
            options: {
                plugins: { legend: { labels: { color: "#ccc" } } },
                scales: {
                    x: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } },
                    y: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } }
                }
            }
        });

        // ===== SEARCH HISTORY SIDEBAR =====
        renderHistorySidebar(history);

    } catch (error) {
        console.log(error);
    }
}

function renderHistorySidebar(history) {
    const list = document.getElementById("searchHistoryList");
    if (!list) return;
    list.innerHTML = "";

    const recent = history.slice(-5).reverse();

    recent.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";

        const date = item.createdAt
            ? new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
            : "";

        div.innerHTML = `
            <div class="history-info">
                <div class="city-name">${item.city}</div>
                <div class="city-time">${date}</div>
            </div>
            <span class="aqi-badge" style="background:${aqiBadgeColor(item.aqi)}">${item.aqi}</span>
        `;

        div.addEventListener("click", () => {
            document.getElementById("cityInput").value = item.city;
            updateBtn.click();
        });

        list.appendChild(div);
    });
}

drawHistoryChart();

// ===== LOGOUT =====
document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    window.location.href = "login.html";
});

// ===== PROFILE =====
document.getElementById("profileBtn").addEventListener("click", () => {
    window.location.href = "profile.html";
});

// ===== LOAD PROFILE NAME =====
fetch(`http://localhost:3000/api/profile/${sessionStorage.getItem("userId")}`, {
    headers: { "Authorization": sessionStorage.getItem("token") }
})
.then(res => res.json())
.then(data => {
    document.getElementById("profileName").innerText = data.username;
    document.getElementById("profileInitial").innerText = data.username[0].toUpperCase();
});