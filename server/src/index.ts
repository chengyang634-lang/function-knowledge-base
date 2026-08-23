import express from 'express';
import cors from 'cors';

import { prisma } from './lib/prisma.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
  });
});

/* =========================
   Functions
========================= */

app.get('/api/functions', async (_request, response) => {
  const functions =
    await prisma.functionEntry.findMany({
      include: {
        variants: true,
        categoryNode: true,
        tags: true,
        relatedFunctions: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

  response.json(functions);
});

app.get('/api/functions/:id', async (request, response) => {
  const id = Number(request.params.id);

  if (Number.isNaN(id)) {
    return response.status(400).json({
      message: 'Invalid function id',
    });
  }

  const functionEntry =
    await prisma.functionEntry.findUnique({
      where: {
        id,
      },

      include: {
        variants: true,
        categoryNode: true,
        tags: true,
        relatedFunctions: true,
      },
    });

  if (!functionEntry) {
    return response.status(404).json({
      message: 'Function not found',
    });
  }

  response.json(functionEntry);
});

app.post('/api/functions', async (request, response) => {
  const {
    name,
    description,
    categoryId,
    variants,
    tagIds,
    relatedFunctionIds,
  } = request.body;

  if (!name?.trim()) {
    return response.status(400).json({
      message: '请输入函数名',
    });
  }

  if (
    !Array.isArray(variants) ||
    variants.length === 0
  ) {
    return response.status(400).json({
      message: '至少需要一种写法',
    });
  }

  try {
    const createdFunction =
      await prisma.functionEntry.create({
        data: {
          name: name.trim(),

          description:
            description?.trim() || null,

          // 旧字段暂时保留
          language: '',
          category: null,

          categoryId:
            categoryId ?? null,

          variants: {
            create: variants,
          },

          tags: {
            connect: Array.isArray(tagIds)
              ? tagIds.map(
                  (tagId: number) => ({
                    id: tagId,
                  }),
                )
              : [],
          },

          relatedFunctions: {
            connect: Array.isArray(
              relatedFunctionIds,
            )
              ? relatedFunctionIds.map(
                  (
                    relatedFunctionId:
                      number,
                  ) => ({
                    id:
                      relatedFunctionId,
                  }),
                )
              : [],
          },
        },

        include: {
        variants: true,
        categoryNode: true,
        tags: true,
        relatedFunctions: true,
      },
      });

    response
      .status(201)
      .json(createdFunction);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: '创建函数失败',
    });
  }
});

app.put('/api/functions/:id', async (request, response) => {
  const id = Number(request.params.id);

  if (Number.isNaN(id)) {
    return response.status(400).json({
      message: 'Invalid function id',
    });
  }

  const {
    name,
    description,
    categoryId,
    variants,
    tagIds,
    relatedFunctionIds,
  } = request.body;

  if (!name?.trim()) {
    return response.status(400).json({
      message: '请输入函数名',
    });
  }

  if (
    !Array.isArray(variants) ||
    variants.length === 0
  ) {
    return response.status(400).json({
      message: '至少需要一种写法',
    });
  }

  try {
    const updatedFunction =
      await prisma.$transaction(
        async (tx) => {
          await tx.functionVariant.deleteMany({
            where: {
              functionId: id,
            },
          });

          return tx.functionEntry.update({
            where: {
              id,
            },

            data: {
              name: name.trim(),

              description:
                description?.trim() || null,

              categoryId:
                categoryId ?? null,

              variants: {
                create: variants,
              },

              tags: {
                set: Array.isArray(tagIds)
                  ? tagIds.map(
                      (tagId: number) => ({
                        id: tagId,
                      }),
                    )
                  : [],
              },

              ...(Array.isArray(
                relatedFunctionIds,
              )
                ? {
                    relatedFunctions: {
                      set: relatedFunctionIds
                        .filter(
                          (
                            relatedFunctionId:
                              number,
                          ) =>
                            relatedFunctionId !==
                            id,
                        )
                        .map(
                          (
                            relatedFunctionId:
                              number,
                          ) => ({
                            id:
                              relatedFunctionId,
                          }),
                        ),
                    },
                  }
                : {}),
            },

            include: {
        variants: true,
        categoryNode: true,
        tags: true,
        relatedFunctions: true,
      },
          });
        },
      );

    response.json(updatedFunction);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: '更新函数失败',
    });
  }
});

