import {ChangeEvent, useRef} from 'react';
import {ClipboardCopy, Code2, Download, FileDown, FileInput} from 'lucide-react';
import {buildPdfReport, reportFileName} from '../export/report';
import type {BusbarCalculationResult, BusbarInput} from '../domain/types';
import {formatNumber, statusLabel} from '../utils/format';

type ExportToolbarProps = {
  input: BusbarInput;
  result: BusbarCalculationResult;
  onImport: (input: BusbarInput) => void;
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportToolbar({input, result, onImport}: ExportToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportPdf = async () => {
    const blob = await buildPdfReport(input, result);
    downloadBlob(blob, reportFileName(input));
  };

  const exportJson = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            fileType: 'cadautoscript.busbar-project',
            schemaVersion: '1.0',
            createdAt: new Date().toISOString(),
            appVersion: '0.1.0',
            project: input.project,
            input,
            resultSnapshot: result,
          },
          null,
          2,
        ),
      ],
      {type: 'application/json'},
    );
    downloadBlob(blob, `busbar-project_${input.project.tag || 'draft'}.json`);
  };

  const copySummary = async () => {
    await navigator.clipboard.writeText(
      [
        `Busbar status: ${statusLabel(result.status)}`,
        `Selected: ${result.selectedProfile.materialLabel} ${result.selectedProfile.width_mm} x ${result.selectedProfile.thickness_mm} mm, ${result.selectedProfile.barsPerPhase} bars/phase`,
        `J: ${formatNumber(result.electrical.currentDensity_A_per_mm2, 2)} A/mm2`,
        `Losses: ${formatNumber(result.electrical.losses_W_per_m, 1)} W/m`,
        `Temperature: ${formatNumber(result.thermal.steadyStateTemp_C, 1)} degC`,
        `Envelope: ${formatNumber(result.envelope.width_mm, 1)} x ${formatNumber(result.envelope.height_mm, 1)} mm`,
      ].join('\n'),
    );
  };

  const copyCadPayload = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          units: 'mm',
          project: input.project,
          envelope: result.envelope,
          selectedProfile: result.selectedProfile,
        },
        null,
        2,
      ),
    );
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text) as {input?: BusbarInput};
    if (!parsed.input) {
      throw new Error('Invalid busbar project file.');
    }
    onImport(parsed.input);
    event.target.value = '';
  };

  return (
    <div className="export-toolbar">
      <button type="button" onClick={exportPdf}>
        <FileDown size={16} />
        Export PDF
      </button>
      <button type="button" onClick={exportJson}>
        <Download size={16} />
        Export JSON
      </button>
      <button type="button" onClick={() => fileInputRef.current?.click()}>
        <FileInput size={16} />
        Import
      </button>
      <button type="button" onClick={copySummary} title="Copy result summary">
        <ClipboardCopy size={16} />
      </button>
      <button type="button" onClick={copyCadPayload} title="Copy CAD geometry payload">
        <Code2 size={16} />
      </button>
      <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json" onChange={importJson} />
    </div>
  );
}
