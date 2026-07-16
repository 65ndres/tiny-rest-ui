import React from 'react';
import SessionHistoryPanel from '@/app/sharedComponents/SessionHistoryPanel';
import type { TimerSession } from '@/app/utils/timerHistory';

type TimerHistoryPanelProps = {
  sessions: TimerSession[];
  isLoading: boolean;
};

const TimerHistoryPanel: React.FC<TimerHistoryPanelProps> = ({
  sessions,
  isLoading,
}) => (
  <SessionHistoryPanel
    sessions={sessions}
    isLoading={isLoading}
    emptyMessage="No submitted timers yet."
    variant="sleep"
  />
);

export default TimerHistoryPanel;
