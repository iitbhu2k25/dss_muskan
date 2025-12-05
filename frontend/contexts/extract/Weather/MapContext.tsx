// contexts/extract/WeatherMapContext.tsx
"use client";
import { createContext, useContext, ReactNode, useRef, useState, useEffect, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import ImageLayer from "ol/layer/Image";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import ImageWMS from "ol/source/ImageWMS";
import XYZ from "ol/source/XYZ";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style } from "ol/style";
import { fromLonLat } from "ol/proj";
import { defaults as defaultControls, ScaleLine } from "ol/control";
import { Feature } from "ol";
import { Geometry } from "ol/geom";

interface WeatherMapContextType {
  mapRef: React.RefObject<HTMLDivElement>;
  map: Map | null;
  isLoading: boolean;
  isSatellite: boolean;
  toggleBaseMap: () => void;
}

const WeatherMapContext = createContext<WeatherMapContextType | undefined>(undefined);

export const WeatherMapProvider = ({ children }: { children: ReactNode }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSatellite, setIsSatellite] = useState(false);

  const indiaBoundaryStyle = new Style({
    fill: new Fill({ color: "rgba(0, 0, 0, 0.01)" }),
    stroke: new Stroke({ color: "blue", width: 2 }),
  });

  // Fit to India extent function
  const fitToIndia = useCallback((indiaMap: Map, indiaSource: VectorSource) => {
    const extent = indiaSource.getExtent();
    if (extent.every(isFinite)) {
      indiaMap.getView().fit(extent, { 
        padding: [50, 50, 50, 50], 
        duration: 1000,
        maxZoom: 6 
      });
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Base map layers
    const osmLayer = new TileLayer({
      source: new OSM(),
      properties: { name: "osm" },
      visible: true,
    });

    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
      }),
      visible: false,
      properties: { name: "satellite" },
    });

    // India boundary layer (WFS)
    const indiaLayer = new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: "/geoserver/api/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:B_State&outputFormat=application/json",
      }),
      style: indiaBoundaryStyle,
      zIndex: 1,
      properties: { name: "indiaBase" },
    });

    // Water level WMS layer
    const waterLevelLayer = new ImageLayer({
      source: new ImageWMS({
        url: "http://localhost:9090/geoserver/myworkspace/wms",
        params: {
          LAYERS: "myworkspace:waterlevel",
          TILED: true,
          FORMAT: "image/png",
          TRANSPARENT: true,
        },
        serverType: "geoserver",
        crossOrigin: "anonymous",
      }),
      visible: true,
      opacity: 0.8,
      zIndex: 2,
      properties: { name: "waterLevel" },
    });

    // Create map
    const newMap = new Map({
      target: mapRef.current,
      view: new View({
        center: fromLonLat([78.9629, 22.5937]),
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
      }),
      layers: [osmLayer, satelliteLayer, indiaLayer, waterLevelLayer],
      controls: defaultControls({ zoom: false, attribution: true, rotate: false }).extend([
        new ScaleLine({ units: "metric", bar: true, steps: 4, text: true, minWidth: 140 }),
      ]),
    });

    // Multiple strategies to ensure India fit
    const indiaSource = indiaLayer.getSource() as VectorSource;
    
    // 1. Try immediate fit after short delay
    const timeoutId = setTimeout(() => {
      fitToIndia(newMap, indiaSource);
    }, 2000);

    // 2. Listen for features load
    indiaLayer.getSource()?.on("featuresloadend", () => {
      fitToIndia(newMap, indiaSource);
    });

    // 3. Fallback: force refresh source and fit
    indiaSource?.refresh();
    
    setMap(newMap);

    return () => {
      clearTimeout(timeoutId);
      newMap.setTarget(undefined);
      setMap(null);
      setIsLoading(true);
    };
  }, [fitToIndia]);

  // Toggle base map
  const toggleBaseMap = () => {
    setIsSatellite(prev => {
      const osmLayer = map?.getLayers().getArray().find(l => l.get("name") === "osm");
      const satelliteLayer = map?.getLayers().getArray().find(l => l.get("name") === "satellite");
      
      if (osmLayer && satelliteLayer) {
        osmLayer.setVisible(!prev);
        satelliteLayer.setVisible(prev);
      }
      return !prev;
    });
  };

  return (
    <WeatherMapContext.Provider value={{ mapRef, map, isLoading, isSatellite, toggleBaseMap }}>
      {children}
    </WeatherMapContext.Provider>
  );
};

export const useWeatherMap = () => {
  const context = useContext(WeatherMapContext);
  if (!context) {
    throw new Error("useWeatherMap must be used within WeatherMapProvider");
  }
  return context;
};
