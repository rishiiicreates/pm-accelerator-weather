# PM Accelerator - Weather Intelligence Platform

> **Technical Assessment Submission for AI Engineer Intern (Full-Stack Track)**  
> **Candidate:** Hrishikesh Yadav ([GitHub](https://github.com/rishiiicreates) | [LinkedIn](https://www.linkedin.com/in/rishiicreates))  
> **Status:** Full-Stack Complete (Assessments #1 & #2)

---

## PM Accelerator Mission
> *"The Product Manager Accelerator Community is designed to support PM & AI professionals through every stage of their careers, from students looking for entry-level jobs to Director & VP-level PM leaders."*

---

## Overview

The **Weather Intelligence Platform** is a production-grade full-stack web application engineered to solve real-world location-based weather analysis. It combines autonomous location ingestion, real-time meteorological API integration, organized 5-day and 24-hour predictive forecasting, interactive spatial mapping, persistent SQLite CRUD operations, and multi-format data export (JSON, CSV, Markdown).

### Core Highlights & Requirements Coverage

| Requirement | Implementation & Tech Architecture |
|---|---|
| **Tech Assessment #1: Responsive Frontend** | Next.js 15 App Router, React 18, TypeScript, Tailwind CSS with mobile-first grid and dark-mode aesthetic. Adapts across smartphones, tablets, and desktops. |
| **Autonomous Location Ingestion** | Handles City names, Towns, Zip/Postal codes (e.g. `90210`), Direct GPS Coordinates (e.g. `40.71, -74.01`), and Landmarks with Open-Meteo & Nominatim fallbacks. |
| **Geolocation GPS** | Native HTML5 `navigator.geolocation` with immediate real-time weather retrieval for the user's live coordinates. |
| **5-Day Organized Forecast (1.1)** | Daily temperature cards displaying maximum/minimum projections, rain probability (%), UV index, max wind speed, and meteorological condition icons. |
| **Hourly Weather Trends** | 24-hour horizontal forecast slider tracking diurnal temperature shifts and precipitation chances. |
| **Error Handling (1.2)** | Graceful UI alert banners for nonexistent locations, network timeouts, GPS permission denials, and malformed inputs with corrective suggestions. |
| **Tech Assessment #2: SQLite CRUD (2.1)** | Server-side persistence using native Node.js `DatabaseSync` SQLite engine. Full Create, Read, Update, and Delete endpoints for saved locations and search logs. |
| **Additional API & Spatial Mapping (2.2)** | Integrated OpenStreetMap spatial coordinate mapping with dynamic bounding-box marker tracking. |
| **Data Export (2.3)** | Dedicated `/api/export` endpoint enabling one-click downloads in **JSON**, **CSV**, and **Markdown** formats. |

---

## Technical Architecture

```
                          ┌─────────────────────────────────────┐
                          │         Client Application          │
                          │   Next.js 15 (React 18, Tailwind)   │
                          └──────────────────┬──────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          ┌─────────────────────────┐                 ┌─────────────────────────┐
          │     Weather Engine      │                 │    SQLite CRUD Engine   │
          │      /api/weather       │                 │  /api/favorites & hist  │
          └────────────┬────────────┘                 └────────────┬────────────┘
                       │                                           │
         ┌─────────────┴─────────────┐                             ▼
         ▼                           ▼                 ┌───────────────────────┐
┌─────────────────┐         ┌─────────────────┐        │   data/weather.sqlite │
│   Open-Meteo    │         │   Nominatim /   │        │   (Native SQLite)     │
│  Forecast API   │         │ OpenStreetMap   │        └───────────────────────┘
└─────────────────┘         └─────────────────┘
```

---

## API Documentation

### 1. Weather Retrieval
- **`GET /api/weather?q={query}`**: Resolves cities, postal codes, landmarks, or GPS strings.
- **`GET /api/weather?lat={latitude}&lon={longitude}`**: Direct coordinate retrieval.
- **Response**: Current metrics (temp, feels like, humidity, wind, pressure, UV), 5-day daily forecast, and 24-hour hourly trend.

### 2. Favorites CRUD Operations
- **`GET /api/favorites`**: Retrieve all saved locations.
- **`POST /api/favorites`**: Create new favorite (`name`, `country`, `lat`, `lon`, `notes`, `tag`).
- **`PUT /api/favorites/:id`**: Update custom notes or tags for a saved location.
- **`DELETE /api/favorites/:id`**: Remove a location from persistent storage.

### 3. Search History
- **`GET /api/history`**: Retrieve recent search logs with timestamp and temperature snapshot.
- **`DELETE /api/history?id={id}`**: Delete specific history item.
- **`DELETE /api/history`**: Clear all search history.

### 4. Data Export
- **`GET /api/export?format=json`**: Full structured JSON export of favorites and search logs.
- **`GET /api/export?format=csv`**: RFC-compliant CSV export for spreadsheet analysis.
- **`GET /api/export?format=markdown`**: Formatted Markdown tables export ready for documentation.

---

## Local Development & Setup

### Prerequisites
- Node.js >= 18.x (tested on Node.js 26)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/rishiiicreates/pm-accelerator-weather.git
cd pm-accelerator-weather

# Install dependencies
npm install

# Run the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## Responsive Design Highlights
- **Fluid Layout**: Dynamic Tailwind CSS flex and CSS Grid structures adapting seamlessly between mobile (< 640px), tablet (640px - 1024px), and desktop (> 1024px) viewports.
- **Touch-Friendly**: Tap targets with high-contrast active states for touch devices.
- **Optimized Rendering**: Zero external CSS bloat; lightning-fast initial load (< 110 kB First Load JS).

---

## License
MIT License. Open-source contribution for PM Accelerator Technical Evaluation.
