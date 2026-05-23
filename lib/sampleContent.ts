import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAMPLE_ITEMS } from '../constants/sampleItems';
import type { SampleItem, SampleItemsResponse } from '../types/sampleItem';

const SAVED_IDS_KEY = 'saved_sample_item_ids';

function singlePageResponse(items: SampleItem[]): SampleItemsResponse {
  const count = items.length;
  return {
    items,
    pagination: {
      page: 1,
      pages: 1,
      next: null,
      prev: null,
      count,
      items: count,
      last: 1,
    },
  };
}

async function getSavedIdSet(): Promise<Set<number>> {
  const raw = await AsyncStorage.getItem(SAVED_IDS_KEY);
  if (!raw) return new Set();
  try {
    const ids = JSON.parse(raw) as number[];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

async function applySavedFlags(items: SampleItem[]): Promise<SampleItem[]> {
  const savedIds = await getSavedIdSet();
  return items.map((item) => ({
    ...item,
    saved: savedIds.has(item.id),
  }));
}

export async function getFeaturedItems(): Promise<SampleItemsResponse> {
  const items = SAMPLE_ITEMS.filter((i) => i.category === 'featured');
  return singlePageResponse(await applySavedFlags(items));
}

export async function searchByCategory(category: string): Promise<SampleItemsResponse> {
  const normalized = category.trim().toLowerCase();
  const items = SAMPLE_ITEMS.filter(
    (i) => i.category.toLowerCase() === normalized
  );
  return singlePageResponse(await applySavedFlags(items));
}

export async function searchByQuery(query: string): Promise<SampleItemsResponse> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return singlePageResponse(await applySavedFlags([...SAMPLE_ITEMS]));
  }
  const items = SAMPLE_ITEMS.filter(
    (i) =>
      i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q)
  );
  return singlePageResponse(await applySavedFlags(items));
}

export async function getItemById(id: number): Promise<SampleItem | null> {
  const item = SAMPLE_ITEMS.find((i) => i.id === id);
  if (!item) return null;
  const [withFlag] = await applySavedFlags([item]);
  return withFlag;
}

export async function getSavedItems(): Promise<SampleItemsResponse> {
  const savedIds = await getSavedIdSet();
  const items = SAMPLE_ITEMS.filter((i) => savedIds.has(i.id));
  return singlePageResponse(items.map((i) => ({ ...i, saved: true })));
}

export async function toggleSaved(id: number): Promise<boolean> {
  const savedIds = await getSavedIdSet();
  const nextSaved = !savedIds.has(id);
  if (nextSaved) {
    savedIds.add(id);
  } else {
    savedIds.delete(id);
  }
  await AsyncStorage.setItem(SAVED_IDS_KEY, JSON.stringify([...savedIds]));
  return nextSaved;
}

export function formatItemForMessage(item: SampleItem): string {
  return `${item.title}\n${item.body}`;
}
