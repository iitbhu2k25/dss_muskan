'use client';
import React, { useState, useEffect } from 'react';
import { useShapefile } from '@/contexts/datahub/Section1Context';
import { useMap } from '@/contexts/datahub/MapContext';

const Left = () => {
  const { shapefiles, selectedShapefile, setSelectedShapefile, fetchShapefiles } = useShapefile();
  const { mapInstance, applyFilterToWMS } = useMap();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [featureAttributes, setFeatureAttributes] = useState<any[]>([]);
  const [showRows, setShowRows] = useState(10);

  // Filter states
  const [filterMode, setFilterMode] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [uniqueColumnValues, setUniqueColumnValues] = useState<Record<string, string[]>>({});
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);

  const handleSelect = (file: any) => {
    setSelectedShapefile(file);
    setIsOpen(false);
    setFilters({});
    setOpenFilterDropdown(null);
  };

  const handleDropdownToggle = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && shapefiles.length === 0) {
      setIsLoading(true);
      await fetchShapefiles();
      setIsLoading(false);
    }
  };

  // Fetch attributes when shapefile changes
  useEffect(() => {
    if (!selectedShapefile) {
      setFeatureAttributes([]);
      setUniqueColumnValues({});
      return;
    }

    const fetchAttributes = async () => {
      setIsLoading(true);
      try {
        const baseName =
          selectedShapefile.shapefile_path.split('/').pop()?.replace('.shp', '') ||
          selectedShapefile.shapefile_name;
        const url = `http://localhost:9090/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${baseName}&outputFormat=application/json`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features) {
          const attributes = data.features.map((f: any) => f.properties);
          setFeatureAttributes(attributes);
          setShowRows(10);

          const uniqueValues: Record<string, string[]> = {};
          Object.keys(attributes[0]).forEach((key) => {
            uniqueValues[key] = Array.from(
              new Set(attributes.map((row: { [x: string]: any }) => String(row[key] ?? 'N/A')))
            );
          });
          setUniqueColumnValues(uniqueValues);
        }
      } catch (err) {
        console.error('Error fetching attributes:', err);
        setFeatureAttributes([]);
        setUniqueColumnValues({});
      }
      setIsLoading(false);
    };

    fetchAttributes();
  }, [selectedShapefile]);

  // Toggle checkbox values
  const toggleValue = (key: string, value: string) => {
    setFilters((prev) => {
      const selected = prev[key] || [];
      if (selected.includes(value)) {
        return { ...prev, [key]: selected.filter((v) => v !== value) };
      } else {
        return { ...prev, [key]: [...selected, value] };
      }
    });
  };

  const toggleSelectAll = (key: string) => {
    if (!uniqueColumnValues[key]) return;
    const allSelected = filters[key]?.length === uniqueColumnValues[key].length;
    setFilters((prev) => ({
      ...prev,
      [key]: allSelected ? [] : [...uniqueColumnValues[key]],
    }));
  };

  // Apply filter to both table and map
  const applyFilters = () => {
    if (!mapInstance) return;

    const filteredData = featureAttributes.filter((row) =>
      Object.keys(filters).every((key) => {
        const selectedValues = filters[key];
        if (!selectedValues || selectedValues.length === 0) return true;
        return selectedValues.includes(String(row[key] ?? 'N/A'));
      })
    );
    setFeatureAttributes(filteredData);

    // Apply CQL Filter to GeoServer WMS
    applyFilterToWMS(filters);
  };

  const resetFilters = () => {
    setFilters({});
    setFilterMode(false);
    setOpenFilterDropdown(null);
    if (selectedShapefile) {
      const fetchAll = async () => {
        const baseName =
          selectedShapefile.shapefile_path.split('/').pop()?.replace('.shp', '') ||
          selectedShapefile.shapefile_name;
        const url = `http://localhost:9090/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${baseName}&outputFormat=application/json`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features) {
          const attributes = data.features.map((f: any) => f.properties);
          setFeatureAttributes(attributes);
        }
      };
      fetchAll();
    }

    // Reset WMS filter on map
    applyFilterToWMS({});
  };

  return (
    <div className="h-full bg-gray-200 text-black p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Select Data</h1>

      {/* Shapefile Dropdown */}
      <div className="relative mb-4">
        <button
          onClick={handleDropdownToggle}
          className="w-full bg-white text-gray-800 font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-100 transition flex items-center justify-between"
          disabled={isLoading}
        >
          <span>{selectedShapefile ? selectedShapefile.shapefile_name : 'Choose Shapefile'}</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <ul className="absolute z-10 bg-white w-full mt-2 rounded-lg shadow-lg border max-h-60 overflow-y-auto">
            {isLoading ? (
              <li className="px-4 py-2 text-gray-500">Loading...</li>
            ) : shapefiles.length > 0 ? (
              shapefiles.map((file) => (
                <li
                  key={file.fid}
                  onClick={() => handleSelect(file)}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 ${
                    selectedShapefile?.fid === file.fid ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  {file.shapefile_name}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">No shapefiles found</li>
            )}
          </ul>
        )}
      </div>

      {/* Filter Button + Apply */}
      {selectedShapefile && featureAttributes.length > 0 && (
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setFilterMode(!filterMode)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            Filter
          </button>
          {filterMode && (
            <>
              <button
                onClick={applyFilters}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
              >
                Apply
              </button>
              <button
                onClick={resetFilters}
                className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 transition"
              >
                Reset
              </button>
            </>
          )}
        </div>
      )}

      {/* Feature Table */}
      {selectedShapefile && (
        <div className="overflow-x-auto mt-2 relative">
          {isLoading ? (
            <p>Loading attributes...</p>
          ) : featureAttributes.length === 0 ? (
            <p>No attributes found</p>
          ) : (
            <table className="min-w-full bg-white border rounded-lg shadow relative">
              <thead className="bg-gray-300">
                <tr>
                  {Object.keys(featureAttributes[0]).map((key) => (
                    <th key={key} className="text-left px-2 py-1 border relative">
                      <div className="flex justify-between items-center">
                        <span>{key}</span>
                        {filterMode && (
                          <button
                            onClick={() =>
                              setOpenFilterDropdown(openFilterDropdown === key ? null : key)
                            }
                            className="ml-1 px-1 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300"
                          >
                            ▾
                          </button>
                        )}
                      </div>

                      {filterMode && openFilterDropdown === key && (
                        <div className="absolute bg-white border shadow-lg z-20 p-2 max-h-60 overflow-y-auto mt-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold">Select All</span>
                            <button
                              className="text-sm text-blue-500"
                              onClick={() => toggleSelectAll(key)}
                            >
                              {filters[key]?.length === uniqueColumnValues[key]?.length
                                ? 'None'
                                : 'All'}
                            </button>
                          </div>
                          {uniqueColumnValues[key]?.map((val) => (
                            <label key={val} className="block text-sm">
                              <input
                                type="checkbox"
                                checked={filters[key]?.includes(val) || false}
                                onChange={() => toggleValue(key, val)}
                                className="mr-2"
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureAttributes.slice(0, showRows).map((attr, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    {Object.values(attr).map((val, i) => (
                      <td key={i} className="px-2 py-1 border break-words">
                        {val?.toString() || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {featureAttributes.length > showRows && (
            <button
              onClick={() => setShowRows((prev) => Math.min(prev + 10, featureAttributes.length))}
              className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Show More
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Left;
