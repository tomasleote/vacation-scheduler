import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from './Footer';

describe('Footer Component', () => {
    it('renders the branding text and description', () => {
        render(<Footer />);
        expect(screen.getByText((content, element) => element.tagName === 'H3' && element.textContent === 'FindADate')).toBeInTheDocument();
        expect(screen.getByText(/Find the best date for any group event/i)).toBeInTheDocument();
    });

    it('renders contact email mailto link', () => {
        render(<Footer />);
        const link = screen.getByRole('link', { name: /hello@findadate\.app/i });
        expect(link).toHaveAttribute('href', 'mailto:hello@findadate.app');
    });

    it('renders documentation link and tests interaction', () => {
        const handleNavigate = jest.fn();
        render(<Footer onNavigateDocs={handleNavigate} />);

        const docsLink = screen.getByRole('link', { name: /Documentation/i });
        expect(docsLink).toHaveAttribute('href', '/docs');

        fireEvent.click(docsLink);
        expect(handleNavigate).toHaveBeenCalledWith('/docs');
    });

    it('renders repository link correctly', () => {
        render(<Footer />);
        const repoLink = screen.getByRole('link', { name: /GitHub Repository/i });
        expect(repoLink).toHaveAttribute('href', 'https://github.com/tomasleote/vacation-scheduler');
        expect(repoLink).toHaveAttribute('target', '_blank');
        expect(repoLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
});
