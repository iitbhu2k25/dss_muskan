'use client';
import React, { createContext, useContext, useRef, useEffect, ReactNode, useState, useMemo } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Overlay from 'ol/Overlay';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle, RegularShape } from 'ol/style';
import { useShapefile } from './Section1Context';

export interface LayerStyle {
    shape: 'circle' | 'square' | 'triangle' | 'star' | 'cross' | 'flag' | 'diamond';
    color: string;
    size: number;
    opacity: number;
    strokeColor: string;
    strokeWidth: number;
}

interface BaseMapDefinition {
    name: string;
    source: () => any;
    icon: string;
    label: string;
}

const GEOSERVER_WFS_URL = 'http://localhost:9090/geoserver/wfs';
const WORKSPACE = 'myworkspace';

const baseMaps: Record<string, BaseMapDefinition> = {
    osm: { 
        name: 'OpenStreetMap', 
        source: () => new OSM({ crossOrigin: 'anonymous' }), 
        icon: '',
        label: 'Street'
    },
    satellite: {
        name: 'Satellite',
        source: () => new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19,
            crossOrigin: 'anonymous',
        }),
        icon: '',
        label: 'Satellite'
    },
    positron: {
        name: 'CartoDB Positron',
        source: () => new XYZ({
            url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
            maxZoom: 19,
            crossOrigin: 'anonymous',
        }),
        icon: '',
        label: 'Light'
    },
    dark: {
        name: 'CartoDB Dark Matter',
        source: () => new XYZ({
            url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
            maxZoom: 19,
            crossOrigin: 'anonymous',
        }),
        icon: '',
        label: 'Dark'
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
    baseMaps: Record<string, BaseMapDefinition>;
    layerStyle: LayerStyle;
    updateLayerStyle: (style: LayerStyle) => void;
    geometryType: string | null;
    hoveredFeature: any;
}

