import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SchemaMarkup({ type, content = {}, group }) {
    const schemas = [];
    const effectiveType = type || group?.eventType || 'vacation';

    // 1. SoftwareApplication (Home/VACATION is core utility)
    if (effectiveType === 'vacation') {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Find A Day",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "description": "Free group scheduling tool. Everyone marks their availability, the algorithm finds the best overlapping dates."
        });
    }

    // 2. Event schema for group pages with location data
    if (group?.location) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": group.name || "Group Event",
            "location": {
                "@type": "Place",
                "name": group.location.name || group.location.formattedAddress,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": group.location.street || "",
                    "addressLocality": group.location.city || "",
                    "addressCountry": group.location.country || ""
                },
                ...(group.location.lat && group.location.lng && {
                    "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": group.location.lat,
                        "longitude": group.location.lng
                    }
                })
            }
        });
    }

    // 3. FAQ schema for all pages with questions
    if (content.faqs && content.faqs.length > 0) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": content.faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
            }))
        });
    }

    // 4. HowTo schema for use case pages
    if (effectiveType && effectiveType !== 'doodle' && effectiveType !== 'when2meet' && effectiveType !== 'vacation') {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": `How to Find the Best Date for ${effectiveType.charAt(0).toUpperCase() + effectiveType.slice(1)}`,
            "step": [
                { "@type": "HowToStep", "text": "Create an event and set your date range" },
                { "@type": "HowToStep", "text": "Share the link with your group" },
                { "@type": "HowToStep", "text": "Everyone marks their available dates" },
                { "@type": "HowToStep", "text": "See the best overlapping dates instantly" }
            ]
        });
    }

    return (
        <Helmet>
            {schemas.map((schema, index) => (
                <script key={index} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}
        </Helmet>
    );
}
