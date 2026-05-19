import type {ReactNode} from 'react';
import type {ArrangementDirection, BarOrientation} from '../domain/types';

type CardOption<T extends string> = {
  value: T;
  label: string;
  hint: string;
  preview: ReactNode;
};

type RadioCardsProps<T extends string> = {
  legend: string;
  value: T;
  options: CardOption<T>[];
  onChange: (value: T) => void;
};

function RadioCards<T extends string>({legend, value, options, onChange}: RadioCardsProps<T>) {
  return (
    <fieldset className="radio-cards">
      <legend className="radio-cards__legend">{legend}</legend>
      <div className="radio-cards__grid">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${option.label}. ${option.hint}`}
              className={`radio-card${isActive ? ' is-active' : ''}`}
              onClick={() => onChange(option.value)}
            >
              <span className="radio-card__preview" aria-hidden="true">
                {option.preview}
              </span>
              <span className="radio-card__text">
                <span className="radio-card__label">{option.label}</span>
                <span className="radio-card__hint" title={option.hint}>{option.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const phaseFill = 'rgba(34, 211, 238, 0.55)';
const phaseStroke = 'rgba(229, 237, 247, 0.85)';

function HorizontalPreview() {
  return (
    <svg viewBox="0 0 40 28" width="34" height="24" aria-hidden="true">
      <rect x="1" y="1" width="38" height="26" rx="2" fill="none" stroke="rgba(229,237,247,0.28)" strokeDasharray="2 2" />
      {[7, 17, 27].map((x) => (
        <rect key={x} x={x} y="7" width="6" height="14" rx="1" fill={phaseFill} stroke={phaseStroke} />
      ))}
    </svg>
  );
}

function VerticalPreview() {
  return (
    <svg viewBox="0 0 28 40" width="24" height="34" aria-hidden="true">
      <rect x="1" y="1" width="26" height="38" rx="2" fill="none" stroke="rgba(229,237,247,0.28)" strokeDasharray="2 2" />
      {[5, 17, 29].map((y) => (
        <rect key={y} x="7" y={y} width="14" height="6" rx="1" fill={phaseFill} stroke={phaseStroke} />
      ))}
    </svg>
  );
}

function FlatwisePreview() {
  return (
    <svg viewBox="0 0 40 28" width="34" height="24" aria-hidden="true">
      <rect x="1" y="1" width="38" height="26" rx="2" fill="none" stroke="rgba(229,237,247,0.28)" strokeDasharray="2 2" />
      <rect x="6" y="11" width="28" height="6" rx="1" fill={phaseFill} stroke={phaseStroke} />
    </svg>
  );
}

function EdgewisePreview() {
  return (
    <svg viewBox="0 0 40 28" width="34" height="24" aria-hidden="true">
      <rect x="1" y="1" width="38" height="26" rx="2" fill="none" stroke="rgba(229,237,247,0.28)" strokeDasharray="2 2" />
      <rect x="17" y="5" width="6" height="18" rx="1" fill={phaseFill} stroke={phaseStroke} />
    </svg>
  );
}

export function ArrangementCards({value, onChange}: {value: ArrangementDirection; onChange: (value: ArrangementDirection) => void}) {
  return (
    <RadioCards<ArrangementDirection>
      legend="Phase arrangement"
      value={value}
      onChange={onChange}
      options={[
        {value: 'horizontal', label: 'Horizontal', hint: 'L1 L2 L3 side-by-side', preview: <HorizontalPreview />},
        {value: 'vertical', label: 'Vertical', hint: 'Phases stacked', preview: <VerticalPreview />},
      ]}
    />
  );
}

export function OrientationCards({value, onChange}: {value: BarOrientation; onChange: (value: BarOrientation) => void}) {
  return (
    <RadioCards<BarOrientation>
      legend="Bar orientation"
      value={value}
      onChange={onChange}
      options={[
        {value: 'flatwise', label: 'Flatwise', hint: 'Wide face horizontal', preview: <FlatwisePreview />},
        {value: 'edgewise', label: 'Edgewise', hint: 'Bar on edge', preview: <EdgewisePreview />},
      ]}
    />
  );
}
