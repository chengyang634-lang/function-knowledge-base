import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { Link } from 'react-router-dom';

import { apiUrl } from '../lib/api';
import './category-admin.css';

type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
};

type CategoryType =
  | 'language'
  | 'framework'
  | 'category'
  | 'subcategory';

type CategoryTypeOption = {
  key: CategoryType;
  label: string;
  description: string;
};

const categoryTypeOptions: CategoryTypeOption[] = [
  {
    key: 'language',
    label: '语言',
    description: '顶层分类',
  },
  {
    key: 'framework',
    label: '框架',
    description: '归属于语言',
  },
  {
    key: 'category',
    label: '分类',
    description: '归属于框架',
  },
  {
    key: 'subcategory',
    label: '子分类',
    description: '归属于分类',
  },
];

function getChildren(
  parentId: number | null,
  categories: Category[],
): Category[] {
  return categories
    .filter(
      (category) =>
        category.parentId === parentId,
    )
    .sort((a, b) =>
      a.name.localeCompare(
        b.name,
        'zh-CN',
      ),
    );
}

function getCategoryPathItems(
  category: Category,
  categories: Category[],
): Category[] {
  const path = [category];
  const visited = new Set<number>();
  let parentId = category.parentId;

  while (parentId !== null) {
    if (visited.has(parentId)) {
      break;
    }

    visited.add(parentId);

    const parent = categories.find(
      (item) => item.id === parentId,
    );

    if (!parent) {
      break;
    }

    path.unshift(parent);
    parentId = parent.parentId;
  }

  return path;
}

function getCategoryTypeByDepth(
  depth: number,
): CategoryType {
  if (depth <= 0) {
    return 'language';
  }

  if (depth === 1) {
    return 'framework';
  }

  if (depth === 2) {
    return 'category';
  }

  return 'subcategory';
}

function getCategoryTypeLabel(
  type: CategoryType,
): string {
  return (
    categoryTypeOptions.find(
      (option) => option.key === type,
    )?.label ?? '分类'
  );
}

type CategoryActionsProps = {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  compact?: boolean;
};

function CategoryActions({
  category,
  onEdit,
  onDelete,
  compact = false,
}: CategoryActionsProps) {
  return (
    <div
      className={
        compact
          ? 'category-actions compact'
          : 'category-actions'
      }
    >
      <button
        type="button"
        onClick={() =>
          onEdit(category)
        }
      >
        编辑
      </button>

      <button
        type="button"
        className="category-delete-button"
        onClick={() =>
          onDelete(category)
        }
      >
        删除
      </button>
    </div>
  );
}

