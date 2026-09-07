export { PRO_PLAN_DISPLAY_NAME as proPlanDisplayName } from './appBranding';

export type SubscriptionPlanPerks = {
  sectionTitle: string;
  lines: readonly string[];
};

export const PLAN_COMPARISON_FEATURES = [
  { label: 'Sleep tracking', includedInBasic: true },
  { label: 'Nap time prediction', includedInBasic: true },
  { label: 'Feeding tracking', includedInBasic: false },
  { label: 'Timeline of entries', includedInBasic: false },
  { label: 'Soothing sounds', includedInBasic: false },
  { label: 'Premium support', includedInBasic: false },
] as const;

export const subscriptionPlanPerks = {
  basic: {
    sectionTitle: 'Included with Basic:',
    lines: PLAN_COMPARISON_FEATURES.filter((feature) => feature.includedInBasic).map(
      (feature) => feature.label
    ),
  },
  pro: {
    sectionTitle: 'Included with Pro:',
    lines: PLAN_COMPARISON_FEATURES.map((feature) => feature.label),
  },
} satisfies Record<'basic' | 'pro', SubscriptionPlanPerks>;
