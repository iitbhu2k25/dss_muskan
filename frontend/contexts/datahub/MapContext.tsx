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
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle, RegularShape } from 'ol/style';
import { Draw, Modify, Snap, Select } from 'ol/interaction';
import { buffer as turfBuffer } from '@turf/buffer';
import { useShapefile } from './Section1Context';
import { Feature } from 'ol';
import { click } from 'ol/events/condition';

export interface LayerStyle {
    shape?: 'circle' | 'square' | 'triangle' | 'star' | 'cross' | 'flag' | 'diamond';
    color: string;
    size?: number;
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
const BASIN_BOUNDARY_LAYER = 'basin_boundary';

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
    feature: Feature;
    coordinate: number[];
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
    basinBoundaryVisible: boolean;
    toggleBasinBoundary: () => void;
    basinLayerStyle: LayerStyle;
    updateBasinLayerStyle: (style: LayerStyle) => void;
    mouseCoordinates: { lat: string; lon: string };
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    drawingType: string | null;
    setDrawingType: (type: string | null) => void;
    exportGeoJSON: () => void;
    createBuffer: (distance: number) => void;
    resetBuffer: () => void;
    clearDrawings: () => void;
    drawingLayerVisible: boolean;
    toggleDrawingLayer: () => void;
    updateFeatureProperties: (feature: Feature, properties: Record<string, any>) => void;
}


