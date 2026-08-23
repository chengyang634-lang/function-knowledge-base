import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { Link } from 'react-router-dom';

type Tag = {
  id: number;
  name: string;
  slug: string;
};

function TagAdminPage() {
  const [tags, setTags] =
    useState<Tag[]>([]);

  const [name, setName] =
    useState('');

  const [slug, setSlug] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  async function loadTags() {
    const response = await fetch(
      'http://localhost:3000/api/tags',
    );

    if (!response.ok) {
      throw new Error('加载标签失败');
    }

    const data: Tag[] =
      await response.json();

    setTags(data);
  }

  useEffect(() => {
    loadTags().catch((error) => {
      console.error(error);
      setMessage('加载标签失败');
    });
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage('请输入标签名称');
      return;
    }

    if (!slug.trim()) {
      setMessage('请输入 Slug');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const response = await fetch(
        'http://localhost:3000/api/tags',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
          }),
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ??
            '新增标签失败',
        );
      }

      setName('');
      setSlug('');

      await loadTags();

      setMessage('标签新增成功');
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : '新增标签失败',
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTag(
    tag: Tag,
  ) {
    const confirmed =
      window.confirm(
        `确定删除标签「${tag.name}」吗？`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage('');

      const response = await fetch(
        `http://localhost:3000/api/tags/${tag.id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ??
            '删除标签失败',
        );
      }

      await loadTags();

      setMessage('标签删除成功');
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : '删除标签失败',
      );
    }
  }

  return (
    <main className="tag-admin-page">
      <header className="admin-header">
        <div>
          <h1>标签管理</h1>

          <p>
            管理函数的横向知识标签。
          </p>
        </div>

        <Link to="/admin">
          返回管理后台
        </Link>
      </header>

      <section className="tag-form-section">
        <h2>新增标签</h2>

        <form onSubmit={handleSubmit}>
          <label>
            标签名称

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="例如 async"
            />
          </label>

          <label>
            Slug

            <input
              value={slug}
              onChange={(event) =>
                setSlug(
                  event.target.value,
                )
              }
              placeholder="例如 async"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? '保存中...'
              : '新增标签'}
          </button>
        </form>

        {message && (
          <p>{message}</p>
        )}
      </section>

      <section className="tag-list-section">
        <h2>现有标签</h2>

        {tags.length === 0 ? (
          <p>暂无标签。</p>
        ) : (
          <div className="tag-admin-list">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="tag-admin-item"
              >
                <div>
                  <strong>
                    {tag.name}
                  </strong>

                  <span className="tag-slug">
                    {tag.slug}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    deleteTag(tag)
                  }
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default TagAdminPage;