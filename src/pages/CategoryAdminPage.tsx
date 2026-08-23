import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { Link } from 'react-router-dom';

type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
};

type CategoryNode = Category & {
  children: CategoryNode[];
};

function buildCategoryTree(
  categories: Category[],
): CategoryNode[] {
  const map = new Map<number, CategoryNode>();

  categories.forEach((category) => {
    map.set(category.id, {
      ...category,
      children: [],
    });
  });

  const roots: CategoryNode[] = [];

  map.forEach((category) => {
    if (category.parentId === null) {
      roots.push(category);
      return;
    }

    const parent = map.get(category.parentId);

    parent?.children.push(category);
  });

  return roots;
}

function getCategoryPath(
  category: Category,
  categories: Category[],
): string {
  const names = [category.name];

  let parentId = category.parentId;

  while (parentId !== null) {
    const parent = categories.find(
      (item) => item.id === parentId,
    );

    if (!parent) break;

    names.unshift(parent.name);
    parentId = parent.parentId;
  }

  return names.join(' → ');
}

function getDescendantIds(
  categoryId: number,
  categories: Category[],
): Set<number> {
  const result = new Set<number>();

  function collect(parentId: number) {
    const children = categories.filter(
      (category) =>
        category.parentId === parentId,
    );

    children.forEach((child) => {
      result.add(child.id);
      collect(child.id);
    });
  }

  collect(categoryId);

  return result;
}

type CategoryTreeItemProps = {
  category: CategoryNode;
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

function CategoryTreeItem({
  category,
  level = 0,
  onEdit,
  onDelete,
}: CategoryTreeItemProps) {
  return (
    <div>
      <div
        className="category-admin-item"
        style={{
          marginLeft: `${level * 24}px`,
        }}
      >
        <div>
          <strong>{category.name}</strong>

          <span className="category-slug">
            {category.slug}
          </span>
        </div>

        <div className="category-actions">
          <button
            type="button"
            onClick={() => onEdit(category)}
          >
            编辑
          </button>

          <button
            type="button"
            onClick={() => onDelete(category)}
          >
            删除
          </button>
        </div>
      </div>

      {category.children.map((child) => (
        <CategoryTreeItem
          key={child.id}
          category={child}
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function CategoryAdminPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const [parentId, setParentId] =
    useState<number | null>(null);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  async function loadCategories() {
    const response = await fetch(
      'http://localhost:3000/api/categories',
    );

    if (!response.ok) {
      throw new Error('加载分类失败');
    }

    const data: Category[] =
      await response.json();

    setCategories(data);
  }

  useEffect(() => {
    loadCategories().catch((error) => {
      console.error(error);
      setMessage('分类加载失败');
    });
  }, []);

  function resetForm() {
    setName('');
    setSlug('');
    setParentId(null);
    setEditingId(null);
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setParentId(category.parentId);
    setMessage('');
  }

  function cancelEdit() {
    resetForm();
    setMessage('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage('请输入分类名称');
      return;
    }

    if (!slug.trim()) {
      setMessage('请输入 Slug');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const editing = editingId !== null;

      const url = editing
        ? `http://localhost:3000/api/categories/${editingId}`
        : 'http://localhost:3000/api/categories';

      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          parentId,
        }),
      });

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

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
    const confirmed = window.confirm(
      `确定删除分类「${category.name}」吗？`,
    );

    if (!confirmed) return;

    try {
      setMessage('');

      const response = await fetch(
        `http://localhost:3000/api/categories/${category.id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ?? '删除失败',
        );
      }

      if (editingId === category.id) {
        resetForm();
      }

      await loadCategories();

      setMessage('分类删除成功');
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : '删除失败',
      );
    }
  }

  const categoryTree =
    buildCategoryTree(categories);


    const invalidParentIds =
  editingId === null
    ? new Set<number>()
    : getDescendantIds(
        editingId,
        categories,
      );
      
  return (
    <main className="category-admin-page">
      <header className="admin-header">
        <div>
          <h1>分类管理</h1>

          <p>
            管理知识库的多层分类结构。
          </p>
        </div>

        <Link to="/admin">
          返回管理后台
        </Link>
      </header>

      <section className="category-form-section">
        <h2>
          {editingId === null
            ? '新增分类'
            : '编辑分类'}
        </h2>

        <form onSubmit={handleSubmit}>
          <label>
            分类名称

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="例如 状态管理"
            />
          </label>

          <label>
            Slug

            <input
              value={slug}
              onChange={(event) =>
                setSlug(event.target.value)
              }
              placeholder="例如 state-management"
            />
          </label>

          <label>
            父分类

            <select
              value={parentId ?? ''}
              onChange={(event) => {
                const value =
                  event.target.value;

                setParentId(
                  value === ''
                    ? null
                    : Number(value),
                );
              }}
            >
              <option value="">
                无父分类
              </option>

              {categories
  .filter((category) => {
    if (category.id === editingId) {
      return false;
    }

    if (
      invalidParentIds.has(
        category.id,
      )
    ) {
      return false;
    }

    return true;
  })
  .map((category) => (
    <option
      key={category.id}
      value={category.id}
    >
      {getCategoryPath(
        category,
        categories,
      )}
    </option>
  ))}
            </select>
          </label>

          <div className="category-form-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? '保存中...'
                : editingId === null
                  ? '新增分类'
                  : '保存修改'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
              >
                取消编辑
              </button>
            )}
          </div>
        </form>

        {message && <p>{message}</p>}
      </section>

      <section className="category-tree-section">
        <h2>现有分类</h2>

        {categoryTree.length === 0 ? (
          <p>暂无分类。</p>
        ) : (
          <div className="category-tree">
            {categoryTree.map((category) => (
              <CategoryTreeItem
                key={category.id}
                category={category}
                onEdit={startEdit}
                onDelete={deleteCategory}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default CategoryAdminPage;