/**
 * BMW CINEMA Live Sports & Football API Service
 * Handles live matches, league standings, top scorers, and fixture analytics
 */

const SPORTS_BASE = 'https://live-novascore.officialhectormanuel.workers.dev/api';

export interface LiveMatch {
  id: number;
  fixture: number;
  league: {
    name: string;
    img: string;
  };
  kickoff: string;
  live: boolean;
  hot: boolean;
  home: {
    name: string;
    img: string;
  };
  away: {
    name: string;
    img: string;
  };
  state: string | null;
  score: {
    home: number;
    away: number;
  } | null;
}

export interface StandingRow {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  gd: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  form?: string;
  all?: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
}

export interface TopScorer {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: {
    team: {
      id: number;
      name: string;
      logo: string;
    };
    goals: {
      total: number;
      assists?: number;
    };
    games?: {
      appearances: number;
      minutes?: number;
    };
  }[];
}

export const POPULAR_LEAGUES = [
  { id: 39, name: 'Premier League', season: 2026, country: 'England' },
  { id: 140, name: 'La Liga', season: 2026, country: 'Spain' },
  { id: 2, name: 'UEFA Champions League', season: 2026, country: 'Europe' },
  { id: 78, name: 'Bundesliga', season: 2026, country: 'Germany' },
  { id: 1, name: 'FIFA World Cup', season: 2026, country: 'World' },
];

/**
 * Fetch all currently live matches
 */
export async function getLiveMatches(): Promise<LiveMatch[]> {
  try {
    const res = await fetch(`${SPORTS_BASE}/matches/live`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.matches || [];
  } catch (err) {
    console.warn('[Sports API] Failed to fetch live matches:', err);
    return [];
  }
}

/**
 * Fetch league standings with robust data normalization
 */
export async function getLeagueStandings(leagueId: number = 39, season: number = 2026): Promise<StandingRow[]> {
  try {
    const res = await fetch(`${SPORTS_BASE}/standings?league=${leagueId}&season=${season}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.standings && data.standings.length > 0) {
      const st0 = data.standings[0];
      let rawRows: any[] = [];

      if (st0 && Array.isArray(st0.groups)) {
        // Flatten all groups into a unified table
        rawRows = st0.groups.flat();
      } else if (Array.isArray(st0)) {
        rawRows = st0;
      }

      return rawRows.map((item: any, idx: number): StandingRow => {
        const played = Number(item.played ?? item.all?.played ?? 0);
        const win = Number(item.win ?? item.all?.win ?? 0);
        const draw = Number(item.draw ?? item.all?.draw ?? 0);
        const lose = Number(item.lose ?? item.all?.lose ?? 0);
        const gd = Number(item.gd ?? item.goalsDiff ?? (item.gf !== undefined && item.ga !== undefined ? item.gf - item.ga : 0));
        const points = Number(item.points ?? 0);

        return {
          rank: Number(item.rank ?? idx + 1),
          team: {
            id: Number(item.team?.id ?? idx + 1),
            name: String(item.team?.name || 'Club'),
            logo: String(item.team?.logo || ''),
          },
          points,
          goalsDiff: gd,
          gd,
          played,
          win,
          draw,
          lose,
          form: item.form || '',
          all: {
            played,
            win,
            draw,
            lose,
            goals: {
              for: Number(item.gf ?? item.all?.goals?.for ?? 0),
              against: Number(item.ga ?? item.all?.goals?.against ?? 0),
            },
          },
        };
      });
    }
    return [];
  } catch (err) {
    console.warn(`[Sports API] Failed to fetch standings for league ${leagueId}:`, err);
    return [];
  }
}

/**
 * Fetch top scorers for a given league and season
 */
export async function getTopScorers(leagueId: number = 39, season: number = 2026): Promise<TopScorer[]> {
  try {
    const res = await fetch(`${SPORTS_BASE}/topscorers?league=${leagueId}&season=${season}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.players || [];
  } catch (err) {
    console.warn(`[Sports API] Failed to fetch top scorers for league ${leagueId}:`, err);
    return [];
  }
}

/**
 * Fetch details of a specific fixture
 */
export async function getFixtureDetails(fixtureId: number | string): Promise<any> {
  try {
    const res = await fetch(`${SPORTS_BASE}/fixture?id=${fixtureId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`[Sports API] Failed to fetch fixture ${fixtureId}:`, err);
    return null;
  }
}
