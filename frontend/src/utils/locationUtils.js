export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "User denied the request for Geolocation.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};

export const generateStaticMapUrl = (lat, lng, zoom = 15, width = 400, height = 300) => {
  // Using a simple static map service (you can replace with your preferred service)
  return `https://maps.locationiq.com/v3/staticmap?key=YOUR_API_KEY&center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&format=png&maptype=roadmap&markers=icon:large-red-cutout|${lat},${lng}`;
};

// Major Nepal cities coordinates for quick selection
export const nepaliCities = [
  { name: 'Kathmandu', lat: 27.7172, lng: 85.3240 },
  { name: 'Lalitpur', lat: 27.6710, lng: 85.3234 },
  { name: 'Bhaktapur', lat: 27.6722, lng: 85.4298 },
  { name: 'Pokhara', lat: 28.2096, lng: 83.9856 },
  { name: 'Biratnagar', lat: 26.4525, lng: 87.2718 },
  { name: 'Birgunj', lat: 27.0123, lng: 84.8505 },
  { name: 'Dharan', lat: 26.8147, lng: 87.2769 },
  { name: 'Bharatpur', lat: 27.6915, lng: 84.4328 },
  { name: 'Janakpur', lat: 26.7288, lng: 85.9266 },
  { name: 'Hetauda', lat: 27.4286, lng: 85.0448 }
];