'use client';

import React from 'react';
import { Document, Page, StyleSheet, Text } from '@react-pdf/renderer';
import HeaderSection from './components/Header';
import AreaSection from './components/area';
import FDCCurveSection from './components/stream';
import ConclusionSection from './components/Conclusion';
import ReferenceSection from './components/Reference';
import SurfaceWaterSection from './components/surfacewater'; // Adjust path as necessary


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
  selectedSubbasins: { sub: number; area?: number }[];
  surfaceWaterResults: { mergedSeries: { day: number; flow: number; surplus: number }[]; q25: number | null } | null;
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

const ExportPDF: React.FC<ExportPDFProps> = ({ series, hasData, selectedSubbasins, surfaceWaterResults }) => (
  <Document title="Surface Water Assessment Report" author="DSS Muskan">
    <PDFPage>
      <HeaderSection />
    </PDFPage>

    <PDFPage>
      <AreaSection selectedSubbasins={selectedSubbasins} />
    </PDFPage>

    <PDFPage>
      <FDCCurveSection series={series} hasData={hasData} />
    </PDFPage>
    
    {/* New Surface Water Section Page */}
    {surfaceWaterResults && (
  <PDFPage>
    <SurfaceWaterSection
      mergedSeries={surfaceWaterResults.mergedSeries}
      q25={surfaceWaterResults.q25}
    />
  </PDFPage>
)}


    <PDFPage>
      <ConclusionSection />
    </PDFPage>

    <PDFPage>
      <ReferenceSection />
    </PDFPage>
  </Document>
);


export default ExportPDF;
