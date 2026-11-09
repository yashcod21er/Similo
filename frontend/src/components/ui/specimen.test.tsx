import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { Section } from '@/components/marketing/sections';
import { Photo } from './Photo';
import { CornerBrackets, Exhibit, FigCaption, MonoLabel, RegMarks } from './specimen';

describe('specimen primitives', () => {
  it('MonoLabel is mono microtype in the tone colour, and a caller colour replaces it', () => {
    const { rerender } = render(<MonoLabel>Case 14</MonoLabel>);
    expect(screen.getByText('Case 14')).toHaveClass('text-micro', 'text-muted');
    rerender(<MonoLabel tone="orange">Case 14</MonoLabel>);
    expect(screen.getByText('Case 14')).toHaveClass('text-white');
    rerender(<MonoLabel className="text-accent-ink">Case 14</MonoLabel>);
    expect(screen.getByText('Case 14')).toHaveClass('text-accent-ink');
    expect(screen.getByText('Case 14')).not.toHaveClass('text-muted');
  });

  it('CornerBrackets and RegMarks are decorative, four marks each, and take an inset', () => {
    const { container } = render(
      <div>
        <CornerBrackets className="-inset-2" />
        <RegMarks />
      </div>,
    );
    const [brackets, marks] = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(brackets?.children).toHaveLength(4);
    expect(marks?.children).toHaveLength(4);
    expect(brackets).toHaveClass('-inset-2');
    expect(brackets).not.toHaveClass('inset-0');
    expect(marks).toHaveClass('inset-0');
  });

  it('Exhibit shows its label, content and caption', () => {
    render(
      <Exhibit label="Exhibit A" caption="Your page">
        <p>the page</p>
      </Exhibit>,
    );
    expect(screen.getByText('Exhibit A')).toBeInTheDocument();
    expect(screen.getByText('the page')).toBeInTheDocument();
    expect(screen.getByText('Your page')).toBeInTheDocument();
  });

  it('FigCaption numbers the figure', () => {
    render(<FigCaption index="02">Sample data</FigCaption>);
    expect(screen.getByText(/FIG\. 02/)).toHaveTextContent('FIG. 02 — Sample data');
  });
});

describe('Section tones', () => {
  it('keeps the old tone names working and adds orange', () => {
    const { container, rerender } = render(<Section tone="dark">x</Section>);
    expect(container.firstElementChild).toHaveClass('bg-night');
    rerender(<Section tone="night">x</Section>);
    expect(container.firstElementChild).toHaveClass('bg-night');
    rerender(<Section tone="orange">x</Section>);
    expect(container.firstElementChild).toHaveClass('bg-accent', 'text-white');
    rerender(<Section tone="white">x</Section>);
    expect(container.firstElementChild).toHaveClass('bg-white');
    rerender(<Section>x</Section>);
    expect(container.firstElementChild).not.toHaveClass('bg-night');
  });

  it('scaffold adds decorative hairlines and registration marks only when asked', () => {
    const { container, rerender } = render(<Section>x</Section>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    rerender(<Section scaffold>x</Section>);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    expect(container.firstElementChild).toHaveClass('relative');
  });
});

describe('photo treatment', () => {
  const props = { src: '/images/x', alt: 'People at a desk', width: 800, height: 600 };

  it('PhotoFrame defaults to duotone; Photo defaults to none so screenshots stay honest', () => {
    const { rerender } = render(<PhotoFrame {...props} />);
    expect(screen.getByAltText('People at a desk')).toHaveClass('photo-duotone');
    rerender(<PhotoFrame {...props} treatment="halftone" />);
    expect(screen.getByAltText('People at a desk')).toHaveClass('photo-halftone');
    rerender(<PhotoFrame {...props} treatment="none" />);
    expect(screen.getByAltText('People at a desk')).not.toHaveClass('photo-duotone');
    rerender(<Photo {...props} />);
    expect(screen.getByAltText('People at a desk')).not.toHaveClass('photo-duotone');
  });
});
