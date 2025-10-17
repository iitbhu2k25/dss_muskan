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

                const res = await fetch(url);
                const data = await res.json();

                if (data.features && data.features.length > 0) {
                    const attributes = data.features.map((f: any) => f.properties);
                    setAllFeatureAttributes(attributes);
                    setFeatureAttributes(attributes);
                    setShowRows(10);

                    const uniqueValues: Record<string, string[]> = {};
                    Object.keys(attributes[0]).forEach((key) => {
                        const values = attributes.map((row: any) => {
                            const val = row[key];
                            return val !== null && val !== undefined ? String(val) : 'N/A';
                        });
                        uniqueValues[key] = Array.from(new Set(values)) as string[];
                    });
                    setUniqueColumnValues(uniqueValues);
                } else {
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

    const applyFilters = (filtersToApply = filters) => {
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

        if (mapInstance) {
            applyFilterToWMS(filtersToApply);
        }
    };

    const resetFilters = () => {
        setFilters({});
        setFilterMode(false);
        setOpenFilterDropdown(null);
        setFeatureAttributes(allFeatureAttributes);
        setShowRows(10);

        if (mapInstance) {
            applyFilterToWMS({});
        }
    };

    return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 overflow-y-auto shadow-2xl">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                    <span className="text-4xl"></span>
                    <span>Data Explorer</span>
                </h1>
               
            </div>

            {/* Shapefile Dropdown */}
            <div className="relative mb-5">
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                    Select File
                </label>
                <button
                    onClick={handleDropdownToggle}
                    className="w-full bg-white text-gray-800 font-bold py-3 px-5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-between border-2 border-gray-200 hover:border-blue-400"
                    disabled={isLoading}
                >
                    <span className="flex items-center gap-3">
                        <span className="text-l">{selectedShapefile ? '' : '📁'}</span>
                        <span>{selectedShapefile ? selectedShapefile.shapefile_name : 'Choose Shapefile'}</span>
                    </span>
                    <svg
                        className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <ul className="absolute z-50 bg-white w-full mt-2 rounded-xl shadow-2xl border-2 border-gray-200 max-h-72 overflow-y-auto custom-scrollbar animate-scale-in">
                        {isLoading ? (
                            <li className="px-5 py-4 text-gray-500 flex items-center gap-3">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                <span>Loading...</span>
                            </li>
                        ) : shapefiles.length > 0 ? (
                            shapefiles.map((file) => (
                                <li
                                    key={file.fid}
                                    onClick={() => handleSelect(file)}
                                    className={`px-5 py-4 hover:bg-blue-50 cursor-pointer text-gray-800 font-semibold transition-all duration-200 flex items-center gap-3 ${
                                        selectedShapefile?.fid === file.fid ? 'bg-blue-100 text-blue-700' : ''
                                    }`}
                                >
                                   
                                    <span>{file.shapefile_name}</span>
                                    {selectedShapefile?.fid === file.fid && <span className="ml-auto text-blue-600">✓</span>}
                                </li>
                            ))
                        ) : (
                            <li className="px-5 py-4 text-gray-500 text-center">No shapefiles found</li>
                        )}
                    </ul>
                )}
            </div>

            {/* Filter Controls */}
            {selectedShapefile && featureAttributes.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                    <button
                        onClick={() => setFilterMode(!filterMode)}
                        className={`px-5 py-1.5 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 ${
                            filterMode 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                                : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-blue-400 hover:shadow-lg'
                        }`}
                    >
                        <span>{filterMode ? '' : '🔍'}</span>
                        <span>{filterMode ? 'Filter Active' : 'Enable Filter'}</span>
                    </button>
                    {filterMode && (
                        <>
                            <button
                                onClick={() => applyFilters()}
                                className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                               
                                <span>Apply Filter</span>
                            </button>
                            <button
                                onClick={resetFilters}
                                className="px-5 py-2.5 rounded-xl font-bold bg-gray-300 text-gray-800 hover:bg-gray-400 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <span>↺</span>
                                <span>Reset</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Active Filters Display */}
            {Object.keys(filters).some((key) => filters[key]?.length > 0) && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm animate-fade-in">
                    <strong className="text-blue-900 font-bold flex items-center gap-2 mb-2">
                        <span className="text-lg">🔍</span>
                        <span>Active Filters:</span>
                    </strong>
                    <div className="space-y-1">
                        {Object.keys(filters).map((key) => {
                            const vals = filters[key];
                            if (!vals || vals.length === 0) return null;
                            return (
                                <div key={key} className="ml-4">
                                    <span className="font-bold text-blue-700">{key}:</span>{' '}
                                    <span className="text-blue-900">{vals.join(', ')}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Feature Count */}
            {selectedShapefile && allFeatureAttributes.length > 0 && (
                <div className="mb-3 p-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border-2 border-gray-300 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Showing Features:</span>
                    <span className="text-lg font-black text-gray-900">
                        {featureAttributes.length} / {allFeatureAttributes.length}
                    </span>
                </div>
            )}

            {/* Feature Table */}
            {selectedShapefile && (
                <div className="overflow-x-auto mt-4 rounded-xl border-2 border-gray-300 shadow-xl">
                    {isLoading ? (
                        <div className="p-10 text-center">
                            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-600 font-semibold">Loading attributes...</p>
                        </div>
                    ) : featureAttributes.length === 0 ? (
                        <div className="p-10 text-center text-gray-500 font-semibold">
                           
                            <span>No attributes found</span>
                        </div>
                    ) : (
                        <table className="min-w-full bg-white rounded-xl overflow-hidden">
                            <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-white sticky top-0 z-10">
                                <tr>
                                    {Object.keys(featureAttributes[0]).map((key) => (
                                        <th key={key} className="text-left px-4 py-4 font-bold relative">
                                            <div className="flex justify-between items-center gap-2">
                                                <span>{key}</span>
                                                {filterMode && (
                                                    <button
                                                        onClick={() =>
                                                            setOpenFilterDropdown(
                                                                openFilterDropdown === key ? null : key
                                                            )
                                                        }
                                                        className="px-2 py-1 text-xs bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-200"
                                                    >
                                                       ▼
                                                    </button>
                                                )}
                                            </div>

                                            {filterMode && openFilterDropdown === key && (
                                                <div className="absolute bg-white border-2 border-gray-300 shadow-2xl z-50 p-4 max-h-64 overflow-y-auto mt-2 min-w-[240px] rounded-xl animate-scale-in">
                                                    <div className="flex justify-between items-center mb-3 pb-3 border-b-2 border-gray-200">
                                                        <span className="text-sm font-bold text-gray-900">Select Values</span>
                                                        <button
                                                            className="text-sm text-blue-600 hover:text-blue-800 font-bold"
                                                            onClick={() => toggleSelectAll(key)}
                                                        >
                                                            {filters[key]?.length === uniqueColumnValues[key]?.length
                                                                ? 'Clear All'
                                                                : 'Select All'}
                                                        </button>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        {uniqueColumnValues[key]?.map((val) => (
                                                            <label
                                                                key={val}
                                                                className="block text-sm py-2 px-2 hover:bg-blue-50 cursor-pointer rounded-lg transition-all duration-200 font-medium text-gray-800"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={filters[key]?.includes(val) || false}
                                                                    onChange={() => toggleValue(key, val)}
                                                                    className="mr-3 w-4 h-4 accent-blue-600"
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
                                    <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50 transition-all duration-200">
                                        {Object.values(attr).map((val, i) => (
                                            <td key={i} className="px-4 py-3 text-sm text-gray-800 font-medium">
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
                            className="w-full mt-0 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-b-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                        >
                            
                            <span>Show More ({featureAttributes.length - showRows} remaining)</span>
                        </button>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Left;