#!/bin/bash
set -e
echo "=== Find-a-Day Stress Tests ==="
echo ""

echo "--- Unit Performance Benchmarks ---"
npx react-scripts test --watchAll=false \
    --testPathPattern="src/tests/stress/(overlap-performance|heatmap-performance|data-size)" \
    --verbose

echo ""
echo "--- Integration Tests (requires Firebase Emulator) ---"
echo "To run: firebase emulators:exec 'npm run test:stress:integration'"

echo ""
echo "=== Stress Tests Complete ==="
