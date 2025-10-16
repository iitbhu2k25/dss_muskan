'use client';
import React, { useState, useEffect } from 'react';
import { useShapefile } from '@/contexts/datahub/Section1Context';
import { useMap } from '@/contexts/datahub/MapContext';

const Left = () => {
    const { shapefiles, selectedShapefile, setSelectedShapefile, fetchShapefiles } = useShapefile();
    const { mapInstance, applyFilterToWMS } = useMap();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [allFeatureAttributes, setAllFeatureAttributes] = useState<any[]>([]);
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
        setFilterMode(false);
        setFeatureAttributes([]);
        setAllFeatureAttributes([]);
        setUniqueColumnValues({});
        // Reset map filters
        if (mapInstance) {
            applyFilterToWMS({});
        }
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
            setAllFeatureAttributes([]);
            setUniqueColumnValues({});
            return;
        }

        const fetchAttributes = async () => {
            setIsLoading(true);
            try {
                const baseName =
                    selectedShapefile.shapefile_path.split('/').pop()?.replace('.shp', '') ||
                    selectedShapefile.shapefile_name;
                const url = `http://localhost:9090/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=myworkspace:${baseName}&outputFormat=application/json`;

                console.log('📊 Fetching attributes from:', url);

                const res = await fetch(url);
                const data = await res.json();

                if (data.features && data.features.length > 0) {
                    const attributes = data.features.map((f: any) => f.properties);
                    setAllFeatureAttributes(attributes);
                    setFeatureAttributes(attributes);
                    setShowRows(10);

                    // Calculate unique values for each column
                    const uniqueValues: Record<string, string[]> = {};
                    Object.keys(attributes[0]).forEach((key) => {
                        const values = attributes.map((row: any) => {
                            const val = row[key];
                            return val !== null && val !== undefined ? String(val) : 'N/A';
                        });
                        uniqueValues[key] = Array.from(new Set(values)) as string[];
                    });
                    setUniqueColumnValues(uniqueValues);

                    console.log(
                        '✓ Loaded',
                        attributes.length,
                        'features with',
                        Object.keys(attributes[0]).length,
                        'attributes'
                    );
                } else {
                    console.warn('No features found for shapefile');
                    setFeatureAttributes([]);
                    setAllFeatureAttributes([]);
                    setUniqueColumnValues({});
                }
            } catch (err) {
                console.error('❌ Error fetching attributes:', err);
                setFeatureAttributes([]);
                setAllFeatureAttributes([]);
                setUniqueColumnValues({});
            }
            setIsLoading(false);
        };

        fetchAttributes();
    }, [selectedShapefile]);

    // Toggle checkbox values and apply filters immediately (optional real-time filtering)
    const toggleValue = (key: string, value: string) => {
        setFilters((prev) => {
            const selected = prev[key] || [];
            let newFilters;
            if (selected.includes(value)) {
                newFilters = { ...prev, [key]: selected.filter((v) => v !== value) };
            } else {
                newFilters = { ...prev, [key]: [...selected, value] };
            }
            // Optional: Apply filters immediately on checkbox toggle
            // applyFilters(newFilters);
            return newFilters;
        });
    };

    const toggleSelectAll = (key: string) => {
        if (!uniqueColumnValues[key]) return;
        const allSelected = filters[key]?.length === uniqueColumnValues[key].length;
        setFilters((prev) => {
            const newFilters = {
                ...prev,
                [key]: allSelected ? [] : [...uniqueColumnValues[key]],
            };
            // Optional: Apply filters immediately on select all
            // applyFilters(newFilters);
            return newFilters;
        });
    };

    // Apply filter to both table and map
    const applyFilters = (filtersToApply = filters) => {
        console.log('🎯 Applying filters:', filtersToApply);

        // Filter table data
        const filteredData = allFeatureAttributes.filter((row) =>
            Object.keys(filtersToApply).every((key) => {
                const selectedValues = filtersToApply[key];
                if (!selectedValues || selectedValues.length === 0) return true;
                const rowValue = row[key] !== null && row[key] !== undefined ? String(row[key]) : 'N/A';
                return selectedValues.includes(rowValue);
            })
        );

        setFeatureAttributes(filteredData);
        setShowRows(10);

        console.log(`✓ Table filtered: ${filteredData.length}/${allFeatureAttributes.length} features`);

        // Apply CQL Filter to map
        if (mapInstance) {
            applyFilterToWMS(filtersToApply);
        } else {
            console.warn('⚠️ Map not ready for filtering');
        }
    };

    // Reset filters
    const resetFilters = () => {
        console.log('🔄 Resetting filters');

        setFilters({});
        setFilterMode(false);
        setOpenFilterDropdown(null);
        setFeatureAttributes(allFeatureAttributes);
        setShowRows(10);

        // Reset WMS filter on map
        if (mapInstance) {
            applyFilterToWMS({});
        }

        console.log('✓ Filters reset');
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
                        className={`px-3 py-1 rounded transition ${
                            filterMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                        {filterMode ? '✓ Filter Mode' : 'Filter'}
                    </button>
                    {filterMode && (
                        <>
                            <button
                                onClick={() => applyFilters()}
                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition font-semibold"
                            >
                                Apply Filter
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

            {/* Active Filters Display */}
            {Object.keys(filters).some((key) => filters[key]?.length > 0) && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Active Filters:</strong>
                    {Object.keys(filters).map((key) => {
                        const vals = filters[key];
                        if (!vals || vals.length === 0) return null;
                        return (
                            <div key={key} className="ml-2">
                                <span className="font-semibold">{key}:</span> {vals.join(', ')}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Feature Count */}
            {selectedShapefile && allFeatureAttributes.length > 0 && (
                <div className="mb-2 text-sm font-medium">
                    Showing {featureAttributes.length} of {allFeatureAttributes.length} features
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
                            <thead className="bg-gray-300 sticky top-0">
                                <tr>
                                    {Object.keys(featureAttributes[0]).map((key) => (
                                        <th key={key} className="text-left px-2 py-1 border relative">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">{key}</span>
                                                {filterMode && (
                                                    <button
                                                        onClick={() =>
                                                            setOpenFilterDropdown(
                                                                openFilterDropdown === key ? null : key
                                                            )
                                                        }
                                                        className="ml-1 px-1 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300"
                                                    >
                                                        ▾
                                                    </button>
                                                )}
                                            </div>

                                            {filterMode && openFilterDropdown === key && (
                                                <div className="absolute bg-white border shadow-lg z-20 p-2 max-h-60 overflow-y-auto mt-1 min-w-[200px]">
                                                    <div className="flex justify-between items-center mb-2 pb-2 border-b">
                                                        <span className="text-sm font-semibold">Select Values</span>
                                                        <button
                                                            className="text-sm text-blue-500 hover:text-blue-700"
                                                            onClick={() => toggleSelectAll(key)}
                                                        >
                                                            {filters[key]?.length === uniqueColumnValues[key]?.length
                                                                ? 'Clear All'
                                                                : 'Select All'}
                                                        </button>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {uniqueColumnValues[key]?.map((val) => (
                                                            <label
                                                                key={val}
                                                                className="block text-sm py-1 hover:bg-gray-50 cursor-pointer"
                                                            >
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
                                            <td key={i} className="px-2 py-1 border break-words text-sm">
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
                            onClick={() =>
                                setShowRows((prev) => Math.min(prev + 10, featureAttributes.length))
                            }
                            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                            Show More ({featureAttributes.length - showRows} remaining)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Left;