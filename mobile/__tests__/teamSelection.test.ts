import {
  canClaimWithSelectedTeam,
  resolveSelectedTeam,
} from '../src/domain/teamSelection';
import { defaultTeams } from '../src/domain/seed';

describe('resolveSelectedTeam', () => {
  test('returns undefined when no team is selected', () => {
    expect(resolveSelectedTeam(defaultTeams, undefined)).toBeUndefined();
  });

  test('returns the matching team for a selected id', () => {
    const selected = resolveSelectedTeam(defaultTeams, 'team-2');

    expect(selected?.id).toBe('team-2');
    expect(selected?.name).toBe('Team 2');
  });

  test('returns undefined for an unknown team id', () => {
    expect(resolveSelectedTeam(defaultTeams, 'team-missing')).toBeUndefined();
  });
});

describe('canClaimWithSelectedTeam', () => {
  test('allows claiming only when a team is selected and the task is open', () => {
    expect(canClaimWithSelectedTeam(defaultTeams[0], false)).toBe(true);
    expect(canClaimWithSelectedTeam(undefined, false)).toBe(false);
    expect(canClaimWithSelectedTeam(defaultTeams[0], true)).toBe(false);
    expect(canClaimWithSelectedTeam(undefined, true)).toBe(false);
  });
});
