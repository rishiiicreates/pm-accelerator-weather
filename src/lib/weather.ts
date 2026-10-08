export interface WeatherCodeInfo {
  description: string;
  icon: string;
}

export function getWeatherCondition(code: number): WeatherCodeInfo {
  switch (code) {
    case 0:
      return { description: "Clear sky", icon: "Sun" };
    case 1:
      return { description: "Mainly clear", icon: "SunMedium" };
    case 2:
      return { description: "Partly cloudy", icon: "CloudSun" };
    case 3:
      return { description: "Overcast", icon: "Cloud" };
    case 45:
    case 48:
      return { description: "Foggy", icon: "CloudFog" };
    case 51:
    case 53:
    case 55:
      return { description: "Drizzle", icon: "CloudDrizzle" };
    case 56:
    case 57:
      return { description: "Freezing Drizzle", icon: "CloudSnow" };
    case 61:
      return { description: "Slight Rain", icon: "CloudRain" };
    case 63:
      return { description: "Moderate Rain", icon: "CloudRain" };
    case 65:
      return { description: "Heavy Rain", icon: "CloudRain" };
    case 66:
    case 67:
      return { description: "Freezing Rain", icon: "CloudSnow" };
    case 71:
    case 73:
    case 75:
      return { description: "Snowfall", icon: "Snowflake" };
    case 77:
      return { description: "Snow grains", icon: "Snowflake" };
    case 80:
    case 81:
    case 82:
      return { description: "Rain showers", icon: "CloudRain" };
    case 85:
    case 86:
      return { description: "Snow showers", icon: "Snowflake" };
    case 95:
      return { description: "Thunderstorm", icon: "CloudLightning" };
    case 96:
    case 99:
      return { description: "Thunderstorm with Hail", icon: "CloudLightning" };
    default:
      return { description: "Variable Conditions", icon: "Cloud" };
  }
}

export interface GeocodingResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export async function geocodeLocation(query: string): Promise<GeocodingResult | null> {
  const trimmed = query.trim();

  // direct gps coords regex check
  const coordRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  if (coordRegex.test(trimmed)) {
    const [latStr, lonStr] = trimmed.split(",").map((s) => s.trim());
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    return {
      name: `Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      country: "GPS Target",
      latitude: lat,
      longitude: lon,
    };
  }

  // open-meteo geocoding lookup
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=5&language=en&format=json`;

    const res = await fetch(geoUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`Geocoding HTTP error: ${res.status}`);
    }

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const top = data.results[0];
      return {
        name: top.name,
        country: top.country || "",
        admin1: top.admin1 || "",
        latitude: top.latitude,
        longitude: top.longitude,
        timezone: top.timezone,
      };
    }
  } catch (err) {
    console.error("Open-Meteo geocoding error:", err);
  }

  // fallback to nominatim for zip codes or postal areas
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&limit=1`;
    const res = await fetch(nominatimUrl, {
      headers: { "User-Agent": "PMAccelerator-WeatherApp/1.0" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const top = data[0];
        const parts = top.display_name.split(",");
        const name = parts[0]?.trim() || trimmed;
        const country = parts[parts.length - 1]?.trim() || "";
        return {
          name,
          country,
          latitude: parseFloat(top.lat),
          longitude: parseFloat(top.lon),
        };
      }
    }
  } catch (err) {
    console.error("Nominatim fallback error:", err);
  }

  return null;
}
