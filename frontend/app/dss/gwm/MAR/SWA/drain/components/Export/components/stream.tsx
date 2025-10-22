'use client';

import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  text: { fontSize: 12, lineHeight: 1.4, marginBottom: 6 },
  image: { width: 220, height: 140, marginVertical: 8 },
});

interface FDCCurveProps {
  series: any[];
  hasData: boolean;
}

const FDCCurveSection: React.FC<FDCCurveProps> = ({ series, hasData }) => {
  if (!hasData || series.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Flow Duration Curve (FDC) Summary</Text>
        <Text style={styles.text}>No FDC data available for the selected subbasins.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Flow Duration Curve (FDC) Summary</Text>
      <Text style={styles.text}>
        The following summary presents flow characteristics derived from flow duration curves (FDC) across the evaluated subbasins.
        It includes Q25 (25% exceedance) values representing moderate to high flow conditions.
      </Text>

      {series.map((s, index) => {
        const closest = s.curve.reduce((prev: any, curr: any) =>
          Math.abs(curr.p - 25) < Math.abs(prev.p - 25) ? curr : prev
        );
        const q25 = closest.q.toFixed(3);

        return (
          <View key={index} style={{ marginBottom: 12 }}>
            <Text style={styles.text}>Subbasin {s.sub}</Text>
            <Text style={styles.text}>Q25 Flow: {q25} m³/s</Text>
            {s.imageBase64 && (
              <Image
                style={styles.image}
                src={`data:image/png;base64,${s.imageBase64}`}
              />
            )}
          </View>
        );
      })}

      <Text style={styles.text}>
        Data is generated from model-estimated runoff series and processed through exceedance probability analysis.
      </Text>
    </View>
  );
};

export default FDCCurveSection;
