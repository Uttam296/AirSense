const predictRoutes = require("./routes/predictRoutes");
const profileRoutes = require("./routes/profileRoutes");
const historyRoutes = require("./routes/historyRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/predict", predictRoutes);

const PORT = 3000;
const API_KEY = process.env.AQICN_API_KEY;
const WEATHER_KEY = process.env.OPENWEATHER_API_KEY;

app.get("/api/air", async (req, res) => {
    try {
        const city = req.query.city;

        // ===== WAQI (AQI) =====
        const waqiResponse = await axios.get(
            `https://api.waqi.info/feed/${city}/?token=${API_KEY}`
        );

        const waqi = waqiResponse.data.data;

        // ===== OpenWeather Weather =====
        const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_KEY}`
        );

        const weather = weatherResponse.data;

        // ===== OpenWeather Air Pollution =====
        const pollutionResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${weather.coord.lat}&lon=${weather.coord.lon}&appid=${WEATHER_KEY}`
        );

        const pollution = pollutionResponse.data.list[0].components;

        console.log("========== OPENWEATHER AIR POLLUTION ==========");
        console.log(pollution);
        console.log("==============================================");

        res.json({
            // AQI from WAQI
            aqi: waqi.aqi,

            // Pollutants from OpenWeather
            pm25: pollution.pm2_5,
            pm10: pollution.pm10,
            no2: pollution.no2,
            co: pollution.co,
            so2: pollution.so2,
            o3: pollution.o3,

            // Location
            lat: weather.coord.lat,
            lon: weather.coord.lon,

            // Weather
            temperature: weather.main.temp,
            feelsLike: weather.main.feels_like,
            humidity: weather.main.humidity,
            pressure: weather.main.pressure,
            visibility: weather.visibility,
            wind: weather.wind.speed,

            // OpenWeather Current Weather API doesn't provide UV
            uvIndex: "N/A",

            icon: weather.weather[0].icon,
            description: weather.weather[0].description
        });

    } catch (error) {
        console.log(error.message);

        if (error.response) {
            console.log(error.response.data);
        }

        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/api/location", async (req, res) => {
    try {
        const lat = req.query.lat;
        const lon = req.query.lon;

        const response = await axios.get(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_KEY}`
        );

        res.json({ city: response.data[0].name });

    } catch (error) {
        res.status(500).json({ error: "Unable to determine city" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});