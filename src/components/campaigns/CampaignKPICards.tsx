/**
 * CampaignKPICards - 4-card grid showing operational campaign KPIs
 * Used in CombinedCampaignsPage to show campaign health at a glance
 */

import { useMemo } from 'react';
import { Activity, AlertCircle, DollarSign, Rocket } from 'lucide-react';
import type { LiveCampaign } from '../../types/optimize';
import type { PaidMediaProgram } from '../../types/program';

interface CampaignKPICardsProps {
  campaigns: LiveCampaign[];
  programs?: PaidMediaProgram[];
}

export default function CampaignKPICards({ campaigns, programs = [] }: CampaignKPICardsProps) {
  // Calculate metrics
  const kpis = useMemo(() => {
    // 1. Total Active Campaigns
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    // 2. Total Budget Allocated (sum of all budgets + % spent)
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
    const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // 3. Needs Attention (ending soon < 7 days, overspent, or paused)
    const needsAttention = campaigns.filter(c => {
      const endingSoon = (c.daysRemaining || 999) < 7;
      const overspent = c.pacingStatus === 'overspent';
      const paused = c.status === 'paused';
      return endingSoon || overspent || paused;
    }).length;

    // 4. Launch Pipeline (programs ready to launch)
    const readyToLaunch = programs.filter(p => p.status === 'ready_to_launch').length;

    return { activeCampaigns, totalBudget, totalSpent, budgetUtilization, needsAttention, readyToLaunch };
  }, [campaigns, programs]);

  return (
    <div className="grid grid-cols-4 gap-3">
      {/* Card 1: Total Active Campaigns */}
      <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Active Campaigns</span>
          <Activity className="w-3 h-3 text-gray-300" />
        </div>
        <div className="text-xl font-bold text-gray-900">{kpis.activeCampaigns}</div>
        <span className="text-[10px] text-gray-400">
          {campaigns.length - kpis.activeCampaigns} inactive
        </span>
      </div>

      {/* Card 2: Total Budget Allocated */}
      <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Total Budget</span>
          <DollarSign className="w-3 h-3 text-gray-300" />
        </div>
        <div className="text-xl font-bold text-gray-900">
          ${(kpis.totalBudget / 1000).toFixed(0)}k
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(kpis.budgetUtilization, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{kpis.budgetUtilization}%</span>
        </div>
      </div>

      {/* Card 3: Needs Attention */}
      <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Needs Attention</span>
          <AlertCircle className="w-3 h-3 text-gray-300" />
        </div>
        <div className="text-xl font-bold text-orange-600">{kpis.needsAttention}</div>
        <span className="text-[10px] text-gray-400">
          Ending soon, overspent, or paused
        </span>
      </div>

      {/* Card 4: Launch Pipeline */}
      <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Launch Pipeline</span>
          <Rocket className="w-3 h-3 text-gray-300" />
        </div>
        <div className="text-xl font-bold text-purple-600">{kpis.readyToLaunch}</div>
        <span className="text-[10px] text-gray-400">
          {programs.length - kpis.readyToLaunch} in progress
        </span>
      </div>
    </div>
  );
}
