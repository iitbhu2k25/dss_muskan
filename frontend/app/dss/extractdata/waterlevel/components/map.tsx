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
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'raw'>('overview');
  
  // Modal state
  const [showHydrographModal, setShowHydrographModal] = useState(false);
  const [hydrographData, setHydrographData] = useState<any[]>([]);
  const [isLoadingHydrograph, setIsLoadingHydrograph] = useState(false);

  // Set map target once ref is ready
  useEffect(() => {
    if (map && mapElement.current && !map.getTarget()) {
      map.setTarget(mapElement.current);
    }
  }, [map]);

  // Set popup overlay element once ref is ready
  useEffect(() => {
    if (popupOverlay && popupRef.current) {
      popupOverlay.setElement(popupRef.current);
    }
  }, [popupOverlay]);

  // Track fullscreen state
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

  // Fullscreen toggle
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

  // Fetch hydrograph data from API
  const fetchHydrographData = async (stationCode: string) => {
    setIsLoadingHydrograph(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/django/extract/water-level${stationCode}`);
      const data = await response.json();
      
      // Transform data for recharts format
      const formattedData = data.map((item: any) => ({
        time: new Date(item.dateTime).getTime(),
        timeFormatted: new Date(item.dateTime).toLocaleString(),
        waterLevel: item.waterLevel,
      }));
      
      setHydrographData(formattedData);
    } catch (error) {
      console.error("Error fetching hydrograph data:", error);
      // Fallback to mock data for demonstration
      setHydrographData(generateMockData());
    } finally {
      setIsLoadingHydrograph(false);
    }
  };

  // Mock data generator (remove when API is ready)
  const generateMockData = () => {
    const data = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      const time = now - i * 24 * 60 * 60 * 1000;
      data.push({
        time,
        timeFormatted: new Date(time).toLocaleDateString(),
        waterLevel: Math.random() * 10 + 2,
      });
    }
    return data;
  };

  // Handle hydrograph button click
  const handleHydrographClick = () => {
    if (popupData?.stationCode) {
      setShowHydrographModal(true);
      fetchHydrographData(popupData.stationCode);
    }
  };

  // Custom tooltip for the chart
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

  // Helper to render metadata fields
  const renderMetadataField = (label: string, value: any) => {
    if (value === null || value === undefined || value === "") return null;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div key={label} className="mb-2">
          <p className="font-semibold text-xs text-gray-700 mb-1">{label}:</p>
          <div className="ml-3 space-y-1">
            {Object.entries(value).map(([k, v]) => renderMetadataField(k, v))}
          </div>
        </div>
      );
    }
    
    if (Array.isArray(value)) {
      return (
        <div key={label} className="mb-2">
          <p className="font-semibold text-xs text-gray-700 mb-1">{label}:</p>
          <div className="ml-3">
            {value.map((item, idx) => (
              <div key={idx} className="text-xs text-gray-800">{JSON.stringify(item)}</div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <p key={label} className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}:</span>
        <span className="text-gray-800 ml-2 text-right flex-1">{String(value)}</span>
      </p>
    );
  };

  return (
    <div ref={wrapRef} className={`${isFullScreen ? "fixed inset-0 z-50" : "h-screen w-full"} bg-gray-100 p-15`}>
      <div className="h-full w-full relative flex flex-col">
        {/* Map container */}
        <div className="flex-1 w-full relative rounded-lg overflow-hidden shadow-2xl border-4 border-gray-300">
          <div ref={mapElement} className="w-full h-full" style={{ minHeight: "400px" }} />

          {/* Popup - Always rendered but positioned by OpenLayers */}
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
              minWidth: "400px",
              maxWidth: "500px",
              maxHeight: "600px",
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

                  {/* Hydrograph Button */}
                  <button
                    onClick={handleHydrographClick}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Hydrograph
                  </button>

                  {/* Tab Navigation */}
                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'overview'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'details'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Full Details
                    </button>
                    <button
                      onClick={() => setActiveTab('raw')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'raw'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Raw Data
                    </button>
                  </div>

                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between">
                        <span className="font-semibold text-gray-600">Station Code:</span>
                        <span className="text-gray-800">{popupData.stationCode}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-semibold text-gray-600">Water Level:</span>
                        <span className={`font-bold ${popupData.waterLevel !== null ? "text-blue-600" : "text-gray-400"}`}>
                          {popupData.waterLevel !== null ? `${popupData.waterLevel} m` : "No data"}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-semibold text-gray-600">Date/Time:</span>
                        <span className="text-gray-800 text-xs">{popupData.dateTime}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-semibold text-gray-600">Flood Status:</span>
                        <span
                          className={`font-semibold ${
                            popupData.floodStatus === "Normal" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {popupData.floodStatus}
                        </span>
                      </p>
                      {popupData.status && (
                        <p className="flex justify-between">
                          <span className="font-semibold text-gray-600">API Status:</span>
                          <span className={`text-xs ${popupData.status === "Success" ? "text-green-600" : "text-orange-600"}`}>
                            {popupData.status}
                          </span>
                        </p>
                      )}

                      {popupData.metadata && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Quick Info</h4>
                          <div className="space-y-1 text-xs">
                            {popupData.metadata.riverName && renderMetadataField("River", popupData.metadata.riverName)}
                            {popupData.metadata.basinName && renderMetadataField("Basin", popupData.metadata.basinName)}
                            {popupData.metadata.stateName && renderMetadataField("State", popupData.metadata.stateName)}
                            {popupData.metadata.districtName && renderMetadataField("District", popupData.metadata.districtName)}
                            {popupData.metadata.dangerLevel && renderMetadataField("Danger Level", `${popupData.metadata.dangerLevel} m`)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Full Details Tab */}
                  {activeTab === 'details' && popupData.metadata && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">Station Information</h4>
                        <div className="space-y-1">
                          {popupData.metadata.stationName && renderMetadataField("Station Name", popupData.metadata.stationName)}
                          {popupData.metadata.stationCode && renderMetadataField("Code", popupData.metadata.stationCode)}
                          {popupData.metadata.stationType && renderMetadataField("Type", popupData.metadata.stationType)}
                          {popupData.metadata.agencyName && renderMetadataField("Agency", popupData.metadata.agencyName)}
                          {popupData.metadata.stationStatus && renderMetadataField("Status", popupData.metadata.stationStatus)}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">Location</h4>
                        <div className="space-y-1">
                          {popupData.metadata.riverName && renderMetadataField("River", popupData.metadata.riverName)}
                          {popupData.metadata.basinName && renderMetadataField("Basin", popupData.metadata.basinName)}
                          {popupData.metadata.subBasinName && renderMetadataField("Sub-Basin", popupData.metadata.subBasinName)}
                          {popupData.metadata.stateName && renderMetadataField("State", popupData.metadata.stateName)}
                          {popupData.metadata.districtName && renderMetadataField("District", popupData.metadata.districtName)}
                          {popupData.metadata.latitude && popupData.metadata.longitude && (
                            <p className="text-xs">
                              <span className="text-gray-600 font-medium">Coordinates: </span>
                              <span className="text-gray-800">{popupData.metadata.latitude.toFixed(4)}, {popupData.metadata.longitude.toFixed(4)}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {(popupData.metadata.dangerLevel || popupData.metadata.warningLevel || popupData.metadata.highFloodLevel) && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">Threshold Levels (m)</h4>
                          <div className="space-y-1">
                            {popupData.metadata.dangerLevel && (
                              <p className="text-xs flex justify-between">
                                <span className="text-gray-600 font-medium">Danger Level:</span>
                                <span className="text-red-600 font-semibold">{popupData.metadata.dangerLevel}</span>
                              </p>
                            )}
                            {popupData.metadata.warningLevel && (
                              <p className="text-xs flex justify-between">
                                <span className="text-gray-600 font-medium">Warning Level:</span>
                                <span className="text-orange-600 font-semibold">{popupData.metadata.warningLevel}</span>
                              </p>
                            )}
                            {popupData.metadata.highFloodLevel && (
                              <p className="text-xs flex justify-between">
                                <span className="text-gray-600 font-medium">High Flood Level:</span>
                                <span className="text-purple-600 font-semibold">{popupData.metadata.highFloodLevel}</span>
                              </p>
                            )}
                            {popupData.metadata.lowestLevel && renderMetadataField("Lowest Level", `${popupData.metadata.lowestLevel} m`)}
                            {popupData.metadata.highestLevel && renderMetadataField("Highest Level", `${popupData.metadata.highestLevel} m`)}
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">Additional Information</h4>
                        <div className="space-y-1">
                          {Object.entries(popupData.metadata).map(([key, value]) => {
                            const displayedFields = [
                              'stationName', 'stationCode', 'stationType', 'agencyName', 'stationStatus',
                              'riverName', 'basinName', 'subBasinName', 'stateName', 'districtName',
                              'latitude', 'longitude', 'dangerLevel', 'warningLevel', 'highFloodLevel',
                              'lowestLevel', 'highestLevel', '@class'
                            ];
                            if (displayedFields.includes(key)) return null;
                            return renderMetadataField(key, value);
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Raw Data Tab */}
                  {activeTab === 'raw' && popupData.metadata && (
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono max-h-96 overflow-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(popupData.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Zoom Controls */}
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

          {/* Compass */}
          <div className="absolute top-4 left-20 z-20 bg-white rounded-full shadow-lg p-2 border border-gray-200">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>

          {/* Base Map Toggle */}
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

          {/* Fullscreen Toggle */}
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

      {/* Hydrograph Modal with Transparent/Blurred Backdrop */}
      {showHydrographModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          }}
          onClick={() => setShowHydrographModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Top Right */}
            <button
              onClick={() => setShowHydrographModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6 pr-10">
              <h2 className="text-2xl font-bold text-gray-800">
                Hydrograph - {popupData?.stationName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Station Code: {popupData?.stationCode}
              </p>
            </div>

            {/* Chart */}
            {isLoadingHydrograph ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={hydrographData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
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
                        style: { fontSize: 14, fontWeight: 600 }
                      }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      label={{ 
                        value: 'Water Level (m)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fontSize: 14, fontWeight: 600 }
                      }}
                      stroke="#6b7280"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="waterLevel"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#2563eb' }}
                      activeDot={{ r: 5 }}
                      name="Water Level"
                    />
                    
                    {/* Danger level reference line */}
                    {popupData?.metadata?.dangerLevel && (
                      <Line
                        type="monotone"
                        dataKey={() => popupData.metadata.dangerLevel}
                        stroke="#dc2626"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Danger Level"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>

                {/* Chart Statistics */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Current Water Level</p>
                    <p className="text-xl font-bold text-blue-600">
                      {popupData?.waterLevel ? `${popupData.waterLevel} m` : 'N/A'}
                    </p>
                  </div>
                  {popupData?.metadata?.dangerLevel && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Danger Level</p>
                      <p className="text-xl font-bold text-red-600">
                        {popupData.metadata.dangerLevel} m
                      </p>
                    </div>
                  )}
                  {popupData?.metadata?.warningLevel && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Warning Level</p>
                      <p className="text-xl font-bold text-orange-600">
                        {popupData.metadata.warningLevel} m
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterLevelMap;
