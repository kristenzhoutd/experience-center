/**
 * Book a Walkthrough Modal — lead capture form for scheduling a personalized demo.
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, CheckCircle, Loader2, Sparkles, Target, ArrowRight } from 'lucide-react';

interface BookWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookWalkthroughModal({ isOpen, onClose }: BookWalkthroughModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  if (!isOpen) return null;

  const canSubmit = firstName.trim() && email.trim() && company.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus('submitting');
    // Simulate submission delay (no backend yet)
    await new Promise(resolve => setTimeout(resolve, 800));
    setStatus('success');
  };

  const handleClose = () => {
    onClose();
    // Reset after close animation
    setTimeout(() => {
      setFirstName('');
      setLastName('');
      setEmail('');
      setCompany('');
      setRole('');
      setMessage('');
      setStatus('idle');
    }, 200);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          {status === 'success' ? (
            <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Your walkthrough is booked
            </h2>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Book a Walkthrough
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  See Treasure AI with your data and goals
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {status === 'success' ? (
          /* Success State */
          <div className="px-6 pb-6 pt-4">

            {/* Checkmark + confirmation */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm text-gray-500">
                You're all set. A Treasure AI team member will reach out to confirm.
              </p>
            </div>

            {/* Suggested date */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-sm text-blue-500">at</span>
              <span className="text-sm font-semibold text-gray-700">3:30 PM</span>
            </div>

            {/* What to expect */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
                What to expect
              </h3>
              <div className="space-y-4">
                {[
                  { icon: Sparkles, text: 'A Treasure AI team member will tailor the walkthrough to the outcome', color: 'text-blue-500' },
                  { icon: Target, text: "You'll see how Treasure AI connects to real workflows and business outcomes for your organization", color: 'text-blue-500' },
                  { icon: ArrowRight, text: "You'll walk away with relevant opportunities and clear next steps tied to your goals", color: 'text-blue-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
                    <span className="text-sm text-gray-600 leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Back button */}
            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="px-8 py-2.5 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Back to experience
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <div className="px-6 pb-6 pt-2 space-y-4">
            {/* Name row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">First name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Work email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Company + Role */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Company *</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Marketing Director"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
                Message <span className="text-gray-300 font-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your goals or what you'd like to explore..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || status === 'submitting'}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  canSubmit && status !== 'submitting'
                    ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {status === 'submitting' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Request walkthrough'
                )}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              We'll reach out within 1 business day to schedule your personalized session.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
