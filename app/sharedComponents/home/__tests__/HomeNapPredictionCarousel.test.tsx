jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// The real carousel animates with Reanimated; render each slide inline.
jest.mock('react-native-reanimated-carousel', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Carousel = React.forwardRef(function MockCarousel(
    props: {
      data: unknown[];
      renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
    },
    _ref: unknown,
  ) {
    return (
      <View>
        {props.data.map((item, index) => (
          <View key={index}>{props.renderItem({ item, index })}</View>
        ))}
      </View>
    );
  });
  return { __esModule: true, default: Carousel };
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import HomeNapPredictionCarousel, {
  type HomeNapPredictionSlide,
} from '@/app/sharedComponents/home/HomeNapPredictionCarousel';

const slide = (
  display: HomeNapPredictionSlide['display'],
  count = 1,
): HomeNapPredictionSlide => ({ count, display });

const running = (subtitle?: string) =>
  slide({ label: 'napping', value: '00:05:19', elapsedMs: 319000, subtitle });

const render = (slides: HomeNapPredictionSlide[], disabled: boolean) => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <HomeNapPredictionCarousel
        slides={slides}
        activeCount={1}
        onChange={jest.fn()}
        width={300}
        disabled={disabled}
      />,
    );
  });
  return tree;
};

const texts = (tree: ReactTestRenderer) =>
  tree.root
    .findAll((node) => node.type === Text)
    .map((node) => node.props.children);

describe('HomeNapPredictionCarousel', () => {
  it('shows a prediction without a nap count', () => {
    const tree = render(
      [slide({ label: 'next sleep', value: '3:00 PM' })],
      false,
    );
    expect(texts(tree)).toEqual(['next sleep', '3:00 PM']);
  });

  it('marks multiple nap schedules with dots only, no arrows', () => {
    const tree = render(
      [
        slide({ label: 'next sleep', value: '1:00 PM' }, 3),
        slide({ label: 'next sleep', value: '3:00 PM' }, 4),
      ],
      false
    );
    const dots = tree.root.findAll(
      (node) =>
        node.type === View &&
        typeof node.props.className === 'string' &&
        node.props.className.includes('rounded-full')
    );
    expect(dots).toHaveLength(2);
    expect(
      tree.root.findAll((node) => /Previous nap schedule|Next nap schedule/.test(node.props.accessibilityLabel ?? ''))
    ).toHaveLength(0);
  });

  it('lets screen readers change schedule without the arrows', () => {
    const tree = render(
      [
        slide({ label: 'next sleep', value: '1:00 PM' }, 3),
        slide({ label: 'next sleep', value: '3:00 PM' }, 4),
      ],
      false
    );
    const adjustable = tree.root.find(
      (node) => node.props.accessibilityRole === 'adjustable' && node.type === View
    );
    expect(adjustable.props.accessibilityLabel).toBe('Nap schedule');
    expect(adjustable.props.accessibilityValue.text).toBe(
      'next sleep 1:00 PM, schedule 1 of 2'
    );
  });

  it('hides the dots while a timer runs', () => {
    const tree = render([running(), { ...running(), count: 2 }], true);
    expect(
      tree.root.findAll(
        (node) =>
          node.type === View &&
          typeof node.props.className === 'string' &&
          node.props.className.includes('rounded-full')
      )
    ).toHaveLength(0);
  });

  it('draws a running timer as an HOURS / MIN / SEC clock', () => {
    const tree = render([running()], true);
    expect(texts(tree)).toEqual([
      'napping',
      '00',
      'HOURS',
      ':',
      '05',
      'MIN',
      ':',
      '19',
      'SEC',
    ]);
  });

  it('centers the content in the full panel height', () => {
    const tree = render([running()], true);
    const label = tree.root.find(
      (node) => node.type === Text && node.props.children === 'napping',
    );
    const slideView = tree.root.find(
      (node) =>
        node.type === View &&
        typeof node.props.className === 'string' &&
        node.props.className.includes('justify-center') &&
        typeof StyleSheet.flatten(node.props.style)?.height === 'number' &&
        node.findAll((child) => child === label).length > 0,
    );
    expect(StyleSheet.flatten(slideView.props.style).height).toBeGreaterThan(0);
  });

  it('keeps "Paused" under the clock', () => {
    const tree = render([running('Paused')], true);
    expect(texts(tree).at(-1)).toBe('Paused');
  });
});
