import React from 'react';
import { render, screen } from '@testing-library/react';
import TruncatedText from './TruncatedText';

describe('TruncatedText', () => {
    it('renders nothing when text is empty', () => {
        const { container } = render(<TruncatedText text="" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the text with title attribute for hover', () => {
        render(<TruncatedText text="Very long name that needs truncation" />);
        // The span itself should have the text content
        const element = screen.getByText('Very long name that needs truncation');
        expect(element).toBeInTheDocument();
        // Verify the native title attribute is set
        expect(element).toHaveAttribute('title', 'Very long name that needs truncation');
    });

    it('applies default classes and maxWidth', () => {
        render(<TruncatedText text="Hello World" />);
        const element = screen.getByText('Hello World');
        expect(element).toHaveClass('block', 'truncate');
        expect(element).toHaveStyle('max-width: 100%');
    });

    it('applies custom className and maxWidth', () => {
        render(<TruncatedText text="Custom Style" className="text-red-500" maxWidth="150px" />);
        const element = screen.getByText('Custom Style');
        expect(element).toHaveClass('block', 'truncate', 'text-red-500');
        expect(element).toHaveStyle('max-width: 150px');
    });
});
