import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { SyntheticGeneratorModal } from './components/SyntheticGeneratorModal';
import { DashboardView } from './views/DashboardView';
import { InfrastructureView } from './views/InfrastructureView';
import { AttackGraphView } from './views/AttackGraphView';
import { AttackPathsView } from './views/AttackPathsView';
import { SimulationView } from './views/SimulationView';
import { PredictiveNextStepView } from './views/PredictiveNextStepView';
import { AIAnalystView } from './views/AIAnalystView';
import { WhatIfView } from './views/WhatIfView';
import { GraphAILabView } from './views/GraphAILabView';
import { ReportsView } from './views/ReportsView';
import { PacketScannerView } from './views/PacketScannerView';
import { CVEIntelligenceView } from './views/CVEIntelligenceView';
import { api } from './services/api';


export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isSyntheticModalOpen, setIsSyntheticModalOpen] = useState<boolean>(false);
  const [highlightedPathNodes, setHighlightedPathNodes] = useState<string[]>([]);
  const [simulationStartNode, setSimulationStartNode] = useState<string | undefined>(undefined);
  const [aiExplainPathNodes, setAiExplainPathNodes] = useState<string[] | undefined>(undefined);
  
  const [postureScore, setPostureScore] = useState<number>(78);
  const [highRiskCount, setHighRiskCount] = useState<number>(0);

  const fetchGlobalStats = async () => {
    try {
      const metrics = await api.getDashboardMetrics();
      setPostureScore(metrics.security_posture_score);
      setHighRiskCount(metrics.high_risk_paths_count);
    } catch (err) {
      console.error('Failed to load global metrics:', err);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const handleNavigateToPath = (pathNodes: string[]) => {
    setHighlightedPathNodes(pathNodes);
    setActiveTab('attack-graph');
  };

  const handleNavigateToSimulation = (startNode?: string) => {
    setSimulationStartNode(startNode);
    setActiveTab('simulation');
  };

  const handleExplainWithAI = (pathNodes: string[]) => {
    setAiExplainPathNodes(pathNodes);
    setActiveTab('ai-analyst');
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top SOC Navbar */}
      <Navbar
        onOpenSyntheticModal={() => setIsSyntheticModalOpen(true)}
        onRefreshData={fetchGlobalStats}
        postureScore={postureScore}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left SOC Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          highRiskCount={highRiskCount}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#050811] to-[#070c18]">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToPath={handleNavigateToPath}
              onNavigateToSimulation={handleNavigateToSimulation}
              onOpenSyntheticModal={() => setIsSyntheticModalOpen(true)}
            />
          )}

          {activeTab === 'infrastructure' && (
            <InfrastructureView onDataChanged={fetchGlobalStats} />
          )}

          {activeTab === 'packet-scanner' && (
            <PacketScannerView
              onInspectInGraph={handleNavigateToPath}
              onRefreshGlobal={fetchGlobalStats}
            />
          )}

          {activeTab === 'cve-intel' && (
            <CVEIntelligenceView
              onInspectInGraph={handleNavigateToPath}
              onRefreshGlobal={fetchGlobalStats}
            />
          )}

          {activeTab === 'attack-graph' && (

            <AttackGraphView
              highlightedPathNodes={highlightedPathNodes}
              onClearHighlight={() => setHighlightedPathNodes([])}
              onSimulateFromNode={handleNavigateToSimulation}
            />
          )}

          {activeTab === 'attack-paths' && (
            <AttackPathsView
              onInspectInGraph={handleNavigateToPath}
              onSimulatePath={handleNavigateToSimulation}
              onExplainWithAI={handleExplainWithAI}
            />
          )}

          {activeTab === 'simulation' && (
            <SimulationView
              initialStartNode={simulationStartNode}
              onInspectInGraph={handleNavigateToPath}
            />
          )}

          {activeTab === 'predictive-hop' && (
            <PredictiveNextStepView />
          )}

          {activeTab === 'ai-analyst' && (
            <AIAnalystView selectedPathNodes={aiExplainPathNodes} />
          )}

          {activeTab === 'what-if' && (
            <WhatIfView />
          )}

          {activeTab === 'gnn-lab' && (
            <GraphAILabView />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}
        </main>
      </div>

      {/* Synthetic Organization Generator Modal */}
      <SyntheticGeneratorModal
        isOpen={isSyntheticModalOpen}
        onClose={() => setIsSyntheticModalOpen(false)}
        onGenerated={fetchGlobalStats}
      />
    </div>
  );
};

export default App;
