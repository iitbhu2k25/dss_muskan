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
  const popupFullscreenRef = useRef<HTMLDivElement>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPopupFullScreen, setIsPopupFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'trend' | 'data'>('current');

  // Filter states for Trend tab
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showWaterLevel, setShowWaterLevel] = useState(true);
  const [showDangerLevel, setShowDangerLevel] = useState(true);
  const [showWarningLevel, setShowWarningLevel] = useState(true);
  const [showHighestFlow, setShowHighestFlow] = useState(true);

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

  // Map fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Popup fullscreen listener
  useEffect(() => {
    const handler = () => setIsPopupFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = async () => {
    if (!wrapRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await wrapRef.current.requestFullscreen?.();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn("Map fullscreen error:", e);
    }
  };

  const togglePopupFullscreen = async () => {
    if (!popupFullscreenRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await popupFullscreenRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn("Popup fullscreen error:", e);
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

  // Prepare chart data
  const chartData = popupData?.allData
    .map((item) => {
      const dateTime = new Date(item.actualTime);
      return {
        time: dateTime.getTime(),
        timeFormatted: dateTime.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        waterLevel: parseFloat(item.value.toString()),
      };
    })
    .sort((a, b) => a.time - b.time) || [];

  // Filtered data based on date range
  const filteredData = chartData.filter((item) => {
    if (!filterFrom && !filterTo) return true;
    const itemDate = new Date(item.time).toISOString().split("T")[0];
    if (filterFrom && itemDate < filterFrom) return false;
    if (filterTo && itemDate > filterTo) return false;
    return true;
  });

  return (
    <div ref={wrapRef} className={`${isFullScreen ? "fixed inset-0 z-50" : "h-screen w-full"} bg-gray-100 p-15`}>
      <div className="h-full w-full relative flex flex-col">
        <div className="flex-1 w-full relative rounded-lg overflow-hidden shadow-2xl border-4 border-gray-300">
          <div ref={mapElement} className="w-full h-full" style={{ minHeight: "400px" }} />

          {/* POPUP */}
          <div
            ref={popupRef}
            className="ol-popup"
            style={{
              position: "absolute",
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              padding: 0,
              borderRadius: "16px",
              border: "2px solid #e5e7eb",
              bottom: "12px",
              left: "-200px",
              minWidth: "460px",
              maxWidth: "580px",
              maxHeight: "720px",
              overflow: "hidden",
              display: isPopupVisible ? "block" : "none",
              zIndex: 1000,
            }}
          >
            <div ref={popupFullscreenRef} className="relative h-full bg-white">
              {/* Popup Fullscreen Button */}
              <button
                onClick={togglePopupFullscreen}
                className="absolute top-4 right-12 z-50 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                title={isPopupFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isPopupFullScreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h4V3M17 7h-4V3M7 17h4v4M17 17h-4v4" />
                  </svg>
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={closePopup}
                className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Popup Content */}
              <div className={`p-6 ${isPopupFullScreen ? "h-screen w-screen fixed inset-0 overflow-y-auto bg-white z-50" : ""}`}>
                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                  </div>
                ) : popupData ? (
                  <div className="space-y-5">
                    <h3 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-3">
                      {popupData.stationName}
                    </h3>

                    {/* Tabs */}
                    <div className="flex gap-1 border-b-2 border-gray-200">
                      {(["current", "trend", "data"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-6 py-3 font-medium capitalize transition-colors ${
                            activeTab === tab
                              ? "text-blue-600 border-b-4 border-blue-600"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {tab === "current" ? "Current Status" : tab === "trend" ? "Trend Graph" : "Data Table"}
                        </button>
                      ))}
                    </div>

                    {/* Current Tab */}
                    {activeTab === "current" && (
                      <div className="space-y-5">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 rounded-2xl text-center">
                          <p className="text-lg opacity-90">Current Water Level</p>
                          <p className="text-5xl font-bold mt-3">
                            {popupData.latestData.value.toFixed(2)} <span className="text-2xl">m</span>
                          </p>
                          <p className="mt-4 text-sm opacity-90">
                            {new Date(popupData.latestData.actualTime).toLocaleString("en-GB")}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-600">Station Code</p>
                            <p className="font-bold text-lg">{popupData.stationCode}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-600">Type</p>
                            <p className="font-bold text-lg">{popupData.latestData.stationType}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {[
                            { label: "Danger Level", value: popupData.latestData.dangerLevel, color: "red" },
                            { label: "Warning Level", value: popupData.latestData.warningLevel, color: "orange" },
                            { label: "Highest Flow", value: popupData.latestData.highestFlowLevel, color: "purple" },
                            { label: "FRL", value: popupData.latestData.frl, color: "gray" },
                            { label: "MWL", value: popupData.latestData.mwl, color: "gray" },
                          ].map(
                            (item) =>
                              item.value && (
                                <div
                                  key={item.label}
                                  className={`flex justify-between p-4 rounded-xl bg-${item.color}-50 border-l-4 border-${item.color}-500`}
                                >
                                  <span className="font-medium text-gray-700">{item.label}</span>
                                  <span className={`font-bold text-${item.color}-700`}>
                                    {item.value.toFixed(2)} m
                                  </span>
                                </div>
                              )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Trend Tab - With Filters */}
                    {activeTab === "trend" && (
                      <div className="space-y-6">
                        {/* Filter Panel */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                          <h4 className="font-semibold text-gray-800 mb-4">Filter Data</h4>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                              <input
                                type="date"
                                value={filterFrom}
                                onChange={(e) => setFilterFrom(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                              <input
                                type="date"
                                value={filterTo}
                                onChange={(e) => setFilterTo(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Show Lines:</p>
                            <div className="flex flex-wrap gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={showWaterLevel}
                                  onChange={(e) => setShowWaterLevel(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm">Water Level</span>
                              </label>
                              {popupData.latestData.dangerLevel && (
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={showDangerLevel}
                                    onChange={(e) => setShowDangerLevel(e.target.checked)}
                                    className="w-4 h-4 text-red-600 rounded"
                                  />
                                  <span className="text-sm text-red-600 font-medium">Danger Level</span>
                                </label>
                              )}
                              {popupData.latestData.warningLevel && (
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={showWarningLevel}
                                    onChange={(e) => setShowWarningLevel(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 rounded"
                                  />
                                  <span className="text-sm text-orange-600 font-medium">Warning Level</span>
                                </label>
                              )}
                              {popupData.latestData.highestFlowLevel && (
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={showHighestFlow}
                                    onChange={(e) => setShowHighestFlow(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded"
                                  />
                                  <span className="text-sm text-purple-600 font-medium">Highest Flow</span>
                                </label>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Records: <strong>{filteredData.length}</strong>
                            </span>
                            <button
                              onClick={() => {
                                setFilterFrom("");
                                setFilterTo("");
                                setShowWaterLevel(true);
                                setShowDangerLevel(true);
                                setShowWarningLevel(true);
                                setShowHighestFlow(true);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                              Reset Filters
                            </button>
                          </div>
                        </div>

                        {/* Chart */}
                        {filteredData.length > 0 ? (
                          <>
                            <ResponsiveContainer width="100%" height={isPopupFullScreen ? 600 : 400}>
                              <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" />
                                <XAxis
                                  dataKey="time"
                                  type="number"
                                  domain={["dataMin", "dataMax"]}
                                  tickFormatter={(ts) =>
                                    new Date(ts).toLocaleDateString("en-GB", { month: "short", day: "numeric" })
                                  }
                                  stroke="#666"
                                />
                                <YAxis label={{ value: "Water Level (m)", angle: -90, position: "insideLeft" }} stroke="#666" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />

                                {showWaterLevel && (
                                  <Line
                                    type="monotone"
                                    dataKey="waterLevel"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                    name="Water Level"
                                  />
                                )}
                                {showDangerLevel && popupData.latestData.dangerLevel && (
                                  <Line
                                    type="monotone"
                                    dataKey={() => popupData.latestData.dangerLevel}
                                    stroke="#dc2626"
                                    strokeWidth={2}
                                    strokeDasharray="8 5"
                                    dot={false}
                                    name="Danger Level"
                                  />
                                )}
                                {showWarningLevel && popupData.latestData.warningLevel && (
                                  <Line
                                    type="monotone"
                                    dataKey={() => popupData.latestData.warningLevel}
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    strokeDasharray="6 4"
                                    dot={false}
                                    name="Warning Level"
                                  />
                                )}
                                {showHighestFlow && popupData.latestData.highestFlowLevel && (
                                  <Line
                                    type="monotone"
                                    dataKey={() => popupData.latestData.highestFlowLevel}
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    strokeDasharray="10 6"
                                    dot={false}
                                    name="Highest Flow"
                                  />
                                )}
                              </LineChart>
                            </ResponsiveContainer>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-blue-50 p-5 rounded-xl text-center">
                                <p className="text-sm text-gray-600">Current</p>
                                <p className="text-2xl font-bold text-blue-700">
                                  {popupData.latestData.value.toFixed(2)} m
                                </p>
                              </div>
                              <div className="bg-green-50 p-5 rounded-xl text-center">
                                <p className="text-sm text-gray-600">Min (Filtered)</p>
                                <p className="text-2xl font-bold text-green-700">
                                  {Math.min(...filteredData.map((d) => d.waterLevel)).toFixed(2)} m
                                </p>
                              </div>
                              <div className="bg-red-50 p-5 rounded-xl text-center">
                                <p className="text-sm text-gray-600">Max (Filtered)</p>
                                <p className="text-2xl font-bold text-red-700">
                                  {Math.max(...filteredData.map((d) => d.waterLevel)).toFixed(2)} m
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-16 text-gray-500 text-lg">
                            No data matches your filters
                          </div>
                        )}
                      </div>
                    )}

                    {/* Data Table Tab */}
                    {activeTab === "data" && (
                      <div className="space-y-4">
                        <div className="bg-gray-100 p-4 rounded-xl font-medium">
                          Showing {popupData.allData.length} records
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-3">
                          {popupData.allData.map((item, i) => (
                            <div
                              key={i}
                              className={`p-4 rounded-xl border rounded-xl ${
                                i === 0 ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xl font-bold">{item.value.toFixed(2)} m</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(item.actualTime).toLocaleString("en-GB")}
                                  </p>
                                </div>
                                {i === 0 && (
                                  <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                    LATEST
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
            <button onClick={handleZoomIn} className="p-3 bg-white rounded-xl shadow-lg border hover:bg-gray-50 transition" disabled={!map}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button onClick={handleZoomOut} className="p-3 bg-white rounded-xl shadow-lg border hover:bg-gray-50 transition" disabled={!map}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>

          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={toggleBaseMap}
              className="px-6 py-3 bg-white rounded-xl shadow-lg border font-medium flex items-center gap-3 hover:bg-gray-50 transition"
              disabled={!map}
            >
              {isSatellite ? "Street Map" : "Satellite"}
            </button>
          </div>

          <div className="absolute bottom-20 right-4 z-20">
            <button
              onClick={toggleFullscreen}
              className="p-4 bg-white rounded-xl shadow-lg border hover:bg-gray-50 transition"
            >
              {isFullScreen ? (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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