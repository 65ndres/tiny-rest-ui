export type SampleItem = {
  id: number;
  title: string;
  body: string;
  category: string;
  saved?: boolean;
};

export type SamplePagination = {
  page: number;
  pages: number;
  next?: number | null;
  prev?: number | null;
  count: number;
  items: number;
  last: number;
};

export type SampleItemsResponse = {
  items: SampleItem[];
  pagination: SamplePagination;
};
