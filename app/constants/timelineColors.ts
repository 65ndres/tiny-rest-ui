import type { TimelineSegmentKind } from '@/app/utils/weekTimeline';

// Sleep picks up the lilac and pink of the background clouds; feedings use
// the app's gold (the "14-day free trial" highlight on the landing screen)
// with a paler shade for nursing.
export const NIGHT_COLOR = '#C9B6FF';
export const NAP_COLOR = '#FF9EC4';
export const NURSING_COLOR = '#FFEB99';
export const BOTTLE_COLOR = '#FFD700';

export const SEGMENT_COLORS: Record<TimelineSegmentKind, string> = {
  night: NIGHT_COLOR,
  nap: NAP_COLOR,
  nursing: NURSING_COLOR,
  bottle: BOTTLE_COLOR,
};
