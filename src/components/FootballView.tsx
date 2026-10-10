import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Radio,
  Clock,
  RefreshCw,
  Award,
  Shield,
  Activity,
  X,
} from 'lucide-react';
import {
  LiveMatch,
  StandingRow,
  TopScorer,
  POPULAR_LEAGUES,
  getLiveMatches,
  getLeagueStandings,
  getTopScorers,
  getFixtureDetails,
} from '../api/football';

export const FootballView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'standings' | 'scorers'>('live');
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  // Standings State
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  // Top Scorers State
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [scorersLoading, setScorersLoading] = useState(false);

  // Fixture Modal
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [fixtureData, setFixtureData] = useState<any>(null);
  const [fixtureLoading, setFixtureLoading] = useState(false);

  // Fetch live matches
  const fetchLive = async () => {
    setLiveLoading(true);
    try {
      const matches = await getLiveMatches();
      setLiveMatches(matches);
    } catch (err) {
      console.warn('Error fetching live matches:', err);
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch standings when league changes
  useEffect(() => {
    let isCurrent = true;
    async function loadStandings() {
      setStandingsLoading(true);
      try {
        const rows = await getLeagueStandings(selectedLeague.id, selectedLeague.season);
        if (isCurrent) setStandings(rows);
      } catch (err) {
        console.warn('Standings error:', err);
      } finally {
        if (isCurrent) setStandingsLoading(false);
      }
    }

    if (activeTab === 'standings') {
      loadStandings();
    }

    return () => {
      isCurrent = false;
    };
  }, [selectedLeague, activeTab]);

  // Fetch top scorers when league changes
  useEffect(() => {
    let isCurrent = true;
    async function loadScorers() {
      setScorersLoading(true);
      try {
        const players = await getTopScorers(selectedLeague.id, selectedLeague.season);
        if (isCurrent) setTopScorers(players);
      } catch (err) {
        console.warn('Top scorers error:', err);
      } finally {
        if (isCurrent) setScorersLoading(false);
      }
    }

    if (activeTab === 'scorers') {
      loadScorers();
    }

    return () => {
      isCurrent = false;
    };
  }, [selectedLeague, activeTab]);

  const handleOpenFixture = async (match: LiveMatch) => {
    setSelectedMatch(match);
    setFixtureLoading(true);
    setFixtureData(null);
    try {
      if (match.fixture) {
        const data = await getFixtureDetails(match.fixture);
        setFixtureData(data);
      }
    } catch (e) {
      console.warn('Fixture details error:', e);
    } finally {
      setFixtureLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#ff6b35] text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-[#ff6b35] animate-ping" />
            <Activity className="w-4 h-4" />
            <span>BMW CINEMA SPORTS ARENA</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Live Football & League Tables
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Follow live matches, standings, and top goalscorers from Europe's top leagues in real-time.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#262626] rounded-xl self-start md:self-auto shadow-md">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'live'
                ? 'bg-[#ff6b35] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Matches ({liveMatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'standings'
                ? 'bg-[#ff6b35] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Standings</span>
          </button>

          <button
            onClick={() => setActiveTab('scorers')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'scorers'
                ? 'bg-[#ff6b35] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Top Scorers</span>
          </button>
        </div>
      </div>

      {/* 1. LIVE MATCHES SECTION */}
      {activeTab === 'live' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>Current Live & Upcoming Fixtures</span>
            </h2>
            <button
              onClick={fetchLive}
              disabled={liveLoading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ff6b35] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Scores</span>
            </button>
          </div>

          {liveLoading && liveMatches.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Fetching live match telemetry...</p>
            </div>
          ) : liveMatches.length === 0 ? (
            <div className="py-20 text-center bg-[#141414] rounded-2xl border border-[#262626] p-8 max-w-lg mx-auto">
              <Radio className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Matches Currently In Play</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                There are no live games underway right now. Check back shortly for kickoff or explore league standings and top scorers.
              </p>
              <button
                onClick={() => setActiveTab('standings')}
                className="px-4 py-2 bg-[#ff6b35] text-black text-xs font-bold rounded-lg hover:bg-[#ff8354] transition-colors"
              >
                View League Standings
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((m) => {
                const homeScore = m.score?.home ?? '-';
                const awayScore = m.score?.away ?? '-';
                const isLive = m.live;
                const kickoffDate = m.kickoff ? new Date(m.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Kickoff';

                return (
                  <div
                    key={m.id || m.fixture}
                    onClick={() => handleOpenFixture(m)}
                    className="bg-[#141414] hover:bg-[#1a1a1a] rounded-xl p-4 border border-[#262626] hover:border-[#ff6b35]/60 transition-all cursor-pointer shadow-lg group relative flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-[#262626]/80 text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        {m.league?.img && (
                          <img
                            src={m.league.img}
                            alt={m.league.name}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span className="text-gray-300 font-medium truncate">{m.league?.name || 'Football'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {kickoffDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Teams & Score */}
                    <div className="space-y-3 my-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          {m.home?.img ? (
                            <img
                              src={m.home.img}
                              alt={m.home.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 object-contain shrink-0"
                            />
                          ) : (
                            <Shield className="w-5 h-5 text-gray-500 shrink-0" />
                          )}
                          <span className="font-semibold text-sm text-white truncate">{m.home?.name || 'Home'}</span>
                        </div>
                        <span className="font-mono text-base font-black text-white px-2 py-0.5 bg-black/40 rounded border border-white/5 min-w-[28px] text-center">
                          {homeScore}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          {m.away?.img ? (
                            <img
                              src={m.away.img}
                              alt={m.away.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 object-contain shrink-0"
                            />
                          ) : (
                            <Shield className="w-5 h-5 text-gray-500 shrink-0" />
                          )}
                          <span className="font-semibold text-sm text-white truncate">{m.away?.name || 'Away'}</span>
                        </div>
                        <span className="font-mono text-base font-black text-white px-2 py-0.5 bg-black/40 rounded border border-white/5 min-w-[28px] text-center">
                          {awayScore}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-[#262626]/80 flex items-center justify-between text-xs text-gray-400">
                      <span className="group-hover:text-[#ff6b35] transition-colors flex items-center gap-1 font-medium">
                        Match Center & Stats &rarr;
                      </span>
                      {m.hot && (
                        <span className="flex items-center gap-1 text-[#ff6b35] text-[11px] font-semibold">
                          <Flame className="w-3.5 h-3.5 fill-current" /> Hot Match
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 2. LEAGUE STANDINGS SECTION */}
      {activeTab === 'standings' && (
        <section className="space-y-6">
          {/* League Selector Ribbon */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
            {POPULAR_LEAGUES.map((league) => {
              const isSelected = selectedLeague.id === league.id;
              return (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#ff6b35] text-black shadow-[0_2px_12px_rgba(255,107,53,0.35)]'
                      : 'bg-[#141414] text-gray-300 hover:text-white hover:bg-[#1a1a1a] border border-[#262626]'
                  }`}
                >
                  {league.name} ({league.season})
                </button>
              );
            })}
          </div>

          {standingsLoading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading {selectedLeague.name} standings...</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm bg-[#141414] rounded-2xl border border-[#262626] p-6">
              Standings data is currently updating for {selectedLeague.name}. Please select another league above.
            </div>
          ) : (
            <div className="bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#ff6b35]" />
                  <h3 className="font-bold text-white text-base">
                    {selectedLeague.name} Table — {selectedLeague.season} Season
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-mono">Live Sync</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-[11px] tracking-wider border-b border-[#262626]">
                    <tr>
                      <th className="py-3 px-3 sm:px-4 w-12 text-center">Pos</th>
                      <th className="py-3 px-3 sm:px-4">Club</th>
                      <th className="py-3 px-2 text-center w-12 font-mono">P</th>
                      <th className="py-3 px-2 text-center w-12 font-mono">W</th>
                      <th className="py-3 px-2 text-center w-12 font-mono">D</th>
                      <th className="py-3 px-2 text-center w-12 font-mono">L</th>
                      <th className="py-3 px-2 text-center w-12 font-mono">GD</th>
                      <th className="py-3 px-3 sm:px-4 text-center w-14 font-mono font-black text-white">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {standings.map((row, idx) => {
                      const rank = row.rank ?? idx + 1;
                      const played = row.played ?? row.all?.played ?? 0;
                      const win = row.win ?? row.all?.win ?? 0;
                      const draw = row.draw ?? row.all?.draw ?? 0;
                      const lose = row.lose ?? row.all?.lose ?? 0;
                      const gd = row.gd ?? row.goalsDiff ?? 0;
                      const points = row.points ?? 0;
                      const teamName = row.team?.name || 'Club';
                      const teamLogo = row.team?.logo || '';

                      return (
                        <tr
                          key={`${row.team?.id || idx}-${rank}`}
                          className="hover:bg-[#1a1a1a]/80 transition-colors"
                        >
                          <td className="py-3 px-3 sm:px-4 text-center font-bold">
                            <span
                              className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-mono ${
                                rank <= 4
                                  ? 'bg-[#ff6b35] text-black font-black'
                                  : 'text-gray-400'
                              }`}
                            >
                              {rank}
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center gap-2.5">
                              {teamLogo ? (
                                <img
                                  src={teamLogo}
                                  alt={teamName}
                                  referrerPolicy="no-referrer"
                                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                                />
                              ) : (
                                <Shield className="w-5 h-5 text-gray-500 shrink-0" />
                              )}
                              <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-none">
                                {teamName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-gray-300">{played}</td>
                          <td className="py-3 px-2 text-center font-mono text-gray-300">{win}</td>
                          <td className="py-3 px-2 text-center font-mono text-gray-300">{draw}</td>
                          <td className="py-3 px-2 text-center font-mono text-gray-300">{lose}</td>
                          <td className="py-3 px-2 text-center font-mono font-medium text-gray-300">
                            {gd > 0 ? `+${gd}` : gd}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-center font-mono font-black text-[#ff6b35] text-sm">
                            {points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. TOP SCORERS SECTION */}
      {activeTab === 'scorers' && (
        <section className="space-y-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
            {POPULAR_LEAGUES.map((league) => {
              const isSelected = selectedLeague.id === league.id;
              return (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#ff6b35] text-black shadow-[0_2px_12px_rgba(255,107,53,0.35)]'
                      : 'bg-[#141414] text-gray-300 hover:text-white hover:bg-[#1a1a1a] border border-[#262626]'
                  }`}
                >
                  {league.name}
                </button>
              );
            })}
          </div>

          {scorersLoading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading top goalscorers for {selectedLeague.name}...</p>
            </div>
          ) : topScorers.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm bg-[#141414] rounded-2xl border border-[#262626] p-6">
              Top scorer data for {selectedLeague.name} is updating. Try Premier League or La Liga above.
            </div>
          ) : (
            <div className="bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#ff6b35]" />
                  <h3 className="font-bold text-white text-base">
                    {selectedLeague.name} — Golden Boot Race ({selectedLeague.season})
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-mono">Rankings</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-[11px] tracking-wider border-b border-[#262626]">
                    <tr>
                      <th className="py-3 px-3 sm:px-4 w-12 text-center">Rank</th>
                      <th className="py-3 px-3 sm:px-4">Player</th>
                      <th className="py-3 px-3 sm:px-4">Club</th>
                      <th className="py-3 px-3 text-center w-16 font-mono font-black text-white">Goals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {topScorers.map((item, index) => {
                      const stat = item.statistics?.[0];
                      const team = stat?.team;
                      const goals = stat?.goals?.total ?? 0;
                      const playerName = item.player?.name || 'Player';
                      const playerPhoto = item.player?.photo || '';

                      return (
                        <tr key={item.player?.id || index} className="hover:bg-[#1a1a1a]/80 transition-colors">
                          <td className="py-3 px-3 sm:px-4 text-center font-bold">
                            <span
                              className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-mono ${
                                index === 0
                                  ? 'bg-[#ff6b35] text-black font-black'
                                  : 'text-gray-400'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center gap-3">
                              {playerPhoto ? (
                                <img
                                  src={playerPhoto}
                                  alt={playerName}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full object-cover bg-[#262626] border border-[#333]"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-xs font-bold text-gray-300">
                                  {playerName.charAt(0)}
                                </div>
                              )}
                              <span className="font-semibold text-white">{playerName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center gap-2">
                              {team?.logo && (
                                <img
                                  src={team.logo}
                                  alt={team.name}
                                  referrerPolicy="no-referrer"
                                  className="w-5 h-5 object-contain"
                                />
                              )}
                              <span className="text-gray-300">{team?.name || 'Club'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-base text-[#ff6b35]">
                            {goals}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#262626] text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30 uppercase">
                {selectedMatch.league?.name || 'Match Fixture'}
              </span>
              <h3 className="text-lg font-bold text-white mt-2">Match Overview</h3>
            </div>

            <div className="flex items-center justify-between gap-4 py-6 border-y border-[#262626] my-4">
              <div className="text-center flex-1">
                {selectedMatch.home?.img ? (
                  <img
                    src={selectedMatch.home.img}
                    alt={selectedMatch.home.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-contain mx-auto mb-2"
                  />
                ) : (
                  <Shield className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                )}
                <span className="font-bold text-sm block">{selectedMatch.home?.name || 'Home'}</span>
              </div>

              <div className="text-center px-4">
                <span className="text-2xl font-black font-mono text-white block">
                  {selectedMatch.score?.home ?? 0} - {selectedMatch.score?.away ?? 0}
                </span>
                <span className="text-xs text-red-400 font-bold tracking-wider mt-1 block">
                  {selectedMatch.live ? 'LIVE' : 'UPCOMING'}
                </span>
              </div>

              <div className="text-center flex-1">
                {selectedMatch.away?.img ? (
                  <img
                    src={selectedMatch.away.img}
                    alt={selectedMatch.away.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-contain mx-auto mb-2"
                  />
                ) : (
                  <Shield className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                )}
                <span className="font-bold text-sm block">{selectedMatch.away?.name || 'Away'}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-400 mb-4">
                Live match telemetry synchronized continuously with BMW CINEMA sports arena.
              </p>
              <button
                onClick={() => setSelectedMatch(null)}
                className="w-full py-2.5 bg-[#ff6b35] text-black font-bold text-xs rounded-xl hover:bg-[#ff8354] transition-colors"
              >
                Close Match Center
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
