import { useState } from 'react';
import { useCompanyContextStore } from '../stores/companyContextStore';
import type {
  Competitor,
  Persona,
  RegulatoryFramework,
  CategoryBenchmark,
  SeasonalTrend,
} from '../utils/companyContextStorage';
import ChipInput from './ChipInput';
import AutosaveIndicator from './AutosaveIndicator';

type SectionKey =
  | 'overview'
  | 'competitors'
  | 'personas'
  | 'regulatoryFrameworks'
  | 'categoryBenchmarks'
  | 'seasonalTrends';

const SECTION_CONFIG: Array<{ key: SectionKey; title: string; helper: string }> = [
  { key: 'overview', title: 'Company Overview', helper: 'Company name, description, products, and industry' },
  { key: 'competitors', title: 'Competitors', helper: 'Key competitors, their value propositions and differentiators' },
  { key: 'personas', title: 'Personas', helper: 'Target personas with demographics, goals, and messaging angles' },
  { key: 'regulatoryFrameworks', title: 'Regulatory Frameworks', helper: 'Compliance frameworks and copy implications' },
  { key: 'categoryBenchmarks', title: 'Category Benchmarks', helper: 'Industry metrics and performance benchmarks' },
  { key: 'seasonalTrends', title: 'Seasonal Trends', helper: 'Key events, timing, and relevance to campaigns' },
];

interface CompanyContextEditorProps {
  onDelete?: () => void;
}

