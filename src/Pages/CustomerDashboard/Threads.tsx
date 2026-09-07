import React from 'react';
import { ChatThreadList } from '../../components/common/ChatThreadList';

/**
 * Customer Dashboard → Threads (Messages) tab.
 *
 * Hosts the shared `<ChatThreadList />` with role="customer" so the
 * inbox only shows threads where the logged-in user is the customer.
 */
export const CustomerThreadsTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <header className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
        <h2 className="text-base font-bold ">Messages with your providers</h2>
        <p className="text-xs text-gray-500 mt-1">
          Pre-session prep and post-session follow-ups. Threads stay open
          after your appointment so you can revisit prescriptions or share
          lab reports.
        </p>
      </header>
      <ChatThreadList role="customer" />
    </div>
  );
};

export default CustomerThreadsTab;