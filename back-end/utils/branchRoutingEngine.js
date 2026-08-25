// back-end/utils/branchRoutingEngine.js
const Branch = require('../models/Branch');
const Order = require('../models/Order');

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function resolveOptimalBranchAndETA({ city, areaLat, areaLon, baseTransitMinutes = null }) {
  const activeBranches = await Branch.find({
    city: { $regex: new RegExp(`^${city}$`, 'i') },
    isShown: { $ne: false },
  });

  if (!activeBranches || activeBranches.length === 0) {
    const fallback = await Branch.findOne({ isShown: { $ne: false } });
    return {
      branch: fallback || null,
      dynamicETA: 35,
      distanceKm: null,
      activeQueueCount: 0,
    };
  }

  let selectedBranch = activeBranches[0];
  let shortestDistance = Infinity;

  if (areaLat && areaLon) {
    for (const b of activeBranches) {
      if (b.latitude && b.longitude) {
        const dist = calculateHaversineDistance(areaLat, areaLon, b.latitude, b.longitude);
        if (dist < shortestDistance) {
          shortestDistance = dist;
          selectedBranch = b;
        }
      }
    }
  }

  // Live active kitchen queue count (Orders currently being processed)
  const activeQueueCount = await Order.countDocuments({
    branch: selectedBranch._id,
    orderStatus: { $in: ['PENDING', 'PREPARING'] },
  });

  const distKm = shortestDistance !== Infinity ? Number(shortestDistance.toFixed(2)) : null;

  // Real-time calculation using speed & queue matrix
  let calculatedETA;
  if (distKm !== null) {
    const prepTime = 15; // Standard 15 min kitchen preparation
    const travelTime = Math.ceil(distKm * 2.5); // 2.5 mins per km rider transit
    const queueBuffer = Math.min(Math.floor(activeQueueCount / 2) * 3, 25); // +3 mins per 2 queued orders
    calculatedETA = prepTime + travelTime + queueBuffer;
  } else {
    calculatedETA = baseTransitMinutes || 35;
  }

  return {
    branch: selectedBranch,
    dynamicETA: calculatedETA,
    distanceKm: distKm,
    activeQueueCount,
  };
}

module.exports = {
  calculateHaversineDistance,
  resolveOptimalBranchAndETA,
};