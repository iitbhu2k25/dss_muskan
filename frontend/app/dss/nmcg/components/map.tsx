'use client';
import React, { useEffect, useState } from 'react';
import { LayerStyle, useMap } from '@/contexts/datahub/MapContext';
import { useShapefile } from '@/contexts/datahub/Section1Context';
import StyleEditor from './StyleEditor';

const MapComponent = () => {
    const { 
        mapInstance, 
        mapContainerRef, 
        popupRef, 
        isLoading, 
        error, 
        featureInfo, 
        setFeatureInfo, 
        changeBaseMap, 
        selectedBaseMap, 
        baseMaps,
        layerStyle,
        updateLayerStyle,
        geometryType,
        hoveredFeature
    } = useMap();
    
    const { selectedShapefile } = useShapefile();
    const [isBasemapOpen, setIsBasemapOpen] = useState(false);
    const [showStyleEditor, setShowStyleEditor] = useState(false);
    const [renderKey, setRenderKey] = useState(0);

    useEffect(() => {
        if (mapInstance) {
            const timer = setTimeout(() => {
                mapInstance.updateSize();
                mapInstance.renderSync();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [mapInstance]);

    useEffect(() => {
        if (mapInstance && selectedShapefile && geometryType) {
            const timer = setTimeout(() => {
                const shouldShow = geometryType === 'Point' || geometryType === 'MultiPoint';
                setShowStyleEditor(shouldShow);
                if (shouldShow) {
                    setRenderKey(prev => prev + 1);
                }
            }, 600);
            return () => {
                clearTimeout(timer);
            };
        } else {
            setShowStyleEditor(false);
        }
    }, [mapInstance, selectedShapefile, geometryType]);

    const closePopup = () => {
        setFeatureInfo(null);
    };

    const handleStyleChange = (newStyle: LayerStyle) => {
        updateLayerStyle(newStyle);
    };

    return (
        <div className="h-full relative">
            {/* Map Container */}
            <div className="h-full relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-2xl">
                <div
                    ref={mapContainerRef}
                    className="w-full h-full absolute inset-0 rounded-xl"
                />

                {/* Feature Info Popup */}
                <div
                    ref={popupRef}
                    className={`bg-white rounded-xl shadow-2xl border border-gray-200 p-5 min-w-[280px] max-w-[420px] backdrop-blur-sm bg-white/95 ${
                        featureInfo ? 'block' : 'hidden'
                    }`}
                >
                    {featureInfo && (
                        <>
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    {featureInfo.layerName}
                                </h3>
                                <button
                                    onClick={closePopup}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
                                    title="Close"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                                {Object.entries(featureInfo.properties).map(([key, value]) => (
                                    <div key={key} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                            {key}
                                        </span>
                                        <span className="text-sm text-gray-900 font-medium break-words">
                                            {value !== null && value !== undefined ? String(value) : 'N/A'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-transparent border-t-white"></div>
                            <div className="absolute bottom-[-11px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[13px] border-r-[13px] border-t-[13px] border-transparent border-t-gray-200"></div>
                        </>
                    )}
                </div>

                {/* Hover Tooltip */}
                {/* {hoveredFeature && !featureInfo && (
                    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-20 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-semibold animate-fade-in">
                        <span className="inline-block mr-2">👆</span>
                        Click to view details
                    </div>
                )} */}

                {/* Loading State */}
                {!mapInstance && isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 z-50 rounded-xl">
                        <div className="text-center">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-gray-800 font-bold text-xl">Loading Map...</p>
                            <p className="text-gray-600 text-sm mt-2">Please wait</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl shadow-2xl max-w-md animate-slide-down">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <strong className="font-bold block mb-1">Error</strong>
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Layer Info Display */}
                {/* {selectedShapefile && mapInstance && (
                    <div className="absolute bottom-6 left-6 z-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm border border-blue-500/30">
                        <p className="text-sm font-bold flex items-center gap-3">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            <span>Active Layer:</span>
                            <span className="font-normal">{selectedShapefile.shapefile_name}</span>
                            {geometryType && (
                                <span className="ml-2 text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">
                                    {geometryType}
                                </span>
                            )}
                        </p>
                    </div>
                )} */}

                {/* Zoom Controls */}
                {mapInstance && (
                    <div className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                        <button
                            onClick={() => {
                                const view = mapInstance.getView();
                                view.animate({
                                    center: view.getCenter(),
                                    zoom: view.getZoom()! + 1,
                                    duration: 250,
                                });
                            }}
                            className="block w-12 h-12 bg-white hover:bg-blue-500 hover:text-white transition-all duration-200 flex items-center justify-center font-bold text-2xl border-b border-gray-200 group"
                            title="Zoom In"
                        >
                            <span className="group-hover:scale-110 transition-transform duration-200">+</span>
                        </button>
                        <button
                            onClick={() => {
                                const view = mapInstance.getView();
                                view.animate({
                                    center: view.getCenter(),
                                    zoom: view.getZoom()! - 1,
                                    duration: 250,
                                });
                            }}
                            className="block w-12 h-12 bg-white hover:bg-blue-500 hover:text-white transition-all duration-200 flex items-center justify-center font-bold text-2xl group"
                            title="Zoom Out"
                        >
                            <span className="group-hover:scale-110 transition-transform duration-200">−</span>
                        </button>
                    </div>
                )}

           

                {/* Basemap Selector */}
                {mapInstance && (
                    <div className="absolute bottom-6 right-6 z-20">
                        <div className="relative">
                            <button
                                onClick={() => setIsBasemapOpen(!isBasemapOpen)}
                                className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 font-bold py-3 px-5 rounded-xl shadow-2xl border border-gray-200 transition-all duration-200 text-sm flex items-center gap-2 hover:scale-105"
                                title="Select Basemap"
                            >
                                <span className="text-lg">{baseMaps[selectedBaseMap].icon}</span>
                                <span>Base Map</span>
                                <span className={`text-xs transform transition-transform duration-200 ${isBasemapOpen ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            {isBasemapOpen && (
                                <div className="absolute bottom-full right-0 mb-3 w-40 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
                                    {Object.entries(baseMaps).map(([key, { icon, label, name }]) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                changeBaseMap(key);
                                                setIsBasemapOpen(false);
                                            }}
                                            className={`w-full hover:bg-blue-50 text-gray-800 font-semibold py-3 px-4 transition-all duration-200 text-sm text-left flex items-center gap-3 ${
                                                selectedBaseMap === key ? 'bg-blue-100 text-blue-700' : ''
                                            }`}
                                            title={name}
                                        >
                                            <span className="text-lg">{icon}</span>
                                            <span>{label}</span>
                                            {selectedBaseMap === key && <span className="ml-auto text-blue-600">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <style jsx global>{`
                    @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slide-down {
                        from { transform: translate(-50%, -20px); opacity: 0; }
                        to { transform: translate(-50%, 0); opacity: 1; }
                    }
                    @keyframes scale-in {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    @keyframes bounce-slow {
                        0%, 100% { transform: translate(-50%, -2px); }
                        50% { transform: translate(-50%, 2px); }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.3s ease-out;
                    }
                    .animate-slide-down {
                        animation: slide-down 0.3s ease-out;
                    }
                    .animate-scale-in {
                        animation: scale-in 0.2s ease-out;
                    }
                    .animate-bounce-slow {
                        animation: bounce-slow 2s ease-in-out infinite;
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #888;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #555;
                    }
                `}</style>
            </div>

            {/* Style Editor - Positioned Above Map */}
            {showStyleEditor && mapInstance && selectedShapefile && (
                <div 
                    key={renderKey}
                    className="absolute top-4 left-4 z-50"
                    style={{ pointerEvents: 'auto' }}
                >
                    <StyleEditor
                        onStyleChange={handleStyleChange}
                        currentStyle={layerStyle}
                        layerName={selectedShapefile.shapefile_name}
                    />
                </div>
            )}
        </div>
    );
};

export default MapComponent;