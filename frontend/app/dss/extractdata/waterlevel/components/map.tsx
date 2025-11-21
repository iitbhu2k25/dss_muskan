"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { useMap } from "@/contexts/extract/Waterlevel/MapContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const WaterLevelMap = () => {
  const {
    map,
    toggleBaseMap,
    isSatellite,
    popupOverlay,
    popupData,
    isPopupVisible,
    isLoading,
    closePopup,
    handleZoomIn,
    handleZoomOut,
  } = useMap();

  const mapElement = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'trend' | 'data'>('current');

  useEffect(() => {
    if (map && mapElement.current && !map.getTarget()) {
      map.setTarget(mapElement.current);
    }
  }, [map]);

  useEffect(() => {
    if (popupOverlay && popupRef.current) {
      popupOverlay.setElement(popupRef.current);
    }
  }, [popupOverlay]);

  useEffect(() => {
    const onFsChange = () => setIsFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange as any);
    document.addEventListener("mozfullscreenchange", onFsChange as any);
    document.addEventListener("MSFullscreenChange", onFsChange as any);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange as any);
      document.removeEventListener("mozfullscreenchange", onFsChange as any);
      document.removeEventListener("MSFullscreenChange", onFsChange as any);
    };
  }, []);

  const toggleFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      const isFull =
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );
      if (!isFull) {
        const req =
          (el as any).requestFullscreen ||
          (el as any).webkitRequestFullscreen ||
          (el as any).mozRequestFullScreen ||
          (el as any).msRequestFullscreen;
        await req.call(el);
      } else {
        const exit =
          (document as any).exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).mozCancelFullScreen ||
          (document as any).msExitFullscreen;
        await exit.call(document);
      }
    } catch {
      // no-op
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-xs text-gray-600">{payload[0].payload.timeFormatted}</p>
          <p className="text-sm font-semibold text-blue-600">
            Water Level: {payload[0].value.toFixed(2)} m
          </p>
        </div>
      );
    }
    return null;
  };

  // Prepare chart data from allData
  const chartData = popupData?.allData.map((item) => {
    const dateTime = new Date(item.actualTime);
    return {
      time: dateTime.getTime(),
      timeFormatted: dateTime.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      waterLevel: parseFloat(item.value.toString()),
      dateTime: item.actualTime
    };
  }).sort((a, b) => a.time - b.time) || [];

  return (
    <div ref={wrapRef} className={`${isFullScreen ? "fixed inset-0 z-50" : "h-screen w-full"} bg-gray-100 p-15`}>
      <div className="h-full w-full relative flex flex-col">
        <div className="flex-1 w-full relative rounded-lg overflow-hidden shadow-2xl border-4 border-gray-300">
          <div ref={mapElement} className="w-full h-full" style={{ minHeight: "400px" }} />

          <div
            ref={popupRef}
            className="ol-popup"
            style={{
              position: "absolute",
              backgroundColor: "white",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "0",
              borderRadius: "12px",
              border: "2px solid #e5e7eb",
              bottom: "12px",
              left: "-200px",
              minWidth: "450px",
              maxWidth: "550px",
              maxHeight: "650px",
              overflowY: "auto",
              display: isPopupVisible ? "block" : "none",
            }}
          >
            <div className="p-5">
              <button
                onClick={closePopup}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
                aria-label="Close popup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : popupData ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-gray-800 border-b-2 border-blue-500 pb-2 pr-8">
                    {popupData.stationName}
                  </h3>

                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('current')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'current'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Current Status
                    </button>
                    <button
                      onClick={() => setActiveTab('trend')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'trend'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Trend Graph
                    </button>
                    <button
                      onClick={() => setActiveTab('data')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'data'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Data Table
                    </button>
                  </div>

                  {/* Current Status Tab */}
                  {activeTab === 'current' && (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Current Water Level</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {popupData.latestData.value.toFixed(2)} m
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Last Updated: {new Date(popupData.latestData.actualTime).toLocaleString('en-GB')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Station Code</p>
                          <p className="text-sm font-semibold text-gray-800">{popupData.stationCode}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Station Type</p>
                          <p className="text-sm font-semibold text-gray-800">{popupData.latestData.stationType}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700 border-b pb-1">Reference Levels</h4>
                        
                        {popupData.latestData.highestFlowLevel && (
                          <div className="flex justify-between items-center bg-purple-50 p-2 rounded">
                            <span className="text-xs text-gray-600">Highest Flow Level:</span>
                            <span className="text-sm font-bold text-purple-600">
                              {popupData.latestData.highestFlowLevel.toFixed(2)} m
                            </span>
                          </div>
                        )}
                        
                        {popupData.latestData.dangerLevel && (
                          <div className="flex justify-between items-center bg-red-50 p-2 rounded">
                            <span className="text-xs text-gray-600">Danger Level:</span>
                            <span className="text-sm font-bold text-red-600">
                              {popupData.latestData.dangerLevel.toFixed(2)} m
                            </span>
                          </div>
                        )}
                        
                        {popupData.latestData.warningLevel && (
                          <div className="flex justify-between items-center bg-orange-50 p-2 rounded">
                            <span className="text-xs text-gray-600">Warning Level:</span>
                            <span className="text-sm font-bold text-orange-600">
                              {popupData.latestData.warningLevel.toFixed(2)} m
                            </span>
                          </div>
                        )}

                        {popupData.latestData.frl && (
                          <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="text-xs text-gray-600">FRL:</span>
                            <span className="text-sm font-semibold text-gray-800">
                              {popupData.latestData.frl.toFixed(2)} m
                            </span>
                          </div>
                        )}

                        {popupData.latestData.mwl && (
                          <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="text-xs text-gray-600">MWL:</span>
                            <span className="text-sm font-semibold text-gray-800">
                              {popupData.latestData.mwl.toFixed(2)} m
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Data Type:</span>
                          <span className="text-gray-800 font-medium">{popupData.latestData.dataTypeCode}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-600">Parameter:</span>
                          <span className="text-gray-800 font-medium">{popupData.latestData.otherParam}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trend Graph Tab */}
                  {activeTab === 'trend' && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Data Period</p>
                        <p className="text-sm font-semibold text-gray-800">
                          2025-01-01 to {new Date().toISOString().split('T')[0]}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Total Records: {popupData.allData.length}
                        </p>
                      </div>

                      {chartData.length > 0 ? (
                        <div className="w-full">
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                              data={chartData}
                              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="time"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(timestamp) => {
                                  const date = new Date(timestamp);
                                  return date.toLocaleDateString('en-GB', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  });
                                }}
                                label={{ 
                                  value: 'Time', 
                                  position: 'insideBottom', 
                                  offset: -10,
                                  style: { fontSize: 12, fontWeight: 600 }
                                }}
                                stroke="#6b7280"
                                style={{ fontSize: 10 }}
                              />
                              <YAxis
                                label={{ 
                                  value: 'Water Level (m)', 
                                  angle: -90, 
                                  position: 'insideLeft',
                                  style: { fontSize: 12, fontWeight: 600 }
                                }}
                                stroke="#6b7280"
                                style={{ fontSize: 10 }}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend 
                                wrapperStyle={{ paddingTop: '10px', fontSize: 11 }}
                                iconType="line"
                              />
                              <Line
                                type="monotone"
                                dataKey="waterLevel"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ r: 2, fill: '#2563eb' }}
                                activeDot={{ r: 4 }}
                                name="Water Level"
                              />
                              
                              {popupData.latestData.dangerLevel && (
                                <Line
                                  type="monotone"
                                  dataKey={() => popupData.latestData.dangerLevel}
                                  stroke="#dc2626"
                                  strokeWidth={1.5}
                                  strokeDasharray="5 5"
                                  dot={false}
                                  name="Danger Level"
                                />
                              )}
                              {popupData.latestData.warningLevel && (
                                <Line
                                  type="monotone"
                                  dataKey={() => popupData.latestData.warningLevel}
                                  stroke="#f97316"
                                  strokeWidth={1.5}
                                  strokeDasharray="5 5"
                                  dot={false}
                                  name="Warning Level"
                                />
                              )}
                              {popupData.latestData.highestFlowLevel && (
                                <Line
                                  type="monotone"
                                  dataKey={() => popupData.latestData.highestFlowLevel}
                                  stroke="#8b5cf6"
                                  strokeWidth={1.5}
                                  strokeDasharray="5 5"
                                  dot={false}
                                  name="Highest Flow"
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>

                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="bg-blue-50 p-2 rounded">
                              <p className="text-xs text-gray-600">Current</p>
                              <p className="text-sm font-bold text-blue-600">
                                {popupData.latestData.value.toFixed(2)} m
                              </p>
                            </div>
                            <div className="bg-green-50 p-2 rounded">
                              <p className="text-xs text-gray-600">Min</p>
                              <p className="text-sm font-bold text-green-600">
                                {Math.min(...chartData.map(d => d.waterLevel)).toFixed(2)} m
                              </p>
                            </div>
                            <div className="bg-red-50 p-2 rounded">
                              <p className="text-xs text-gray-600">Max</p>
                              <p className="text-sm font-bold text-red-600">
                                {Math.max(...chartData.map(d => d.waterLevel)).toFixed(2)} m
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-10">
                          <p className="text-gray-500">No chart data available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Data Table Tab */}
                  {activeTab === 'data' && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-xs text-gray-600">Showing {popupData.allData.length} records</p>
                      </div>

                      <div className="space-y-2">
                        {popupData.allData.map((item, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg border ${
                              index === 0 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {item.value.toFixed(2)} m
                                </p>
                                <p className="text-xs text-gray-600">
                                  {new Date(item.actualTime).toLocaleString('en-GB')}
                                </p>
                              </div>
                              {index === 0 && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                  Latest
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Type:</span>
                                <span className="ml-1 text-gray-700">{item.dataTypeCode}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Param:</span>
                                <span className="ml-1 text-gray-700">{item.otherParam}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-gray-900 text-green-400 rounded-lg">
                        <p className="text-xs font-mono mb-2">Raw JSON (Latest Record):</p>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                          {JSON.stringify(popupData.latestData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-lg border border-gray-200"
              title="Zoom In"
              disabled={!map}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-lg border border-gray-200"
              title="Zoom Out"
              disabled={!map}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>

          <div className="absolute top-4 left-20 z-20 bg-white rounded-full shadow-lg p-2 border border-gray-200">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={toggleBaseMap}
              className="px-4 py-2 text-sm font-medium bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-lg border border-gray-200 flex items-center gap-2"
              title="Toggle Base Map"
              disabled={!map}
            >
              {isSatellite ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              )}
              <span className="text-sm font-medium">{isSatellite ? "Street Map" : "Satellite"}</span>
            </button>
          </div>

          <div className="absolute bottom-16 right-4 z-20">
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-lg border border-gray-200"
              title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullScreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h4V3M17 7h-4V3M7 17h4v4M17 17h-4v4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterLevelMap;