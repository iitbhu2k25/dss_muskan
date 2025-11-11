"use client";

import React, { useMemo, useState } from 'react';
import { useDemand } from '@/contexts/groundwater_assessment/drain/DemandContext';
import { useLocation } from '@/contexts/groundwater_assessment/drain/LocationContext';
import { useWell } from '@/contexts/groundwater_assessment/drain/WellContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Field Definitions & Labels (like Recharge.tsx)
const DOMESTIC_DISPLAY_FIELDS: string[] = [
  'village_name',
  'demand_mld',
  'forecast_population',
  'target_year',
  'lpcd'
];

const AGRICULTURAL_DISPLAY_FIELDS: string[] = [
  'village',
  'cropland',
  'village_demand'
];

const DOMESTIC_LABEL_MAP: Record<string, string> = {
  village_name: "Village Name",
  demand_mld: "Demand (Million litres/Year)",
  forecast_population: "Forecasted Population",
  target_year: "Target Year",
  lpcd: "LPCD",
};

const AGRICULTURAL_LABEL_MAP: Record<string, string> = {
  village: "Village Name",
  cropland: "Cropland (m²)",
  village_demand: "Agriculture Demand (Million litres/Year)",
};

const formatLabel = (key: string, map: Record<string, string>) =>
  map[key] || key.replace(/_/g, " ");

