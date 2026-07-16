import React from 'react';
import SessionHistoryPanel from '@/app/sharedComponents/SessionHistoryPanel';
import type { TimerSession } from '@/app/utils/timerHistory';

type TimerHistoryPanelProps = {
  sessions: TimerSession[];
  isLoading: boolean;
  onSessionDeleted?: (sessionId: string) => void;
};

const TimerHistoryPanel: React.FC<TimerHistoryPanelProps> = ({
  sessions,
  isLoading,
  onSessionDeleted,
}) => (
  <SessionHistoryPanel
    sessions={sessions}
    isLoading={isLoading}
    emptyMessage="No submitted timers yet."
    variant="sleep"
    onSessionDeleted={onSessionDeleted}
  />
);

export default TimerHistoryPanel;
