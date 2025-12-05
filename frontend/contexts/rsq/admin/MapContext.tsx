//frontend/contexts/rsq/admin/MapContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import Map from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style } from "ol/style";
import Text from "ol/style/Text";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import { defaults as defaultControls } from "ol/control";
import { useLocation } from "./LocationContext";
import { useRSQ } from "./RsqContext";

const baseMaps = {
  osm: { name: "OpenStreetMap", source: () => new OSM({ crossOrigin: "anonymous" }) },
  satellite: {
    name: "Satellite",
    source: () =>
      new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        crossOrigin: "anonymous",
      }),
  },
};

interface MapContextType {
  mapInstance: Map | null;
  selectedBaseMap: string;
  changeBaseMap: (key: string) => void;
  setMapContainer: (el: HTMLDivElement | null) => void;
  isLoading: boolean;
  error: string | null;
  showLabels: boolean;
  toggleLabels: () => void;
  layerVisibility: Record<string, boolean>;
  toggleLayerVisibility: (layerName: string) => void;
  activeLayers: Record<string, boolean>; // New prop to track added layers
}


const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mapRef = useRef<Map | null>(null);
  const baseLayerRef = useRef<TileLayer<any> | null>(null);
  const indiaLayerRef = useRef<VectorLayer<any> | null>(null);
  const stateLayerRef = useRef<VectorLayer<any> | null>(null);
  const districtLayerRef = useRef<VectorLayer<any> | null>(null);
  const blockLayerRef = useRef<VectorLayer<any> | null>(null);
  const villageLayerRef = useRef<VectorLayer<any> | null>(null);
  const rsqLayerRef = useRef<VectorLayer<any> | null>(null);
  const hoverOverlayRef = useRef<Overlay | null>(null);
  const highlightLayerRef = useRef<VectorLayer<any> | null>(null);

  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [selectedBaseMap, setSelectedBaseMap] = useState("satellite");
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    india: true,
    state: true,
    district: true,
    block: true,
    village: true,
    rsq: true,
  });

  
  // === NEW STATE TO TRACK WHICH LAYERS ARE ADDED TO THE MAP ===
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({});

  const { selectedState, selectedDistricts, selectedBlocks, selectedVillages } = useLocation();
  

  const toggleLabels = () => setShowLabels((v) => !v);

  const removeLayer = (ref: React.MutableRefObject<VectorLayer<any> | null>, layerName: string) => {
    if (mapRef.current && ref.current) {
      mapRef.current.removeLayer(ref.current);
      ref.current = null;
      setActiveLayers(prev => ({ ...prev, [layerName]: false })); // Update active layers
    }
  };

  // === TOGGLE LAYER VISIBILITY ===
  const toggleLayerVisibility = (layerName: string) => {
    setLayerVisibility(prev => ({ ...prev, [layerName]: !prev[layerName] }));
    const layerRef = {
      india: indiaLayerRef,
      state: stateLayerRef,
      district: districtLayerRef,
      block: blockLayerRef,
      village: villageLayerRef,
      rsq: rsqLayerRef,
    }[layerName];

    if (layerRef && layerRef.current) {
      layerRef.current.setVisible(!layerRef.current.getVisible());
    }
  };

  // Fallback color calculation (if API doesn't provide color)
  const getStageColor = (stage: number): string => {
    if (stage <= 70) return "rgba(34, 197, 94, 0.7)"; // Safe - Green
    if (stage <= 90) return "rgba(250, 204, 21, 1)"; // Semi-Critical - Yellow
    if (stage <= 100) return "rgba(251, 146, 60, 0.7)"; // Critical - Orange
    return "rgba(239, 68, 68, 0.7)"; // Over-Exploited - Red
  };

  const getStageCategory = (stage: number): string => {
    if (stage <= 70) return "Safe";
    if (stage <= 90) return "Semi-Critical";
    if (stage <= 100) return "Critical";
    return "Over-Exploited";
  };

  // Styles
  const baseStyle = (stroke: string, fill: string) =>
    new Style({
      stroke: new Stroke({ color: stroke, width: 2 }),
      fill: new Fill({ color: fill }),
    });

  const labelStyle = (feature: any, base: Style, props: string[], font = "12px") =>
    showLabels
      ? new Style({
          stroke: (base.getStroke() as Stroke | undefined),
          fill: (base.getFill() as Fill | undefined),
          text: new Text({
            text: props.map((p) => feature.get(p)).find(Boolean) || "",
            font: `600 ${font} sans-serif`,
            fill: new Fill({ color: "#0b5394" }),
            stroke: new Stroke({ color: "white", width: 3 }),
            overflow: true,
          }),
        })
      : base;

  const stateStyle = useMemo(() => labelStyle, [showLabels]);
  const districtStyle = useMemo(() => labelStyle, [showLabels]);
  const blockStyle = useMemo(() => labelStyle, [showLabels]);
  const villageStyle = useMemo(() => labelStyle, [showLabels]);

  const stateBase = useMemo(() => baseStyle("rgba(240, 7, 7, 1)", "rgba(12, 129, 238, 0)"), []);
  const districtBase = useMemo(() => baseStyle("rgba(206, 0, 0, 0.8)", "rgba(255, 136, 0, 0)"), []);
  const blockBase = useMemo(() => baseStyle("rgba(255, 0, 0, 1)", "rgba(247, 225, 28, 0)"), []);
  const villageBase = useMemo(() => baseStyle("rgba(238, 20, 20, 0.8)", "rgba(18, 183, 248, 0)"), []);

  const makeStateStyle = (f: any) => stateStyle(f, stateBase, ["state_name", "state_code"]);
  const makeDistrictStyle = (f: any) => districtStyle(f, districtBase, ["district_name", "DISTRICT_N", "DISTRICT_C"]);
  const makeBlockStyle = (f: any) => blockStyle(f, blockBase, ["block_name", "BLOCK_NAME", "block"]);
  const makeVillageStyle = (f: any) => villageStyle(f, villageBase, ["village_name", "VILL_NAME", "vlcode", "village"], "10px");
  
  // RSQ Style Function - USING API COLORS
  const makeRSQStyle = (feature: any) => {
  console.log('Styling feature:', feature.get('village'), feature.get('Stage_of_Ground_Water_Extraction'));
    const stage = feature.get("Stage_of_Ground_Water_Extraction") || 0;
    const status = feature.get("status") || "No Data";
    
    // Use color from API response, fallback to calculated color
    const apiColor = feature.get("color");
    const fillColor = apiColor || getStageColor(stage);
    
    const style = new Style({
      stroke: new Stroke({ 
        color: "#1e40af", // Dark blue border
        width: 2.5 
      }),
      fill: new Fill({ color: fillColor }),
    });

    if (showLabels) {
      const village = feature.get("village") || feature.get("vlcode") || "Unknown";
      style.setText(
        new Text({
          text: `${village}\n${stage.toFixed(1)}%\n${status}`,
          font: "bold 10px sans-serif",
          fill: new Fill({ color: "#ffffff" }),
          stroke: new Stroke({ color: "#000000", width: 4 }),
          overflow: true,
          offsetY: 0,
        })
      );
    }

    return style;
  };

  // Base map change
  const changeBaseMap = (key: string) => {
    if (!mapRef.current || key === selectedBaseMap) return;
    const def = baseMaps[key as keyof typeof baseMaps];
    if (!def) return;

    if (baseLayerRef.current) mapRef.current.removeLayer(baseLayerRef.current);

    const layer = new TileLayer({ source: def.source(), zIndex: 0 });
    layer.set("name", "basemap");
    baseLayerRef.current = layer;
    mapRef.current.getLayers().insertAt(0, layer);
    setSelectedBaseMap(key);
  };

  // Map init
  useEffect(() => {
    if (!mapContainer || mapRef.current) return;

    const base = new TileLayer({
      source: baseMaps.satellite.source(),
      zIndex: 0,
    });
    base.set("name", "basemap");
    baseLayerRef.current = base;

    const india = new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: "/geoserver/api/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:India&outputFormat=application/json",
      }),
      style: new Style({
        stroke: new Stroke({ color: "#1e88e5", width: 2 }),
        fill: new Fill({ color: "rgba(30,136,229,0.04)" }),
      }),
      zIndex: 1,
      visible: layerVisibility.india, // Set initial visibility
    });
    india.set("name", "india");
    indiaLayerRef.current = india;
    setActiveLayers(prev => ({ ...prev, india: true })); // Mark as active

    const map = new Map({
      target: mapContainer,
      layers: [base, india],
      view: new View({ center: fromLonLat([78.9629, 20.5937]), zoom: 5 }),
      controls: defaultControls({ zoom: true, rotate: false }),
    });

    mapRef.current = map;
    setMapInstance(map);
    map.updateSize();

    // Hover setup remains the same...
    const hoverEl = document.createElement("div");
    hoverEl.className = "ol-hover-popup";
    hoverEl.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid #333;
      padding: 10px 14px;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      font-size: 12px;
      font-weight: 600;
      max-width: 280px;
      min-width: 200px;
    `;
    const overlay = new Overlay({ element: hoverEl, positioning: "bottom-center", offset: [0, -15] });
    map.addOverlay(overlay);
    hoverOverlayRef.current = overlay;

    const highlight = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({ color: "rgba(59, 130, 246, 0.3)" }),
        stroke: new Stroke({ color: "#FFD700", width: 4 }),
      }),
      zIndex: 999,
    });
    highlight.set("name", "highlight-layer");
    map.addLayer(highlight);
    highlightLayerRef.current = highlight;

    map.on("pointermove", (e) => {
      const hs = highlight.getSource()!;
      hs.clear();
      let found = false;

      map.forEachFeatureAtPixel(
        e.pixel,
        (f, l) => {
          if (l?.get("name") === "highlight-layer") return;
          const props = f.getProperties();
          const name =
            props.village ||
            props.VILL_NAME ||
            props.block_name ||
            props.blockname ||
            props.district_name ||
            props.state_name ||
            "";
          
          // Enhanced RSQ info on hover
          let displayText = `<strong>${name}</strong>`;
          if (props.Stage_of_Ground_Water_Extraction !== undefined) {
            const stage = props.Stage_of_Ground_Water_Extraction;
            const status = props.status || getStageCategory(stage);
            const categoryColor = stage <= 70 ? '#22c55e' : stage <= 90 ? '#facc15' : stage <= 100 ? '#fb923c' : '#ef4444';
            
            displayText = `
              <div style="line-height: 1.6;">
                <div style="font-size: 13px; margin-bottom: 6px;"><strong>${name}</strong></div>
                <div style="padding: 4px 0; border-top: 1px solid #ddd;">
                  <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <span>Stage:</span>
                    <strong>${stage.toFixed(1)}%</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                    <span>Category:</span>
                    <strong style="color: ${categoryColor};">${status}</strong>
                  </div>
                  ${props.Total_Extraction ? `
                    <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                      <span>Extraction:</span>
                      <strong>${props.Total_Extraction.toFixed(2)}</strong>
                    </div>
                  ` : ''}
                  ${props.Total_Annual_Ground_Water_Recharge ? `
                    <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                      <span>Recharge:</span>
                      <strong>${props.Total_Annual_Ground_Water_Recharge.toFixed(2)}</strong>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }
          
          if (name) {
            hs.addFeature(f.clone() as Feature<Geometry>);
            hoverEl.innerHTML = displayText;
            overlay.setPosition(e.coordinate);
            found = true;
            map.getTargetElement()!.style.cursor = "pointer";
          }
        },
        { hitTolerance: 5 }
      );

      if (!found) {
        overlay.setPosition(undefined);
        map.getTargetElement()!.style.cursor = "";
      }
    });

    return () => map.setTarget(undefined);
  }, [mapContainer]);

  // State layer
  useEffect(() => {
    const layerName = 'state';
    if (!mapRef.current || !selectedState) {
      removeLayer(stateLayerRef, layerName);
      return;
    }
    removeLayer(stateLayerRef, layerName); // Remove before adding
    const cql = `state_code='${String(selectedState).padStart(2, "0")}'`;
    const url = `http://localhost:9090/geoserver/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:B_State&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    const layer = new VectorLayer({
      source: new VectorSource({ format: new GeoJSON(), url }),
      style: makeStateStyle,
      zIndex: 2,
      visible: layerVisibility.state,
    });
    layer.set("name", "state-layer");
    stateLayerRef.current = layer;
    mapRef.current.addLayer(layer);
    setActiveLayers(prev => ({ ...prev, [layerName]: true }));

    layer.getSource()?.once("featuresloadend", () => {
      const ext = layer.getSource()!.getExtent();
      if (ext[0] < ext[2]) mapRef.current!.getView().fit(ext, { duration: 800, padding: [50, 50, 50, 50] });
    });
  }, [selectedState, layerVisibility.state]);

  // District layer
  useEffect(() => {
    const layerName = 'district';
    if (!mapRef.current || selectedDistricts.length === 0) {
      removeLayer(districtLayerRef, layerName);
      return;
    }
    // Remove district layer and all finer levels
    removeLayer(districtLayerRef, layerName);
    removeLayer(blockLayerRef, 'block');
    removeLayer(villageLayerRef, 'village');
    removeLayer(rsqLayerRef, 'rsq');
    
    removeLayer(stateLayerRef, 'state'); // Hide state boundary when showing district

    const cql = `DISTRICT_C IN (${selectedDistricts.join(",")})`;
    const url = `http://localhost:9090/geoserver/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:B_district&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    const layer = new VectorLayer({
      source: new VectorSource({ format: new GeoJSON(), url }),
      style: makeDistrictStyle,
      zIndex: 3,
      visible: layerVisibility.district,
    });
    layer.set("name", "state-districts");
    districtLayerRef.current = layer;
    mapRef.current.addLayer(layer);
    setActiveLayers(prev => ({ ...prev, [layerName]: true }));

    layer.getSource()?.once("featuresloadend", () => {
      const ext = layer.getSource()!.getExtent();
      if (ext[0] < ext[2]) mapRef.current!.getView().fit(ext, { duration: 800, padding: [50, 50, 50, 50] });
    });
  }, [selectedDistricts, layerVisibility.district]);

  // Block layer
  useEffect(() => {
    const layerName = 'block';
    if (!mapRef.current || selectedBlocks.length === 0) {
      removeLayer(blockLayerRef, layerName);
      return;
    }
    // Remove block layer and all finer levels
    removeLayer(blockLayerRef, layerName);
    removeLayer(villageLayerRef, 'village');
    removeLayer(rsqLayerRef, 'rsq');
    
    removeLayer(stateLayerRef, 'state');
    removeLayer(districtLayerRef, 'district');

    const cql = `Block_LG00 IN (${selectedBlocks.join(",")})`;
    const url = `http://localhost:9090/geoserver/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:block&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    const layer = new VectorLayer({
      source: new VectorSource({ format: new GeoJSON(), url }),
      style: makeBlockStyle,
      zIndex: 4,
      visible: layerVisibility.block,
    });
    layer.set("name", "district-blocks");
    blockLayerRef.current = layer;
    mapRef.current.addLayer(layer);
    setActiveLayers(prev => ({ ...prev, [layerName]: true }));

    layer.getSource()?.once("featuresloadend", () => {
      const ext = layer.getSource()!.getExtent();
      if (ext[0] < ext[2]) mapRef.current!.getView().fit(ext, { duration: 800, padding: [50, 50, 50, 50] });
    });
  }, [selectedBlocks, layerVisibility.block]);

