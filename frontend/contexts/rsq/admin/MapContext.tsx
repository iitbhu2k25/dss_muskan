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
import { Geometry, Polygon } from "ol/geom";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import { defaults as defaultControls } from "ol/control";
import { useLocation } from "./LocationContext";
import { useRSQ } from "./RsqContext";

const baseMaps = {
  osm: {
    name: "OpenStreetMap",
    source: () => new OSM({ crossOrigin: "anonymous" }),
  },
  openstreet: {
    name: "OpenStreet Standard",
    source: () =>
      new XYZ({
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        crossOrigin: "anonymous",
      }),
  },
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
  activeLayers: Record<string, boolean>;
  activeRSQYear: string | null;
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
  const [selectedBaseMap, setSelectedBaseMap] = useState("openstreet");
  const [activeRSQYear, setActiveRSQYear] = useState<string | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    india: true,
    state: true,
    district: true,
    block: true,
    village: true,
    rsq: true,
  });

  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({});

  const { selectedState, selectedDistricts, selectedBlocks, selectedVillages } = useLocation();
  const { groundWaterData, selectedYear } = useRSQ();

  const toggleLabels = () => setShowLabels((v) => !v);

  // Hide layer without removing from map
  const hideLayer = (ref: React.MutableRefObject<VectorLayer<any> | null>) => {
    if (ref.current) {
      ref.current.setVisible(false);
    }
  };

  // Remove layer completely
  const removeLayer = (ref: React.MutableRefObject<VectorLayer<any> | null>, layerName: string) => {
    if (mapRef.current && ref.current) {
      console.log(`🗺️ Removing layer: ${layerName}`);
      mapRef.current.removeLayer(ref.current);
      ref.current = null;
    }
  };

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

  const makeStateStyle = (f: any) => stateStyle(f, stateBase, ["state_name", "state_code"]);
  const makeDistrictStyle = (f: any) => districtStyle(f, districtBase, ["district_name", "DISTRICT_N", "DISTRICT_C"]);
  const makeBlockStyle = (f: any) => blockStyle(f, blockBase, ["block_name", "BLOCK_NAME", "block"]);
  const makeVillageStyle = (f: any) => villageStyle(f, villageBase, ["village_name", "VILL_NAME", "vlcode", "village"], "10px");

  // RSQ Style Function - PROPERLY USING API COLOR
  const makeRSQStyle = (feature: any) => {
    const stage = feature.get("Stage_of_Ground_Water_Extraction") || 0;
    const status = feature.get("status") || "No Data";
    const color = feature.get("color") || "#999999";

    const style = new Style({
      stroke: new Stroke({
        color: "#1e40af",
        width: 2.5
      }),
      fill: new Fill({
        color: color
      }),
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

  // Map initialization
  useEffect(() => {
    if (!mapContainer || mapRef.current) return;

    const base = new TileLayer({
      source: baseMaps.openstreet.source(),
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
      visible: layerVisibility.india,
    });
    india.set("name", "india");
    indiaLayerRef.current = india;
    setActiveLayers(prev => ({ ...prev, india: true }));

    const map = new Map({
      target: mapContainer,
      layers: [base, india],
      view: new View({ center: fromLonLat([78.9629, 20.5937]), zoom: 5 }),
      controls: defaultControls({ zoom: true, rotate: false }),
    });

    mapRef.current = map;
    setMapInstance(map);
    map.updateSize();

    // Hover setup
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

          let displayText = `<strong>${name}</strong>`;
          if (props.Stage_of_Ground_Water_Extraction !== undefined) {
            const stage = props.Stage_of_Ground_Water_Extraction;
            const status = props.status || "No Data";
            const year = props.Year || selectedYear;
            const color = props.color || "#999999";

            displayText = `
              <div style="line-height: 1.6;">
                <div style="font-size: 13px; margin-bottom: 6px;"><strong>${name}</strong></div>
                <div style="padding: 4px 0; border-top: 1px solid #ddd;">
                  <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <span>Year:</span>
                    <strong>${year}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <span>Stage:</span>
                    <strong>${stage.toFixed(1)}%</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                    <span>Category:</span>
                    <strong style="color: ${color};">${status}</strong>
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
      if (stateLayerRef.current) {
        hideLayer(stateLayerRef);
      }
      return;
    }

    if (stateLayerRef.current) {
      mapRef.current.removeLayer(stateLayerRef.current);
    }

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
      if (districtLayerRef.current) {
        hideLayer(districtLayerRef);
      }
      return;
    }

    hideLayer(stateLayerRef);

    if (districtLayerRef.current) {
      mapRef.current.removeLayer(districtLayerRef.current);
    }

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
      if (blockLayerRef.current) {
        hideLayer(blockLayerRef);
      }
      return;
    }

    hideLayer(stateLayerRef);
    hideLayer(districtLayerRef);

    if (blockLayerRef.current) {
      mapRef.current.removeLayer(blockLayerRef.current);
    }

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

  // Village layer
  useEffect(() => {
    const layerName = 'village';
    console.log('🗺️ Village:', selectedVillages.length, 'RSQ:', !!groundWaterData?.features?.length);

    if (!mapRef.current || selectedVillages.length === 0) {
      if (villageLayerRef.current) {
        removeLayer(villageLayerRef, 'village');
        setActiveLayers(prev => ({ ...prev, village: false }));
      }
      return;
    }

    // If RSQ data exists, don't create village layer at all
    if (groundWaterData && groundWaterData.features && groundWaterData.features.length > 0) {
      console.log('🚫 RSQ active - skipping village layer');
      if (villageLayerRef.current) {
        removeLayer(villageLayerRef, 'village');
      }
      setActiveLayers(prev => ({ ...prev, village: false }));
      return;
    }

    // Create village layer only if no RSQ data
    hideLayer(stateLayerRef);
    hideLayer(districtLayerRef);
    hideLayer(blockLayerRef);

    if (villageLayerRef.current) {
      mapRef.current.removeLayer(villageLayerRef.current);
    }

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
      if (ext[0] < ext[2]) {
        mapRef.current!.getView().fit(ext, {
          duration: 1000,
          padding: [60, 60, 60, 60],
          maxZoom: 17,
        });
      }
    });
  }, [selectedVillages, groundWaterData?.features?.length, layerVisibility.village]);

  // RSQ Layer - STANDARD GEOJSON 4326 FORMAT
// RSQ Layer - COMPLETE DEBUG VERSION
useEffect(() => {
  console.log('='.repeat(50));
  console.log('🎯 RSQ LAYER EFFECT TRIGGERED');
  console.log('='.repeat(50));
  console.log('groundWaterData:', groundWaterData);
  console.log('groundWaterData type:', typeof groundWaterData);
  console.log('features count:', groundWaterData?.features?.length);
  console.log('selectedYear:', selectedYear);
  console.log('mapRef.current:', !!mapRef.current);
  console.log('layerVisibility.rsq:', layerVisibility.rsq);

  if (!mapRef.current) {
    console.log('❌ NO MAP INSTANCE');
    return;
  }

  // Remove old layer
  if (rsqLayerRef.current) {
    console.log('🗑️ Removing old RSQ layer');
    mapRef.current.removeLayer(rsqLayerRef.current);
    rsqLayerRef.current = null;
    setActiveLayers(prev => ({ ...prev, rsq: false }));
  }

  // Check if we have data
  if (!groundWaterData || !groundWaterData.features || groundWaterData.features.length === 0) {
    console.log('❌ NO RSQ DATA AVAILABLE');
    setActiveLayers(prev => ({ ...prev, rsq: false }));
    setActiveRSQYear(null);
    
    // Show village layer back
    if (selectedVillages.length > 0 && villageLayerRef.current) {
      console.log('🔄 Showing village layer back');
      villageLayerRef.current.setVisible(true);
      setActiveLayers(prev => ({ ...prev, village: true }));
    }
    return;
  }

  // We have data - proceed
  console.log('✅ RSQ DATA AVAILABLE - PROCEEDING');
  console.log('Raw data sample:', JSON.stringify(groundWaterData.features[0]).substring(0, 300));

  try {
    // Hide village layer FIRST
    if (villageLayerRef.current) {
      console.log('🚫 Hiding village layer');
      villageLayerRef.current.setVisible(false);
      setActiveLayers(prev => ({ ...prev, village: false }));
    }

    // Create GeoJSON format
    console.log('📊 Creating GeoJSON format reader');
    const geojsonFormat = new GeoJSON({
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });

    // Read features
    console.log('📖 Reading features from GeoJSON');
    const features = geojsonFormat.readFeatures(groundWaterData);
    console.log('✅ Features read:', features.length);

    if (features.length === 0) {
      console.error('❌ NO FEATURES PARSED!');
      return;
    }

    // Debug first feature
    const firstFeature = features[0];
    const geom = firstFeature.getGeometry();
    console.log('🔍 FIRST FEATURE DEBUG:');
    console.log('  - Village:', firstFeature.get('village'));
    console.log('  - Color:', firstFeature.get('color'));
    console.log('  - Status:', firstFeature.get('status'));
    console.log('  - Stage:', firstFeature.get('Stage_of_Ground_Water_Extraction'));
    console.log('  - Geometry type:', geom?.getType());
    console.log('  - Geometry extent:', geom?.getExtent());
    console.log('  - All properties:', firstFeature.getProperties());

    // Create source
    console.log('📦 Creating VectorSource');
    const source = new VectorSource({ features });
    
    // Create layer
    console.log('🗺️ Creating VectorLayer');
    const rsqLayer = new VectorLayer({
      source: source,
      style: makeRSQStyle,
      zIndex: 20,
      opacity: 0.9,
      visible: true, // FORCE VISIBLE
    });

    rsqLayer.set("name", "rsq-layer");
    
    // Add to map
    console.log('➕ Adding RSQ layer to map');
    mapRef.current.addLayer(rsqLayer);
    rsqLayerRef.current = rsqLayer;

    // Update state
    console.log('📝 Updating active layers state');
    setActiveLayers(prev => {
      const updated = { ...prev, rsq: true };
      console.log('Active layers updated:', updated);
      return updated;
    });
    setActiveRSQYear(selectedYear);

    console.log('✅ RSQ LAYER SUCCESSFULLY ADDED TO MAP!');

    // Get extent and fit
    const extent = source.getExtent();
    console.log('📍 Source extent:', extent);

    if (extent && isFinite(extent[0]) && isFinite(extent[1])) {
      console.log('🔍 Fitting map to extent');
      mapRef.current.getView().fit(extent, {
        duration: 1000,
        padding: [100, 100, 100, 100],
        maxZoom: 16,
      });
      console.log('✅ Map fitted to extent');
    } else {
      console.warn('⚠️ Invalid extent:', extent);
    }

    // Verify layer was added
    const allLayers = mapRef.current.getLayers().getArray();
    console.log('📋 All layers on map:', allLayers.map(l => l.get('name')));
    console.log('📋 RSQ layer visible?', rsqLayer.getVisible());
    console.log('📋 RSQ layer opacity:', rsqLayer.getOpacity());
    console.log('📋 RSQ layer zIndex:', rsqLayer.getZIndex());

  } catch (err) {
    console.error('❌ RSQ LAYER CREATION FAILED');
    console.error('Error:', err);
    console.error('Stack:', err instanceof Error ? err.stack : 'No stack');
  }

  console.log('='.repeat(50));
}, [groundWaterData, selectedYear, layerVisibility.rsq, selectedVillages.length]);
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
    layerVisibility,
    toggleLayerVisibility,
    activeLayers,
    activeRSQYear,
  }),
  [mapInstance, selectedBaseMap, isLoading, error, showLabels, layerVisibility, activeLayers, activeRSQYear]
);
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapContext = (): MapContextType => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
};