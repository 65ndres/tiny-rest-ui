export const proPlanDisplayName = 'app-name Pro';

export type SubscriptionPlanPerks = {
  sectionTitle: string;
  lines: readonly string[];
};

export const subscriptionPlanPerks = {
  basic: {
    sectionTitle: 'Included with Basic:',
    lines: ['Access to more sample items', 'Save items you like'],
  },
  pro: {
    sectionTitle: 'Included with Pro:',
    lines: [
      'Everything in Basic',
      'Browse sample items by category',
      'Start conversations with other users',
      'Share sample items via in-app messaging',
      'Premium support',
    ],
  },
} satisfies Record<'basic' | 'pro', SubscriptionPlanPerks>;
