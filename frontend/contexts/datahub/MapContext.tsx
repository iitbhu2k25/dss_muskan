'use client';
import React, { createContext, useContext, useRef, useEffect, ReactNode, useState, useMemo } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import Overlay from 'ol/Overlay';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';
import { useShapefile } from './Section1Context';
import { BaseMapDefinition } from '@/components/MapComponents';

const GEOSERVER_URL = 'http://localhost:9090/geoserver/wms';
const WORKSPACE = 'myworkspace';

const baseMaps: Record<string, BaseMapDefinition> = {
    osm: { name: 'OpenStreetMap', source: () => new OSM({ crossOrigin: 'anonymous' }), icon: '' },
    satellite: {
        name: 'Satellite',
        source: () =>
            new XYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                maxZoom: 19,
                crossOrigin: 'anonymous',
            }),
        icon: '',
    },
};

interface FeatureInfo {
    properties: Record<string, any>;
    layerName: string;
}

interface MapContextType {
    mapInstance: Map | null;
    selectedBaseMap: string;
    changeBaseMap: (key: string) => void;
    mapContainerRef: React.RefObject<HTMLDivElement | null>;
    popupRef: React.RefObject<HTMLDivElement | null>;
    featureInfo: FeatureInfo | null;
    setFeatureInfo: (info: FeatureInfo | null) => void;
    isLoading: boolean;
    error: string | null;
    showLabels: boolean;
    toggleLabels: () => void;
    filteredFeatures: any[];
    setFilteredFeatures: (features: any[]) => void;
    applyFilterToWMS: (filters: Record<string, string[]>) => void;
}

interface MapProviderProps {
    children: ReactNode;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
    const { selectedShapefile } = useShapefile();

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const baseLayerRef = useRef<TileLayer<any> | null>(null);
    const wmsLayerRef = useRef<TileLayer<TileWMS> | null>(null);
    const overlayRef = useRef<Overlay | null>(null);

