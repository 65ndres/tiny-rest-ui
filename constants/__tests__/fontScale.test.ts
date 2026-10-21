import type { ReactElement } from 'react';
import {
  appliedFontScale,
  layout,
  lineHeightFor,
  MAX_FONT_SCALE,
} from '@/app/constants/screenLayout';
import { Text as AppText, TextInput as AppTextInput } from '@/components/AppText';
import { Text as UIText } from '@/components/ui/text';

// gluestack's style helpers ship as ESM that Jest does not transform; the
// class names do not matter here.
jest.mock('@/components/ui/text/styles', () => ({ textStyle: () => '' }));

type ForwardRefWithRender = {
  render: (props: Record<string, unknown>, ref: unknown) => ReactElement<{
    maxFontSizeMultiplier?: number;
  }>;
};

// Calls a forwardRef component's render function to inspect the props it
// passes down to the native Text.
const renderedProps = (component: unknown, props: Record<string, unknown> = {}) =>
  (component as ForwardRefWithRender).render(props, null).props;

describe('font scale limit', () => {
  it('allows only a small increase over the default text size', () => {
    expect(MAX_FONT_SCALE).toBeGreaterThan(1);
    expect(MAX_FONT_SCALE).toBeLessThanOrEqual(1.3);
  });

  it('limits the system font scale to the allowed range', () => {
    expect(appliedFontScale(0.8)).toBe(1);
    expect(appliedFontScale(1.1)).toBe(1.1);
    expect(appliedFontScale(2)).toBe(MAX_FONT_SCALE);
  });

  it('gives every font size a taller line height', () => {
    const fontSizes = Object.entries(layout)
      .filter(([name]) => name.startsWith('font'))
      .map(([, size]) => size);

    expect(fontSizes.length).toBeGreaterThan(0);
    for (const size of fontSizes) {
      expect(lineHeightFor(size)).toBeGreaterThan(size);
    }
  });
});

describe('text components', () => {
  it.each([
    ['AppText Text', AppText],
    ['AppText TextInput', AppTextInput],
    ['gluestack Text', UIText],
  ])('%s limits text scaling by default', (_name, component) => {
    expect(renderedProps(component).maxFontSizeMultiplier).toBe(MAX_FONT_SCALE);
  });

  it.each([
    ['AppText Text', AppText],
    ['gluestack Text', UIText],
  ])('%s lets a caller override the limit', (_name, component) => {
    expect(
      renderedProps(component, { maxFontSizeMultiplier: 1 }).maxFontSizeMultiplier
    ).toBe(1);
  });
});