interface MapProviderProps {
    children: ReactNode;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

const DEFAULT_STYLE: LayerStyle = {
    shape: 'star',
    color: '#3B82F6',
    size: 15,
    opacity: 0.8,
    strokeColor: '#1E40AF',
    strokeWidth: 2
};

const createOLStyle = (styleConfig: LayerStyle, isHovered: boolean = false): Style => {
    const { shape, color, size, opacity, strokeColor, strokeWidth } = styleConfig;
    
    const fill = new Fill({
        color: isHovered ? `${color}ff` : `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
    });
    
    const stroke = new Stroke({
        color: strokeColor,
        width: isHovered ? strokeWidth + 2 : strokeWidth
    });

    const finalSize = isHovered ? size * 1.3 : size;

    switch (shape) {
        case 'circle':
            return new Style({
                image: new Circle({
                    radius: finalSize / 2,
                    fill: fill,
                    stroke: stroke
                })
            });
        case 'square':
            return new Style({
                image: new RegularShape({
                    fill: fill,
                    stroke: stroke,
                    points: 4,
                    radius: finalSize / 2,
                    angle: Math.PI / 4
                })
            });
        case 'triangle':
            return new Style({
                image: new RegularShape({
                    fill: fill,
                    stroke: stroke,
                    points: 3,
                    radius: finalSize / 2,
                    rotation: 0,
                    angle: 0
                })
            });
        case 'star':
            return new Style({
                image: new RegularShape({
                    fill: fill,
                    stroke: stroke,
                    points: 5,
                    radius: finalSize / 2,
                    radius2: (finalSize / 2) * 0.4,
                    angle: 0
                })
            });
        case 'cross':
            return new Style({
                image: new RegularShape({
                    fill: fill,
                    stroke: stroke,
                    points: 4,
                    radius: finalSize / 2,
                    radius2: 0,
                    angle: 0
                })
            });
        case 'diamond':
            return new Style({
                image: new RegularShape({
                    fill: fill,
                    stroke: stroke,
                    points: 4,
                    radius: finalSize / 2,
                    angle: 0
                })
            });
        case 'flag':
            return new Style({
                image: new RegularShape({
                    fill: fill,
                    stroke: stroke,
                    points: 3,
                    radius: finalSize / 2,
                    rotation: Math.PI / 2,
                    angle: 0
                })
            });
        default:
            return new Style({
                image: new Circle({
                    radius: finalSize / 2,
                    fill: fill,
                    stroke: stroke
                })
            });
    }
};

const createPolygonStyle = (styleConfig: LayerStyle, isHovered: boolean = false): Style => {
    const { color, opacity, strokeColor, strokeWidth } = styleConfig;
    
    return new Style({
        fill: new Fill({
            color: isHovered 
                ? `${color}${Math.round(Math.min(opacity * 1.5, 1) * 255).toString(16).padStart(2, '0')}`
                : `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
        }),
        stroke: new Stroke({
            color: strokeColor,
            width: isHovered ? strokeWidth + 1 : strokeWidth
        })
    });
};

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
    const { selectedShapefile } = useShapefile();

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const baseLayerRef = useRef<TileLayer<any> | null>(null);
    const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const overlayRef = useRef<Overlay | null>(null);
    const hoveredFeatureRef = useRef<any>(null);

    const [mapInstance, setMapInstance] = useState<Map | null>(null);
    const [selectedBaseMap, setSelectedBaseMap] = useState('osm');
    const [featureInfo, setFeatureInfo] = useState<FeatureInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLabels, setShowLabels] = useState(false);
    const [filteredFeatures, setFilteredFeatures] = useState<any[]>([]);
    const [currentFilters, setCurrentFilters] = useState<Record<string, string[]>>({});
    const [layerStyle, setLayerStyle] = useState<LayerStyle>(DEFAULT_STYLE);
    const [geometryType, setGeometryType] = useState<string | null>(null);
    const [hoveredFeature, setHoveredFeature] = useState<any>(null);

    const toggleLabels = () => setShowLabels((s) => !s);

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
                controls: [],
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

    const updateLayerStyle = (newStyle: LayerStyle) => {
        setLayerStyle(newStyle);
        
        if (vectorLayerRef.current) {
            vectorLayerRef.current.setStyle((feature) => {
                const geomType = feature.getGeometry()?.getType();
                if (geomType === 'Point' || geomType === 'MultiPoint') {
                    return createOLStyle(newStyle, hoveredFeatureRef.current === feature);
                } else {
                    return createPolygonStyle(newStyle, hoveredFeatureRef.current === feature);
                }
            });
            vectorLayerRef.current.changed();
            console.log('✓ Layer style updated');
        }
    };

    useEffect(() => {
        if (!mapInstance || !selectedShapefile) return;

        if (vectorLayerRef.current) {
            mapInstance.removeLayer(vectorLayerRef.current);
            vectorLayerRef.current = null;
            setFeatureInfo(null);
            overlayRef.current?.setPosition(undefined);
            setGeometryType(null);
            hoveredFeatureRef.current = null;
            setHoveredFeature(null);
        }

        setCurrentFilters({});
        setFilteredFeatures([]);

        try {
            const layerName = selectedShapefile.shapefile_path
                .split('/')
                .pop()
                ?.replace('.shp', '') || selectedShapefile.shapefile_name;

            console.log(`🗺️ Loading WFS layer: ${WORKSPACE}:${layerName}`);

            const wfsUrl = `${GEOSERVER_WFS_URL}?service=WFS&version=1.1.0&request=GetFeature&typename=${WORKSPACE}:${layerName}&outputFormat=application/json&srsname=EPSG:3857`;

            const vectorSource = new VectorSource({
                format: new GeoJSON(),
                url: wfsUrl,
            });

            const vectorLayer = new VectorLayer({
                source: vectorSource,
                zIndex: 5,
                style: (feature) => {
                    const geomType = feature.getGeometry()?.getType();
                    if (geomType === 'Point' || geomType === 'MultiPoint') {
                        return createOLStyle(layerStyle, hoveredFeatureRef.current === feature);
                    } else {
                        return createPolygonStyle(layerStyle, hoveredFeatureRef.current === feature);
                    }
                }
            });

            vectorLayer.set('name', 'vector-layer');
            mapInstance.addLayer(vectorLayer);
            vectorLayerRef.current = vectorLayer;

            vectorSource.once('change', () => {
                if (vectorSource.getState() === 'ready') {
                    const features = vectorSource.getFeatures();
                    if (features.length > 0) {
                        const geom = features[0].getGeometry();
                        const geomType = geom?.getType();
                        setGeometryType(geomType || null);
                        console.log(`✓ Geometry type detected: ${geomType}`);
                        
                        const extent = vectorSource.getExtent();
                        mapInstance.getView().fit(extent, {
                            padding: [50, 50, 50, 50],
                            maxZoom: 16,
                            duration: 1000
                        });
                    }
                }
            });

            console.log('✓ Vector layer added to map');
            setError(null);
        } catch (err) {
            console.error('Vector layer error:', err);
            setError('Failed to load vector layer');
        }
    }, [mapInstance, selectedShapefile]);

    useEffect(() => {
        if (!mapInstance || !vectorLayerRef.current) return;

        const handleClick = (evt: any) => {
            const features = mapInstance.getFeaturesAtPixel(evt.pixel);
            
            if (features && features.length > 0) {
                const feature = features[0];
                const props = feature.getProperties();
                delete props.geometry;
                
                setFeatureInfo({
                    properties: props,
                    layerName: selectedShapefile?.shapefile_name || 'Layer',
                });
                overlayRef.current?.setPosition(evt.coordinate);
            } else {
                setFeatureInfo(null);
                overlayRef.current?.setPosition(undefined);
            }
        };

        mapInstance.on('singleclick', handleClick);
        return () => mapInstance.un('singleclick', handleClick);
    }, [mapInstance, vectorLayerRef.current, selectedShapefile]);

    useEffect(() => {
        if (!mapInstance || !vectorLayerRef.current) return;

        const handlePointerMove = (evt: any) => {
            const pixel = mapInstance.getEventPixel(evt.originalEvent);
            const features = mapInstance.getFeaturesAtPixel(pixel);

            if (features && features.length > 0) {
                const feature = features[0];
                
                if (hoveredFeatureRef.current !== feature) {
                    hoveredFeatureRef.current = feature;
                    setHoveredFeature(feature);
                    mapInstance.getTargetElement().style.cursor = 'pointer';
                    
                    if (vectorLayerRef.current) {
                        vectorLayerRef.current.changed();
                    }
                }
            } else {
                if (hoveredFeatureRef.current !== null) {
                    hoveredFeatureRef.current = null;
                    setHoveredFeature(null);
                    mapInstance.getTargetElement().style.cursor = '';
                    
                    if (vectorLayerRef.current) {
                        vectorLayerRef.current.changed();
                    }
                }
            }
        };

        mapInstance.on('pointermove', handlePointerMove);
        return () => mapInstance.un('pointermove', handlePointerMove);
    }, [mapInstance, vectorLayerRef.current, layerStyle]);

    const applyFilterToWMS = (filters: Record<string, string[]>) => {
        if (!vectorLayerRef.current || !selectedShapefile) {
            console.warn('⚠️ Cannot apply filter: no vector layer or shapefile');
            return;
        }

        const vectorSource = vectorLayerRef.current.getSource();
        if (!vectorSource) return;

        setCurrentFilters(filters);

        const allFeatures = vectorSource.getFeatures();
        
        if (Object.keys(filters).length === 0) {
            allFeatures.forEach(f => f.setStyle(undefined));
            console.log('✓ All filters cleared, showing all features');
        } else {
            allFeatures.forEach(feature => {
                const props = feature.getProperties();
                let matches = true;

                for (const [key, values] of Object.entries(filters)) {
                    if (values && values.length > 0) {
                        const propValue = String(props[key]);
                        if (!values.includes(propValue)) {
                            matches = false;
                            break;
                        }
                    }
                }

                if (!matches) {
                    feature.setStyle(new Style({}));
                }
            });
            
            console.log('✓ Client-side filter applied');
        }

        vectorLayerRef.current.changed();
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
            baseMaps,
            layerStyle,
            updateLayerStyle,
            geometryType,
            hoveredFeature,
        }),
        [
            mapInstance, 
            selectedBaseMap, 
            featureInfo, 
            isLoading, 
            error, 
            showLabels, 
            filteredFeatures,
            layerStyle,
            geometryType,
            hoveredFeature
        ]
    );

    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMap = (): MapContextType => {
    const ctx = useContext(MapContext);
    if (!ctx) throw new Error('useMap must be used within MapProvider');
    return ctx;
};