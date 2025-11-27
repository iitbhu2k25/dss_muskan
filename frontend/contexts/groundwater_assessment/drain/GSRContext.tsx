"use client";

import React, { createContext, useContext, useState } from 'react';
import { useLocation } from './LocationContext';
import { useDemand } from './DemandContext';
import { useRecharge } from './RechargeContext';
import { GroundwaterTrendContext } from './TrendContext';
import { useMap } from '@/contexts/groundwater_assessment/drain/MapContext';
import pako from 'pako';

interface GSRData {
  [key: string]: string | number;
}

interface StressData {
  [key: string]: string | number;
}

interface MergeStatistics {
  total_shapefile_villages: number;
  villages_with_gsr_data: number;
  villages_without_gsr_data: number;
  merge_success_rate: number;
  error?: string;
}

interface GSRContextType {
  gsrTableData: GSRData[];
  gsrLoading: boolean;
  gsrError: string | null;
  stressTableData: StressData[];
  stressLoading: boolean;
  stressError: string | null;
  gsrGeojsonData: any | null;
  mergeStatistics: MergeStatistics | null;
  mapImageFilename: string | null;
  mapImageBase64: string | null;
  computeGSR: () => Promise<void>;
  canComputeGSR: () => boolean;
  computeStressIdentification: (yearsCount: number) => Promise<StressData[]>;
  canComputeStressIdentification: () => boolean;
  clearGSRData: () => void;
  clearStressData: () => void;
  getMapImageUrl: () => string | null;
  getMapImageSrc: () => string | null;
}

export const GSRContext = createContext<GSRContextType | undefined>(undefined);

interface GSRProviderProps {
  children: React.ReactNode;
}

