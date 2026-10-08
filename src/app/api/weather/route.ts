import { NextRequest, NextResponse } from "next/server";
import { geocodeLocation, getWeatherCondition } from "../../../lib/weather";
import { recordHistory } from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");

    let lat: number;
    let lon: number;
    let locationName = "";
    let countryName = "";

    if (latParam && lonParam) {
      lat = parseFloat(latParam);
      lon = parseFloat(lonParam);
      if (isNaN(lat) || isNaN(lon)) {
        return NextResponse.json(
          { error: "Invalid coordinate values provided." },
          { status: 400 }
        );
      }
      locationName = `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
      countryName = "Current Coordinates";
    } else if (query) {
      const geo = await geocodeLocation(query);
      if (!geo) {
        return NextResponse.json(
          {
            error: `Unable to locate "${query}". Please check spelling or try a city, zip code, or "lat, lon" coordinates.`,
          },
          { status: 404 }
        );
      }
      lat = geo.latitude;
      lon = geo.longitude;
      locationName = geo.name;
      countryName = geo.country;
    } else {
      return NextResponse.json(
        { error: "Please provide a query (q) or latitude and longitude (lat, lon)." },
        { status: 400 }
      );
    }

    // query open-meteo forecast api
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

    const weatherRes = await fetch(weatherUrl, { next: { revalidate: 600 } });
    if (!weatherRes.ok) {
      throw new Error(`Weather service returned HTTP ${weatherRes.status}`);
    }

    const data = await weatherRes.json();
    const currentCode = data.current?.weather_code ?? 0;
    const condition = getWeatherCondition(currentCode);

    // 5-day daily forecast payload
    const daily = data.daily || {};
    const forecast = [];
    const dailyLength = Math.min(daily.time?.length || 0, 7);
    for (let i = 0; i < dailyLength; i++) {
      const dayCode = daily.weather_code?.[i] ?? 0;
      const dayCond = getWeatherCondition(dayCode);
      forecast.push({
        date: daily.time?.[i],
        maxTemp: daily.temperature_2m_max?.[i],
        minTemp: daily.temperature_2m_min?.[i],
        apparentMax: daily.apparent_temperature_max?.[i],
        apparentMin: daily.apparent_temperature_min?.[i],
        precipSum: daily.precipitation_sum?.[i] || 0,
        precipProb: daily.precipitation_probability_max?.[i] || 0,
        uvIndex: daily.uv_index_max?.[i],
        maxWind: daily.wind_speed_10m_max?.[i],
        weatherCode: dayCode,
        condition: dayCond.description,
        icon: dayCond.icon,
        sunrise: daily.sunrise?.[i],
        sunset: daily.sunset?.[i],
      });
    }

    // 24 hour slice
    const hourly = data.hourly || {};
    const hourlyForecast = [];
    const hourlyLength = Math.min(hourly.time?.length || 0, 24);
    for (let i = 0; i < hourlyLength; i++) {
      const hCode = hourly.weather_code?.[i] ?? 0;
      hourlyForecast.push({
        time: hourly.time?.[i],
        temp: hourly.temperature_2m?.[i],
        humidity: hourly.relative_humidity_2m?.[i],
        precipProb: hourly.precipitation_probability?.[i] || 0,
        weatherCode: hCode,
        condition: getWeatherCondition(hCode).description,
      });
    }

    const result = {
      location: {
        name: locationName,
        country: countryName,
        lat,
        lon,
        timezone: data.timezone,
        elevation: data.elevation,
      },
      current: {
        temp: data.current?.temperature_2m,
        feelsLike: data.current?.apparent_temperature,
        humidity: data.current?.relative_humidity_2m,
        windSpeed: data.current?.wind_speed_10m,
        windDirection: data.current?.wind_direction_10m,
        pressure: data.current?.pressure_msl || data.current?.surface_pressure,
        precipitation: data.current?.precipitation || 0,
        cloudCover: data.current?.cloud_cover,
        isDay: data.current?.is_day === 1,
        weatherCode: currentCode,
        condition: condition.description,
        icon: condition.icon,
        time: data.current?.time,
      },
      forecast,
      hourly: hourlyForecast,
    };

    // log query in search history table
    try {
      recordHistory({
        query: query || `${lat.toFixed(2)},${lon.toFixed(2)}`,
        location_name: locationName,
        country: countryName,
        lat,
        lon,
        temp_c: result.current.temp,
        condition_text: condition.description,
      });
    } catch (dbErr) {
      console.error("Failed to record history:", dbErr);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Weather route error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve real-time weather information. Please check connection and try again.",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
