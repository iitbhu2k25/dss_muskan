// components/weather/components/map.tsx
"use client";

import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { defaults as defaultControls } from "ol/control";
import "ol/ol.css";

const WeatherMap = () => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapElement.current) return;

    // OpenWeatherMap Tile URL (requires free API key from https://openweathermap.org/api)
    const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY"; // Replace with actual key or use env

    const precipitationLayer = new TileLayer({
      source: new XYZ({
        url: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        attributions: "© OpenWeatherMap",
      }),
      opacity: 0.7,
    });

    const cloudsLayer = new TileLayer({
      source: new XYZ({
        url: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
      }),
      opacity: 0.6,
    });

    const tempLayer = new TileLayer({
      source: new XYZ({
        url: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
      }),
      opacity: 0.6,
    });

    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    const map = new Map({
      target: mapElement.current,
      layers: [baseLayer, precipitationLayer, cloudsLayer],
      view: new View({
        center: [8500000, 2500000], // Approx center of India
        zoom: 5,
      }),
      controls: defaultControls({ attribution: false }),
    });

    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={mapElement} className="w-full h-full" />

      {/* Layer Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 z-10">
        <h3 className="font-semibold text-sm text-gray-700 mb-2">Weather Layers</h3>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" defaultChecked className="rounded" />
          <span>Precipitation</span>
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" defaultChecked className="rounded" />
          <span>Clouds</span>
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" className="rounded" />
          <span>Temperature</span>
        </label>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-4 py-2 text-xs text-gray-600">
        Data © OpenWeatherMap | Map © OpenStreetMap
      </div>
    </div>
  );
};

export default WeatherMap;