const Demand = () => {
  const {
    domesticChecked,
    agriculturalChecked,
    industrialChecked,
    perCapitaConsumption,
    kharifChecked,
    rabiChecked,
    zaidChecked,
    availableCrops,
    selectedCrops,
    cropsLoading,
    cropsError,
    groundwaterFactor,
    chartData,
    chartsError,
    domesticTableData,
    agriculturalTableData,
    industrialTableData,
    domesticLoading,
    agriculturalLoading,
    industrialLoading,
    domesticError,
    agriculturalError,
    industrialError,
    setDomesticChecked,
    setAgriculturalChecked,
    setIndustrialChecked,
    setPerCapitaConsumption,
    setGroundwaterFactor,
    clearChartData,
    setKharifChecked,
    setRabiChecked,
    setZaidChecked,
    toggleCropSelection,
    computeDomesticDemand,
    computeAgriculturalDemand,
    computeIndustrialDemand,
    canComputeDomesticDemand,
    canComputeAgriculturalDemand,
    canComputeIndustrialDemand
  } = useDemand();

  const { selectedVillages } = useLocation();
  const { csvFilename } = useWell();

  // State for chart selection
  const [selectedChart, setSelectedChart] = useState<'individual' | 'cumulative'>('individual');
  const [showDomesticTable, setShowDomesticTable] = useState(true);
  const toggleDomesticTable = () => setShowDomesticTable((prev) => !prev);
  const [showAgriculturalTable, setShowAgriculturalTable] = useState(true);
  const toggleAgriculturalTable = () => setShowAgriculturalTable((prev) => !prev);
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);

  // Domestic Table States for Search & Sort
  const [domesticSearchInput, setDomesticSearchInput] = useState("");
  const [domesticAppliedSearch, setDomesticAppliedSearch] = useState("");
  const [domesticAppliedSort, setDomesticAppliedSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Agricultural Table States for Search & Sort
  const [agriculturalSearchInput, setAgriculturalSearchInput] = useState("");
  const [agriculturalAppliedSearch, setAgriculturalAppliedSearch] = useState("");
  const [agriculturalAppliedSort, setAgriculturalAppliedSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Handle Agricultural Compute with Validation
  const handleAgriculturalClick = () => {
    const isAnySeasonSelected = kharifChecked || rabiChecked || zaidChecked;
    const isAnyCropSelected = Object.values(selectedCrops).some(cropsArray => cropsArray && cropsArray.length > 0);
    if (!isAnySeasonSelected || !isAnyCropSelected) {
      setShowSelectionWarning(true);
      return;
    }
    setShowSelectionWarning(false);
    computeAgriculturalDemand();
  };

  // Domestic Table Processing (with robust sort logic from Recharge.tsx)
  const processedDomesticData = useMemo(() => {
    let data = [...domesticTableData];
    // Apply Search (by village_name)
    if (domesticAppliedSearch) {
      data = data.filter(row =>
        String(row.village_name || "").toLowerCase().includes(domesticAppliedSearch.toLowerCase())
      );
    }
    // Apply Sort
    if (domesticAppliedSort) {
      data.sort((a, b) => {
        const aValue = a[domesticAppliedSort.key];
        const bValue = b[domesticAppliedSort.key];
        if (aValue == null) return domesticAppliedSort.direction === 'asc' ? -1 : 1;
        if (bValue == null) return domesticAppliedSort.direction === 'asc' ? 1 : -1;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return domesticAppliedSort.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return domesticAppliedSort.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }
        // Fallback for numbers stored as strings
        const numA = parseFloat(String(aValue));
        const numB = parseFloat(String(bValue));
        if (!isNaN(numA) && !isNaN(numB)) {
          return domesticAppliedSort.direction === 'asc'
            ? numA - numB
            : numB - numA;
        }
        return 0;
      });
    }
    return data;
  }, [domesticTableData, domesticAppliedSearch, domesticAppliedSort]);

  // Agricultural Table Processing (with robust sort logic from Recharge.tsx)
  const processedAgriculturalData = useMemo(() => {
    let data = [...agriculturalTableData];
    // Apply Search (by village)
    if (agriculturalAppliedSearch) {
      data = data.filter(row =>
        String(row.village || "").toLowerCase().includes(agriculturalAppliedSearch.toLowerCase())
      );
    }
    // Apply Sort
    if (agriculturalAppliedSort) {
      data.sort((a, b) => {
        const aValue = a[agriculturalAppliedSort.key];
        const bValue = b[agriculturalAppliedSort.key];
        if (aValue == null) return agriculturalAppliedSort.direction === 'asc' ? -1 : 1;
        if (bValue == null) return agriculturalAppliedSort.direction === 'asc' ? 1 : -1;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return agriculturalAppliedSort.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return agriculturalAppliedSort.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }
        // Fallback for numbers stored as strings
        const numA = parseFloat(String(aValue));
        const numB = parseFloat(String(bValue));
        if (!isNaN(numA) && !isNaN(numB)) {
          return agriculturalAppliedSort.direction === 'asc'
            ? numA - numB
            : numB - numA;
        }
        return 0;
      });
    }
    return data;
  }, [agriculturalTableData, agriculturalAppliedSearch, agriculturalAppliedSort]);

  // Domestic Handlers
  const handleDomesticApplySearch = () => {
    setDomesticAppliedSearch(domesticSearchInput.trim());
  };

  const handleDomesticResetSort = () => {
    setDomesticAppliedSort(null);
  };

  // Agricultural Handlers
  const handleAgriculturalApplySearch = () => {
    setAgriculturalAppliedSearch(agriculturalSearchInput.trim());
  };

  const handleAgriculturalResetSort = () => {
    setAgriculturalAppliedSort(null);
  };

  // Domestic Table Component (Table only)
  type DomesticTableProps = {
    tableData: any[];
    title: string;
    sortConfig?: { key?: string; direction?: "asc" | "desc" };
    onSort?: (field: string) => void;
    isSearched?: boolean;
  };

  const DomesticTable = ({ tableData, title, sortConfig, onSort, isSearched }: DomesticTableProps) => {
    const handleSort = (field: string) => {
      onSort?.(field);
    };

    const getSortIcon = (field: string) => {
      if (sortConfig?.key !== field) return null;
      return sortConfig.direction === "asc" ? (
        <span className="ml-1 text-blue-600">▲</span>
      ) : (
        <span className="ml-1 text-blue-600">▼</span>
      );
    };

    return (
      <div className="mt-4">
        <h4 className="text-md font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {title}
        </h4>
        <div className="overflow-x-auto overflow-y-auto max-h-96 bg-white border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider bg-gray-50 border-b-2 border-gray-200">
                  S.No.
                </th>
                {DOMESTIC_DISPLAY_FIELDS.map((header) => (
                  <th
                    key={header}
                    onClick={() => handleSort(header)}
                    className={`
                      px-4 py-3 text-left text-xs font-medium text-gray-600 tracking-wider
                      bg-gray-50 border-b-2 border-gray-200 cursor-pointer
                      hover:bg-gray-100 transition-colors select-none
                    `}
                  >
                    <div className="flex items-center">
                      {formatLabel(header, DOMESTIC_LABEL_MAP)}
                      {getSortIcon(header)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                    {index + 1}
                  </td>
                  {DOMESTIC_DISPLAY_FIELDS.map((field) => (
                    <td
                      key={field}
                      className={`px-4 py-3 text-sm whitespace-nowrap ${
                        field === 'demand_mld' ? 'text-blue-900 font-semibold' : 'text-gray-900'
                      }`}
                    >
                      {row[field] !== null && row[field] !== undefined ? String(row[field]) : 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span>
            Showing <strong>{tableData.length}</strong> record{tableData.length !== 1 ? "s" : ""}
            {(sortConfig?.key || isSearched) ? ` (filtered)` : ""}
          </span>
          {/* Optional: Add total demand summary here */}
        </div>
      </div>
    );
  };

  // Agricultural Table Component (Table only)
  type AgriculturalTableProps = {
    tableData: any[];
    title: string;
    sortConfig?: { key?: string; direction?: "asc" | "desc" };
    onSort?: (field: string) => void;
    isSearched?: boolean;
  };

  const AgriculturalTable = ({ tableData, title, sortConfig, onSort, isSearched }: AgriculturalTableProps) => {
    const handleSort = (field: string) => {
      onSort?.(field);
    };

    const getSortIcon = (field: string) => {
      if (sortConfig?.key !== field) return null;
      return sortConfig.direction === "asc" ? (
        <span className="ml-1 text-blue-600">▲</span>
      ) : (
        <span className="ml-1 text-blue-600">▼</span>
      );
    };

    return (
      <div className="mt-4">
        <h4 className="text-md font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {title}
        </h4>
        <div className="overflow-x-auto overflow-y-auto max-h-96 bg-white border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider bg-gray-50 border-b-2 border-gray-200">
                  S.No.
                </th>
                {AGRICULTURAL_DISPLAY_FIELDS.map((header) => (
                  <th
                    key={header}
                    onClick={() => handleSort(header)}
                    className={`
                      px-4 py-3 text-left text-xs font-medium text-gray-600 tracking-wider
                      bg-gray-50 border-b-2 border-gray-200 cursor-pointer
                      hover:bg-gray-100 transition-colors select-none
                    `}
                  >
                    <div className="flex items-center">
                      {formatLabel(header, AGRICULTURAL_LABEL_MAP)}
                      {getSortIcon(header)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {row.village || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {row.cropland ? Number(row.cropland).toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700 whitespace-nowrap">
                    {row.village_demand ? Number(row.village_demand).toFixed(3) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span>
            Showing <strong>{tableData.length}</strong> village{tableData.length !== 1 ? "s" : ""}
            {(sortConfig?.key || isSearched) ? ` (filtered)` : ""}
          </span>
          {/* You can add a summary stat here if needed */}
        </div>
      </div>
    );
  };

  // Chart Display (unchanged)
  const ChartDisplay = () => {
    if (!chartData) return null;
    const individualCropsData = chartData.individual_crops.months.map((month, index) => {
      const dataPoint: any = { month };
      Object.keys(chartData.individual_crops.crops_data).forEach(crop => {
        dataPoint[crop] = chartData.individual_crops.crops_data[crop][index];
      });
      return dataPoint;
    });
    const cumulativeData = chartData.cumulative_demand.months.map((month, index) => ({
      month,
      demand: chartData.cumulative_demand.values[index]
    }));
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#ff00ff', '#ff0000'];
    const cropNames = Object.keys(chartData.individual_crops.crops_data);
    return (
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Agricultural Water Demand Analysis
        </h4>
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedChart('individual')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${selectedChart === 'individual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Individual Crops
              </button>
              <button
                onClick={() => setSelectedChart('cumulative')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${selectedChart === 'cumulative'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Total Demand
              </button>
            </nav>
          </div>
        </div>
        <div className="chart-display bg-white p-4 rounded-lg border border-gray-200">
          {selectedChart === 'individual' ? (
            <div>
              <h5 className="text-md font-semibold text-gray-700 mb-4">
                {chartData.individual_crops.title}
              </h5>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={individualCropsData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    label={{ value: chartData.individual_crops.y_label, angle: -90, position: 'insideLeft', offset: 20, dy: 120 }}
                  />
                  <Tooltip
                    labelFormatter={(label) => `Month: ${label}`}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const filteredPayload = payload.filter((entry) => entry.value !== 0);
                        if (!filteredPayload.length) return null;
                        return (
                          <div className="bg-white p-2 shadow-md rounded border text-xs">
                            <p className="font-semibold">{`Month: ${label}`}</p>
                            {filteredPayload.map((entry, index) => (
                              <p key={`item-${index}`} style={{ color: entry.color }}>
                                {`${entry.name}: ${Number(entry.value).toFixed(2)} mm`}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {cropNames.map((crop, index) => (
                    <Line
                      key={crop}
                      type="monotone"
                      dataKey={crop}
                      stroke={colors[index % colors.length]}
                      strokeWidth={0} // Set to 0 to only show dots
                      strokeOpacity={0} // Hide the line itself
                      name={crop}
                      dot={{ fill: colors[index % colors.length], stroke: colors[index % colors.length], r: 4 }}
                      activeDot={{ fill: colors[index % colors.length], stroke: colors[index % colors.length], r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div>
              <h5 className="text-md font-semibold text-gray-700 mb-4 mr-8">
                {chartData.cumulative_demand.title}
              </h5>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: chartData.cumulative_demand.y_label, angle: -90, position: 'insideLeft', dy: 80, offset: 20 }} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} mm`, 'Total Demand']} labelFormatter={(label) => `Month: ${label}`} />
                  <Area type="monotone" dataKey="demand" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Generic Table for Industrial (unchanged)
  const TableDisplay = ({ tableData, title }: { tableData: any[]; title: string }) => (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="text-md font-semibold text-gray-800">{title}</h4>
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-96 bg-white border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {Object.keys(tableData[0] || {}).map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {Object.values(row).map((value, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {String(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Showing {tableData.length} record{tableData.length !== 1 ? 's' : ''}
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
      <h3 className="text-lg font-semibold text-green-800 mb-3">Groundwater Demand Assessment</h3>
      {/* Demand Type Checkboxes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Demand Types:</label>
        <div className="grid grid-cols-3 gap-4 max-w-md">
          <label className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={domesticChecked} onChange={(e) => setDomesticChecked(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <span className="ml-2 text-sm text-gray-700">Domestic</span>
          </label>
          <label className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={agriculturalChecked} onChange={(e) => setAgriculturalChecked(e.target.checked)} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
            <span className="ml-2 text-sm text-gray-700">Agricultural</span>
          </label>
          <label className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={industrialChecked} onChange={(e) => setIndustrialChecked(e.target.checked)} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
            <span className="ml-2 text-sm text-gray-700">Industrial</span>
          </label>
        </div>
      </div>
      {/* 1. DOMESTIC DEMAND SECTION*/}
      {domesticChecked && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          {/* ---------- Loading overlay ---------- */}
          {domesticLoading && (
            <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center bg-white rounded-xl shadow-2xl p-8">
                <div className="inline-block relative">
                  <svg className="animate-spin h-20 w-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    {/* …gradient defs… */}
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="url(#spinner-gradient-domestic)" strokeWidth="3" />
                    <path className="opacity-90" fill="url(#spinner-gradient-2-domestic)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xl font-semibold mt-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Computing Domestic Demand...
                </p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we calculate domestic water requirements</p>
              </div>
            </div>
          )}
          <h4 className="text-md font-semibold text-blue-800 mb-3">Domestic Demand Parameters</h4>
          {/* ---------- Per Capita Input ---------- */}
          <div className="mb-4 max-w-sm">
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Per Capita Consumption (LPCD)
              </label>
              <div className="group relative inline-block">
                <span className="cursor-help text-blue-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div className={`
                  absolute left-1/2 -translate-x-1/2 mt-1 w-64
                  bg-gray-800 text-white text-xs rounded-lg p-3
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200 shadow-lg z-50 pointer-events-none
                `}>
                  Per Capita Consumption 60 liters according to Central Public Health
                  and Environmental Engineering Organization (CPHEEO) standards.
                </div>
              </div>
            </div>
            <input
              type="number"
              value={perCapitaConsumption}
              onChange={e => setPerCapitaConsumption(Number(e.target.value))}
              className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter LPCD value (e.g., 70)"
              min="1"
            />
          </div>
          {/* ---------- Error message ---------- */}
          {domesticError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {/* …error… */}
            </div>
          )}
          {/* ---------- Action Buttons ---------- */}
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start">
            <button
              onClick={computeDomesticDemand}
              disabled={domesticLoading || !canComputeDomesticDemand()}
              className={[
                "inline-flex items-center justify-center gap-2 text-white font-medium transition-colors duration-200 rounded-full py-3 px-5",
                domesticLoading || !canComputeDomesticDemand()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50",
              ].join(" ")}
            >
              {domesticLoading ? "Computing..." : "Compute Domestic Demand"}
            </button>
            {/* ---------- Search (kept) ---------- */}
            {domesticTableData.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 ml-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search village..."
                    value={domesticSearchInput}
                    onChange={e => setDomesticSearchInput(e.target.value)}
                    onKeyPress={e => e.key === "Enter" && handleDomesticApplySearch()}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleDomesticApplySearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </button>
                </div>
                {/* ---------- Table toggle (kept) ---------- */}
                <button
                  onClick={toggleDomesticTable}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  title={showDomesticTable ? "Hide Table" : "Show Table"}
                >
                  {showDomesticTable ? (
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.94 17.94A10.016 10.016 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.96 9.96 0 012.293-3.95M6.06 6.06A9.991 9.991 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.958 9.958 0 01-4.042 5.142" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 01-3 3m0-6a3 3 0 013 3m0 0a3 3 0 01-3 3m0 0L3 3m0 0l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
          {/* ---------- Active filters ---------- */}
          {(domesticAppliedSearch || domesticAppliedSort) && (
            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              {domesticAppliedSearch && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Search: "{domesticAppliedSearch}"
                  <button onClick={() => { setDomesticAppliedSearch(""); setDomesticSearchInput(""); }} className="ml-1 hover:text-blue-900">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {domesticAppliedSort && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  Sort: {formatLabel(domesticAppliedSort.key, DOMESTIC_LABEL_MAP)} ({domesticAppliedSort.direction === "asc" ? "Ascending" : "Descending"})
                  <button onClick={handleDomesticResetSort} className="ml-1 hover:text-green-900">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
          {/* ---------- Domestic Table (with inline sorting) ---------- */}
          {showDomesticTable && domesticTableData.length > 0 && (
            <DomesticTable
              tableData={processedDomesticData}
              title="Groundwater Consumption for Domestic Need"
              sortConfig={domesticAppliedSort || undefined}
              onSort={(field: string) => {
                const direction =
                  domesticAppliedSort?.key === field && domesticAppliedSort?.direction === "asc"
                    ? "desc"
                    : "asc";
                setDomesticAppliedSort({ key: field, direction });
              }}
              isSearched={!!domesticAppliedSearch}
            />
          )}
        </div>
      )}
      {/* 2. AGRICULTURAL DEMAND SECTION */}
      {agriculturalChecked && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          {agriculturalLoading && (
            <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center bg-white rounded-xl shadow-2xl p-8">
                {/* ... Loading Spinner SVG ... */}
                <div className="inline-block relative">
                  <svg className="animate-spin h-20 w-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="spinner-gradient-agricultural" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                      <linearGradient id="spinner-gradient-2-agricultural" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="url(#spinner-gradient-agricultural)" strokeWidth="3" />
                    <path className="opacity-90" fill="url(#spinner-gradient-2-agricultural)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xl font-semibold mt-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Computing Agricultural Demand...
                </p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we calculate agricultural water requirements</p>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2 mb-3">
            <h4 className="text-md font-semibold text-yellow-800">Agricultural Demand Parameters</h4>
            <div className="group relative inline-block">
              <span className="cursor-help text-blue-500">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              {/* Tooltip – visible on hover */}
              <div
                className="absolute left-1/2 -translate-x-1/2 mt-1 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50 pointer-events-none"
              >
                All agricultural water demand is being computed using the FAO AquaCrop model (2009).
              </div>
            </div>
          </div>
          {/* Season Selection */}
          <div className="mb-4">
            {/* ... Season Checkboxes ... */}
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Seasons:</label>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center">
                <input type="checkbox" checked={kharifChecked} onChange={(e) => setKharifChecked(e.target.checked)} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700 font-medium">Kharif</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" checked={rabiChecked} onChange={(e) => setRabiChecked(e.target.checked)} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700 font-medium">Rabi</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" checked={zaidChecked} onChange={(e) => setZaidChecked(e.target.checked)} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700 font-medium">Zaid</span>
              </label>
            </div>
          </div>
          {/* 3-Column Grid for Season Crops */}
          {(kharifChecked || rabiChecked || zaidChecked) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* ... Kharif, Rabi, Zaid crop selection blocks ... */}
              {kharifChecked && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-green-800">Kharif Season Crops</h5>
                    {availableCrops.Kharif?.length > 0 && (
                      <label className="flex items-center text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCrops.Kharif?.length === availableCrops.Kharif.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              availableCrops.Kharif.forEach(crop => !selectedCrops.Kharif?.includes(crop) && toggleCropSelection("Kharif", crop));
                            } else {
                              availableCrops.Kharif.forEach(crop => selectedCrops.Kharif?.includes(crop) && toggleCropSelection("Kharif", crop));
                            }
                          }}
                          className="h-3 w-3 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-1"
                        />
                        Select All
                      </label>
                    )}
                  </div>
                  {cropsLoading.Kharif ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">Loading crops...</div>
                  ) : cropsError.Kharif ? (
                    <p className="text-sm text-red-600">Error: {cropsError.Kharif}</p>
                  ) : availableCrops.Kharif && availableCrops.Kharif.length > 0 ? (
                    <div className="space-y-2">
                      {availableCrops.Kharif.map(crop => (
                        <label key={crop} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={selectedCrops.Kharif?.includes(crop) || false}
                            onChange={() => toggleCropSelection("Kharif", crop)}
                            className="h-3 w-3 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-2"
                          />
                          <span className="text-gray-700">{crop}</span>
                        </label>
                      ))}
                      {selectedCrops.Kharif && selectedCrops.Kharif.length > 0 && (
                        <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
                          ✓ Selected: {selectedCrops.Kharif.length} crop{selectedCrops.Kharif.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No crops available for Kharif season.</p>
                  )}
                </div>
              )}
              {rabiChecked && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-orange-800">Rabi Season Crops</h5>
                    {availableCrops.Rabi?.length > 0 && (
                      <label className="flex items-center text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCrops.Rabi?.length === availableCrops.Rabi.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              availableCrops.Rabi.forEach(crop => !selectedCrops.Rabi?.includes(crop) && toggleCropSelection("Rabi", crop));
                            } else {
                              availableCrops.Rabi.forEach(crop => selectedCrops.Rabi?.includes(crop) && toggleCropSelection("Rabi", crop));
                            }
                          }}
                          className="h-3 w-3 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mr-1"
                        />
                        Select All
                      </label>
                    )}
                  </div>
                  {cropsLoading.Rabi ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">Loading crops...</div>
                  ) : cropsError.Rabi ? (
                    <p className="text-sm text-red-600">Error: {cropsError.Rabi}</p>
                  ) : availableCrops.Rabi && availableCrops.Rabi.length > 0 ? (
                    <div className="space-y-2">
                      {availableCrops.Rabi.map(crop => (
                        <label key={crop} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={selectedCrops.Rabi?.includes(crop) || false}
                            onChange={() => toggleCropSelection("Rabi", crop)}
                            className="h-3 w-3 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mr-2"
                          />
                          <span className="text-gray-700">{crop}</span>
                        </label>
                      ))}
                      {selectedCrops.Rabi && selectedCrops.Rabi.length > 0 && (
                        <div className="mt-3 p-2 bg-orange-100 rounded text-xs text-orange-700">
                          ✓ Selected: {selectedCrops.Rabi.length} crop{selectedCrops.Rabi.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No crops available for Rabi season.</p>
                  )}
                </div>
              )}
              {zaidChecked && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-purple-800">Zaid Season Crops</h5>
                    {availableCrops.Zaid?.length > 0 && (
                      <label className="flex items-center text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCrops.Zaid?.length === availableCrops.Zaid.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              availableCrops.Zaid.forEach(crop => !selectedCrops.Zaid?.includes(crop) && toggleCropSelection("Zaid", crop));
                            } else {
                              availableCrops.Zaid.forEach(crop => selectedCrops.Zaid?.includes(crop) && toggleCropSelection("Zaid", crop));
                            }
                          }}
                          className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-1"
                        />
                        Select All
                      </label>
                    )}
                  </div>
                  {cropsLoading.Zaid ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">Loading crops...</div>
                  ) : cropsError.Zaid ? (
                    <p className="text-sm text-red-600">Error: {cropsError.Zaid}</p>
                  ) : availableCrops.Zaid && availableCrops.Zaid.length > 0 ? (
                    <div className="space-y-2">
                      {availableCrops.Zaid.map(crop => (
                        <label key={crop} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={selectedCrops.Zaid?.includes(crop) || false}
                            onChange={() => toggleCropSelection("Zaid", crop)}
                            className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-2"
                          />
                          <span className="text-gray-700">{crop}</span>
                        </label>
                      ))}
                      {selectedCrops.Zaid && selectedCrops.Zaid.length > 0 && (
                        <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-700">
                          ✓ Selected: {selectedCrops.Zaid.length} crop{selectedCrops.Zaid.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No crops available for Zaid season.</p>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Groundwater Factor Input with Info Icon */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md max-w-sm">
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Groundwater Irrigation Factor
              </label>
              <div className="group relative inline-block">
                <span className="cursor-help text-blue-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                {/* Tooltip – visible on hover */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 mt-1 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50 pointer-events-none"
                >
                  Initially share of the groundwater for irrigation is considered as 80%.
                </div>
              </div>
            </div>
            <input
              type="number"
              value={groundwaterFactor}
              onChange={(e) => setGroundwaterFactor(Number(e.target.value))}
              className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter value between 0 and 1"
              min="0"
              max="1"
              step="0.1"
            />
          </div>
          {agriculturalError && (
            <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p className="font-medium">Computation Failed</p>
              <p className="text-sm mt-1">{agriculturalError}</p>
            </div>
          )}
          {chartsError && (
            <div className="my-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
              <p className="font-medium">Chart Generation Warning</p>
              <p className="text-sm mt-1">{chartsError}</p>
            </div>
          )}
          {showSelectionWarning && (
            <div className="my-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.011-1.742 3.011H4.42c-1.53 0-2.493-1.677-1.743-3.011l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Please select at least one season and one crop.</span>
            </div>
          )}
          {/* --- Action Buttons (Compute, Search, Toggle) --- */}
          <div className="mt-4 mb-4 flex flex-col sm:flex-row gap-4 items-start">
            <button
              onClick={handleAgriculturalClick}
              disabled={agriculturalLoading || !canComputeAgriculturalDemand()}
              className={[
                "inline-flex items-center justify-center gap-2 text-white font-medium transition-colors duration-200 rounded-full py-3 px-5 shadow-md focus:outline-none focus:ring-4",
                agriculturalLoading || !canComputeAgriculturalDemand()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50",
              ].join(" ")}
            >
              {agriculturalLoading ? "Computing..." : "Compute Agricultural Demand"}
            </button>
            {/* Search & Toggle Controls */}
            {agriculturalTableData.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 ml-auto">
                {/* Search */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search village..."
                    value={agriculturalSearchInput}
                    onChange={(e) => setAgriculturalSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAgriculturalApplySearch()}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAgriculturalApplySearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </button>
                </div>
                {/* Toggle Table */}
                <button
                  onClick={toggleAgriculturalTable}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  title={showAgriculturalTable ? "Hide Table" : "Show Table"}
                >
                  {showAgriculturalTable ? (
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.94 17.94A10.016 10.016 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.96 9.96 0 012.293-3.95M6.06 6.06A9.991 9.991 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.958 9.958 0 01-4.042 5.142" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 01-3 3m0-6a3 3 0 013 3m0 0a3 3 0 01-3 3m0 0L3 3m0 0l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
          {/* Active Filters Indicator (like Recharge.tsx) */}
          {(agriculturalAppliedSearch || agriculturalAppliedSort) && (
            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              {agriculturalAppliedSearch && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Search: "{agriculturalAppliedSearch}"
                  <button onClick={() => { setAgriculturalAppliedSearch(""); setAgriculturalSearchInput(""); }} className="ml-1 hover:text-blue-900">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {agriculturalAppliedSort && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  Sort: {formatLabel(agriculturalAppliedSort.key, AGRICULTURAL_LABEL_MAP)} ({agriculturalAppliedSort.direction === 'asc' ? 'Ascending' : 'Descending'})
                  <button onClick={handleAgriculturalResetSort} className="ml-1 hover:text-green-900">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
          {/* Agricultural Table + Charts Container */}
          {agriculturalTableData.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-6">
              {showAgriculturalTable && (
                <div className="overflow-auto">
                  <AgriculturalTable
                    tableData={processedAgriculturalData}
                    title="Groundwater Consumption for Agricultural Need"
                    sortConfig={agriculturalAppliedSort || undefined}
                    onSort={(field: string) => {
                      const direction =
                        agriculturalAppliedSort?.key === field && agriculturalAppliedSort?.direction === "asc"
                          ? "desc"
                          : "asc";
                      setAgriculturalAppliedSort({ key: field, direction });
                    }}
                    isSearched={!!agriculturalAppliedSearch}
                  />
                </div>
              )}
              <div>
                <ChartDisplay />
              </div>
            </div>
          )}
        </div>
      )}
      {/* 3. INDUSTRIAL DEMAND SECTION */}
      {industrialChecked && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
          {industrialLoading && (
            <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center bg-white rounded-xl shadow-2xl p-8">
                {/* ... Loading Spinner SVG ... */}
                <div className="inline-block relative">
                  <svg className="animate-spin h-20 w-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="spinner-gradient-industrial" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                      <linearGradient id="spinner-gradient-2-industrial" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="url(#spinner-gradient-industrial)" strokeWidth="3" />
                    <path className="opacity-90" fill="url(#spinner-gradient-2-industrial)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xl font-semibold mt-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Computing Industrial Demand...
                </p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we calculate industrial water requirements</p>
              </div>
            </div>
          )}
          <h4 className="text-md font-semibold text-purple-800 mb-3">Industrial Demand Parameters</h4>
          {industrialError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Computation Failed</p>
                  <p className="text-sm mt-1">{industrialError}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={computeIndustrialDemand}
            disabled={industrialLoading || !canComputeIndustrialDemand()}
            className={`w-full ${industrialLoading || !canComputeIndustrialDemand() ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-300'} text-white font-medium py-3 px-4 rounded-md flex items-center justify-center transition-colors duration-200 mb-4`}
          >
            {industrialLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Computing Industrial Demand...</span>
              </>
            ) : (
              <span>Compute Industrial Demand</span>
            )}
          </button>
          {industrialTableData.length > 0 && (
            <TableDisplay tableData={industrialTableData} title="Industrial Demand Results" />
          )}
        </div>
      )}
    </div>
  );
};

export default Demand;