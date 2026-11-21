jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const mockUpdateUserProfile = jest.fn();
jest.mock('@/app/utils/userProfile', () => ({
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}));

jest.mock('@/app/screens/onboarding/OnboardingSlideShell', () => {
  const { View } = require('react-native');
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

jest.mock('@/app/sharedComponents/TimerDateTimePickerDrawer', () => {
  const { View } = require('react-native');
  return (props: { title: string }) => <View testID={`picker:${props.title}`} {...props} />;
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Alert, Text } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import BabyProfileSlide from '@/app/screens/onboarding/BabyProfileSlide';

const render = (props: Partial<React.ComponentProps<typeof BabyProfileSlide>> = {}) => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <BabyProfileSlide
        babyName="Gaby"
        babyBirthdate="2026-03-10"
        onBabyNameChange={jest.fn()}
        onBabyBirthdateChange={jest.fn()}
        {...props}
      />
    );
  });
  return tree;
};

const pressNext = (tree: ReactTestRenderer) =>
  act(async () => {
    tree.root
      .find(
        (node) =>
          node.props.accessibilityLabel === 'Next' && typeof node.props.onPress === 'function'
      )
      .props.onPress();
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.setItem('token', 'test-token');
});

describe('BabyProfileSlide (onboarding)', () => {
  it('keeps its onboarding wording on the shared form', () => {
    const tree = render();
    const labels = tree.root
      .findAll((node) => node.type === Text)
      .map((node) => node.props.children);
    expect(labels).toEqual(expect.arrayContaining(['Tell us about baby', 'Next']));
  });

  it('saves the first baby through the profile and moves on', async () => {
    mockUpdateUserProfile.mockResolvedValue({});
    const onPressNext = jest.fn();
    const tree = render({ onPressNext });

    await pressNext(tree);

    expect(mockUpdateUserProfile).toHaveBeenCalledWith('test-token', {
      baby_name: 'Gaby',
      baby_birthdate: '2026-03-10',
      day_start_minutes: 570,
      day_end_minutes: 1320,
    });
    expect(onPressNext).toHaveBeenCalled();
  });

  it('does not save or advance without a birthdate', async () => {
    const onPressNext = jest.fn();
    const tree = render({ babyBirthdate: null, onPressNext });

    await pressNext(tree);

    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    expect(onPressNext).not.toHaveBeenCalled();
  });

  it('stays on the slide and explains when saving fails', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockUpdateUserProfile.mockRejectedValue(new Error('offline'));
    const onPressNext = jest.fn();
    const tree = render({ onPressNext });

    await pressNext(tree);

    expect(onPressNext).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Error', 'Could not save baby details. Please try again.');
  });
});
