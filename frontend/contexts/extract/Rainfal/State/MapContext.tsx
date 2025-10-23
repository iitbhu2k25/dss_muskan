"use client";

import React, { createContext, ReactNode, useContext, useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import Overlay from "ol/Overlay";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import { RainfallFeature, RainfallData, DailyContext } from "./DailyContext";

type MapContextType = {
  mapInstance: Map | null;
  setMapContainer: (el: HTMLElement | null) => void;
  isLoading: boolean;
  error: string | null;
  selectedBaseMap: "osm" | "satellite";
  changeBaseMap: (key: "osm" | "satellite") => void;
  rainfallData: RainfallData | null;
  setSelectedState: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedState: string | undefined;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

const baseMaps = {
  osm: new TileLayer({
    source: new OSM(),
  }),
  // satellite placeholder: you can add your satellite layer here
  satellite: new TileLayer({
    source: new OSM(), // replace with satellite source
  }),
};

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const dailyContext = useContext(DailyContext);
  if (!dailyContext) throw new Error("MapProvider must be used within DailyProvider");

  const { rainfallData } = dailyContext;

  const mapRef = useRef<Map | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBaseMap, setSelectedBaseMap] = useState<"osm" | "satellite">("osm");

  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);

  // Initialize map
  useEffect(() => {
    if (!mapContainer) return;

    // Create vector layer
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: (feature) => {
        const color = feature.get("color") || "#000000";
        return new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: "#333", width: 1 }),
          }),
        });
      },
    });

    // Create map instance
    const map = new Map({
      target: mapContainer,
      layers: [baseMaps[selectedBaseMap], vectorLayer],
      view: new View({
        center: fromLonLat([78.9629, 20.5937]), // Center on India
        zoom: 5,
      }),
      controls: [],
    });

    mapRef.current = map;
    setIsLoading(false);

    // Tooltip overlay container
    const tooltipContainer = document.createElement("div");
    tooltipContainer.style.backgroundColor = "white";
    tooltipContainer.style.padding = "5px 8px";
    tooltipContainer.style.borderRadius = "4px";
    tooltipContainer.style.border = "1px solid #ccc";
    tooltipContainer.style.minWidth = "150px";
    tooltipContainer.style.position = "absolute";
    tooltipContainer.style.pointerEvents = "none";
    tooltipContainer.style.whiteSpace = "nowrap";

    const overlay = new Overlay({
      element: tooltipContainer,
      offset: [10, 0],
      positioning: "bottom-left",
    });
    map.addOverlay(overlay);

    // Pointer hover interaction
    map.on("pointermove", (evt) => {
      if (evt.dragging) return;
      const pixel = map.getEventPixel(evt.originalEvent);
      const feature = map.forEachFeatureAtPixel(pixel, (feat) => feat);

      if (feature && feature.getGeometry()?.getType() === "Point") {
        overlay.setPosition(evt.coordinate);
        const props = feature.getProperties();
        tooltipContainer.innerHTML = `
          <b>${props.state}</b><br/>
          Actual Rainfall: ${props.actual_rainfall}<br/>
          Normal Rainfall: ${props.normal_rainfall}<br/>
          Departure: ${props.departure}<br/>
          Category: ${props.category}<br/>
          Last Updated: ${props.last_updated}
        `;
      } else {
        overlay.setPosition(undefined);
      }
    });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [mapContainer]);

  // Update rainfall points when rainfallData changes
  useEffect(() => {
    if (!mapRef.current || !rainfallData) return;

    vectorSourceRef.current.clear();

    const features: Feature<Point>[] = rainfallData.features.map((f: RainfallFeature) => {
      const coords = fromLonLat(f.geometry.coordinates);
      const feature = new Feature({
        geometry: new Point(coords),
        state: f.properties.state,
        actual_rainfall: f.properties.actual_rainfall,
        normal_rainfall: f.properties.normal_rainfall,
        departure: f.properties.departure,
        category: f.properties.category,
        color: f.properties.color,
        last_updated: f.properties.last_updated,
      });

      return feature;
    });

    vectorSourceRef.current.addFeatures(features);
  }, [rainfallData]);

  // Handle base map change
  const changeBaseMap = useCallback(
    (key: "osm" | "satellite") => {
      if (!mapRef.current) return;
      setSelectedBaseMap(key);

      // Remove existing base layers and add new one
      Object.keys(baseMaps).forEach((k) => {
        mapRef.current!.removeLayer(baseMaps[k as keyof typeof baseMaps]);
      });
      mapRef.current.addLayer(baseMaps[key]);
    },
    []
  );

  return (
    <MapContext.Provider
      value={{
        mapInstance: mapRef.current,
        setMapContainer,
        isLoading,
        error,
        selectedBaseMap,
        changeBaseMap,
        rainfallData,
        selectedState,
        setSelectedState,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
};
