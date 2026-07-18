import {useEffect, useMemo} from 'react';
import {calculateBusbar, getMaterial, getProfile} from './domain/calculations';
import {useBusbarStore} from './state/useBusbarStore';
import {profiles} from './domain/data';
import {HeaderBar} from './components/HeaderBar';
import {InputPanel} from './components/InputPanel';
import {BusbarCrossSection} from './components/BusbarCrossSection';
import {ResultSummary} from './components/ResultSummary';
import {TemperatureForecastChart} from './components/TemperatureForecastChart';
import {ShortCircuitDiagram} from './components/ShortCircuitDiagram';
import {CandidateTable} from './components/CandidateTable';
import {TracePanel} from './components/TracePanel';
import {KpiStrip} from './components/KpiStrip';
import {useToast} from './components/Toaster';
import type {ProfileCandidate} from './domain/types';

export function App() {
  const input = useBusbarStore((state) => state.input);
  const theme = useBusbarStore((state) => state.theme);
  const setInput = useBusbarStore((state) => state.setInput);
  const setProject = useBusbarStore((state) => state.setProject);
  const selectProfile = useBusbarStore((state) => state.selectProfile);
  const loadProject = useBusbarStore((state) => state.loadProject);
  const reset = useBusbarStore((state) => state.reset);
  const setTheme = useBusbarStore((state) => state.setTheme);
  const result = useMemo(() => calculateBusbar(input), [input]);
  const material = useMemo(() => getMaterial(input.materialId), [input.materialId]);
  const {notify} = useToast();

  const handleReset = () => {
    if (window.confirm('Reset all inputs to defaults? Current project data will be lost.')) {
      reset();
      notify('info', 'Project reset to defaults');
    }
  };

  const handleImport = (next: typeof input) => {
    loadProject(next);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleCandidateSelect = (candidate: ProfileCandidate) => {
    const profile = profiles.find((item) => item.profileId === candidate.profileId) ?? getProfile(candidate.profileId, input.materialId);
    selectProfile(profile, candidate.barsPerPhase);
  };

  return (
    <div className="app-shell">
      <HeaderBar
        input={input}
        result={result}
        theme={theme}
        onThemeChange={setTheme}
        onImport={handleImport}
        onReset={handleReset}
      />

      <KpiStrip result={result} />

      <main className="dashboard-grid">
        <InputPanel input={input} result={result} onInput={setInput} onProject={setProject} />

        <section className="workspace" aria-label="Visualization and calculation panels">
          <BusbarCrossSection input={input} result={result} />
          <div className="lower-grid">
            <TemperatureForecastChart result={result} material={material} />
            <ShortCircuitDiagram input={input} result={result} />
          </div>
        </section>

        <ResultSummary result={result} />

        <section className="bottom-band">
          <CandidateTable
            candidates={result.candidates}
            selectedProfileId={result.selectedProfile.profileId}
            selectedBars={result.selectedProfile.barsPerPhase}
            onSelect={handleCandidateSelect}
          />
          <TracePanel result={result} />
        </section>
      </main>

      <footer className="app-footer">
        <span>Standards: DIN 43670/43671 interfaces, IEC 61439, IEC 60664, IEC 60865</span>
        <span>Units: SI, mm, °C, A, kA, s</span>
      </footer>
    </div>
  );
}
