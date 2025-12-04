"use client";

import React, { useState } from "react";
import { useRSQ } from "@/contexts/rsq/admin/RsqContext";
import { useLocation } from "@/contexts/rsq/admin/LocationContext";

/* ================= YEAR OPTIONS ================= */

const YEAR_OPTIONS = [
  "2016 - 17",
  "2019 - 20",
  "2021 - 22",
  "2022 - 23",
  "2023 - 24",
];

/* ================= CATEGORY COLORS & HELPERS ================= */

const getStageCategory = (stage: number): string => {
  if (stage <= 70) return "Safe";
  if (stage <= 90) return "Semi-Critical";  
  if (stage <= 100) return "Critical";
  return "Over-Exploited";
};

const getCategoryColor = (stage: number): string => {
  const category = getStageCategory(stage);
  const colors: { [key: string]: string } = {
    "Safe": "bg-green-100 text-green-800",
    "Semi-Critical": "bg-yellow-100 text-yellow-800",
    "Critical": "bg-orange-100 text-orange-800",
    "Over-Exploited": "bg-red-100 text-red-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
};

/* ================= MAIN COMPONENT ================= */

export default function RSQAnalysis() {
  const { selectedYear, setSelectedYear, groundWaterData, isLoading, error } = useRSQ();
  const { selectedVillages, villages } = useLocation();
  
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ================= SORTING ================= */

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  /* ================= FILTERED & PAGINATED DATA ================= */

  const processedData = React.useMemo(() => {
    if (!groundWaterData?.features) return [];

    return groundWaterData.features
      .filter((feature) => {
        const p = feature.properties;
        const villageName = (p.village || p.vlcode || "").toLowerCase();
        const blockName = (p.blockname || "").toLowerCase();
        return (
          villageName.includes(searchTerm.toLowerCase()) ||
          blockName.includes(searchTerm.toLowerCase())
        );
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;

        const aVal = a.properties[sortConfig.key];
        const bVal = b.properties[sortConfig.key];

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [groundWaterData, sortConfig, searchTerm]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  /* ================= STATISTICS ================= */

  const stats = React.useMemo(() => {
    if (!groundWaterData?.features?.length) return null;

    const categories = groundWaterData.features.reduce((acc, f) => {
      const stage = f.properties.Stage_of_Ground_Water_Extraction || 0;
      const cat = getStageCategory(stage);
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const avgStage = groundWaterData.features.reduce(
      (sum, f) => sum + (f.properties.Stage_of_Ground_Water_Extraction || 0),
      0
    ) / groundWaterData.features.length;

    const totalExtraction = groundWaterData.features.reduce(
      (sum, f) => sum + (f.properties.Total_Extraction || 0),
      0
    );

    const totalRecharge = groundWaterData.features.reduce(
      (sum, f) => sum + (f.properties.Total_Annual_Ground_Water_Recharge || 0),
      0
    );

    return {
      total: groundWaterData.features.length,
      filtered: processedData.length,
      categories,
      avgStage: avgStage.toFixed(2),
      totalExtraction: totalExtraction.toFixed(2),
      totalRecharge: totalRecharge.toFixed(2),
    };
  }, [groundWaterData, processedData.length]);

  /* ================= PAGINATION HANDLERS ================= */

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /* ================= RENDER ================= */

  if (selectedVillages.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 mb-4">
          📍 Please select villages from the Area Selection tab to view RSQ analysis
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-full">
      {/* ================= HEADER & CONTROLS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">RSQ Analysis</h2>
          <p className="text-sm text-gray-600">
            {stats?.filtered || 0} of {stats?.total || 0} villages • {selectedVillages.length} selected
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
            >
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Show:</label>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-20"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= SEARCH & STATS ================= */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search villages or blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {stats && (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(stats.categories).map(([category, count]) => (
              <div
                key={category}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${getCategoryColor(
                  category === "Safe" ? 50 : category === "Semi-Critical" ? 80 : category === "Critical" ? 95 : 110
                )}`}
              >
                {category}: {count}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= LOADING STATE ================= */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading groundwater data...</p>
        </div>
      )}

      {/* ================= ERROR STATE ================= */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-red-800 font-semibold">Error loading data</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= INTERACTIVE SCROLLABLE TABLE ================= */}
      {groundWaterData && !isLoading && (
        <>
          {/* Pagination Info */}
          {processedData.length > 0 && (
            <div className="text-sm text-gray-600 flex items-center justify-between">
              <span>
                Showing {((currentPage - 1) * rowsPerPage) + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, processedData.length)} of{" "}
                {processedData.length} results
              </span>
              <div className="flex items-center gap-1 text-sm">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="max-h-[500px] overflow-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-20">
                  <tr>
                    {[
                      { key: "village", label: "Village", width: "w-32" },
                      { key: "blockname", label: "Block", width: "w-28" },
                      { key: "Total_Annual_Ground_Water_Recharge", label: "Annual Recharge", width: "w-32" },
                      { key: "Annual_Extractable_Ground_Water_Resource", label: "Extractable GW", width: "w-32" },
                      { key: "Irrigation_Use", label: "Irrigation", width: "w-28" },
                      { key: "Domestic_Use", label: "Domestic", width: "w-28" },
                      { key: "Total_Extraction", label: "Total Extraction", width: "w-36" },
                      { key: "Net_Ground_Water_Availability_for_future_use", label: "Net Availability", width: "w-36" },
                      { key: "Stage_of_Ground_Water_Extraction", label: "GW Stage (%)", width: "w-24" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className={`
                          ${col.width} px-4 py-4 text-left text-xs font-semibold text-gray-700
                          uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors
                          bg-white border-b-2 border-gray-200
                        `}
                        onClick={() => handleSort(col.key)}
                      >
                        <div className="flex items-center gap-1 truncate">
                          {col.label}
                          {sortConfig?.key === col.key && (
                            <span className="text-blue-600 font-bold">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="w-28 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-white border-b-2 border-gray-200">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedData.map((feature, idx) => {
                    const p = feature.properties;
                    const stage = p.Stage_of_Ground_Water_Extraction || 0;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-blue-50/50 transition-colors group"
                      >
                        <td className="w-32 px-4 py-4 text-sm font-semibold text-gray-900 bg-gray-50/50 sticky left-0 z-10 group-hover:bg-blue-50">
                          {p.village || p.vlcode || "-"}
                        </td>
                        <td className="w-28 px-4 py-3 text-sm text-gray-700">{p.blockname || "-"}</td>
                        <td className="w-32 px-4 py-3 text-sm text-gray-700 font-mono">
                          {p.Total_Annual_Ground_Water_Recharge?.toLocaleString() || "-"}
                        </td>
                        <td className="w-32 px-4 py-3 text-sm text-gray-700 font-mono">
                          {p.Annual_Extractable_Ground_Water_Resource?.toLocaleString() || "-"}
                        </td>
                        <td className="w-28 px-4 py-3 text-sm text-gray-700 font-mono">
                          {p.Irrigation_Use?.toLocaleString() || "-"}
                        </td>
                        <td className="w-28 px-4 py-3 text-sm text-gray-700 font-mono">
                          {p.Domestic_Use?.toLocaleString() || "-"}
                        </td>
                        <td className="w-36 px-4 py-3 text-sm text-gray-700 font-mono font-semibold">
                          {p.Total_Extraction?.toLocaleString() || "-"}
                        </td>
                        <td className="w-36 px-4 py-3 text-sm text-gray-700 font-mono">
                          {p.Net_Ground_Water_Availability_for_future_use?.toLocaleString() || "-"}
                        </td>
                        <td className="w-24 px-4 py-3 text-sm font-semibold text-gray-900">
                          {stage.toFixed(1)}%
                        </td>
                        <td className="w-28 px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(stage)} shadow-sm`}>
                            {getStageCategory(stage)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGINATION CONTROLS ================= */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {/* Page buttons */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 
                    ? i + 1 
                    : totalPages - 4 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1.5 border rounded-lg font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "hover:bg-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= NO DATA STATE ================= */}
      {!groundWaterData && !isLoading && !error && (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No groundwater data available</h3>
          <p>Select villages and a year to view RSQ analysis</p>
        </div>
      )}

      {processedData.length === 0 && !isLoading && groundWaterData && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching results</h3>
          <p>Try adjusting your search term or filters</p>
        </div>
      )}
    </div>
  );
}
