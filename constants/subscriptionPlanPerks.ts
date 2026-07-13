export { PRO_PLAN_DISPLAY_NAME as proPlanDisplayName } from './appBranding';

export type SubscriptionPlanPerks = {
  sectionTitle: string;
  lines: readonly string[];
};

export const subscriptionPlanPerks = {
  basic: {
    sectionTitle: 'Included with Basic:',
    lines: ['Home', 'Timer', 'Settings', 'Profile'],
  },
  pro: {
    sectionTitle: 'Included with Pro:',
    lines: [
      'Everything in Basic',
      'Timeline',
      'Soothing sounds',
      'Add feeding',
      'Premium support',
    ],
  },
} satisfies Record<'basic' | 'pro', SubscriptionPlanPerks>;
