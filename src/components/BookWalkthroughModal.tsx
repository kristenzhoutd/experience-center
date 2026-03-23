import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Check, Calendar, Clock, Sparkles, Target, ArrowRight, Loader2 } from 'lucide-react';

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';

interface BookWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    goal?: string;
    industry?: string;
    scenario?: string;
  };
}

// Generate available dates (next 14 weekdays from today)
function getAvailableDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  let d = new Date(today);
  d.setDate(d.getDate() + 1); // start tomorrow
  while (dates.length < 14) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookWalkthroughModal({ isOpen, onClose, context }: BookWalkthroughModalProps) {
  const [step, setStep] = useState<'schedule' | 'details' | 'success'>('schedule');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [form, setForm] = useState({ email: '', firstName: '', company: '', role: '' });
  const [busySlots, setBusySlots] = useState<Array<{ start: string; end: string }>>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [busyFetchedMonth, setBusyFetchedMonth] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const availableDates = getAvailableDates();

  // Fetch busy slots for the entire visible month (once per month)
  useEffect(() => {
    const monthKey = `${calendarMonth.year}-${calendarMonth.month}`;
    if (busyFetchedMonth === monthKey) return;
    const fetchBusy = async () => {
      setIsLoadingAvailability(true);
      try {
        const start = new Date(calendarMonth.year, calendarMonth.month, 1);
        const end = new Date(calendarMonth.year, calendarMonth.month + 1, 0, 23, 59, 59);
        const res = await fetch(`/api/calendar/availability?start=${start.toISOString()}&end=${end.toISOString()}`, {
          headers: { 'x-app-password': APP_PASSWORD },
        });
        const data = await res.json();
        if (data.success) {
          setBusySlots(data.data.busySlots);
          setBusyFetchedMonth(monthKey);
        }
      } catch { /* fallback to showing all slots */ }
      setIsLoadingAvailability(false);
    };
    fetchBusy();
  }, [calendarMonth.year, calendarMonth.month, busyFetchedMonth]);

  // Check if a time slot is busy
  const isSlotBusy = (time: string): boolean => {
    if (!selectedDate || busySlots.length === 0) return false;
    const [hourStr, minutePart] = time.split(':');
    const isPM = minutePart.includes('PM');
    let hour = parseInt(hourStr);
    const minute = parseInt(minutePart) || 0;
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return busySlots.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  };

  if (!isOpen) return null;

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !form.email) return;
    setIsBooking(true);
    setBookingError('');
    try {
      const res = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-password': APP_PASSWORD },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          time: selectedTime,
          email: form.email,
          firstName: form.firstName,
          company: form.company,
          role: form.role,
          context,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('success');
      } else {
        setBookingError(data.error || 'Booking failed. Please try again.');
      }
    } catch {
      setBookingError('Booking failed. Please try again.');
    }
    setIsBooking(false);
  };

  const handleClose = () => {
    setStep('schedule');
    setSelectedDate(null);
    setSelectedTime('');
    setForm({ email: '', firstName: '', company: '', role: '' });
    onClose();
  };

  // Calendar helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(calendarMonth.year, calendarMonth.month);
  const firstDay = getFirstDayOfMonth(calendarMonth.year, calendarMonth.month);

  const isDateAvailable = (day: number) => {
    const d = new Date(calendarMonth.year, calendarMonth.month, day);
    return availableDates.some(ad =>
      ad.getDate() === d.getDate() && ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear()
    );
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day &&
      selectedDate.getMonth() === calendarMonth.month &&
      selectedDate.getFullYear() === calendarMonth.year;
  };

  const isDatePast = (day: number) => {
    const d = new Date(calendarMonth.year, calendarMonth.month, day);
    return d < today;
  };

  const prevMonth = () => {
    setCalendarMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCalendarMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return `${DAYS[selectedDate.getDay()]}, ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {step === 'success' ? 'Your walkthrough is booked' : 'Book a walkthrough'}
            </h2>
            {step !== 'success' && (
              <p className="text-xs text-gray-500 mt-0.5">
                Choose a time to see Treasure AI tailored to your business, goals, and data context.
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Context summary */}
        {step !== 'success' && context && (context.goal || context.industry || context.scenario) && (
          <div className="mx-6 mb-4 px-3 py-2 rounded-lg bg-gray-50 flex flex-wrap gap-x-3 gap-y-1">
            {context.goal && (
              <span className="text-[11px] text-gray-500">
                <span className="text-gray-400">Goal:</span> {context.goal}
              </span>
            )}
            {context.industry && (
              <span className="text-[11px] text-gray-500">
                <span className="text-gray-400">Industry:</span> {context.industry}
              </span>
            )}
            {context.scenario && (
              <span className="text-[11px] text-gray-500">
                <span className="text-gray-400">Scenario:</span> {context.scenario}
              </span>
            )}
          </div>
        )}

        {/* Step: Schedule */}
        {step === 'schedule' && (
          <div className="px-6 pb-6">
            {/* Mini Calendar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm font-medium text-gray-900">
                  {MONTHS[calendarMonth.month]} {calendarMonth.year}
                </span>
                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const available = isDateAvailable(day);
                  const selected = isDateSelected(day);
                  const past = isDatePast(day);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        if (available) {
                          setSelectedDate(new Date(calendarMonth.year, calendarMonth.month, day));
                          setSelectedTime('');
                        }
                      }}
                      disabled={!available || past}
                      className={`w-full aspect-square flex items-center justify-center text-xs rounded-lg transition-colors ${
                        selected
                          ? 'bg-gray-900 text-white font-medium'
                          : available && !past
                          ? 'text-gray-900 hover:bg-gray-100 cursor-pointer font-medium'
                          : 'text-gray-300 cursor-default'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-700">{formatSelectedDate()}</span>
                </div>
                {isLoadingAvailability ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400 ml-2">Checking availability...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS.map(time => {
                      const busy = isSlotBusy(time);
                      return (
                        <button
                          key={time}
                          onClick={() => !busy && setSelectedTime(time)}
                          disabled={busy}
                          className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors border ${
                            selectedTime === time
                              ? 'bg-gray-900 text-white border-gray-900 cursor-pointer'
                              : busy
                              ? 'text-gray-300 border-gray-100 cursor-not-allowed line-through'
                              : 'text-gray-700 border-gray-200 hover:border-gray-400 cursor-pointer'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Continue button */}
            <div className="flex items-center justify-between mt-5">
              <button
                onClick={handleClose}
                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('details')}
                disabled={!selectedDate || !selectedTime}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  selectedDate && selectedTime
                    ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-gray-50">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-700 font-medium">{formatSelectedDate()}</span>
              <span className="text-xs text-gray-400">at</span>
              <span className="text-xs text-gray-700 font-medium">{selectedTime}</span>
              <button
                onClick={() => setStep('schedule')}
                className="ml-auto text-[11px] text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
              >
                Change
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Work email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@company.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">First name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="First name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Company</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    placeholder="Company name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Role</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. VP Marketing, CMO"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {bookingError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3">
                {bookingError}
              </div>
            )}

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => setStep('schedule')}
                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleBook}
                disabled={!form.email || isBooking}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  form.email && !isBooking
                    ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isBooking ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Booking...
                  </span>
                ) : (
                  'Book a walkthrough'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="px-6 pb-6">
            {/* Confirmation */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3 mt-1">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                You're all set. A Treasure AI team member will reach out to confirm.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-700 font-medium">{formatSelectedDate()}</span>
                <span className="text-xs text-gray-400">at</span>
                <span className="text-xs text-gray-700 font-medium">{selectedTime}</span>
              </div>
            </div>

            {/* What to expect */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <h4 className="text-xs font-semibold text-gray-900 mb-3">What to expect</h4>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    A Treasure AI team member will tailor the walkthrough to {context?.goal ? `"${context.goal}"` : 'the outcome'} {context?.industry ? `in ${context.industry}` : ''} {context?.scenario ? `— focused on ${context.scenario.toLowerCase()}` : ''}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="w-3 h-3 text-indigo-500" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    You'll see how Treasure AI connects to real workflows and business outcomes for your organization
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    You'll walk away with relevant opportunities and clear next steps tied to your goals
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 cursor-pointer transition-colors"
              >
                Back to experience
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
