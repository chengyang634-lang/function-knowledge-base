import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import type {
  Category,
  Tag,
} from '../types/function';

export type VariantForm = {
  name: string;
  code: string;
  explanation: string;

  sourceName: string;
  sourceUrl: string;
};

export type FunctionFormValue = {
  name: string;
  description: string;

  categoryId: number | null;

  tagIds: number[];

  variants: VariantForm[];
};

type FunctionFormProps = {
  initialValue?: FunctionFormValue;

  submitLabel: string;

  onSubmit: (
    value: FunctionFormValue,
  ) => Promise<void>;

  message?: string;
};

function getCategoryPath(
  category: Category,
  categories: Category[],
): string {
  const names = [category.name];

  let parentId = category.parentId;

  while (parentId !== null) {
    const parent = categories.find(
      (item) =>
        item.id === parentId,
    );

    if (!parent) {
      break;
    }

    names.unshift(parent.name);
    parentId = parent.parentId;
  }

  return names.join(' → ');
}

function FunctionForm({
  initialValue,
  submitLabel,
  onSubmit,
  message,
}: FunctionFormProps) {
  const [name, setName] =
    useState(
      initialValue?.name ?? '',
    );

  const [
    description,
    setDescription,
  ] = useState(
    initialValue?.description ?? '',
  );

  const [
    categoryId,
    setCategoryId,
  ] = useState<number | null>(
    initialValue?.categoryId ?? null,
  );

  const [
    selectedTagIds,
    setSelectedTagIds,
  ] = useState<number[]>(
    initialValue?.tagIds ?? [],
  );

  const [
    variants,
    setVariants,
  ] = useState<VariantForm[]>(
    initialValue?.variants ?? [
      {
        name: '基础版',
        code: '',
        explanation: '',
        sourceName: '',
        sourceUrl: '',
      },
    ],
  );

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [tags, setTags] =
    useState<Tag[]>([]);

  const [saving, setSaving] =
    useState(false);

  const [
    formMessage,
    setFormMessage,
  ] = useState('');

  useEffect(() => {
    async function loadOptions() {
      const [
        categoriesResponse,
        tagsResponse,
      ] = await Promise.all([
        fetch(
          'http://localhost:3000/api/categories',
        ),

        fetch(
          'http://localhost:3000/api/tags',
        ),
      ]);

      if (
        !categoriesResponse.ok
      ) {
        throw new Error(
          '加载分类失败',
        );
      }

      if (!tagsResponse.ok) {
        throw new Error(
          '加载标签失败',
        );
      }

      const categoryData:
        Category[] =
        await categoriesResponse.json();

      const tagData: Tag[] =
        await tagsResponse.json();

      setCategories(
        categoryData,
      );

      setTags(tagData);
    }

    loadOptions().catch(
      (error) => {
        console.error(error);

        setFormMessage(
          '加载分类或标签失败',
        );
      },
    );
  }, []);

  function toggleTag(
    tagId: number,
  ) {
    setSelectedTagIds(
      (current) => {
        if (
          current.includes(tagId)
        ) {
          return current.filter(
            (id) =>
              id !== tagId,
          );
        }

        return [
          ...current,
          tagId,
        ];
      },
    );
  }

  function addVariant() {
    setVariants(
      (current) => [
        ...current,

        {
          name: '',
          code: '',
          explanation: '',
          sourceName: '',
          sourceUrl: '',
        },
      ],
    );
  }

  function updateVariant(
    index: number,
    field: keyof VariantForm,
    value: string,
  ) {
    setVariants(
      (current) =>
        current.map(
          (
            variant,
            variantIndex,
          ) =>
            variantIndex === index
              ? {
                  ...variant,
                  [field]: value,
                }
              : variant,
        ),
    );
  }

  function removeVariant(
    index: number,
  ) {
    setVariants(
      (current) =>
        current.filter(
          (
            _,
            variantIndex,
          ) =>
            variantIndex !==
            index,
        ),
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setFormMessage(
        '请输入函数名',
      );

      return;
    }

    if (categoryId === null) {
      setFormMessage(
        '请选择分类',
      );

      return;
    }

    if (
      variants.length === 0
    ) {
      setFormMessage(
        '至少需要一种写法',
      );

      return;
    }

    const hasInvalidVariant =
      variants.some(
        (variant) =>
          !variant.name.trim() ||
          !variant.code.trim(),
      );

    if (hasInvalidVariant) {
      setFormMessage(
        '每种写法都需要填写版本名称和代码',
      );

      return;
    }

    try {
      setSaving(true);
      setFormMessage('');

      await onSubmit({
        name: name.trim(),

        description:
          description.trim(),

        categoryId,

        tagIds:
          selectedTagIds,

        variants:
          variants.map(
            (variant) => ({
              name:
                variant.name.trim(),

              code:
                variant.code,

              explanation:
                variant.explanation.trim(),

              sourceName:
                variant.sourceName.trim(),

              sourceUrl:
                variant.sourceUrl.trim(),
            }),
          ),
      });
    } catch (error) {
      console.error(error);

      setFormMessage(
        '保存失败',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        函数名

        <input
          value={name}
          onChange={(event) =>
            setName(
              event.target.value,
            )
          }
        />
      </label>

      <label>
        分类

        <select
          value={
            categoryId ?? ''
          }
          onChange={(event) => {
            const value =
              event.target.value;

            setCategoryId(
              value === ''
                ? null
                : Number(value),
            );
          }}
        >
          <option value="">
            请选择分类
          </option>

          {categories.map(
            (category) => (
              <option
                key={
                  category.id
                }
                value={
                  category.id
                }
              >
                {getCategoryPath(
                  category,
                  categories,
                )}
              </option>
            ),
          )}
        </select>
      </label>

      <label>
        说明

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value,
            )
          }
        />
      </label>

      <section className="tag-selector">
        <h2>标签</h2>

        {tags.length === 0 ? (
          <p>
            暂无标签，可以先到标签管理新增。
          </p>
        ) : (
          <div className="tag-options">
            {tags.map(
              (tag) => {
                const selected =
                  selectedTagIds.includes(
                    tag.id,
                  );

                return (
                  <button
                    key={
                      tag.id
                    }
                    type="button"
                    className={
                      selected
                        ? 'tag-option active'
                        : 'tag-option'
                    }
                    onClick={() =>
                      toggleTag(
                        tag.id,
                      )
                    }
                  >
                    {tag.name}
                  </button>
                );
              },
            )}
          </div>
        )}
      </section>

      <h2>写法版本</h2>

      {variants.map(
        (
          variant,
          index,
        ) => (
          <section
            key={index}
            className="variant-form"
          >
            <h3>
              写法 {index + 1}
            </h3>

            <label>
              版本名称

              <input
                value={
                  variant.name
                }
                onChange={(
                  event,
                ) =>
                  updateVariant(
                    index,
                    'name',
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <label>
              代码

              <textarea
                rows={14}
                value={
                  variant.code
                }
                onChange={(
                  event,
                ) =>
                  updateVariant(
                    index,
                    'code',
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <label>
              解释

              <textarea
                value={
                  variant.explanation
                }
                onChange={(
                  event,
                ) =>
                  updateVariant(
                    index,
                    'explanation',
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <label>
              来源名称

              <input
                value={
                  variant.sourceName
                }
                onChange={(
                  event,
                ) =>
                  updateVariant(
                    index,
                    'sourceName',
                    event.target
                      .value,
                  )
                }
                placeholder="例如 Flutter 官方文档"
              />
            </label>

            <label>
              来源链接

              <input
                type="url"
                value={
                  variant.sourceUrl
                }
                onChange={(
                  event,
                ) =>
                  updateVariant(
                    index,
                    'sourceUrl',
                    event.target
                      .value,
                  )
                }
                placeholder="https://..."
              />
            </label>

            {variants.length >
              1 && (
              <button
                type="button"
                onClick={() =>
                  removeVariant(
                    index,
                  )
                }
              >
                删除这个写法
              </button>
            )}
          </section>
        ),
      )}

      <button
        type="button"
        onClick={addVariant}
      >
        + 添加另一种写法
      </button>

      <button
        type="submit"
        disabled={saving}
      >
        {saving
          ? '保存中...'
          : submitLabel}
      </button>

      {(formMessage ||
        message) && (
        <p>
          {formMessage ||
            message}
        </p>
      )}
    </form>
  );
}

export default FunctionForm;