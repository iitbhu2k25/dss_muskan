      'use client';

      import React, { useState } from 'react';
      import { LocationProvider, useLocationContext } from '@/contexts/surfacewater_assessment/drain/LocationContext';
      import { StreamFlowProvider, useStreamFlowContext } from '@/contexts/surfacewater_assessment/drain/StreamFlowContext';
      import { MapProvider } from '@/contexts/surfacewater_assessment/drain/MapContext';
      import { SurfaceWaterProvider } from '@/contexts/surfacewater_assessment/drain/SurfaceWater';
      import { EflowProvider } from '@/contexts/surfacewater_assessment/drain/EFlowContext';
      import { ClimateProvider } from '@/contexts/surfacewater_assessment/drain/ClimateContext';
      import LocationPage from './components/Location';
      import StreamFlow from './components/StreamFlow';
      import SurfaceWaterCard from './components/surfacewater';
      import MapPage from './components/Map';
      import EFlow from './components/EFlow';
      import Climate from './components/climate';
      import ResizablePanels from './components/resizable-panels';
      import { BarChart3, Droplets, Leaf, CloudRain } from 'lucide-react';
      import { PDFDownloadLink } from '@react-pdf/renderer';
      import ExportPDF from './components/Export/page';


      type TabType = 'streamflow' | 'surfacewater' | 'eflow' | 'climate';


      const MainContent: React.FC = () => {
        const { selectionConfirmed, selectedSubbasins } = useLocationContext();
        const [activeTab, setActiveTab] = useState<TabType>('streamflow');
        const { series, hasData } = useStreamFlowContext();  // extract series and hasData from context here

        const tabs = [
          { id: 'streamflow', label: 'Stream Flow', icon: BarChart3, color: 'blue', component: StreamFlow },
          { id: 'surfacewater', label: 'Surface Water', icon: Droplets, color: 'green', component: SurfaceWaterCard },
          { id: 'eflow', label: 'Environmental Flow', icon: Leaf, color: 'purple', component: EFlow },
          { id: 'climate', label: 'Climate Change', icon: CloudRain, color: 'orange', component: Climate },
        ] as const;

        const handleTabClick = (tabId: TabType) => {
          setActiveTab(tabId);
        };

        const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || StreamFlow;

        return (
          <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
            <ResizablePanels
              left={
                <div className="flex-grow overflow-y-auto bg-white m-2 rounded-xl shadow-lg border border-gray-200">
                  <div className="p-6 space-y-6">

                    {/* Location Section */}
                    <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
                      <LocationPage />
                    </div>

                    {/* Download PDF Button */}
                    {selectionConfirmed && (
                      <div className="flex justify-end mb-4">
                        <PDFDownloadLink
                          document={<ExportPDF series={series} hasData={hasData} selectedSubbasins={selectedSubbasins} surfaceWaterResults={null} />}
                          fileName="Surface_Water_Assessment.pdf"
                          className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-all"
                        >
                          {({ loading }) => (loading ? 'Preparing PDF...' : 'Download PDF Report')}
                        </PDFDownloadLink>
                      </div>
                    )}

                    {/* Tab Navigation */}
                    {selectionConfirmed ? (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id as TabType)}
                                className={`
                                  relative flex flex-col items-center justify-center p-4 rounded-lg border-2 
                                  transition-all duration-200 transform hover:scale-105
                                  ${isActive
                                    ? 'bg-blue-800 text-white border-gray-800 shadow-lg'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                  }
                                `}
                              >
                                <span className="text-sm font-semibold text-center leading-tight">
                                  {tab.label}
                                </span>
                                {isActive && (
                                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rounded-full" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="relative inline-flex items-center group">
                        <i className="ti ti-info-circle text-amber-700 cursor-help" aria-hidden="true" />
                        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 shadow-lg opacity-0 invisible transition-opacity duration-200 z-20 group-hover:opacity-100 group-hover:visible">
                          Select subbasins and click Confirm to proceed.
                        </span>
                      </span>
                    )}

                    {/* Active Tab Content */}
                    {selectionConfirmed && (
                      <div className="transition-all duration-300 ease-in-out">
                        <ActiveComponent />
                      </div>
                    )}
                  </div>
                </div>
              }
              right={
                <div className="flex-grow m-2 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <MapPage />
                </div>
              }
            />
          </div>
        );
      };

      export default function SurfaceWaterAssessmentDrain() {
        return (
          <LocationProvider>
            <StreamFlowProvider>
              <MapProvider>
                <SurfaceWaterProvider>
                  <EflowProvider>
                    <ClimateProvider>
                      <MainContent />
                    </ClimateProvider>
                  </EflowProvider>
                </SurfaceWaterProvider>
              </MapProvider>
            </StreamFlowProvider>
          </LocationProvider>
        );
      }
