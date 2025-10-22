import React from 'react';
import { Page } from '@react-pdf/renderer';
import SurfaceWaterSection from './surfacewater'; // Adjust the path as necessary

interface PDFSurfaceWaterPageProps {
  mergedSeries: { day: number; flow: number; surplus: number }[];
  q25: number | null;
}

const PDFSurfaceWaterPage: React.FC<PDFSurfaceWaterPageProps> = ({ mergedSeries, q25 }) => (
  <Page size="A4" style={{ padding: 30, backgroundColor: '#fff' }}>
    <SurfaceWaterSection mergedSeries={mergedSeries} q25={q25} />
  </Page>
);

export default PDFSurfaceWaterPage;
