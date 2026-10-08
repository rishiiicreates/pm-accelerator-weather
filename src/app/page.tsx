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
  ArrowUp,
  Calendar,
  User,
  SlidersHorizontal,
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

  // favorites and search history state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"favorites" | "history">("favorites");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editTag, setEditTag] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [saveTag, setSaveTag] = useState("Research");

  // initial weather and list load
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
        throw new Error(data.error || "failed to fetch weather data");
      }

      setWeather(data);
      loadHistory();
    } catch (err: any) {
      setError(err.message || "an unexpected error occurred while loading weather data");
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
      setError("geolocation is not supported by your browser");
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
        setError(`location access denied or unavailable (${err.message}). please search manually`);
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

  // add current location to favorites
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

  // update favorite note
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

  // remove favorite item
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

  // clear single or all history rows
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

  const formatHour = (t: string) => {
    if (!t) return "";
    const timePart = t.includes("T") ? t.split("T")[1] : t;
    return timePart.slice(0, 5);
  };

  const renderWeatherIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "Sun":
        return <Sun className={`${className} text-amber-500`} />;
      case "SunMedium":
        return <SunMedium className={`${className} text-amber-500`} />;
      case "CloudSun":
        return <CloudSun className={`${className} text-amber-400`} />;
      case "Cloud":
        return <Cloud className={`${className} text-slate-500`} />;
      case "CloudFog":
        return <CloudFog className={`${className} text-slate-400`} />;
      case "CloudDrizzle":
        return <CloudDrizzle className={`${className} text-[#7e43fd]`} />;
      case "CloudRain":
        return <CloudRain className={`${className} text-[#7e43fd]`} />;
      case "CloudSnow":
      case "Snowflake":
        return <CloudSnow className={`${className} text-sky-400`} />;
      case "CloudLightning":
        return <CloudLightning className={`${className} text-purple-600`} />;
      default:
        return <Sun className={`${className} text-amber-500`} />;
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // select atmospheric photography based on current weather condition
  const getHeroBackdropImage = () => {
    if (!weather) return "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1600&q=80";
    const cond = weather.current.condition.toLowerCase();
    if (cond.includes("snow") || cond.includes("ice") || cond.includes("freez")) {
      return "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1600&q=80";
    }
    if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) {
      return "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1600&q=80";
    }
    if (cond.includes("thunder") || cond.includes("storm")) {
      return "https://images.unsplash.com/photo-1513069020900-a162c4db0762?auto=format&fit=crop&w=1600&q=80";
    }
    if (cond.includes("cloud") || cond.includes("overcast")) {
      return "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1600&q=80";
    }
    // clear / sunny / default majestic nature
    return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80";
  };

  const getDayPhoto = (index: number) => {
    const photos = [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    ];
    return photos[index % photos.length];
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-[#222222] pb-24 font-sans">
      {/* top navbar matching undertheweather.eu */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* logo & brand mark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f3eeff] flex items-center justify-center border border-[#e9dcff]">
              <Thermometer className="w-5 h-5 text-[#7e43fd]" />
            </div>
            <a href="/" className="flex items-baseline tracking-tight hover:opacity-90 transition">
              <span className="font-extrabold text-xl text-[#1e1b4b] tracking-wider uppercase">
                UNDERTHEWEATHER
              </span>
              <span className="font-bold text-xl text-[#7e43fd]">.eu</span>
            </a>
          </div>

          {/* navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#404040]">
            <a href="/" className="text-[#7e43fd] font-semibold">Home</a>
            <a href="#forecast" className="hover:text-[#7e43fd] transition">Forecast</a>
            <a href="#radar" className="hover:text-[#7e43fd] transition">Radar Map</a>
            <a href="#dispatches" className="hover:text-[#7e43fd] transition">Saved Dispatches</a>
            <a href="/api/export?format=json" target="_blank" className="hover:text-[#7e43fd] transition">Export Data</a>
          </nav>

          {/* right tools: unit switcher & geolocation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#f1f3f9] rounded-full p-1 border border-slate-200">
              <button
                onClick={() => setUnit("C")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                  unit === "C" ? "bg-[#7e43fd] text-white shadow-sm" : "text-slate-600 hover:text-black"
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setUnit("F")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                  unit === "F" ? "bg-[#7e43fd] text-white shadow-sm" : "text-slate-600 hover:text-black"
                }`}
              >
                °F
              </button>
            </div>

            <button
              onClick={handleUseCurrentLocation}
              title="use current gps coordinates"
              className="p-2.5 rounded-full bg-[#f3eeff] text-[#7e43fd] hover:bg-[#7e43fd] hover:text-white transition border border-[#e9dcff]"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* main content container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
        {/* search and discovery bar */}
        <div className="space-y-3">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search location by city, town, zip code (e.g. 90210), coordinates (40.71, -74.01)..."
                className="w-full pl-12 pr-32 py-3.5 bg-white border border-slate-200 rounded-full text-sm text-[#222222] shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus:outline-none focus:border-[#7e43fd] focus:ring-2 focus:ring-[#7e43fd]/20 transition placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-full bg-[#7e43fd] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {loading ? "loading..." : "Explore"}
              </button>
            </div>
          </form>

          {/* quick suggestion chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-600">
            <span className="text-slate-400 font-medium whitespace-nowrap">Suggested:</span>
            {quickPills.map((pill) => (
              <button
                key={pill.label}
                onClick={() => {
                  setQuery(pill.q);
                  fetchWeather(pill.q);
                }}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-[#7e43fd] hover:text-[#7e43fd] transition whitespace-nowrap shadow-xs"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* error message banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">{error}</p>
              <p className="text-xs text-rose-600 mt-1">
                tip: enter a known city name like "Tokyo", a valid 5-digit US zip code like "90210", or comma-separated coordinates like "40.71, -74.01".
              </p>
            </div>
          </div>
        )}

        {/* hero feature banner matching undertheweather.eu */}
        {weather && (
          <section className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)] bg-slate-900 min-h-[380px] md:min-h-[440px] flex items-end justify-center p-4 sm:p-8">
            {/* dynamic atmospheric photography backdrop */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter brightness-90"
              style={{ backgroundImage: `url(${getHeroBackdropImage()})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

            {/* floating white editorial card overlapping the photography */}
            <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 max-w-4xl w-full border border-slate-100 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-left">
                {/* purple badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#7e43fd] text-white uppercase tracking-wider">
                  <span>Live Meteorological Dispatch</span>
                </div>

                {/* editorial serif headline */}
                <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-[#222222] font-normal tracking-tight">
                  {weather.location.name}
                  {weather.location.country ? `, ${weather.location.country}` : ""}
                </h1>

                {/* metadata row */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#555555]">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="w-3.5 h-3.5 text-[#7e43fd]" />
                    Hrishikesh Yadav
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="font-semibold text-[#7e43fd]">
                    {weather.current.condition}
                  </span>
                </div>
              </div>

              {/* temperature and quick save action */}
              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 shrink-0">
                <div className="text-center md:text-right">
                  <div className="font-serif text-5xl sm:text-6xl text-[#1e1b4b] font-normal tracking-tight">
                    {tempDisplay(weather.current.temp)}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    feels like {tempDisplay(weather.current.feelsLike)} • {weather.current.humidity}% humidity
                  </div>
                </div>

                <button
                  onClick={() => setSaveModalOpen(true)}
                  className="px-4 py-2.5 rounded-full bg-[#7e43fd] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          </section>
        )}

        {/* main 2-column editorial grid matching undertheweather.eu */}
        {weather && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* left column (2 cols): 5-day forecast & hourly telemetry */}
            <div className="lg:col-span-2 space-y-10">
              {/* 5-day forecast cards (Tech Assessment 1.1) */}
              <section id="forecast" className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
                  <h2 className="font-serif italic text-2xl sm:text-3xl text-[#222222]">
                    Five-Day Meteorological Outlook
                  </h2>
                  <span className="text-xs text-slate-500">synoptic projection</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weather.forecast.slice(0, 5).map((day, idx) => (
                    <article
                      key={day.date}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      {/* atmospheric top banner for day card */}
                      <div className="relative h-28 overflow-hidden bg-gradient-to-r from-slate-200 via-indigo-50 to-purple-100">
                        <img
                          src={getDayPhoto(idx)}
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                          className="w-full h-full object-cover filter brightness-90 hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#7e43fd] text-white shadow-xs">
                            {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* card body */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif italic text-lg text-[#222222] leading-snug">
                            {day.condition}
                          </h3>
                          {renderWeatherIcon(day.icon, "w-6 h-6")}
                        </div>

                        <div className="flex items-baseline justify-between pt-1">
                          <div className="text-xl font-bold text-[#1e1b4b]">
                            {tempDisplay(day.maxTemp)}
                            <span className="text-xs font-normal text-slate-400 ml-1.5">
                              / {tempDisplay(day.minTemp)}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-500">
                            rain {day.precipProb}%
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-100 pt-2">
                          <span>wind: {Math.round(day.maxWind)} km/h</span>
                          <span>uv index: {day.uvIndex}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* 24-hour diurnal hourly barometer */}
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif italic text-xl text-[#222222]">
                    Hourly Atmospheric Barometer
                  </h3>
                  <span className="text-xs text-slate-500">24-hour diurnal trend</span>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                  {weather.hourly.slice(0, 24).map((h, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-20 bg-[#f8f9fc] border border-slate-200/80 rounded-xl p-3 text-center space-y-2 hover:border-[#7e43fd] transition"
                    >
                      <span className="text-[11px] font-semibold text-slate-600 block">
                        {formatHour(h.time)}
                      </span>
                      <div className="flex justify-center">
                        <CloudSun className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className="text-sm font-bold text-[#1e1b4b] block">
                        {tempDisplay(h.temp)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {h.precipProb}% rain
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* atmospheric telemetry telemetry grid */}
              <section className="space-y-3">
                <h3 className="font-serif italic text-xl text-[#222222]">
                  Atmospheric Telemetry
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-slate-400 block mb-1">Wind & Direction</span>
                    <span className="text-lg font-bold text-[#222222]">
                      {weather.current.windSpeed} km/h
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      heading {weather.current.windDirection}°
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-slate-400 block mb-1">Relative Humidity</span>
                    <span className="text-lg font-bold text-[#222222]">
                      {weather.current.humidity}%
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">dew point calibrated</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-slate-400 block mb-1">Barometric Pressure</span>
                    <span className="text-lg font-bold text-[#222222]">
                      {weather.current.pressure} hPa
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">sea level normalized</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-slate-400 block mb-1">Cloud Coverage</span>
                    <span className="text-lg font-bold text-[#222222]">
                      {weather.current.cloudCover}%
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">sky obscuration</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-slate-400 block mb-1">Precipitation Accum.</span>
                    <span className="text-lg font-bold text-[#222222]">
                      {weather.current.precipitation} mm
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">last 60 minutes</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <span className="text-xs text-slate-400 block mb-1">Solar Radiation</span>
                    <span className="text-lg font-bold text-[#222222]">
                      {weather.current.isDay ? "Daylight" : "Night"}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">elevation {weather.location.elevation || 0}m</span>
                  </div>
                </div>
              </section>
            </div>

            {/* right column (1 col): sidebar widgets matching undertheweather.eu */}
            <aside className="space-y-6">
              {/* widget 1: interactive spatial radar (OpenStreetMap) */}
              <div id="radar" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-serif italic text-lg text-[#222222]">
                    Spatial Radar
                  </h3>
                  <span className="text-[11px] font-semibold text-[#7e43fd] bg-[#f3eeff] px-2 py-0.5 rounded-full">
                    {weather.location.lat.toFixed(2)}°, {weather.location.lon.toFixed(2)}°
                  </span>
                </div>

                <div className="h-48 rounded-xl overflow-hidden border border-slate-200 relative">
                  <iframe
                    title="OpenStreetMap"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${weather.location.lon - 0.08}%2C${weather.location.lat - 0.08}%2C${weather.location.lon + 0.08}%2C${weather.location.lat + 0.08}&layer=mapnik&marker=${weather.location.lat}%2C${weather.location.lon}`}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  real time spatial mapping via openstreetmap
                </p>
              </div>

              {/* widget 2: saved dispatches & history tabs (CRUD) */}
              <div id="dispatches" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex gap-2 text-xs font-semibold">
                    <button
                      onClick={() => setActiveTab("favorites")}
                      className={`px-3 py-1 rounded-full transition ${
                        activeTab === "favorites"
                          ? "bg-[#7e43fd] text-white"
                          : "text-slate-500 hover:text-black"
                      }`}
                    >
                      Saved ({favorites.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("history")}
                      className={`px-3 py-1 rounded-full transition ${
                        activeTab === "history"
                          ? "bg-[#7e43fd] text-white"
                          : "text-slate-500 hover:text-black"
                      }`}
                    >
                      History ({history.length})
                    </button>
                  </div>

                  <button
                    onClick={() => setSaveModalOpen(true)}
                    className="text-xs text-[#7e43fd] hover:underline font-medium"
                  >
                    + Pin
                  </button>
                </div>

                {activeTab === "favorites" ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {favorites.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        no saved locations yet. click "Save" above to pin one.
                      </p>
                    ) : (
                      favorites.map((fav) => (
                        <div
                          key={fav.id}
                          className="p-3 rounded-xl border border-slate-100 bg-[#fbfbfd] hover:border-slate-300 transition text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => fetchWeather(undefined, fav.lat, fav.lon)}
                              className="font-semibold text-slate-800 hover:text-[#7e43fd] text-left"
                            >
                              {fav.name} {fav.country && `(${fav.country})`}
                            </button>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingId(fav.id);
                                  setEditNote(fav.notes || "");
                                  setEditTag(fav.tag || "General");
                                }}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFavorite(fav.id)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {editingId === fav.id ? (
                            <div className="space-y-2 pt-2 border-t border-slate-200">
                              <input
                                type="text"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="notes..."
                                className="w-full px-2 py-1 text-xs border rounded bg-white"
                              />
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => handleUpdateFavorite(fav.id)}
                                  className="px-2 py-0.5 rounded bg-[#7e43fd] text-white text-[10px]"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            fav.notes && (
                              <p className="text-[11px] text-slate-500 italic">
                                "{fav.notes}"
                              </p>
                            )
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Recent search logs</span>
                      <button
                        onClick={() => handleDeleteHistory()}
                        className="hover:text-rose-500"
                      >
                        Clear All
                      </button>
                    </div>
                    {history.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        history is empty.
                      </p>
                    ) : (
                      history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => fetchWeather(item.query)}
                          className="p-2.5 rounded-xl border border-slate-100 bg-[#fbfbfd] hover:border-slate-300 cursor-pointer flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-medium text-slate-700 block">
                              {item.location_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              query: "{item.query}"
                            </span>
                          </div>
                          <span className="font-bold text-[#7e43fd]">
                            {tempDisplay(item.temp_c)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* widget 3: data export panel (Tech Assessment 2.3) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="font-serif italic text-lg text-[#222222]">
                  Telemetry Export
                </h3>
                <p className="text-xs text-slate-500">
                  download stored weather records and sqlite database entries
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="/api/export?format=json"
                    download
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:border-[#7e43fd] hover:text-[#7e43fd] text-center text-xs font-semibold transition"
                  >
                    JSON
                  </a>
                  <a
                    href="/api/export?format=csv"
                    download
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:border-[#7e43fd] hover:text-[#7e43fd] text-center text-xs font-semibold transition"
                  >
                    CSV
                  </a>
                  <a
                    href="/api/export?format=markdown"
                    download
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:border-[#7e43fd] hover:text-[#7e43fd] text-center text-xs font-semibold transition"
                  >
                    Markdown
                  </a>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* signature purple floating scroll-to-top button matching undertheweather.eu */}
      <button
        onClick={scrollToTop}
        title="Scroll to top"
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[#7e43fd] hover:bg-[#6d28d9] text-white shadow-lg flex items-center justify-center transition hover:scale-105 z-30"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* modal: save to favorites */}
      {saveModalOpen && weather && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif italic text-xl text-[#222222]">
                Pin Location to Dispatches
              </h3>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              saving {weather.location.name}, {weather.location.country} ({weather.location.lat.toFixed(2)}°, {weather.location.lon.toFixed(2)}°) into sqlite database.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Tag
                </label>
                <input
                  type="text"
                  value={saveTag}
                  onChange={(e) => setSaveTag(e.target.value)}
                  placeholder="e.g. Research, Home, Travel"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-[#fbfbfd]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Personal Notes
                </label>
                <textarea
                  value={saveNote}
                  onChange={(e) => setSaveNote(e.target.value)}
                  placeholder="add climate research observations or travel notes..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-[#fbfbfd]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-full border text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFavorite}
                className="px-5 py-2 rounded-full bg-[#7e43fd] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-xs"
              >
                Save to Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* dark sleek footer matching undertheweather.eu */}
      <footer className="mt-20 bg-[#111111] text-[#999999] py-8 text-center text-xs">
        <p>2026 Copyrights | undertheweather.eu • Weather Intelligence Platform by Hrishikesh Yadav</p>
      </footer>
    </div>
  );
}
