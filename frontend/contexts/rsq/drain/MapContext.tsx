"use client";
import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  ReactNode,
  useState,
} from "react";
import Map from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Stroke, Fill, Text, Circle as CircleStyle } from "ol/style";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { useLocation } from "@/contexts/groundwater_assessment/drain/LocationContext";

// GeoServer configuration
const GEOSERVER_BASE_URL = "/geoserver/api/myworkspace/wfs";

// Base maps
interface BaseMapDefinition {
  name: string;
  source: () => OSM | XYZ;
}
const baseMaps: Record<string, BaseMapDefinition> = {
  osm: {
    name: "OpenStreetMap",
    source: () => new OSM({ crossOrigin: "anonymous" }),
  },
  terrain: {
    name: "Stamen Terrain",
    source: () =>
      new XYZ({
        url: "https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg",
        maxZoom: 19,
        crossOrigin: "anonymous",
      }),
  },
  satellite: {
    name: "Satellite",
    source: () =>
      new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
        crossOrigin: "anonymous",
      }),
  },
};

// Styles
const basinBoundaryStyle = new Style({
  stroke: new Stroke({
    color: "#6f11119d",
    width: 3,
  }),
  fill: new Fill({ color: "rgba(0, 0, 0, 0)" }),
});

const riverStyle = new Style({
  stroke: new Stroke({
    color: "#1E40AF",
    width: 3,
  }),
});

const stretchStyle = new Style({
  stroke: new Stroke({
    color: "#7C3AED",
    width: 2,
  }),
});

const selectedStretchStyle = new Style({
  stroke: new Stroke({
    color: "#EF4444",
    width: 4,
  }),
});

const drainStyle = new Style({
  stroke: new Stroke({
    color: "#059669",
    width: 2,
  }),
});

const selectedDrainStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: "#FF6B35" }),
    stroke: new Stroke({ color: "#FFFFFF", width: 2 }),
  }),
});

const catchmentStyle = new Style({
  stroke: new Stroke({
    color: "#DC2626",
    width: 1,
  }),
  fill: new Fill({
    color: "rgba(220, 38, 38, 0.1)",
  }),
});

const villageStyle = new Style({
  stroke: new Stroke({
    color: "#F59E0B",
    width: 1,
  }),
  fill: new Fill({
    color: "rgba(245, 158, 11, 0.1)",
  }),
});

const selectedVillageStyle = new Style({
  stroke: new Stroke({
    color: "#F59E0B",
    width: 2,
  }),
  fill: new Fill({
    color: "rgba(245, 158, 11, 0.4)",
  }),
});

const villageOverlayStyle = new Style({
  stroke: new Stroke({
    color: "rgba(255, 255, 255, 0.8)",
    width: 1,
  }),
  fill: new Fill({
    color: "rgba(255, 255, 255, 0.05)",
  }),
});

// Label helpers
const createStretchLabelStyle = (text: string) => {
  return new Style({
    text: new Text({
      text: text,
      font: "11px Arial, sans-serif",
      fill: new Fill({ color: "#1F2937" }),
      stroke: new Stroke({ color: "#FFFFFF", width: 3 }),
      placement: "line",
      textAlign: "center",
      maxAngle: Math.PI / 4,
      overflow: false,
    }),
  });
};

const createVillageLabelStyle = (text: string) => {
  return new Style({
    text: new Text({
      text: text,
      font: "12px Calibri,sans-serif",
      fill: new Fill({ color: "#000000" }),
      stroke: new Stroke({ color: "#FFFFFF", width: 3 }),
      offsetY: -10,
    }),
  });
};

// Context Interface - Only essential
interface MapContextType {
  mapInstance: Map | null;
  selectedBaseMap: string;
  showLabels: boolean;
  setMapContainer: (container: HTMLDivElement | null) => void;
  changeBaseMap: (baseMapKey: string) => void;
  toggleLabels: () => void;
  zoomToCurrentExtent: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mapInstanceRef = useRef<Map | null>(null);
  const baseLayerRef = useRef<TileLayer<any> | null>(null);

  // Drainage layer refs
  const basinBoundaryLayerRef = useRef<VectorLayer<any> | null>(null);
  const riversLayerRef = useRef<VectorLayer<any> | null>(null);
  const stretchesLayerRef = useRef<VectorLayer<any> | null>(null);
  const drainsLayerRef = useRef<VectorLayer<any> | null>(null);
  const catchmentsLayerRef = useRef<VectorLayer<any> | null>(null);
  const villagesLayerRef = useRef<VectorLayer<any> | null>(null);
  const villageOverlayLayerRef = useRef<VectorLayer<any> | null>(null);

  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [selectedBaseMap, setSelectedBaseMap] = useState<string>("osm");
  const [showLabels, setShowLabels] = useState(true);

  const {
    selectedRiver,
    selectedStretch,
    selectedDrain,
    selectedCatchments,
    selectedVillages,
  } = useLocation();

