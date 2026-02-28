import { exportToCSV } from './export';
import Papa from 'papaparse';

// Mock document methods for downloadCSV
const mockClick = jest.fn();
const mockSetAttribute = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  document.createElement = jest.fn().mockReturnValue({
    click: mockClick,
    setAttribute: mockSetAttribute,
    style: {}
  });
  document.body.appendChild = mockAppendChild;
  document.body.removeChild = mockRemoveChild;
});

describe('exportToCSV', () => {
  const group = {
    id: 'test-group-123',
    name: 'Summer Trip',
    startDate: '2024-06-01',
    endDate: '2024-06-15',
    createdAt: '2024-01-15T10:00:00Z'
  };

  const participants = [
    {
      name: 'Alice',
      email: 'alice@example.com',
      duration: 5,
      availableDays: ['2024-06-01', '2024-06-02', '2024-06-03']
    },
    {
      name: 'Bob',
      email: '',
      duration: 3,
      availableDays: ['2024-06-05', '2024-06-06']
    }
  ];

  const overlaps = [
    {
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-03'),
      dayCount: 3,
      availableCount: 2,
      totalParticipants: 2,
      availabilityPercent: 100
    }
  ];

  test('creates a download link and triggers click', () => {
    exportToCSV(group, participants, overlaps);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
  });

  test('sets correct filename', () => {
    exportToCSV(group, participants, overlaps);

    const downloadCall = mockSetAttribute.mock.calls.find(c => c[0] === 'download');
    expect(downloadCall[1]).toBe('vacation-scheduler-test-group-123.csv');
  });

  test('generates valid CSV data', () => {
    exportToCSV(group, participants, overlaps);

    const hrefCall = mockSetAttribute.mock.calls.find(c => c[0] === 'href');
    const csvContent = decodeURIComponent(hrefCall[1].replace('data:text/csv;charset=utf-8,', ''));

    // Parse the CSV to verify structure
    const parsed = Papa.parse(csvContent);
    expect(parsed.errors.length).toBe(0);
    expect(parsed.data.length).toBeGreaterThan(0);

    // Check header row exists
    expect(csvContent).toContain('Vacation Scheduler Export');
    expect(csvContent).toContain('Summer Trip');
    expect(csvContent).toContain('Alice');
    expect(csvContent).toContain('Bob');
  });

  test('handles participants with missing fields', () => {
    const sparseParticipants = [
      { name: '', email: '', duration: 0, availableDays: null },
      { duration: 3 }
    ];

    // Should not throw
    expect(() => {
      exportToCSV(group, sparseParticipants, []);
    }).not.toThrow();
  });

  test('limits overlaps to 10 in export', () => {
    const manyOverlaps = Array.from({ length: 20 }, (_, i) => ({
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-03'),
      dayCount: 3,
      availableCount: 1,
      totalParticipants: 2,
      availabilityPercent: 50
    }));

    exportToCSV(group, participants, manyOverlaps);

    const hrefCall = mockSetAttribute.mock.calls.find(c => c[0] === 'href');
    const csvContent = decodeURIComponent(hrefCall[1].replace('data:text/csv;charset=utf-8,', ''));

    // Count overlap data rows (after "TOP OVERLAP PERIODS" header + column header)
    const lines = csvContent.split('\n');
    const overlapHeaderIdx = lines.findIndex(l => l.includes('TOP OVERLAP PERIODS'));
    // Header row + 10 data rows max
    const overlapLines = lines.slice(overlapHeaderIdx + 2).filter(l => l.trim().length > 0);
    expect(overlapLines.length).toBeLessThanOrEqual(10);
  });
});
