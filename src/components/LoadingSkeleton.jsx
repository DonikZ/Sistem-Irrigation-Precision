import React from 'react';

export function LoadingSkeleton({ lines = 3, height = 'h-24' }) {
  return (
    <div className={`bg-[#141719] border border-[#22272B] rounded-xl p-4 animate-pulse ${height} flex flex-col justify-between`}>
      <div className="h-4 bg-[#1B1F21] rounded w-1/3 mb-2" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 bg-[#1B1F21] rounded w-full" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="bg-[#141719] border border-[#22272B] rounded-xl p-8 text-center flex flex-col items-center justify-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-[#1B1F21] border border-[#282E33] flex items-center justify-center text-[#8A9198] mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-sm font-bold font-mono text-[#F5F5F5] uppercase tracking-wider mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-[#8A9198] max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export default LoadingSkeleton;
