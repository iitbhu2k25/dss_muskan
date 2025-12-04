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

  // RSQ Category Colors
  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      "Safe": "rgba(34, 197, 94, 0.6)",
      "Semi-Critical": "rgba(234, 179, 8, 0.6)",
      "Critical": "rgba(249, 115, 22, 0.6)",
      "Over-Exploited": "rgba(239, 68, 68, 0.6)",
    };
    return colors[category] || "rgba(156, 163, 175, 0.6)";
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
          stroke: base.getStroke(),
          fill: base.getFill(),
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

  // RSQ Style Function
  const makeRSQStyle = (feature: any) => {
    const category = feature.get("CATEGORY") || "Unknown";
    const fillColor = getCategoryColor(category);
    const gwStage = feature.get("GW_STAGE") || 0;
    
    const style = new Style({
      stroke: new Stroke({ color: "rgba(0, 0, 0, 0.8)", width: 1.5 }),
      fill: new Fill({ color: fillColor }),
    });

    if (showLabels) {
      const village = feature.get("village") || feature.get("vlcode");
      style.setText(
        new Text({
          text: `${village}\n${gwStage.toFixed(1)}%`,
          font: "600 10px sans-serif",
          fill: new Fill({ color: "#1f2937" }),
          stroke: new Stroke({ color: "white", width: 3 }),
          overflow: true,
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
    const overlay = new Overlay({ element: hoverEl, positioning: "bottom-center", offset: [0, -10] });
    map.addOverlay(overlay);
    hoverOverlayRef.current = overlay;

    const highlight = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({ color: "rgba(59, 130, 246, 0.2)" }),
        stroke: new Stroke({ color: "#FFD700", width: 3 }),
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
            props.district_name ||
            props.state_name ||
            "";
          
          // Show additional RSQ info on hover
          let displayText = name;
          if (props.CATEGORY) {
            displayText += `\n${props.CATEGORY} (${props.GW_STAGE?.toFixed(1)}%)`;
          }
          
          if (name) {
            hs.addFeature(f.clone() as Feature<Geometry>);
            hoverEl.innerHTML = displayText.replace('\n', '<br>');
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

  // RSQ Layer - RENDER GROUNDWATER DATA
  useEffect(() => {
    if (!mapRef.current || !groundWaterData) {
      removeLayer(rsqLayerRef);
      return;
    }

    console.log('🗺️ Rendering RSQ layer with features:', groundWaterData.features.length);

    // Remove previous layers when RSQ data loads
    removeLayer(stateLayerRef);
    removeLayer(districtLayerRef);
    removeLayer(blockLayerRef);
    removeLayer(villageLayerRef);
    removeLayer(rsqLayerRef);

    const source = new VectorSource({
      features: new GeoJSON().readFeatures(groundWaterData, {
        featureProjection: "EPSG:3857",
      }),
    });

    const layer = new VectorLayer({
      source,
      style: makeRSQStyle,
      zIndex: 15,
    });

    layer.set("name", "rsq-layer");
    rsqLayerRef.current = layer;
    mapRef.current.addLayer(layer);

    // Fit to RSQ data extent
    const extent = source.getExtent();
    if (extent[0] < extent[2]) {
      mapRef.current.getView().fit(extent, {
        duration: 1000,
        padding: [60, 60, 60, 60],
        maxZoom: 14,
      });
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