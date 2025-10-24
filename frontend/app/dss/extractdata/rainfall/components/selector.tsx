"use client";

import React, { useContext, useEffect, useState } from "react";
import { DailyContext } from "@/contexts/extract/Rainfal/RaifallContext";
import { useMapContext } from "@/contexts/extract/Rainfal/MapContext";
import { motion } from "framer-motion";
import { Droplets, MapPin, CalendarDays, Map } from "lucide-react";

export const RainfallSelector = () => {
  const dailyCtx = useContext(DailyContext);
  const mapCtx = useMapContext();

  if (!dailyCtx) throw new Error("RainfallSelector must be inside DailyProvider");
  if (!mapCtx) throw new Error("RainfallSelector must be inside MapProvider");

  const { period, setPeriod, category, setCategory, rainfallData } = dailyCtx;
  const { setSelectedDistrict } = mapCtx;

  const [selectedDistrictValue, setSelectedDistrictValue] = useState<string | undefined>(undefined);

  // Extract unique districts from data
  const districts = rainfallData
    ? Array.from(new Set(rainfallData.features.map((f) => f.properties.district).filter(Boolean))).sort()
    : [];

  // Initialize district selection
  useEffect(() => {
    if (category === "district" && districts.length > 0 && !selectedDistrictValue) {
      setSelectedDistrictValue(districts[0]);
    }
  }, [districts, selectedDistrictValue, category]);

  // Sync to map context for district only
  useEffect(() => {
    if (category === "district" && selectedDistrictValue) {
      setSelectedDistrict(selectedDistrictValue);
    }
  }, [category, selectedDistrictValue, setSelectedDistrict]);

  return (
    <motion.div
      className="flex flex-col gap-4 p-5 bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-500"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <Droplets className="text-blue-500" size={22} />
        Rainfall Selection
      </h2>

      <div className="flex flex-col gap-4">
        {/* Category Selector (State/District) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-xl border border-purple-200 shadow-sm"
        >
          <div className="flex items-center gap-2 text-purple-800 font-medium">
            <Map size={18} />
            <span>Category</span>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "state" | "district")}
            className="bg-white border border-purple-300 text-purple-800 rounded-lg px-3 py-1 focus:ring-2 focus:ring-purple-400 focus:outline-none transition"
          >
            <option value="state">State</option>
            <option value="district">District</option>
          </select>
        </motion.div>

        {/* Period Selector */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200 shadow-sm"
        >
          <div className="flex items-center gap-2 text-blue-800 font-medium">
            <CalendarDays size={18} />
            <span>Rainfall Period</span>
          </div>
          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value as "daily" | "weekly" | "monthly" | "cumulative")
            }
            className="bg-white border border-blue-300 text-blue-800 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="cumulative">Cumulative</option>
          </select>
        </motion.div>

        {/* District Selector (shown when category is 'district') */}
        {category === "district" && districts.length > 0 && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-amber-100 p-3 rounded-xl border border-amber-200 shadow-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 text-amber-800 font-medium">
              <MapPin size={18} />
              <span>District</span>
            </div>
            <select
              value={selectedDistrictValue || ""}
              onChange={(e) => setSelectedDistrictValue(e.target.value)}
              className="bg-white border border-amber-300 text-amber-800 rounded-lg px-3 py-1 focus:ring-2 focus:ring-amber-400 focus:outline-none transition"
            >
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
