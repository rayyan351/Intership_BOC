// front-end/src/utils/mapUtils.js

/**
 * Parses Coordinates (lat, lng) from:
 * 1. Google Maps URL (@lat,lng or ?q=lat,lng or !3dlat!4dlng)
 * 2. Raw coordinates text (e.g. "24.8607, 67.0011" or "24.8607 67.0011")
 */
export function extractCoordinates(input) {
  if (!input || typeof input !== "string") return null;
  const str = input.trim();

  // 1. Check for raw lat,lng string format (e.g. "24.8607, 67.0011")
  const rawMatch = str.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[3]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }

  // 2. Check for standard @lat,lng in Google Maps URL (e.g. /@24.860734,67.001132,17z)
  const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      latitude: parseFloat(atMatch[1]),
      longitude: parseFloat(atMatch[2]),
    };
  }

  // 3. Check for query param ?q=lat,lng or &ll=lat,lng
  const queryMatch = str.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch) {
    return {
      latitude: parseFloat(queryMatch[1]),
      longitude: parseFloat(queryMatch[2]),
    };
  }

  // 4. Check for embed/place URL parameters !3dlat!4dlng
  const embedMatch = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (embedMatch) {
    return {
      latitude: parseFloat(embedMatch[1]),
      longitude: parseFloat(embedMatch[2]),
    };
  }

  return null;
}