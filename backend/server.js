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

        const response = await axios.get(
            `https://api.waqi.info/feed/${city}/?token=${API_KEY}`
        );
        const data = response.data.data;

        const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_KEY}`
        );
        const weather = weatherResponse.data;

       

        res.json({
            aqi: data.aqi,
            pm25: data.iaqi?.pm25?.v ?? 0,
            pm10: data.iaqi?.pm10?.v ?? 0,
            no2: data.iaqi?.no2?.v ?? 0,
            co: data.iaqi?.co?.v ?? 0,
            so2: data.iaqi?.so2?.v ?? 0,
            o3: data.iaqi?.o3?.v ?? 0,
            lat: data.city.geo[0],
            lon: data.city.geo[1],
            temperature: weather.main.temp,
            feelsLike: weather.main.feels_like,
            humidity: weather.main.humidity,
            pressure: weather.main.pressure,
            visibility: weather.visibility,
            wind: weather.wind.speed,
            uvIndex: "N/A",
            icon: weather.weather[0].icon,
            description: weather.weather[0].description
        });

    } catch (error) {
        console.log(error.message);
        if (error.response) console.log(error.response.data);
        res.status(500).json({ error: error.message });
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