app.patch(
  '/api/functions/:id/favorite',
  async (request, response) => {
    const id = Number(request.params.id);

    if (Number.isNaN(id)) {
      return response.status(400).json({
        message: 'Invalid function id',
      });
    }

    const {
      favorite,
    } = request.body;

    if (typeof favorite !== 'boolean') {
      return response.status(400).json({
        message: 'favorite must be boolean',
      });
    }

    try {
      const functionEntry =
        await prisma.functionEntry.update({
          where: {
            id,
          },

          data: {
            favorite,
          },

          include: {
        variants: true,
        categoryNode: true,
        tags: true,
        relatedFunctions: true,
      },
        });

      response.json(functionEntry);
    } catch (error) {
      console.error(error);

      response.status(500).json({
        message: '更新收藏状态失败',
      });
    }
  },
);

app.patch(
  '/api/functions/:id/note',
  async (request, response) => {
    const id = Number(request.params.id);

    if (Number.isNaN(id)) {
      return response.status(400).json({
        message: 'Invalid function id',
      });
    }

    const {
      note,
    } = request.body;

    if (
      note !== null &&
      typeof note !== 'string'
    ) {
      return response.status(400).json({
        message: 'note must be string or null',
      });
    }

    try {
      const functionEntry =
        await prisma.functionEntry.update({
          where: {
            id,
          },

          data: {
            note:
              typeof note === 'string'
                ? note.trim() || null
                : null,
          },

          include: {
        variants: true,
        categoryNode: true,
        tags: true,
        relatedFunctions: true,
      },
        });

      response.json(functionEntry);
    } catch (error) {
      console.error(error);

      response.status(500).json({
        message: '保存笔记失败',
      });
    }
  },
);

app.delete('/api/functions/:id', async (request, response) => {
  const id = Number(request.params.id);

  if (Number.isNaN(id)) {
    return response.status(400).json({
      message: 'Invalid function id',
    });
  }

  try {
    await prisma.functionEntry.delete({
      where: {
        id,
      },
    });

    response.status(204).send();
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: '删除函数失败',
    });
  }
});

app.get(
  '/api/function-options',
  async (_request, response) => {
    const functions =
      await prisma.functionEntry.findMany({
        select: {
          id: true,
          name: true,
        },

        orderBy: {
          name: 'asc',
        },
      });

    response.json(functions);
  },
);

/* =========================
   Categories
========================= */

app.get('/api/categories', async (_request, response) => {
  const categories =
    await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

  response.json(categories);
});

app.post('/api/categories', async (request, response) => {
  const {
    name,
    slug,
    parentId,
  } = request.body;

  if (!name?.trim()) {
    return response.status(400).json({
      message: '请输入分类名称',
    });
  }

  if (!slug?.trim()) {
    return response.status(400).json({
      message: '请输入分类 slug',
    });
  }

  try {
    const category =
      await prisma.category.create({
        data: {
          name: name.trim(),
          slug: slug.trim(),
          parentId:
            parentId ?? null,
        },
      });

    response
      .status(201)
      .json(category);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: '新增分类失败',
    });
  }
});

