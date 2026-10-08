import path from "node:path";
import fs from "node:fs";

// database path with vercel tmp directory support
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    // fallback if directory creation is restricted
  }
}

const DB_PATH = path.join(DATA_DIR, "weather.sqlite");

// in-memory fallback storage in case serverless environment doesn't allow sqlite
let memoryFavorites: FavoriteItem[] = [];
let memoryHistory: HistoryItem[] = [];
let memoryIdCounter = 1;

let dbInstance: any = null;
let useMemoryFallback = false;

// dynamically initialize sqlite or fallback to memory
function getDatabase() {
  if (useMemoryFallback) return null;
  if (dbInstance) return dbInstance;

  try {
    // try importing and initializing node:sqlite
    const { DatabaseSync } = require("node:sqlite");
    dbInstance = new DatabaseSync(DB_PATH);
    initTables(dbInstance);
    return dbInstance;
  } catch (err) {
    // if sqlite is unavailable in serverless environment, switch to in-memory store
    useMemoryFallback = true;
    return null;
  }
}

function initTables(db: any) {
  // favorites table for storing pinned locations
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      notes TEXT DEFAULT '',
      tag TEXT DEFAULT 'General',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // search history log
  db.exec(`
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      location_name TEXT NOT NULL,
      country TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      temp_c REAL NOT NULL,
      condition_text TEXT NOT NULL,
      searched_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export interface FavoriteItem {
  id?: number;
  name: string;
  country: string;
  lat: number;
  lon: number;
  notes?: string;
  tag?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HistoryItem {
  id?: number;
  query: string;
  location_name: string;
  country: string;
  lat: number;
  lon: number;
  temp_c: number;
  condition_text: string;
  searched_at?: string;
}

// read all saved favorites
export function getFavorites(): FavoriteItem[] {
  const db = getDatabase();
  if (!db) {
    return [...memoryFavorites].reverse();
  }
  const stmt = db.prepare("SELECT * FROM favorites ORDER BY id DESC");
  return stmt.all() as unknown as FavoriteItem[];
}

export function getFavoriteById(id: number): FavoriteItem | undefined {
  const db = getDatabase();
  if (!db) {
    return memoryFavorites.find((f) => f.id === id);
  }
  const stmt = db.prepare("SELECT * FROM favorites WHERE id = ?");
  return stmt.get(id) as unknown as FavoriteItem | undefined;
}

// save new favorite
export function createFavorite(item: FavoriteItem): FavoriteItem {
  const db = getDatabase();
  const now = new Date().toISOString();

  if (!db) {
    const newItem: FavoriteItem = {
      ...item,
      id: memoryIdCounter++,
      created_at: now,
      updated_at: now,
    };
    memoryFavorites.push(newItem);
    return newItem;
  }

  const stmt = db.prepare(`
    INSERT INTO favorites (name, country, lat, lon, notes, tag)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(item.name, item.country, item.lat, item.lon, item.notes || "", item.tag || "General");
  
  const lastId = db.prepare("SELECT last_insert_rowid() as id").get() as { id: number };
  return { ...item, id: lastId.id, created_at: now };
}

// update favorite note or tag
export function updateFavorite(id: number, data: Partial<FavoriteItem>): boolean {
  const db = getDatabase();
  const existing = getFavoriteById(id);
  if (!existing) return false;

  const notes = (data.notes !== undefined ? data.notes : existing.notes) ?? "";
  const tag = (data.tag !== undefined ? data.tag : existing.tag) ?? "General";
  const name = (data.name !== undefined ? data.name : existing.name) ?? "";

  if (!db) {
    existing.name = name;
    existing.notes = notes;
    existing.tag = tag;
    existing.updated_at = new Date().toISOString();
    return true;
  }

  const stmt = db.prepare(`
    UPDATE favorites
    SET name = ?, notes = ?, tag = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(name, notes, tag, id);
  return true;
}

// remove favorite
export function deleteFavorite(id: number): boolean {
  const db = getDatabase();
  if (!db) {
    const prevLen = memoryFavorites.length;
    memoryFavorites = memoryFavorites.filter((f) => f.id !== id);
    return memoryFavorites.length < prevLen;
  }
  const stmt = db.prepare("DELETE FROM favorites WHERE id = ?");
  stmt.run(id);
  return true;
}

// log query to search history
export function recordHistory(item: HistoryItem): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  if (!db) {
    memoryHistory.push({
      ...item,
      id: memoryHistory.length + 1,
      searched_at: now,
    });
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO search_history (query, location_name, country, lat, lon, temp_c, condition_text)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(item.query, item.location_name, item.country, item.lat, item.lon, item.temp_c, item.condition_text);
}

// get recent queries
export function getHistory(limit = 25): HistoryItem[] {
  const db = getDatabase();
  if (!db) {
    return [...memoryHistory].reverse().slice(0, limit);
  }
  const stmt = db.prepare("SELECT * FROM search_history ORDER BY id DESC LIMIT ?");
  return stmt.all(limit) as unknown as HistoryItem[];
}

export function deleteHistoryItem(id: number): boolean {
  const db = getDatabase();
  if (!db) {
    memoryHistory = memoryHistory.filter((h) => h.id !== id);
    return true;
  }
  const stmt = db.prepare("DELETE FROM search_history WHERE id = ?");
  stmt.run(id);
  return true;
}

export function clearHistory(): boolean {
  const db = getDatabase();
  if (!db) {
    memoryHistory = [];
    return true;
  }
  db.exec("DELETE FROM search_history");
  return true;
}