export const GSRProvider: React.FC<GSRProviderProps> = ({ children }) => {
  const [gsrTableData, setGSRTableData] = useState<GSRData[]>([]);
  const [gsrLoading, setGSRLoading] = useState<boolean>(false);
  const [gsrError, setGSRError] = useState<string | null>(null);
  const [stressTableData, setStressTableData] = useState<StressData[]>([]);
  const [stressLoading, setStressLoading] = useState<boolean>(false);
  const [stressError, setStressError] = useState<string | null>(null);
  const [gsrGeojsonData, setGSRGeojsonData] = useState<any | null>(null);
  const [mergeStatistics, setMergeStatistics] = useState<MergeStatistics | null>(null);
  const [mapImageFilename, setMapImageFilename] = useState<string | null>(null);
  const [mapImageBase64, setMapImageBase64] = useState<string | null>(null);

  const { selectedVillages } = useLocation();
  const {
    domesticTableData,
    agriculturalTableData,
    industrialTableData,
    industrialData,
    industrialGWShare,
    domesticChecked,
    agriculturalChecked,
    industrialChecked
  } = useDemand();

  const { tableData: rechargeTableData } = useRecharge();
  const { trendData } = React.useContext(GroundwaterTrendContext);
  const { addGsrLayer, removeGsrLayer } = useMap();

  const getMapImageUrl = (): string | null => {
    if (!mapImageFilename) return null;
    return `/django/media/temp/${mapImageFilename}`;
  };

  const getMapImageSrc = (): string | null => {
    if (mapImageBase64) return mapImageBase64;
    return getMapImageUrl();
  };

  const clearGSRData = () => {
    setGSRTableData([]);
    setGSRGeojsonData(null);
    setMergeStatistics(null);
    setMapImageFilename(null);
    setMapImageBase64(null);
    setGSRError(null);
    removeGsrLayer();
  };

  const clearStressData = () => {
    setStressTableData([]);
    setStressError(null);
  };

  const canComputeGSR = (): boolean => {
    return !!(
      selectedVillages.length > 0 &&
      rechargeTableData.length > 0 &&
      ((domesticChecked && domesticTableData.length > 0) ||
        (agriculturalChecked && agriculturalTableData.length > 0) ||
        (industrialChecked && industrialTableData.length > 0))
    );
  };

  const canComputeStressIdentification = (): boolean => {
    return gsrTableData.length > 0;
  };

  const processIndustrialData = (rawIndustrialData: any[]): any[] => {
    if (rawIndustrialData.length === 0) {
      return [];
    }

    const firstRecord = rawIndustrialData[0];

    // ✅ Check for village_code and any demand field variations
    if ('village_code' in firstRecord) {
      console.log('✅ Found village_code field. Checking demand fields...');
      console.log('Available fields:', Object.keys(firstRecord));

      // Check for exact matches first
      if ('demand_mld' in firstRecord) {
        console.log('✅ Using demand_mld field directly');
        return rawIndustrialData;
      }

      // Check for industrial_demand
      if ('industrial_demand' in firstRecord) {
        console.log('✅ Converting industrial_demand to demand_mld format for GSR');
        return rawIndustrialData.map(item => ({
          village_code: item.village_code,
          village_name: item.Village_name || item.village_name || 'Unknown',
          demand_mld: item.industrial_demand || 0,
          original_industrial_demand: item.industrial_demand,
          forecast_population: item.Forecast_Population || item.forecast_population,
          ratio: item.Ratio || item.ratio
        }));
      }

      // ✅ NEW: Handle your actual field name
      if ('Industrial_demand_(Million litres/Year)' in firstRecord) {
        console.log('✅ Converting Industrial_demand_(Million litres/Year) to demand_mld format for GSR');
        return rawIndustrialData.map(item => ({
          village_code: item.village_code,
          village_name: item.Village_name || item.village_name || 'Unknown',
          demand_mld: item['Industrial_demand_(Million litres/Year)'] || 0,
          original_industrial_demand: item['Industrial_demand_(Million litres/Year)'],
          forecast_population: item.Forecast_Population || item.forecast_population,
          ratio: item.Ratio || item.ratio
        }));
      }

      // Handle other possible variations
      if ('industrial_demand_mld' in firstRecord || 'Industrial_Demand_MLD' in firstRecord) {
        console.log('✅ Converting alternative industrial demand field');
        const demandField = 'industrial_demand_mld' in firstRecord ? 'industrial_demand_mld' : 'Industrial_Demand_MLD';
        return rawIndustrialData.map(item => ({
          village_code: item.village_code,
          village_name: item.Village_name || item.village_name || 'Unknown',
          demand_mld: item[demandField] || 0,
          original_industrial_demand: item[demandField],
          forecast_population: item.Forecast_Population || item.forecast_population,
          ratio: item.Ratio || item.ratio
        }));
      }
    }

    console.warn('⚠️ Industrial data missing village_code or demand fields. Available fields:', Object.keys(firstRecord));
    console.warn('Raw sample:', firstRecord);
    return [];
  };


   const computeGSR = async () => {
  try {
    setGSRLoading(true);
    setGSRError(null);

    if (selectedVillages.length === 0) {
      throw new Error('Village selection is required. Please select villages first.');
    }

    if (rechargeTableData.length === 0) {
      throw new Error('Recharge data is required. Please compute recharge first.');
    }

    if (domesticTableData.length === 0 && agriculturalTableData.length === 0 && industrialTableData.length === 0) {
      throw new Error('No demand data available. Please compute domestic, agricultural, or industrial demand first.');
    }

    const trendCsvFilename = trendData?.summary_stats?.file_info?.trend_csv_filename || null;

    // ✅ Access the latest state values directly here
    const currentIndustrialTableData = industrialTableData;
    const currentDomesticTableData = domesticTableData;
    const currentAgriculturalTableData = agriculturalTableData;

    const processedIndustrialData = processIndustrialData(currentIndustrialTableData);

    const payload = {
      selectedVillages: selectedVillages,
      rechargeData: rechargeTableData,
      domesticData: currentDomesticTableData,
      agriculturalData: currentAgriculturalTableData,
      industrialData: processedIndustrialData,
      industrialDataTable: industrialData,
      industrialGWShare: industrialGWShare,
      hasDomesticDemand: domesticChecked && currentDomesticTableData.length > 0,
      hasAgriculturalDemand: agriculturalChecked && currentAgriculturalTableData.length > 0,
      hasIndustrialDemand: industrialChecked && processedIndustrialData.length > 0,
      hasRechargeData: rechargeTableData.length > 0,
      trendCsvFilename: trendCsvFilename || '',
      timestamp: new Date().toISOString()
    };

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('🏭 GSR PAYLOAD VERIFICATION - INDUSTRIAL DEMAND (DRAIN CASE)');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('📊 DEMAND DATA SUMMARY:');
    console.log(`   ✓ Recharge Records: ${rechargeTableData.length}`);
    console.log(`   ✓ Domestic Records: ${currentDomesticTableData.length} (Checked: ${domesticChecked})`);
    console.log(`   ✓ Agricultural Records: ${currentAgriculturalTableData.length} (Checked: ${agriculturalChecked})`);
    console.log(`   ✓ Industrial Records (Raw): ${currentIndustrialTableData.length} (Checked: ${industrialChecked})`);
    console.log(`   ✓ Processed Industrial Records: ${processedIndustrialData.length}`);
    console.log(`   ✓ Industrial Data Table Records: ${industrialData.length}`);
    console.log(`   ✓ Industrial GW Share: ${industrialGWShare}`);
    console.log('');
    console.log('🎯 PAYLOAD FLAGS:');
    console.log(`   • hasDomesticDemand: ${payload.hasDomesticDemand}`);
    console.log(`   • hasAgriculturalDemand: ${payload.hasAgriculturalDemand}`);
    console.log(`   • hasIndustrialDemand: ${payload.hasIndustrialDemand}`);
    console.log(`   • hasRechargeData: ${payload.hasRechargeData}`);
    console.log('');

    if (currentIndustrialTableData.length > 0) {
      console.log('🏭 RAW INDUSTRIAL DATA SAMPLE (First 3 records):');
      currentIndustrialTableData.slice(0, 3).forEach((record, idx) => {
        console.log(`   ${idx + 1}. Raw Record:`, record);
        console.log(`      Fields: ${Object.keys(record).join(', ')}`);
      });
    }

    if (industrialData.length > 0) {
      console.log('🏭 INDUSTRIAL DATA TABLE (First 3 records):');
      industrialData.slice(0, 3).forEach((record, idx) => {
        console.log(`   ${idx + 1}.`, record);
      });
    }

    if (processedIndustrialData.length > 0) {
      console.log('🏭 PROCESSED INDUSTRIAL DATA SAMPLE (First 3 records):');
      processedIndustrialData.slice(0, 3).forEach((record, idx) => {
        console.log(`   ${idx + 1}. Village: ${record.village_code || 'N/A'}, Demand: ${record.demand_mld || 0} MLD`);
      });
      console.log(`   ✅ Industrial demand WILL BE INCLUDED in total demand calculation`);
    } else if (currentIndustrialTableData.length > 0) {
      console.log('   ⚠️ Industrial data exists but is not in village-wise format');
      console.log('   ⚠️ Industrial demand MAY NOT BE PROPERLY INCLUDED in GSR calculation');
      console.log('   ⚠️ Backend API should return village-wise industrial demand data');
    } else {
      console.log('   ℹ️ No industrial demand data (optional)');
    }

    console.log('');
    console.log('📍 Selected Villages:', selectedVillages);
    console.log('📈 Trend CSV:', trendCsvFilename || 'Not provided');
    console.log('═══════════════════════════════════════════════════════════════════════════════');

    const jsonString = JSON.stringify(payload);
    const compressed = pako.gzip(jsonString);
    
    let binary = '';
    const len = compressed.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(compressed[i]);
    }
    const base64Compressed = btoa(binary);

    console.log('🔄 Sending compressed payload to GSR API...');
    console.log(`   Payload size: ${jsonString.length} bytes`);
    console.log(`   Compressed size: ${base64Compressed.length} bytes`);

    const response = await fetch('http://localhost:6500/gwa/gsr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ zipped_data: base64Compressed }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ GSR API Response received');
    console.log(`   Success: ${result.success}`);
    console.log(`   Villages processed: ${result.villages_count || 0}`);
    
    if (result.summary) {
      console.log('');
      console.log('📊 GSR COMPUTATION SUMMARY:');
      console.log(`   Total Recharge: ${result.summary.total_recharge || 0} MCM`);
      console.log(`   Total Domestic: ${result.summary.total_domestic_demand || 0} MCM`);
      console.log(`   Total Agricultural: ${result.summary.total_agricultural_demand || 0} MCM`);
      console.log(`   Total Industrial: ${result.summary.total_industrial_demand || 0} MCM`);
      console.log(`   ─────────────────────────────────────────────────────`);
      console.log(`   TOTAL DEMAND: ${result.summary.total_demand || 0} MCM`);
      console.log(`   OVERALL GSR: ${result.summary.overall_gsr || 0}`);
    }

    console.log('🔍 Full GSR API Response Structure:', JSON.stringify(result, null, 2));

    // ✅ FIXED: Comprehensive response data handling
    let tableData: any[] = [];

    // Try multiple possible response structures
    if (result.data && Array.isArray(result.data)) {
      tableData = result.data;
      console.log('✅ Found GSR data in result.data:', tableData.length, 'records');
    } else if (result.gsr_data && Array.isArray(result.gsr_data)) {
      tableData = result.gsr_data;
      console.log('✅ Found GSR data in result.gsr_data:', tableData.length, 'records');
    } else if (result.results && Array.isArray(result.results)) {
      tableData = result.results;
      console.log('✅ Found GSR data in result.results:', tableData.length, 'records');
    } else if (result.gsr_results && Array.isArray(result.gsr_results)) {
      tableData = result.gsr_results;
      console.log('✅ Found GSR data in result.gsr_results:', tableData.length, 'records');
    } else if (Array.isArray(result)) {
      tableData = result;
      console.log('✅ Response is directly an array:', tableData.length, 'records');
    }

    // Check if we found valid data
    if (tableData.length === 0) {
      console.error('❌ No GSR table data found in response. Available keys:', Object.keys(result));
      console.error('Full response keys:', Object.keys(result));
      throw new Error('No GSR table data found in API response. Please check backend response format.');
    }

    // ✅ Set the table data
    setGSRTableData(tableData);
    console.log('✅ setGSRTableData called with:', tableData.length, 'records');
    console.log('✅ Sample GSR record:', tableData[0]);

    // Map layer handling
    if (result.geospatial_data) {
      try {
        addGsrLayer(result.geospatial_data);
        setGSRGeojsonData(result.geospatial_data);
        console.log('✅ GSR layer added to map');
      } catch (e) {
        console.log('⚠️ Failed to add GSR layer to map:', e);
      }
    } else {
      removeGsrLayer();
      setGSRGeojsonData(null);
    }

    // Merge statistics
    if (result.merge_statistics) {
      setMergeStatistics(result.merge_statistics);
      console.log(`📊 Merge Statistics: ${result.merge_statistics.villages_with_geospatial_data}/${result.merge_statistics.total_gsr_villages} villages merged`);
    }

    // Map image
    if (result.map_image_filename) {
      setMapImageFilename(result.map_image_filename);
      console.log('📸 GSR map image generated:', result.map_image_filename);
    } else {
      setMapImageFilename(null);
    }

    if (result.map_image_base64) {
      setMapImageBase64(result.map_image_base64);
      console.log('📸 GSR map image base64 received');
    } else {
      setMapImageBase64(null);
    }

    console.log('═══════════════════════════════════════════════════════════════════════════════');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('❌ GSR Computation Error:', errorMessage);
    setGSRError(errorMessage);
    setGSRTableData([]);
    setGSRGeojsonData(null);
    setMergeStatistics(null);
    setMapImageFilename(null);
    setMapImageBase64(null);
    removeGsrLayer();
  } finally {
    setGSRLoading(false);
  }
};



  const computeStressIdentification = async (yearsCount: number): Promise<StressData[]> => {
    try {
      setStressLoading(true);
      setStressError(null);

      if (gsrTableData.length === 0) {
        throw new Error('GSR analysis must be completed first. Please compute GSR before stress identification.');
      }

      if (!yearsCount || yearsCount < 1 || yearsCount > 50) {
        throw new Error('Please provide a valid number of years between 1 and 50.');
      }

      const requestPayload = {
        gsrData: gsrTableData,
        years_count: yearsCount,
        selectedVillages: selectedVillages,
        timestamp: new Date().toISOString()
      };

      console.log('🔄 Computing Stress Identification...');
      console.log(`   Years: ${yearsCount}`);
      console.log(`   GSR Records: ${gsrTableData.length}`);

      const response = await fetch('http://localhost:6500/gwa/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      let stressData: StressData[] = [];
      if (result.success && result.data && Array.isArray(result.data)) {
        stressData = result.data;
      } else if (result.stress_data && Array.isArray(result.stress_data)) {
        stressData = result.stress_data;
      } else if (result.results && Array.isArray(result.results)) {
        stressData = result.results;
      } else {
        throw new Error('Invalid response format from server');
      }

      setStressTableData(stressData);
      console.log(`✅ Stress identification completed for ${stressData.length} villages`);

      return stressData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during stress identification';
      console.error('❌ Stress Identification Error:', errorMessage);
      setStressError(errorMessage);
      setStressTableData([]);
      throw err;
    } finally {
      setStressLoading(false);
    }
  };

  const value: GSRContextType = {
    gsrTableData,
    gsrLoading,
    gsrError,
    stressTableData,
    stressLoading,
    stressError,
    gsrGeojsonData,
    mergeStatistics,
    mapImageFilename,
    mapImageBase64,
    computeGSR,
    canComputeGSR,
    computeStressIdentification,
    canComputeStressIdentification,
    clearGSRData,
    clearStressData,
    getMapImageUrl,
    getMapImageSrc,
  };

  return (
    <GSRContext.Provider value={value}>
      {children}
    </GSRContext.Provider>
  );
};

export const useGSR = (): GSRContextType => {
  const context = useContext(GSRContext);
  if (context === undefined) {
    throw new Error('useGSR must be used within a GSRProvider');
  }
  return context;
};