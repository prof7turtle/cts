'use client';

import React from 'react';
import { groupHooksByRequestName, type HookMetadata, type HookConfig } from './hookSchema';

interface WorkflowsDashboardProps {
  config: HookConfig;
}

export default function WorkflowsDashboard({ config }: WorkflowsDashboardProps) {
  const groups = groupHooksByRequestName(config);
  const requestNames = Object.keys(groups);

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 overflow-hidden">
      {/* Dashboard Toolbar Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Workflows Dashboard</h2>
          <p className="text-[13px] text-slate-500 font-medium">Comparison view of workflows grouped by Request Name</p>
        </div>
        <div className="flex items-center gap-3">
           <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 border border-blue-100/50">
             {requestNames.length} Requests
           </span>
        </div>
      </div>

      {/* Main Horizontal Scroll Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-50/50 px-8 py-10">
        <div className="flex h-full items-stretch gap-10 min-w-min">
          {requestNames.length === 0 ? (
            <div className="flex w-full items-center justify-center">
               <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-300 mb-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                       <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                       <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                       <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-600">No workflows found</h3>
                  <p className="text-xs text-slate-400 mt-1">Start building in the canvas to see them here.</p>
               </div>
            </div>
          ) : (
            requestNames.map((name) => (
              <WorkflowColumn key={name} name={name} hooks={groups[name]} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function WorkflowColumn({ name, hooks }: { name: string; hooks: HookMetadata[] }) {
  return (
    <div className="flex w-80 shrink-0 flex-col group">
      {/* Column Sticky Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow group-hover:shadow-md">
        <h3 className="truncate text-[14px] font-black uppercase tracking-widest text-slate-800" title={name}>
          {name.split('/').filter(Boolean).pop() || name}
        </h3>
        <p className="mt-1 truncate text-[11px] font-bold text-slate-400" title={name}>{name}</p>
      </div>

      {/* Vertical Flow Container */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto overflow-x-hidden custom-scrollbar pb-6">
        
        {/* Start Node */}
        <NodeCard 
          type="start" 
          label="Start" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>} 
        />
        
        <Connector />

        {/* Action Nodes */}
        {hooks.map((hook, idx) => (
          <React.Fragment key={hook.FunctionName + idx}>
            <NodeCard 
              type="hook" 
              label={hook.FunctionName} 
              subtitle={hook.ModuleName}
              condition={typeof hook.Condition === 'string' ? hook.Condition : undefined}
            />
            <Connector />
          </React.Fragment>
        ))}

        {/* End Node */}
        <NodeCard 
          type="end" 
          label="End" 
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>} 
        />
      </div>
    </div>
  );
}

function NodeCard({ 
  type, 
  label, 
  subtitle, 
  icon,
  condition 
}: { 
  type: 'start' | 'end' | 'hook'; 
  label: string; 
  subtitle?: string; 
  icon?: React.ReactNode;
  condition?: string;
}) {
  return (
    <div className={`relative w-full rounded-2xl border bg-white p-4 transition-all duration-300 ${
      type === 'start' ? 'border-emerald-100 bg-emerald-50/30' : 
      type === 'end' ? 'border-indigo-100 bg-indigo-50/30' : 
      'border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
          type === 'start' ? 'border-emerald-200 bg-white text-emerald-600' :
          type === 'end' ? 'border-indigo-200 bg-white text-indigo-600' :
          'border-blue-100 bg-blue-50 text-blue-600'
        }`}>
          {icon || <span className="text-[10px] font-black">H</span>}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[13px] font-bold text-slate-800">{label}</h4>
          {subtitle && <p className="truncate text-[10px] font-semibold text-slate-400">{subtitle}</p>}
        </div>
      </div>
      
      {condition && (
        <div className="mt-3 rounded-lg bg-amber-50/50 border border-amber-100/50 px-2.5 py-1.5">
          <p className="text-[10px] font-bold text-amber-700 leading-tight uppercase tracking-tighter opacity-70 mb-0.5">Condition</p>
          <p className="text-[11px] font-medium text-amber-900 truncate" title={condition}>{condition}</p>
        </div>
      )}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex h-10 w-full flex-col items-center justify-center py-2">
      <div className="h-full w-[2px] bg-slate-200/60" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-slate-300 -mt-1">
        <path d="m7 13 5 5 5-5"></path>
      </svg>
    </div>
  );
}
