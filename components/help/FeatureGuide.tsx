'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FeatureGuideProps {
  title: string;
  steps: string[];
  className?: string;
}

const FeatureGuide: React.FC<FeatureGuideProps> = ({ title, steps, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-3 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-gray-300 hover:text-white transition-colors"
      >
        <div className="flex items-center space-x-2">
          <HelpCircle size={16} />
          <span className="font-semibold text-sm">{title} - 操作指南</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && (
        <div className="mt-3 pl-4 border-l-2 border-gray-600">
          <ul className="space-y-2 text-xs text-gray-400">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-cyan-400">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FeatureGuide;
