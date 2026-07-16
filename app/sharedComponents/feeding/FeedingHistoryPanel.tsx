import React from 'react';
import SessionHistoryPanel from '@/app/sharedComponents/SessionHistoryPanel';
import type { TimerSession } from '@/app/utils/timerHistory';

type FeedingHistoryPanelProps = {
  sessions: TimerSession[];
  isLoading: boolean;
};

const FeedingHistoryPanel: React.FC<FeedingHistoryPanelProps> = ({
  sessions,
  isLoading,
}) => (
  <SessionHistoryPanel
    sessions={sessions}
    isLoading={isLoading}
    emptyMessage="No feedings recorded yet."
    variant="feeding"
  />
);

export default FeedingHistoryPanel;
