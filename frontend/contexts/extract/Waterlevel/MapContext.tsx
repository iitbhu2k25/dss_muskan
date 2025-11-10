"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import OSM from "ol/source/OSM";
import ImageWMS from "ol/source/ImageWMS";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { defaults as defaultControls, ScaleLine, FullScreen } from "ol/control";
import Overlay from "ol/Overlay";
import { MapBrowserEvent } from "ol";

interface PopupData {
  stationName: string;
  stationCode: string;
  waterLevel: string | number | null;
  dateTime: string;
  floodStatus: string;
  metadata?: any;
  status?: string;
}

interface MapContextProps {
  map: Map | null;
  toggleBaseMap: () => void;
  isSatellite: boolean;
  popupOverlay: Overlay | null;
  popupData: PopupData | null;
  isPopupVisible: boolean;
  isLoading: boolean;
  closePopup: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  clickedFeature: any | null;
  setClickedFeature: React.Dispatch<React.SetStateAction<any | null>>;
  waterLevelApiData: PopupData | null;
  fetchWaterLevel: () => Promise<void>;
}

const MapContext = createContext<MapContextProps | undefined>(undefined);

export const WaterLevelMapProvider = ({ children }: { children: ReactNode }) => {
  const [map, setMap] = useState<Map | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [popupOverlay, setPopupOverlay] = useState<Overlay | null>(null);
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clickedFeature, setClickedFeature] = useState<any | null>(null);
  const [waterLevelApiData, setWaterLevelApiData] = useState<PopupData | null>(null);

  // API function to fetch water level data
  const fetchWaterLevelData = async (stationCode: string) => {
    console.log("[DEBUG] fetchWaterLevelData called with stationCode:", stationCode);

    try {
      const apiUrl = "http://localhost:9000/django/extract/water-level";
      console.log("[DEBUG] Sending POST request to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ station_code: stationCode }),
      });

      console.log("[DEBUG] API response status:", response.status);
      if (!response.ok) {
        const text = await response.text();
        console.error("[DEBUG] Non-OK response:", text);
        throw new Error("Failed to fetch water level data");
      }

      const data = await response.json();
      console.log("[DEBUG] API response JSON:", data);
      return data;
    } catch (error) {
      console.error("[ERROR] fetchWaterLevelData failed:", error);
      throw error;
    }
  };

  // Fetch API data on button click
  const fetchWaterLevel = async () => {
    console.log("[DEBUG] fetchWaterLevel triggered");
    if (!clickedFeature) {
      console.warn("[DEBUG] No clickedFeature available");
      return;
    }

    const stationCode =
      clickedFeature.properties.stationCod ||
      clickedFeature.properties.StationCod ||
      clickedFeature.properties.stationcod;

    console.log("[DEBUG] Extracted stationCode:", stationCode);

    if (!stationCode) {
      console.warn("[DEBUG] No valid station code found in feature properties");
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchWaterLevelData(stationCode);
      console.log("[DEBUG] Setting water level API data:", data);

      setWaterLevelApiData({
        stationName: clickedFeature.properties.name || "Station",
        stationCode,
        waterLevel: data.Present_Water_Level_m,
        dateTime: data.DateTime,
        floodStatus: clickedFeature.properties.floodStatu || "N/A",
        metadata: data.Metadata,
        status: data.Status,
      });
    } catch (error) {
      console.error("[ERROR] Error fetching water level data:", error);
      setWaterLevelApiData(null);
    } finally {
      setIsLoading(false);
      console.log("[DEBUG] fetchWaterLevel finished");
    }
  };

  // Initialize map and overlay
  useEffect(() => {
    if (!map) {
      console.log("[DEBUG] Initializing map...");

      const osmLayer = new TileLayer({
        source: new OSM(),
        visible: !isSatellite,
        properties: { name: "osm" },
      });

      const satelliteLayer = new TileLayer({
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          maxZoom: 19,
        }),
        visible: isSatellite,
        properties: { name: "satellite" },
      });

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
        properties: { name: "waterLevel" },
      });

      const overlay = new Overlay({
        element: undefined,
        autoPan: true,
        autoPanAnimation: { duration: 250 },
      });

      const minLon = 68.76833333333333;
      const minLat = 8.158333333333333;
      const maxLon = 97.02583333333334;
      const maxLat = 34.603611111111114;
      const centerLon = (minLon + maxLon) / 2;
      const centerLat = (minLat + maxLat) / 2;

      const initialMap = new Map({
        target: undefined,
        view: new View({
          center: fromLonLat([centerLon, centerLat]),
          zoom: 5,
          minZoom: 3,
          maxZoom: 18,
          projection: "EPSG:3857",
        }),
        layers: [osmLayer, satelliteLayer, waterLevelLayer],
        overlays: [overlay],
        controls: defaultControls({
          zoom: false,
          attribution: true,
          rotate: false,
        }).extend([
          new ScaleLine({
            units: "metric",
            bar: true,
            steps: 4,
            text: true,
            minWidth: 140,
          }),
          new FullScreen(),
        ]),
      });

      // log once render complete
      initialMap.once("rendercomplete", () => {
        console.log("[DEBUG] Map render complete — fitting view");
        const extent = [
          ...fromLonLat([minLon, minLat]),
          ...fromLonLat([maxLon, maxLat]),
        ];
        initialMap.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
      });

      setMap(initialMap);
      setPopupOverlay(overlay);
      console.log("[DEBUG] Map and overlay initialized");
    }
  }, []);

  // Handle map click to get feature attributes
  const handleMapClick = async (evt: MapBrowserEvent<any>) => {
    console.log("[DEBUG] Map clicked at coordinate:", evt.coordinate);

    if (!map || !popupOverlay) {
      console.warn("[DEBUG] Map or popupOverlay missing");
      return;
    }

    const viewResolution = map.getView().getResolution();
    if (!viewResolution) {
      console.warn("[DEBUG] View resolution missing");
      return;
    }

    const waterLevelLayer = map
      .getLayers()
      .getArray()
      .find((layer) => layer.get("name") === "waterLevel");

    if (!waterLevelLayer) {
      console.warn("[DEBUG] Water level layer not found");
      return;
    }

    const url = (waterLevelLayer.getSource() as any).getFeatureInfoUrl(
      evt.coordinate,
      viewResolution,
      map.getView().getProjection(),
      { INFO_FORMAT: "application/json" }
    );

    console.log("[DEBUG] Generated GetFeatureInfo URL:", url);

    if (!url) {
      console.warn("[DEBUG] Failed to get GetFeatureInfo URL");
      return;
    }

    try {
      console.log("[DEBUG] Fetching GeoServer feature info...");
      const response = await fetch(url);
      console.log("[DEBUG] GeoServer response status:", response.status);

      const data = await response.json();
      console.log("[DEBUG] GeoServer returned:", data);

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const props = feature.properties;
        console.log("[DEBUG] Feature properties:", props);

        // Handle variations in property name casing
        const stationCode =
          props.stationCod || props.StationCod || props.stationcod;

        console.log("[DEBUG] Extracted stationCode:", stationCode);

        if (!stationCode) {
          console.warn("[DEBUG] stationCod not found in feature properties");
          popupOverlay.setPosition(undefined);
          setIsPopupVisible(false);
          return;
        }

        // Set position for popup
        popupOverlay.setPosition(evt.coordinate);
        setClickedFeature(feature);
        setIsLoading(true);
        setIsPopupVisible(true);

        try {
          console.log("[DEBUG] Calling backend API for station:", stationCode);
          const waterLevelData = await fetchWaterLevelData(stationCode);
          console.log("[DEBUG] Backend API response:", waterLevelData);

          setPopupData({
            stationName: props.name || "Station",
            stationCode,
            waterLevel: waterLevelData.Present_Water_Level_m,
            dateTime: waterLevelData.DateTime,
            floodStatus: props.floodStatu || "N/A",
            metadata: waterLevelData.Metadata,
            status: waterLevelData.Status,
          });

          console.log("[DEBUG] Popup data set successfully");
        } catch (apiError) {
          console.error("[DEBUG] API call failed:", apiError);
          // Still show popup with feature data even if API fails
          setPopupData({
            stationName: props.name || "Station",
            stationCode,
            waterLevel: null,
            dateTime: "N/A",
            floodStatus: props.floodStatu || "N/A",
            metadata: null,
            status: "Error",
          });
        }
        
        setIsLoading(false);
      } else {
        console.log("[DEBUG] No features found at clicked location");
        popupOverlay.setPosition(undefined);
        setIsPopupVisible(false);
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching feature info:", error);
      popupOverlay.setPosition(undefined);
      setIsPopupVisible(false);
      setIsLoading(false);
    }
  };

  // Attach map click handler after map & overlay ready
  useEffect(() => {
    if (!map) return;

    console.log("[DEBUG] Attaching singleclick listener");
    map.on('singleclick', handleMapClick);

    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [map, popupOverlay]);

  // Toggle base map visibility
  useEffect(() => {
    if (map) {
      map.getLayers().forEach((layer) => {
        const name = layer.get('name');
        if (name === 'osm') {
          layer.setVisible(!isSatellite);
        } else if (name === 'satellite') {
          layer.setVisible(isSatellite);
        }
      });
    }
  }, [map, isSatellite]);

  const toggleBaseMap = () => {
    setIsSatellite((prev) => !prev);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    setPopupData(null);
    setClickedFeature(null);
    setWaterLevelApiData(null);
    popupOverlay?.setPosition(undefined);
  };

  const handleZoomIn = () => {
    if (map) {
      const view = map.getView();
      const currentZoom = view.getZoom() ?? 0;
      view.animate({ zoom: currentZoom + 1, duration: 250 });
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const view = map.getView();
      const currentZoom = view.getZoom() ?? 0;
      view.animate({ zoom: currentZoom - 1, duration: 250 });
    }
  };

  return (
    <MapContext.Provider
      value={{
        map,
        toggleBaseMap,
        isSatellite,
        popupOverlay,
        popupData,
        isPopupVisible,
        isLoading,
        closePopup,
        handleZoomIn,
        handleZoomOut,
        clickedFeature,
        setClickedFeature,
        waterLevelApiData,
        fetchWaterLevel,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = (): MapContextProps => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a WaterLevelMapProvider");
  }
  return context;
};