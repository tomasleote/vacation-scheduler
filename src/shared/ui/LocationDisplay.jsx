import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

function LocationDisplay({ location, showIcon = true }) {
  if (!location || !location.formattedAddress) {
    return null;
  }

  const mapsUrl = location.placeId
    ? `https://maps.google.com/?q=place_id:${location.placeId}`
    : `https://maps.google.com/?q=${encodeURIComponent(location.formattedAddress)}`;

  return (
    <div className="flex items-start gap-3">
      {showIcon && (
        <MapPin size={18} className="text-brand-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <div className="text-sm text-gray-300 mb-2">
          {location.formattedAddress}
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          Open in Google Maps
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

export default LocationDisplay;
