"use client";

import React, { useContext } from "react";
import { DailyContext } from "@/contexts/extract/Rainfal/State/RaifallContext";
import { motion } from "framer-motion";
import { Droplets, AlertTriangle, CalendarClock } from "lucide-react";

export const DailyRainfallTable = () => {
  const dailyCtx = useContext(DailyContext);
  if (!dailyCtx) throw new Error("RainfallTable must be inside DailyProvider");

  const { rainfallData, loading, error } = dailyCtx;

  // Loading shimmer
  if (loading)
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3"></div>
        <div className="h-48 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl shadow-inner"></div>
      </div>
    );

  if (error)
    return (
      <motion.div
        className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AlertTriangle size={18} />
        <span>Error loading table: {error}</span>
      </motion.div>
    );

  if (!rainfallData || rainfallData.features.length === 0)
    return (
      <motion.div
        className="text-gray-600 text-center p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        No rainfall data available.
      </motion.div>
    );

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "excess":
        return "text-blue-700 bg-blue-50";
      case "normal":
        return "text-green-700 bg-green-50";
      case "deficient":
        return "text-yellow-700 bg-yellow-50";
      case "large deficient":
        return "text-red-700 bg-red-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  return (
    <motion.div
      className="p-4 bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Droplets className="text-blue-500" />
          Rainfall Statistics
        </h3>
        <span className="flex items-center text-gray-500 text-sm gap-1">
          <CalendarClock size={14} />
          Updated {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[60vh] rounded-xl border border-gray-200 shadow-inner">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="sticky top-0 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">State</th>
              <th className="px-4 py-3 text-right">Actual Rainfall (mm)</th>
              <th className="px-4 py-3 text-right">Normal Rainfall (mm)</th>
              <th className="px-4 py-3 text-right">Departure (%)</th>
              <th className="px-4 py-3 text-center">Category</th>
              <th className="px-4 py-3 text-center">Last Updated</th>
            </tr>
          </thead>

          <tbody>
            {rainfallData.features.map((feature, i) => {
              const { state, actual_rainfall, normal_rainfall, departure, category, last_updated } =
                feature.properties;
              return (
                <motion.tr
                  key={i}
                  className={`hover:bg-blue-50 transition-all duration-200 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{state}</td>
                  <td className="px-4 py-3 text-right">{actual_rainfall ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{normal_rainfall ?? "-"}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      departure > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {departure ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full font-semibold text-xs ${getCategoryColor(
                        category
                      )}`}
                    >
                      {category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-sm">{last_updated}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
