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
  Play,
  Tv,
} from 'lucide-react';
import {
  LiveMatch,
  StandingRow,
  TopScorer,
  POPULAR_LEAGUES,
  getLiveMatches,
  getLiveMatchStreams,
  getLeagueStandings,
  getTopScorers,
  getFixtureDetails,
  TVChannel,
  getSportsChannels,
  DEFAULT_CHANNEL_1,
} from '../api/football';
import { LiveStreamPlayer } from './LiveStreamPlayer';

export const FootballView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'channels' | 'live' | 'standings' | 'scorers'>('channels');
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  // Channels State - initialized instantly with Channel 1 so it's always visible immediately
  const [channels, setChannels] = useState<TVChannel[]>([DEFAULT_CHANNEL_1]);
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(DEFAULT_CHANNEL_1);
  const [channelsLoading, setChannelsLoading] = useState(false);

  // Standings State
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  // Top Scorers State
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [scorersLoading, setScorersLoading] = useState(false);

  // Fixture / Stream Modal
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [fixtureData, setFixtureData] = useState<any>(null);
  const [fixtureLoading, setFixtureLoading] = useState(false);

  // Fetch live matches and merge available live streams
  const fetchLive = async () => {
    setLiveLoading(true);
    try {
      const [matches, streamedMatches] = await Promise.all([
        getLiveMatches(),
        getLiveMatchStreams().catch(() => [] as LiveMatch[]),
      ]);

      const streamMap = new Map<number, any>();
      streamedMatches.forEach((sm) => {
        if (sm.streams && sm.streams.length > 0) {
          if (sm.fixture) streamMap.set(sm.fixture, sm.streams);
          if (sm.id) streamMap.set(sm.id, sm.streams);
        }
      });

      // Merge matches with streams
      const merged: LiveMatch[] = matches.map((m) => {
        const foundStreams =
          streamMap.get(m.fixture) ||
          streamMap.get(m.id) ||
          (streamedMatches.find(
            (sm) =>
              sm.home?.name?.toLowerCase() === m.home?.name?.toLowerCase() ||
              sm.away?.name?.toLowerCase() === m.away?.name?.toLowerCase()
          )?.streams);

        return {
          ...m,
          streams: foundStreams || m.streams,
        };
      });

      // Also append any streamed matches that weren't in liveMatches
      streamedMatches.forEach((sm) => {
        const alreadyExists = merged.some(
          (m) =>
            (sm.fixture && m.fixture === sm.fixture) ||
            (sm.id && m.id === sm.id) ||
            sm.home?.name?.toLowerCase() === m.home?.name?.toLowerCase()
        );
        if (!alreadyExists && sm.streams && sm.streams.length > 0) {
          merged.unshift(sm);
        }
      });

      setLiveMatches(merged);
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

  // Fetch channels
  useEffect(() => {
    let isCurrent = true;
    async function loadChannels() {
      setChannelsLoading(true);
      try {
        const list = await getSportsChannels();
        if (isCurrent) {
          setChannels(list);
          if (list.length > 0) {
            setSelectedChannel(list[0]);
          }
        }
      } catch (err) {
        console.warn('Channels load error:', err);
      } finally {
        if (isCurrent) setChannelsLoading(false);
      }
    }

    loadChannels();
    return () => {
      isCurrent = false;
    };
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
            Live Football & Streaming Arena
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Watch live match streams in HD/Full HD, real-time scores, standings, and top goalscorers.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#262626] rounded-xl self-start md:self-auto shadow-md overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'channels'
                ? 'bg-[#ff6b35] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Channels ({channels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
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
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'standings'
                ? 'bg-[#ff6b35] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>League Standings</span>
          </button>

          <button
            onClick={() => setActiveTab('scorers')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
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

      {/* 0. SPORTS CHANNELS CATEGORY */}
      {activeTab === 'channels' && (
        <section className="space-y-6">
          {/* Active Live Channel Player */}
          {selectedChannel && selectedChannel.streams && selectedChannel.streams.length > 0 && (
            <div className="bg-[#141414] rounded-2xl border border-[#262626] p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedChannel.logo}
                    alt={selectedChannel.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/channel1-logo.jpg';
                    }}
                    className="w-10 h-10 object-cover rounded-xl border border-white/10"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white">{selectedChannel.name}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <LiveStreamPlayer
                streams={selectedChannel.streams}
                title={selectedChannel.name}
                channelLogo={selectedChannel.logo}
              />
            </div>
          )}

          {/* Single Channel Card */}
          <div className="max-w-md">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="p-4 rounded-2xl border bg-[#181818] border-[#ff6b35] shadow-lg shadow-[#ff6b35]/10 flex items-center gap-4"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 flex items-center justify-center">
                  <img
                    src={ch.logo}
                    alt={ch.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/channel1-logo.jpg';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse ring-2 ring-black" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-white text-base truncate">{ch.name}</h3>
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30 rounded">
                      LIVE
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#ff6b35] text-black flex items-center gap-1.5 shadow-md">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Broadcasting</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 1. LIVE MATCHES & STREAMS SECTION */}
      {activeTab === 'live' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>Current Live & Broadcasted Fixtures</span>
            </h2>
            <button
              onClick={fetchLive}
              disabled={liveLoading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ff6b35] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Streams & Scores</span>
            </button>
          </div>

          {liveLoading && liveMatches.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Fetching live football broadcast signals...</p>
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
                const hasStreams = Boolean(m.streams && m.streams.length > 0);
                const kickoffDate = m.kickoff
                  ? new Date(m.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Kickoff';

                return (
                  <div
                    key={m.id || m.fixture}
                    onClick={() => handleOpenFixture(m)}
                    className="bg-[#141414] hover:bg-[#191919] rounded-xl p-4 border border-[#262626] hover:border-[#ff6b35]/60 transition-all cursor-pointer shadow-lg group relative flex flex-col justify-between"
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
                        {hasStreams && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/40 flex items-center gap-1">
                            <Tv className="w-2.5 h-2.5" />
                            LIVE STREAM
                          </span>
                        )}
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
                      <span className="group-hover:text-[#ff6b35] transition-colors flex items-center gap-1.5 font-medium">
                        {hasStreams ? (
                          <>
                            <Play className="w-3 h-3 fill-current text-[#ff6b35]" />
                            <span className="text-[#ff6b35] font-bold">Watch Live Stream</span>
                          </>
                        ) : (
                          <>Match Center & Stats &rarr;</>
                        )}
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
                  {league.name}
                </button>
              );
            })}
          </div>

          {standingsLoading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Compiling league table...</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="py-20 text-center bg-[#141414] rounded-2xl border border-[#262626] p-8 max-w-lg mx-auto">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Standings Table Updating</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Table calculations for {selectedLeague.name} ({selectedLeague.season}) are currently updating.
              </p>
            </div>
          ) : (
            <div className="bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-[11px] font-bold tracking-wider border-b border-[#262626]">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Club</th>
                      <th className="py-3.5 px-3 text-center">MP</th>
                      <th className="py-3.5 px-3 text-center">W</th>
                      <th className="py-3.5 px-3 text-center">D</th>
                      <th className="py-3.5 px-3 text-center">L</th>
                      <th className="py-3.5 px-3 text-center">GD</th>
                      <th className="py-3.5 px-4 text-center font-black text-white">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {standings.map((row, idx) => (
                      <tr
                        key={row.team?.id || idx}
                        className="hover:bg-[#181818] transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-mono font-bold text-xs text-gray-400">
                          {row.rank || idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {row.team?.logo ? (
                              <img
                                src={row.team.logo}
                                alt={row.team.name}
                                referrerPolicy="no-referrer"
                                className="w-6 h-6 object-contain shrink-0"
                              />
                            ) : (
                              <Shield className="w-5 h-5 text-gray-600 shrink-0" />
                            )}
                            <span className="font-semibold text-white text-xs sm:text-sm">
                              {row.team?.name || 'Club'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-gray-300 text-xs">
                          {row.played ?? row.all?.played ?? 0}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-gray-300 text-xs">
                          {row.win ?? row.all?.win ?? 0}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-gray-300 text-xs">
                          {row.draw ?? row.all?.draw ?? 0}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-gray-300 text-xs">
                          {row.lose ?? row.all?.lose ?? 0}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-gray-300 text-xs">
                          {row.gd > 0 ? `+${row.gd}` : row.gd}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-[#ff6b35] text-sm">
                          {row.points}
                        </td>
                      </tr>
                    ))}
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
              <p className="text-gray-400 text-sm">Loading golden boot statistics...</p>
            </div>
          ) : topScorers.length === 0 ? (
            <div className="py-20 text-center bg-[#141414] rounded-2xl border border-[#262626] p-8 max-w-lg mx-auto">
              <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Top Scorers Register</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Scorer metrics for {selectedLeague.name} are processing.
              </p>
            </div>
          ) : (
            <div className="bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-[11px] font-bold tracking-wider border-b border-[#262626]">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Player</th>
                      <th className="py-3.5 px-4">Club</th>
                      <th className="py-3.5 px-3 text-center font-black text-white">Goals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {topScorers.map((scorer, idx) => {
                      const stats = scorer.statistics?.[0];
                      const goals = stats?.goals?.total ?? 0;
                      return (
                        <tr key={scorer.player?.id || idx} className="hover:bg-[#181818] transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-bold text-xs text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {scorer.player?.photo && (
                                <img
                                  src={scorer.player.photo}
                                  alt={scorer.player.name}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                                />
                              )}
                              <span className="font-semibold text-white text-xs sm:text-sm">
                                {scorer.player?.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {stats?.team?.logo && (
                                <img
                                  src={stats.team.logo}
                                  alt={stats.team.name}
                                  referrerPolicy="no-referrer"
                                  className="w-5 h-5 object-contain"
                                />
                              )}
                              <span className="text-gray-300 text-xs sm:text-sm">{stats?.team?.name || '-'}</span>
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

      {/* Match Details & Live Broadcast Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative animate-fadeIn my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#262626] text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="text-center mb-4">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30 uppercase tracking-wider">
                {selectedMatch.league?.name || 'Live Match Center'}
              </span>
              <h3 className="text-xl font-black text-white mt-2">
                {selectedMatch.home?.name || 'Home'} vs {selectedMatch.away?.name || 'Away'}
              </h3>
            </div>

            {/* Live Video Player (If match has stream feeds) */}
            {selectedMatch.streams && selectedMatch.streams.length > 0 ? (
              <div className="mb-4">
                <LiveStreamPlayer
                  streams={selectedMatch.streams}
                  title={`${selectedMatch.home?.name} vs ${selectedMatch.away?.name}`}
                />
              </div>
            ) : null}

            {/* Scorecard */}
            <div className="flex items-center justify-between gap-4 py-4 px-4 bg-[#1a1a1a] rounded-xl border border-[#262626] my-4">
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
                <span className="font-bold text-sm block text-white">{selectedMatch.home?.name || 'Home'}</span>
              </div>

              <div className="text-center px-4">
                <span className="text-3xl font-black font-mono text-white block">
                  {selectedMatch.score?.home ?? 0} - {selectedMatch.score?.away ?? 0}
                </span>
                <span className="text-[11px] text-red-400 font-black tracking-wider mt-1 block uppercase">
                  {selectedMatch.live ? 'LIVE MATCH' : 'FIXTURE'}
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
                <span className="font-bold text-sm block text-white">{selectedMatch.away?.name || 'Away'}</span>
              </div>
            </div>

            {/* Fixture Analytics or Stream fallback info */}
            {fixtureLoading ? (
              <div className="py-6 text-center text-xs text-gray-400">
                <div className="w-6 h-6 border-2 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Retrieving detailed match telemetry...
              </div>
            ) : fixtureData ? (
              <div className="bg-[#181818] p-4 rounded-xl border border-[#262626] text-xs text-gray-300 space-y-2 mb-4">
                <div className="flex justify-between border-b border-[#262626] pb-1.5 font-semibold text-gray-400">
                  <span>Venue: {fixtureData.venue?.name || 'Stadium'}</span>
                  <span>Referee: {fixtureData.referee || 'Official'}</span>
                </div>
                {fixtureData.events && fixtureData.events.length > 0 && (
                  <div className="pt-2">
                    <span className="font-bold text-white block mb-1 text-xs">Recent Match Events:</span>
                    <div className="space-y-1">
                      {fixtureData.events.slice(-4).map((ev: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>{ev.time?.elapsed}' {ev.player?.name} ({ev.team?.name})</span>
                          <span className="font-mono text-[#ff6b35]">{ev.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="text-center pt-2">
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
