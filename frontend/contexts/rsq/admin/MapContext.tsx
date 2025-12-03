"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  ReactNode,
  useState,
  useMemo,
} from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style } from 'ol/style';
import Text from 'ol/style/Text';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { useLocation } from './LocationContext';
import XYZ from 'ol/source/XYZ';

const baseMaps: Record<string, any> = {
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
  cartoLight: {
    name: "Carto Light",
    source: () =>
      new XYZ({
        url: "https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
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
  topo: {
    name: "Topographic",
    source: () =>
      new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
        crossOrigin: "anonymous",
      }),
  },
};

interface MapContextType {
  mapInstance: Map | null;
  selectedBaseMap: string;
  changeBaseMap: (baseMapKey: string) => void;
  setMapContainer: (container: HTMLDivElement | null) => void;
  isLoading: boolean;
  error: string | null;
  showLabels: boolean;
  toggleLabels: () => void;
}

interface MapProviderProps {
  children: ReactNode;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const mapInstanceRef = useRef<Map | null>(null);
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [selectedBaseMap, setSelectedBaseMap] = useState<string>("satellite");

  const { selectedState, selectedDistricts, selectedBlocks, selectedVillages } = useLocation();

  const toggleLabels = () => setShowLabels((s) => !s);

  const stateBaseStyle = useMemo(
    () =>
      new Style({
        stroke: new Stroke({ color: 'rgba(219, 15, 15, 0.86)', width: 2 }),
        fill: new Fill({ color: 'rgba(0, 0, 0, 0.71)' }),
      }),
    []
  );

  // Base styles
  const districtBaseStyle = useMemo(
    () =>
      new Style({
        stroke: new Stroke({ color: 'rgba(206, 0, 0, 0.8)', width: 2 }),
        fill: new Fill({ color: 'rgba(253, 253, 253, 0.81)' }),
      }),
    []
  );

  const blockBaseStyle = useMemo(
    () =>
      new Style({
        stroke: new Stroke({ color: 'rgba(100,0,0,0.8)', width: 2 }),
        fill: new Fill({ color: 'rgba(100, 0, 0, 0.1)' }),
      }),
    []
  );

  const villageBaseStyle = useMemo(
    () =>
      new Style({
        stroke: new Stroke({ color: 'rgba(100,100,0,0.8)', width: 1.5 }),
        fill: new Fill({ color: 'rgba(100, 100, 0, 0.1)' }),
      }),
    []
  );

  // Style functions
  const makeDistrictStyleFn = useMemo(
    () => (feature: any) => {
      if (!showLabels) return districtBaseStyle;
      const txt = String(
        feature.get('district_name') ||
        feature.get('DISTRICT_N') ||
        feature.get('district_code') ||
        feature.get('DISTRICT_C') ||
        ''
      );
      return new Style({
        stroke: new Stroke({ color: 'rgba(0,100,0,0.8)', width: 2 }),
        fill: new Fill({ color: 'rgba(0, 100, 0, 0.1)' }),
        text: new Text({
          text: txt,
          font: '600 12px sans-serif',
          fill: new Fill({ color: '#0b5394' }),
          stroke: new Stroke({ color: 'white', width: 3 }),
          overflow: true,
        }),
      });
    },
    [showLabels, districtBaseStyle]
  );

  const makeBlockStyleFn = useMemo(
    () => (feature: any) => {
      if (!showLabels) return blockBaseStyle;
      const txt = String(
        feature.get('block_name') ||
        feature.get('BLOCK_NAME') ||
        feature.get('block_code') ||
        feature.get('blockcode') ||
        feature.get('block') ||
        ''
      );
      return new Style({
        stroke: new Stroke({ color: 'rgba(100,0,0,0.8)', width: 2 }),
        fill: new Fill({ color: 'rgba(100, 0, 0, 0.1)' }),
        text: new Text({
          text: txt,
          font: '600 12px sans-serif',
          fill: new Fill({ color: '#0b5394' }),
          stroke: new Stroke({ color: 'white', width: 3 }),
          overflow: true,
        }),
      });
    },
    [showLabels, blockBaseStyle]
  );

  const makeVillageStyleFn = useMemo(
    () => (feature: any) => {
      if (!showLabels) return villageBaseStyle;
      const txt = String(
        feature.get('village_name') ||
        feature.get('VILL_NAME') ||
        feature.get('village_code') ||
        feature.get('vlcode') ||
        feature.get('village') ||
        ''
      );
      return new Style({
        stroke: new Stroke({ color: 'rgba(100,100,0,0.8)', width: 1.5 }),
        fill: new Fill({ color: 'rgba(100, 100, 0, 0.1)' }),
        text: new Text({
          text: txt,
          font: '600 10px sans-serif',
          fill: new Fill({ color: '#0b5394' }),
          stroke: new Stroke({ color: 'white', width: 2 }),
          overflow: true,
        }),
      });
    },
    [showLabels, villageBaseStyle]
  );

  const changeBaseMap = (baseMapKey: string) => {
    if (!mapInstanceRef.current) return;
    if (baseMapKey === selectedBaseMap) return;

    const baseMapDef = baseMaps[baseMapKey];
    if (!baseMapDef) return;

    const map = mapInstanceRef.current;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }

    const newBaseLayer = new TileLayer({
      source: baseMapDef.source(),
      zIndex: 0,
    });
    newBaseLayer.set('name', 'basemap');
    baseLayerRef.current = newBaseLayer;
    map.getLayers().insertAt(0, newBaseLayer);
    setSelectedBaseMap(baseMapKey);
  };

  const removeLayerIfPresent = (layerRef: React.MutableRefObject<VectorLayer<any> | null>) => {
    const map = mapInstanceRef.current;
    if (map && layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
  };

  // Map initialization (unchanged)
  useEffect(() => {
    if (!mapContainer) return;
    if (mapInstanceRef.current) return;

    console.log('Initializing map...');

    try {
      const base = new TileLayer({
        source: baseMaps.satellite.source(),
        zIndex: 0,
      });
      base.set('name', 'basemap');
      baseLayerRef.current = base;

      const indiaLayer = new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: '/geoserver/api/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:India&outputFormat=application/json',
        }),
        style: new Style({
          stroke: new Stroke({ color: '#1e88e5', width: 2 }),
          fill: new Fill({ color: 'rgba(30,136,229,0.04)' }),
        }),
        zIndex: 1,
      });
      indiaLayer.set('name', 'india');
      indiaLayerRef.current = indiaLayer;

      const map = new Map({
        target: mapContainer,
        layers: [base, indiaLayer],
        view: new View({
          center: fromLonLat([78.9629, 20.5937]),
          zoom: 5,
        }),
      });

      mapInstanceRef.current = map;
      setMapInstance(map);

      setTimeout(() => {
        map.updateSize();
        console.log('Map initialized successfully');
      }, 100);

      const handleResize = () => map.updateSize();
      window.addEventListener('resize', handleResize);
      setupHoverInteraction(map);

      return () => {
        window.removeEventListener('resize', handleResize);
        map.setTarget(undefined);
        mapInstanceRef.current = null;
        setMapInstance(null);
      };
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    }
  }, [mapContainer]);

  // Setup hover interaction (unchanged)
  const setupHoverInteraction = (map: Map) => {
    const hoverElement = document.createElement('div');
    hoverElement.className = 'ol-hover-popup';

    const hoverOverlay = new Overlay({
      element: hoverElement,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10],
    });

    map.addOverlay(hoverOverlay);
    hoverOverlayRef.current = hoverOverlay;

    const highlightLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
        stroke: new Stroke({ color: '#FFD700', width: 3 }),
      }),
      zIndex: 999,
    });
    highlightLayer.set('name', 'highlight-layer');
    map.addLayer(highlightLayer);
    highlightLayerRef.current = highlightLayer;

    map.on('pointermove', (event: any) => {
      const highlightSource = highlightLayer.getSource();
      if (highlightSource) highlightSource.clear();

      let foundFeature = false;

      map.forEachFeatureAtPixel(
        event.pixel,
        (feature, layer) => {
          const layerName = layer?.get('name');
          if (layerName === 'highlight-layer') return false;

          const properties = feature.getProperties();
          let label = '';

          switch (layerName) {
            case 'india':
              label = properties.STATE || properties.state_name;
              break;
            case 'state-layer':
              label = properties.STATE || properties.state_name;
              break;
            case 'state-districts':
              label = properties.DISTRICT_N || properties.district_name;
              break;
            case 'district-blocks':
              label = properties.BLOCK_NAME || properties.block_name || properties.block;
              break;
            case 'villages':
              label = properties.VILL_NAME || properties.village_name || properties.village || properties.vlcode;
              break;
          }

          if (label) {
            if (highlightSource && feature instanceof Feature) {
              const cloned = feature.clone() as Feature<Geometry>;
              highlightSource.addFeature(cloned);
            }

            hoverElement.textContent = label;
            hoverOverlay.setPosition(event.coordinate);
            foundFeature = true;
            map.getTargetElement()!.style.cursor = 'pointer';
            return true;
          }
          return false;
        },
        { layerFilter: (l) => l.get('name') !== 'highlight-layer', hitTolerance: 5 }
      );

      if (!foundFeature) {
        hoverOverlay.setPosition(undefined);
        map.getTargetElement()!.style.cursor = '';
      }
    });
  };

  // ✅ FIXED: State layer - B_State uses state_code (string) with diagnostics
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedState) {
      removeLayerIfPresent(stateLayerRef);
      removeLayerIfPresent(districtLayerRef);
      removeLayerIfPresent(blockLayerRef);
      removeLayerIfPresent(villageLayerRef);
      return;
    }

    console.log('🔍 selectedState:', selectedState, typeof selectedState, 'Length:', String(selectedState).length);

    // Pad to 2 digits (common for India state codes: '09' not '9')
    const paddedStateCode = String(selectedState).padStart(2, '0');
    const cql = `state_code='${paddedStateCode}'`;

    const url = `/geoserver/api/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:B_State&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    console.log('🌟 State CQL:', cql);
    console.log('🌟 Full WFS URL:', url);

    // 🔍 DIAGNOSTIC: Test without filter to see available data
    const unfilteredUrl = `/geoserver/api/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:B_State&outputFormat=application/json&maxFeatures=5`;
    fetch(unfilteredUrl)
      .then(r => r.json())
      .then(data => {
        console.log('📊 All states sample (first 5):', data);
        if (data.features.length > 0) {
          console.log('🔍 Available state_code values:',
            data.features.map((f: any) => f.properties?.state_code || 'MISSING')
          );
        }
      })
      .catch(err => console.error('❌ Unfiltered request failed:', err));

    removeLayerIfPresent(stateLayerRef);

    const layer = new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url
      }),
      style: makeDistrictStyleFn,
      declutter: true,
      zIndex: 2,
    });
    layer.set('name', 'state-layer');
    stateLayerRef.current = layer;
    map.addLayer(layer);

    // Monitor loading
    const src = layer.getSource();
    if (src) {
      src.on('featuresloadstart', () => {
        console.log('⏳ Loading state features...');
        setIsLoading(true);
      });

      src.once('featuresloadend', (event) => {
        console.log('✅ State features loaded:', event.target.getFeatures().length);
        setIsLoading(false);

        const extent = src.getExtent();
        if (extent && extent[0] < extent[2]) {
          map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 800 });
        } else {
          console.warn('⚠️ Invalid extent, no zoom applied');
        }
      });

      src.once('featuresloaderror', (error) => {
        console.error('❌ State features load error:', error);
        setError('Failed to load state layer');
        setIsLoading(false);
      });
    }

    return () => {
      removeLayerIfPresent(stateLayerRef);
      setIsLoading(false);
    };
  }, [selectedState, makeDistrictStyleFn]);


  // ✅ FIXED: District layer - B_district uses DISTRICT_C (numeric)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || selectedDistricts.length === 0) {
      removeLayerIfPresent(districtLayerRef);
      removeLayerIfPresent(blockLayerRef);
      removeLayerIfPresent(villageLayerRef);
      return;
    }

    removeLayerIfPresent(districtLayerRef);

    const codes = selectedDistricts.join(',');
    const cql = `DISTRICT_C IN (${codes})`; // ✅ Numeric, no quotes
    const url = `/geoserver/api/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:B_district&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    console.log('🌟 District CQL:', cql);

    const layer = new VectorLayer({
      source: new VectorSource({ format: new GeoJSON(), url }),
      style: makeDistrictStyleFn,
      declutter: true,
      zIndex: 3,
    });
    layer.set('name', 'state-districts');
    districtLayerRef.current = layer;
    map.addLayer(layer);

    const src = layer.getSource();
    if (src) {
      src.once('featuresloadend', () => {
        const extent = src.getExtent();
        if (extent && extent[0] < extent[2]) {
          map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 800 });
        }
      });
    }

    return () => removeLayerIfPresent(districtLayerRef);
  }, [selectedDistricts, makeDistrictStyleFn]);

  // ✅ FIXED: Block layer - uses Block_LG00 (numeric)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || selectedBlocks.length === 0) {
      removeLayerIfPresent(blockLayerRef);
      removeLayerIfPresent(villageLayerRef);
      return;
    }

    removeLayerIfPresent(blockLayerRef);

    const codes = selectedBlocks.join(',');
    const cql = `Block_LG00 IN (${codes})`; // ✅ Correct field name, numeric
    const url = `/geoserver/api/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:block&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    console.log('🌟 Block CQL:', cql);

    const layer = new VectorLayer({
      source: new VectorSource({ format: new GeoJSON(), url }),
      style: makeBlockStyleFn,
      declutter: true,
      zIndex: 4,
    });
    layer.set('name', 'district-blocks');
    blockLayerRef.current = layer;
    map.addLayer(layer);

    const src = layer.getSource();
    if (src) {
      src.once('featuresloadend', () => {
        const extent = src.getExtent();
        if (extent && extent[0] < extent[2]) {
          map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 800 });
        }
      });
    }

    return () => removeLayerIfPresent(blockLayerRef);
  }, [selectedBlocks, makeBlockStyleFn]);

  // ✅ FIXED: Village layer - uses selectedVillages vlcode (string)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || selectedVillages.length === 0) { // ✅ FIXED: selectedVillages
      removeLayerIfPresent(villageLayerRef);
      return;
    }

    removeLayerIfPresent(villageLayerRef);

    const vlCodes = selectedVillages.map(code => `'${code}'`).join(','); // ✅ String quotes for vlcode
    const cql = `vlcode IN (${vlCodes})`;
    const url = `/geoserver/api/myworkspace/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:Village&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    console.log('🌟 Village CQL:', cql);

    const layer = new VectorLayer({
      source: new VectorSource({ format: new GeoJSON(), url }),
      style: makeVillageStyleFn,
      declutter: true,
      zIndex: 5,
    });
    layer.set('name', 'villages');
    villageLayerRef.current = layer;
    map.addLayer(layer);

    const src = layer.getSource();
    if (src) {
      src.once('featuresloadend', () => {
        const extent = src.getExtent();
        if (extent && extent[0] < extent[2]) {
          map.getView().fit(extent, { padding: [60, 60, 60, 60], duration: 800 });
        }
      });
    }

    return () => removeLayerIfPresent(villageLayerRef);
  }, [selectedVillages, makeVillageStyleFn]);

  // Refresh styles on label toggle
  useEffect(() => {
    [stateLayerRef, districtLayerRef, blockLayerRef, villageLayerRef].forEach((layerRef) => {
      if (layerRef.current) {
        if (layerRef === stateLayerRef || layerRef === districtLayerRef) {
          layerRef.current.setStyle(makeDistrictStyleFn);
        } else if (layerRef === blockLayerRef) {
          layerRef.current.setStyle(makeBlockStyleFn);
        } else if (layerRef === villageLayerRef) {
          layerRef.current.setStyle(makeVillageStyleFn);
        }
        layerRef.current.changed();
      }
    });
  }, [showLabels, makeDistrictStyleFn, makeBlockStyleFn, makeVillageStyleFn]);

  const contextValue = useMemo(
    () => ({
      mapInstance,
      setMapContainer,
      selectedBaseMap,
      isLoading,
      error,
      showLabels,
      toggleLabels,
      changeBaseMap,
    }),
    [mapInstance, isLoading, error, showLabels, selectedBaseMap]
  );

  return <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>;
  };

  export const useMapContext = (): MapContextType => {
    const context = useContext(MapContext);
    if (!context) {
      throw new Error('useMapContext must be used within a MapProvider');
    }
    return context;
  };