type LanguageContentProps = {
  language: Category;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

function LanguageContent({
  language,
  categories,
  onEdit,
  onDelete,
}: LanguageContentProps) {
  const frameworks =
    getChildren(
      language.id,
      categories,
    );

  return (
    <section className="browse-language-panel">
      <div className="browse-language-header">
        <div>
          <span className="browse-eyebrow">
            当前语言
          </span>

          <div className="browse-language-title">
            <h3>{language.name}</h3>
            <span>{language.slug}</span>
          </div>
        </div>

        <CategoryActions
          category={language}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {frameworks.length === 0 ? (
        <div className="browse-empty">
          这个语言下面还没有框架。
        </div>
      ) : (
        <div className="framework-list">
          {frameworks.map(
            (framework) => {
              const topicCategories =
                getChildren(
                  framework.id,
                  categories,
                );

              return (
                <section
                  key={framework.id}
                  className="framework-block"
                >
                  <div className="framework-block-header">
                    <div className="framework-block-title">
                      <span className="level-tag framework">
                        框架
                      </span>

                      <div>
                        <strong>
                          {framework.name}
                        </strong>
                        <span>
                          {framework.slug}
                        </span>
                      </div>
                    </div>

                    <CategoryActions
                      category={framework}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      compact
                    />
                  </div>

                  {topicCategories.length ===
                  0 ? (
                    <div className="browse-empty small">
                      暂无分类
                    </div>
                  ) : (
                    <div className="category-table">
                      {topicCategories.map(
                        (
                          topicCategory,
                        ) => {
                          const subcategories =
                            getChildren(
                              topicCategory.id,
                              categories,
                            );

                          return (
                            <div
                              key={
                                topicCategory.id
                              }
                              className="category-row"
                            >
                              <div className="category-row-main">
                                <span className="level-tag category">
                                  分类
                                </span>

                                <div className="category-row-name">
                                  <strong>
                                    {
                                      topicCategory.name
                                    }
                                  </strong>

                                  <span>
                                    {
                                      topicCategory.slug
                                    }
                                  </span>
                                </div>
                              </div>

                              <div className="category-row-children">
                                {subcategories.length ===
                                0 ? (
                                  <span className="no-subcategory">
                                    暂无子分类
                                  </span>
                                ) : (
                                  subcategories.map(
                                    (
                                      subcategory,
                                    ) => (
                                      <div
                                        key={
                                          subcategory.id
                                        }
                                        className="subcategory-pill"
                                      >
                                        <div>
                                          <strong>
                                            {
                                              subcategory.name
                                            }
                                          </strong>

                                          <span>
                                            {
                                              subcategory.slug
                                            }
                                          </span>
                                        </div>

                                        <CategoryActions
                                          category={
                                            subcategory
                                          }
                                          onEdit={
                                            onEdit
                                          }
                                          onDelete={
                                            onDelete
                                          }
                                          compact
                                        />
                                      </div>
                                    ),
                                  )
                                )}
                              </div>

                              <CategoryActions
                                category={
                                  topicCategory
                                }
                                onEdit={
                                  onEdit
                                }
                                onDelete={
                                  onDelete
                                }
                                compact
                              />
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </section>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}


type QuickAddType =
  | 'framework'
  | 'category'
  | 'subcategory';

type QuickAddPanelProps = {
  language: Category;
  categories: Category[];
  onCreated: () => Promise<void>;
};

function QuickAddPanel({
  language,
  categories,
  onCreated,
}: QuickAddPanelProps) {
  const [type, setType] =
    useState<QuickAddType>('framework');

  const [frameworkId, setFrameworkId] =
    useState<number | null>(null);

  const [topicCategoryId, setTopicCategoryId] =
    useState<number | null>(null);

  const [name, setName] =
    useState('');

  const [slug, setSlug] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const frameworks =
    getChildren(
      language.id,
      categories,
    );

  const topicCategories =
    frameworkId === null
      ? []
      : getChildren(
          frameworkId,
          categories,
        );

  useEffect(() => {
    setFrameworkId(
      frameworks[0]?.id ?? null,
    );
    setTopicCategoryId(null);
    setName('');
    setSlug('');
    setMessage('');
  }, [language.id]);

  useEffect(() => {
    if (
      frameworkId !== null &&
      frameworks.some(
        (item) =>
          item.id === frameworkId,
      )
    ) {
      return;
    }

    setFrameworkId(
      frameworks[0]?.id ?? null,
    );
  }, [
    frameworkId,
    frameworks,
  ]);

  useEffect(() => {
    if (type !== 'subcategory') {
      setTopicCategoryId(null);
      return;
    }

    if (
      topicCategoryId !== null &&
      topicCategories.some(
        (item) =>
          item.id === topicCategoryId,
      )
    ) {
      return;
    }

    setTopicCategoryId(
      topicCategories[0]?.id ?? null,
    );
  }, [
    type,
    topicCategoryId,
    topicCategories,
  ]);

  function changeType(
    nextType: QuickAddType,
  ) {
    setType(nextType);
    setName('');
    setSlug('');
    setMessage('');

    if (
      nextType === 'framework'
    ) {
      setFrameworkId(null);
      setTopicCategoryId(null);
      return;
    }

    setFrameworkId(
      frameworks[0]?.id ?? null,
    );
    setTopicCategoryId(null);
  }

  function getParentId():
    | number
    | null {
    if (type === 'framework') {
      return language.id;
    }

    if (type === 'category') {
      return frameworkId;
    }

    return topicCategoryId;
  }

  function getTypeLabel() {
    if (type === 'framework') {
      return '框架';
    }

    if (type === 'category') {
      return '分类';
    }

    return '子分类';
  }

  async function handleQuickAdd(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage(
        `请输入${getTypeLabel()}名称`,
      );
      return;
    }

    if (!slug.trim()) {
      setMessage(
        '请输入 Slug',
      );
      return;
    }

    const parentId =
      getParentId();

    if (parentId === null) {
      setMessage(
        type === 'category'
          ? '请先选择框架'
          : '请先选择分类',
      );
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const response =
        await fetch(
          apiUrl(
            '/api/categories',
          ),
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body:
              JSON.stringify({
                name:
                  name.trim(),
                slug:
                  slug.trim(),
                parentId,
              }),
          },
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(
              () => null,
            );

        throw new Error(
          data?.message ??
            '快捷新增失败',
        );
      }

      setName('');
      setSlug('');

      await onCreated();

      setMessage(
        `${getTypeLabel()}新增成功`,
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : '快捷新增失败',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="quick-add-panel">
      <div className="quick-add-heading">
        <div>
          <span className="browse-eyebrow">
            {language.name}
          </span>

          <h3>
            快捷新增
          </h3>
        </div>

        <div className="quick-add-types">
          <button
            type="button"
            className={
              type === 'framework'
                ? 'active'
                : ''
            }
            onClick={() =>
              changeType(
                'framework',
              )
            }
          >
            + 框架
          </button>

          <button
            type="button"
            className={
              type === 'category'
                ? 'active'
                : ''
            }
            onClick={() =>
              changeType(
                'category',
              )
            }
          >
            + 分类
          </button>

          <button
            type="button"
            className={
              type === 'subcategory'
                ? 'active'
                : ''
            }
            onClick={() =>
              changeType(
                'subcategory',
              )
            }
          >
            + 子分类
          </button>
        </div>
      </div>

      <form
        className="quick-add-form"
        onSubmit={
          handleQuickAdd
        }
      >
        {type !==
          'framework' && (
          <label>
            所属框架

            <select
              value={
                frameworkId ??
                ''
              }
              onChange={(
                event,
              ) => {
                const value =
                  event
                    .target
                    .value;

                setFrameworkId(
                  value === ''
                    ? null
                    : Number(
                        value,
                      ),
                );

                setTopicCategoryId(
                  null,
                );
              }}
            >
              <option value="">
                选择框架
              </option>

              {frameworks.map(
                (framework) => (
                  <option
                    key={
                      framework.id
                    }
                    value={
                      framework.id
                    }
                  >
                    {
                      framework.name
                    }
                  </option>
                ),
              )}
            </select>
          </label>
        )}

        {type ===
          'subcategory' && (
          <label>
            所属分类

            <select
              value={
                topicCategoryId ??
                ''
              }
              disabled={
                frameworkId ===
                null
              }
              onChange={(
                event,
              ) => {
                const value =
                  event
                    .target
                    .value;

                setTopicCategoryId(
                  value === ''
                    ? null
                    : Number(
                        value,
                      ),
                );
              }}
            >
              <option value="">
                {frameworkId ===
                null
                  ? '先选择框架'
                  : '选择分类'}
              </option>

              {topicCategories.map(
                (
                  topicCategory,
                ) => (
                  <option
                    key={
                      topicCategory.id
                    }
                    value={
                      topicCategory.id
                    }
                  >
                    {
                      topicCategory.name
                    }
                  </option>
                ),
              )}
            </select>
          </label>
        )}

        <label className="quick-add-name">
          名称

          <input
            value={name}
            onChange={(
              event,
            ) =>
              setName(
                event.target
                  .value,
              )
            }
            placeholder={`输入${getTypeLabel()}名称`}
          />
        </label>

        <label className="quick-add-slug">
          Slug

          <input
            value={slug}
            onChange={(
              event,
            ) =>
              setSlug(
                event.target
                  .value,
              )
            }
            placeholder="例如 riverpod"
          />
        </label>

        <button
          type="submit"
          className="quick-add-submit"
          disabled={saving}
        >
          {saving
            ? '新增中...'
            : `新增${getTypeLabel()}`}
        </button>
      </form>

      {message && (
        <p className="quick-add-message">
          {message}
        </p>
      )}
    </section>
  );
}


function CategoryAdminPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [name, setName] =
    useState('');

  const [slug, setSlug] =
    useState('');

  const [categoryType, setCategoryType] =
    useState<CategoryType>('language');

  const [
    selectedLanguageId,
    setSelectedLanguageId,
  ] = useState<number | null>(null);

  const [
    selectedFrameworkId,
    setSelectedFrameworkId,
  ] = useState<number | null>(null);

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState<number | null>(null);

  const [
    browseLanguageId,
    setBrowseLanguageId,
  ] = useState<number | null>(null);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  async function loadCategories() {
    const response = await fetch(
      apiUrl('/api/categories'),
    );

    if (!response.ok) {
      throw new Error(
        '加载分类失败',
      );
    }

    const data: Category[] =
      await response.json();

    setCategories(data);
  }

  useEffect(() => {
    loadCategories().catch(
      (error) => {
        console.error(error);
        setMessage(
          '分类加载失败',
        );
      },
    );
  }, []);

  const languages =
    useMemo(
      () =>
        getChildren(
          null,
          categories,
        ),
      [categories],
    );

  useEffect(() => {
    if (languages.length === 0) {
      setBrowseLanguageId(null);
      return;
    }

    if (
      browseLanguageId !== null &&
      languages.some(
        (language) =>
          language.id ===
          browseLanguageId,
      )
    ) {
      return;
    }

    setBrowseLanguageId(
      languages[0].id,
    );
  }, [
    languages,
    browseLanguageId,
  ]);

  const frameworks =
    useMemo(
      () =>
        selectedLanguageId === null
          ? []
          : getChildren(
              selectedLanguageId,
              categories,
            ),
      [
        categories,
        selectedLanguageId,
      ],
    );

  const topicCategories =
    useMemo(
      () =>
        selectedFrameworkId === null
          ? []
          : getChildren(
              selectedFrameworkId,
              categories,
            ),
      [
        categories,
        selectedFrameworkId,
      ],
    );

  const browseLanguage =
    browseLanguageId === null
      ? null
      : languages.find(
          (language) =>
            language.id ===
            browseLanguageId,
        ) ?? null;

  function clearHierarchy() {
    setSelectedLanguageId(null);
    setSelectedFrameworkId(null);
    setSelectedCategoryId(null);
  }

  function resetForm() {
    setName('');
    setSlug('');
    setCategoryType('language');
    clearHierarchy();
    setEditingId(null);
  }

  function changeCategoryType(
    nextType: CategoryType,
  ) {
    if (editingId !== null) {
      return;
    }

    setCategoryType(nextType);
    clearHierarchy();
    setMessage('');
  }

  function startEdit(
    category: Category,
  ) {
    const path =
      getCategoryPathItems(
        category,
        categories,
      );

    const type =
      getCategoryTypeByDepth(
        path.length - 1,
      );

    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setCategoryType(type);

    setSelectedLanguageId(
      path[0]?.id ?? null,
    );

    setSelectedFrameworkId(
      type === 'category' ||
      type === 'subcategory'
        ? path[1]?.id ?? null
        : null,
    );

    setSelectedCategoryId(
      type === 'subcategory'
        ? path[2]?.id ?? null
        : null,
    );

    setMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function cancelEdit() {
    resetForm();
    setMessage('');
  }

  function getParentId():
    | number
    | null {
    switch (categoryType) {
      case 'language':
        return null;

      case 'framework':
        return selectedLanguageId;

      case 'category':
        return selectedFrameworkId;

      case 'subcategory':
        return selectedCategoryId;
    }
  }

  function getHierarchyError():
    | string
    | null {
    if (
      categoryType === 'framework' &&
      selectedLanguageId === null
    ) {
      return '请先选择所属语言';
    }

    if (
      categoryType === 'category' &&
      selectedFrameworkId === null
    ) {
      return '请先选择所属语言和框架';
    }

    if (
      categoryType === 'subcategory' &&
      selectedCategoryId === null
    ) {
      return '请先选择所属语言、框架和分类';
    }

    return null;
  }

  function getScopePreview(): string {
    const parts: string[] = [];

    const language =
      languages.find(
        (item) =>
          item.id ===
          selectedLanguageId,
      );

    const framework =
      frameworks.find(
        (item) =>
          item.id ===
          selectedFrameworkId,
      );

    const topicCategory =
      topicCategories.find(
        (item) =>
          item.id ===
          selectedCategoryId,
      );

    if (language) {
      parts.push(language.name);
    }

    if (framework) {
      parts.push(framework.name);
    }

    if (topicCategory) {
      parts.push(topicCategory.name);
    }

    if (name.trim()) {
      parts.push(name.trim());
    } else {
      parts.push(
        `新${getCategoryTypeLabel(
          categoryType,
        )}`,
      );
    }

    return parts.join(' → ');
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage(
        '请输入分类名称',
      );
      return;
    }

    if (!slug.trim()) {
      setMessage(
        '请输入 Slug',
      );
      return;
    }

    const hierarchyError =
      getHierarchyError();

    if (hierarchyError) {
      setMessage(
        hierarchyError,
      );
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const editing =
        editingId !== null;

      const url = editing
        ? apiUrl(
            `/api/categories/${editingId}`,
          )
        : apiUrl(
            '/api/categories',
          );

      const response =
        await fetch(url, {
          method: editing
            ? 'PUT'
            : 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            parentId:
              getParentId(),
          }),
        });

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(
              () => null,
            );

        throw new Error(
          data?.message ??
            (editing
              ? '修改分类失败'
              : '新增分类失败'),
        );
      }

      resetForm();
      await loadCategories();

      setMessage(
        editing
          ? '分类修改成功'
          : '分类新增成功',
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : '保存失败',
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(
    category: Category,
  ) {
    const confirmed =
      window.confirm(
        `确定删除分类「${category.name}」吗？`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage('');

      const response =
        await fetch(
          apiUrl(
            `/api/categories/${category.id}`,
          ),
          {
            method:
              'DELETE',
          },
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(
              () => null,
            );

        throw new Error(
          data?.message ??
            '删除失败',
        );
      }

      if (
        editingId ===
        category.id
      ) {
        resetForm();
      }

      await loadCategories();

      setMessage(
        '分类删除成功',
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : '删除失败',
      );
    }
  }

  return (
    <main className="category-admin-page">
      <header className="admin-header">
        <div>
          <h1>
            分类管理
          </h1>

          <p>
            每个语言独立管理自己的框架、分类与子分类。
          </p>
        </div>

        <Link to="/admin">
          返回管理后台
        </Link>
      </header>

      <section className="category-form-section">
        <div className="category-section-heading">
          <div>
            <h2>
              {editingId === null
                ? '新增分类'
                : '编辑分类'}
            </h2>

            <p>
              {editingId === null
                ? '先选择要创建的层级，再逐级选择归属。'
                : '编辑时保留当前层级，只修改内容或归属。'}
            </p>
          </div>

          {editingId !== null && (
            <div className="editing-type-badge">
              <span>
                当前类型
              </span>

              <strong>
                {getCategoryTypeLabel(
                  categoryType,
                )}
              </strong>
            </div>
          )}
        </div>

        {editingId === null && (
          <div className="category-type-picker">
            {categoryTypeOptions.map(
              (option) => (
                <button
                  key={option.key}
                  type="button"
                  className={
                    categoryType ===
                    option.key
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    changeCategoryType(
                      option.key,
                    )
                  }
                >
                  <strong>
                    {option.label}
                  </strong>

                  <span>
                    {
                      option.description
                    }
                  </span>
                </button>
              ),
            )}
          </div>
        )}

        <form
          className="category-create-form"
          onSubmit={
            handleSubmit
          }
        >
          {categoryType !==
            'language' && (
            <section className="category-scope-section">
              <div className="category-scope-heading">
                <div>
                  <strong>
                    归属位置
                  </strong>

                  <span>
                    按层级逐步选择
                  </span>
                </div>

                <span className="scope-type-label">
                  {getCategoryTypeLabel(
                    categoryType,
                  )}
                </span>
              </div>

              <div className="category-scope-grid">
                <label>
                  所属语言

                  <select
                    value={
                      selectedLanguageId ??
                      ''
                    }
                    onChange={(
                      event,
                    ) => {
                      const value =
                        event
                          .target
                          .value;

                      setSelectedLanguageId(
                        value === ''
                          ? null
                          : Number(
                              value,
                            ),
                      );

                      setSelectedFrameworkId(
                        null,
                      );

                      setSelectedCategoryId(
                        null,
                      );
                    }}
                  >
                    <option value="">
                      选择语言
                    </option>

                    {languages.map(
                      (language) => (
                        <option
                          key={
                            language.id
                          }
                          value={
                            language.id
                          }
                        >
                          {
                            language.name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                {(categoryType ===
                  'category' ||
                  categoryType ===
                    'subcategory') && (
                  <label>
                    所属框架

                    <select
                      value={
                        selectedFrameworkId ??
                        ''
                      }
                      disabled={
                        selectedLanguageId ===
                        null
                      }
                      onChange={(
                        event,
                      ) => {
                        const value =
                          event
                            .target
                            .value;

                        setSelectedFrameworkId(
                          value === ''
                            ? null
                            : Number(
                                value,
                              ),
                        );

                        setSelectedCategoryId(
                          null,
                        );
                      }}
                    >
                      <option value="">
                        {selectedLanguageId ===
                        null
                          ? '先选择语言'
                          : '选择框架'}
                      </option>

                      {frameworks.map(
                        (framework) => (
                          <option
                            key={
                              framework.id
                            }
                            value={
                              framework.id
                            }
                          >
                            {
                              framework.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                )}

                {categoryType ===
                  'subcategory' && (
                  <label>
                    所属分类

                    <select
                      value={
                        selectedCategoryId ??
                        ''
                      }
                      disabled={
                        selectedFrameworkId ===
                        null
                      }
                      onChange={(
                        event,
                      ) => {
                        const value =
                          event
                            .target
                            .value;

                        setSelectedCategoryId(
                          value === ''
                            ? null
                            : Number(
                                value,
                              ),
                        );
                      }}
                    >
                      <option value="">
                        {selectedFrameworkId ===
                        null
                          ? '先选择框架'
                          : '选择分类'}
                      </option>

                      {topicCategories.map(
                        (
                          topicCategory,
                        ) => (
                          <option
                            key={
                              topicCategory.id
                            }
                            value={
                              topicCategory.id
                            }
                          >
                            {
                              topicCategory.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                )}
              </div>
            </section>
          )}

          <section className="category-basic-section">
            <div className="category-basic-heading">
              <strong>
                基本信息
              </strong>

              <span>
                {getCategoryTypeLabel(
                  categoryType,
                )}
              </span>
            </div>

            <div className="category-basic-grid">
              <label>
                名称

                <input
                  value={name}
                  onChange={(
                    event,
                  ) =>
                    setName(
                      event.target
                        .value,
                    )
                  }
                  placeholder={`输入${getCategoryTypeLabel(
                    categoryType,
                  )}名称`}
                />
              </label>

              <label>
                Slug

                <input
                  value={slug}
                  onChange={(
                    event,
                  ) =>
                    setSlug(
                      event.target
                        .value,
                    )
                  }
                  placeholder="例如 state-management"
                />
              </label>
            </div>
          </section>

          <div className="category-path-preview">
            <span>
              创建后路径
            </span>

            <strong>
              {getScopePreview()}
            </strong>
          </div>

          <div className="category-form-actions">
            <button
              type="submit"
              disabled={
                saving
              }
            >
              {saving
                ? '保存中...'
                : editingId ===
                    null
                  ? `新增${getCategoryTypeLabel(
                      categoryType,
                    )}`
                  : '保存修改'}
            </button>

            {editingId !==
              null && (
              <button
                type="button"
                onClick={
                  cancelEdit
                }
              >
                取消编辑
              </button>
            )}
          </div>
        </form>

        {message && (
          <p className="category-form-message">
            {message}
          </p>
        )}
      </section>

      <section className="category-tree-section">
        <div className="category-section-heading browse-heading">
          <div>
            <h2>
              现有分类
            </h2>

            <p>
              选择语言后，只显示该语言自己的结构。
            </p>
          </div>

          <span className="category-total">
            {categories.length} 项
          </span>
        </div>

        {languages.length ===
        0 ? (
          <p>
            暂无分类。
          </p>
        ) : (
          <>
            <div className="language-switcher">
              {languages.map(
                (language) => (
                  <button
                    key={
                      language.id
                    }
                    type="button"
                    className={
                      browseLanguageId ===
                      language.id
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setBrowseLanguageId(
                        language.id,
                      )
                    }
                  >
                    <strong>
                      {
                        language.name
                      }
                    </strong>

                    <span>
                      {
                        language.slug
                      }
                    </span>
                  </button>
                ),
              )}
            </div>

            {browseLanguage && (
              <>
                <LanguageContent
                  language={
                    browseLanguage
                  }
                  categories={
                    categories
                  }
                  onEdit={
                    startEdit
                  }
                  onDelete={
                    deleteCategory
                  }
                />

                <QuickAddPanel
                  key={
                    browseLanguage.id
                  }
                  language={
                    browseLanguage
                  }
                  categories={
                    categories
                  }
                  onCreated={
                    loadCategories
                  }
                />
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default CategoryAdminPage;
