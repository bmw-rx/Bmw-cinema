import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Film,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Heart,
} from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
  logOut,
  subscribeToAuth,
  UserProfileData,
  getUserProfile,
} from '../services/auth';
import { User } from 'firebase/auth';

interface AuthViewProps {
  onBackToHome?: () => void;
  onNavigateToFavorites?: () => void;
  onNavigateToMovies?: () => void;
}

export type AuthTab = 'login' | 'register' | 'forgot';

export const AuthView: React.FC<AuthViewProps> = ({
  onBackToHome,
  onNavigateToFavorites,
  onNavigateToMovies,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        const prof = await getUserProfile(user.uid);
        if (prof) {
          setUserProfile(prof);
        } else {
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Mtumiaji wa BMW CINEMA',
            photoURL: user.photoURL || undefined,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleTabChange = (tab: AuthTab) => {
    clearMessages();
    setActiveTab(tab);
  };

  const getCleanErrorMessage = (err: any): string => {
    const msg = err?.message || String(err);
    if (msg.includes('auth/invalid-email')) return 'Barua pepe uliyoingiza si sahihi (Invalid email format).';
    if (msg.includes('auth/user-not-found') || msg.includes('auth/invalid-credential')) {
      return 'Barua pepe au nenosiri si sahihi. Tafadhali hakiki na ujaribu tena.';
    }
    if (msg.includes('auth/wrong-password')) return 'Nenosiri si sahihi. Jaribu tena au bonyeza Umesahau Nenosiri.';
    if (msg.includes('auth/email-already-in-use')) return 'Barua pepe hii tayari inatumika na akaunti nyingine.';
    if (msg.includes('auth/weak-password')) return 'Nenosiri ni dhaifu mno. Tafadhali weka nenosiri lenye herufi zisizopungua 6.';
    if (msg.includes('auth/popup-closed-by-user')) return 'Dirisha la kuingia lilifungwa kabla ya kukamilisha.';
    return msg.replace('Firebase: ', '');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim() || !password) {
      setErrorMsg('Tafadhali jaza barua pepe na nenosiri lako.');
      return;
    }

    setLoading(true);
    try {
      const prof = await loginWithEmail(email, password);
      setUserProfile(prof);
      setSuccessMsg('Umefanikiwa kuingia kikamilifu!');
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!name.trim()) {
      setErrorMsg('Tafadhali weka jina lako kamili.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg('Tafadhali jaza barua pepe na nenosiri.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Nenosiri lazima liwe na herufi zisizopungua 6.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Manenosiri hayafanani. Tafadhali hakiki tena.');
      return;
    }

    setLoading(true);
    try {
      const prof = await registerWithEmail(email, password, name);
      setUserProfile(prof);
      setSuccessMsg('Akaunti yako imetengenezwa kikamilifu kwenye BMW CINEMA!');
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    clearMessages();
    setLoading(true);
    try {
      const prof = await loginWithGoogle();
      setUserProfile(prof);
      setSuccessMsg('Umefanikiwa kuingia na akaunti yako ya Google!');
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim()) {
      setErrorMsg('Tafadhali weka barua pepe yako ili tutume kiungo cha kurejesha nenosiri.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg(`Kiungo cha kubadilisha nenosiri kimetumwa kwenye barua pepe: ${email}. Tafadhali kagua Inbox au Spam!`);
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    clearMessages();
    setLoading(true);
    try {
      await logOut();
      setUserProfile(null);
      setCurrentUser(null);
      setSuccessMsg('Umetoka kwenye akaunti kikamilifu.');
      setActiveTab('login');
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0d0d0d] via-[#121212] to-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (onBackToHome) onBackToHome();
              else window.location.href = 'index.html';
            }}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#ff6b35] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rudi Nyumbani (Home)</span>
          </button>

          <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Cloud Database Secure
          </span>
        </div>

        {/* LOGGED IN USER VIEW */}
        {currentUser ? (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#ff6b35] rounded-full shadow-[0_0_20px_#ff6b35]" />

            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#ff6b35] to-[#f7931e] p-1 shadow-lg mb-4">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1c1c1c] rounded-full flex items-center justify-center text-2xl font-black text-[#ff6b35]">
                    {(userProfile?.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Imeunganishwa Kikamilifu (Active)
              </span>

              <h2 className="text-2xl font-bold text-white mb-1">
                {userProfile?.displayName || currentUser.displayName || 'Mwanachama wa BMW'}
              </h2>
              <p className="text-sm text-gray-400 mb-6 font-mono">{currentUser.email}</p>

              {/* Account Details Cards */}
              <div className="w-full grid grid-cols-2 gap-3 mb-6 text-left">
                <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3.5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#ff6b35]" />
                    <span>Uanachama Tangu</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {userProfile?.createdAt
                      ? new Date(userProfile.createdAt).toLocaleDateString('sw-TZ', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Hivi Karibuni'}
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3.5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hifadhi ya Wingu</span>
                  </div>
                  <div className="text-sm font-semibold text-emerald-400">
                    Cloud Firestore
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-3">
                <button
                  onClick={() => {
                    if (onNavigateToFavorites) onNavigateToFavorites();
                    else window.location.hash = '#favorites';
                  }}
                  className="w-full py-3 px-4 bg-[#ff6b35] hover:bg-[#ff8354] text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_2px_15px_rgba(255,107,53,0.3)]"
                >
                  <Heart className="w-4 h-4 fill-black" />
                  <span>Tazama Orodha Yangu (My List / Bookmarks)</span>
                </button>

                <button
                  onClick={() => {
                    if (onNavigateToMovies) onNavigateToMovies();
                    else window.location.href = 'movies.html';
                  }}
                  className="w-full py-2.5 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-white font-medium rounded-xl flex items-center justify-center gap-2 border border-[#333] transition-colors text-sm"
                >
                  <Film className="w-4 h-4 text-[#ff6b35]" />
                  <span>Fungua Katalogi ya Filamu</span>
                </button>

                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl flex items-center justify-center gap-2 border border-red-500/30 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{loading ? 'Inatoka...' : 'Toka Kwenye Akaunti (Sign Out)'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATION FORM CARD */
          <div className="bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header / Brand */}
            <div className="p-6 sm:p-8 text-center border-b border-[#222] bg-gradient-to-b from-[#1c1c1c] to-[#141414]">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-lg bg-[#ff6b35] flex items-center justify-center font-black text-black text-sm shadow-[0_0_12px_rgba(255,107,53,0.4)]">
                  ▶
                </span>
                <span className="text-2xl font-black tracking-tight text-white">
                  BMW <span className="text-[#ff6b35]">CINEMA</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto">
                {activeTab === 'login' && 'Ingia kwenye akaunti yako ili kuhifadhi filamu na kupakua moja kwa moja.'}
                {activeTab === 'register' && 'Fungua akaunti ya bure uweze kutumia hifadhi ya wingu ya filamu zako.'}
                {activeTab === 'forgot' && 'Ingiza barua pepe yako tukuwezeshe kuweka nenosiri jipya haraka.'}
              </p>
            </div>

            {/* TAB SELECTORS */}
            <div className="flex border-b border-[#262626] bg-[#111]">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'login'
                    ? 'text-[#ff6b35] border-b-2 border-[#ff6b35] bg-[#171717]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Ingia (Login)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'register'
                    ? 'text-[#ff6b35] border-b-2 border-[#ff6b35] bg-[#171717]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Sajili (Register)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('forgot')}
                className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'forgot'
                    ? 'text-[#ff6b35] border-b-2 border-[#ff6b35] bg-[#171717]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Sahau Nenosiri</span>
              </button>
            </div>

            {/* NOTIFICATIONS */}
            <div className="p-6 sm:p-8 space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-2.5 text-red-300 text-xs sm:text-sm animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-2.5 text-emerald-300 text-xs sm:text-sm animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{successMsg}</div>
                </div>
              )}

              {/* GOOGLE ONE-CLICK AUTH (FOR LOGIN & REGISTER) */}
              {activeTab !== 'forgot' && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors text-sm shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>
                      {activeTab === 'login'
                        ? 'Ingia Moja kwa Moja na Google'
                        : 'Sajili Akaunti kwa Google'}
                    </span>
                  </button>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-[#2a2a2a] w-full" />
                    <span className="bg-[#141414] px-3 text-xs text-gray-500 uppercase tracking-wider">
                      au tumia barua pepe
                    </span>
                  </div>
                </>
              )}

              {/* TAB 1: LOGIN FORM */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Barua Pepe (Email)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mfano: sangabmw@gmail.com"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-300">
                        Nenosiri (Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleTabChange('forgot')}
                        className="text-xs text-[#ff6b35] hover:underline"
                      >
                        Umesahau Nenosiri?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingiza nenosiri lako"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#ff6b35] hover:bg-[#ff8354] disabled:opacity-50 text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_2px_15px_rgba(255,107,53,0.3)] mt-2"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Inaingia...' : 'Ingia Kwenye Akaunti'}</span>
                  </button>
                </form>
              )}

              {/* TAB 2: REGISTER FORM */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Jina Kamili au Nickname
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="mfano: Dennis Sanga"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Barua Pepe (Email)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mfano: sangabmw@gmail.com"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Nenosiri (Herufi zisizopungua 6)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Unda nenosiri imara"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Thibitisha Nenosiri
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Rudia nenosiri tena"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#ff6b35] hover:bg-[#ff8354] disabled:opacity-50 text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_2px_15px_rgba(255,107,53,0.3)] mt-2"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Inasajili...' : 'Unda Akaunti ya Bure'}</span>
                  </button>
                </form>
              )}

              {/* TAB 3: FORGOT PASSWORD FORM */}
              {activeTab === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-xs text-gray-400 leading-relaxed bg-[#1c1c1c] p-3 rounded-xl border border-[#282828]">
                    Weka barua pepe uliyojiandikisha nayo. Mfumo utakutumia barua pepe yenye kiungo rasmi cha kuweka nenosiri jipya.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Barua Pepe Yako (Email)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mfano: sangabmw@gmail.com"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#ff6b35] hover:bg-[#ff8354] disabled:opacity-50 text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_2px_15px_rgba(255,107,53,0.3)] mt-2"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Inatuma...' : 'Tuma Kiungo cha Kurejesha'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleTabChange('login')}
                      className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Rudi kwenye ukurasa wa Kuingia (Login)</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* CARD FOOTER */}
            <div className="px-6 py-4 bg-[#111] border-t border-[#222] text-center text-xs text-gray-500">
              Data zako zinalindwa kwa njia salama na Firebase Cloud Authentication & Firestore.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
