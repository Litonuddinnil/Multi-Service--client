import React, { useState } from 'react';
import { X, Briefcase, FileText, Send, AlertCircle, ShieldCheck } from 'lucide-react';
import { ServiceItem } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { FormField } from '../common/FormField';

interface ProjectQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceItem;
  onSuccess: (projectId: string) => void;
  onOpenAuth: () => void;
}

export const ProjectQuoteModal: React.FC<ProjectQuoteModalProps> = ({
  isOpen,
  onClose,
  service,
  onSuccess,
  onOpenAuth
}) => {
  const { isAuthenticated } = useAuth();
  const [description, setDescription] = useState('');
  const [budgetEstimate, setBudgetEstimate] = useState('');
  const [timelineWeeks, setTimelineWeeks] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (!description.trim()) {
      setError('Please provide project scope details');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fullNote = `${description}\n\nEstimated Budget: ${budgetEstimate || 'Flexible'}\nTarget Timeline: ${timelineWeeks} weeks`;
      const res = await ApiService.createProjectRequest({
        serviceId: service.id,
        requirementsDescription: fullNote
      });

      if (res.success && res.project) {
        onSuccess(res.project.id);
        onClose();
      } else {
        setError('Failed to submit quote request. Please try again.');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="project-quote-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        <div className="bg-gradient-to-r from-[#111827] to-[#1F2937] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-5 h-5 text-[#34C759]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Milestone Contract</span>
          </div>
          <h3 className="text-lg font-bold text-white">Request a Project Quote</h3>
          <p className="text-xs text-gray-300 mt-1">
            For {service.title} by {service.expertName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <FormField 
            label="Detailed Requirements & Deliverables" 
            required 
            helpText="Describe your goals, project files/links, specifications, or architectural drawings."
          >
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., We need full architectural blueprints for a 6-storied residential building with BNBC compliance calculation..."
              className="w-full p-3 text-xs bg-white border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#34C759]/30 focus:border-[#34C759] outline-none"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Target Budget (BDT approx)">
              <input
                type="text"
                value={budgetEstimate}
                onChange={(e) => setBudgetEstimate(e.target.value)}
                placeholder="e.g. ৳50,000"
                className="w-full p-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#34C759]/30 focus:border-[#34C759] outline-none"
              />
            </FormField>

            <FormField label="Timeline (Weeks)">
              <select
                value={timelineWeeks}
                onChange={(e) => setTimelineWeeks(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#34C759]/30 focus:border-[#34C759] outline-none"
              >
                <option value="1">1 Week (Urgent)</option>
                <option value="2">2 Weeks</option>
                <option value="4">1 Month</option>
                <option value="8">2 Months+</option>
              </select>
            </FormField>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Milestone Escrow Process</p>
              <p className="text-blue-700/80 mt-0.5">
                The expert will propose milestones (e.g. 30% initial drafting, 70% final blueprints). You only fund each milestone when ready, and release payment upon satisfaction.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#34C759] hover:bg-[#2fb34f] rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Send Quote Inquiry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
