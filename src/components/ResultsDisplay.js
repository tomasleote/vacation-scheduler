import React from 'react';
import { TrendingUp } from 'lucide-react';

function ResultsDisplay({ overlaps }) {
  if (!overlaps || overlaps.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Top Overlap Periods</h3>
        <p className="text-gray-600">No matching periods found. More participants needed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp size={24} className="text-green-600" />
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
            <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-indigo-600">{overlap.availabilityPercent}%</span>
                <span className="text-gray-600">available</span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>

              <div className="space-y-2">
                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${overlap.availabilityPercent}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-600">
                  <span>{overlap.availableCount} of {overlap.totalParticipants} people</span>
                  <span>{overlap.dayCount} days</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> The highest percentage means the most people are available for that period.
        </p>
      </div>
    </div>
  );
}

export default ResultsDisplay;
