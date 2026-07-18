import type {ReactNode} from 'react';
import type {LucideIcon} from 'lucide-react';
import type {Severity} from '../domain/types';

export type InputTabId = 'project' | 'system' | 'busbars' | 'layout' | 'environment' | 'short-circuit';

export type InputTab = {
  id: InputTabId;
  label: string;
  icon: LucideIcon;
};

type InputTabsProps = {
  tabs: InputTab[];
  active: InputTabId;
  onChange: (id: InputTabId) => void;
  attention?: Partial<Record<InputTabId, Severity>>;
  children: ReactNode;
};

export function InputTabs({tabs, active, onChange, attention, children}: InputTabsProps) {
  return (
    <div className="input-tabs">
      <div className="input-tabs__strip" role="tablist" aria-label="Input groups">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          const severity = attention?.[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`input-panel-${tab.id}`}
              id={`input-tab-${tab.id}`}
              className={`input-tabs__tab${isActive ? ' is-active' : ''}`}
              onClick={() => onChange(tab.id)}
              title={severity ? `${tab.label} — has ${severity === 'error' ? 'errors' : 'warnings'}` : tab.label}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{tab.label}</span>
              {severity ? (
                <span
                  className={`input-tabs__dot input-tabs__dot--${severity}`}
                  aria-label={severity === 'error' ? 'Tab has errors' : 'Tab has warnings'}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="input-tabs__body">{children}</div>
    </div>
  );
}
