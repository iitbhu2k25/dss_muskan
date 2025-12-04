/// frontend/app/dss/rsq/admin/components/rsq.tsx
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

/* ================= CATEGORY COLORS ================= */

const getCategoryColor = (category: string): string => {
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

  /* ================= SORTING ================= */

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!groundWaterData?.features) return [];

    const sorted = [...groundWaterData.features];

    if (sortConfig) {
      sorted.sort((a, b) => {
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
    }

    return sorted;
  }, [groundWaterData, sortConfig]);

  /* ================= STATISTICS ================= */

  const stats = React.useMemo(() => {
    if (!groundWaterData?.features?.length) return null;

    const categories = groundWaterData.features.reduce((acc, f) => {
      const cat = f.properties.CATEGORY || "Unknown";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const avgStage = groundWaterData.features.reduce(
      (sum, f) => sum + (f.properties.GW_STAGE || 0),
      0
    ) / groundWaterData.features.length;

    return {
      total: groundWaterData.features.length,
      categories,
      avgStage: avgStage.toFixed(2),
    };
  }, [groundWaterData]);

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
    <div className="space-y-4">
      {/* ================= HEADER & YEAR SELECTOR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">RSQ Analysis</h2>
          <p className="text-sm text-gray-600">
            {selectedVillages.length} village{selectedVillages.length !== 1 ? "s" : ""} selected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= LOADING STATE ================= */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading groundwater data...</p>
        </div>
      )}

      {/* ================= ERROR STATE ================= */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error: {error}</p>
        </div>
      )}

      {/* ================= STATISTICS ================= */}
      {stats && !isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Villages</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Avg GW Stage (%)</div>
            <div className="text-2xl font-bold text-purple-600">{stats.avgStage}</div>
          </div>

          {Object.entries(stats.categories).map(([category, count]) => (
            <div key={category} className={`${getCategoryColor(category)} rounded-lg p-4`}>
              <div className="text-sm font-medium">{category}</div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          ))}
        </div>
      )}

      {/* ================= DATA TABLE ================= */}
      {groundWaterData && !isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { key: "village", label: "Village" },
                    { key: "GWA", label: "GWA (MCM)" },
                    { key: "IRRI", label: "Irrigation" },
                    { key: "DOME", label: "Domestic" },
                    { key: "INDU", label: "Industrial" },
                    { key: "ALLOC", label: "Allocation" },
                    { key: "GWNR", label: "Net Recharge" },
                    { key: "GW_STAGE", label: "GW Stage (%)" },
                    { key: "CATEGORY", label: "Category" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortConfig?.key === col.key && (
                          <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((feature, idx) => {
                  const p = feature.properties;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {p.village || p.vlcode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.GWA?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.IRRI?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.DOME?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.INDU?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.ALLOC?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.GWNR?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {p.GW_STAGE?.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(p.CATEGORY)}`}>
                          {p.CATEGORY}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= NO DATA STATE ================= */}
      {!groundWaterData && !isLoading && !error && (
        <div className="text-center py-8 text-gray-500">
          No data available for the selected villages and year
        </div>
      )}
    </div>
  );
}