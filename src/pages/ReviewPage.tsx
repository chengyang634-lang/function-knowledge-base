import {
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { apiUrl } from '../lib/api';
import type {
  FunctionEntry,
  LearningStatus,
} from '../types/function';
import './review.css';

type ReviewMode =
  | 'priority'
  | 'unmastered'
  | 'mistakes'
  | 'all';

type ReviewHistoryEntry = {
  id: string;
  functionId: number;
  functionName: string;
  categoryName: string | null;
  previousStatus: LearningStatus;
  result: LearningStatus;
  reviewedAt: string;
};

const REVIEW_HISTORY_KEY =
  'function-base-review-history-v1';

const MAX_REVIEW_HISTORY = 200;

const STATUS_OPTIONS: ReadonlyArray<{
  value: LearningStatus;
  label: string;
  actionLabel: string;
}> = [
  {
    value: 'unlearned',
    label: '未学习',
    actionLabel: '不会',
  },
  {
    value: 'learning',
    label: '学习中',
    actionLabel: '有点模糊',
  },
  {
    value: 'mastered',
    label: '已掌握',
    actionLabel: '掌握了',
  },
];

function learningStatusLabel(
  status: LearningStatus,
): string {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value === status,
    )?.label ?? status
  );
}

function reviewResultLabel(
  status: LearningStatus,
): string {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value === status,
    )?.actionLabel ?? status
  );
}

function readReviewHistory():
  ReviewHistoryEntry[] {
  try {
    const raw = localStorage.getItem(
      REVIEW_HISTORY_KEY,
    );

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is ReviewHistoryEntry => {
          if (
            typeof item !== 'object' ||
            item === null
          ) {
            return false;
          }

          const entry = item as
            Partial<ReviewHistoryEntry>;

          return (
            typeof entry.id === 'string' &&
            typeof entry.functionId ===
              'number' &&
            typeof entry.functionName ===
              'string' &&
            typeof entry.reviewedAt ===
              'string' &&
            (entry.previousStatus ===
              'unlearned' ||
              entry.previousStatus ===
                'learning' ||
              entry.previousStatus ===
                'mastered') &&
            (entry.result ===
              'unlearned' ||
              entry.result ===
                'learning' ||
              entry.result ===
                'mastered')
          );
        },
      )
      .slice(0, MAX_REVIEW_HISTORY);
  } catch {
    return [];
  }
}

function buildMistakeFunctionIds(
  history: ReviewHistoryEntry[],
): Set<number> {
  const latestStatus = new Map<
    number,
    LearningStatus
  >();

  history.forEach((entry) => {
    if (
      !latestStatus.has(
        entry.functionId,
      )
    ) {
      latestStatus.set(
        entry.functionId,
        entry.result,
      );
    }
  });

  return new Set(
    [...latestStatus.entries()]
      .filter(
        ([, status]) =>
          status !== 'mastered',
      )
      .map(([functionId]) =>
        functionId,
      ),
  );
}

function formatReviewTime(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function reviewWeight(
  functionEntry: FunctionEntry,
  mode: ReviewMode,
  mistakeFunctionIds: Set<number>,
): number {
  if (mode === 'mistakes') {
    return mistakeFunctionIds.has(
      functionEntry.id,
    )
      ? 1
      : 0;
  }

  if (mode === 'all') {
    return 1;
  }

  if (
    mode === 'unmastered' &&
    functionEntry.learningStatus ===
      'mastered'
  ) {
    return 0;
  }

  switch (
    functionEntry.learningStatus
  ) {
    case 'unlearned':
      return 5;

    case 'learning':
      return 3;

    case 'mastered':
    default:
      return 1;
  }
}

function pickReviewFunction(
  functions: FunctionEntry[],
  mode: ReviewMode,
  currentFunctionId: number | null,
  mistakeFunctionIds: Set<number>,
): FunctionEntry | null {
  let candidates =
    functions.filter(
      (functionEntry) =>
        reviewWeight(
          functionEntry,
          mode,
          mistakeFunctionIds,
        ) > 0,
    );

  if (candidates.length > 1) {
    candidates = candidates.filter(
      (functionEntry) =>
        functionEntry.id !==
        currentFunctionId,
    );
  }

  if (candidates.length === 0) {
    return null;
  }

  const totalWeight =
    candidates.reduce(
      (total, functionEntry) =>
        total +
        reviewWeight(
          functionEntry,
          mode,
          mistakeFunctionIds,
        ),
      0,
    );

  let target =
    Math.random() * totalWeight;

  for (const functionEntry of candidates) {
    target -= reviewWeight(
      functionEntry,
      mode,
      mistakeFunctionIds,
    );

    if (target <= 0) {
      return functionEntry;
    }
  }

  return (
    candidates[
      candidates.length - 1
    ] ?? null
  );
}

function ReviewPage() {
  const [
    functions,
    setFunctions,
  ] = useState<FunctionEntry[]>([]);

  const [
    currentFunction,
    setCurrentFunction,
  ] = useState<FunctionEntry | null>(
    null,
  );

  const [mode, setMode] =
    useState<ReviewMode>('priority');

  const [revealed, setRevealed] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [
    reviewHistory,
    setReviewHistory,
  ] = useState<ReviewHistoryEntry[]>(
    () => readReviewHistory(),
  );

  useEffect(() => {
    let active = true;

    async function loadFunctions() {
      try {
        const response = await fetch(
          apiUrl('/api/functions'),
        );

        if (!response.ok) {
          throw new Error(
            '加载函数失败',
          );
        }

        const data: FunctionEntry[] =
          await response.json();

        if (!active) {
          return;
        }

        setFunctions(data);
        setCurrentFunction(
          pickReviewFunction(
            data,
            'priority',
            null,
            buildMistakeFunctionIds(
              readReviewHistory(),
            ),
          ),
        );
      } catch (error) {
        console.error(error);

        if (active) {
          setMessage(
            '加载复习题目失败',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFunctions();

    return () => {
      active = false;
    };
  }, []);

  function nextQuestion(
    nextFunctions = functions,
    nextMode = mode,
    nextHistory = reviewHistory,
  ) {
    const next = pickReviewFunction(
      nextFunctions,
      nextMode,
      currentFunction?.id ?? null,
      buildMistakeFunctionIds(
        nextHistory,
      ),
    );

    setCurrentFunction(next);
    setRevealed(false);
    setMessage('');
  }

  function changeMode(
    nextMode: ReviewMode,
  ) {
    setMode(nextMode);
    nextQuestion(
      functions,
      nextMode,
      reviewHistory,
    );
  }

  async function updateLearningStatus(
    learningStatus: LearningStatus,
  ) {
    if (!currentFunction) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const response = await fetch(
        apiUrl(
          `/api/functions/${currentFunction.id}/learning-status`,
        ),
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            learningStatus,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          '更新学习状态失败',
        );
      }

      const updatedFunction:
        FunctionEntry =
        await response.json();

      const historyEntry:
        ReviewHistoryEntry = {
        id: `${Date.now()}-${
          currentFunction.id
        }`,
        functionId:
          currentFunction.id,
        functionName:
          currentFunction.name,
        categoryName:
          currentFunction.categoryNode
            ?.name ?? null,
        previousStatus:
          currentFunction.learningStatus,
        result: learningStatus,
        reviewedAt:
          new Date().toISOString(),
      };

      const nextHistory = [
        historyEntry,
        ...reviewHistory,
      ].slice(
        0,
        MAX_REVIEW_HISTORY,
      );

      setReviewHistory(nextHistory);
      localStorage.setItem(
        REVIEW_HISTORY_KEY,
        JSON.stringify(nextHistory),
      );

      const nextFunctions =
        functions.map(
          (functionEntry) =>
            functionEntry.id ===
            updatedFunction.id
              ? updatedFunction
              : functionEntry,
        );

      setFunctions(nextFunctions);
      setCurrentFunction(
        updatedFunction,
      );
      setMessage(
        `已标记为${learningStatusLabel(
          learningStatus,
        )}`,
      );
    } catch (error) {
      console.error(error);
      setMessage(
        '更新学习状态失败',
      );
    } finally {
      setSaving(false);
    }
  }

  const mistakeFunctionIds =
    buildMistakeFunctionIds(
      reviewHistory,
    );

  const reviewResultCounts = {
    unlearned: reviewHistory.filter(
      (entry) =>
        entry.result === 'unlearned',
    ).length,
    learning: reviewHistory.filter(
      (entry) =>
        entry.result === 'learning',
    ).length,
    mastered: reviewHistory.filter(
      (entry) =>
        entry.result === 'mastered',
    ).length,
  };

  function clearReviewHistory() {
    setReviewHistory([]);
    localStorage.removeItem(
      REVIEW_HISTORY_KEY,
    );

    if (mode === 'mistakes') {
      nextQuestion(
        functions,
        'mistakes',
        [],
      );
    }
  }

  function reopenFromHistory(
    functionId: number,
  ) {
    const target = functions.find(
      (functionEntry) =>
        functionEntry.id === functionId,
    );

    if (!target) {
      setMessage(
        '这个函数已经不存在',
      );
      return;
    }

    setCurrentFunction(target);
    setRevealed(false);
    setMessage(
      '已从复习记录重新打开',
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  const statusCounts = {
    unlearned: functions.filter(
      (functionEntry) =>
        functionEntry.learningStatus ===
        'unlearned',
    ).length,

    learning: functions.filter(
      (functionEntry) =>
        functionEntry.learningStatus ===
        'learning',
    ).length,

    mastered: functions.filter(
      (functionEntry) =>
        functionEntry.learningStatus ===
        'mastered',
    ).length,
  };

  return (
    <main className="review-page">
      <header className="review-header">
        <div>
          <h1>随机抽查</h1>

          <p>
            先闭卷回忆，再显示答案并更新掌握度。
          </p>
        </div>

        <Link to="/">
          返回知识库
        </Link>
      </header>

      <section className="review-toolbar">
        <div className="review-mode-options">
          <button
            type="button"
            className={
              mode === 'priority'
                ? 'active'
                : ''
            }
            onClick={() =>
              changeMode('priority')
            }
          >
            优先薄弱项
          </button>

          <button
            type="button"
            className={
              mode === 'unmastered'
                ? 'active'
                : ''
            }
            onClick={() =>
              changeMode('unmastered')
            }
          >
            只抽未掌握
          </button>

          <button
            type="button"
            className={
              mode === 'mistakes'
                ? 'active'
                : ''
            }
            onClick={() =>
              changeMode('mistakes')
            }
          >
            错题本 {mistakeFunctionIds.size}
          </button>

          <button
            type="button"
            className={
              mode === 'all'
                ? 'active'
                : ''
            }
            onClick={() =>
              changeMode('all')
            }
          >
            全部随机
          </button>
        </div>

        <div className="review-progress-summary">
          <span>
            未学习 {statusCounts.unlearned}
          </span>
          <span>
            学习中 {statusCounts.learning}
          </span>
          <span>
            已掌握 {statusCounts.mastered}
          </span>
          <span>
            错题 {mistakeFunctionIds.size}
          </span>
        </div>
      </section>

      {loading ? (
        <section className="review-card">
          <p>正在准备题目...</p>
        </section>
      ) : currentFunction ? (
        <section className="review-card">
          <div className="review-question-meta">
            <span>
              {currentFunction.categoryNode
                ?.name ?? '未分类'}
            </span>

            <span>
              当前：
              {learningStatusLabel(
                currentFunction.learningStatus,
              )}
            </span>
          </div>

          <h2>
            {currentFunction.name}
          </h2>

          <div className="review-prompt">
            <strong>闭卷回答</strong>

            <p>
              先说出它的用途、关键输入或返回结果，以及你能记住的典型写法。
            </p>
          </div>

          {!revealed ? (
            <button
              type="button"
              className="review-reveal-button"
              onClick={() =>
                setRevealed(true)
              }
            >
              显示答案
            </button>
          ) : (
            <div className="review-answer">
              {currentFunction.description && (
                <p>
                  {currentFunction.description}
                </p>
              )}

              {currentFunction.variants.map(
                (variant) => (
                  <section
                    key={variant.id}
                    className="review-variant"
                  >
                    <h3>{variant.name}</h3>

                    <pre>
                      <code>
                        {variant.code}
                      </code>
                    </pre>

                    {variant.explanation && (
                      <p>
                        {variant.explanation}
                      </p>
                    )}
                  </section>
                ),
              )}

              <div className="review-rating">
                <strong>
                  这题现在掌握得怎样？
                </strong>

                <div>
                  {STATUS_OPTIONS.map(
                    (option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={saving}
                        className={
                          currentFunction.learningStatus ===
                          option.value
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          void updateLearningStatus(
                            option.value,
                          )
                        }
                      >
                        {option.actionLabel}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="review-card-footer">
            {message ? (
              <span>{message}</span>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() =>
                nextQuestion()
              }
            >
              下一题 →
            </button>
          </div>
        </section>
      ) : (
        <section className="review-card">
          <h2>当前模式没有可抽查的函数</h2>

          <p>
            可以切换到“全部随机”，或者先在知识库中新增函数。
          </p>
        </section>
      )}

      <section className="review-history">
        <div className="review-history-header">
          <div>
            <h2>复习记录</h2>

            <p>
              每次评分都会留下记录；错题本按每个函数最近一次结果计算。
            </p>
          </div>

          {reviewHistory.length > 0 && (
            <button
              type="button"
              onClick={clearReviewHistory}
            >
              清空记录
            </button>
          )}
        </div>

        <div className="review-history-summary">
          <span>
            总复习 {reviewHistory.length}
          </span>
          <span>
            不会 {reviewResultCounts.unlearned}
          </span>
          <span>
            模糊 {reviewResultCounts.learning}
          </span>
          <span>
            掌握 {reviewResultCounts.mastered}
          </span>
        </div>

        {reviewHistory.length === 0 ? (
          <p className="review-history-empty">
            还没有复习记录。显示答案并评分后，这里会自动记录。
          </p>
        ) : (
          <div className="review-history-list">
            {reviewHistory
              .slice(0, 15)
              .map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="review-history-item"
                  onClick={() =>
                    reopenFromHistory(
                      entry.functionId,
                    )
                  }
                >
                  <span className="review-history-main">
                    <strong>
                      {entry.functionName}
                    </strong>

                    <small>
                      {entry.categoryName ??
                        '未分类'}
                      {' · '}
                      {formatReviewTime(
                        entry.reviewedAt,
                      )}
                    </small>
                  </span>

                  <span
                    className={`review-result-badge result-${entry.result}`}
                  >
                    {reviewResultLabel(
                      entry.result,
                    )}
                  </span>
                </button>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default ReviewPage;
