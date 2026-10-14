import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock getBBox for SVG elements in jsdom
if (typeof SVGElement !== 'undefined' && !SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 120,
    height: 80,
    bottom: 80,
    left: 0,
    right: 120,
    top: 0,
    toJSON: () => {},
  });
}

// Mock mermaid in test environment to avoid jsdom layout hangs
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockImplementation(async (id: string, content: string) => {
      return { svg: `<svg id="${id}" data-testid="mermaid-svg"><text>${content}</text></svg>` };
    }),
  },
}));
