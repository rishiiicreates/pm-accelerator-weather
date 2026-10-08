"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Compass,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  CloudSun,
  CloudDrizzle,
  SunMedium,
  Download,
  Trash2,
  Bookmark,
  Edit2,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Layers,
  Sparkles,
} from "lucide-react";

interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
    timezone?: string;
    elevation?: number;
  };
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    precipitation: number;
    cloudCover: number;
    isDay: boolean;
    weatherCode: number;
    condition: string;
    icon: string;
    time?: string;
  };
  forecast: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    apparentMax: number;
    apparentMin: number;
    precipSum: number;
    precipProb: number;
    uvIndex: number;
    maxWind: number;
    weatherCode: number;
    condition: string;
    icon: string;
    sunrise?: string;
    sunset?: string;
  }>;
  hourly: Array<{
    time: string;
    temp: number;
    humidity: number;
    precipProb: number;
    weatherCode: number;
    condition: string;
  }>;
}

interface FavoriteItem {
  id: number;
  name: string;
  country: string;
  lat: number;
  lon: number;
  notes: string;
  tag: string;
  created_at: string;
}

interface HistoryItem {
  id: number;
  query: string;
  location_name: string;
  country: string;
  lat: number;
  lon: number;
  temp_c: number;
  condition_text: string;
  searched_at: string;
}

