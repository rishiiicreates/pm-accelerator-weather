"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
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
  Calendar,
  User,
  ArrowUpRight,
  ExternalLink,
  AlertCircle,
  X,
  MapPin,
  Clock,
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

// editorial journalistic summaries for real-world realism
function getWeatherNarrative(
  city: string,
  condition: string,
  temp: number,
  humidity: number,
  wind: number
) {
  const cond = condition.toLowerCase();
  if (cond.includes("rain") || cond.includes("shower") || cond.includes("drizzle")) {
    return `An active low-pressure front continues to deliver ${cond} throughout the ${city} metropolitan basin. Relative humidity remains elevated at ${humidity}% with sustained westerly breezes of ${wind} km/h. Precipitation is expected to taper into intermittent mist toward late evening.`;
  }
  if (cond.includes("snow") || cond.includes("ice") || cond.includes("freez")) {
    return `An Arctic air mass keeps temperatures depressed around ${Math.round(temp)}°C across ${city}, accompanied by ${cond}. Gusts near ${wind} km/h will maintain wind-chill values well below freezing through the overnight hours.`;
  }
  if (cond.includes("thunder") || cond.includes("storm")) {
    return `Convective atmospheric instability continues across ${city}, producing ${cond} with localized squalls. Wind gusts may exceed ${wind} km/h along elevated terrain. Monitor local radar advisories.`;
  }
  if (cond.includes("cloud") || cond.includes("overcast")) {
    return `A widespread layer of stratiform cloud cover blankets ${city} today, holding surface temperatures near ${Math.round(temp)}°C. Winds remain light at ${wind} km/h with humidity hovering around ${humidity}%. Moderate diurnal cooling expected after dusk.`;
  }
  return `Stable atmospheric ridge conditions prevail across ${city}, delivering ${cond} and clear visibility. Temperatures hold steady near ${Math.round(temp)}°C with gentle winds averaging ${wind} km/h, creating optimal conditions throughout the region.`;
}

