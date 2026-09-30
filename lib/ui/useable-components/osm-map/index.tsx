
'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

import 'leaflet/dist/leaflet.css';




const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const LeafletMarker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const LeafletCircle = dynamic(() => import('react-leaflet').then(m => m.Circle), { ssr: false });
const LeafletPolygon = dynamic(() => import('react-leaflet').then(m => m.Polygon), { ssr: false });
const LeafletPolyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });

const MapUpdater = ({ center, zoom }: any) => {
  const [map, setMap] = useState<any>(null);
  useEffect(() => {
    import('react-leaflet').then(m => {
      try {
        const mInstance = m.useMap();
        setMap(mInstance);
      } catch (e) {}
    });
  }, []);
  
  useEffect(() => {
    if (map && center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

export const GoogleMap = ({ children, center, zoom, onClick, mapContainerStyle, options }: any) => {
  useEffect(() => {
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  
  if (!isMounted) return <div style={mapContainerStyle} className="bg-gray-100 flex items-center justify-center">Loading Map...</div>;

  return (
    <div style={mapContainerStyle}>
      <MapContainer 
        center={center ? [center.lat, center.lng] : [0, 0]} 
        zoom={zoom || 13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
        <MapUpdater center={center} zoom={zoom} />
        {children}
      </MapContainer>
    </div>
  );
};

export const Marker = ({ position, draggable, onDragEnd, onRightClick, icon }: any) => {
  const markerRef = useRef<any>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          if (onDragEnd) {
            onDragEnd({ latLng: { lat: () => latLng.lat, lng: () => latLng.lng } });
          }
        }
      },
      contextmenu() {
        if (onRightClick) onRightClick();
      }
    }),
    [onDragEnd, onRightClick],
  );

  if (!position) return null;
  return (
    <LeafletMarker 
      position={[position.lat, position.lng]} 
      draggable={draggable} 
      eventHandlers={eventHandlers} 
      ref={markerRef}
    />
  );
};

export const Circle = ({ center, radius, visible, options }: any) => {
  if (visible === false || !center) return null;
  return (
    <LeafletCircle 
      center={[center.lat, center.lng]} 
      radius={radius || 0} 
      pathOptions={{
        color: options?.strokeColor || 'black',
        fillColor: options?.fillColor || 'black',
        fillOpacity: options?.fillOpacity || 0.2,
        weight: options?.strokeWeight || 2
      }} 
    />
  );
};

export const Polygon = ({ paths, options, visible, onClick, editable, draggable, onMouseUp, onDragEnd }: any) => {
  if (visible === false || !paths) return null;
  
  const formatPaths = (p: any): any => {
    if (Array.isArray(p)) {
      if (p.length > 0 && typeof p[0] === 'object' && 'lat' in p[0]) {
        return p.map(ll => [ll.lat, ll.lng]);
      }
      return p.map(formatPaths);
    }
    return p;
  };

  const leafletPaths = formatPaths(paths);
  
  return (
    <LeafletPolygon 
      positions={leafletPaths}
      pathOptions={{
        color: options?.strokeColor || 'black',
        fillColor: options?.fillColor || 'black',
        fillOpacity: options?.fillOpacity || 0.2,
        weight: options?.strokeWeight || 2
      }}
      eventHandlers={{
        click: (e: any) => onClick && onClick({ latLng: { lat: () => e.latlng.lat, lng: () => e.latlng.lng } }),
        mouseup: () => onMouseUp && onMouseUp(),
        dragend: () => onDragEnd && onDragEnd()
      }}
    />
  );
};

export const Polyline = ({ path, options }: any) => {
  if (!path) return null;
  const leafletPaths = path.map((ll: any) => [ll.lat, ll.lng]);
  return (
    <LeafletPolyline 
      positions={leafletPaths}
      pathOptions={{
        color: options?.strokeColor || 'black',
        weight: options?.strokeWeight || 3
      }}
    />
  );
};

export const useJsApiLoader = () => {
  return { isLoaded: true, loadError: null };
};


export type Libraries = string[];

export const DirectionsService = ({ options, callback }: any) => {
  useEffect(() => {
    if (!options?.origin || !options?.destination || !callback) return;
    
    let isMounted = true;
    const fetchRoute = async () => {
      try {
        const originLng = typeof options.origin.lng === 'function' ? options.origin.lng() : (options.origin.lng || options.origin[1]);
        const originLat = typeof options.origin.lat === 'function' ? options.origin.lat() : (options.origin.lat || options.origin[0]);
        const destLng = typeof options.destination.lng === 'function' ? options.destination.lng() : (options.destination.lng || options.destination[1]);
        const destLat = typeof options.destination.lat === 'function' ? options.destination.lat() : (options.destination.lat || options.destination[0]);
        
        if (!originLng || !originLat || !destLng || !destLat) return;
        
        const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: any) => ({ lat: c[1], lng: c[0] }));
          
          if (isMounted) {
            callback({ routes: [{ overview_path: coords }] }, 'OK');
          }
        }
      } catch (err) {
        console.error('OSRM Route fetch error', err);
      }
    };
    
    fetchRoute();
    return () => { isMounted = false; };
  }, [options?.origin, options?.destination, callback]);

  return null;
};

export const DirectionsRenderer = ({ directions, options }: any) => {
  if (!directions || !directions.routes || directions.routes.length === 0) return null;
  const path = directions.routes[0].overview_path;
  
  if (!path || path.length === 0) return null;
  
  return <Polyline path={path} options={{ strokeColor: options?.polylineOptions?.strokeColor || '#007AFF', strokeWeight: options?.polylineOptions?.strokeWeight || 4 }} />;
};
