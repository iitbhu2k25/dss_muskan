// frontend/app/dss/gwm/MAR/SWA/drain/components/Export/components/climate.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 15,
    border: '1pt solid #e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fafafa',
  },
  headerBar: {
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  introText: {
    fontSize: 11,
    color: '#333',
    lineHeight: 1.4,
    marginBottom: 10,
    textAlign: 'justify',
  },
  scenarioSection: {
    marginBottom: 15,
  },
  scenarioHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '0.7pt solid #a7f3d0',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    border: '0.7pt solid #d0d0d0',
    borderRadius: 6,
    marginBottom: 10,
    padding: 8,
    boxShadow: '0 1pt 2pt rgba(0,0,0,0.1)',
  },
  fullWidthCard: {
    width: '100%',
    backgroundColor: 'white',
    border: '0.7pt solid #d0d0d0',
    borderRadius: 6,
    marginBottom: 10,
    padding: 10,
    boxShadow: '0 1pt 2pt rgba(0,0,0,0.1)',
  },
  subHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  text: {
    fontSize: 10.5,
    lineHeight: 1.4,
    marginBottom: 4,
    color: '#444',
  },
  image: {
    width: '100%',
    height: 130,
    borderRadius: 4,
    marginTop: 6,
  },
  largeImage: {
    width: '100%',
    height: 160,
    borderRadius: 4,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
  },
  statValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  footerNote: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'justify',
  },
  highlightBox: {
    backgroundColor: '#d1fae5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    border: '0.7pt solid #6ee7b7',
  },
  highlightText: {
    fontSize: 10,
    color: '#065f46',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    border: '0.7pt solid #fbbf24',
  },
  warningText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: 'bold',
  },
});

interface ClimateData {
  subbasin_id: number;
  scenario: number;
  start_year: number;
  end_year: number;
  image_base64?: string;
  data?: {
    points: Array<{
      year: number;
      mon: number;
      flow_out: number;
    }>;
  };
}

interface ClimateSectionProps {
  climateResults?: Record<string, ClimateData>;
}

