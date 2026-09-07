import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ExpertReviewInbox } from '../../components/common/ReviewList';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard → Reviews tab.
 *
 * Renders the full review inbox for the logged-in expert. The expert can
 * read every customer comment, see read-more details, and post a public
 * reply directly from this page.
 */
export const ExpertReviewsTab: React.FC = () => {
  const { expertId, loading } = useOutletContext<ExpertOutletContext>();

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6">
        <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
        <p className="text-xs text-gray-500 mt-1">
          Public feedback from completed consultations. Reply with a courteous
          acknowledgement — prospective patients read these before booking.
        </p>
      </div>
      <ExpertReviewInbox expertId={expertId} />
    </div>
  );
};

export default ExpertReviewsTab;