    const [mapInstance, setMapInstance] = useState<Map | null>(null);
    const [selectedBaseMap, setSelectedBaseMap] = useState('osm');
    const [featureInfo, setFeatureInfo] = useState<FeatureInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLabels, setShowLabels] = useState(false);
    const [filteredFeatures, setFilteredFeatures] = useState<any[]>([]);
    const [currentFilters, setCurrentFilters] = useState<Record<string, string[]>>({});

    const toggleLabels = () => setShowLabels((s) => !s);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        setIsLoading(true);
        try {
            const baseLayer = new TileLayer({
                source: baseMaps[selectedBaseMap].source(),
                zIndex: 0,
            });
            baseLayer.set('name', 'basemap');
            baseLayerRef.current = baseLayer;

            const map = new Map({
                target: mapContainerRef.current,
                layers: [baseLayer],
                view: new View({
                    center: fromLonLat([78.9629, 20.5937]),
                    zoom: 5,
                }),
            });

            mapRef.current = map;
            setMapInstance(map);
            setIsLoading(false);
            console.log('✓ Map initialized');
        } catch (err) {
            console.error('Map initialization error:', err);
            setError('Failed to initialize map');
            setIsLoading(false);
        }
    }, []);

    // Popup overlay
    useEffect(() => {
        if (!mapInstance || !popupRef.current || overlayRef.current) return;
        const overlay = new Overlay({
            element: popupRef.current,
            autoPan: { animation: { duration: 250 } },
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -10],
        });
        mapInstance.addOverlay(overlay);
        overlayRef.current = overlay;
        console.log('✓ Popup overlay added');
    }, [mapInstance]);

    // Click handler for GetFeatureInfo
    useEffect(() => {
        if (!mapInstance || !wmsLayerRef.current) return;
        const wmsSource = wmsLayerRef.current.getSource();
        if (!wmsSource) return;

        const handleClick = async (evt: any) => {
            const resolution = mapInstance.getView().getResolution();
            if (!resolution) return;

            const url = wmsSource.getFeatureInfoUrl(evt.coordinate, resolution, 'EPSG:3857', {
                INFO_FORMAT: 'application/json',
            });
            if (!url) return;

            try {
                const res = await fetch(url);
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                    setFeatureInfo({
                        properties: data.features[0].properties,
                        layerName: selectedShapefile?.shapefile_name || 'Layer',
                    });
                    overlayRef.current?.setPosition(evt.coordinate);
                } else {
                    setFeatureInfo(null);
                    overlayRef.current?.setPosition(undefined);
                }
            } catch (err) {
                console.error('GetFeatureInfo error:', err);
            }
        };

        mapInstance.on('singleclick', handleClick);
        return () => mapInstance.un('singleclick', handleClick);
    }, [mapInstance, wmsLayerRef.current, selectedShapefile]);

    // Change basemap
    const changeBaseMap = (key: string) => {
        if (!mapInstance || key === selectedBaseMap) return;
        if (baseLayerRef.current) {
            mapInstance.removeLayer(baseLayerRef.current);
        }
        const newLayer = new TileLayer({
            source: baseMaps[key].source(),
            zIndex: 0,
        });
        newLayer.set('name', 'basemap');
        baseLayerRef.current = newLayer;
        mapInstance.getLayers().insertAt(0, newLayer);
        setSelectedBaseMap(key);
        console.log(`✓ Basemap changed to: ${key}`);
    };

    // Add WMS layer based on selected shapefile
    useEffect(() => {
        if (!mapInstance || !selectedShapefile) return;

        // Remove existing WMS layer
        if (wmsLayerRef.current) {
            mapInstance.removeLayer(wmsLayerRef.current);
            wmsLayerRef.current = null;
            setFeatureInfo(null);
            overlayRef.current?.setPosition(undefined);
        }

        // Reset filters when shapefile changes
        setCurrentFilters({});
        setFilteredFeatures([]);

        try {
            const layerName = selectedShapefile.shapefile_path
                .split('/')
                .pop()
                ?.replace('.shp', '') || selectedShapefile.shapefile_name;

            console.log(`🗺️ Loading WMS layer: ${WORKSPACE}:${layerName}`);

            const wmsSource = new TileWMS({
                url: GEOSERVER_URL,
                params: {
                    LAYERS: `${WORKSPACE}:${layerName}`,
                    TILED: true,
                    VERSION: '1.1.0',
                    STYLES: '',
                },
                serverType: 'geoserver',
                crossOrigin: 'anonymous',
            });

            const wmsLayer = new TileLayer({
                source: wmsSource,
                zIndex: 5,
                opacity: 0.8,
            });
            wmsLayer.set('name', 'wms-layer');
            mapInstance.addLayer(wmsLayer);
            wmsLayerRef.current = wmsLayer;

            // Apply any existing filters (in case they persist)
            if (Object.keys(currentFilters).length > 0) {
                applyFilterToWMS(currentFilters);
            }

            console.log('✓ WMS layer added to map');
            setError(null);
        } catch (err) {
            console.error('WMS layer error:', err);
            setError('Failed to load WMS layer');
        }
    }, [mapInstance, selectedShapefile]);

    // Apply filters to WMS layer
    const applyFilterToWMS = (filters: Record<string, string[]>) => {
        if (!wmsLayerRef.current || !selectedShapefile) {
            console.warn('⚠️ Cannot apply filter: no WMS layer or shapefile');
            return;
        }

        const layerName = selectedShapefile.shapefile_path
            .split('/')
            .pop()
            ?.replace('.shp', '') || selectedShapefile.shapefile_name;

        const wmsSource = wmsLayerRef.current.getSource() as TileWMS;

        // Build CQL filter
        const cqlArray: string[] = [];
        Object.keys(filters).forEach((key) => {
            const values = filters[key];
            if (values && values.length > 0) {
                // Handle numeric and string values appropriately
                const formattedValues = values.map((v) => {
                    const isNumeric = !isNaN(Number(v)) && v !== 'N/A' && v !== '';
                    return isNumeric ? v : `'${String(v).replace(/'/g, "''")}'`;
                });
                const valStr = formattedValues.join(',');
                cqlArray.push(`"${key}" IN (${valStr})`);
            }
        });

        const cqlFilter = cqlArray.length > 0 ? cqlArray.join(' AND ') : null;

        console.log('🔍 Applying CQL Filter:', cqlFilter || 'NONE (showing all features)');

        // Store current filters
        setCurrentFilters(filters);

        // Build new parameters
        const newParams: any = {
            LAYERS: `${WORKSPACE}:${layerName}`,
            TILED: true,
            VERSION: '1.1.0',
            STYLES: '',
            timestamp: Date.now(), // Force cache refresh
        };

        // Only add CQL_FILTER if there are actual filters
        if (cqlFilter) {
            newParams.CQL_FILTER = cqlFilter;
        } else {
            newParams.CQL_FILTER = null; // Explicitly clear filter
        }

        // Update WMS source parameters
        wmsSource.updateParams(newParams);

        // Force immediate refresh
        wmsSource.refresh();
        if (mapInstance) {
            mapInstance.renderSync(); // Ensure map redraws immediately
            console.log('✅ Map rendered with new filter');
        }

        console.log('✅ WMS layer updated with new filter');
    };

    const value = useMemo(
        () => ({
            mapInstance,
            selectedBaseMap,
            changeBaseMap,
            mapContainerRef,
            popupRef,
            featureInfo,
            setFeatureInfo,
            isLoading,
            error,
            showLabels,
            toggleLabels,
            filteredFeatures,
            setFilteredFeatures,
            applyFilterToWMS,
        }),
        [mapInstance, selectedBaseMap, featureInfo, isLoading, error, showLabels, filteredFeatures]
    );

    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMap = (): MapContextType => {
    const ctx = useContext(MapContext);
    if (!ctx) throw new Error('useMap must be used within MapProvider');
    return ctx;
};