// === VILLAGE LAYER - ONLY SHOW WHEN NO RSQ DATA ===
useEffect(() => {
  const layerName = 'village';
  
  // CRITICAL: Only show village layer if NO RSQ data exists
  const hasRSQData = !!groundWaterData?.features?.length;

  if (!mapRef.current || selectedVillages.length === 0 || hasRSQData) {
    // Remove village layer if RSQ data exists
    removeLayer(villageLayerRef, layerName);
    return;
  }

  console.log('Rendering plain village boundaries (no RSQ data)');

  // Clean up higher levels
  removeLayer(stateLayerRef, 'state');
  removeLayer(districtLayerRef, 'district');
  removeLayer(blockLayerRef, 'block');
  removeLayer(villageLayerRef, layerName); // Remove old

  const codes = selectedVillages.map((c) => `'${c}'`).join(",");
  const cql = `vlcode IN (${codes})`;
  const url = `http://localhost:9090/geoserver/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:Village&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

  const layer = new VectorLayer({
    source: new VectorSource({
      format: new GeoJSON(),
      url,
      strategy: bboxStrategy,
    }),
    style: makeVillageStyle,
    zIndex: 10,
    visible: layerVisibility.village,
  });
  layer.set("name", "villages");
  villageLayerRef.current = layer;
  mapRef.current.addLayer(layer);
  setActiveLayers(prev => ({ ...prev, [layerName]: true }));

  layer.getSource()?.once("featuresloadend", () => {
    const ext = layer.getSource()!.getExtent();
    if (ext && ext[0] < ext[2]) {
      mapRef.current!.getView().fit(ext, {
        duration: 1000,
        padding: [60, 60, 60, 60],
        maxZoom: 17,
      });
    }
  });
}, [selectedVillages.length, groundWaterData, layerVisibility.village]); // ← Add groundWaterData here!

// === RSQ LAYER - FINAL WORKING VERSION (React 18 + StrictMode Safe) ===
useEffect(() => {
  const currentData = useRSQ().groundWaterData; // ← ALWAYS FRESH

  console.log('RSQ LAYER CHECK - FRESH DATA:', {
    features: currentData?.features?.length ?? 0,
    year: currentData?.features?.[0]?.properties?.Year
  });

  if (!mapRef.current) return;

  // Always clean old RSQ + village layers
  if (rsqLayerRef.current) {
    mapRef.current.removeLayer(rsqLayerRef.current);
    rsqLayerRef.current = null;
  }
  if (villageLayerRef.current) {
    mapRef.current.removeLayer(villageLayerRef.current);
    villageLayerRef.current = null;
  }

  if (!currentData?.features?.length) {
    console.log('No RSQ data - showing plain villages if any');
    return;
  }

  console.log('RENDERING', currentData.features.length, 'COLORED VILLAGES');

  const format = new GeoJSON();
  const features = format.readFeatures(currentData, {
    featureProjection: 'EPSG:3857'
  });

  const source = new VectorSource({ features });
  const layer = new VectorLayer({
    source,
    style: makeRSQStyle,
    zIndex: 100,
    opacity: 0.92,
  });
  layer.set('name', 'rsq-colored-layer');
  rsqLayerRef.current = layer;
  mapRef.current.addLayer(layer);

  // Zoom to data
  const extent = source.getExtent();
  if (extent && isFinite(extent[0])) {
    mapRef.current.getView().fit(extent, {
      duration: 1200,
      padding: [100, 100, 100, 100],
      maxZoom: 16
    });
  }

  console.log('RSQ LAYER SUCCESSFULLY ADDED');

}, [/* NO DEPENDENCIES! We read fresh data inside */]);


  const value = useMemo(
    () => ({
      mapInstance,
      selectedBaseMap,
      changeBaseMap,
      setMapContainer,
      isLoading,
      error,
      showLabels,
      toggleLabels,
      layerVisibility,
      toggleLayerVisibility,
      activeLayers, 
    }),
    [mapInstance, selectedBaseMap, isLoading, error, showLabels, layerVisibility, activeLayers]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapContext = (): MapContextType => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
};