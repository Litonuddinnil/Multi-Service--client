import React from 'react';
import { ChatThreadList } from '../../components/common/ChatThreadList';

/**
 * Expert Dashboard → Threads (Messages) tab.
 *
 * Hosts the shared `<ChatThreadList />` with role="expert" so the
 * inbox only shows threads where the logged-in expert is the
 * receiving provider. Pre-session prep from clients and post-session
 * follow-ups flow through here.
 */
export const ExpertThreadsTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <header className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
        <h2 className="text-base font-bold ">Client conversations</h2>
        <p className="text-xs text-gray-500 mt-1">
          Pre-session intake forms, clarifying questions, and post-session
          follow-up. Threads stay open after a booking so patients can come back
          with lab results.
        </p>
      </header>
      <ChatThreadList role="expert" />
    </div>
  );
};

export default ExpertThreadsTab;
