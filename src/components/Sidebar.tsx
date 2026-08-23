import {
  useEffect,
  useState,
} from 'react';

import type {
  Category,
  FunctionEntry,
} from '../types/function';

import type {
  FunctionSort,
} from '../pages/FunctionLibraryPage';

type ViewCounts =
  Record<string, number>;

type SidebarProps = {
  categories: Category[];
  functions: FunctionEntry[];

  recentFunctions:
    FunctionEntry[];

  popularFunctions:
    FunctionEntry[];

  viewCounts:
    ViewCounts;

  selectedFunctionId:
    | number
    | null;

  onSelect: (
    functionEntry: FunctionEntry,
  ) => void;

  onClearRecent:
    () => void;

  onClearViewCounts:
    () => void;

  search: string;

  onSearchChange: (
    value: string,
  ) => void;

  sort: FunctionSort;

  onSortChange: (
    value: FunctionSort,
  ) => void;

  favoritesOnly: boolean;

  onFavoritesOnlyChange: (
    value: boolean,
  ) => void;
};

type CategoryNode =
  Category & {
    children:
      CategoryNode[];
  };

function buildCategoryTree(
  categories: Category[],
): CategoryNode[] {
  const map =
    new Map<
      number,
      CategoryNode
    >();

  categories.forEach(
    (category) => {
      map.set(
        category.id,
        {
          ...category,
          children: [],
        },
      );
    },
  );

  const roots:
    CategoryNode[] = [];

  map.forEach(
    (category) => {
      if (
        category.parentId ===
        null
      ) {
        roots.push(
          category,
        );

        return;
      }

      const parent =
        map.get(
          category.parentId,
        );

      parent?.children.push(
        category,
      );
    },
  );

  return roots;
}

function categoryContainsFunctions(
  category: CategoryNode,
  functions:
    FunctionEntry[],
): boolean {
  const hasDirectFunctions =
    functions.some(
      (functionEntry) =>
        functionEntry.categoryId ===
        category.id,
    );

  if (
    hasDirectFunctions
  ) {
    return true;
  }

  return category.children.some(
    (child) =>
      categoryContainsFunctions(
        child,
        functions,
      ),
  );
}

function countCategoryFunctions(
  category: CategoryNode,
  functions:
    FunctionEntry[],
): number {
  const directCount =
    functions.filter(
      (functionEntry) =>
        functionEntry.categoryId ===
        category.id,
    ).length;

  const childCount =
    category.children.reduce(
      (total, child) =>
        total +
        countCategoryFunctions(
          child,
          functions,
        ),
      0,
    );

  return (
    directCount +
    childCount
  );
}

type CategoryTreeItemProps = {
  category:
    CategoryNode;

  functions:
    FunctionEntry[];

  selectedFunctionId:
    | number
    | null;

  onSelect: (
    functionEntry: FunctionEntry,
  ) => void;

  expandedIds:
    Set<number>;

  onToggle: (
    categoryId: number,
  ) => void;

  searchActive:
    boolean;

  level?: number;
};

function CategoryTreeItem({
  category,
  functions,
  selectedFunctionId,
  onSelect,
  expandedIds,
  onToggle,
  searchActive,
  level = 0,
}: CategoryTreeItemProps) {
  if (
    !categoryContainsFunctions(
      category,
      functions,
    )
  ) {
    return null;
  }

  const directFunctions =
    functions.filter(
      (functionEntry) =>
        functionEntry.categoryId ===
        category.id,
    );

  const visibleChildren =
    category.children.filter(
      (child) =>
        categoryContainsFunctions(
          child,
          functions,
        ),
    );

  const hasChildren =
    visibleChildren.length > 0;

  const expanded =
    searchActive ||
    expandedIds.has(
      category.id,
    );

  const functionCount =
    countCategoryFunctions(
      category,
      functions,
    );

  return (
    <div>
      <button
        type="button"
        className="category-toggle"
        style={{
          paddingLeft:
            `${
              level * 16 + 8
            }px`,
        }}
        onClick={() =>
          onToggle(
            category.id,
          )
        }
      >
        <span className="category-arrow">
          {hasChildren
            ? expanded
              ? '▼'
              : '▶'
            : '•'}
        </span>

        <span>
          {category.name}
        </span>

        <span className="category-count">
          {functionCount}
        </span>
      </button>

      {expanded && (
        <>
          {directFunctions.map(
            (
              functionEntry,
            ) => (
              <button
                key={
                  functionEntry.id
                }
                type="button"
                className={`function-tree-item ${
                  selectedFunctionId ===
                  functionEntry.id
                    ? 'active'
                    : ''
                }`}
                style={{
                  paddingLeft:
                    `${
                      (level +
                        1) *
                        16 +
                      20
                    }px`,
                }}
                onClick={() =>
                  onSelect(
                    functionEntry,
                  )
                }
              >
                {
                  functionEntry.name
                }
              </button>
            ),
          )}

          {visibleChildren.map(
            (child) => (
              <CategoryTreeItem
                key={
                  child.id
                }
                category={
                  child
                }
                functions={
                  functions
                }
                selectedFunctionId={
                  selectedFunctionId
                }
                onSelect={
                  onSelect
                }
                expandedIds={
                  expandedIds
                }
                onToggle={
                  onToggle
                }
                searchActive={
                  searchActive
                }
                level={
                  level + 1
                }
              />
            ),
          )}
        </>
      )}
    </div>
  );
}