interface MapProviderProps {
    children: ReactNode;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

const DEFAULT_POINT_STYLE: LayerStyle = {
    shape: 'circle',
    color: '#3B82F6',
    size: 10,
    opacity: 0.8,
    strokeColor: '#1E40AF',
    strokeWidth: 2
};

const DEFAULT_POLYGON_STYLE: LayerStyle = {
    color: '#3B82F6',
    opacity: 0.3,
    strokeColor: '#1E40AF',
    strokeWidth: 2
};

const DEFAULT_LINE_STYLE: LayerStyle = {
    color: '#3B82F6',
    opacity: 1,
    strokeColor: '#3B82F6',
    strokeWidth: 3
};

const BASIN_DEFAULT_STYLE: LayerStyle = {
    color: '#10B981',
    opacity: 0,
    strokeColor: '#059669',
    strokeWidth: 3
};

const DRAWING_STYLE = new Style({
    fill: new Fill({
        color: 'rgba(255, 165, 0, 0.3)',
    }),
    stroke: new Stroke({
        color: '#FF6B00',
        width: 3,
    }),
    image: new Circle({
        radius: 7,
        fill: new Fill({
            color: '#FF6B00',
        }),
        stroke: new Stroke({
            color: '#fff',
            width: 2,
        }),
    }),
});

const SELECTION_STYLE = new Style({
    fill: new Fill({
        color: 'rgba(255, 255, 0, 0.5)',
    }),
    stroke: new Stroke({
        color: '#FFD700',
        width: 4,
    }),
    image: new Circle({
        radius: 8,
        fill: new Fill({
            color: '#FFD700',
        }),
        stroke: new Stroke({
            color: '#fff',
            width: 2,
        }),
    }),
});

const BUFFER_STYLE = new Style({
    fill: new Fill({
        color: 'rgba(139, 0, 255, 0.2)',
    }),
    stroke: new Stroke({
        color: '#8B00FF',
        width: 2,
        lineDash: [4, 8]
    }),
});

const createOLStyle = (styleConfig: LayerStyle, isHovered: boolean = false): Style => {
    const { shape, color, size, opacity, strokeColor, strokeWidth } = styleConfig;

    const fill = new Fill({
        color: isHovered ? `${color}ff` : `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
    });

    const stroke = new Stroke({
        color: strokeColor,
        width: isHovered ? strokeWidth + 2 : strokeWidth
    });

    const finalSize = isHovered ? (size || 10) * 1.3 : (size || 10);

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

const createLineStyle = (styleConfig: LayerStyle, isHovered: boolean = false): Style => {
    const { strokeColor, strokeWidth } = styleConfig;

    return new Style({
        stroke: new Stroke({
            color: strokeColor,
            width: isHovered ? strokeWidth + 2 : strokeWidth
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
    const basinLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const drawingLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const bufferLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const overlayRef = useRef<Overlay | null>(null);
    const hoveredFeatureRef = useRef<any>(null);
    const drawInteractionRef = useRef<Draw | null>(null);
    const modifyInteractionRef = useRef<Modify | null>(null);
    const snapInteractionRef = useRef<Snap | null>(null);
    const selectInteractionRef = useRef<Select | null>(null);


    const [mapInstance, setMapInstance] = useState<Map | null>(null);
    const [selectedBaseMap, setSelectedBaseMap] = useState('osm');
    const [featureInfo, setFeatureInfo] = useState<FeatureInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLabels, setShowLabels] = useState(false);
    const [filteredFeatures, setFilteredFeatures] = useState<any[]>([]);
    const [currentFilters, setCurrentFilters] = useState<Record<string, string[]>>({});
    const [layerStyle, setLayerStyle] = useState<LayerStyle>(DEFAULT_POINT_STYLE);
    const [geometryType, setGeometryType] = useState<string | null>(null);
    const [hoveredFeature, setHoveredFeature] = useState<any>(null);
    const [basinBoundaryVisible, setBasinBoundaryVisible] = useState(true);
    const [basinLayerStyle, setBasinLayerStyle] = useState<LayerStyle>(BASIN_DEFAULT_STYLE);
    const [mouseCoordinates, setMouseCoordinates] = useState({ lat: '0.0000', lon: '0.0000' });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [drawingType, setDrawingType] = useState<string | null>(null);
    const [drawingLayerVisible, setDrawingLayerVisible] = useState(true);

    const toggleLabels = () => setShowLabels((s) => !s);
    const toggleBasinBoundary = () => setBasinBoundaryVisible((v) => !v);
    const toggleDrawingLayer = () => setDrawingLayerVisible((v) => !v);

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

    // Initialize popup overlay
    useEffect(() => {
        if (!mapInstance || !popupRef.current || overlayRef.current) return;
        const overlay = new Overlay({
            element: popupRef.current,
            autoPan: false, // <-- THIS IS THE FIX: Set to false to prevent map from shifting
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -10],
        });
        mapInstance.addOverlay(overlay);
        overlayRef.current = overlay;
        console.log('✓ Popup overlay added');
    }, [mapInstance]);

    // Track mouse coordinates
    useEffect(() => {
        if (!mapInstance) return;

        const handlePointerMove = (evt: any) => {
            const coordinate = evt.coordinate;
            const lonLat = toLonLat(coordinate);
            setMouseCoordinates({
                lat: lonLat[1].toFixed(4),
                lon: lonLat[0].toFixed(4)
            });
        };

        mapInstance.on('pointermove', handlePointerMove);
        return () => mapInstance.un('pointermove', handlePointerMove);
    }, [mapInstance]);

    // Fullscreen functionality
    const toggleFullscreen = () => {
        if (!mapContainerRef.current) return;

        if (!document.fullscreenElement) {
            mapContainerRef.current.parentElement?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Initialize Drawing, Buffer, and Selection Layers
    useEffect(() => {
        if (!mapInstance) return;

        // Drawing Layer
        if (!drawingLayerRef.current) {
            const drawingSource = new VectorSource();
            const drawingLayer = new VectorLayer({
                source: drawingSource,
                style: DRAWING_STYLE,
                zIndex: 10,
            });
            drawingLayer.set('name', 'drawing-layer');
            mapInstance.addLayer(drawingLayer);
            drawingLayerRef.current = drawingLayer;
            console.log('✓ Drawing layer initialized');
        }

        // Buffer Layer
        if (!bufferLayerRef.current) {
            const bufferSource = new VectorSource();
            const bufferLayer = new VectorLayer({
                source: bufferSource,
                style: BUFFER_STYLE,
                zIndex: 9,
            });
            bufferLayer.set('name', 'buffer-layer');
            mapInstance.addLayer(bufferLayer);
            bufferLayerRef.current = bufferLayer;
            console.log('✓ Buffer layer initialized');
        }

        // Selection Interaction
        if (!selectInteractionRef.current) {
            const select = new Select({
                condition: click,
                style: SELECTION_STYLE,
                layers: (layer) => layer.get('name') !== 'basemap',
            });

            mapInstance.addInteraction(select);
            selectInteractionRef.current = select;

            select.on('select', (e) => {
                const selectedFeatures = e.target.getFeatures().getArray();

                if (selectedFeatures.length > 0) {
                    const feature = selectedFeatures[0]; // Show popup for the first selected feature
                    const props = feature.getProperties();
                    delete props.geometry;

                    const layerOfFeature = mapInstance.getLayers().getArray().find(layer => {
                        if (layer instanceof VectorLayer) {
                            const source = layer.getSource();
                            return source?.getFeatures().includes(feature);
                        }
                        return false;
                    });

                    let layerName = 'Unknown Layer';
                    if (layerOfFeature?.get('name') === 'basin-boundary-layer') {
                        layerName = 'Basin Boundary';
                    } else if (layerOfFeature?.get('name') === 'vector-layer') {
                        layerName = selectedShapefile?.shapefile_name || 'Vector LayeR';
                    } else if (layerOfFeature?.get('name') === 'drawing-layer') {
                        layerName = 'Drawn Feature';
                    }


                    const coordinate = e.mapBrowserEvent.coordinate;
                    setFeatureInfo({
                        properties: props,
                        layerName,
                        feature: feature,
                        coordinate,
                    });
                    overlayRef.current?.setPosition(coordinate);
                } else {
                    setFeatureInfo(null);
                    overlayRef.current?.setPosition(undefined);
                }
            });
            console.log('✓ Select interaction added');
        }


        // Modify and Snap Interactions
        const drawingSource = drawingLayerRef.current?.getSource();
        if (drawingSource && !modifyInteractionRef.current) {
            const modify = new Modify({ source: drawingSource });
            mapInstance.addInteraction(modify);
            modifyInteractionRef.current = modify;

            const snap = new Snap({ source: drawingSource });
            mapInstance.addInteraction(snap);
            snapInteractionRef.current = snap;
        }

    }, [mapInstance, selectedShapefile]);


    // Toggle drawing layer visibility
    useEffect(() => {
        if (drawingLayerRef.current) {
            drawingLayerRef.current.setVisible(drawingLayerVisible);
        }
    }, [drawingLayerVisible]);

    // Handle drawing type changes
    useEffect(() => {
        if (!mapInstance || !drawingLayerRef.current) return;

        // Deactivate selection while drawing
        if (selectInteractionRef.current) {
            selectInteractionRef.current.setActive(!drawingType);
        }

        if (drawInteractionRef.current) {
            mapInstance.removeInteraction(drawInteractionRef.current);
            drawInteractionRef.current = null;
        }

        if (!drawingType) return;

        const source = drawingLayerRef.current.getSource();
        if (!source) return;

        const draw = new Draw({
            source: source,
            type: drawingType as any,
            style: DRAWING_STYLE,
        });

        mapInstance.addInteraction(draw);
        drawInteractionRef.current = draw;

        draw.on('drawend', (e) => {
            if (drawingType === 'Point') {
                e.feature.setProperties({
                    isEditable: true,
                    name: 'New Point',
                    description: 'A user-added point.'
                });
            }
            setDrawingType(null);
        });

        console.log(`✓ Drawing ${drawingType} enabled`);

        return () => {
            if (drawInteractionRef.current) {
                mapInstance.removeInteraction(drawInteractionRef.current);
                drawInteractionRef.current = null;
            }
        };
    }, [drawingType, mapInstance]);

    // Clear all drawings
    const clearDrawings = () => {
        if (drawingLayerRef.current) {
            drawingLayerRef.current.getSource()?.clear();
            console.log('✓ All drawings cleared');
        }
    };

    // Create buffer for selected features
    const createBuffer = (distanceInMeters: number) => {
        if (!bufferLayerRef.current || !selectInteractionRef.current) return;

        const bufferSource = bufferLayerRef.current.getSource();
        if (!bufferSource) return;

        const selectedFeatures = selectInteractionRef.current.getFeatures().getArray();

        if (selectedFeatures.length === 0) {
            alert('Please select one or more features on the map before creating a buffer.');
            return;
        }

        const format = new GeoJSON();
        selectedFeatures.forEach(feature => {
            const geoJSONFeature = format.writeFeatureObject(feature, {
                featureProjection: 'EPSG:3857',
                dataProjection: 'EPSG:4326'
            });

            const distanceInKm = distanceInMeters / 1000;
            const buffered = turfBuffer(geoJSONFeature, distanceInKm, { units: 'kilometers' });

            if (buffered) {
                const bufferFeature = format.readFeature(buffered, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                bufferSource.addFeature(bufferFeature);
            }
        });

        console.log(`✓ Buffer created for ${selectedFeatures.length} features: ${distanceInMeters}m`);
    };

    // Reset all buffers
    const resetBuffer = () => {
        if (bufferLayerRef.current) {
            bufferLayerRef.current.getSource()?.clear();
            console.log('✓ Buffers cleared');
        }
    };

    const updateFeatureProperties = (feature: Feature, properties: Record<string, any>) => {
        feature.setProperties(properties);
        console.log('✓ Feature properties updated');
    };

    // Export GeoJSON
    const exportGeoJSON = () => {
        const format = new GeoJSON();
        const features: any[] = [];

        // Collect features from all layers
        if (basinLayerRef.current && basinBoundaryVisible) {
            features.push(...basinLayerRef.current.getSource()!.getFeatures());
        }
        if (vectorLayerRef.current) {
            features.push(...vectorLayerRef.current.getSource()!.getFeatures());
        }
        if (drawingLayerRef.current && drawingLayerVisible) {
            features.push(...drawingLayerRef.current.getSource()!.getFeatures());
        }
        if (bufferLayerRef.current) {
            features.push(...bufferLayerRef.current.getSource()!.getFeatures());
        }


        if (features.length === 0) {
            alert('No features to export');
            return;
        }

        const geoJSON = format.writeFeaturesObject(features, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
        });

        const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `map_export_${new Date().getTime()}.geojson`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✓ GeoJSON exported');
    };

    // Load basin_boundary layer
    useEffect(() => {
        if (!mapInstance) return;

        try {
            const wfsUrl = `${GEOSERVER_WFS_URL}?service=WFS&version=1.1.0&request=GetFeature&typename=${WORKSPACE}:${BASIN_BOUNDARY_LAYER}&outputFormat=application/json&srsname=EPSG:3857`;

            const basinSource = new VectorSource({
                format: new GeoJSON(),
                url: wfsUrl,
            });

            const basinLayer = new VectorLayer({
                source: basinSource,
                zIndex: 1,
                visible: basinBoundaryVisible,
                style: () => createPolygonStyle(basinLayerStyle, false)
            });

            basinLayer.set('name', 'basin-boundary-layer');
            mapInstance.addLayer(basinLayer);
            basinLayerRef.current = basinLayer;

            basinSource.once('change', () => {
                if (basinSource.getState() === 'ready') {
                    const features = basinSource.getFeatures();
                    if (features.length > 0) {
                        const extent = basinSource.getExtent();
                        mapInstance.getView().fit(extent, {
                            padding: [50, 50, 50, 50],
                            maxZoom: 16,
                            duration: 1000
                        });
                        console.log('✓ Basin boundary layer loaded and zoomed');
                    }
                }
            });

            console.log('✓ Basin boundary layer added');
        } catch (err) {
            console.error('Basin boundary layer error:', err);
        }
    }, [mapInstance]);

    // Toggle basin boundary visibility
    useEffect(() => {
        if (basinLayerRef.current) {
            basinLayerRef.current.setVisible(basinBoundaryVisible);
        }
    }, [basinBoundaryVisible]);

    // Update basin boundary style
    const updateBasinLayerStyle = (newStyle: LayerStyle) => {
        setBasinLayerStyle(newStyle);
        if (basinLayerRef.current) {
            basinLayerRef.current.setStyle(() => createPolygonStyle(newStyle, false));
            basinLayerRef.current.changed();
            console.log('✓ Basin boundary style updated');
        }
    };

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
                } else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                    return createPolygonStyle(newStyle, hoveredFeatureRef.current === feature);
                } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
                    return createLineStyle(newStyle, hoveredFeatureRef.current === feature);
                }
                return createOLStyle(newStyle, false);
            });
            vectorLayerRef.current.changed();
            console.log('✓ Layer style updated');
        }
    };

    // Load selected shapefile
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
                    } else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                        return createPolygonStyle(layerStyle, hoveredFeatureRef.current === feature);
                    } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
                        return createLineStyle(layerStyle, hoveredFeatureRef.current === feature);
                    }
                    return createOLStyle(layerStyle, false);
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

                        if (geomType === 'Point' || geomType === 'MultiPoint') {
                            setLayerStyle(DEFAULT_POINT_STYLE);
                        } else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                            setLayerStyle(DEFAULT_POLYGON_STYLE);
                        } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
                            setLayerStyle(DEFAULT_LINE_STYLE);
                        }

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


    // Handle hover effects
    useEffect(() => {
        if (!mapInstance) return;

        const handlePointerMove = (evt: any) => {
            const pixel = mapInstance.getEventPixel(evt.originalEvent);
            const features = mapInstance.getFeaturesAtPixel(pixel, {
                layerFilter: (layer) => layer.get('name') !== 'buffer-layer' // Don't hover on buffer layer
            });

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
    }, [mapInstance, layerStyle]);

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
            basinBoundaryVisible,
            toggleBasinBoundary,
            basinLayerStyle,
            updateBasinLayerStyle,
            mouseCoordinates,
            isFullscreen,
            toggleFullscreen,
            drawingType,
            setDrawingType,
            exportGeoJSON,
            createBuffer,
            resetBuffer,
            clearDrawings,
            drawingLayerVisible,
            toggleDrawingLayer,
            updateFeatureProperties
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
            hoveredFeature,
            basinBoundaryVisible,
            basinLayerStyle,
            mouseCoordinates,
            isFullscreen,
            drawingType,
            drawingLayerVisible,
        ]
    );

    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMap = (): MapContextType => {
    const ctx = useContext(MapContext);
    if (!ctx) throw new Error('useMap must be used within MapProvider');
    return ctx;
};