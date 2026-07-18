import {ChangeEvent, useRef, useState} from 'react';
import {CheckCircle2, CircleAlert, ClipboardCopy, Code2, Download, FileDown, FileInput} from 'lucide-react';
import {buildPdfReport, reportFileName} from '../export/report';
import {captureExport} from '../export/captureSvg';
import type {BusbarCalculationResult, BusbarInput} from '../domain/types';
import {formatNumber, statusLabel} from '../utils/format';
import {useToast} from './Toaster';
import {Modal} from './Modal';
import {StatusBadge} from './ui';

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
  const {notify} = useToast();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeCrossSection, setIncludeCrossSection] = useState(true);
  const [includeForecast, setIncludeForecast] = useState(true);
  const [includeShortCircuit, setIncludeShortCircuit] = useState(true);

  const runPdfExport = async () => {
    setExporting(true);
    try {
      const [crossSection, forecast, shortCircuit] = await Promise.all([
        includeCrossSection ? captureExport('cross-section') : undefined,
        includeForecast ? captureExport('temperature-forecast') : undefined,
        includeShortCircuit ? captureExport('short-circuit') : undefined,
      ]);
      const blob = await buildPdfReport(input, result, {crossSection, forecast, shortCircuit});
      downloadBlob(blob, reportFileName(input));
      notify('success', 'PDF report downloaded');
      setReviewOpen(false);
    } catch (error) {
      notify('error', `PDF export failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      setExporting(false);
    }
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
    notify('success', 'Project JSON downloaded');
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(
        [
          `Busbar status: ${statusLabel(result.status)}`,
          `Selected: ${result.selectedProfile.materialLabel} ${result.selectedProfile.width_mm} x ${result.selectedProfile.thickness_mm} mm, ${result.selectedProfile.barsPerPhase} bars/phase`,
          `J: ${formatNumber(result.electrical.currentDensity_A_per_mm2, 2)} A/mm²`,
          `Losses: ${formatNumber(result.electrical.losses_W_per_m, 1)} W/m`,
          `Temperature: ${formatNumber(result.thermal.steadyStateTemp_C, 1)} °C`,
          `Envelope: ${formatNumber(result.envelope.width_mm, 1)} x ${formatNumber(result.envelope.height_mm, 1)} mm`,
        ].join('\n'),
      );
      notify('success', 'Summary copied to clipboard');
    } catch {
      notify('error', 'Clipboard not available');
    }
  };

  const copyCadPayload = async () => {
    try {
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
      notify('success', 'CAD payload copied to clipboard');
    } catch {
      notify('error', 'Clipboard not available');
    }
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {input?: BusbarInput; fileType?: string};
      if (!parsed.input) {
        throw new Error('Missing "input" field — not a busbar project file');
      }
      if (parsed.fileType && parsed.fileType !== 'cadautoscript.busbar-project') {
        throw new Error(`Unexpected fileType "${parsed.fileType}"`);
      }
      onImport(parsed.input);
      notify('success', `Imported ${file.name}`);
    } catch (error) {
      notify('error', `Import failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      event.target.value = '';
    }
  };

  const errorCount = result.warnings.filter((warning) => warning.severity === 'error').length;
  const warningCount = result.warnings.filter((warning) => warning.severity === 'warning').length;
  const checks = [
    {label: 'Project tag', ok: Boolean(input.project.tag), hint: input.project.tag || 'not set'},
    {label: 'Engineer', ok: Boolean(input.project.engineer), hint: input.project.engineer || 'not set'},
    {label: 'Date', ok: Boolean(input.project.date), hint: input.project.date || 'not set'},
    {label: 'Calculation status', ok: result.status === 'pass' || result.status === 'warn', hint: statusLabel(result.status)},
    {label: 'Errors', ok: errorCount === 0, hint: `${errorCount} error${errorCount === 1 ? '' : 's'}`},
    {label: 'Warnings', ok: true, hint: `${warningCount} warning${warningCount === 1 ? '' : 's'}`},
  ];

  return (
    <div className="export-toolbar">
      <button type="button" onClick={() => setReviewOpen(true)}>
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
      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept="application/json"
        aria-label="Import busbar project JSON file"
        tabIndex={-1}
        onChange={importJson}
      />

      <Modal
        open={reviewOpen}
        onClose={() => (exporting ? undefined : setReviewOpen(false))}
        title="Review before PDF export"
        footer={
          <>
            <button type="button" onClick={() => setReviewOpen(false)} disabled={exporting}>
              Cancel
            </button>
            <button type="button" className="primary" onClick={runPdfExport} disabled={exporting}>
              <FileDown size={16} />
              {exporting ? 'Generating…' : 'Export PDF'}
            </button>
          </>
        }
      >
        <dl className="review-meta">
          <div>
            <dt>Report title</dt>
            <dd>{input.project.projectName || 'Untitled project'} · {input.project.panelName || 'panel'}</dd>
          </div>
          <div>
            <dt>Tag · revision</dt>
            <dd>{input.project.tag || '—'} / {input.project.revision || '—'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd><StatusBadge status={result.status} /></dd>
          </div>
        </dl>
        <ul className="review-checks" aria-label="Pre-export checks">
          {checks.map((check) => (
            <li key={check.label} className={check.ok ? 'review-check review-check--ok' : 'review-check review-check--miss'}>
              {check.ok ? <CheckCircle2 size={15} aria-hidden="true" /> : <CircleAlert size={15} aria-hidden="true" />}
              <span>{check.label}</span>
              <strong>{check.hint}</strong>
            </li>
          ))}
        </ul>
        <fieldset className="review-options">
          <legend>Include in report</legend>
          <label className="review-option">
            <input
              type="checkbox"
              checked={includeCrossSection}
              onChange={(event) => setIncludeCrossSection(event.target.checked)}
            />
            <span>
              <strong>Busbar cross-section</strong>
              <em>Layout diagram with phase arrangement, gaps and envelope</em>
            </span>
          </label>
          <label className="review-option">
            <input
              type="checkbox"
              checked={includeForecast}
              onChange={(event) => setIncludeForecast(event.target.checked)}
            />
            <span>
              <strong>Temperature forecast chart</strong>
              <em>Time curve from ambient to steady-state with material limit</em>
            </span>
          </label>
          <label className="review-option">
            <input
              type="checkbox"
              checked={includeShortCircuit}
              onChange={(event) => setIncludeShortCircuit(event.target.checked)}
            />
            <span>
              <strong>Short-circuit force diagram</strong>
              <em>Phase forces, insulator supports and spacing L</em>
            </span>
          </label>
        </fieldset>
        {errorCount > 0 ? (
          <p className="review-warning">
            This calculation has {errorCount} error{errorCount === 1 ? '' : 's'}. The report will be marked accordingly — use only after review.
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
