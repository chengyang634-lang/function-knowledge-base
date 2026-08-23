import fs from 'node:fs';
import path from 'node:path';

const roots = [
  path.resolve('src'),
  path.resolve('server', 'src'),
];

const extensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.html',
]);

const replacements = new Map([
  ['â˜† æ”¶è—', '☆ 收藏'],
  ['â˜… å·²æ”¶è—', '★ 已收藏'],
  ['å¤åˆ¶', '复制'],
  ['âœ“ å·²å¤åˆ¶', '✓ 已复制'],
  ['ä¿å­˜ç¬”è®°', '保存笔记'],
  ['ä¿å­˜ä¸­...', '保存中...'],
  ['ç¬”è®°å·²ä¿å­˜', '笔记已保存'],
  ['ç¬”è®°ä¿å­˜å¤±è´¥', '笔记保存失败'],
  [
    'è®°å½•ä½ å¯¹è¿™ä¸ªå‡½æ•°çš„ç†è§£ã€æ³¨æ„äº‹é¡¹å’Œå¤ç”¨ç»éªŒ...',
    '记录你对这个函数的理解、注意事项和复用经验...',
  ],
  ['åŠ è½½ä¸­...', '加载中...'],
  ['æš‚æ— å‡½æ•°ã€‚', '暂无函数。'],
  ['æ¥æºï¼š', '来源：'],
  ['ç›¸å…³å‡½æ•°', '相关函数'],
  ['æˆ‘çš„ç¬”è®°', '我的笔记'],
  ['å·²æ”¶è—', '已收藏'],
  ['æ”¶è—', '收藏'],
]);

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];

  for (
    const entry of fs.readdirSync(
      dir,
      {
        withFileTypes: true,
      },
    )
  ) {
    const fullPath =
      path.join(
        dir,
        entry.name,
      );

    if (entry.isDirectory()) {
      results.push(
        ...walk(fullPath),
      );

      continue;
    }

    if (
      entry.isFile() &&
      extensions.has(
        path.extname(
          entry.name,
        ).toLowerCase(),
      )
    ) {
      results.push(
        fullPath,
      );
    }
  }

  return results;
}

let changedFiles = 0;
let totalReplacements = 0;

for (const root of roots) {
  for (
    const filePath of walk(root)
  ) {
    let content =
      fs.readFileSync(
        filePath,
        'utf8',
      );

    const original = content;

    let fileReplacementCount =
      0;

    for (
      const [
        broken,
        fixed,
      ] of replacements
    ) {
      if (
        !content.includes(
          broken,
        )
      ) {
        continue;
      }

      const parts =
        content.split(
          broken,
        );

      const count =
        parts.length - 1;

      content =
        parts.join(
          fixed,
        );

      fileReplacementCount +=
        count;

      totalReplacements +=
        count;
    }

    if (
      content === original
    ) {
      continue;
    }

    const backupPath =
      `${filePath}.bak-chinese`;

    if (
      !fs.existsSync(
        backupPath,
      )
    ) {
      fs.copyFileSync(
        filePath,
        backupPath,
      );
    }

    fs.writeFileSync(
      filePath,
      content,
      'utf8',
    );

    changedFiles += 1;

    console.log(
      `修复: ${path.relative(
        process.cwd(),
        filePath,
      )} (${fileReplacementCount} 处)`,
    );
  }
}

console.log('');

console.log(
  `完成：修复 ${changedFiles} 个文件，共 ${totalReplacements} 处乱码。`,
);

console.log(
  '备份文件后缀：.bak-chinese',
);

console.log('');

console.log(
  '下一步运行：npm run build',
);