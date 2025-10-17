'use client';

import React from 'react';
import { Document, Page, StyleSheet, Text } from '@react-pdf/renderer';
import HeaderSection from './components/Header';
import DataSection from './components/Data';
import ConclusionSection from './components/Conclusion';
import ReferenceSection from './components/Reference';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
    position: 'relative'
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: 'grey'
  }
});

const ExportPDF = () => (
  <Document title="Surface Water Assessment Report" author="DSS Muskan">

    <Page size="A4" style={styles.page}>
      <HeaderSection />
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
      
    </Page>

    <Page size="A4" style={styles.page}>
      <DataSection />
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
      
    </Page>

    <Page size="A4" style={styles.page}>
      <ConclusionSection />
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
      
    </Page>

    <Page size="A4" style={styles.page}>
      <ReferenceSection />
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    
    </Page>

  </Document>
);

export default ExportPDF;
