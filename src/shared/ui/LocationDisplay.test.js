import React from 'react';
import { render, screen } from '@testing-library/react';
import LocationDisplay from './LocationDisplay';

describe('LocationDisplay', () => {
  test('renders nothing if location is null', () => {
    const { container } = render(<LocationDisplay location={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders formatted address', () => {
    render(<LocationDisplay location={{ formattedAddress: '123 Main St', placeId: 'abc' }} />);
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  test('renders Google Maps link with placeId', () => {
    render(<LocationDisplay location={{ formattedAddress: '123 Main St', placeId: 'abc123' }} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://maps.google.com/?q=place_id:abc123');
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('uses address in link if no placeId', () => {
    render(<LocationDisplay location={{ formattedAddress: 'Some Place', placeId: null }} />);
    const link = screen.getByRole('link');
    expect(link.href).toContain('q=Some%20Place');
  });
});
