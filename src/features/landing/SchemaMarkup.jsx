import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SchemaMarkup({ type, content }) {
    const schemas = [];

    // 1. SoftwareApplication (Home/VACATION is core utility)
    if (type === 'vacation') {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "FindADate",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "description": "Free group scheduling tool. Everyone marks their availability, the algorithm finds the best overlapping dates."
        });
    }

    // 2. FAQ schema for all pages with questions
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

    // 3. HowTo schema for use case pages
    if (type !== 'doodle' && type !== 'when2meet') {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": `How to Find the Best Date for ${type.charAt(0).toUpperCase() + type.slice(1)}`,
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
