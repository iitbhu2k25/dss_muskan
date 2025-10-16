// frontend/app/dss/nmcg/page.tsx
'use client';
import React from 'react';
import Left from './components/left';
import MapComponent from './components/map';
import { ShapefileProvider } from '@/contexts/datahub/Section1Context';
import { MapProvider } from '@/contexts/datahub/MapContext';

const Page = () => {
  return (
    <ShapefileProvider>
      <MapProvider>
        <div className="h-[80vh] w-full flex overflow-hidden bg-gray-100">
          {/* Left panel - 40% */}
          <div className="w-1/2 h-[80vh] p-2 overflow-y-auto">
            <Left />
          </div>

          {/* Map panel - 60% */}
          <div className="w-1/2 h-[80vh] p-2">
            <MapComponent />
          </div>
        </div>
      </MapProvider>
    </ShapefileProvider>
  );
};

export default Page;