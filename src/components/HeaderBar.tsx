import {Bus, RotateCcw, SunMoon} from 'lucide-react';
import type {BusbarCalculationResult, BusbarInput} from '../domain/types';
import {formatNumber} from '../utils/format';
import {ExportToolbar} from './ExportToolbar';
import {IconOnlyButton} from './ui';

type HeaderBarProps = {
  input: BusbarInput;
  result: BusbarCalculationResult;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  onImport: (input: BusbarInput) => void;
  onReset: () => void;
};

export function HeaderBar({input, result, theme, onThemeChange, onImport, onReset}: HeaderBarProps) {
  return (
    <header className="header-bar">
      <div className="brand">
        <span className="brand__mark" aria-hidden="true">
          <Bus size={22} />
        </span>
        <div>
          <h1>Busbar Calculator</h1>
          <span>Engine v{result.engineVersion}</span>
        </div>
      </div>
      <dl className="project-strip">
        <div>
          <dt>Project</dt>
          <dd>{input.project.projectName || 'not set'}</dd>
        </div>
        <div>
          <dt>Tag</dt>
          <dd>{input.project.tag || 'not set'}</dd>
        </div>
        <div>
          <dt>System</dt>
          <dd>
            {formatNumber(input.ratedVoltage_V, 0)} V, {input.systemType === 'AC' ? `${formatNumber(input.frequency_Hz, 0)} Hz` : 'DC'}
          </dd>
        </div>
        <div>
          <dt>Engineer</dt>
          <dd>{input.project.engineer || 'not set'}</dd>
        </div>
      </dl>
      <div className="header-actions">
        <ExportToolbar input={input} result={result} onImport={onImport} />
        <IconOnlyButton label="Reset project" onClick={onReset}>
          <RotateCcw size={17} />
        </IconOnlyButton>
        <IconOnlyButton label="Toggle theme" onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}>
          <SunMoon size={17} />
        </IconOnlyButton>
      </div>
    </header>
  );
}
