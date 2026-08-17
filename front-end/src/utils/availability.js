// src/utils/availability.js
export function isItemCurrentlyAvailable(item) {
  if (!item || !item.availabilityType || item.availabilityType === "always") {
    return { available: true };
  }

  const now = new Date();

  // 1. Specific Date Range (e.g. Seasonal or Ramadan Deals)
  if (item.availabilityType === "date_range") {
    if (item.startDate && now < new Date(item.startDate)) {
      return {
        available: false,
        reason: `Available starting ${new Date(item.startDate).toLocaleDateString()}`,
      };
    }
    if (item.endDate && now > new Date(item.endDate)) {
      return {
        available: false,
        reason: "This special deal has expired.",
      };
    }
    return { available: true };
  }

  // 2. Daily Time Slot (e.g. Midnight Deals 00:00 - 04:00)
  if (item.availabilityType === "time_window" && item.startTime && item.endTime) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = item.startTime.split(":").map(Number);
    const [endH, endM] = item.endTime.split(":").map(Number);

    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    let isWithinTime = false;

    if (startMinutes <= endMinutes) {
      // Standard daytime window (e.g. 12:00 PM to 04:00 PM)
      isWithinTime = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight / Midnight wrap-around (e.g. 11:00 PM to 04:00 AM)
      isWithinTime = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    if (!isWithinTime) {
      return {
        available: false,
        reason: `Available daily only between ${item.startTime} and ${item.endTime}`,
      };
    }

    return { available: true };
  }

  return { available: true };
}