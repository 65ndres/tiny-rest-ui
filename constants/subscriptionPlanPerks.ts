export { PRO_PLAN_DISPLAY_NAME as proPlanDisplayName } from './appBranding';

export type SubscriptionPlanPerks = {
  sectionTitle: string;
  lines: readonly string[];
};

export const subscriptionPlanPerks = {
  basic: {
    sectionTitle: 'Included with Basic:',
    lines: ['Sleep tracking', 'Nap time prediction'],
  },
  pro: {
    sectionTitle: 'Included with Pro:',
    lines: [
      'Everything in Basic',
      'Feeding tracking',
      'Timeline of entries',
      'Soothing sounds',
      'Premium support',
    ],
  },
} satisfies Record<'basic' | 'pro', SubscriptionPlanPerks>;