const ClimateSection: React.FC<ClimateSectionProps> = ({ climateResults }) => {
  if (!climateResults || Object.keys(climateResults).length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.headerBar}>
          <Text style={styles.headerText}>Climate Change Impact Analysis</Text>
        </View>
        <Text style={styles.text}>No climate change data available for the selected subbasins.</Text>
      </View>
    );
  }

  // Organize results by scenario
  const scenarioMap: Record<number, ClimateData[]> = {};
  Object.values(climateResults).forEach((data) => {
    if (!scenarioMap[data.scenario]) {
      scenarioMap[data.scenario] = [];
    }
    scenarioMap[data.scenario].push(data);
  });

  // Scenario labels
  const scenarioLabels: Record<number, { name: string; description: string }> = {
    585: { 
      name: 'RCP 8.5 (High Emissions)', 
      description: 'Business-as-usual scenario with continued high greenhouse gas emissions' 
    },
    370: { 
      name: 'RCP 6.0 (Moderate-High)', 
      description: 'Stabilization scenario with emissions peaking around 2080' 
    },
    245: { 
      name: 'RCP 4.5 (Moderate)', 
      description: 'Stabilization scenario with emissions peaking around 2040' 
    },
    126: { 
      name: 'RCP 2.6 (Low Emissions)', 
      description: 'Aggressive mitigation scenario achieving net-zero by 2100' 
    },
  };

  // Calculate statistics for each scenario
  const scenarioStats: Record<number, { avgFlow: number; minFlow: number; maxFlow: number; subbasins: number }> = {};
  
  Object.entries(scenarioMap).forEach(([scenario, dataArray]) => {
    const allFlows: number[] = [];
    dataArray.forEach((data) => {
      if (data.data?.points) {
        data.data.points.forEach((p) => {
          if (Number.isFinite(p.flow_out)) {
            allFlows.push(p.flow_out);
          }
        });
      }
    });

    if (allFlows.length > 0) {
      scenarioStats[Number(scenario)] = {
        avgFlow: allFlows.reduce((a, b) => a + b, 0) / allFlows.length,
        minFlow: Math.min(...allFlows),
        maxFlow: Math.max(...allFlows),
        subbasins: dataArray.length,
      };
    }
  });

  return (
    <View style={styles.section}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>Climate Change Impact Analysis</Text>
      </View>

      <Text style={styles.introText}>
        Climate change projections show how future flow patterns may evolve under different Representative 
        Concentration Pathways (RCPs). These scenarios represent varying levels of greenhouse gas emissions 
        and their impacts on hydrological cycles. Understanding these changes is critical for long-term 
        water resource planning and managed aquifer recharge strategies.
      </Text>

      {/* Scenario Comparison Summary */}
      <View style={styles.highlightBox}>
        <Text style={styles.highlightText}>Analysis Period & Scenarios</Text>
        {Object.entries(scenarioMap).map(([scenario, dataArray]) => {
          const firstData = dataArray[0];
          const stats = scenarioStats[Number(scenario)];
          return (
            <Text key={scenario} style={styles.text}>
              • {scenarioLabels[Number(scenario)]?.name || `Scenario ${scenario}`}: 
              {' '}{firstData.start_year}–{firstData.end_year}
              {stats && ` | Avg Flow: ${stats.avgFlow.toFixed(2)} m³`}
            </Text>
          );
        })}
      </View>

      {/* Scenario-wise Analysis */}
      {Object.entries(scenarioMap).map(([scenario, dataArray]) => {
        const scenarioInfo = scenarioLabels[Number(scenario)];
        
        return (
          <View key={scenario} style={styles.scenarioSection} wrap={false}>
            <Text style={styles.scenarioHeader}>
              {scenarioInfo?.name || `Scenario ${scenario}`}
            </Text>
            
            <Text style={[styles.text, { marginBottom: 8, fontSize: 10, fontStyle: 'italic' }]}>
              {scenarioInfo?.description || 'Climate projection scenario'}
            </Text>

            <View style={styles.gridContainer}>
              {dataArray.map((data) => {
                const stats = scenarioStats[Number(scenario)];
                
                return (
                  <View key={`${data.subbasin_id}_${scenario}`} style={styles.card}>
                    <Text style={styles.subHeader}>Subbasin {data.subbasin_id}</Text>
                    
                    <View style={styles.statsRow}>
                      <Text style={styles.statLabel}>Period:</Text>
                      <Text style={styles.statValue}>
                        {data.start_year}–{data.end_year}
                      </Text>
                    </View>
                    
                    {stats && (
                      <>
                        <View style={styles.statsRow}>
                          <Text style={styles.statLabel}>Avg Outflow:</Text>
                          <Text style={styles.statValue}>
                            {stats.avgFlow.toFixed(2)} m³
                          </Text>
                        </View>
                        
                        <View style={styles.statsRow}>
                          <Text style={styles.statLabel}>Range:</Text>
                          <Text style={styles.statValue}>
                            {stats.minFlow.toFixed(1)}–{stats.maxFlow.toFixed(1)} m³
                          </Text>
                        </View>
                      </>
                    )}

                    {data.image_base64 && (
                      <Image
                        style={styles.image}
                        src={`data:image/png;base64,${data.image_base64}`}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Key Insights */}
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>Key Climate Considerations</Text>
        <Text style={[styles.text, { fontSize: 9.5, marginTop: 4 }]}>
          • Higher emission scenarios (RCP 8.5) generally show increased flow variability
        </Text>
        <Text style={[styles.text, { fontSize: 9.5 }]}>
          • Seasonal patterns may shift, affecting recharge timing and volumes
        </Text>
        <Text style={[styles.text, { fontSize: 9.5 }]}>
          • Long-term planning should account for worst-case (RCP 8.5) projections
        </Text>
        <Text style={[styles.text, { fontSize: 9.5 }]}>
          • Adaptive management strategies are essential for climate resilience
        </Text>
      </View>

      <Text style={styles.footerNote}>
        Climate projections are based on CMIP5/CMIP6 models downscaled to the study region. Monthly outflow 
        values represent simulated runoff under different emission scenarios. These projections help assess 
        long-term water availability and identify adaptation needs for managed aquifer recharge systems.
      </Text>
    </View>
  );
};

export default ClimateSection;