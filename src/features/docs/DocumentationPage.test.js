import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DocumentationPage from './DocumentationPage';

describe('DocumentationPage Component', () => {
    beforeEach(() => {
        // Mock global scrollTo
        window.scrollTo = jest.fn();
    });

    it('renders the header and core concepts', () => {
        render(
            <MemoryRouter>
                <DocumentationPage />
            </MemoryRouter>
        );
        // Header
        expect(screen.getByRole('heading', { level: 1, name: /Documentation/i })).toBeInTheDocument();

        // Sections
        expect(screen.getByRole('heading', { level: 2, name: /Introduction/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Core Concepts Explained/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Full Workflow Guide/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Features & Edge Cases/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Frequently Asked Questions/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Technical Transparency/i })).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked (if provided)', () => {
        const handleBack = jest.fn();
        render(
            <MemoryRouter>
                <DocumentationPage onBack={handleBack} />
            </MemoryRouter>
        );

        const backBtn = screen.getByRole('button', { name: /Go Back/i });
        fireEvent.click(backBtn);

        expect(handleBack).toHaveBeenCalledTimes(1);
    });
});
