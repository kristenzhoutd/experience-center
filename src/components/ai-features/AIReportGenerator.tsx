import { useState, useMemo, useCallback } from 'react';
import {
  FileText, Download, X, Check, ChevronRight, Sparkles,
  FileSpreadsheet, Presentation, Mail, BarChart3, TrendingUp,
  Target, Users, DollarSign, Settings, GripVertical, Eye, CheckCircle,
} from 'lucide-react';

type ReportFormat = 'pdf' | 'ppt' | 'email';
type ReportTemplate = 'executive' | 'detailed' | 'performance' | 'custom';

interface ReportSection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  included: boolean;
  order: number;
}

interface ReportConfig {
  template: ReportTemplate;
  format: ReportFormat;
  dateRange: string;
  sections: ReportSection[];
  includeAIInsights: boolean;
  includeRecommendations: boolean;
  brandLogo: boolean;
}

interface AIReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  campaignIds?: string[];
  onGenerate?: (config: ReportConfig) => void;
}

const TEMPLATES: { id: ReportTemplate; name: string; description: string; sections: string[] }[] = [
  { id: 'executive', name: 'Executive Summary', description: 'High-level overview for leadership with key metrics and insights', sections: ['overview', 'kpis', 'insights', 'recommendations'] },
  { id: 'detailed', name: 'Detailed Analysis', description: 'Comprehensive report with granular data and deep-dive analytics', sections: ['overview', 'kpis', 'channel', 'audience', 'creative', 'trends', 'insights', 'recommendations'] },
  { id: 'performance', name: 'Performance Report', description: 'Focus on campaign performance metrics and ROI analysis', sections: ['overview', 'kpis', 'channel', 'trends', 'roi'] },
  { id: 'custom', name: 'Custom Report', description: 'Build your own report by selecting specific sections', sections: [] },
];

const DEFAULT_SECTIONS: ReportSection[] = [
  { id: 'overview', name: 'Campaign Overview', description: 'High-level summary of all campaigns', icon: <FileText size={14} />, included: true, order: 0 },
  { id: 'kpis', name: 'Key Performance Indicators', description: 'Core metrics including ROAS, CPA, CTR', icon: <Target size={14} />, included: true, order: 1 },
  { id: 'channel', name: 'Channel Breakdown', description: 'Performance by advertising channel', icon: <BarChart3 size={14} />, included: true, order: 2 },
  { id: 'audience', name: 'Audience Analysis', description: 'Demographics and segment performance', icon: <Users size={14} />, included: false, order: 3 },
  { id: 'creative', name: 'Creative Performance', description: 'Ad creative effectiveness analysis', icon: <Presentation size={14} />, included: false, order: 4 },
  { id: 'trends', name: 'Trend Analysis', description: 'Performance trends over time', icon: <TrendingUp size={14} />, included: true, order: 5 },
  { id: 'roi', name: 'ROI Analysis', description: 'Return on investment breakdown', icon: <DollarSign size={14} />, included: false, order: 6 },
  { id: 'insights', name: 'AI Insights', description: 'AI-generated performance insights', icon: <Sparkles size={14} />, included: true, order: 7 },
  { id: 'recommendations', name: 'Recommendations', description: 'AI-powered optimization suggestions', icon: <Settings size={14} />, included: true, order: 8 },
];

const DATE_RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This Month', 'Last Month', 'Custom'];

