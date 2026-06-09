export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: string;
  kind: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
const API_URL = "https://www.googleapis.com/webfonts/v1/webfonts";

const loadedFonts = new Set<string>();

let fontsCache: GoogleFont[] | null = null;
let fontsCacheTimestamp: number | null = null;
const MEMORY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in-memory
const STORAGE_KEY = "google-fonts-cache";
const STORAGE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in localStorage

function readStorageCache(): { fonts: GoogleFont[]; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.fonts || !parsed.timestamp) return null
    return parsed
  } catch {
    return null
  }
}

function writeStorageCache(fonts: GoogleFont[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fonts, timestamp: Date.now() }))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export async function fetchGoogleFonts(): Promise<GoogleFont[]> {
  if (
    fontsCache &&
    fontsCacheTimestamp &&
    Date.now() - fontsCacheTimestamp < MEMORY_CACHE_TTL
  ) {
    return fontsCache;
  }

  const stored = readStorageCache()
  if (stored && Date.now() - stored.timestamp < STORAGE_TTL) {
    fontsCache = stored.fonts
    fontsCacheTimestamp = stored.timestamp
    return stored.fonts
  }

  if (!API_KEY) {
    if (stored) {
      fontsCache = stored.fonts
      return stored.fonts
    }
    throw new Error("Google Fonts API key is not configured");
  }

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}&sort=popularity`);
    if (!response.ok) {
      throw new Error(`Google Fonts API returned ${response.status}`);
    }
    const data = await response.json();
    fontsCache = data.items;
    fontsCacheTimestamp = Date.now();
    writeStorageCache(data.items);
    return data.items;
  } catch (error) {
    if (stored) {
      fontsCache = stored.fonts
      return stored.fonts
    }
    if (fontsCache) {
      return fontsCache;
    }
    console.error("Error fetching Google Fonts:", error);
    throw error;
  }
}

export function getFontUrl(font: GoogleFont, variant = "regular"): string {
  const fontFamily = font.family.replace(/\s+/g, "+");
  const fontVariant = variant === "regular" ? "400" : variant;
  return `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${fontVariant}&display=swap`;
}

async function tryLoadViaCss2(
  fontFamily: string,
  axes: string[],
  isItalic: boolean,
): Promise<boolean> {
  if (axes.length === 0) return false

  const [axis, ...rest] = axes
  const family = fontFamily.replace(/\s+/g, "+")
  const url = isItalic
    ? `https://fonts.googleapis.com/css2?family=${family}:ital,wght@1,${axis}&display=swap`
    : `https://fonts.googleapis.com/css2?family=${family}:wght@${axis}&display=swap`

  return new Promise<boolean>((resolve) => {
    const link = document.createElement("link")
    link.href = url
    link.rel = "stylesheet"

    link.onload = () => {
      loadedFonts.add(fontFamily)
      resolve(true)
    }

    link.onerror = () => {
      tryLoadViaCss2(fontFamily, rest, isItalic).then(resolve)
    }

    document.head.appendChild(link)
  })
}

export async function loadFont(
  fontFamily: string,
  font?: GoogleFont,
): Promise<void> {
  if (loadedFonts.has(fontFamily)) return

  if (font?.files) {
    const fileUrl = font.files.regular || font.files["400"] || Object.values(font.files)[0]
    if (fileUrl) {
      return new Promise<void>((resolve) => {
        const style = document.createElement("style")
        style.textContent = `
          @font-face {
            font-family: "${fontFamily}";
            src: url("${fileUrl}") format("truetype");
            font-weight: 400;
            font-style: normal;
          }
        `
        document.head.appendChild(style)
        loadedFonts.add(fontFamily)
        resolve()
      })
    }
  }

  const weights = ["400", "300", "700", "600", "500", "800", "900"]
  const loaded = await tryLoadViaCss2(fontFamily, weights, false)
  if (!loaded) {
    await tryLoadViaCss2(fontFamily, weights, true)
  }
}

export async function createFontRecord(params: {
  key: string
  name: string
  family: string
  variant: string
  file_url: string
  file_size?: number
}): Promise<{ font: { id: string } }> {
  const res = await fetch('/api/admin/fonts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create font record')
  return data
}

export interface FontPickerProps {
  onFontSelect?: (font: GoogleFont) => void;
  value?: string;
}

export const FONT_CATEGORIES = [
  "serif",
  "sans-serif",
  "display",
  "handwriting",
  "monospace",
] as const;

export type FontCategory = (typeof FONT_CATEGORIES)[number];

export const FONT_WEIGHTS = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
] as const;

export type FontWeight = (typeof FONT_WEIGHTS)[number];
