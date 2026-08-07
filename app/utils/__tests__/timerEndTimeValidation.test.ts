jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import axios from 'axios';
import {
  getTimerApiErrorMessage,
  isValidTimerEndTime,
} from '../timerHistory';

describe('isValidTimerEndTime', () => {
  const startMs = Date.parse('2026-06-01T12:00:00.000Z');

  it('requires end after start for sleeping', () => {
    expect(
      isValidTimerEndTime({
        startMs,
        endMs: startMs + 1_000,
        runType: 'sleeping',
      })
    ).toBe(true);
    expect(
      isValidTimerEndTime({
        startMs,
        endMs: startMs,
        runType: 'sleeping',
      })
    ).toBe(false);
    expect(
      isValidTimerEndTime({
        startMs,
        endMs: startMs - 1_000,
        runType: 'sleeping',
      })
    ).toBe(false);
  });

  it('requires end after start for nursing', () => {
    expect(
      isValidTimerEndTime({
        startMs,
        endMs: startMs,
        runType: 'nursing_left',
      })
    ).toBe(false);
  });

  it('allows end equal to start for bottle feedings', () => {
    expect(
      isValidTimerEndTime({
        startMs,
        endMs: startMs,
        runType: 'bottle',
      })
    ).toBe(true);
  });

  it('rejects bottle when end is before start', () => {
    expect(
      isValidTimerEndTime({
        startMs,
        endMs: startMs - 1_000,
        runType: 'bottle',
      })
    ).toBe(false);
  });
});

describe('getTimerApiErrorMessage', () => {
  const fallback = 'Could not submit timer. Please try again.';

  it('maps errors array containing end_time validation', () => {
    const error = new axios.AxiosError('Unprocessable');
    error.response = {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: {} as never,
      data: { errors: ['End time must be after start time'] },
    };

    expect(getTimerApiErrorMessage(error, fallback)).toBe(
      'End time must be after start time.'
    );
  });

  it('maps error string containing end_time validation', () => {
    const error = new axios.AxiosError('Unprocessable');
    error.response = {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: {} as never,
      data: { error: 'End time must be after start time' },
    };

    expect(getTimerApiErrorMessage(error, fallback)).toBe(
      'End time must be after start time.'
    );
  });

  it('returns joined server errors when unrelated', () => {
    const error = new axios.AxiosError('Unprocessable');
    error.response = {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: {} as never,
      data: { errors: ['Duration is required'] },
    };

    expect(getTimerApiErrorMessage(error, fallback)).toBe(
      'Duration is required'
    );
  });

  it('returns fallback for unknown errors', () => {
    expect(getTimerApiErrorMessage(new Error('boom'), fallback)).toBe(
      fallback
    );
  });
});
