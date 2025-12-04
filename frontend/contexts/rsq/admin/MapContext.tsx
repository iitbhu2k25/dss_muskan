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

  const { selectedState, selectedDistricts, selectedBlocks, selectedVillages } =
    useLocation();
  const { groundWaterData } = useRSQ();

  const toggleLabels = () => setShowLabels((v) => !v);

  const removeLayer = (ref: React.MutableRefObject<VectorLayer<any> | null>) => {
    if (mapRef.current && ref.current) {
      mapRef.current.removeLayer(ref.current);
      ref.current = null;
    }
  };

  // RSQ Category Colors based on Stage of Ground Water Extraction
  const getStageColor = (stage: number): string => {
    if (stage <= 70) return "rgba(34, 197, 94, 0.7)"; // Safe - Green
    if (stage <= 90) return "rgba(250, 204, 21, 0.7)"; // Semi-Critical - Yellow
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
  const villageBase = useMemo(() => baseStyle("rgba(238, 20, 20, 0.8)", "rgba(18, 183, 248, 0.6)"), []);

  const makeStateStyle = (f: any) => labelStyle(f, stateBase, ["state_name", "state_code"]);
  const makeDistrictStyle = (f: any) => labelStyle(f, districtBase, ["district_name", "DISTRICT_N", "DISTRICT_C"]);
  const makeBlockStyle = (f: any) => labelStyle(f, blockBase, ["block_name", "BLOCK_NAME", "block"]);
  const makeVillageStyle = (f: any) => labelStyle(f, villageBase, ["village_name", "VILL_NAME", "vlcode", "village"], "10px");

  // RSQ Style Function - ENHANCED
  const makeRSQStyle = (feature: any) => {
    const stage = feature.get("Stage_of_Ground_Water_Extraction") || 0;
    const fillColor = getStageColor(stage);
    
    const style = new Style({
      stroke: new Stroke({ 
        color: "rgba(0, 16, 239, 0.99)", 
        width: 2.5 
      }),
      fill: new Fill({ color: fillColor }),
    });

    if (showLabels) {
      const village = feature.get("village") || feature.get("vlcode") || "Unknown";
      const category = getStageCategory(stage);
      style.setText(
        new Text({
          text: `${village}\n${stage.toFixed(1)}%\n(${category})`,
          font: "bold 10px sans-serif",
          fill: new Fill({ color: "#09f904ff" }),
          stroke: new Stroke({ color: "white", width: 3 }),
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
    });
    india.set("name", "india");
    indiaLayerRef.current = india;

    const map = new Map({
      target: mapContainer,
      layers: [base, india],
      view: new View({ center: fromLonLat([78.9629, 20.5937]), zoom: 5 }),
      controls: defaultControls({ zoom: true, rotate: false }),
    });

    mapRef.current = map;
    setMapInstance(map);
    map.updateSize();

    // Hover
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
            const category = getStageCategory(stage);
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
                    <strong style="color: ${categoryColor};">${category}</strong>
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
    if (!mapRef.current || !selectedState) {
      [stateLayerRef, districtLayerRef, blockLayerRef, villageLayerRef, rsqLayerRef].forEach(removeLayer);
      return;
    }
    removeLayer(stateLayerRef);
    const cql = `state_code='${String(selectedState).padStart(2, "0")}'`;
    const url = `http://localhost:9090/geoserver/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:B_State&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    const layer = new VectorLayer({
      source: new VectorSource({ format: new GeoJSON(), url }),
      style: makeStateStyle,
      zIndex: 2,
    });
    layer.set("name", "state-layer");
    stateLayerRef.current = layer;
    mapRef.current.addLayer(layer);

    layer.getSource()?.once("featuresloadend", () => {
      const ext = layer.getSource()!.getExtent();
      if (ext[0] < ext[2]) mapRef.current!.getView().fit(ext, { duration: 800, padding: [50, 50, 50, 50] });
    });
  }, [selectedState]);

  // District layer
  useEffect(() => {
    if (!mapRef.current || selectedDistricts.length === 0) {
      [districtLayerRef, blockLayerRef, villageLayerRef, rsqLayerRef].forEach(removeLayer);
      return;
    }
    removeLayer(stateLayerRef);
    removeLayer(districtLayerRef);
    const cql = `DISTRICT_C IN (${selectedDistricts.join(",")})`;
    const url = `http://localhost:9090/geoserver/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:B_district&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    const layer = new VectorLayer({
      source: new VectorSource({ format: new GeoJSON(), url }),
      style: makeDistrictStyle,
      zIndex: 3,
    });
    layer.set("name", "state-districts");
    districtLayerRef.current = layer;
    mapRef.current.addLayer(layer);

    layer.getSource()?.once("featuresloadend", () => {
      const ext = layer.getSource()!.getExtent();
      if (ext[0] < ext[2]) mapRef.current!.getView().fit(ext, { duration: 800, padding: [50, 50, 50, 50] });
    });
  }, [selectedDistricts]);

  // Block layer
  useEffect(() => {
    if (!mapRef.current || selectedBlocks.length === 0) {
      [blockLayerRef, villageLayerRef, rsqLayerRef].forEach(removeLayer);
      return;
    }
    removeLayer(stateLayerRef);
    removeLayer(districtLayerRef);
    removeLayer(blockLayerRef);
    const cql = `Block_LG00 IN (${selectedBlocks.join(",")})`;
    const url = `http://localhost:9090/geoserver/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:block&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    const layer = new VectorLayer({
      source: new VectorSource({ format: new GeoJSON(), url }),
      style: makeBlockStyle,
      zIndex: 4,
    });
    layer.set("name", "district-blocks");
    blockLayerRef.current = layer;
    mapRef.current.addLayer(layer);

    layer.getSource()?.once("featuresloadend", () => {
      const ext = layer.getSource()!.getExtent();
      if (ext[0] < ext[2]) mapRef.current!.getView().fit(ext, { duration: 800, padding: [50, 50, 50, 50] });
    });
  }, [selectedBlocks]);

  // Village layer
  useEffect(() => {
    if (!mapRef.current || selectedVillages.length === 0) {
      removeLayer(villageLayerRef);
      return;
    }
    removeLayer(stateLayerRef);
    removeLayer(districtLayerRef);
    removeLayer(blockLayerRef);
    removeLayer(villageLayerRef);

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
    });
    layer.set("name", "villages");
    villageLayerRef.current = layer;
    mapRef.current.addLayer(layer);

    layer.getSource()?.once("featuresloadend", () => {
      const ext = layer.getSource()!.getExtent();
      if (ext[0] < ext[2]) {
        mapRef.current!.getView().fit(ext, {
          duration: 1000,
          padding: [60, 60, 60, 60],
          maxZoom: 17,
        });
      }
    });
  }, [selectedVillages]);

  // RSQ Layer - FIXED RENDERING
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Always remove existing RSQ layer first
    removeLayer(rsqLayerRef);
    
    if (!groundWaterData || !groundWaterData.features || groundWaterData.features.length === 0) {
      console.log('🗺️ No RSQ data to display');
      return;
    }

    console.log('🗺️ Rendering RSQ layer with features:', groundWaterData.features.length);
    
    if (groundWaterData.features.length > 0) {
      console.log('🗺️ First feature sample:', {
        properties: groundWaterData.features[0].properties,
        geometry: groundWaterData.features[0].geometry,
        geometryType: groundWaterData.features[0].geometry?.type,
      });
    }

    // Remove other layers when RSQ data loads
    removeLayer(stateLayerRef);
    removeLayer(districtLayerRef);
    removeLayer(blockLayerRef);
    removeLayer(villageLayerRef);

    try {
      // Create GeoJSON reader with proper projection settings
      const geojsonFormat = new GeoJSON({
        dataProjection: 'EPSG:4326', // Input data is in WGS84
        featureProjection: 'EPSG:3857', // Map uses Web Mercator
      });

      // Read features from the GeoJSON data
      const features = geojsonFormat.readFeatures(groundWaterData);
      
      console.log('🗺️ Parsed features:', features.length);
      
      if (features.length === 0) {
        console.error('🗺️ No features parsed from GeoJSON!');
        return;
      }

      // Log first feature details
      if (features.length > 0) {
        const firstFeature = features[0];
        console.log('🗺️ First parsed feature:', {
          geometry: firstFeature.getGeometry()?.getType(),
          extent: firstFeature.getGeometry()?.getExtent(),
          properties: firstFeature.getProperties(),
          stage: firstFeature.get('Stage_of_Ground_Water_Extraction'),
        });
      }

      // Create vector source with features
      const source = new VectorSource({
        features: features,
      });

      // Create the RSQ layer with enhanced styling
      const layer = new VectorLayer({
        source,
        style: makeRSQStyle,
        zIndex: 15,
        opacity: 0.85,
      });

      layer.set("name", "rsq-layer");
      rsqLayerRef.current = layer;
      mapRef.current.addLayer(layer);

      console.log('🗺️ RSQ layer added to map');

      // Fit to RSQ data extent
      const extent = source.getExtent();
      console.log('🗺️ Source extent:', extent);
      
      if (extent && extent[0] !== Infinity && isFinite(extent[0]) && extent[0] < extent[2]) {
        console.log('🗺️ Fitting map to extent:', extent);
        mapRef.current.getView().fit(extent, {
          duration: 1000,
          padding: [80, 80, 80, 80],
          maxZoom: 13,
        });
      } else {
        console.warn('🗺️ Invalid extent, cannot fit to view:', extent);
      }

      // Force map refresh
      mapRef.current.render();
      
    } catch (error) {
      console.error('🗺️ Error creating RSQ layer:', error);
      console.error('🗺️ Error details:', error instanceof Error ? error.message : String(error));
    }
  }, [groundWaterData, showLabels]);

  // Label toggle refresh
  useEffect(() => {
    [stateLayerRef, districtLayerRef, blockLayerRef, villageLayerRef, rsqLayerRef].forEach((ref) => {
      ref.current?.changed();
    });
  }, [showLabels]);

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
    }),
    [mapInstance, selectedBaseMap, isLoading, error, showLabels]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapContext = (): MapContextType => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
};