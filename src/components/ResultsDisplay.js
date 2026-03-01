import React from 'react';
import { TrendingUp, Lightbulb } from 'lucide-react';

function ResultsDisplay({ overlaps }) {
  if (!overlaps || overlaps.length === 0) {
    return (
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-xl font-bold text-gray-50 mb-4">Top Overlap Periods</h3>
        <p className="text-gray-400">No matching periods found. More participants needed.</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
      <h3 className="text-xl font-bold text-gray-50 mb-6 flex items-center gap-2">
        <TrendingUp size={24} className="text-blue-400" />
        Top Overlap Periods
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {overlaps.map((overlap, i) => {
          const startDate = new Date(overlap.startDate);
          const endDate = new Date(overlap.endDate);
          const formatDate = (d) => d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div key={i} className="bg-dark-800 border border-dark-700 rounded-lg p-4 hover:border-dark-700 transition">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-blue-400">{overlap.availabilityPercent}%</span>
                <span className="text-gray-400">available</span>
              </div>

              <p className="text-sm text-gray-400 mb-3">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>

              <div className="space-y-2">
                <div className="bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${overlap.availabilityPercent}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                  <span>{overlap.availableCount} of {overlap.totalParticipants} people</span>
                  <span>{overlap.dayCount} days</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300 flex items-start gap-2">
          <Lightbulb size={16} className="mt-0.5 shrink-0" />
          <span><strong>Tip:</strong> The highest percentage means the most people are available for that period.</span>
        </p>
      </div>
    </div>
  );
}

export default ResultsDisplay;
