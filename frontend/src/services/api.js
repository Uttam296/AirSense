// Centralized API calls — endpoints match the existing Express backend exactly.
// Base URL and header format ("Authorization": token, no "Bearer " prefix) are
// preserved from the original vanilla JS to avoid breaking the backend.

import axios from "axios";

const API_BASE = "http://localhost:3000/api";

const client = axios.create({
  baseURL: API_BASE,
});

function authHeaders(token) {
  return { headers: { Authorization: token } };
}

/* ===================== AUTH ===================== */
export async function loginRequest(email, password) {
  const res = await client.post("/auth/login", { email, password });
  return res.data;
}

export async function signupRequest(username, email, password) {
  const res = await client.post("/auth/signup", { username, email, password });
  return res.data;
}

/* ===================== AIR / WEATHER ===================== */
export async function fetchAirData(city) {
  const res = await client.get("/air", { params: { city } });
  return res.data;
}

export async function fetchCityByLocation(lat, lon) {
  const res = await client.get("/location", { params: { lat, lon } });
  return res.data;
}

/* ===================== AI PREDICTION ===================== */
export async function fetchPrediction({ pm25, pm10, no2, co, so2, o3 }) {
  const res = await client.get("/predict", {
    params: { pm25, pm10, no2, co, so2, o3 },
  });
  return res.data;
}

/* ===================== HISTORY ===================== */
export async function saveHistory(token, userId, city, aqi) {
  const res = await client.post(
    "/history",
    { userId, city, aqi },
    authHeaders(token)
  );
  return res.data;
}

export async function fetchHistory(token, userId) {
  const res = await client.get(`/history/${userId}`, authHeaders(token));
  return res.data;
}

/* ===================== FAVORITES ===================== */
export async function addFavorite(token, userId, city) {
  const res = await client.post(
    "/favorites",
    { userId, city },
    authHeaders(token)
  );
  return res.data;
}

export async function fetchFavorites(token, userId) {
  const res = await client.get(`/favorites/${userId}`, authHeaders(token));
  return res.data;
}

export async function deleteFavorite(token, id) {
  const res = await client.delete(`/favorites/${id}`, authHeaders(token));
  return res.data;
}

/* ===================== PROFILE ===================== */
export async function fetchProfile(token, userId) {
  const res = await client.get(`/profile/${userId}`, authHeaders(token));
  return res.data;
}