export default function CompanyContextEditor({ onDelete }: CompanyContextEditorProps) {
  const {
    context,
    isDirty,
    lastSavedAt,
    isGenerating,
    updateField,
    addArrayItem,
    removeArrayItem,
    saveContext,
    deleteContext,
  } = useCompanyContextStore();

  const [collapsedSections, setCollapsedSections] = useState<Set<SectionKey>>(
    new Set(['competitors', 'personas', 'regulatoryFrameworks', 'categoryBenchmarks', 'seasonalTrends'])
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  if (!context) return null;

  if (isGenerating) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">Company Context</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-500 rounded-full">generating</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {SECTION_CONFIG.map(({ key, title }) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm font-medium text-gray-900 mb-3">{title}</div>
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 animate-pulse">AI is building your company context...</p>
        </div>
      </div>
    );
  }

  const toggleCollapse = (key: SectionKey) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startNameEdit = () => {
    setNameValue(context.companyDescription.name);
    setEditingName(true);
  };

  const commitNameEdit = () => {
    setEditingName(false);
    if (nameValue.trim() && nameValue.trim() !== context.companyDescription.name) {
      updateField('companyDescription', 'name', nameValue.trim());
    }
  };

  const renderSourceDot = (source: 'user-provided' | 'ai-inferred') =>
    source === 'user-provided' ? (
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="User provided" />
    ) : (
      <span className="w-1.5 h-1.5 rounded-full bg-amber-300" title="AI inferred" />
    );

  const renderFieldLabel = (label: string, source?: 'user-provided' | 'ai-inferred') => (
    <div className="flex items-center gap-1.5 mb-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {source && renderSourceDot(source)}
    </div>
  );

  // ── Array item updaters ────────────────────────────────────────────

  const updateArrayItem = (sectionKey: string, index: number, field: string, value: unknown) => {
    const arr = (context as any)[sectionKey] as any[];
    if (!arr) return;
    const updated = [...arr];
    updated[index] = { ...updated[index], [field]: value };
    // Use replaceContext pattern through updateField hack — we write the whole array
    const ctx = { ...context } as any;
    ctx[sectionKey] = updated;
    ctx.lastUpdated = new Date().toISOString();
    useCompanyContextStore.setState({ context: ctx, isDirty: true });
    // schedule autosave through a field update that's a no-op structurally
    // Instead, just save via the store's saveContext with a timer
    if ((window as any).__ccAutosaveTimer) clearTimeout((window as any).__ccAutosaveTimer);
    (window as any).__ccAutosaveTimer = setTimeout(() => {
      useCompanyContextStore.getState().saveContext();
    }, 1500);
  };

  // ── Section renderers ──────────────────────────────────────────────

  const renderOverview = () => {
    const cd = context.companyDescription;
    const ind = context.industry;
    return (
      <div className="space-y-3">
        <div>
          {renderFieldLabel('Company Name', cd.source)}
          <input
            type="text"
            value={cd.name}
            onChange={(e) => updateField('companyDescription', 'name', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
        </div>
        <div>
          {renderFieldLabel('Description', cd.source)}
          <textarea
            value={cd.description}
            onChange={(e) => updateField('companyDescription', 'description', e.target.value)}
            rows={3}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
          />
        </div>
        <div>
          {renderFieldLabel('Products', cd.source)}
          <ChipInput
            value={cd.products}
            onChange={(vals) => updateField('companyDescription', 'products', vals)}
            placeholder="Add product..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            {renderFieldLabel('Primary Industry', ind.source)}
            <input
              type="text"
              value={ind.primary}
              onChange={(e) => updateField('industry', 'primary', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
          </div>
          <div>
            {renderFieldLabel('Sub-Industry', ind.source)}
            <input
              type="text"
              value={ind.subIndustry}
              onChange={(e) => updateField('industry', 'subIndustry', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCompetitors = () => (
    <div className="space-y-3">
      {context.competitors.map((comp: Competitor, idx: number) => (
        <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2 relative">
          <button
            onClick={() => removeArrayItem('competitors', idx)}
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove competitor"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-gray-400 uppercase">Competitor {idx + 1}</span>
            {renderSourceDot(comp.source)}
          </div>
          <div>
            {renderFieldLabel('Name')}
            <input
              type="text"
              value={comp.name}
              onChange={(e) => updateArrayItem('competitors', idx, 'name', e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
          </div>
          <div>
            {renderFieldLabel('Description')}
            <textarea
              value={comp.description}
              onChange={(e) => updateArrayItem('competitors', idx, 'description', e.target.value)}
              placeholder="What does this competitor do?"
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
            />
          </div>
          <div>
            {renderFieldLabel('Value Propositions')}
            <ChipInput
              value={comp.valueProps}
              onChange={(vals) => updateArrayItem('competitors', idx, 'valueProps', vals)}
              placeholder="Add value proposition..."
            />
          </div>
          <div>
            {renderFieldLabel('Differentiators')}
            <ChipInput
              value={comp.differentiators}
              onChange={(vals) => updateArrayItem('competitors', idx, 'differentiators', vals)}
              placeholder="Add differentiator..."
            />
          </div>
        </div>
      ))}
      <button
        onClick={() =>
          addArrayItem('competitors', {
            name: '',
            description: '',
            valueProps: [],
            differentiators: [],
            source: 'user-provided' as const,
          })
        }
        className="text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        + Add Competitor
      </button>
    </div>
  );

  const renderPersonas = () => (
    <div className="space-y-3">
      {context.personas.map((persona: Persona, idx: number) => (
        <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2 relative">
          <button
            onClick={() => removeArrayItem('personas', idx)}
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove persona"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-gray-400 uppercase">Persona {idx + 1}</span>
            {renderSourceDot(persona.source)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              {renderFieldLabel('Name')}
              <input
                type="text"
                value={persona.name}
                onChange={(e) => updateArrayItem('personas', idx, 'name', e.target.value)}
                placeholder="e.g. Marketing Manager"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              />
            </div>
            <div>
              {renderFieldLabel('Role')}
              <input
                type="text"
                value={persona.role}
                onChange={(e) => updateArrayItem('personas', idx, 'role', e.target.value)}
                placeholder="e.g. Decision Maker"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              />
            </div>
          </div>
          <div>
            {renderFieldLabel('Demographics')}
            <input
              type="text"
              value={persona.demographics}
              onChange={(e) => updateArrayItem('personas', idx, 'demographics', e.target.value)}
              placeholder="e.g. 30-45, enterprise B2B"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
          </div>
          <div>
            {renderFieldLabel('Goals')}
            <ChipInput
              value={persona.goals}
              onChange={(vals) => updateArrayItem('personas', idx, 'goals', vals)}
              placeholder="Add goal..."
            />
          </div>
          <div>
            {renderFieldLabel('Pain Points')}
            <ChipInput
              value={persona.painPoints}
              onChange={(vals) => updateArrayItem('personas', idx, 'painPoints', vals)}
              placeholder="Add pain point..."
            />
          </div>
          <div>
            {renderFieldLabel('Preferred Channels')}
            <ChipInput
              value={persona.preferredChannels}
              onChange={(vals) => updateArrayItem('personas', idx, 'preferredChannels', vals)}
              placeholder="Add channel..."
            />
          </div>
          <div>
            {renderFieldLabel('Messaging Angle')}
            <textarea
              value={persona.messagingAngle}
              onChange={(e) => updateArrayItem('personas', idx, 'messagingAngle', e.target.value)}
              placeholder="How to position messaging for this persona"
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
            />
          </div>
        </div>
      ))}
      <button
        onClick={() =>
          addArrayItem('personas', {
            name: '',
            role: '',
            demographics: '',
            goals: [],
            painPoints: [],
            preferredChannels: [],
            messagingAngle: '',
            source: 'user-provided' as const,
          })
        }
        className="text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        + Add Persona
      </button>
    </div>
  );

  const renderRegulatoryFrameworks = () => (
    <div className="space-y-3">
      {context.regulatoryFrameworks.map((fw: RegulatoryFramework, idx: number) => (
        <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2 relative">
          <button
            onClick={() => removeArrayItem('regulatoryFrameworks', idx)}
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove framework"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-gray-400 uppercase">Framework {idx + 1}</span>
            {renderSourceDot(fw.source)}
          </div>
          <div>
            {renderFieldLabel('Framework Name')}
            <input
              type="text"
              value={fw.name}
              onChange={(e) => updateArrayItem('regulatoryFrameworks', idx, 'name', e.target.value)}
              placeholder="e.g. GDPR, CCPA, HIPAA"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
          </div>
          <div>
            {renderFieldLabel('Description')}
            <textarea
              value={fw.description}
              onChange={(e) => updateArrayItem('regulatoryFrameworks', idx, 'description', e.target.value)}
              placeholder="Describe the framework and its requirements"
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
            />
          </div>
          <div>
            {renderFieldLabel('Copy Implications')}
            <ChipInput
              value={fw.copyImplications}
              onChange={(vals) => updateArrayItem('regulatoryFrameworks', idx, 'copyImplications', vals)}
              placeholder="Add copy implication..."
            />
          </div>
        </div>
      ))}
      <button
        onClick={() =>
          addArrayItem('regulatoryFrameworks', {
            name: '',
            description: '',
            copyImplications: [],
            source: 'user-provided' as const,
          })
        }
        className="text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        + Add Framework
      </button>
    </div>
  );

  const renderCategoryBenchmarks = () => (
    <div className="space-y-2">
      {/* Column headers */}
      {context.categoryBenchmarks.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5" />
          <span className="flex-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Metric</span>
          <span className="w-28 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Industry Avg</span>
          <span className="w-28 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Top Quartile</span>
          <div className="w-5" />
        </div>
      )}
      {context.categoryBenchmarks.map((bm: CategoryBenchmark, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          {renderSourceDot(bm.source)}
          <input
            type="text"
            value={bm.metric}
            onChange={(e) => updateArrayItem('categoryBenchmarks', idx, 'metric', e.target.value)}
            placeholder="e.g. Email open rate"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <input
            type="text"
            value={bm.industryAverage}
            onChange={(e) => updateArrayItem('categoryBenchmarks', idx, 'industryAverage', e.target.value)}
            placeholder="e.g. 22%"
            className="w-28 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <input
            type="text"
            value={bm.topQuartile}
            onChange={(e) => updateArrayItem('categoryBenchmarks', idx, 'topQuartile', e.target.value)}
            placeholder="e.g. 35%"
            className="w-28 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <button
            onClick={() => removeArrayItem('categoryBenchmarks', idx)}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            title="Remove benchmark"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={() =>
          addArrayItem('categoryBenchmarks', {
            metric: '',
            industryAverage: '',
            topQuartile: '',
            source: 'user-provided' as const,
          })
        }
        className="text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        + Add Benchmark
      </button>
    </div>
  );

  const renderSeasonalTrends = () => (
    <div className="space-y-2">
      {/* Column headers */}
      {context.seasonalTrends.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5" />
          <span className="flex-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Event</span>
          <span className="w-28 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Timing</span>
          <span className="w-36 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Relevance</span>
          <div className="w-5" />
        </div>
      )}
      {context.seasonalTrends.map((tr: SeasonalTrend, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          {renderSourceDot(tr.source)}
          <input
            type="text"
            value={tr.event}
            onChange={(e) => updateArrayItem('seasonalTrends', idx, 'event', e.target.value)}
            placeholder="e.g. Black Friday"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <input
            type="text"
            value={tr.timing}
            onChange={(e) => updateArrayItem('seasonalTrends', idx, 'timing', e.target.value)}
            placeholder="e.g. Nov"
            className="w-28 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <input
            type="text"
            value={tr.relevance}
            onChange={(e) => updateArrayItem('seasonalTrends', idx, 'relevance', e.target.value)}
            placeholder="e.g. High — peak sales"
            className="w-36 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <button
            onClick={() => removeArrayItem('seasonalTrends', idx)}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            title="Remove trend"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={() =>
          addArrayItem('seasonalTrends', {
            event: '',
            timing: '',
            relevance: '',
            source: 'user-provided' as const,
          })
        }
        className="text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        + Add Trend
      </button>
    </div>
  );

  const renderSectionContent = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'overview':
        return renderOverview();
      case 'competitors':
        return renderCompetitors();
      case 'personas':
        return renderPersonas();
      case 'regulatoryFrameworks':
        return renderRegulatoryFrameworks();
      case 'categoryBenchmarks':
        return renderCategoryBenchmarks();
      case 'seasonalTrends':
        return renderSeasonalTrends();
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitNameEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitNameEdit();
                if (e.key === 'Escape') setEditingName(false);
              }}
              className="text-sm font-semibold text-gray-900 border-b border-blue-400 outline-none bg-transparent"
            />
          ) : (
            <button
              onClick={startNameEdit}
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate"
              title="Click to rename"
            >
              {context.companyDescription.name || 'Company Context'}
            </button>
          )}
        </div>
        <AutosaveIndicator isDirty={isDirty} lastSavedAt={lastSavedAt} />
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {SECTION_CONFIG.map(({ key, title, helper }) => {
          const isCollapsed = collapsedSections.has(key);

          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Section header */}
              <div className="flex items-center justify-between px-5 py-3">
                <button
                  onClick={() => toggleCollapse(key)}
                  className="flex items-center gap-2 text-left min-w-0"
                >
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{title}</div>
                    <div className="text-xs text-gray-400">{helper}</div>
                  </div>
                </button>
              </div>

              {/* Section body */}
              {!isCollapsed && (
                <div className="px-5 pb-4">
                  {renderSectionContent(key)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
        {showDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Delete this company context?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (context?.id) deleteContext(context.id);
                  onDelete?.();
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete context"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => saveContext()}
              disabled={!isDirty}
              className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isDirty ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save to Assets
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved to Assets
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
