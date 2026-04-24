# Leaflet + OpenStreetMap Implementation

## Summary
Successfully reverted from Google Maps to Leaflet + OpenStreetMap for the Crime Alert System's location tracking feature.

## Changes Made

### 1. Package Management
- **Removed**: `@react-google-maps/api`
- **Installed**: 
  - `leaflet@1.9.4`
  - `react-leaflet@4.2.1` (compatible with React 18)
  - `@types/leaflet`

### 2. ReportPage.tsx Updates

#### Imports
```typescript
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
```

#### Fixed Leaflet Default Marker Icons
Leaflet has a known issue with default marker icons in bundled apps. We fixed it with:
```typescript
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
```

#### MapController Component
Created a custom `MapController` component to:
- Handle map clicks for user-selected locations
- Update marker position dynamically
- Recenter map when location changes
- Update form data with latitude/longitude

```typescript
function MapController({ center, position, setPosition, setFormData, formData }: any) {
  const map = useMap();
  
  // Recenter map when center prop changes
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 15);
    }
  }, [center, map]);
  
  // Handle map clicks
  useEffect(() => {
    const onClick = (e: L.LeafletMouseEvent) => {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      setFormData({ 
        ...formData, 
        latitude: e.latlng.lat, 
        longitude: e.latlng.lng 
      });
    };
    
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [map, setPosition, setFormData, formData]);
  
  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}
```

#### Map Component
```typescript
<MapContainer
  center={[mapCenter.lat, mapCenter.lng]}
  zoom={15}
  style={{ width: '100%', height: '100%' }}
>
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
  <MapController 
    center={mapCenter} 
    position={mapPosition}
    setPosition={setMapPosition}
    setFormData={setFormData}
    formData={formData}
  />
</MapContainer>
```

### 3. Geolocation Features

#### Automatic Location Detection on Page Load
```typescript
useEffect(() => {
  if ('geolocation' in navigator) {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setMapCenter(userLocation);
        setMapPosition(userLocation);
        setFormData(prev => ({ 
          ...prev, 
          latitude: position.coords.latitude, 
          longitude: position.coords.longitude 
        }));
        setGettingLocation(false);
      },
      (error) => {
        console.log('Geolocation error:', error.message);
        setGettingLocation(false);
        // Keep default Harare location
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
}, []);
```

#### "Use My Location" Button
- Automatically detects user's location when clicked
- Shows loading state during detection
- Updates map center and marker position
- Fallback to default Harare coordinates if geolocation fails

## Features

✅ **Automatic Location Detection**: Gets user's location on page load
✅ **Manual Location Selection**: Click anywhere on the map to select location
✅ **Real-time Marker Updates**: Marker moves to clicked position
✅ **Coordinate Display**: Shows selected coordinates below map
✅ **Geolocation Button**: "Use My Location" button to recenter on current position
✅ **Loading States**: Visual feedback during location detection
✅ **Error Handling**: Graceful fallback to default location (Harare)
✅ **High Accuracy**: Uses `enableHighAccuracy: true` for better GPS precision
✅ **OpenStreetMap Tiles**: Free, open-source mapping solution
✅ **No API Keys Required**: Unlike Google Maps, no API key needed

## Technical Details

### Default Location
- **City**: Harare, Zimbabwe
- **Coordinates**: `-17.8252, 31.0335`

### Geolocation Options
```typescript
{
  enableHighAccuracy: true,  // Use GPS for better precision
  timeout: 10000             // 10 second timeout
}
```

### Map Configuration
- **Zoom Level**: 15 (street level detail)
- **Tile Provider**: OpenStreetMap
- **Attribution**: Automatically displayed on map

## Browser Compatibility
- Works in all modern browsers that support the Geolocation API
- Requires HTTPS in production for geolocation to work
- Falls back gracefully if geolocation is blocked/unavailable

## Testing Checklist

- [ ] Page loads with map centered on user's location (if permission granted)
- [ ] Marker appears at detected location
- [ ] Clicking map updates marker position
- [ ] "Use My Location" button recenters to current position
- [ ] Coordinates display correctly below map
- [ ] Form data includes latitude/longitude when submitting
- [ ] Map works on mobile devices
- [ ] Fallback to Harare location if geolocation denied

## Advantages Over Google Maps

1. **No API Key Required**: Completely free and open
2. **No Usage Limits**: Unlimited map loads
3. **Open Source**: Full community support
4. **Privacy Friendly**: No tracking by Google
5. **Lightweight**: Smaller bundle size
6. **Customizable**: Easy to style and extend

## Next Steps

- Test on actual devices with GPS
- Add map markers for previous crime reports
- Implement reverse geocoding for address lookup
- Add search functionality to find specific locations
- Consider offline map caching for poor connectivity areas
