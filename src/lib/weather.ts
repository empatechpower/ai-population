// Real weather check for the sunshine notification — the dashboard's
// "UV: High" / "Best window today" content is a season-based estimate with
// no live data behind it (see getSunGuidance() in dashboard/page.tsx); this
// is the one place actual weather conditions are used.
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

export async function isSunnyToday(city: string): Promise<boolean> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OPENWEATHER_API_KEY is not set");
  if (!city) return false;

  const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    // Unknown/unmatched city name, rate limit, etc. — treat as "don't send"
    // rather than throwing and aborting the whole cron run for other users.
    console.error(`[weather] ${res.status} for city "${city}"`);
    return false;
  }
  const data = await res.json();
  // id 800 = "clear sky" — the one condition code that means genuinely
  // sunny, as opposed to 801-804 (varying degrees of cloud cover).
  return data?.weather?.[0]?.id === 800;
}
