const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km

  return distance;
};

const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};

const isWithinRadius = (lat1, lon1, lat2, lon2, radiusKm) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
};

const generateStaticMapUrl = (lat, lng, zoom = 15, width = 400, height = 300) => {
  // Using OpenStreetMap static map API (free alternative to Google)
  return `https://maps.locationiq.com/v3/staticmap?key=YOUR_API_KEY&center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&format=png&maptype=roadmap&markers=icon:large-red-cutout|${lat},${lng}`;
};

const generateGoogleStaticMapUrl = (lat, lng, zoom = 15, width = 400, height = 300) => {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=YOUR_GOOGLE_API_KEY`;
};

const getNearbyAdsQuery = (userLat, userLng, radiusKm = 25) => {
  return `
    SELECT *,
           (6371 * acos(
             cos(radians(${userLat})) *
             cos(radians(COALESCE(a.latitude, l.latitude))) *
             cos(radians(COALESCE(a.longitude, l.longitude)) - radians(${userLng})) +
             sin(radians(${userLat})) *
             sin(radians(COALESCE(a.latitude, l.latitude)))
           )) AS distance
    FROM ads a
    LEFT JOIN locations l ON a.location_id = l.id
    WHERE (a.latitude IS NOT NULL AND a.longitude IS NOT NULL)
       OR (l.latitude IS NOT NULL AND l.longitude IS NOT NULL)
    HAVING distance <= ${radiusKm}
    ORDER BY distance ASC
  `;
};

module.exports = {
  calculateDistance,
  formatDistance,
  isWithinRadius,
  generateStaticMapUrl,
  generateGoogleStaticMapUrl,
  getNearbyAdsQuery
};