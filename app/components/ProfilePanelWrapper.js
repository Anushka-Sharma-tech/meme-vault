'use client';
import { useState } from 'react';
import ProfilePanel from './ProfilePanel';

export default function ProfilePanelWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button - click to open */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg transition-all"
      >
        👤
      </button>

      {/* Panel - only renders when open */}
      {isOpen && (
        <div className="fixed bottom-20 left-6 z-50">
          <ProfilePanel closePanel={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}