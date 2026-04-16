'use client';

import { useState, useEffect } from 'react';
import type { BuilderNodeData } from './hookSchema';

interface NodeConfigModalProps {
  nodeLabel: string;
  initialData: BuilderNodeData;
  onSave: (data: Partial<BuilderNodeData>) => void;
  onClose: () => void;
}

export default function NodeConfigModal({
  nodeLabel,
  initialData,
  onSave,
  onClose,
}: NodeConfigModalProps) {
  const [form, setForm] = useState({
    requestName: initialData.requestName ?? '',
    needCascading: initialData.needCascading !== false,
    hookCallCascading:
      initialData.hookCallCascading === true
        ? 'true'
        : initialData.hookCallCascading === false
        ? 'false'
        : ('' as '' | 'true' | 'false'),
    staticParams:
      initialData.staticParams && Object.keys(initialData.staticParams).length > 0
        ? JSON.stringify(initialData.staticParams, null, 2)
        : '',
    moduleName: initialData.moduleName ?? '',
    condition:
      typeof initialData.condition === 'string'
        ? initialData.condition
        : typeof initialData.condition?.expression === 'string'
        ? initialData.condition.expression
        : '',
    path: initialData.path ?? '',
    isEndpoint: initialData.isEndpoint ?? false,
    callFunction: initialData.callFunction !== false,
  });

  const [staticParamsError, setStaticParamsError] = useState('');
  const [tab, setTab] = useState<'hook' | 'action'>('hook');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = () => {
    if (form.staticParams.trim()) {
      try {
        JSON.parse(form.staticParams);
      } catch {
        setStaticParamsError('Invalid JSON format.');
        return;
      }
    }
    const staticParamsParsed = form.staticParams.trim()
      ? (JSON.parse(form.staticParams) as Record<string, unknown>)
      : undefined;

    onSave({
      requestName: form.requestName || undefined,
      needCascading: form.needCascading,
      hookCallCascading:
        form.hookCallCascading === '' ? undefined : form.hookCallCascading === 'true',
      staticParams: staticParamsParsed,
      moduleName: form.moduleName || undefined,
      condition: form.condition || undefined,
      path: form.path || undefined,
      isEndpoint: form.isEndpoint,
      callFunction: form.callFunction,
    });
    onClose();
  };

  /* ── Stacked Field Layout (Clean vertical rhythm) ───────────────────────── */
  function Field({
    label,
    hint,
    error,
    children,
  }: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="flex flex-col gap-2">
        <div>
          <label className="text-[14px] font-semibold text-slate-600">{label}</label>
          {hint && <p className="mt-0.5 text-[12px] text-slate-400 leading-snug">{hint}</p>}
        </div>
        <div className="w-full">
          {children}
          {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  /* ── Pill Buttons Group ───────────────────────────── */
  function PillGroup({
    options,
    value,
    onChange,
  }: {
    options: { v: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="flex gap-3">
        {options.map(({ v, label }) => {
          const isActive = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`min-w-[100px] rounded-lg border px-5 py-2.5 text-[13px] font-bold transition-all ${
                isActive
                  ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  /* ── Toggle Switch ─────────────────── */
  function Toggle({
    checked,
    onChange,
    label,
    hint,
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
    hint: string;
  }) {
    return (
      <div
        className="flex cursor-pointer items-start gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100"
        onClick={onChange}
      >
        <div
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-all duration-200 border ${
            checked ? 'border-transparent bg-blue-600' : 'border-slate-200 bg-slate-100'
          }`}
        >
          <div
            className={`absolute top-[1px] h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-transform duration-200 ${
              checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
            }`}
          />
        </div>
        <div>
          <span className="block text-sm font-bold text-slate-800">{label}</span>
          <span className="block mt-0.5 text-[12px] text-slate-500">{hint}</span>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 p-6 backdrop-blur-[2px] transition-opacity"
      onClick={onClose}
    >
      <div
        className="flex w-[580px] max-w-full flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl shadow-slate-300/60 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[20px] leading-tight font-bold text-slate-900">{nodeLabel}</h2>
              <p className="mt-1 text-[13px] text-slate-400">
                Configure how this node gets data from third-party services.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────── */}
        <div className="px-6 mt-1">
          <div className="flex gap-6 border-b border-slate-100">
            {(['hook', 'action'] as const).map((t) => {
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative pb-3 text-[14px] font-semibold transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {t === 'hook' ? 'Entry Configuration' : 'Action Settings'}
                  {isActive && (
                    <span className="absolute bottom-[-1px] left-0 h-[2px] w-full bg-blue-600 rounded-t-lg" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto px-6 py-6">
          {tab === 'hook' && (
            <>
              <Field label="Request Name" hint="The URL path that triggers this hook.">
                <input
                  className={inputCls}
                  value={form.requestName}
                  onChange={(e) => setForm((f) => ({ ...f, requestName: e.target.value }))}
                  placeholder="/Quote/Summary"
                />
              </Field>

              <Field label="Need Cascading" hint="Should this node inherit values from parent?">
                <PillGroup
                  options={[
                    { v: 'true', label: 'True' },
                    { v: 'false', label: 'False' },
                  ]}
                  value={form.needCascading ? 'true' : 'false'}
                  onChange={(v) => setForm((f) => ({ ...f, needCascading: v === 'true' }))}
                />
              </Field>

              <Field label="Hook Call Cascading" hint="Determine how this hook inherits cascading behavior.">
                <PillGroup
                  options={[
                    { v: '', label: 'Inherit' },
                    { v: 'true', label: 'True' },
                    { v: 'false', label: 'False' },
                  ]}
                  value={form.hookCallCascading}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, hookCallCascading: v as '' | 'true' | 'false' }))
                  }
                />
              </Field>

              <Field label="Static Params" hint="JSON object with static key-value pairs." error={staticParamsError}>
                <textarea
                  rows={5}
                  className={`w-full resize-none rounded-lg border font-mono text-[13px] leading-relaxed outline-none transition-all px-4 py-3 ${
                    staticParamsError
                      ? 'border-red-300 bg-red-50/20 focus:border-red-400 focus:ring-4 focus:ring-red-500/10 text-red-900'
                      : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800'
                  }`}
                  value={form.staticParams}
                  onChange={(e) => {
                    setStaticParamsError('');
                    setForm((f) => ({ ...f, staticParams: e.target.value }));
                  }}
                  placeholder={'{\n  "key": "value"\n}'}
                />
              </Field>
            </>
          )}

          {tab === 'action' && (
            <>
              <Field label="Module Name" hint="npm package name or local module path">
                <input
                  className={inputCls}
                  value={form.moduleName}
                  onChange={(e) => setForm((f) => ({ ...f, moduleName: e.target.value }))}
                  placeholder="@cogitate/core-pos-components"
                />
              </Field>

              <Field label="Condition" hint="Leave blank to always run">
                <input
                  className={inputCls}
                  value={form.condition}
                  onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                  placeholder='e.g., Type = "Quote"'
                />
              </Field>

              <Field label="Path" hint="Path to configs or module inside the package">
                <input
                  className={`${inputCls} font-mono`}
                  value={form.path}
                  onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
                  placeholder="COGITATE/configs/..."
                />
              </Field>

              <Field label="Flags" hint="Configure additional execution behavior">
                <div className="flex flex-col gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4 shadow-sm">
                  <Toggle
                    checked={form.isEndpoint}
                    onChange={() => setForm((f) => ({ ...f, isEndpoint: !f.isEndpoint }))}
                    label="Is Endpoint"
                    hint="Treat this module as an endpoint"
                  />
                  <Toggle
                    checked={form.callFunction}
                    onChange={() => setForm((f) => ({ ...f, callFunction: !f.callFunction }))}
                    label="Call Function"
                    hint="Execute the module as a function"
                  />
                </div>
              </Field>
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-end gap-3 bg-slate-50/50 px-6 py-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-slate-50 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Save configuration
          </button>
        </div>
      </div>
    </div>
  );
}
