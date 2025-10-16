import type { ImgHTMLAttributes } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { withTemplatePreview } from '@/lib/templates';
import { getPreviewSrc } from '@/lib/templates/getPreviewSrc';

jest.mock('@/lib/templates/getPreviewSrc', () => {
  const actual = jest.requireActual('@/lib/templates/getPreviewSrc');
  return {
    ...actual,
    getPreviewSrc: jest.fn(actual.getPreviewSrc),
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt,
    onLoadingComplete,
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    onLoadingComplete?: (img: HTMLImageElement) => void;
  }) => (
    <img
      alt={alt}
      {...props}
      onLoad={(event) => {
        props.onLoad?.(event);
        if (typeof onLoadingComplete === 'function') {
          onLoadingComplete(event.currentTarget);
        }
      }}
    />
  ),
}));

const baseTemplate = {
  id: 'grid-compact',
  slug: 'grid-compact',
  name: 'Grid Compact',
  preview: 'grid-compact.png',
  pageSize: 'Letter',
  allowedBlocks: ['header', 'summary'],
};

describe('TemplateCard preview rendering', () => {
  it('renders preview image when available', () => {
    const template = withTemplatePreview(baseTemplate);
    render(<TemplateCard template={template} />);

    expect(
      screen.getByRole('img', { name: /grid compact/i }),
    ).toBeInTheDocument();
  });

  it('shows fallback icon when image fails to load', () => {
    const template = withTemplatePreview(baseTemplate);
    render(<TemplateCard template={template} />);

    const image = screen.getByRole('img', { name: /grid compact/i });
    fireEvent.error(image);

    expect(screen.queryByRole('img', { name: /grid compact/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('template-fallback-icon')).toBeInTheDocument();
  });

  it('shows fallback icon when preview is missing', () => {
    const mockedGetPreviewSrc = getPreviewSrc as jest.MockedFunction<typeof getPreviewSrc>;
    mockedGetPreviewSrc.mockReturnValueOnce('');

    const template = withTemplatePreview({
      ...baseTemplate,
      preview: undefined,
    });
    render(<TemplateCard template={template} />);

    expect(screen.getByTestId('template-fallback-icon')).toBeInTheDocument();
  });
});