function Sidebar({
  categories,
  functions,
  recentFunctions,
  popularFunctions,
  viewCounts,
  selectedFunctionId,
  onSelect,
  onClearRecent,
  onClearViewCounts,
  search,
  onSearchChange,
  sort,
  onSortChange,
  favoritesOnly,
  onFavoritesOnlyChange,
}: SidebarProps) {
  const [
    expandedIds,
    setExpandedIds,
  ] =
    useState<Set<number>>(
      new Set(),
    );

  useEffect(() => {
    if (
      categories.length ===
      0
    ) {
      return;
    }

    setExpandedIds(
      (current) => {
        if (
          current.size > 0
        ) {
          return current;
        }

        return new Set(
          categories
            .filter(
              (category) =>
                category.parentId ===
                null,
            )
            .map(
              (category) =>
                category.id,
            ),
        );
      },
    );
  }, [categories]);

  const categoryTree =
    buildCategoryTree(
      categories,
    );

  const searchActive =
    search.trim().length >
    0;

  function toggleCategory(
    categoryId: number,
  ) {
    setExpandedIds(
      (current) => {
        const next =
          new Set(current);

        if (
          next.has(
            categoryId,
          )
        ) {
          next.delete(
            categoryId,
          );
        } else {
          next.add(
            categoryId,
          );
        }

        return next;
      },
    );
  }

  const uncategorizedFunctions =
    functions.filter(
      (functionEntry) =>
        functionEntry.categoryId ==
        null,
    );

  return (
    <aside className="sidebar">
      <h2>
        Function Base
      </h2>

      <div className="function-total">
        {functions.length}
        {' '}
        个函数
      </div>

      <input
        type="search"
        placeholder="搜索函数、代码、分类..."
        value={search}
        onChange={(event) =>
          onSearchChange(
            event.target.value,
          )
        }
      />

      <select
        className="function-sort"
        value={sort}
        onChange={(event) =>
          onSortChange(
            event.target
              .value as FunctionSort,
          )
        }
      >
        <option value="newest">
          最新添加
        </option>

        <option value="updated">
          最近更新
        </option>

        <option value="name">
          名称 A-Z
        </option>

        <option value="popular">
          最常浏览
        </option>
      </select>

      <label className="favorite-filter">
        <input
          type="checkbox"
          checked={
            favoritesOnly
          }
          onChange={(event) =>
            onFavoritesOnlyChange(
              event.target
                .checked,
            )
          }
        />

        只看收藏
      </label>

      {recentFunctions.length >
        0 && (
        <section className="recent-functions">
          <div className="recent-functions-header">
            <strong>
              最近浏览
            </strong>

            <button
              type="button"
              onClick={
                onClearRecent
              }
            >
              清除
            </button>
          </div>

          <div className="recent-functions-list">
            {recentFunctions.map(
              (
                functionEntry,
              ) => (
                <button
                  key={
                    functionEntry.id
                  }
                  type="button"
                  className={`recent-function-item ${
                    selectedFunctionId ===
                    functionEntry.id
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    onSelect(
                      functionEntry,
                    )
                  }
                >
                  {
                    functionEntry.name
                  }
                </button>
              ),
            )}
          </div>
        </section>
      )}

      {popularFunctions.length >
        0 && (
        <section className="popular-functions">
          <div className="popular-functions-header">
            <strong>
              常用函数
            </strong>

            <button
              type="button"
              onClick={
                onClearViewCounts
              }
            >
              清除
            </button>
          </div>

          <div className="popular-functions-list">
            {popularFunctions.map(
              (
                functionEntry,
              ) => (
                <button
                  key={
                    functionEntry.id
                  }
                  type="button"
                  className={`popular-function-item ${
                    selectedFunctionId ===
                    functionEntry.id
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    onSelect(
                      functionEntry,
                    )
                  }
                >
                  <span>
                    {
                      functionEntry.name
                    }
                  </span>

                  <span className="view-count">
                    {
                      viewCounts[
                        String(
                          functionEntry.id,
                        )
                      ] ?? 0
                    }
                  </span>
                </button>
              ),
            )}
          </div>
        </section>
      )}

      <nav>
        {categoryTree.map(
          (category) => (
            <CategoryTreeItem
              key={
                category.id
              }
              category={
                category
              }
              functions={
                functions
              }
              selectedFunctionId={
                selectedFunctionId
              }
              onSelect={
                onSelect
              }
              expandedIds={
                expandedIds
              }
              onToggle={
                toggleCategory
              }
              searchActive={
                searchActive
              }
            />
          ),
        )}

        {uncategorizedFunctions.length >
          0 && (
          <div>
            <div className="uncategorized-title">
              未分类

              <span className="category-count">
                {
                  uncategorizedFunctions.length
                }
              </span>
            </div>

            {uncategorizedFunctions.map(
              (
                functionEntry,
              ) => (
                <button
                  key={
                    functionEntry.id
                  }
                  type="button"
                  className={`function-tree-item ${
                    selectedFunctionId ===
                    functionEntry.id
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    onSelect(
                      functionEntry,
                    )
                  }
                >
                  {
                    functionEntry.name
                  }
                </button>
              ),
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;

