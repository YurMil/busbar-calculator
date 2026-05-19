import type {BusbarCalculationResult} from '../domain/types';
import {Panel} from './ui';

export function TracePanel({result}: {result: BusbarCalculationResult}) {
  return (
    <Panel title="Calculation Trace" className="trace-panel">
      <ol className="trace-list">
        {result.trace.map((item) => (
          <li key={item.id}>
            <span>{item.label}</span>
            <strong>
              {item.output}
              {item.unit ? ` ${item.unit}` : ''}
            </strong>
            <em>{item.method}</em>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
