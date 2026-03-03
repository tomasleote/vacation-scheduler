import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from './Footer';

describe('Footer Component', () => {
    it('renders the branding text and description', () => {
        render(<Footer />);
        expect(screen.getByText('Vacation Scheduler')).toBeInTheDocument();
        expect(screen.getByText(/A seamless way to organize group trips/i)).toBeInTheDocument();
    });

    it('renders contact email mailto link', () => {
        render(<Footer />);
        const link = screen.getByRole('link', { name: /vacationscheduler\.info@gmail\.com/i });
        expect(link).toHaveAttribute('href', 'mailto:vacationscheduler.info@gmail.com');
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
