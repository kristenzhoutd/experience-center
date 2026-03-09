import { useState, useMemo, useCallback } from 'react';
import {
  Copy, X, Sparkles, Check, Target, Users, DollarSign, Calendar,
  Zap, TrendingUp, BarChart3, Settings, AlertTriangle, CheckCircle,
  ArrowRight, Edit3, Globe, Clock,
} from 'lucide-react';

type EnhancementType = 'audience_expansion' | 'budget_optimization' | 'creative_variation' | 'channel_expansion' | 'schedule_optimization' | 'geo_expansion';

interface Enhancement {
  id: EnhancementType;
  name: string;
  description: string;
  icon: React.ReactNode;
  impact: 'high' | 'medium' | 'low';
  estimatedLift: { min: number; max: number };
  changes: string[];
}

interface CampaignToClone {
  id: string;
  name: string;
  status: string;
  spend: number;
  roas: number;
  impressions: number;
  conversions: number;
}

interface CloneConfig {
  newName: string;
  enhancements: EnhancementType[];
  preserveSettings: boolean;
  startDate: string;
  budget: number;
  budgetMultiplier: number;
}

interface CampaignCloningWithAIProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignToClone | null;
  onClone?: (config: CloneConfig) => void;
}

const ENHANCEMENTS: Enhancement[] = [
  { id: 'audience_expansion', name: 'Audience Expansion', description: 'AI identifies similar high-value audiences to target', icon: <Users size={18} />, impact: 'high', estimatedLift: { min: 15, max: 30 }, changes: ['Add lookalike audiences based on top converters', 'Expand interest targeting', 'Include similar demographics'] },
  { id: 'budget_optimization', name: 'Budget Optimization', description: 'Allocate budget based on historical performance', icon: <DollarSign size={18} />, impact: 'high', estimatedLift: { min: 10, max: 25 }, changes: ['Shift budget to best-performing ad sets', 'Increase spend during high-conversion hours'] },
  { id: 'creative_variation', name: 'Creative Variation', description: 'Generate creative variations to reduce fatigue', icon: <Zap size={18} />, impact: 'medium', estimatedLift: { min: 8, max: 18 }, changes: ['Create headline variations for A/B testing', 'Suggest new image/video formats'] },
  { id: 'channel_expansion', name: 'Channel Expansion', description: 'Extend campaign to additional channels', icon: <Globe size={18} />, impact: 'medium', estimatedLift: { min: 12, max: 22 }, changes: ['Add recommended ad networks', 'Enable new placement types'] },
  { id: 'schedule_optimization', name: 'Schedule Optimization', description: 'Optimize ad delivery timing', icon: <Clock size={18} />, impact: 'low', estimatedLift: { min: 5, max: 12 }, changes: ['Adjust dayparting based on performance', 'Set optimal campaign pacing'] },
];

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

