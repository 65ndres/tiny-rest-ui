export const proPlanDisplayName = 'Promesas Pro';

export type SubscriptionPlanPerks = {
  sectionTitle: string;
  lines: readonly string[];
};

export const subscriptionPlanPerks = {
  basic: {
    sectionTitle: 'Included with Basic:',
    lines: ['Access to more verses', 'Save verses you love'],
  },
  pro: {
    sectionTitle: 'Included with Pro:',
    lines: [
      'Everything in Basic',
      'Search verses by category',
      'Start conversations with other users',
      'Share verses via in-app messaging',
      'Premium support',
    ],
  },
} satisfies Record<'basic' | 'pro', SubscriptionPlanPerks>;
