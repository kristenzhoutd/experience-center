/**
 * AIOpportunitiesSidebar — AI-powered optimization opportunities
 * Extracted from OptimizationDashboard for reuse in combined page.
 * Shows potential savings, high priority count, and 6 opportunity cards.
 */

import { useState } from 'react';
import { Sparkles, TrendingUp, AlertCircle, ChevronDown } from 'lucide-react';

export interface OptimizationOpportunity {
  id: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  savings: string;
}

interface AIOpportunitiesSidebarProps {
  opportunities: OptimizationOpportunity[];
  onDismiss: (id: string) => void;
  onReview: (id: string) => void;
}

export default function AIOpportunitiesSidebar({
  opportunities,
  onDismiss,
  onReview,
}: AIOpportunitiesSidebarProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Calculate total potential savings
  const totalSavings = opportunities.reduce((sum, card) => {
    const amount = parseInt(card.savings.replace(/[$,]/g, ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const highPriorityCount = opportunities.filter(o => o.priority === 'high').length;

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="w-[300px] flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 m-0">AI Opportunities</h3>
            <p className="text-[11px] text-gray-400 m-0">{opportunities.length} actions available</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-500">Potential savings</span>
            <span className="text-sm font-bold text-gray-900">
              ${totalSavings.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[11px] text-gray-500">High priority</span>
            <span className="text-xs font-semibold text-red-500">
              {highPriorityCount} item{highPriorityCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Opportunity Cards */}
        <div className="flex flex-col gap-3">
          {opportunities.map((card) => {
            const isExpanded = expandedCards.has(card.id);

            // Icon based on priority
            const IconComponent = card.priority === 'high' ? TrendingUp : AlertCircle;
            const iconBg = card.priority === 'high' ? 'bg-purple-50' : 'bg-orange-50';
            const iconColor = card.priority === 'high' ? 'text-purple-600' : 'text-orange-600';

            return (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                {/* Header with icon and title */}
                <div className="flex gap-2.5 mb-2.5">
                  <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[13px] font-semibold text-gray-900 mb-0.5 leading-tight">
                      {card.title}
                    </h4>
                    <span className="text-[11px] text-green-600 font-medium">
                      {card.confidence}% confidence
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-gray-600 leading-relaxed mb-2.5">
                  {card.description}
                </p>

                {/* Footer with View details and buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleExpanded(card.id)}
                    className="flex items-center gap-0.5 text-[11px] text-gray-500 hover:text-gray-700 transition-colors border-none bg-transparent cursor-pointer p-0"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    View details
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDismiss(card.id)}
                      className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => onReview(card.id)}
                      className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border-none bg-gray-900 text-white cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>

                {/* Expandable details */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Impact:</span>
                        <span className="font-medium text-green-600">{card.impact}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Potential savings:</span>
                        <span className="font-medium text-gray-900">{card.savings}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Priority:</span>
                        <span className={`font-medium capitalize ${
                          card.priority === 'high' ? 'text-red-600' :
                          card.priority === 'medium' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {card.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