export default function CampaignCloningWithAI({ isOpen, onClose, campaign, onClone }: CampaignCloningWithAIProps) {
  const [config, setConfig] = useState<CloneConfig>({
    newName: campaign ? `${campaign.name} (AI Clone)` : '',
    enhancements: [], preserveSettings: true,
    startDate: new Date().toISOString().split('T')[0],
    budget: campaign?.spend || 5000, budgetMultiplier: 1.0,
  });
  const [isCloning, setIsCloning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleEnhancementToggle = useCallback((id: EnhancementType) => {
    setConfig(prev => ({ ...prev, enhancements: prev.enhancements.includes(id) ? prev.enhancements.filter(e => e !== id) : [...prev.enhancements, id] }));
  }, []);

  const selectedEnhancements = useMemo(() => ENHANCEMENTS.filter(e => config.enhancements.includes(e.id)), [config.enhancements]);

  const estimatedTotalLift = useMemo(() => {
    if (selectedEnhancements.length === 0) return { min: 0, max: 0 };
    const avgMin = selectedEnhancements.reduce((sum, e) => sum + e.estimatedLift.min, 0) / selectedEnhancements.length;
    const avgMax = selectedEnhancements.reduce((sum, e) => sum + e.estimatedLift.max, 0) / selectedEnhancements.length;
    return { min: Math.round(avgMin), max: Math.round(avgMax) };
  }, [selectedEnhancements]);

  const allChanges = useMemo(() => selectedEnhancements.flatMap(e => e.changes), [selectedEnhancements]);

  const handleClone = useCallback(() => {
    setIsCloning(true);
    setTimeout(() => { setIsCloning(false); setIsSuccess(true); onClone?.(config); }, 2000);
  }, [config, onClone]);

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm flex items-center justify-center">
      <div className="w-[800px] max-w-[95vw] max-h-[90vh] bg-gradient-to-b from-[#131023] to-[#1A1830] border border-white/10 rounded-[20px] overflow-hidden flex flex-col animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Copy size={22} color="white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Clone Campaign with AI</h2>
              <p className="text-sm text-white/50">Create an enhanced version of your campaign</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"><X size={18} /></button>
        </div>

        {!isCloning && !isSuccess && (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Source Campaign */}
              <div className="bg-black/30 border border-white/10 rounded-[14px] p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Copy size={16} /> Cloning: {campaign.name}</h3>
                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-emerald-500/20 text-emerald-500">{campaign.status}</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Spend', value: formatCurrency(campaign.spend) },
                    { label: 'ROAS', value: `${campaign.roas.toFixed(2)}x` },
                    { label: 'Impressions', value: formatNumber(campaign.impressions) },
                    { label: 'Conversions', value: formatNumber(campaign.conversions) },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="text-[11px] text-white/50 mb-1">{stat.label}</div>
                      <div className="text-lg font-semibold text-white">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 mb-6 focus-within:border-cyan-500/50 transition-colors">
                <Edit3 size={18} className="text-white/40" />
                <input type="text" placeholder="Enter new campaign name..." value={config.newName}
                  onChange={e => setConfig(prev => ({ ...prev, newName: e.target.value }))}
                  className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder:text-white/40" />
              </div>

              {/* AI Enhancements */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Sparkles size={18} className="text-cyan-500" /> AI Enhancements</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ENHANCEMENTS.map(enhancement => {
                    const selected = config.enhancements.includes(enhancement.id);
                    return (
                      <div key={enhancement.id} onClick={() => handleEnhancementToggle(enhancement.id)}
                        className={`bg-black/30 border-2 rounded-[14px] p-4 cursor-pointer transition-all hover:bg-white/5 ${selected ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 hover:border-cyan-500/30'}`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all shrink-0 ${selected ? 'bg-cyan-500 border-cyan-500' : 'border-white/30'}`}>
                            {selected && <Check size={12} color="white" />}
                          </div>
                          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-500">{enhancement.icon}</div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-white mb-1">{enhancement.name}</h4>
                            <p className="text-xs text-white/50 leading-snug">{enhancement.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium ${enhancement.impact === 'high' ? 'bg-emerald-500/20 text-emerald-500' : enhancement.impact === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-500/20 text-gray-400'}`}>
                            <TrendingUp size={10} /> {enhancement.impact} impact
                          </span>
                          <span className="text-xs text-emerald-500 font-medium">+{enhancement.estimatedLift.min}-{enhancement.estimatedLift.max}% lift</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Preview */}
              {selectedEnhancements.length > 0 && (
                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-400/10 border border-cyan-500/30 rounded-[14px] p-5 mb-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-lg flex items-center justify-center"><Sparkles size={16} color="white" /></div>
                    <h4 className="text-sm font-semibold text-cyan-500">AI Enhancement Preview</h4>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {allChanges.slice(0, 5).map((change, index) => (
                      <div key={index} className="flex items-start gap-2.5 text-sm text-white/80 leading-relaxed">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 shrink-0" /> {change}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clone Settings */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Settings size={18} className="text-cyan-500" /> Clone Settings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-white/50 mb-2 flex items-center gap-1.5"><Calendar size={14} /> Start Date</div>
                    <input type="date" value={config.startDate} onChange={e => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                  </div>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-white/50 mb-2 flex items-center gap-1.5"><DollarSign size={14} /> Budget</div>
                    <input type="number" value={config.budget} onChange={e => setConfig(prev => ({ ...prev, budget: Number(e.target.value) }))}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                  </div>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-white/50 mb-2 flex items-center gap-1.5"><TrendingUp size={14} /> Budget Multiplier</div>
                    <div className="flex items-center gap-3">
                      <input type="range" min="0.5" max="3" step="0.1" value={config.budgetMultiplier}
                        onChange={e => setConfig(prev => ({ ...prev, budgetMultiplier: Number(e.target.value) }))}
                        className="flex-1 accent-cyan-500" />
                      <span className="text-base font-semibold text-white min-w-[50px] text-right">{config.budgetMultiplier.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Preview */}
              {selectedEnhancements.length > 0 && (
                <div className="bg-black/30 border border-white/10 rounded-[14px] p-5">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={16} /> Expected Performance Impact</h4>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-cyan-500/10 rounded-lg text-sm text-white/80"><TrendingUp size={16} className="text-cyan-500" /> Estimated performance lift: +{estimatedTotalLift.min}-{estimatedTotalLift.max}%</div>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-cyan-500/10 rounded-lg text-sm text-white/80"><DollarSign size={16} className="text-cyan-500" /> New budget: {formatCurrency(config.budget * config.budgetMultiplier)}</div>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-cyan-500/10 rounded-lg text-sm text-white/80"><Sparkles size={16} className="text-cyan-500" /> {selectedEnhancements.length} AI enhancements applied</div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-5 border-t border-white/10 bg-black/20">
              <div className="flex items-center gap-2 text-sm text-white/50"><AlertTriangle size={14} /> Original campaign will not be affected</div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-3 rounded-lg text-sm font-medium bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all">Cancel</button>
                <button onClick={handleClone} disabled={!config.newName.trim()}
                  className="px-6 py-3 rounded-lg text-sm font-medium bg-gradient-to-br from-cyan-500 to-cyan-400 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-2">
                  <Copy size={16} /> Clone Campaign <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {isCloning && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 border-[3px] border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-6" />
            <h3 className="text-lg font-semibold text-white mb-2">Creating Enhanced Clone...</h3>
            <p className="text-sm text-white/50">AI is applying optimizations to your new campaign</p>
          </div>
        )}

        {isSuccess && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center py-16">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-500"><CheckCircle size={40} /></div>
            <h3 className="text-xl font-semibold text-white mb-2">Campaign Cloned Successfully!</h3>
            <p className="text-sm text-white/50 mb-8 max-w-[400px]">
              Your enhanced campaign "{config.newName}" has been created with
              {selectedEnhancements.length > 0 ? ` ${selectedEnhancements.length} AI optimizations applied.` : ' your original settings.'}
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-3 rounded-lg text-sm font-medium bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all">Close</button>
              <button onClick={onClose} className="px-6 py-3 rounded-lg text-sm font-medium bg-gradient-to-br from-cyan-500 to-cyan-400 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/40 transition-all flex items-center gap-2"><ArrowRight size={16} /> View Campaign</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
