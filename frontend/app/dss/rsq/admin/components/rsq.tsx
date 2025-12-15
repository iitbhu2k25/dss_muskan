// frontend/app/dss/rsq/admin/components/rsq.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
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

export default function RSQAnalysis() {
  const { selectedYear, setSelectedYear, groundWaterData, isLoading, error, fetchGroundWaterData, clearData } =
    useRSQ();
  const { selectedVillages } = useLocation();

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [statusFilter, setStatusFilter] = useState<string>("all");


  // Clear data when villages change
  useEffect(() => {
    clearData();
  }, [selectedVillages]);

  /* ================= GET ALL COLUMNS DYNAMICALLY ================= */

  const allColumns = useMemo(() => {
    if (!groundWaterData?.features?.length) return [];

    const firstFeature = groundWaterData.features[0];
    const props = firstFeature.properties;

    const keys = Object.keys(props).filter(
      key => !['status', 'color'].includes(key)
    );

    return keys;
  }, [groundWaterData]);

  /* ================= SORT ================= */

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  /* ================= FORMAT COLUMN NAME ================= */

  const formatColumnName = (key: string) => {
    return key
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  /* ================= FORMAT CELL VALUE ================= */

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") {
      return value.toFixed(2);
    }
    return String(value);
  };

  /* ================= HIGHLIGHT SEARCH TERM ================= */

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;

    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  /* ================= FILTER + SORT ================= */

  const processedData = useMemo(() => {
    if (!groundWaterData?.features) return [];

    let filtered = [...groundWaterData.features];

    // Global search
    if (globalSearch.trim()) {
      filtered = filtered.filter((f) => {
        const searchLower = globalSearch.toLowerCase();
        return Object.values(f.properties).some((val) =>
          String(val).toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (f) => f.properties.status === statusFilter
      );
    }

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a.properties[sortConfig.key];
        const bVal = b.properties[sortConfig.key];

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        return (
          String(aVal).localeCompare(String(bVal)) *
          (sortConfig.direction === "asc" ? 1 : -1)
        );
      });
    }

    return filtered;
  }, [groundWaterData, sortConfig, globalSearch, statusFilter]);

  /* ================= PAGINATION ================= */

  const paginatedData = processedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    if (!groundWaterData?.features?.length) return null;

    const categories = groundWaterData.features.reduce((acc, f) => {
      const cat = f.properties.status || "No Data";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { categories };
  }, [groundWaterData]);



 
  /* ================= CLEAR FILTERS ================= */

  const clearAllFilters = () => {
    setGlobalSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  if (selectedVillages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Villages Selected</h3>
          <p className="text-gray-600">Please select villages to view RSQ analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* ================= YEAR SELECTION CARD ================= */}

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Select Assessment Year</h3>
            <p className="text-sm text-gray-600">
              📊 Selected {selectedVillages.length} villages for assessment
            </p>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => {
              console.log("📅 Year changed to:", e.target.value);
              setSelectedYear(e.target.value);
            }}
            className="border-2 border-blue-400 px-4 py-2 rounded-xl shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white font-medium text-lg"
            disabled={isLoading}
          >
            <option value="">-- Select Year --</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Only show rest of the content after year is selected */}
      {selectedYear && (
        <>
          {/* ================= STATUS LEGEND CARD ================= */}

          {stats && (
            <div className="bg-white rounded-2xl shadow-lg p-2">
              <div className="flex gap-3 flex-wrap items-center">
                <span className="text-sm font-bold text-gray-700 mr-2">🏷️ Filter by Status:</span>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 ${statusFilter === "all"
                      ? "bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  All ({groundWaterData?.features?.length || 0})
                </button>
                {Object.entries(stats.categories).map(([cat, count]) => {
                  const color =
                    groundWaterData?.features.find(
                      (f) => f.properties.status === cat
                    )?.properties.color || "#d10c0cff";

                  return (
                    <button
                      key={cat}
                      onClick={() => setStatusFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all transform hover:scale-105 ${statusFilter === cat ? "ring-4 ring-offset-2 shadow-lg" : "hover:opacity-80 shadow-md"
                        } ${statusFilter === cat ? "ring-" + color : ''}`}
                    >
                      {cat}: {count}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= SEARCH & ACTIONS CARD ================= */}

          <div className="bg-white rounded-2xl shadow-lg p-2">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-[300px] relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  🔍
                </div>
                <input
                  type="text"
                  placeholder="Search across all columns..."
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border-2 border-gray-200 pl-12 pr-12 py-3 rounded-xl w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xl transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border-2 border-gray-200 px-4 py-3 rounded-xl shadow-sm font-medium hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>

              {(globalSearch || statusFilter !== "all") && (
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
                >
                  🗑️ Clear Filters
                </button>
              )}

            </div>
          </div>

          {/* ================= LOADING / ERROR ================= */}

          {isLoading && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading RSQ data for {selectedYear}...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
              <span className="text-2xl mr-2">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* ================= TABLE CARD ================= */}

          {groundWaterData && !isLoading && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
               <table className="min-w-full text-sm">
  <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white sticky top-0">
    <tr>
      {allColumns.map((key) => (
        <th key={key} className="px-6 py-4 text-left">
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-yellow-300 transition-colors select-none"
            onClick={() => handleSort(key)}
          >
            <span className="font-bold text-sm">{formatColumnName(key)}</span>
            {sortConfig?.key === key ? (
              <span className="text-yellow-300 text-lg">
                {sortConfig.direction === "asc" ? "↑" : "↓"}
              </span>
            ) : (
              <span className="text-white opacity-30">↕</span>
            )}
          </div>
        </th>
      ))}
      <th className="px-6 py-4 text-left">
        <span className="font-bold text-sm">Status</span>
      </th>
    </tr>
  </thead>

  <tbody>
    {paginatedData.length === 0 ? (
      <tr>
        <td colSpan={allColumns.length + 1} className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 font-medium">No data matches your filters</p>
        </td>
      </tr>
    ) : (
      paginatedData.map((f, i) => {
        const p = f.properties;

        return (
          <tr
            key={i}
            className="border-b border-gray-100 hover:bg-gray-50 transition-all"
          >
            {allColumns.map((key) => (
              <td key={key} className="px-6 py-4 font-medium text-gray-700">
                {typeof p[key] === "string"
                  ? highlightText(formatCellValue(p[key]), globalSearch)
                  : formatCellValue(p[key])}
              </td>
            ))}
            <td className="px-6 py-4">
              <span
                className="px-4 py-2 rounded-xl text-white text-xs font-bold inline-block shadow-md"
                style={{ backgroundColor: p.color || "#999" }}
              >
                {p.status || "No Data"}
              </span>
            </td>
          </tr>
        );
      })
    )}
  </tbody>
</table>
              </div>
            </div>
          )}

          {/* ================= PAGINATION CARD ================= */}

          {totalPages > 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex gap-4 items-center justify-between flex-wrap">
                <div className="text-sm text-gray-600 font-medium">
                  📄 Showing <span className="font-bold text-gray-900">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
                  <span className="font-bold text-gray-900">{Math.min(currentPage * rowsPerPage, processedData.length)}</span> of{" "}
                  <span className="font-bold text-gray-900">{processedData.length}</span> results
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium hover:border-blue-400 transform hover:scale-105"
                  >
                    ⏮ First
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium hover:border-blue-400 transform hover:scale-105"
                  >
                    ← Prev
                  </button>
                  <span className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-md">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium hover:border-blue-400 transform hover:scale-105"
                  >
                    Next →
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium hover:border-blue-400 transform hover:scale-105"
                  >
                    Last ⏭
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}