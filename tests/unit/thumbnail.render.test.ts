import { renderThumbnail } from '@/lib/thumbnail/renderThumbnail';
import { clearThumbnailCache, getCachedThumbnail, setCachedThumbnail } from '@/lib/thumbnail/cache';

const toDataURL = jest.fn(() => 'data:image/png;base64,mock');
const mockCanvas = {
  toDataURL,
  width: 400,
  height: 300
};

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(mockCanvas)),
}));

const html2canvas = require('html2canvas').default as jest.Mock;

describe('renderThumbnail', () => {
  beforeEach(() => {
    clearThumbnailCache();
    html2canvas.mockClear();
    toDataURL.mockClear();
  });

  it('renders and caches thumbnail output', async () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'clientWidth', { value: 400 });

    const first = await renderThumbnail(element, {
      documentId: 'resume-1',
      lastUpdated: 100,
      cacheResult: true,
    });

    expect(first).toBe('data:image/png;base64,mock');
    expect(html2canvas).toHaveBeenCalledTimes(1);
    expect(html2canvas).toHaveBeenCalledWith(element, expect.any(Object));

    const second = await renderThumbnail(element, {
      documentId: 'resume-1',
      lastUpdated: 100,
      cacheResult: true,
    });

    expect(second).toBe('data:image/png;base64,mock');
    expect(html2canvas).toHaveBeenCalledTimes(1);
  });

  it('invalidates cache when lastUpdated changes', async () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'clientWidth', { value: 400 });

    const first = await renderThumbnail(element, {
      documentId: 'resume-2',
      lastUpdated: 200,
      cacheResult: true,
    });

    expect(first).toBe('data:image/png;base64,mock');
    expect(html2canvas).toHaveBeenCalledTimes(1);

    const second = await renderThumbnail(element, {
      documentId: 'resume-2',
      lastUpdated: 201,
      cacheResult: true,
    });

    expect(second).toBe('data:image/png;base64,mock');
    expect(html2canvas).toHaveBeenCalledTimes(2);
  });

  it('evicts least recently used entries when capacity is exceeded', () => {
    for (let i = 0; i < 105; i += 1) {
      setCachedThumbnail(`resume-${i}`, i, `data:image/png;base64,${i}`);
    }

    expect(getCachedThumbnail('resume-0', 0)).toBeNull();
    expect(getCachedThumbnail('resume-104', 104)).toBe(`data:image/png;base64,104`);
  });

  it('bypasses cache when cacheResult is false', async () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'clientWidth', { value: 400 });

    const first = await renderThumbnail(element, {
      documentId: 'resume-3',
      lastUpdated: 300,
      cacheResult: false,
    });

    expect(first).toBe('data:image/png;base64,mock');
    expect(html2canvas).toHaveBeenCalledTimes(1);

    const second = await renderThumbnail(element, {
      documentId: 'resume-3',
      lastUpdated: 300,
      cacheResult: false,
    });

    expect(second).toBe('data:image/png;base64,mock');
    expect(html2canvas).toHaveBeenCalledTimes(2);
  });
});
