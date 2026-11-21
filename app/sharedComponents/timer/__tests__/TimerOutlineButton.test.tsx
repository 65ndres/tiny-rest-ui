jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

import React from 'react';
import { StyleSheet } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { TIMER_SOLID_BUTTON_CONTENT_COLOR } from '@/app/constants/screenLayout';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';

const render = (props: Partial<React.ComponentProps<typeof TimerOutlineButton>>) => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <TimerOutlineButton label="Delete profile" onPress={jest.fn()} {...props} />
    );
  });
  return tree;
};

// NativeWind wraps the primitives, so find nodes by their props.
const button = (tree: ReactTestRenderer) =>
  tree.root.find(
    (node) => node.props.accessibilityRole === 'button' && 'className' in node.props
  );
const labelColor = (tree: ReactTestRenderer) =>
  StyleSheet.flatten(
    tree.root.find((node) => node.props.children === 'Delete profile' && node.props.style)
      .props.style
  ).color;

describe('TimerOutlineButton', () => {
  it('draws the destructive variant red with white text', () => {
    const tree = render({ variant: 'destructive' });
    expect(button(tree).props.className).toContain('bg-error-600');
    expect(button(tree).props.className).toContain('border-error-600');
    expect(labelColor(tree)).toBe('white');
  });

  it('keeps the other variants as they were', () => {
    expect(button(render({ variant: 'outline' })).props.className).not.toContain('error');
    expect(button(render({ variant: 'solid' })).props.className).toContain('bg-white');
    expect(labelColor(render({ variant: 'solid' }))).toBe(TIMER_SOLID_BUTTON_CONTENT_COLOR);
  });

  it('still calls onPress when tapped', () => {
    const onPress = jest.fn();
    const tree = render({ variant: 'destructive', onPress });
    act(() => {
      button(tree).props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });
});
