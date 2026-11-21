jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  addBabyDestination,
  buildBabyInput,
  formatBirthdate,
  hasBabyProfileErrors,
  hasProfileChanges,
  type ProfileSnapshot,
  validateBabyProfile,
  type BabyProfileValues,
} from '@/app/utils/babyProfileForm';
import { MAX_BABY_NAME_LENGTH } from '@/app/utils/babies';

const today = new Date(2026, 10, 21, 10, 0, 0);

const valid = (overrides: Partial<BabyProfileValues> = {}): BabyProfileValues => ({
  name: 'Lorenzo',
  birthdate: '2026-05-01',
  dayStartMinutes: 570,
  dayEndMinutes: 1320,
  ...overrides,
});

describe('validateBabyProfile', () => {
  it('accepts a complete profile', () => {
    expect(validateBabyProfile(valid(), today)).toEqual({});
  });

  it('requires a name and ignores surrounding spaces', () => {
    expect(validateBabyProfile(valid({ name: '' }), today).name).toBe(
      'Baby name is required.'
    );
    expect(validateBabyProfile(valid({ name: '   ' }), today).name).toBe(
      'Baby name is required.'
    );
    expect(validateBabyProfile(valid({ name: '  Bo  ' }), today).name).toBeUndefined();
  });

  it('limits the name to the API maximum', () => {
    const atLimit = 'a'.repeat(MAX_BABY_NAME_LENGTH);
    expect(validateBabyProfile(valid({ name: atLimit }), today).name).toBeUndefined();
    expect(
      validateBabyProfile(valid({ name: `${atLimit}a` }), today).name
    ).toMatch(/40 characters or less/);
  });

  it('requires a birthdate', () => {
    expect(validateBabyProfile(valid({ birthdate: null }), today).birthdate).toBe(
      'Birthdate is required.'
    );
  });

  it('rejects malformed birthdates', () => {
    expect(
      validateBabyProfile(valid({ birthdate: '05/01/2026' }), today).birthdate
    ).toBe('Enter a valid birthdate.');
  });

  it('accepts a baby born today but not tomorrow', () => {
    expect(
      validateBabyProfile(valid({ birthdate: '2026-11-21' }), today).birthdate
    ).toBeUndefined();
    expect(
      validateBabyProfile(valid({ birthdate: '2026-11-22' }), today).birthdate
    ).toBe("Birthdate can't be in the future.");
  });

  it('matches the API limit of five years', () => {
    expect(
      validateBabyProfile(valid({ birthdate: '2021-11-21' }), today).birthdate
    ).toBeUndefined();
    expect(
      validateBabyProfile(valid({ birthdate: '2021-11-20' }), today).birthdate
    ).toBe('Birthdate must be within the last 5 years.');
  });

  it('requires the day to end after it starts', () => {
    expect(
      validateBabyProfile(valid({ dayStartMinutes: 600, dayEndMinutes: 600 }), today)
        .dayWindow
    ).toBe('Day end must be after day start.');
    expect(
      validateBabyProfile(valid({ dayStartMinutes: 1320, dayEndMinutes: 570 }), today)
        .dayWindow
    ).toBe('Day end must be after day start.');
  });

  it('reports every problem at once', () => {
    const errors = validateBabyProfile(
      { name: '', birthdate: null, dayStartMinutes: 900, dayEndMinutes: 600 },
      today
    );
    expect(Object.keys(errors).sort()).toEqual(['birthdate', 'dayWindow', 'name']);
  });
});

describe('hasBabyProfileErrors', () => {
  it('is false only when every field passes', () => {
    expect(hasBabyProfileErrors({})).toBe(false);
    expect(hasBabyProfileErrors({ name: undefined })).toBe(false);
    expect(hasBabyProfileErrors({ birthdate: 'Birthdate is required.' })).toBe(true);
  });
});

describe('buildBabyInput', () => {
  it('builds the POST /babies payload with a trimmed name', () => {
    expect(
      buildBabyInput(valid({ name: '  Lorenzo ', dayStartMinutes: 480, dayEndMinutes: 1260 }))
    ).toEqual({
      name: 'Lorenzo',
      birthdate: '2026-05-01',
      day_start_minutes: 480,
      day_end_minutes: 1260,
    });
  });
});

describe('addBabyDestination', () => {
  it('opens the form for Pro accounts', () => {
    expect(addBabyDestination(true, 0)).toBe('form');
    expect(addBabyDestination(true, 3)).toBe('form');
  });

  it('lets free accounts add their first baby only', () => {
    expect(addBabyDestination(false, 0)).toBe('form');
    expect(addBabyDestination(false, 1)).toBe('paywall');
  });
});

describe('formatBirthdate', () => {
  it('shows the month as a number so the row does not cut off', () => {
    expect(formatBirthdate('2026-09-21', 'en-US')).toBe('9/21/2026');
    expect(formatBirthdate('2026-09-21', 'en-US')).not.toMatch(/Sep/);
  });

  it("follows the device's date order", () => {
    expect(formatBirthdate('2026-09-21', 'es-ES')).toBe('21/9/2026');
  });

  it('keeps the calendar day in any time zone', () => {
    expect(formatBirthdate('2026-01-01', 'en-US')).toBe('1/1/2026');
    expect(formatBirthdate('2026-12-31', 'en-US')).toBe('12/31/2026');
  });

  it('is empty until a valid date is picked', () => {
    expect(formatBirthdate(null)).toBe('');
    expect(formatBirthdate('not a date')).toBe('');
  });
});

describe('hasProfileChanges', () => {
  const saved: ProfileSnapshot = {
    name: 'Gaby',
    birthdate: '2024-10-14',
    dailyNapCount: 1,
    dailyNapCountAlt: null,
    dayStartMinutes: 570,
    dayEndMinutes: 1320,
  };

  it('is false until the profile has loaded', () => {
    expect(hasProfileChanges(null, saved)).toBe(false);
  });

  it('is false when nothing changed', () => {
    expect(hasProfileChanges(saved, { ...saved })).toBe(false);
  });

  it('ignores spaces around the name, which are trimmed on save', () => {
    expect(hasProfileChanges(saved, { ...saved, name: '  Gaby ' })).toBe(false);
  });

  it.each<[string, Partial<ProfileSnapshot>]>([
    ['name', { name: 'Gabriela' }],
    ['birthdate', { birthdate: '2024-10-15' }],
    ['nap count', { dailyNapCount: 2 }],
    ['alternate nap count', { dailyNapCountAlt: 2 }],
    ['day start', { dayStartMinutes: 600 }],
    ['day end', { dayEndMinutes: 1260 }],
  ])('is true when the %s changes', (_field, change) => {
    expect(hasProfileChanges(saved, { ...saved, ...change })).toBe(true);
  });
});
