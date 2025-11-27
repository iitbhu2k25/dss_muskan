"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
import { defaults as defaultControls, ScaleLine, FullScreen } from "ol/control";
import Overlay from "ol/Overlay";
import { MapBrowserEvent } from "ol";

interface StationData {
  stationCode: string;
  warningLevel: number | null;
  dangerLevel: number | null;
  highestFlowLevel: number | null;
  frl: number | null;
  mwl: number | null;
  stationType: string;
  dataTypeCode: string;
  value: number;
  actualTime: string;
  otherParam: string;
}

interface PopupData {
  stationName: string;
  stationCode: string;
  latestData: StationData;
  allData: StationData[];
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
}

const MapContext = createContext<MapContextProps | undefined>(undefined);

export const WaterLevelMapProvider = ({ children }: { children: ReactNode }) => {
  const [map, setMap] = useState<Map | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [popupOverlay, setPopupOverlay] = useState<Overlay | null>(null);
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Style for India boundary - OUTLINE ONLY (from Groundwater context)
  const indiaBoundaryStyle = new Style({
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.01)', // Nearly transparent fill
    }),
    stroke: new Stroke({
      color: "blue",
      width: 2,
    }),
  });

  // API function to fetch hydrograph station data
  const fetchHydrographStationData = async (stationCode: string) => {
    console.log("[DEBUG] fetchHydrographStationData called with stationCode:", stationCode);
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const startDate = "2016-01-01";
      const apiUrl = "http://localhost:9000/django/extract/level";
      
      console.log("[DEBUG] Sending POST request to:", apiUrl);
      console.log("[DEBUG] Payload:", { stationCode: `'${stationCode}'`, startDate, endDate: currentDate });
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationCode: `'${stationCode}'`,
          startDate: startDate,
          endDate: currentDate
        }),
      });
      
      console.log("[DEBUG] API response status:", response.status);
      
      if (!response.ok) {
        const text = await response.text();
        // console.error("[DEBUG] Non-OK response:", text);
        throw new Error("Failed to fetch hydrograph station data");
      }
      
      const data = await response.json();
      // console.log("[DEBUG] API response JSON:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No data available for this station");
      }
      
      return data;
    } catch (error) {
      console.error("[ERROR] fetchHydrographStationData failed:", error);
      throw error;
    }
  };

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

      // UPDATED: India layer as Vector with outline-only style
      const indiaLayer = new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: "/geoserver/api/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:India&outputFormat=application/json",
        }),
        style: indiaBoundaryStyle,
        zIndex: 1,
        properties: { name: "indiaBase" },
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
        // autoPanAnimation: { duration: 50 },
      });

      const initialMap = new Map({
        target: undefined,
        view: new View({
          center: fromLonLat([78.9629, 22.5937]),
          zoom: 5,
          minZoom: 3,
          maxZoom: 18,
          projection: "EPSG:3857",
        }),
        layers: [osmLayer, satelliteLayer, indiaLayer, waterLevelLayer],
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

      // Handle India layer loading
      indiaLayer.getSource()?.on("featuresloaderror", (event: any) => {
        console.error("[DEBUG] Error loading India WFS layer:", event);
      });
      
      indiaLayer.getSource()?.on("featuresloadend", () => {
        console.log("[DEBUG] India WFS layer loaded successfully");
        
        // Fit to India extent after loading
        const source = indiaLayer.getSource();
        if (source) {
          const extent = source.getExtent();
          if (extent && extent.some((coord: number) => isFinite(coord))) {
            initialMap.getView().fit(extent, {
              padding: [50, 50, 50, 50],
              duration: 1000,
            });
            console.log("[DEBUG] Fitted to India layer extent");
          }
        }
      });

      setMap(initialMap);
      setPopupOverlay(overlay);
      console.log("[DEBUG] Map and overlay initialized with India boundary outline");
    }
  }, []);

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
      .find((layer) => layer.get("name") === "waterLevel") as ImageLayer<ImageWMS> | undefined;

    if (!waterLevelLayer) {
      console.warn("[DEBUG] Water level layer not found");
      return;
    }

    const url = waterLevelLayer.getSource()?.getFeatureInfoUrl(
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

        const stationCode = props.stationCod || props.StationCod || props.stationcod;
        console.log("[DEBUG] Extracted stationCode:", stationCode);

        if (!stationCode) {
          console.warn("[DEBUG] stationCod not found in feature properties");
          popupOverlay.setPosition(undefined);
          setIsPopupVisible(false);
          return;
        }

        popupOverlay.setPosition(evt.coordinate);
        setIsLoading(true);
        setIsPopupVisible(true);

        try {
          console.log("[DEBUG] Calling backend API for station:", stationCode);
          const hydrographData = await fetchHydrographStationData(stationCode);
          // console.log("[DEBUG] Backend API response:", hydrographData);

          if (!Array.isArray(hydrographData) || hydrographData.length === 0) {
            throw new Error("No valid data received");
          }

          // Sort data by time (newest first)
          const sortedData = hydrographData.sort((a: any, b: any) =>
            new Date(b.actualTime).getTime() - new Date(a.actualTime).getTime()
          );

          const latestData = sortedData[0];

          setPopupData({
            stationName: props.name || latestData.stationCode || "Station",
            stationCode: latestData.stationCode,
            latestData: latestData,
            allData: sortedData,
          });
          
          console.log("[DEBUG] Popup data set successfully");
        } catch (apiError) {
          console.error("[DEBUG] API call failed:", apiError);
          setPopupData(null);
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

  useEffect(() => {
    if (!map) return;
    
    console.log("[DEBUG] Attaching singleclick listener");
    map.on('singleclick', handleMapClick);
    
    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [map, popupOverlay]);

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