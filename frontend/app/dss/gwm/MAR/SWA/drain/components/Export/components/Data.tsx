'use client';

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  text: { fontSize: 12, lineHeight: 1.4 }
});

const DataSection = () => (
  <View style={styles.section}>
    <Text style={styles.title}>Data Summary</Text>
    <Text style={styles.text}>
      Key parameters such as flow rate, reservoir capacities, rainfall distribution,
      and climate change indicators are presented here. The information is sourced
      from validated hydrological datasets and model estimations.
    </Text>
  </View>
);

export default DataSection;
