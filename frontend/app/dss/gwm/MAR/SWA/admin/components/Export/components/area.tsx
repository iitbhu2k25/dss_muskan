import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

interface AreaSectionProps {
  selectedSubdistricts: Array<{ sub: number; name?: string; districtName?: string }>;
  stateName?: string;
  districtNames?: string[];
  villageNames?: string[];
  totalPopulation?: number;
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: '#cfd9df',
    borderRadius: 10,
    backgroundColor: '#f9fbfd',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a232f',
    textAlign: 'center',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2980b9',
    paddingBottom: 6,
  },
  infoRow: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 3,
  },
  value: {
    fontSize: 12,
    color: '#34495e',
  },
  inlineList: {
    fontSize: 12,
    color: '#2c3e50',
    lineHeight: 1.5,
    flexWrap: 'wrap',
    display: 'flex',
    flexDirection: 'row',
  },
  bullet: {
    marginRight: 4,
  },
  inlineItem: {
    marginRight: 6,
  },
  statBox: {
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2980b9',
    borderRadius: 6,
    backgroundColor: '#eaf3fb',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a232f',
  },
});

const joinList = (list: string[]) => list.filter(Boolean).join(', ') || 'Not specified';

const AreaSection: React.FC<AreaSectionProps> = ({
  selectedSubdistricts,
  stateName,
  districtNames,
  villageNames = [],
  totalPopulation,
}) => {
  const computedDistricts =
    districtNames && districtNames.length > 0
      ? districtNames
      : Array.from(new Set(selectedSubdistricts.map(d => d.districtName).filter(Boolean))) as string[];

  const subdistrictNames =
    selectedSubdistricts && selectedSubdistricts.length > 0
      ? Array.from(new Set(selectedSubdistricts.map(sd => sd.name).filter(Boolean)))
      : [];

  const uniqueVillages = Array.from(new Set(villageNames)).sort();

  return (
    <View style={styles.section}>
      <Text style={styles.header}>Selected Region</Text>

      <View style={styles.infoRow}>
        <Text style={styles.label}>State:</Text>
        <Text style={styles.value}>{stateName || 'Not specified'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Districts:</Text>
        <Text style={styles.value}>{computedDistricts.length > 0 ? joinList(computedDistricts) : 'Not specified'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Sub-Districts:</Text>
        {subdistrictNames.length > 0 ? (
          <Text style={styles.inlineList}>
            {subdistrictNames.map((name, idx) => (
              <Text key={`subdistrict-${idx}`} style={styles.inlineItem}>
                • {name}
              </Text>
            ))}
          </Text>
        ) : (
          <Text style={styles.value}>Not specified</Text>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Villages:</Text>
        {uniqueVillages.length > 0 ? (
          <Text style={styles.inlineList}>
            {uniqueVillages.map((name, idx) => (
              <Text key={`village-${idx}`} style={styles.inlineItem}>
                • {name}
              </Text>
            ))}
          </Text>
        ) : (
          <Text style={styles.value}>Not specified</Text>
        )}
      </View>

      {typeof totalPopulation === 'number' && totalPopulation > 0 && (
        <View style={styles.statBox}>
          <Text style={styles.statText}>
            👥 Total Population: {totalPopulation.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
};

export default AreaSection;
