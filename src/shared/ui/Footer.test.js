import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

describe('Footer', () => {
    const renderFooter = () => render(
        <MemoryRouter>
            <Footer />
        </MemoryRouter>
    );

    it('renders the FAD logo correctly', () => {
        renderFooter();
        expect(screen.getByText((content, element) => element.tagName === 'H3' && element.textContent === 'FindADate')).toBeInTheDocument();
    });

    it('renders all resource links', () => {
        renderFooter();
        // Links
        expect(screen.getByText('Documentation')).toBeInTheDocument();
        expect(screen.getByText('GitHub Repository')).toBeInTheDocument();
    });

    it('renders all contact links', () => {
        renderFooter();
        // Mail
        expect(screen.getByText('hello@findadate.app')).toBeInTheDocument();
    });

    it('renders legal links', () => {
        renderFooter();
        expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
        expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    });

    it('renders the current year in copyright', () => {
        const currentYear = new Date().getFullYear();
        renderFooter();
        expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    it('still renders anchors correctly without callbacks', () => {
        renderFooter();
        expect(screen.getByText('Documentation').closest('a')).toHaveAttribute('href', '/docs');
        expect(screen.getByText('Privacy Policy').closest('a')).toHaveAttribute('href', '/privacy');
        expect(screen.getByText('Terms of Service').closest('a')).toHaveAttribute('href', '/terms');
    });
});
