import { MAX_BABY_NAME_LENGTH, type BabyInput } from '@/app/utils/babies';

/** What the baby profile form (onboarding and Add baby) collects. */
export type BabyProfileValues = {
  name: string;
  /** YYYY-MM-DD, or null until picked. */
  birthdate: string | null;
  dayStartMinutes: number;
  dayEndMinutes: number;
};

export type BabyProfileErrors = {
  name?: string;
  birthdate?: string;
  dayWindow?: string;
};

/** Matches the API: a birthdate must be within the last 5 years. */
export const MAX_BABY_AGE_YEARS = 5;

const parseIsoDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Birthdate for display in a form row, with the month as a number
 * ("9/21/2026" in the US) so it fits beside its label without cutting off.
 */
export const formatBirthdate = (
  value: string | null,
  locale?: string
): string => {
  const date = value ? parseIsoDate(value) : null;
  if (!date) return '';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
};

/**
 * Validates the form before it is sent. Mirrors the API's Baby validations so
 * mistakes show inline instead of as a generic save error.
 */
export const validateBabyProfile = (
  values: BabyProfileValues,
  today: Date = new Date()
): BabyProfileErrors => {
  const errors: BabyProfileErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = 'Baby name is required.';
  } else if (name.length > MAX_BABY_NAME_LENGTH) {
    errors.name = `Name must be ${MAX_BABY_NAME_LENGTH} characters or less.`;
  }

  const birthdate = values.birthdate ? parseIsoDate(values.birthdate) : null;
  if (!values.birthdate) {
    errors.birthdate = 'Birthdate is required.';
  } else if (!birthdate) {
    errors.birthdate = 'Enter a valid birthdate.';
  } else {
    const todayStart = startOfDay(today);
    const oldest = new Date(todayStart);
    oldest.setFullYear(oldest.getFullYear() - MAX_BABY_AGE_YEARS);
    if (startOfDay(birthdate) > todayStart) {
      errors.birthdate = "Birthdate can't be in the future.";
    } else if (startOfDay(birthdate) < oldest) {
      errors.birthdate = `Birthdate must be within the last ${MAX_BABY_AGE_YEARS} years.`;
    }
  }

  if (values.dayStartMinutes >= values.dayEndMinutes) {
    errors.dayWindow = 'Day end must be after day start.';
  }

  return errors;
};

export const hasBabyProfileErrors = (errors: BabyProfileErrors): boolean =>
  Object.values(errors).some(Boolean);

/** The POST /babies payload for a validated form. */
export const buildBabyInput = (values: BabyProfileValues): BabyInput => ({
  name: values.name.trim(),
  birthdate: values.birthdate,
  day_start_minutes: values.dayStartMinutes,
  day_end_minutes: values.dayEndMinutes,
});

/**
 * What "Add baby" in the switcher does: free accounts can have one baby, so a
 * second one goes through the paywall instead of the form.
 */
export const addBabyDestination = (
  isProUser: boolean,
  babyCount: number
): 'form' | 'paywall' => (isProUser || babyCount === 0 ? 'form' : 'paywall');
