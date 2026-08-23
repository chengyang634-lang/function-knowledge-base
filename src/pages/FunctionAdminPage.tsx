import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type {
  Category,
  FunctionEntry,
} from '../types/function';
import { apiUrl } from '../lib/api';

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

function FunctionAdminPage() {
  const [functions, setFunctions] =
    useState<FunctionEntry[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function loadData() {
    try {
      setLoading(true);

      const [
        functionsResponse,
        categoriesResponse,
      ] = await Promise.all([
        fetch(
          apiUrl('/api/functions'),
        ),
        fetch(
          apiUrl('/api/categories'),
        ),
      ]);

      if (!functionsResponse.ok) {
        throw new Error('加载函数失败');
      }

      if (!categoriesResponse.ok) {
        throw new Error('加载分类失败');
      }

      const functionData: FunctionEntry[] =
        await functionsResponse.json();

      const categoryData: Category[] =
        await categoriesResponse.json();

      setFunctions(functionData);
      setCategories(categoryData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  async function deleteFunction(
    functionEntry: FunctionEntry,
  ) {
    const confirmed = window.confirm(
      `确定删除 ${functionEntry.name} 吗？`,
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      apiUrl(`/api/functions/${functionEntry.id}`),
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      window.alert('删除失败');
      return;
    }

    setFunctions((current) =>
      current.filter(
        (item) =>
          item.id !== functionEntry.id,
      ),
    );
  }

  if (loading) {
    return (
      <main className="function-admin-page">
        <p>加载中...</p>
      </main>
    );
  }

  return (
    <main className="function-admin-page">
      <header className="admin-header">
        <div>
          <h1>函数管理</h1>

          <p>
            管理知识库中的函数和写法版本。
          </p>
        </div>

        <div className="admin-actions">
          <Link to="/admin">
            返回管理后台
          </Link>

          <Link to="/admin/functions/new">
            + 新增函数
          </Link>
        </div>
      </header>

      {functions.length === 0 ? (
        <p>暂无函数。</p>
      ) : (
        <div className="function-admin-list">
          {functions.map(
            (functionEntry) => {
              const category =
                categories.find(
                  (item) =>
                    item.id ===
                    functionEntry.categoryId,
                );

              const categoryPath =
                category
                  ? getCategoryPath(
                      category,
                      categories,
                    )
                  : '未分类';

              return (
                <article
                  key={functionEntry.id}
                  className="function-admin-item"
                >
                  <div>
                    <h2>
                      {functionEntry.name}
                    </h2>

                    <p>
                      {categoryPath}
                    </p>

                    <p>
                      {
                        functionEntry
                          .variants.length
                      }{' '}
                      种写法
                    </p>
                  </div>

                  <div className="function-admin-actions">
                    <Link
                      to={`/admin/functions/${functionEntry.id}/edit`}
                    >
                      编辑
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        deleteFunction(
                          functionEntry,
                        )
                      }
                    >
                      删除
                    </button>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </main>
  );
}

export default FunctionAdminPage;