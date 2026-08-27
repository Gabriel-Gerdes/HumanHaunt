import { filterTasksByTitleQuery } from '../src/domain/taskSearch';

interface FixtureTask {
  id: string;
  title: string;
}

const tasks: FixtureTask[] = [
  { id: '1', title: 'Buy groceries' },
  { id: '2', title: 'Walk the dog' },
  { id: '3', title: 'buy concert tickets' },
  { id: '4', title: 'Clean the kitchen' },
];

describe('filterTasksByTitleQuery', () => {
  it('filters tasks by a case-insensitive substring of the title', () => {
    const result = filterTasksByTitleQuery(tasks, 'buy');

    expect(result.map(task => task.id)).toEqual(['1', '3']);
  });

  it('matches substrings in the middle of titles', () => {
    const result = filterTasksByTitleQuery(tasks, 'the');

    expect(result.map(task => task.id)).toEqual(['2', '4']);
  });

  it('returns the original list unchanged for an empty query', () => {
    const result = filterTasksByTitleQuery(tasks, '');

    expect(result).toBe(tasks);
  });

  it('returns the original list unchanged for a whitespace-only query', () => {
    const result = filterTasksByTitleQuery(tasks, '   ');

    expect(result).toBe(tasks);
  });

  it('treats regex metacharacters as literal text instead of RegExp syntax', () => {
    const specialTasks: FixtureTask[] = [
      { id: 'a', title: 'C++ (advanced) notes' },
      { id: 'b', title: 'backup of notes.txt' },
    ];

    expect(() =>
      filterTasksByTitleQuery(specialTasks, '(advanced'),
    ).not.toThrow();

    const result = filterTasksByTitleQuery(specialTasks, 'c++ (adv');
    expect(result.map(task => task.id)).toEqual(['a']);
  });

  it('never throws on arbitrary user input containing regex metacharacters', () => {
    const hostileQueries = [
      '(', ')', '*', '+', '?', '.', '^', '$', '|', '[', ']', '{', '}', '\\\\',
    ];

    for (const query of hostileQueries) {
      expect(() => filterTasksByTitleQuery(tasks, query)).not.toThrow();
    }
  });

  it('returns an empty list when nothing matches', () => {
    const result = filterTasksByTitleQuery(tasks, 'nonexistent');

    expect(result).toEqual([]);
  });
});
