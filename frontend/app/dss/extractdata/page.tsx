"use client";

import React, { useState } from "react";
import { DailyProvider } from "@/contexts/extract/Rainfal/RaifallContext";
import { MapProvider } from "@/contexts/extract/Rainfal/MapContext";
import { RainfallSelector } from "./rainfall/components/selector";
import RainfallMap from "./rainfall/components/map";
import { DailyRainfallTable } from "./rainfall/components/daily";
import { RainfallStatistics } from "./rainfall/components/statistics";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudRain,
  Cloud,
  ChevronDown,
  Map as MapIcon,
  BarChart3,
  Waves,
} from "lucide-react";

type MainCategory = "rainfall" | "weather" | null;
type RainfallSubCategory =
  | "state"
  | "district"
  | "statistics"
  | "river-basin"
  | null;
type PeriodType = "daily" | "weekly" | "monthly" | "cumulative";

const RainfallPage = () => {
  const [mainCategory, setMainCategory] = useState<MainCategory>(null);
  const [rainfallSubCategory, setRainfallSubCategory] =
    useState<RainfallSubCategory>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("daily");
  const [showRainfallDropdown, setShowRainfallDropdown] = useState(false);

  const handleMainCategoryClick = (category: MainCategory) => {
    if (category === "rainfall") {
      setShowRainfallDropdown(!showRainfallDropdown);
      setMainCategory(category);
    } else {
      setMainCategory(category);
      setShowRainfallDropdown(false);
      setRainfallSubCategory(null);
    }
  };

  const handleRainfallSubCategoryClick = (subCategory: RainfallSubCategory) => {
    setRainfallSubCategory(subCategory);
    setShowRainfallDropdown(false);
  };

  const renderContent = () => {
    // Weather placeholder
    if (mainCategory === "weather") {
      return (
        <div className="flex items-center justify-center h-full">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Cloud size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-semibold text-gray-700">
              Weather Data
            </h3>
            <p className="text-gray-500 mt-2">Coming soon...</p>
          </motion.div>
        </div>
      );
    }

    // Rainfall subcategories
    if (mainCategory === "rainfall") {
      if (rainfallSubCategory === "statistics") {
        return <RainfallStatistics />;
      }

      if (rainfallSubCategory === "river-basin") {
        return (
          <div className="flex items-center justify-center h-full">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Waves size={64} className="mx-auto mb-4 text-blue-400" />
              <h3 className="text-2xl font-semibold text-gray-700">
                Rainfall River Basin
              </h3>
              <p className="text-gray-500 mt-2">Coming soon...</p>
            </motion.div>
          </div>
        );
      }

      if (rainfallSubCategory === "state" || rainfallSubCategory === "district") {
        return (
          <DailyProvider>
            <MapProvider>
              <div className="flex h-full bg-gradient-to-br from-white via-slate-100 to-gray-100">
                {/* Left Section (Selector + Table) */}
                <div className="flex-[6] flex flex-col bg-white border-r border-gray-300 shadow-lg overflow-auto">
                  <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <RainfallSelector
                      forcedCategory={rainfallSubCategory}
                      selectedPeriod={selectedPeriod}
                      onPeriodChange={setSelectedPeriod}
                    />
                  </div>
                  <div className="p-4 flex-1 overflow-auto">
                    <DailyRainfallTable />
                  </div>
                </div>

                {/* Right Section (Map) */}
                <div className="flex-[4] rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <RainfallMap />
                </div>
              </div>
            </MapProvider>
          </DailyProvider>
        );
      }
    }

    // Default state - show welcome message
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CloudRain size={80} className="mx-auto mb-6 text-blue-500" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Data Extraction Portal
          </h2>
          <p className="text-gray-600 text-lg">
            Select a category from the navigation above to get started
          </p>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-300 shadow-md px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Rainfall Button with Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => handleMainCategoryClick("rainfall")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                mainCategory === "rainfall"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CloudRain size={20} />
              Rainfall
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  showRainfallDropdown ? "rotate-180" : ""
                }`}
              />
            </motion.button>

            {/* Rainfall Dropdown */}
            <AnimatePresence>
              {showRainfallDropdown && (
                <motion.div
                  className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[300px] z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Rainfall State */}
                  <div className="px-4 py-2 hover:bg-gray-50">
                    <button
                      onClick={() => handleRainfallSubCategoryClick("state")}
                      className="w-full text-left font-medium text-gray-700 flex items-center gap-2"
                    >
                      <MapIcon size={16} className="text-blue-500" />
                      Rainfall State
                    </button>
                    <div className="ml-6 mt-2 flex flex-wrap gap-2">
                      {["daily", "weekly", "monthly", "cumulative"].map(
                        (period) => (
                          <button
                            key={period}
                            onClick={() => {
                              setSelectedPeriod(period as PeriodType);
                              handleRainfallSubCategoryClick("state");
                            }}
                            className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 capitalize"
                          >
                            {period}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-2" />

                  {/* Rainfall District */}
                  <div className="px-4 py-2 hover:bg-gray-50">
                    <button
                      onClick={() => handleRainfallSubCategoryClick("district")}
                      className="w-full text-left font-medium text-gray-700 flex items-center gap-2"
                    >
                      <MapIcon size={16} className="text-green-500" />
                      Rainfall District
                    </button>
                    <div className="ml-6 mt-2 flex flex-wrap gap-2">
                      {["daily", "weekly", "monthly", "cumulative"].map(
                        (period) => (
                          <button
                            key={period}
                            onClick={() => {
                              setSelectedPeriod(period as PeriodType);
                              handleRainfallSubCategoryClick("district");
                            }}
                            className="px-3 py-1 text-xs rounded-full bg-green-50 text-green-700 hover:bg-green-100 capitalize"
                          >
                            {period}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-2" />

                  {/* Rainfall Statistics */}
                  <button
                    onClick={() => handleRainfallSubCategoryClick("statistics")}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 font-medium text-gray-700 flex items-center gap-2"
                  >
                    <BarChart3 size={16} className="text-purple-500" />
                    Rainfall Statistics
                  </button>

                  <div className="border-t border-gray-200 my-2" />

                  {/* Rainfall River Basin */}
                  <button
                    onClick={() =>
                      handleRainfallSubCategoryClick("river-basin")
                    }
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Waves size={16} className="text-cyan-500" />
                    Rainfall River Basin
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Weather Button */}
          <motion.button
            onClick={() => handleMainCategoryClick("weather")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              mainCategory === "weather"
                ? "bg-orange-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Cloud size={20} />
            Weather
          </motion.button>
        </div>

        {/* Breadcrumb */}
        {mainCategory && (
          <motion.div
            className="mt-4 text-sm text-gray-600 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="capitalize font-medium">{mainCategory}</span>
            {rainfallSubCategory && (
              <>
                <span>/</span>
                <span className="capitalize">{rainfallSubCategory}</span>
                {(rainfallSubCategory === "state" ||
                  rainfallSubCategory === "district") && (
                  <>
                    <span>/</span>
                    <span className="capitalize">{selectedPeriod}</span>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
};

export default RainfallPage;