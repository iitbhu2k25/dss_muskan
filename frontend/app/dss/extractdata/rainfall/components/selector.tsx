import React, { useContext, useEffect, useState } from "react";
import { DailyContext } from "@/contexts/extract/Rainfal/State/RaifallContext";
import { useMapContext } from "@/contexts/extract/Rainfal/State/MapContext";
import { motion } from "framer-motion";
import { Droplets, MapPin, CalendarDays } from "lucide-react";

export const RainfallSelector = () => {
  const dailyCtx = useContext(DailyContext);
  const mapCtx = useMapContext();

  if (!dailyCtx) throw new Error("RainfallSelector must be inside DailyProvider");
  if (!mapCtx) throw new Error("RainfallSelector must be inside MapProvider");

  const { period, setPeriod, rainfallData } = dailyCtx;
  const { setSelectedState: mapSetSelectedState } = mapCtx;

  // New local state
  const [selectedCategory, setSelectedCategory] = useState<"State" | "District">("State");
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(undefined);

  const states = rainfallData
    ? Array.from(new Set(rainfallData.features.map((f) => f.properties.state))).sort()
    : [];

  // You may need to extract districts similarly depending on your data structure:
  const districts = rainfallData
    ? Array.from(new Set(rainfallData.features.map((f) => f.properties.district))).sort()
    : [];

  useEffect(() => {
    if (states.length > 0 && !selectedState) {
      setSelectedState(states[0]);
    }
    if (districts.length > 0 && !selectedDistrict) {
      setSelectedDistrict(districts[0]);
    }
  }, [states, districts, selectedState, selectedDistrict]);

  // Sync selected state/district to map context correspondingly
  useEffect(() => {
    if (selectedCategory === "State" && selectedState) {
      mapSetSelectedState(selectedState);
    }
    // Optionally add map context for district if applicable
  }, [selectedCategory, selectedState, selectedDistrict, mapSetSelectedState]);

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
        {/* Category Selector */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-xl border border-purple-200 shadow-sm"
        >
          <span className="text-purple-800 font-medium">Category</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as "State" | "District")}
            className="bg-white border border-purple-300 text-purple-800 rounded-lg px-3 py-1 focus:ring-2 focus:ring-purple-400 focus:outline-none transition"
          >
            <option value="State">State</option>
            <option value="District">District</option>
          </select>
        </motion.div>

        {/* Period Selector for selected category */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200 shadow-sm"
        >
          <div className="flex items-center gap-2 text-blue-800 font-medium">
            <CalendarDays size={18} />
            <span>{selectedCategory} Rainfall Period</span>
          </div>
          <select
            value={period}
            onChange={(e) =>
              setPeriod(
                e.target.value as "daily" | "weekly" | "monthly" | "cummulative"
              )
            }
            className="bg-white border border-blue-300 text-blue-800 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="cummulative">Cumulative</option>
          </select>
        </motion.div>

        {/* Conditional State or District Selector */}
        {selectedCategory === "State" && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-xl border border-emerald-200 shadow-sm"
          >
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <MapPin size={18} />
              <span>State</span>
            </div>
            <select
              value={selectedState || ""}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-white border border-emerald-300 text-emerald-800 rounded-lg px-3 py-1 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
            >
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </motion.div>
        )}
        {selectedCategory === "District" && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-xl border border-emerald-200 shadow-sm"
          >
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <MapPin size={18} />
              <span>District</span>
            </div>
            <select
              value={selectedDistrict || ""}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-white border border-emerald-300 text-emerald-800 rounded-lg px-3 py-1 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
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
