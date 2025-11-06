'use client';

import React from 'react';
import { Document, Page, StyleSheet, Text } from '@react-pdf/renderer';
import HeaderSection from './components/Header';
import ConclusionSection from './components/Conclusion';
import ReferenceSection from './components/Reference';
import AreaSection from './components/area';

// Add further sectional imports as needed

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: 'grey',
  },
});

interface ExportPDFProps {
  series: any[];
  hasData: boolean;
  selectedSubdistricts: { sub: number; name?: string; districtName?: string }[];
  stateName?: string;
  districtNames?: string[];
  villageNames?: string[];   // Add this line
  totalPopulation?: number;
  surfaceWaterResults?: any;
  eflowResults?: any;
  climateResults?: any;
}

interface PDFPageProps {
  children: React.ReactNode;
}

const PDFPage: React.FC<PDFPageProps> = ({ children }) => (
  <Page size="A4" style={styles.page}>
    {children}
    <Text
      style={styles.footer}
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      fixed
    />
  </Page>
);

/**
 * Main PDF export structure, with area summary and room for analytics.
 * This easily expands to include other results/pages.
 */
const ExportPDF: React.FC<ExportPDFProps> = ({
  series,
  hasData,
  selectedSubdistricts,
  stateName,
  districtNames,
  villageNames, 
  totalPopulation,
  surfaceWaterResults,
  eflowResults,
  climateResults,
}) => {
  // Optimize or process further as needed for downstream pages

  return (
    <Document title="Surface Water Assessment Report" author="DSS Muskan">
      {/* Header page, report intro */}
      <PDFPage>
        <HeaderSection />
      </PDFPage>

      {/* Area summary page with exported area data */}
      <PDFPage>
        <AreaSection
          selectedSubdistricts={selectedSubdistricts}
          stateName={stateName}
          districtNames={districtNames}
          villageNames={villageNames}
          totalPopulation={totalPopulation}
        />
      </PDFPage>

      {/* Add more result sections for FDC, surplus, surface water, eflow, climate, as needed */}

      {/* Final pages */}
      <PDFPage>
        <ConclusionSection />
      </PDFPage>
      <PDFPage>
        <ReferenceSection />
      </PDFPage>
    </Document>
  );
};

export default ExportPDF;