export default function WeatherApp() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [unit, setUnit] = useState<"C" | "F">("C");

  // Database CRUD state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"favorites" | "history">("favorites");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editTag, setEditTag] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [saveTag, setSaveTag] = useState("Home");

  // Initial load
  useEffect(() => {
    fetchWeather("New York");
    loadFavorites();
    loadHistory();
  }, []);

  const fetchWeather = async (searchQuery?: string, lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/weather";
      if (lat !== undefined && lon !== undefined) {
        url += `?lat=${lat}&lon=${lon}`;
      } else if (searchQuery) {
        url += `?q=${encodeURIComponent(searchQuery)}`;
      } else {
        url += `?q=New York`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch weather data.");
      }

      setWeather(data);
      loadHistory();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while loading weather data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchWeather(query.trim());
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(undefined, pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLoading(false);
        setError(`Location access denied or unavailable (${err.message}). Enter location manually.`);
      },
      { timeout: 10000 }
    );
  };

  const loadFavorites = async () => {
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CRUD: Create Favorite
  const handleSaveFavorite = async () => {
    if (!weather) return;
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: weather.location.name,
          country: weather.location.country,
          lat: weather.location.lat,
          lon: weather.location.lon,
          notes: saveNote,
          tag: saveTag,
        }),
      });
      if (res.ok) {
        setSaveModalOpen(false);
        setSaveNote("");
        loadFavorites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CRUD: Update Favorite
  const handleUpdateFavorite = async (id: number) => {
    try {
      const res = await fetch(`/api/favorites/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNote, tag: editTag }),
      });
      if (res.ok) {
        setEditingId(null);
        loadFavorites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CRUD: Delete Favorite
  const handleDeleteFavorite = async (id: number) => {
    try {
      const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadFavorites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // History Delete
  const handleDeleteHistory = async (id?: number) => {
    try {
      const url = id ? `/api/history?id=${id}` : "/api/history";
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        loadHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const tempDisplay = (c: number) => {
    if (unit === "F") {
      return `${Math.round((c * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(c)}°C`;
  };

  const renderWeatherIcon = (iconName: string, className = "w-8 h-8") => {
    switch (iconName) {
      case "Sun":
        return <Sun className={`${className} text-amber-400`} />;
      case "SunMedium":
        return <SunMedium className={`${className} text-amber-300`} />;
      case "CloudSun":
        return <CloudSun className={`${className} text-amber-200`} />;
      case "Cloud":
        return <Cloud className={`${className} text-slate-300`} />;
      case "CloudFog":
        return <CloudFog className={`${className} text-slate-400`} />;
      case "CloudDrizzle":
        return <CloudDrizzle className={`${className} text-sky-300`} />;
      case "CloudRain":
        return <CloudRain className={`${className} text-sky-400`} />;
      case "CloudSnow":
      case "Snowflake":
        return <CloudSnow className={`${className} text-sky-200`} />;
      case "CloudLightning":
        return <CloudLightning className={`${className} text-yellow-400`} />;
      default:
        return <Sun className={`${className} text-amber-400`} />;
    }
  };

  const quickPills = [
    { label: "New York", q: "New York" },
    { label: "London", q: "London" },
    { label: "Tokyo", q: "Tokyo" },
    { label: "Paris", q: "Paris" },
    { label: "New Delhi", q: "New Delhi" },
    { label: "Zip 90210", q: "90210" },
    { label: "GPS (51.5, -0.1)", q: "51.5, -0.1" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Brand Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Weather Intelligence Platform</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Full-Stack Suite
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PM Accelerator Technical Assessment | Assessments #1 & #2
              </p>
            </div>
          </div>

          {/* Unit Toggle and Status Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setUnit("C")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  unit === "C" ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setUnit("F")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  unit === "F" ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                °F
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SQLite CRUD Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* PM Accelerator Mission Callout */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-sky-950/60 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong className="text-sky-300">PM Accelerator Mission:</strong> &quot;The Product Manager Accelerator Community is designed to support PM & AI professionals through every stage of their careers, from students looking for entry-level jobs to Director & VP-level PM leaders.&quot;
            </span>
          </div>
          <span className="text-slate-400 text-[11px] shrink-0">Built by Hrishikesh Yadav</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {/* Search & Location Bar */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city, town, zip code (e.g. 90210), GPS coords (40.71, -74.01), or landmark..."
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-sky-500/20"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={loading}
                title="Use current GPS location"
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center justify-center gap-2 text-sm border border-slate-700"
              >
                <MapPin className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Current Location</span>
              </button>
            </div>
          </form>

          {/* Quick preset pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Quick suggestions:
            </span>
            {quickPills.map((pill) => (
              <button
                key={pill.q}
                onClick={() => {
                  setQuery(pill.q);
                  fetchWeather(pill.q);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-sky-500/40 transition"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </section>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 flex items-start justify-between gap-3 text-sm animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Location Retrieval Notice</p>
                <p className="text-red-200/90 text-xs mt-0.5">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Weather Display & 5-Day Forecast */}
        {weather && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Current Weather Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sky-400 text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      <span>{weather.location.country || "Earth"}</span>
                      {weather.location.timezone && (
                        <span className="text-slate-500">• {weather.location.timezone}</span>
                      )}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">
                      {weather.location.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Coordinates: {weather.location.lat.toFixed(2)}°, {weather.location.lon.toFixed(2)}°
                      {weather.location.elevation !== undefined && ` • Alt: ${weather.location.elevation}m`}
                    </p>
                  </div>

                  {/* Bookmark Button for SQLite CRUD */}
                  <button
                    onClick={() => setSaveModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Save to Favorites</span>
                  </button>
                </div>

                {/* Big Temperature Hero Section */}
                <div className="flex flex-wrap items-center justify-between gap-6 my-6 pt-4 border-t border-slate-800/60">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 shadow-inner">
                      {renderWeatherIcon(weather.current.icon, "w-16 h-16")}
                    </div>
                    <div>
                      <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
                        {tempDisplay(weather.current.temp)}
                      </div>
                      <div className="text-slate-300 font-medium text-lg mt-0.5">
                        {weather.current.condition}
                      </div>
                      <div className="text-xs text-slate-400">
                        Feels like {tempDisplay(weather.current.feelsLike)}
                      </div>
                    </div>
                  </div>

                  {/* High/Low & Day Indicator */}
                  <div className="text-right text-xs text-slate-400 space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      Today Max: <span className="text-slate-200 font-semibold">{tempDisplay(weather.forecast[0]?.maxTemp || 0)}</span>
                    </div>
                    <div>
                      Today Min: <span className="text-slate-200 font-semibold">{tempDisplay(weather.forecast[0]?.minTemp || 0)}</span>
                    </div>
                    <div>
                      Precipitation: <span className="text-sky-300 font-semibold">{weather.forecast[0]?.precipSum} mm</span>
                    </div>
                  </div>
                </div>

                {/* Atmospheric Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Humidity</p>
                      <p className="text-sm font-bold text-white">{weather.current.humidity}%</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Wind Speed</p>
                      <p className="text-sm font-bold text-white">{weather.current.windSpeed} km/h</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Thermometer className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Pressure</p>
                      <p className="text-sm font-bold text-white">{Math.round(weather.current.pressure)} hPa</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">UV Index</p>
                      <p className="text-sm font-bold text-white">{weather.forecast[0]?.uvIndex ?? "Low"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1.1: 5-Day Organized Forecast */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CloudSun className="w-5 h-5 text-sky-400" />
                    <span>5-Day Weather Forecast</span>
                  </h3>
                  <span className="text-xs text-slate-400">Daily Projections & Rain Probability</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {weather.forecast.slice(0, 5).map((day, idx) => {
                    const d = new Date(day.date);
                    const dayName = idx === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
                    const dateFormatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                    return (
                      <div
                        key={day.date}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/30 transition flex flex-col items-center text-center space-y-2 group"
                      >
                        <div className="text-xs font-semibold text-slate-200">{dayName}</div>
                        <div className="text-[10px] text-slate-400">{dateFormatted}</div>

                        <div className="my-1 group-hover:scale-110 transition-transform">
                          {renderWeatherIcon(day.icon, "w-8 h-8")}
                        </div>

                        <div className="text-xs text-slate-300 font-medium line-clamp-1">
                          {day.condition}
                        </div>

                        <div className="w-full pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-100">{tempDisplay(day.maxTemp)}</span>
                          <span className="text-slate-400">{tempDisplay(day.minTemp)}</span>
                        </div>

                        {day.precipProb > 0 && (
                          <div className="text-[10px] text-sky-400 flex items-center gap-0.5">
                            <Droplets className="w-3 h-3" />
                            <span>{day.precipProb}% rain</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 24-Hour Hourly Forecast Scroll */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-sky-400" />
                  <span>24-Hour Hourly Weather Trend</span>
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {weather.hourly.slice(0, 24).map((h) => {
                    const hourTime = new Date(h.time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      hour12: true,
                    });
                    return (
                      <div
                        key={h.time}
                        className="flex-shrink-0 w-20 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-center space-y-1.5"
                      >
                        <span className="text-[11px] text-slate-400">{hourTime}</span>
                        <div className="text-sm font-bold text-white">{tempDisplay(h.temp)}</div>
                        <div className="text-[10px] text-sky-400 flex items-center justify-center gap-0.5">
                          <Droplets className="w-2.5 h-2.5" />
                          <span>{h.precipProb}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Spatial Map & Database CRUD Column (Assessment 2) */}
            <div className="space-y-6">
              {/* Interactive OpenStreetMap Embed */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white">Spatial Coordinates Map</h3>
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${weather.location.lat}&mlon=${weather.location.lon}#map=12/${weather.location.lat}/${weather.location.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <span>Full Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="w-full h-52 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                  <iframe
                    title="Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      weather.location.lon - 0.08
                    }%2C${weather.location.lat - 0.08}%2C${weather.location.lon + 0.08}%2C${
                      weather.location.lat + 0.08
                    }&layer=mapnik&marker=${weather.location.lat}%2C${weather.location.lon}`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  OpenStreetMap real-time spatial pin tracking {weather.location.name}.
                </p>
              </div>

              {/* Database CRUD & Persistence Panel (Assessment 2.1) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("favorites")}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        activeTab === "favorites"
                          ? "bg-sky-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Favorites ({favorites.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("history")}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        activeTab === "history"
                          ? "bg-sky-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      History ({history.length})
                    </button>
                  </div>

                  {/* Export Options (Assessment 2.3) */}
                  <div className="flex items-center gap-1">
                    <a
                      href="/api/export?format=json"
                      download
                      title="Export as JSON"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="/api/export?format=csv"
                      download
                      title="Export as CSV"
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                    >
                      CSV
                    </a>
                    <a
                      href="/api/export?format=markdown"
                      download
                      title="Export as Markdown"
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                    >
                      MD
                    </a>
                  </div>
                </div>

                {/* CRUD Favorites List */}
                {activeTab === "favorites" ? (
                  <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {favorites.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        No saved locations yet. Click &quot;Save to Favorites&quot; on any location.
                      </p>
                    ) : (
                      favorites.map((fav) => (
                        <div
                          key={fav.id}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <button
                                onClick={() => fetchWeather(undefined, fav.lat, fav.lon)}
                                className="font-semibold text-xs text-sky-400 hover:underline text-left"
                              >
                                {fav.name}
                              </button>
                              <span className="text-[10px] text-slate-400 ml-1.5">({fav.country})</span>
                              {fav.tag && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300">
                                  {fav.tag}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingId(fav.id);
                                  setEditNote(fav.notes || "");
                                  setEditTag(fav.tag || "General");
                                }}
                                className="p-1 text-slate-400 hover:text-sky-400"
                                title="Edit Note"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFavorite(fav.id)}
                                className="p-1 text-slate-400 hover:text-red-400"
                                title="Delete Favorite"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Editable note section */}
                          {editingId === fav.id ? (
                            <div className="mt-2 space-y-2 pt-2 border-t border-slate-800">
                              <input
                                type="text"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="Edit note..."
                                className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200"
                              />
                              <input
                                type="text"
                                value={editTag}
                                onChange={(e) => setEditTag(e.target.value)}
                                placeholder="Tag..."
                                className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-0.5 text-[10px] bg-slate-800 rounded text-slate-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateFavorite(fav.id)}
                                  className="px-2 py-0.5 text-[10px] bg-sky-500 rounded text-white flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            fav.notes && (
                              <p className="text-[11px] text-slate-400 mt-1 italic">&quot;{fav.notes}&quot;</p>
                            )
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* History Tab */
                  <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-slate-400">Recent SQLite logs</span>
                      <button
                        onClick={() => handleDeleteHistory()}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    {history.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No search history yet.</p>
                    ) : (
                      history.map((h) => (
                        <div
                          key={h.id}
                          className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <button
                              onClick={() => fetchWeather(undefined, h.lat, h.lon)}
                              className="font-medium text-slate-200 hover:text-sky-400 text-left"
                            >
                              {h.location_name}
                            </button>
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              {tempDisplay(h.temp_c)} • {h.condition_text}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteHistory(h.id)}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Save to Favorites Modal */}
      {saveModalOpen && weather && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-sky-400" />
                <span>Save Location to SQLite</span>
              </h3>
              <button onClick={() => setSaveModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Saving <strong className="text-white">{weather.location.name}</strong> ({weather.location.lat.toFixed(2)}, {weather.location.lon.toFixed(2)}) to your local persistent database.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tag / Category</label>
                <input
                  type="text"
                  value={saveTag}
                  onChange={(e) => setSaveTag(e.target.value)}
                  placeholder="e.g. Home, Office, Vacation, Priority"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Personal Note</label>
                <textarea
                  value={saveNote}
                  onChange={(e) => setSaveNote(e.target.value)}
                  placeholder="e.g. Remember to check temperature before morning commute"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFavorite}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