export default function AIReportGenerator({ isOpen, onClose, onGenerate }: AIReportGeneratorProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ReportConfig>({
    template: 'executive', format: 'pdf', dateRange: 'Last 30 days',
    sections: DEFAULT_SECTIONS, includeAIInsights: true, includeRecommendations: true, brandLogo: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleTemplateSelect = useCallback((template: ReportTemplate) => {
    const templateConfig = TEMPLATES.find(t => t.id === template);
    const updatedSections = DEFAULT_SECTIONS.map(section => ({
      ...section, included: template === 'custom' ? section.included : templateConfig?.sections.includes(section.id) || false,
    }));
    setConfig(prev => ({ ...prev, template, sections: updatedSections }));
  }, []);

  const handleSectionToggle = useCallback((sectionId: string) => {
    setConfig(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, included: !s.included } : s) }));
  }, []);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true); setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setTimeout(() => { setIsGenerating(false); setIsComplete(true); }, 500); return 100; }
        return prev + Math.random() * 15;
      });
    }, 500);
  }, []);

  const handleDownload = useCallback(() => { onGenerate?.(config); onClose(); }, [config, onGenerate, onClose]);
  const includedSectionsCount = useMemo(() => config.sections.filter(s => s.included).length, [config.sections]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm flex items-center justify-center">
      <div className="w-[900px] max-w-[95vw] max-h-[90vh] bg-gradient-to-b from-[#131023] to-[#1A1830] border border-white/10 rounded-[20px] overflow-hidden flex flex-col animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-pink-400 rounded-xl flex items-center justify-center">
              <FileText size={22} color="white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Report Generator</h2>
              <p className="text-sm text-white/50">Create professional reports powered by AI</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {!isGenerating && !isComplete && (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className={`flex items-center gap-2 ${step >= 1 ? (step > 1 ? 'text-emerald-500' : 'text-white') : 'text-white/50'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${step > 1 ? 'bg-emerald-500 text-white' : step >= 1 ? 'bg-gradient-to-br from-pink-500 to-pink-400 text-white' : 'bg-white/10 text-white/50'}`}>
                    {step > 1 ? <Check size={14} /> : '1'}
                  </div>
                  <span className={`text-sm ${step >= 1 ? 'font-medium' : ''}`}>Template & Format</span>
                </div>
                <div className={`w-10 h-0.5 ${step > 1 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-white/50'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-gradient-to-br from-pink-500 to-pink-400 text-white' : 'bg-white/10'}`}>2</div>
                  <span className="text-sm">Customize Sections</span>
                </div>
                <div className="w-10 h-0.5 bg-white/10" />
                <div className="flex items-center gap-2 text-white/50">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">3</div>
                  <span className="text-sm">Generate</span>
                </div>
              </div>

              {step === 1 && (
                <div className="animate-[slideUp_0.3s_ease-out]">
                  <h3 className="text-base font-semibold text-white mb-4">Select Report Template</h3>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {TEMPLATES.map(template => (
                      <div key={template.id} onClick={() => handleTemplateSelect(template.id)}
                        className={`bg-black/30 border-2 rounded-[14px] p-5 cursor-pointer transition-all hover:bg-white/5 hover:-translate-y-0.5 ${config.template === template.id ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 hover:border-pink-500/30'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-500">
                            {template.id === 'executive' && <FileText size={18} />}
                            {template.id === 'detailed' && <FileSpreadsheet size={18} />}
                            {template.id === 'performance' && <BarChart3 size={18} />}
                            {template.id === 'custom' && <Settings size={18} />}
                          </div>
                          <h4 className="text-[15px] font-semibold text-white">{template.name}</h4>
                        </div>
                        <p className="text-sm text-white/50 leading-relaxed">{template.description}</p>
                        {template.id !== 'custom' && (
                          <div className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 bg-emerald-500/20 rounded-xl text-[11px] font-medium text-emerald-500">
                            <Check size={10} /> {template.sections.length} sections
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <h3 className="text-base font-semibold text-white mb-4">Export Format</h3>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[{ id: 'pdf' as const, icon: <FileText size={24} />, label: 'PDF Document', sub: 'Print-ready format' }, { id: 'ppt' as const, icon: <Presentation size={24} />, label: 'PowerPoint', sub: 'Presentation slides' }, { id: 'email' as const, icon: <Mail size={24} />, label: 'Email Report', sub: 'Send directly' }].map(format => (
                      <div key={format.id} onClick={() => setConfig(prev => ({ ...prev, format: format.id }))}
                        className={`bg-black/30 border-2 rounded-xl p-4 cursor-pointer text-center transition-all hover:bg-white/5 ${config.format === format.id ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 hover:border-pink-500/30'}`}>
                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3 text-pink-500">{format.icon}</div>
                        <h4 className="text-sm font-semibold text-white mb-1">{format.label}</h4>
                        <p className="text-xs text-white/50">{format.sub}</p>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-base font-semibold text-white mb-4">Date Range</h3>
                  <div className="flex gap-3 mb-6">
                    {DATE_RANGES.map(range => (
                      <div key={range} onClick={() => setConfig(prev => ({ ...prev, dateRange: range }))}
                        className={`px-4 py-2.5 rounded-lg border text-sm cursor-pointer transition-all ${config.dateRange === range ? 'bg-pink-500/10 border-pink-500 text-white' : 'bg-black/30 border-white/10 text-white/70 hover:bg-white/5 hover:border-pink-500/30'}`}>
                        {range}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-[slideUp_0.3s_ease-out]">
                  <h3 className="text-base font-semibold text-white mb-4">Customize Report Sections</h3>
                  <div className="flex flex-col gap-2 mb-6">
                    {config.sections.map(section => (
                      <div key={section.id} className="flex items-center gap-3 px-4 py-3.5 bg-black/30 border border-white/10 rounded-lg hover:bg-white/5 transition-all">
                        <GripVertical size={16} className="text-white/30 cursor-grab" />
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">{section.icon}</div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-white">{section.name}</h5>
                          <p className="text-xs text-white/50">{section.description}</p>
                        </div>
                        <div onClick={() => handleSectionToggle(section.id)}
                          className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-all ${section.included ? 'bg-pink-500' : 'bg-white/10'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${section.included ? 'translate-x-5' : ''}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-base font-semibold text-white mb-4">Additional Options</h3>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { key: 'includeAIInsights' as const, icon: <Sparkles size={18} color="#EC4899" />, label: 'AI Insights' },
                      { key: 'includeRecommendations' as const, icon: <Target size={18} color="#EC4899" />, label: 'Recommendations' },
                      { key: 'brandLogo' as const, icon: <CheckCircle size={18} color="#EC4899" />, label: 'Brand Logo' },
                    ].map(option => (
                      <div key={option.key} onClick={() => setConfig(prev => ({ ...prev, [option.key]: !prev[option.key] }))}
                        className="flex items-center gap-3 px-4 py-3.5 bg-black/30 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                        {option.icon}
                        <span className="flex-1 text-sm text-white">{option.label}</span>
                        <div className={`w-11 h-6 rounded-full p-0.5 transition-all ${config[option.key] ? 'bg-pink-500' : 'bg-white/10'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${config[option.key] ? 'translate-x-5' : ''}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-[14px] p-5">
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Eye size={16} /> Report Preview</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="bg-white rounded-lg p-3 aspect-[8.5/11] flex flex-col gap-2">
                          <div className="h-5 bg-gradient-to-r from-pink-500 to-pink-400 rounded" />
                          <div className={`flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded ${i === 1 ? 'order-2' : ''}`} />
                          <div className="h-2 bg-gray-300 rounded" />
                          <div className="h-2 bg-gray-300 rounded" style={{ width: `${60 + i * 15}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-5 border-t border-white/10 bg-black/20">
              <button onClick={() => step === 1 ? onClose() : setStep(1)}
                className="px-6 py-3 rounded-lg text-sm font-medium bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all flex items-center gap-2">
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              <button onClick={() => step === 1 ? setStep(2) : handleGenerate()}
                className="px-6 py-3 rounded-lg text-sm font-medium bg-gradient-to-br from-pink-500 to-pink-400 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/40 transition-all flex items-center gap-2">
                {step === 1 ? <>Continue <ChevronRight size={16} /></> : <><Sparkles size={16} /> Generate Report</>}
              </button>
            </div>
          </>
        )}

        {isGenerating && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 border-[3px] border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-6" />
              <h3 className="text-lg font-semibold text-white mb-2">Generating Your Report</h3>
              <p className="text-sm text-white/50 mb-6">Our AI is analyzing your campaign data and creating visualizations...</p>
              <div className="w-[300px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <div className="mt-4 text-sm text-white/60 animate-pulse">
                {progress < 30 && 'Collecting campaign data...'}
                {progress >= 30 && progress < 60 && 'Generating AI insights...'}
                {progress >= 60 && progress < 90 && 'Creating visualizations...'}
                {progress >= 90 && 'Finalizing report...'}
              </div>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Report Generated Successfully!</h3>
              <p className="text-sm text-white/50 mb-8 max-w-[400px]">
                Your {config.format.toUpperCase()} report is ready with {includedSectionsCount} sections covering {config.dateRange.toLowerCase()}.
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-3 rounded-lg text-sm font-medium bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all">Close</button>
                <button onClick={handleDownload} className="px-6 py-3 rounded-lg text-sm font-medium bg-gradient-to-br from-pink-500 to-pink-400 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/40 transition-all flex items-center gap-2">
                  <Download size={16} /> Download Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