  // Hover overlay
  const hoverOverlayRef = useRef<Overlay | null>(null);
  const highlightLayerRef = useRef<VectorLayer<any> | null>(null);

  // Progressive labeling for stretches
  const shouldShowStretchLabel = (stretchId: number, zoom: number) => {
    if (!showLabels) return false;
    if (zoom >= 13) return true;
    if (zoom >= 11) return stretchId % 2 === 1;
    if (zoom >= 9) return stretchId % 3 === 1;
    return true;
  };

  // Map initialization
  useEffect(() => {
    if (!mapContainer || mapInstanceRef.current) return;

    const baseLayer = new TileLayer({
      source: baseMaps.osm.source(),
      zIndex: 0,
    });
    baseLayerRef.current = baseLayer;

    const map = new Map({
      target: mapContainer,
      layers: [baseLayer],
      view: new View({
        center: fromLonLat([82.378970, 25.539697]),
        zoom: 9.7,
      }),
    });
    mapInstanceRef.current = map;

    // Permanent layers
    const addPermanentLayer = (
      name: string,
      typeName: string,
      style: Style | ((f: any) => Style | Style[]),
      zIndex: number,
      ref: React.MutableRefObject<VectorLayer<any> | null>
    ) => {
      const layer = new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: `${GEOSERVER_BASE_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:${typeName}&outputFormat=application/json&CQL_FILTER=1=1`,
        }),
        style,
        zIndex,
      });
      layer.set('name', name);
      layer.set('permanent', true);
      ref.current = layer;
      map.addLayer(layer);
    };

    // Basin
    addPermanentLayer('basin-boundary', 'basin_boundary', basinBoundaryStyle, 1, basinBoundaryLayerRef);

    // Rivers
    addPermanentLayer('rivers', 'Rivers', riverStyle, 10, riversLayerRef);

    // Stretches
    const stretchesLayer = new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: `${GEOSERVER_BASE_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:Stretches&outputFormat=application/json&CQL_FILTER=1=1`,
      }),
      style: (feature) => {
        const id = feature.get('Stretch_ID');
        const base = id === selectedStretch ? selectedStretchStyle : stretchStyle;
        const zoom = map.getView().getZoom() || 0;
        if (shouldShowStretchLabel(id, zoom)) {
          return [base, createStretchLabelStyle(`S-${id}`)];
        }
        return base;
      },
      zIndex: 11,
    });
    stretchesLayer.set('name', 'stretches');
    stretchesLayer.set('permanent', true);
    stretchesLayerRef.current = stretchesLayer;
    map.addLayer(stretchesLayer);

    // Refresh stretch labels on zoom
    map.getView().on('change:resolution', () => stretchesLayer.changed());

    // Drains
    const drainsLayer = new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: `${GEOSERVER_BASE_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:Drain&outputFormat=application/json&CQL_FILTER=1=1`,
      }),
      style: (feature) => {
        return feature.get('Drain_No') === selectedDrain ? selectedDrainStyle : drainStyle;
      },
      zIndex: 12,
    });
    drainsLayer.set('name', 'drains');
    drainsLayer.set('permanent', true);
    drainsLayerRef.current = drainsLayer;
    map.addLayer(drainsLayer);

    // Zoom to basin after load
    basinBoundaryLayerRef.current?.getSource()?.once('featuresloadend', () => {
      setTimeout(() => {
        const extent = basinBoundaryLayerRef.current?.getSource()?.getExtent();
        if (extent && !extent.includes(Infinity)) {
          map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
        }
      }, 500);
    });

    // Hover functionality
    const hoverElement = document.createElement('div');
    hoverElement.style.cssText = `
      background: white; padding: 6px 10px; border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-size: 13px; pointer-events: none;
      border: 1px solid #3B82F6; font-weight: 600;
    `;
    const hoverOverlay = new Overlay({
      element: hoverElement,
      positioning: 'bottom-center',
      offset: [0, -10],
    });
    map.addOverlay(hoverOverlay);
    hoverOverlayRef.current = hoverOverlay;

    const highlightSource = new VectorSource();
    const highlightLayer = new VectorLayer({
      source: highlightSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
        stroke: new Stroke({ color: '#fffb00ff', width: 3 }),
      }),
      zIndex: 999,
    });
    map.addLayer(highlightLayer);
    highlightLayerRef.current = highlightLayer;

    map.on('pointermove', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f, l) => ({ f, l }), {
        layerFilter: (l) => l !== highlightLayer,
        hitTolerance: 5,
      });

      highlightSource.clear();

      if (feature && feature.f.getGeometry()?.getType() !== 'Point') {
        highlightSource.addFeature(new Feature(feature.f.getGeometry()));
        hoverElement.textContent =
          feature.l.get('name') === 'villages' || feature.l.get('name') === 'village-overlay'
            ? feature.f.get('shapeName') || feature.f.get('village') || 'Village'
            : feature.l.get('name') === 'stretches'
            ? `Stretch S-${feature.f.get('Stretch_ID')}`
            : feature.l.get('name') === 'drains'
            ? `Drain ${feature.f.get('Drain_No')}`
            : feature.l.get('name') === 'catchments'
            ? `Catchment (Drain ${feature.f.get('Drain_No')})`
            : feature.l.get('name') === 'rivers'
            ? feature.f.get('River_Name') || 'River'
            : '';
        hoverOverlay.setPosition(evt.coordinate);
        map.getTargetElement().style.cursor = 'pointer';
      } else {
        hoverOverlay.setPosition(undefined);
        map.getTargetElement().style.cursor = '';
      }
    });

    return () => {
      map.setTarget(undefined);
    };
  }, [mapContainer]);

  // Update stretch & drain highlighting on selection
  useEffect(() => {
    if (!stretchesLayerRef.current) return;
    stretchesLayerRef.current.setStyle((feature) => {
      const id = feature.get('Stretch_ID');
      const base = id === selectedStretch ? selectedStretchStyle : stretchStyle;
      const zoom = mapInstanceRef.current?.getView().getZoom() || 0;
      if (shouldShowStretchLabel(id, zoom)) {
        return [base, createStretchLabelStyle(`S-${id}`)];
      }
      return base;
    });
    stretchesLayerRef.current.changed();
  }, [selectedStretch, showLabels]);

  useEffect(() => {
    if (!drainsLayerRef.current) return;
    drainsLayerRef.current.setStyle((feature) =>
      feature.get('Drain_No') === selectedDrain ? selectedDrainStyle : drainStyle
    );
    drainsLayerRef.current.changed();
  }, [selectedDrain]);

  // Catchments - only when drain selected
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (catchmentsLayerRef.current) {
      mapInstanceRef.current.removeLayer(catchmentsLayerRef.current);
      catchmentsLayerRef.current = null;
    }
    if (selectedDrain) {
      const layer = new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: `${GEOSERVER_BASE_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:Catchment&outputFormat=application/json&CQL_FILTER=Drain_No=${selectedDrain}`,
        }),
        style: catchmentStyle,
        zIndex: 13,
      });
      layer.set('name', 'catchments');
      catchmentsLayerRef.current = layer;
      mapInstanceRef.current.addLayer(layer);

      layer.getSource()?.once('featuresloadend', () => {
        const extent = layer.getSource()?.getExtent();
        if (extent && !extent.includes(Infinity)) {
          mapInstanceRef.current?.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
        }
      });
    }
  }, [selectedDrain]);

  // Villages - only when selected
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (villagesLayerRef.current) {
      mapInstanceRef.current.removeLayer(villagesLayerRef.current);
      villagesLayerRef.current = null;
    }
    if (villageOverlayLayerRef.current) {
      mapInstanceRef.current.removeLayer(villageOverlayLayerRef.current);
      villageOverlayLayerRef.current = null;
    }

    if (selectedVillages.length > 0) {
      const filter = selectedVillages.map(v => `'${v}'`).join(',');
      const cql = `village_co IN (${filter})`;

      const layer = new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: `${GEOSERVER_BASE_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:Village&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`,
        }),
        style: (f) => {
          const code = f.get('village_co');
          const base = selectedVillages.includes(Number(code)) ? selectedVillageStyle : villageStyle;
          if (showLabels) {
            return [base, createVillageLabelStyle(f.get('shapeName') || `Village ${code}`)];
          }
          return base;
        },
        zIndex: 14,
      });
      layer.set('name', 'villages');
      villagesLayerRef.current = layer;
      mapInstanceRef.current.addLayer(layer);
    }
  }, [selectedVillages, showLabels]);

  const changeBaseMap = (key: string) => {
    if (!mapInstanceRef.current || !baseLayerRef.current) return;
    mapInstanceRef.current.removeLayer(baseLayerRef.current);
    const newLayer = new TileLayer({ source: baseMaps[key].source(), zIndex: 0 });
    baseLayerRef.current = newLayer;
    mapInstanceRef.current.getLayers().insertAt(0, newLayer);
    setSelectedBaseMap(key);
  };

  const toggleLabels = () => setShowLabels(prev => !prev);

  const zoomToCurrentExtent = () => {
    if (!mapInstanceRef.current) return;
    const layers = [
      catchmentsLayerRef.current,
      villagesLayerRef.current,
      drainsLayerRef.current,
      stretchesLayerRef.current,
      riversLayerRef.current,
      basinBoundaryLayerRef.current,
    ];
    const target = layers.find(l => l && l.getVisible() && l.getSource()?.getFeatures().length > 0);
    if (target) {
      const extent = target.getSource()?.getExtent();
      if (extent && !extent.includes(Infinity)) {
        mapInstanceRef.current.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
      }
    }
  };

  const contextValue: MapContextType = {
    mapInstance: mapInstanceRef.current,
    selectedBaseMap,
    showLabels,
    setMapContainer,
    changeBaseMap,
    toggleLabels,
    zoomToCurrentExtent,
  };

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = (): MapContextType => {
  const context = useContext(MapContext);
  if (!context) throw new Error("useMap must be used within MapProvider");
  return context;
};