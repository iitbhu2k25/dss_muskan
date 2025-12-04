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

  const toggleLabels = () => setShowLabels((v) => !v);

  const removeLayer = (ref: React.MutableRefObject<VectorLayer<any> | null>) => {
    if (mapRef.current && ref.current) {
      mapRef.current.removeLayer(ref.current);
      ref.current = null;
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
          ...base.getStroke(),
          ...base.getFill(),
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
          if (name) {
            hs.addFeature(f.clone() as Feature<Geometry>);
            hoverEl.textContent = name;
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
      [stateLayerRef, districtLayerRef, blockLayerRef, villageLayerRef].forEach(removeLayer);
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
      [districtLayerRef, blockLayerRef, villageLayerRef].forEach(removeLayer);
      return;
    }
    removeLayer(stateLayerRef); // Remove state when district loads
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
      [blockLayerRef, villageLayerRef].forEach(removeLayer);
      return;
    }
    removeLayer(stateLayerRef); // Remove state when block loads
    removeLayer(districtLayerRef); // Remove district when block loads
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

  // Village layer - FINAL WORKING
  useEffect(() => {
    if (!mapRef.current || selectedVillages.length === 0) {
      removeLayer(villageLayerRef);
      return;
    }
    removeLayer(stateLayerRef); // Remove state when village loads
    removeLayer(districtLayerRef); // Remove district when village loads
    removeLayer(blockLayerRef); // Remove block when village loads
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

  // Label toggle refresh
  useEffect(() => {
    [stateLayerRef, districtLayerRef, blockLayerRef, villageLayerRef].forEach((ref) => {
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