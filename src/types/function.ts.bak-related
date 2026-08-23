export type FunctionVariant = {
  id: number;
  name: string;
  code: string;
  explanation?: string | null;

  sourceName?: string | null;
  sourceUrl?: string | null;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
};

export type Tag = {
  id: number;
  name: string;
  slug: string;
};

export type FunctionEntry = {
  id: number;
  name: string;
  description?: string | null;

  categoryId?: number | null;
  categoryNode?: Category | null;

  variants: FunctionVariant[];
  tags: Tag[];

  favorite: boolean;
  note?: string | null;

  createdAt: string;
  updatedAt: string;
};