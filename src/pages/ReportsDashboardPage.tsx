/**
 * Reports Page — Report generation tool with prebuilt templates.
 * Split-pane layout: left panel shows live chat/thinking during generation,
 * right panel renders the generated report.
 * Reports are persisted to localStorage and appear under Recent Reports.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download, Share2, FileText, TrendingUp,
  Zap, BarChart3, ArrowLeft, Eye, Clock,
  Loader2, CheckCircle2, AlertTriangle, ArrowUp, ArrowDown, Minus,
  Lightbulb, ChevronLeft, Trash2,
} from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { useReportStore } from '../stores/reportStore';
import type { SavedReport } from '../stores/reportStore';
import type { ReportOutput } from '../services/skillParsers';
import SplitPaneLayout from '../components/campaign/SplitPaneLayout';
import StreamingChatView from '../components/StreamingChatView';

// --- Template definitions ---

const reportTemplates = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview of campaign performance across all channels with key metrics and strategic insights.',
    icon: BarChart3,
    sections: ['KPI Overview', 'Channel Breakdown', 'Top Campaigns', 'Budget Pacing', 'AI Recommendations'],
    estimatedPages: 4,
  },
  {
    id: 'campaign-performance',
    name: 'Campaign Performance',
    description: 'Detailed campaign-level metrics including performance trends, budget utilization, and conversion analysis.',
    icon: TrendingUp,
    sections: ['Performance Trend', 'Campaign Table', 'Budget Pacing', 'ROAS Analysis', 'Conversion Funnel'],
    estimatedPages: 6,
  },
  {
    id: 'creative-analysis',
    name: 'Creative Analysis',
    description: 'Creative format breakdown with fatigue tracking, top performers, and optimization recommendations.',
    icon: Zap,
    sections: ['Format Performance', 'Top Creatives', 'Fatigue Status', 'A/B Test Results', 'Refresh Recommendations'],
    estimatedPages: 5,
  },
  {
    id: 'full-report',
    name: 'Full Report',
    description: 'Comprehensive report combining all sections — executive summary, campaigns, audiences, and creative analysis.',
    icon: FileText,
    sections: ['Executive Summary', 'Channel Performance', 'Campaign Details', 'Audience Insights', 'Creative Analysis', 'Recommendations'],
    estimatedPages: 12,
  },
];

// --- Section renderers ---

function SummarySection({ content }: { content: Record<string, unknown> }) {
  const text = (content.text as string) || '';
  return (
    <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
      {text}
    </div>
  );
}

function MetricsSection({ content }: { content: Record<string, unknown> }) {
  const metrics = (content.metrics as Array<{
    label: string; value: string; change?: string;
    changeDirection?: string; status?: string;
  }>) || [];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {metrics.map((m, i) => {
        const statusColor = m.status === 'positive' ? 'text-green-600' : m.status === 'negative' ? 'text-red-500' : 'text-gray-500';
        const bgColor = m.status === 'positive' ? 'bg-green-50 border-green-100' : m.status === 'negative' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100';
        const ChangeIcon = m.changeDirection === 'up' ? ArrowUp : m.changeDirection === 'down' ? ArrowDown : Minus;
        return (
          <div key={i} className={`rounded-xl border p-3.5 ${bgColor}`}>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">{m.label}</p>
            <p className="text-lg font-bold text-gray-900">{m.value}</p>
            {m.change && (
              <div className={`flex items-center gap-1 mt-1 ${statusColor}`}>
                <ChangeIcon className="w-3 h-3" />
                <span className="text-[10px] font-semibold">{m.change}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TableSection({ content }: { content: Record<string, unknown> }) {
  const headers = (content.headers as string[]) || [];
  const rows = (content.rows as string[][]) || [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            {headers.map((h, i) => (
              <th key={i} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="py-2 pr-4 text-[11px] text-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsightsSection({ content }: { content: Record<string, unknown> }) {
  const insights = (content.insights as Array<{ type: string; text: string }>) || [];
  const iconMap: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    positive: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
    negative: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
    neutral: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100' },
    opportunity: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  };
  return (
    <div className="space-y-2">
      {insights.map((insight, i) => {
        const cfg = iconMap[insight.type] || iconMap.neutral;
        const Icon = cfg.icon;
        return (
          <div key={i} className={`flex items-start gap-2.5 rounded-xl border p-3 ${cfg.bg}`}>
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
            <p className="text-[11px] text-gray-700 leading-relaxed">{insight.text}</p>
          </div>
        );
      })}
    </div>
  );
}

function ChartSection({ content }: { content: Record<string, unknown> }) {
  const chartType = (content.chartType as string) || 'bar';
  const chartTitle = (content.chartTitle as string) || '';
  const dataPoints = (content.dataPoints as Array<{ label: string; values: Record<string, unknown> }>) || [];
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      {chartTitle && <p className="text-[11px] font-semibold text-gray-700 mb-3">{chartTitle}</p>}
      <div className="space-y-2">
        {dataPoints.map((dp, i) => {
          const values = Object.entries(dp.values || {});
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 w-20 flex-shrink-0 truncate">{dp.label}</span>
              <div className="flex-1 flex items-center gap-2">
                {values.map(([key, val], vi) => (
                  <div key={vi} className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">{key}:</span>
                    <span className="text-[10px] font-medium text-gray-700">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-gray-400 mt-2 italic">Chart type: {chartType}</p>
    </div>
  );
}

function ComparisonSection({ content }: { content: Record<string, unknown> }) {
  const periods = (content.periods as Array<{ label: string; metrics: Record<string, unknown> }>) || [];
  if (periods.length === 0) return null;

  const allMetricKeys = [...new Set(periods.flatMap(p => Object.keys(p.metrics || {})))];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">Metric</th>
            {periods.map((p, i) => (
              <th key={i} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">{p.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allMetricKeys.map((key, ri) => (
            <tr key={ri} className="border-b border-gray-50">
              <td className="py-2 pr-4 text-[11px] font-medium text-gray-600">{key}</td>
              {periods.map((p, pi) => (
                <td key={pi} className="py-2 pr-4 text-[11px] text-gray-700">{String((p.metrics || {})[key] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportSectionRenderer({ section }: { section: ReportOutput['sections'][number] }) {
  switch (section.type) {
    case 'summary': return <SummarySection content={section.content} />;
    case 'metrics': return <MetricsSection content={section.content} />;
    case 'table': return <TableSection content={section.content} />;
    case 'insights': return <InsightsSection content={section.content} />;
    case 'chart': return <ChartSection content={section.content} />;
    case 'comparison': return <ComparisonSection content={section.content} />;
    default: return <p className="text-[11px] text-gray-400 italic">Unknown section type: {section.type}</p>;
  }
}

// --- Report content renderer (reused for both live-generated and saved reports) ---

function ReportContent({ report }: { report: ReportOutput }) {
  const sortedSections = [...report.sections].sort((a, b) => a.order - b.order);

  return (
    <>
      {/* Report Header */}
      <div className="border-b border-gray-100 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <img src="/td-icon.svg" alt="Treasure Data" className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">Treasure Data AI Suites</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{report.title}</h2>
        <p className="text-xs text-gray-400">
          {report.subtitle}
          {report.reportPeriod && (
            <> · {report.reportPeriod.start} to {report.reportPeriod.end}</>
          )}
        </p>
      </div>

      {/* AI Summary */}
      {report.aiSummary && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1.5">AI Executive Summary</p>
          <p className="text-xs text-gray-700 leading-relaxed">{report.aiSummary}</p>
        </div>
      )}

      {/* Report Sections */}
      {sortedSections.map((section, i) => (
        <div key={section.id} className={`pb-6 ${i < sortedSections.length - 1 ? 'border-b border-gray-50' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
              {i + 1}
            </span>
            <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
            <span className="text-[9px] text-gray-300 font-medium uppercase tracking-wider ml-1">{section.type}</span>
          </div>
          <div className="pl-7">
            <ReportSectionRenderer section={section} />
          </div>
        </div>
      ))}

      {/* Key Takeaways */}
      {report.keyTakeaways && report.keyTakeaways.length > 0 && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Key Takeaways</p>
          <ul className="space-y-1.5">
            {report.keyTakeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-gray-700">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {report.nextSteps && report.nextSteps.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-2">Recommended Next Steps</p>
          <ul className="space-y-1.5">
            {report.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center text-[9px] font-bold text-amber-700 mt-0.5 flex-shrink-0">{i + 1}</span>
                <span className="text-[11px] text-gray-700">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-300">
            Report generated {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · Treasure Data AI Suites
          </p>
          <p className="text-[10px] text-gray-300">{report.sections.length} sections</p>
        </div>
      </div>
    </>
  );
}

// --- Main component ---

export default function ReportsDashboardPage() {
  const [viewMode, setViewMode] = useState<'templates' | 'preview'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  // When viewing a saved report (not generating), we track it here
  const [viewingSavedReport, setViewingSavedReport] = useState<SavedReport | null>(null);

  const {
    messages, streamingSegments, isStreaming, isWaitingForResponse,
    sendMessage, startSession, sessionActive,
  } = useChatStore();
  const {
    generatedReport, isGenerating, setGenerating, clearReport,
    savedReports, saveReport, deleteReport,
  } = useReportStore();

  // The report to display: either a live-generated one or a saved one being viewed
  const displayReport = viewingSavedReport?.report ?? generatedReport;

  // Ref to track the template ID for the current generation flow.
  // We use a ref because the chatStore calls both setReport() and
  // setGenerating(false) synchronously in finalizeStream, so by the
  // time our useEffect runs isGenerating is already false.
  const pendingTemplateRef = useRef<string | null>(null);

  const handleGenerate = useCallback(async (templateId: string) => {
    setSelectedTemplate(templateId);
    setViewMode('preview');
    setViewingSavedReport(null);
    setIsChatCollapsed(false);
    clearReport();
    setGenerating(true);
    pendingTemplateRef.current = templateId;

    // Start session if needed
    if (!sessionActive) {
      await startSession();
    }

    const template = reportTemplates.find(t => t.id === templateId);
    if (!template) return;

    const prompt = `Generate a ${template.name} report for our paid media campaigns. Template type: ${templateId}. Include sections: ${template.sections.join(', ')}.`;
    await sendMessage(prompt);
  }, [sessionActive, startSession, sendMessage, clearReport, setGenerating]);

  // Auto-save when the generated report arrives
  useEffect(() => {
    if (generatedReport && pendingTemplateRef.current) {
      const templateId = pendingTemplateRef.current;
      pendingTemplateRef.current = null;

      const template = reportTemplates.find(t => t.id === templateId);
      if (template) {
        saveReport(templateId, template.name, generatedReport);
      }
    }
  }, [generatedReport, saveReport]);

  const handleBack = () => {
    setViewMode('templates');
    setSelectedTemplate(null);
    setViewingSavedReport(null);
    clearReport();
    setGenerating(false);
    setIsChatCollapsed(false);
  };

  const handleViewSavedReport = (saved: SavedReport) => {
    setViewingSavedReport(saved);
    setSelectedTemplate(saved.templateId);
    setViewMode('preview');
    // Collapse chat when viewing a saved report (no active generation)
    setIsChatCollapsed(true);
    clearReport();
    setGenerating(false);
  };

  const handleShare = useCallback((report: ReportOutput | null | undefined) => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }).catch(() => {
      // Fallback for environments where clipboard API is not available
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  }, []);

  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  const handleDeleteReport = useCallback((id: string) => {
    deleteReport(id);
  }, [deleteReport]);

  const currentTemplate = reportTemplates.find(t => t.id === selectedTemplate);

  // Determine whether to show the chat panel (only during generation, not when viewing saved)
  const isActiveGeneration = isGenerating || (generatedReport !== null && !viewingSavedReport);

  return (
    <div className="h-full overflow-hidden bg-[#F7F8FB] flex flex-col">
      {/* Share toast */}
      {showShareToast && (
        <div className="fixed top-[90px] right-6 z-[1000] px-5 py-3 rounded-xl bg-gray-800 text-white text-sm font-medium shadow-lg flex items-center gap-2">
          <Share2 className="w-3.5 h-3.5" /> Report JSON copied to clipboard
        </div>
      )}

      {viewMode === 'templates' ? (
        /* ======== Templates View ======== */
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Reports</span>
                  <h2 className="text-xl font-semibold text-gray-900 mt-1">Report Generator</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Generate and export campaign performance reports</p>
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Report Templates</h3>
              <p className="text-xs text-gray-400 mb-4">Choose a template to generate your report</p>
              <div className="grid grid-cols-4 gap-4">
                {reportTemplates.map(template => (
                  <div key={template.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                        <template.icon className="w-4 h-4 text-gray-600" />
                      </span>
                      <h4 className="text-sm font-semibold text-gray-900">{template.name}</h4>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-3 flex-1">{template.description}</p>
                    <div className="space-y-1 mb-4">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Includes</p>
                      {template.sections.slice(0, 4).map(section => (
                        <div key={section} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[10px] text-gray-500">{section}</span>
                        </div>
                      ))}
                      {template.sections.length > 4 && (
                        <span className="text-[10px] text-gray-400 ml-2.5">+{template.sections.length - 4} more</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">{template.estimatedPages} pages</span>
                      <button
                        onClick={() => handleGenerate(template.id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[10px] font-medium hover:bg-gray-800 transition-colors cursor-pointer border-none"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Recent Reports</h3>
                <p className="text-[10px] text-gray-400">Previously generated reports</p>
              </div>
              {savedReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No reports generated yet. Choose a template above to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4">Report</th>
                        <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4">Date</th>
                        <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4">Sections</th>
                        <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4">Status</th>
                        <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedReports.map(saved => {
                        const createdDate = new Date(saved.createdAt);
                        return (
                          <tr key={saved.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-900">{saved.report.title || saved.templateName}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-300" />
                                <span className="text-[10px] text-gray-500">
                                  {createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                                  {createdDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="text-[10px] text-gray-500">{saved.report.sections.length} sections</span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                                Ready
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewSavedReport(saved)}
                                  className="text-[10px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> View
                                </button>
                                <button
                                  onClick={handleExportPDF}
                                  className="text-[10px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> PDF
                                </button>
                                <button
                                  onClick={() => handleShare(saved.report)}
                                  className="text-[10px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1"
                                >
                                  <Share2 className="w-3 h-3" /> Share
                                </button>
                                <button
                                  onClick={() => handleDeleteReport(saved.id)}
                                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ======== Preview Mode — Split Layout ======== */
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="shrink-0 px-6 pt-4 pb-2">
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-gray-300 transition-colors cursor-pointer bg-white"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <div className="h-5 w-px bg-gray-200" />
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      {displayReport?.title || currentTemplate?.name}
                    </h2>
                    <p className="text-[10px] text-gray-400">
                      {isGenerating
                        ? 'Generating report...'
                        : displayReport
                          ? `Generated ${new Date(displayReport.generatedAt).toLocaleString()} · ${displayReport.sections.length} sections`
                          : `${currentTemplate?.estimatedPages} pages`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare(displayReport)}
                    disabled={!displayReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-gray-300 transition-colors cursor-pointer bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer border-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Split Pane: Chat (left) + Report (right) */}
          <div className="flex-1 overflow-hidden px-6 pb-4">
            {isActiveGeneration ? (
              /* Active generation: show split layout with chat */
              <SplitPaneLayout
                initialLeftWidth={33}
                collapsed={isChatCollapsed}
                onToggleCollapse={() => setIsChatCollapsed(prev => !prev)}
              >
                {/* Left Panel — Chat */}
                <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Chat utility bar */}
                  <div className="flex items-center justify-between px-4 pt-3 shrink-0">
                    <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Generation Log</span>
                    <button
                      onClick={() => setIsChatCollapsed(true)}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                      title="Collapse chat"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 && !isStreaming && !isWaitingForResponse ? (
                      <div className="flex-1 flex items-center justify-center h-full">
                        <div className="text-center px-6">
                          <Loader2 className="w-6 h-6 text-gray-300 animate-spin mx-auto mb-3" />
                          <p className="text-xs text-gray-400">Starting report generation...</p>
                        </div>
                      </div>
                    ) : (
                      <StreamingChatView
                        messages={messages}
                        streamingSegments={streamingSegments}
                        isStreaming={isStreaming}
                        isWaitingForResponse={isWaitingForResponse}
                      />
                    )}
                  </div>
                </div>

                {/* Right Panel — Report */}
                <div className="h-full overflow-y-auto bg-white rounded-2xl border border-gray-100">
                  <div className="px-8 py-8 space-y-6">
                    {isGenerating && !generatedReport ? (
                      /* Loading skeleton */
                      <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <img src="/td-icon.svg" alt="Treasure Data" className="w-5 h-5" />
                            <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">Treasure Data AI Suites</span>
                          </div>
                          <div className="h-7 bg-gray-100 rounded-lg w-2/3 mb-2 animate-pulse" />
                          <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                        </div>
                        {currentTemplate?.sections.map((section, i) => (
                          <div key={section} className={`pb-6 ${i < (currentTemplate?.sections.length ?? 0) - 1 ? 'border-b border-gray-50' : ''}`}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                {i + 1}
                              </span>
                              <h3 className="text-sm font-semibold text-gray-900">{section}</h3>
                            </div>
                            <div className="space-y-2 pl-7">
                              <div className="h-3 bg-gray-100 rounded-full w-full animate-pulse" />
                              <div className="h-3 bg-gray-100 rounded-full w-5/6 animate-pulse" />
                              <div className="h-3 bg-gray-100 rounded-full w-4/6 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : generatedReport ? (
                      <ReportContent report={generatedReport} />
                    ) : null}
                  </div>
                </div>
              </SplitPaneLayout>
            ) : viewingSavedReport ? (
              /* Viewing a saved report: full-width report, no chat panel */
              <div className="h-full overflow-y-auto bg-white rounded-2xl border border-gray-100">
                <div className="px-8 py-8 space-y-6">
                  <ReportContent report={viewingSavedReport.report} />
                </div>
              </div>
            ) : (
              /* Fallback — should not normally show */
              <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-gray-100">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-xs text-gray-400">Select a template to generate a report</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