app.put('/api/categories/:id', async (request, response) => {
  const id = Number(request.params.id);

  if (Number.isNaN(id)) {
    return response.status(400).json({
      message: 'Invalid category id',
    });
  }

  const {
    name,
    slug,
    parentId,
  } = request.body;

  if (!name?.trim()) {
    return response.status(400).json({
      message: '请输入分类名称',
    });
  }

  if (!slug?.trim()) {
    return response.status(400).json({
      message: '请输入分类 slug',
    });
  }

  const nextParentId =
    parentId == null
      ? null
      : Number(parentId);

  if (
    nextParentId !== null &&
    Number.isNaN(nextParentId)
  ) {
    return response.status(400).json({
      message: 'Invalid parent id',
    });
  }

  if (nextParentId === id) {
    return response.status(400).json({
      message:
        '分类不能成为自己的父分类',
    });
  }

  if (nextParentId !== null) {
    let currentParentId: number | null =
      nextParentId;

    const visited =
      new Set<number>();

    while (currentParentId !== null) {
      if (
        visited.has(currentParentId)
      ) {
        return response
          .status(409)
          .json({
            message:
              '分类树中存在循环关系',
          });
      }

      visited.add(
        currentParentId,
      );

      if (
        currentParentId === id
      ) {
        return response
          .status(409)
          .json({
            message:
              '不能把分类移动到自己的子分类下面',
          });
      }

      const parent: {
        id: number;
        parentId: number | null;
      } | null =
        await prisma.category.findUnique({
          where: {
            id: currentParentId,
          },

          select: {
            id: true,
            parentId: true,
          },
        });

      if (!parent) {
        return response
          .status(400)
          .json({
            message:
              '父分类不存在',
          });
      }

      currentParentId =
        parent.parentId;
    }
  }

  try {
    const category =
      await prisma.category.update({
        where: {
          id,
        },

        data: {
          name: name.trim(),
          slug: slug.trim(),
          parentId:
            nextParentId,
        },
      });

    response.json(category);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: '修改分类失败',
    });
  }
});

app.delete('/api/categories/:id', async (request, response) => {
  const id = Number(request.params.id);

  if (Number.isNaN(id)) {
    return response.status(400).json({
      message: 'Invalid category id',
    });
  }

  const category =
    await prisma.category.findUnique({
      where: {
        id,
      },

      include: {
        children: true,
        functions: true,
      },
    });

  if (!category) {
    return response.status(404).json({
      message: 'Category not found',
    });
  }

  if (
    category.children.length > 0
  ) {
    return response.status(409).json({
      message:
        '该分类下面还有子分类，不能删除',
    });
  }

  if (
    category.functions.length > 0
  ) {
    return response.status(409).json({
      message:
        '该分类下面还有函数，不能删除',
    });
  }

  try {
    await prisma.category.delete({
      where: {
        id,
      },
    });

    response.status(204).send();
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: '删除分类失败',
    });
  }
});

/* =========================
   Tags
========================= */

app.get('/api/tags', async (_request, response) => {
  const tags =
    await prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });

  response.json(tags);
});

app.post('/api/tags', async (request, response) => {
  const {
    name,
    slug,
  } = request.body;

  if (!name?.trim()) {
    return response.status(400).json({
      message: '请输入标签名称',
    });
  }

  if (!slug?.trim()) {
    return response.status(400).json({
      message: '请输入标签 slug',
    });
  }

  try {
    const tag =
      await prisma.tag.create({
        data: {
          name: name.trim(),
          slug: slug.trim(),
        },
      });

    response
      .status(201)
      .json(tag);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: '新增标签失败',
    });
  }
});

app.delete('/api/tags/:id', async (request, response) => {
  const id = Number(request.params.id);

  if (Number.isNaN(id)) {
    return response.status(400).json({
      message: 'Invalid tag id',
    });
  }

  const tag =
    await prisma.tag.findUnique({
      where: {
        id,
      },

      include: {
        functions: true,
      },
    });

  if (!tag) {
    return response.status(404).json({
      message: 'Tag not found',
    });
  }

  if (
    tag.functions.length > 0
  ) {
    return response.status(409).json({
      message:
        '该标签仍被函数使用，不能删除',
    });
  }

  try {
    await prisma.tag.delete({
      where: {
        id,
      },
    });

    response.status(204).send();
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: '删除标签失败',
    });
  }
});

/* =========================
   Server
========================= */

const port =
  Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(
    `Server running on http://localhost:${port}`,
  );
});
