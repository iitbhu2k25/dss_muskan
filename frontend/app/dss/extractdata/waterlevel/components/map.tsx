"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { useMap } from "@/contexts/extract/Waterlevel/MapContext";
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

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

  // Filter states for Trend tab
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showWaterLevel, setShowWaterLevel] = useState(true);
  const [showDangerLevel, setShowDangerLevel] = useState(true);
  const [showWarningLevel, setShowWarningLevel] = useState(true);
  const [showHighestFlow, setShowHighestFlow] = useState(true);

  const downloadCSV = (data: any[]) => {
    const header = ["Water Level (m)", "Date & Time"];
    const rows = data.map(item => [
      item.value.toFixed(2),
      new Date(item.actualTime).toLocaleString("en-GB")
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "water_level_data.csv");
    document.body.appendChild(link);
    link.click();
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const defaultStartDate = "2025-01-01";

    if (!filterFrom) setFilterFrom(defaultStartDate);
    if (!filterTo) setFilterTo(today);
  }, []);

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

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
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

  // Prepare chart data
  const chartData = popupData?.allData
    .map((item) => {
      const dateTime = new Date(item.actualTime);
      return {
        time: dateTime,
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
    .sort((a, b) => a.time.getTime() - b.time.getTime()) || [];

  // Filtered data based on date range
  const filteredData = chartData.filter((item) => {
    if (!filterFrom && !filterTo) return true;
    const itemDate = item.time.toISOString().split("T")[0];
    if (filterFrom && itemDate < filterFrom) return false;
    if (filterTo && itemDate > filterTo) return false;
    return true;
  });

  // Prepare Plotly traces
  const plotlyTraces: any[] = [];

  if (showWaterLevel && filteredData.length > 0) {
    plotlyTraces.push({
      x: filteredData.map(d => d.time),
      y: filteredData.map(d => d.waterLevel),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Water Level',
      line: { color: '#2563eb', width: 3 },
      marker: { size: 4, color: '#2563eb' },
      hovertemplate: '<b>%{x|%d %b %Y, %H:%M}</b><br>Water Level: %{y:.2f} m<extra></extra>',
    });
  }

  if (showDangerLevel && popupData?.latestData.dangerLevel) {
    plotlyTraces.push({
      x: filteredData.map(d => d.time),
      y: Array(filteredData.length).fill(popupData.latestData.dangerLevel),
      type: 'scatter',
      mode: 'lines',
      name: 'Danger Level',
      line: { color: '#dc2626', width: 2, dash: 'dash' },
      hovertemplate: '<b>Danger Level</b><br>%{y:.2f} m<extra></extra>',
    });
  }

  if (showWarningLevel && popupData?.latestData.warningLevel) {
    plotlyTraces.push({
      x: filteredData.map(d => d.time),
      y: Array(filteredData.length).fill(popupData.latestData.warningLevel),
      type: 'scatter',
      mode: 'lines',
      name: 'Warning Level',
      line: { color: '#f97316', width: 2, dash: 'dot' },
      hovertemplate: '<b>Warning Level</b><br>%{y:.2f} m<extra></extra>',
    });
  }

  if (showHighestFlow && popupData?.latestData.highestFlowLevel) {
    plotlyTraces.push({
      x: filteredData.map(d => d.time),
      y: Array(filteredData.length).fill(popupData.latestData.highestFlowLevel),
      type: 'scatter',
      mode: 'lines',
      name: 'Highest Flow',
      line: { color: '#8b5cf6', width: 2, dash: 'dashdot' },
      hovertemplate: '<b>Highest Flow</b><br>%{y:.2f} m<extra></extra>',
    });
  }

  return (
    <div ref={wrapRef} className={`${isFullScreen ? "fixed inset-0 z-50" : "h-screen w-full"} bg-gray-100 p-10 pt-15` }>
      <div className="h-full w-full flex">
        {/* LEFT COLUMN - MAP */}
        <div className={`${isPopupVisible ? 'w-1/2' : 'w-full'} h-full relative transition-all duration-300`}>
          <div className="h-full w-full relative rounded-lg overflow-hidden shadow-2xl border-4 border-gray-300">
            <div ref={mapElement} className="w-full h-full" style={{ minHeight: "400px" }} />

            {/* Hidden popup element for OpenLayers */}
            <div ref={popupRef} style={{ display: 'none' }} />

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

            <div className="absolute bottom-4 right-4 z-20">
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

        {/* RIGHT COLUMN - DETAILS PANEL */}
        {isPopupVisible && (
          <div className="w-1/2 h-full bg-white shadow-2xl border-l-4 border-blue-500 overflow-y-auto mt-2 rounded-lg ml-2  pt-15">
            <div className="relative h-full">
              {/* Close Button */}
              <button
                onClick={closePopup}
                className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Panel Content */}
              <div className="p-6">
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

                    {/* Trend Tab */}
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
                                min="2016-01-01"
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setFilterFrom(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                              <input
                                type="date"
                                value={filterTo}
                                min="2016-01-01"
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setFilterTo(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                   
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Records: <strong>{filteredData.length}</strong>
                            </span>
                            <button
                              onClick={() => {
                                setFilterFrom("2025-01-01");
                                setFilterTo(new Date().toISOString().split("T")[0]);
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

                        {/* Plotly Chart */}
                        {filteredData.length > 0 ? (
                          <>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                              <Plot
                                data={plotlyTraces}
                                layout={{
                                  xaxis: {
                                    title: { text: 'Date & Time' },
                                    type: 'date',
                                    gridcolor: '#e5e7eb',
                                    showgrid: true,
                                  },
                                  yaxis: {
                                    title: { text: 'Water Level (m)' },
                                    gridcolor: '#e5e7eb',
                                    showgrid: true,
                                  },
                                  hovermode: 'x unified',
                                  showlegend: true,
                                  legend: {
                                    x: 0,
                                    y: 1.1,
                                    orientation: 'h',
                                    yanchor: 'bottom',
                                    xanchor: 'left',
                                  },
                                  margin: { l: 60, r: 30, t: 20, b: 60 },
                                  paper_bgcolor: 'white',
                                  plot_bgcolor: 'white',
                                  autosize: true,
                                }}
                                config={{
                                  displayModeBar: true,
                                  displaylogo: false,
                                  modeBarButtonsToAdd: ['select2d', 'lasso2d'],
                                  responsive: true,
                                  toImageButtonOptions: {
                                    format: 'png',
                                    filename: 'water_level_chart',
                                    height: 800,
                                    width: 1200,
                                    scale: 2
                                  }
                                }}
                                style={{ width: '100%', height: isFullScreen ? '600px' : '400px' }}
                                useResizeHandler={true}
                              />
                            </div>

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
                        <div className="bg-gray-100 p-4 rounded-xl font-medium flex justify-between">
                          <span>Showing {popupData.allData.length} records</span>
                          <button
                            onClick={() => downloadCSV(popupData.allData)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700"
                          >
                            Download CSV
                          </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                          <table className="w-full text-left border">
                            <thead className="bg-gray-200 sticky top-0">
                              <tr>
                                <th className="p-3 border">#</th>
                                <th className="p-3 border">Water Level (m)</th>
                                <th className="p-3 border">Date & Time</th>
                                <th className="p-3 border">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {popupData.allData.map((item, i) => (
                                <tr
                                  key={i}
                                  className={`${i === 0 ? "bg-blue-50" : "bg-white"}`}
                                >
                                  <td className="p-3 border">{i + 1}</td>
                                  <td className="p-3 border font-semibold">{item.value.toFixed(2)} m</td>
                                  <td className="p-3 border">
                                    {new Date(item.actualTime).toLocaleString("en-GB")}
                                  </td>
                                  <td className="p-3 border font-bold">
                                    {i === 0 ? (
                                      <span className="text-blue-700">LATEST</span>
                                    ) : (
                                      "---"
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterLevelMap;