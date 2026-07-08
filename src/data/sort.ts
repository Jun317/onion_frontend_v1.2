import type { IssueCard, SortKey } from './types';

export function sortIssues(issues: IssueCard[], sort: SortKey): IssueCard[] {
  const sorted = [...issues];
  if (sort === 'latest') {
    sorted.sort((a, b) => b.last_update.localeCompare(a.last_update));
  } else {
    sorted.sort(
      (a, b) => b.importance - a.importance || b.last_update.localeCompare(a.last_update),
    );
  }
  // stale 이슈는 정렬 기준과 무관하게 항상 뒤로 (active 우선)
  sorted.sort((a, b) => Number(a.status === 'stale') - Number(b.status === 'stale'));
  return sorted;
}
