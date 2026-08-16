import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'card-grid' | 'list' | 'detail' | 'table';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card-grid',
  count = 6,
  className = ''
}) => {
  if (variant === 'card-grid') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="bg-white border border-[#E5E7EB] rounded-xl p-5 animate-pulse flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
            <div className="h-20 bg-gray-100 rounded-lg w-full" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`w-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden animate-pulse ${className}`}>
        <div className="h-12 bg-gray-100 border-b border-gray-200" />
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-1/5" />
            <div className="h-4 bg-gray-200 rounded w-1/6" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={`space-y-6 max-w-4xl mx-auto animate-pulse ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  // list
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-[#E5E7EB] rounded-xl animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
};
