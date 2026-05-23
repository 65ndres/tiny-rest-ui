import type { SampleItem } from '../types/sampleItem';

export const SAMPLE_ITEMS: SampleItem[] = [
  {
    id: 1,
    title: 'Sample Item — Featured 1',
    body: 'This is sample featured content. Replace this text with your own message when customizing the app.',
    category: 'featured',
  },
  {
    id: 2,
    title: 'Sample Item — Featured 2',
    body: 'Another featured sample item. Use it as a template for cards, carousels, or detail screens.',
    category: 'featured',
  },
  {
    id: 3,
    title: 'Sample Item — Featured 3',
    body: 'Featured content loads locally—no remote content API required. Wire your backend when you are ready.',
    category: 'featured',
  },
  {
    id: 4,
    title: 'Motivation — Sample 1',
    body: 'Start where you are. Use what you have. Do what you can.',
    category: 'Motivation',
  },
  {
    id: 5,
    title: 'Calm — Sample 1',
    body: 'Take a slow breath. This screen is placeholder copy for a calm category.',
    category: 'Calm',
  },
  {
    id: 6,
    title: 'Focus — Sample 1',
    body: 'One task at a time. Sample content helps you ship the UI before real data exists.',
    category: 'Focus',
  },
  {
    id: 7,
    title: 'Gratitude — Sample 1',
    body: 'List three things going well today. Swap this for your product’s gratitude prompts.',
    category: 'Gratitude',
  },
  {
    id: 8,
    title: 'Courage — Sample 1',
    body: 'Small steps still move you forward. Customize this card for your audience.',
    category: 'Courage',
  },
  {
    id: 9,
    title: 'Peace — Sample 1',
    body: 'Pause for a moment. This is neutral sample text, not tied to any scripture.',
    category: 'Peace',
  },
  {
    id: 10,
    title: 'Inspiration — Sample 1',
    body: 'Build something meaningful. This line is here so designers can preview layout.',
    category: 'Inspiration',
  },
  {
    id: 11,
    title: 'Joy — Sample 1',
    body: 'Celebrate small wins. Replace categories and copy in constants/sampleItems.ts.',
    category: 'Joy',
  },
  {
    id: 12,
    title: 'Browse — Extra Sample',
    body: 'Search and filter run against local items by title and body.',
    category: 'Motivation',
  },
];

export const BROWSE_CATEGORIES = [
  'Motivation',
  'Calm',
  'Focus',
  'Gratitude',
  'Courage',
  'Peace',
  'Inspiration',
  'Joy',
] as const;
