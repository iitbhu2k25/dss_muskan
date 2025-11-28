"use client";

import React from "react";
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface DataProps {
  isPopupVisible: boolean;
  isLoading: boolean;
  popupData: any;
  closePopup: () => void;
  activeTab: 'current' | 'trend' | 'data';
  setActiveTab: (tab: 'current' | 'trend' | 'data') => void;
  filterFrom: string;
  setFilterFrom: (date: string) => void;
  filterTo: string;
  setFilterTo: (date: string) => void;
  showWaterLevel: boolean;
  setShowWaterLevel: (show: boolean) => void;
  showDangerLevel: boolean;
  setShowDangerLevel: (show: boolean) => void;
  showWarningLevel: boolean;
  setShowWarningLevel: (show: boolean) => void;
  showHighestFlow: boolean;
  setShowHighestFlow: (show: boolean) => void;
  chartData: any[];
  filteredData: any[];
  plotlyTraces: any[];
  downloadCSV: (data: any[]) => void;
  isFullScreen: boolean;
}

const Data: React.FC<DataProps> = ({
  isPopupVisible,
  isLoading,
  popupData,
  closePopup,
  activeTab,
  setActiveTab,
  filterFrom,
  setFilterFrom,
  filterTo,
  setFilterTo,
  showWaterLevel,
  setShowWaterLevel,
  showDangerLevel,
  setShowDangerLevel,
  showWarningLevel,
  setShowWarningLevel,
  showHighestFlow,
  setShowHighestFlow,
  chartData,
  filteredData,
  plotlyTraces,
  downloadCSV,
  isFullScreen,
}) => {
  if (!isPopupVisible) return null;

  return (
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
                        {popupData.allData.map((item: any, i: number) => (
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
  );
};

export default Data;