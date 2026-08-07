jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import axios from 'axios';
import {
  getTimerApiErrorMessage,
  isValidTimerStartTime,
  START_TIME_FUTURE_MESSAGE,
} from '../timerHistory';

describe('isValidTimerStartTime', () => {
  const now = new Date('2026-08-07T15:00:00.000Z');

  it('allows past and current start times', () => {
    expect(
      isValidTimerStartTime(new Date('2026-08-07T14:59:00.000Z'), now)
    ).toBe(true);
    expect(isValidTimerStartTime(now, now)).toBe(true);
  });

  it('allows start within 60s clock skew', () => {
    expect(
      isValidTimerStartTime(new Date('2026-08-07T15:00:30.000Z'), now)
    ).toBe(true);
  });

  it('rejects start more than 60s in the future', () => {
    expect(
      isValidTimerStartTime(new Date('2026-08-07T15:02:00.000Z'), now)
    ).toBe(false);
  });
});

describe('getTimerApiErrorMessage start_time future', () => {
  const fallback = 'Could not submit timer. Please try again.';

  it('maps errors array for future start_time', () => {
    const error = new axios.AxiosError('Unprocessable');
    error.response = {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: {} as never,
      data: { errors: ['Start time cannot be in the future'] },
    };

    expect(getTimerApiErrorMessage(error, fallback)).toBe(
      START_TIME_FUTURE_MESSAGE
    );
  });

  it('maps error string for future start_time', () => {
    const error = new axios.AxiosError('Unprocessable');
    error.response = {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: {} as never,
      data: { error: 'Start time cannot be in the future' },
    };

    expect(getTimerApiErrorMessage(error, fallback)).toBe(
      START_TIME_FUTURE_MESSAGE
    );
  });
});