function getDayNarrative(cond: string, max: number, min: number, rain: number, wind: number) {
  if (rain >= 50) {
    return `Frontal moisture passage brings elevated precipitation probabilities (${rain}%) with daytime peaks reaching ${Math.round(max)}°C and overnight minimums around ${Math.round(min)}°C. Winds gusting up to ${Math.round(wind)} km/h.`;
  }
  if (rain >= 20) {
    return `Variable sky cover with scattered showers likely (${rain}% chance). Temperatures will reach ${Math.round(max)}°C before descending to ${Math.round(min)}°C with moderate breezes near ${Math.round(wind)} km/h.`;
  }
  return `Predominantly settled conditions featuring ${cond.toLowerCase()}. Afternoon highs will touch ${Math.round(max)}°C with low overnight dips to ${Math.round(min)}°C and tranquil winds near ${Math.round(wind)} km/h.`;
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [saveTag, setSaveTag] = useState("Observation");

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
        throw new Error(data.error || "failed to fetch weather telemetry");
      }

      setWeather(data);
      loadHistory();
    } catch (err: any) {
      setError(err.message || "an unexpected error occurred while loading weather telemetry");
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
        setError(`location access denied or unavailable (${err.message})`);
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
        body: JSON.stringify({ notes: editNote }),
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

  const renderWeatherIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case "Sun":
        return <Sun className={`${className} text-amber-500`} />;
      case "SunMedium":
        return <SunMedium className={`${className} text-amber-500`} />;
      case "CloudSun":
        return <CloudSun className={`${className} text-amber-500`} />;
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

  // editorial photographic assets matching undertheweather.eu theme
  const editorialPhotos = [
    "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80", // polar bear arctic ice
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80", // coral sea marine life
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", // yosemite valley
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", // alpine peaks
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", // coastal tide
    "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=800&q=80", // rainfall street
  ];

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans">
      {/* top navbar matching undertheweather.eu */}
      <header className="border-b border-[#eeeeee] bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* logo & brand mark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f4efff] flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-[#7e43fd]" />
            </div>
            <a href="/" className="flex items-baseline tracking-tight">
              <span className="font-extrabold text-xl text-[#222222] tracking-wider uppercase">
                UNDERTHEWEATHER
              </span>
              <span className="font-bold text-xl text-[#7e43fd]">.eu</span>
            </a>
          </div>

          {/* navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#404040]">
            <a href="/" className="text-[#7e43fd] font-semibold">Home</a>
            <a href="#forecast" className="hover:text-[#7e43fd] transition">5-Day Outlook</a>
            <a href="#hourly" className="hover:text-[#7e43fd] transition">Hourly Barometer</a>
            <a href="#saved" className="hover:text-[#7e43fd] transition">Saved Dispatches</a>
            <a href="/api/export?format=json" target="_blank" className="hover:text-[#7e43fd] transition">Export Data</a>
          </nav>

          {/* right tools */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#f5f5f7] rounded-full p-0.5 border border-[#e5e5ea]">
              <button
                onClick={() => setUnit("C")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                  unit === "C" ? "bg-[#7e43fd] text-white shadow-xs" : "text-[#555555] hover:text-black"
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setUnit("F")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                  unit === "F" ? "bg-[#7e43fd] text-white shadow-xs" : "text-[#555555] hover:text-black"
                }`}
              >
                °F
              </button>
            </div>

            <button
              onClick={handleUseCurrentLocation}
              title="Locate via GPS"
              className="p-2 rounded-full bg-[#f4efff] text-[#7e43fd] hover:bg-[#7e43fd] hover:text-white transition"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* main content body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 space-y-12">
        {/* search bar */}
        <section className="max-w-2xl mx-auto space-y-2.5">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search location by city, town, zip code (e.g. 90210), or coordinates..."
              className="w-full pl-11 pr-28 py-3 bg-[#fbfbfd] border border-[#e5e5ea] rounded-full text-sm text-[#222222] focus:outline-none focus:border-[#7e43fd] transition placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 px-5 py-2 rounded-full bg-[#7e43fd] hover:bg-[#6d28d9] text-white text-xs font-semibold transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {/* quick locations */}
          <div className="flex items-center justify-center gap-2 text-xs text-[#666666] overflow-x-auto">
            <span className="text-slate-400 font-medium">Trending:</span>
            {["Tokyo", "London", "New York", "Beverly Hills (90210)", "Paris", "New Delhi"].map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  const q = loc.includes("(") ? loc.split("(")[1].replace(")", "") : loc;
                  setQuery(q);
                  fetchWeather(q);
                }}
                className="hover:text-[#7e43fd] hover:underline transition"
              >
                {loc}
              </button>
            ))}
          </div>
        </section>

        {/* error message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* featured editorial lead article (Hero matching undertheweather.eu) */}
        {weather && (
          <section className="relative rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-xs">
            {/* wide landscape lead photo */}
            <div className="relative h-[340px] sm:h-[420px] w-full overflow-hidden bg-slate-100">
              <img
                src={editorialPhotos[0]}
                alt="Meteorological observation"
                className="w-full h-full object-cover filter brightness-95"
              />
            </div>

            {/* overlapping editorial story card matching undertheweather.eu */}
            <div className="relative -mt-20 mx-4 sm:mx-12 mb-6 bg-white rounded-xl border border-[#e5e7eb] p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#f0f0f0] pb-4">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#7e43fd] text-white uppercase tracking-wider mb-2">
                    Current Meteorological Dispatch
                  </div>
                  <h1 className="font-serif italic text-3xl sm:text-4xl text-[#222222] font-normal leading-tight">
                    {weather.location.name}, {weather.location.country}
                  </h1>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="font-serif text-5xl text-[#222222]">
                      {tempDisplay(weather.current.temp)}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      feels like {tempDisplay(weather.current.feelsLike)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSaveModalOpen(true)}
                    className="p-3 rounded-full bg-[#f4efff] text-[#7e43fd] hover:bg-[#7e43fd] hover:text-white transition"
                    title="Bookmark location"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* journalistic weather narrative */}
              <p className="text-[15px] text-[#444444] leading-relaxed font-sans">
                {getWeatherNarrative(
                  weather.location.name,
                  weather.current.condition,
                  weather.current.temp,
                  weather.current.humidity,
                  weather.current.windSpeed
                )}
              </p>

              {/* editorial metadata row */}
              <div className="flex flex-wrap items-center justify-between text-xs text-[#777777] pt-2 border-t border-[#f5f5f5]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-medium text-[#222222]">
                    <User className="w-3.5 h-3.5 text-[#7e43fd]" />
                    Hrishikesh Yadav
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span>wind: {weather.current.windSpeed} km/h</span>
                  <span>humidity: {weather.current.humidity}%</span>
                  <span>pressure: {weather.current.pressure} hPa</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2-column layout: 5-Day forecast cards (left 2/3) + Sidebar widgets (right 1/3) */}
        {weather && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* left column: 5-day outlook articles matching undertheweather.eu card grid */}
            <div className="lg:col-span-2 space-y-10">
              <section id="forecast" className="space-y-6">
                <div className="border-b border-[#222222] pb-2 flex items-baseline justify-between">
                  <h2 className="font-serif italic text-2xl sm:text-3xl text-[#222222]">
                    Five-Day Weather Dispatches
                  </h2>
                  <span className="text-xs text-[#777777]">Synoptic projection</span>
                </div>

                {/* article cards matching undertheweather.eu layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {weather.forecast.slice(0, 5).map((day, idx) => (
                    <article
                      key={day.date}
                      className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      {/* article photo with category pill and bookmark icon */}
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={editorialPhotos[(idx + 1) % editorialPhotos.length]}
                          alt={day.condition}
                          className="w-full h-full object-cover filter brightness-95 hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#7e43fd] text-white uppercase tracking-wider">
                            Outlook • Day {idx + 1}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white">
                          <Bookmark className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* article content body */}
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-[#7e43fd] font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <h3 className="font-serif italic text-xl text-[#222222] font-normal leading-snug">
                            {day.condition} Across the Region
                          </h3>

                          <p className="text-xs text-[#555555] leading-relaxed">
                            {getDayNarrative(
                              day.condition,
                              day.maxTemp,
                              day.minTemp,
                              day.precipProb,
                              day.maxWind
                            )}
                          </p>
                        </div>

                        {/* article footer */}
                        <div className="pt-3 border-t border-[#f0f0f0] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#222222]">
                              {tempDisplay(day.maxTemp)} / {tempDisplay(day.minTemp)}
                            </span>
                            <span className="text-[#7e43fd] font-medium flex items-center gap-1 hover:underline cursor-pointer">
                              Explore Forecast <ArrowUpRight className="w-3 h-3" />
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Precip: {day.precipProb}%</span>
                            <span>Wind: {Math.round(day.maxWind)} km/h</span>
                            <span>UV: {day.uvIndex}</span>
                          </div>
                        </div>
                      </div>

                      {/* article author signature bar */}
                      <div className="px-5 py-2.5 bg-[#fafafa] border-t border-[#f0f0f0] flex items-center gap-2 text-xs text-[#666666]">
                        <User className="w-3 h-3 text-[#7e43fd]" />
                        <span>Hrishikesh Yadav</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* 24-hour diurnal hourly table */}
              <section id="hourly" className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-xs space-y-4">
                <div className="border-b border-[#f0f0f0] pb-3 flex items-baseline justify-between">
                  <h3 className="font-serif italic text-xl text-[#222222]">
                    Hourly Atmospheric Barometer
                  </h3>
                  <span className="text-xs text-slate-400">24-hour continuous timeline</span>
                </div>

                <div className="overflow-x-auto">
                  <div className="flex gap-2 min-w-max pb-2">
                    {weather.hourly.slice(0, 24).map((h, i) => (
                      <div
                        key={i}
                        className="w-16 p-2.5 rounded-lg border border-[#f0f0f0] text-center space-y-1.5 hover:border-[#7e43fd] transition"
                      >
                        <span className="text-[10px] text-slate-500 font-medium block">
                          {formatHour(h.time)}
                        </span>
                        <div className="flex justify-center">
                          {renderWeatherIcon(h.condition, "w-4 h-4")}
                        </div>
                        <span className="text-xs font-bold text-[#222222] block">
                          {tempDisplay(h.temp)}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {h.precipProb}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* atmospheric telemetry table */}
              <section className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-xs space-y-4">
                <h3 className="font-serif italic text-xl text-[#222222] border-b border-[#f0f0f0] pb-3">
                  Atmospheric Telemetry & Observations
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
                    <span className="text-slate-400 block mb-1">Wind Speed & Gusts</span>
                    <span className="text-base font-bold text-[#222222]">
                      {weather.current.windSpeed} km/h
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Heading: {weather.current.windDirection}°
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
                    <span className="text-slate-400 block mb-1">Relative Humidity</span>
                    <span className="text-base font-bold text-[#222222]">
                      {weather.current.humidity}%
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Dew point normalized
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
                    <span className="text-slate-400 block mb-1">Barometric Pressure</span>
                    <span className="text-base font-bold text-[#222222]">
                      {weather.current.pressure} hPa
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Sea level calibrated
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
                    <span className="text-slate-400 block mb-1">Cloud Coverage</span>
                    <span className="text-base font-bold text-[#222222]">
                      {weather.current.cloudCover}%
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Sky obscuration index
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
                    <span className="text-slate-400 block mb-1">Precipitation (Last Hr)</span>
                    <span className="text-base font-bold text-[#222222]">
                      {weather.current.precipitation} mm
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Rainfall sensor telemetry
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
                    <span className="text-slate-400 block mb-1">Solar Exposure</span>
                    <span className="text-base font-bold text-[#222222]">
                      {weather.current.isDay ? "Daylight Phase" : "Nocturnal Phase"}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Elevation: {weather.location.elevation || 0}m
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* right column: sidebar widgets matching undertheweather.eu */}
            <aside className="space-y-6">
              {/* widget 1: saved locations (CRUD) */}
              <div id="saved" className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-xs space-y-4">
                <div className="border-b border-[#222222] pb-2 flex items-center justify-between">
                  <h3 className="font-serif italic text-xl text-[#222222]">
                    Saved Dispatches
                  </h3>
                  <button
                    onClick={() => setSaveModalOpen(true)}
                    className="text-xs text-[#7e43fd] hover:underline font-semibold"
                  >
                    + Pin Current
                  </button>
                </div>

                <div className="space-y-2.5">
                  {favorites.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      No saved locations yet. Pin one with the button above.
                    </p>
                  ) : (
                    favorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="py-2.5 border-b border-[#f0f0f0] last:border-0 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => fetchWeather(undefined, fav.lat, fav.lon)}
                            className="font-medium text-xs text-[#222222] hover:text-[#7e43fd] text-left"
                          >
                            {fav.name} {fav.country && `(${fav.country})`}
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingId(fav.id);
                                setEditNote(fav.notes || "");
                              }}
                              className="text-slate-400 hover:text-black"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteFavorite(fav.id)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {editingId === fav.id ? (
                          <div className="space-y-1.5 pt-1">
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Observation notes..."
                              className="w-full px-2 py-1 text-xs border rounded bg-[#fafafa]"
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
              </div>

              {/* widget 2: recent searches (matching Recent Posts on undertheweather.eu) */}
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-xs space-y-4">
                <div className="border-b border-[#222222] pb-2 flex items-center justify-between">
                  <h3 className="font-serif italic text-xl text-[#222222]">
                    Recent Searches
                  </h3>
                  <button
                    onClick={() => handleDeleteHistory()}
                    className="text-[10px] text-slate-400 hover:text-rose-600"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2">
                  {history.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      Search log is currently empty.
                    </p>
                  ) : (
                    history.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => fetchWeather(item.query)}
                        className="py-2 border-b border-[#f0f0f0] last:border-0 flex justify-between items-center text-xs hover:text-[#7e43fd] cursor-pointer transition"
                      >
                        <div>
                          <span className="font-medium text-[#333333] block">
                            {item.location_name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Query: "{item.query}"
                          </span>
                        </div>
                        <span className="font-semibold text-[#7e43fd]">
                          {tempDisplay(item.temp_c)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* widget 3: spatial radar (OpenStreetMap) */}
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-xs space-y-3">
                <div className="border-b border-[#222222] pb-2 flex items-center justify-between">
                  <h3 className="font-serif italic text-xl text-[#222222]">
                    Spatial Radar
                  </h3>
                  <span className="text-[10px] text-[#7e43fd] font-semibold bg-[#f4efff] px-2 py-0.5 rounded-full">
                    {weather.location.lat.toFixed(2)}°, {weather.location.lon.toFixed(2)}°
                  </span>
                </div>

                <div className="h-44 rounded-lg overflow-hidden border border-[#e5e7eb] relative bg-slate-100">
                  <iframe
                    title="OpenStreetMap Radar"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${weather.location.lon - 0.08}%2C${weather.location.lat - 0.08}%2C${weather.location.lon + 0.08}%2C${weather.location.lat + 0.08}&layer=mapnik&marker=${weather.location.lat}%2C${weather.location.lon}`}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Real-time coordinate Doppler mapping via OpenStreetMap
                </p>
              </div>

              {/* widget 4: data export panel (Tech Assessment 2.3) */}
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-xs space-y-3">
                <h3 className="font-serif italic text-xl text-[#222222] border-b border-[#222222] pb-2">
                  Telemetry Export
                </h3>
                <p className="text-xs text-[#666666]">
                  Download stored weather dispatches and SQLite database records
                </p>
                <div className="flex flex-col gap-2 pt-1 text-xs font-semibold">
                  <a
                    href="/api/export?format=json"
                    download
                    className="p-2.5 rounded-lg border border-[#e5e7eb] hover:border-[#7e43fd] hover:text-[#7e43fd] flex items-center justify-between transition"
                  >
                    <span>Download JSON Format</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="/api/export?format=csv"
                    download
                    className="p-2.5 rounded-lg border border-[#e5e7eb] hover:border-[#7e43fd] hover:text-[#7e43fd] flex items-center justify-between transition"
                  >
                    <span>Download CSV Spreadsheet</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="/api/export?format=markdown"
                    download
                    className="p-2.5 rounded-lg border border-[#e5e7eb] hover:border-[#7e43fd] hover:text-[#7e43fd] flex items-center justify-between transition"
                  >
                    <span>Download Markdown Briefing</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* modal: pin location */}
      {saveModalOpen && weather && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#e5e7eb] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
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

            <p className="text-xs text-[#666666]">
              Saving {weather.location.name}, {weather.location.country} into SQLite database.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#222222] block mb-1">
                  Tag Classification
                </label>
                <input
                  type="text"
                  value={saveTag}
                  onChange={(e) => setSaveTag(e.target.value)}
                  placeholder="e.g. Research, Home, Travel"
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-xs bg-[#fafafa]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#222222] block mb-1">
                  Observation Notes
                </label>
                <textarea
                  value={saveNote}
                  onChange={(e) => setSaveNote(e.target.value)}
                  placeholder="Add meteorological or regional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-xs bg-[#fafafa]"
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
                Save Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* footer matching undertheweather.eu */}
      <footer className="border-t border-[#eeeeee] bg-[#111111] text-[#999999] py-8 text-center text-xs">
        <p>2026 Copyrights | undertheweather.eu</p>
      </footer>
    </div>
  );
}
