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
  Gift,
  Copy,
  Check,
  Users,
  Award,
  Share2,
  Bell,
  BellRing,
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
  getUserReferrals,
} from '../services/auth';
import {
  updateUserNotificationPreferences,
  requestNotificationPermission,
  getNotificationPermission,
} from '../services/notifications';
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
  const [referralsList, setReferralsList] = useState<Array<{ refereeName: string; createdAt: string; rewardPoints: number }>>([]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(true);
  const [notifUpdating, setNotifUpdating] = useState(false);

  // Read ref from URL parameter if present (?ref=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      setReferralInput(refParam.toUpperCase());
      setActiveTab('register');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        const prof = await getUserProfile(user.uid);
        if (prof) {
          setUserProfile(prof);
          setPushEnabled(prof.notificationsEnabled !== false);
          setEmailAlertsEnabled(prof.emailNotificationsEnabled !== false);
          const refs = await getUserReferrals(user.uid);
          setReferralsList(refs);
        } else {
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'BMW CINEMA Member',
            photoURL: user.photoURL || undefined,
            createdAt: new Date().toISOString(),
            referralCode: 'BMW' + Math.floor(1000 + Math.random() * 9000),
            referralCount: 0,
            referralPoints: 10,
            vipStatus: 'free',
          });
        }
      } else {
        setUserProfile(null);
        setReferralsList([]);
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
    const rawMsg = err?.message || String(err);
    const code = err?.code || '';
    const msg = `${code} ${rawMsg}`;

    if (msg.includes('auth/operation-not-allowed')) {
      return 'Account sign-in method is currently completing activation. Please verify your Email/Password configuration.';
    }
    if (msg.includes('auth/unauthorized-domain')) {
      return 'Google Sign-In is waiting for domain verification. Please sign in with your Email and Password below.';
    }
    if (msg.includes('auth/invalid-email')) return 'Invalid email address format. Please enter a valid email.';
    if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
      return 'Incorrect email address or password. Please try again.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'This email address is already registered. Please sign in or use another email.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'Password is too weak. Please use at least 6 characters with a combination of letters and numbers.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Sign in window was closed before completion. Please try again.';
    }
    if (msg.includes('auth/network-request-failed')) {
      return 'Network connection error. Please check your internet connection.';
    }
    return rawMsg.replace(/firebase/gi, 'Cloud System').replace(/\(auth\/[a-zA-Z0-9-]+\)/g, '').trim() || 'Authentication request could not be completed.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const prof = await loginWithEmail(email, password);
      setUserProfile(prof);
      setSuccessMsg('Welcome back to BMW CINEMA!');
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
      setErrorMsg('Please enter your full name or nickname.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const prof = await registerWithEmail(email, password, name, referralInput.trim());
      setUserProfile(prof);
      setSuccessMsg(
        referralInput.trim()
          ? 'Account created successfully! You earned +50 Welcome Bonus points with your referral code!'
          : 'Your BMW CINEMA account has been created successfully!'
      );
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
      const prof = await loginWithGoogle(referralInput.trim());
      setUserProfile(prof);
      setSuccessMsg('Signed in successfully with Google!');
    } catch (err: any) {
      const errStr = `${err?.code || ''} ${err?.message || ''}`;
      if (errStr.includes('auth/popup-closed-by-user')) {
        setErrorMsg('Sign-in popup was closed before completion. Please try again.');
      } else {
        setErrorMsg(getCleanErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address to receive a password reset link.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg(`Password reset link sent to: ${email}. Please check your Inbox or Spam folder!`);
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
      setSuccessMsg('You have been signed out successfully.');
      setActiveTab('login');
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (!userProfile?.referralCode) return;
    navigator.clipboard.writeText(userProfile.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyReferralLink = () => {
    if (!userProfile?.referralCode) return;
    const url = `${window.location.origin}/auth.html?ref=${encodeURIComponent(userProfile.referralCode)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareReferral = () => {
    if (!userProfile?.referralCode) return;
    const url = `${window.location.origin}/auth.html?ref=${encodeURIComponent(userProfile.referralCode)}`;
    const shareText = `Join me on BMW CINEMA for free 4K streaming and high-speed movie downloads! Use my invite code: ${userProfile.referralCode} to get 50 bonus points: ${url}`;
    if (navigator.share) {
      navigator.share({
        title: 'BMW CINEMA VIP Invitation',
        text: shareText,
        url,
      }).catch(() => copyReferralLink());
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0d0d0d] via-[#121212] to-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-xl">
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
            <span>Back to Home</span>
          </button>

          <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            BMW CINEMA VIP Protection
          </span>
        </div>

        {/* LOGGED IN USER VIEW WITH REFERRAL SYSTEM */}
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

              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Session
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ff6b35]/15 text-[#ff6b35] border border-[#ff6b35]/30 uppercase tracking-wider">
                  <Award className="w-3 h-3" />
                  {userProfile?.vipStatus || 'Free'} Tier
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">
                {userProfile?.displayName || currentUser.displayName || 'BMW Member'}
              </h2>
              <p className="text-sm text-gray-400 mb-6 font-mono">{currentUser.email}</p>

              {/* Account Details & Stats Cards */}
              <div className="w-full grid grid-cols-3 gap-2.5 mb-6 text-left">
                <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#ff6b35]" />
                    <span>Member</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {userProfile?.createdAt
                      ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Recently'}
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                    <Users className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Referrals</span>
                  </div>
                  <div className="text-base font-bold text-[#38bdf8]">
                    {userProfile?.referralCount ?? 0}
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                    <Gift className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Points</span>
                  </div>
                  <div className="text-base font-bold text-[#facc15]">
                    {userProfile?.referralPoints ?? 0} pts
                  </div>
                </div>
              </div>

              {/* REFERRAL SYSTEM SECTION */}
              <div className="w-full mb-6 bg-gradient-to-br from-[#1c1917] to-[#171717] border border-[#ff6b35]/30 rounded-2xl p-4 sm:p-5 text-left shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#ff6b35]/20 flex items-center justify-center text-[#ff6b35]">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        BMW Cinema Reference System
                        <span className="text-[10px] bg-[#ff6b35] text-black font-extrabold px-1.5 py-0.2 rounded">
                          +100 PTS
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400">
                        Invite friends to earn 100 reward points and unlock VIP streaming!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Code Box */}
                <div className="bg-[#121212] border border-[#333] rounded-xl p-3 mb-3 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                      Your Unique Referral Code
                    </span>
                    <span className="text-lg font-black tracking-widest text-[#ff6b35] font-mono">
                      {userProfile?.referralCode || 'BMW-CINEMA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyReferralCode}
                      className="px-3 py-1.5 bg-[#262626] hover:bg-[#333] text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 transition-colors border border-[#3d3d3d]"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={shareReferral}
                      className="px-3 py-1.5 bg-[#ff6b35] hover:bg-[#ff8354] text-xs font-semibold text-black rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Direct Referral Link */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/auth.html?ref=${encodeURIComponent(userProfile?.referralCode || '')}`}
                    className="flex-1 bg-[#121212] border border-[#2b2b2b] rounded-lg px-3 py-1.5 text-xs text-gray-400 font-mono truncate focus:outline-none"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="px-3 py-1.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-xs font-semibold text-gray-200 rounded-lg flex items-center gap-1 transition-colors border border-[#333] shrink-0"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                {/* Referral History / Invited Friends */}
                {referralsList.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#262626]">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="font-semibold text-gray-300">Invited Friends ({referralsList.length})</span>
                      <span className="text-emerald-400 font-mono font-medium">+{referralsList.length * 100} pts earned</span>
                    </div>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {referralsList.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-[#121212] px-2.5 py-1.5 rounded-lg border border-[#222]"
                        >
                          <span className="text-white font-medium">{item.refereeName || 'New Member'}</span>
                          <span className="text-[#facc15] font-mono font-semibold">+{item.rewardPoints || 100} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* NOTIFICATION PREFERENCES SECTION */}
              <div className="w-full mb-6 bg-[#1a1a1a] border border-[#262626] rounded-2xl p-4 sm:p-5 text-left shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        Push & Email Notifications
                      </h3>
                      <p className="text-xs text-gray-400">
                        Stay informed on new movie releases, live matches, and VIP rewards.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Browser Push Toggle */}
                  <div className="flex items-center justify-between bg-[#121212] p-3 rounded-xl border border-[#2a2a2a]">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Device Push Notifications</span>
                        {pushEnabled && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded">Active</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Receive instant alerts on your screen and home screen app.
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!currentUser) return;
                        setNotifUpdating(true);
                        const nextState = !pushEnabled;
                        if (nextState) {
                          await requestNotificationPermission();
                        }
                        setPushEnabled(nextState);
                        await updateUserNotificationPreferences(currentUser.uid, {
                          notificationsEnabled: nextState,
                        });
                        setNotifUpdating(false);
                      }}
                      disabled={notifUpdating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        pushEnabled
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-gray-400'
                      }`}
                    >
                      {pushEnabled ? 'Allowed' : 'Disabled'}
                    </button>
                  </div>

                  {/* Account Email Notifications Toggle */}
                  <div className="flex items-center justify-between bg-[#121212] p-3 rounded-xl border border-[#2a2a2a]">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Email Notifications</span>
                        {emailAlertsEnabled && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-500/20 text-blue-400 rounded">Enabled</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Receive movie announcements sent to <span className="text-[#ff6b35] font-mono">{currentUser.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!currentUser) return;
                        setNotifUpdating(true);
                        const nextState = !emailAlertsEnabled;
                        setEmailAlertsEnabled(nextState);
                        await updateUserNotificationPreferences(currentUser.uid, {
                          emailNotificationsEnabled: nextState,
                        });
                        setNotifUpdating(false);
                      }}
                      disabled={notifUpdating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        emailAlertsEnabled
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-gray-400'
                      }`}
                    >
                      {emailAlertsEnabled ? 'Active' : 'Muted'}
                    </button>
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
                  <span>View My List (Bookmarks)</span>
                </button>

                <button
                  onClick={() => {
                    if (onNavigateToMovies) onNavigateToMovies();
                    else window.location.href = 'movies.html';
                  }}
                  className="w-full py-2.5 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-white font-medium rounded-xl flex items-center justify-center gap-2 border border-[#333] transition-colors text-sm"
                >
                  <Film className="w-4 h-4 text-[#ff6b35]" />
                  <span>Browse Movie Catalog</span>
                </button>

                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl flex items-center justify-center gap-2 border border-red-500/30 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
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
                {activeTab === 'login' && 'Sign in to access your saved watchlist, history, and fast downloads.'}
                {activeTab === 'register' && 'Create a free account to back up your personal movie collection and earn rewards.'}
                {activeTab === 'forgot' && 'Enter your registered email address to receive a password reset link.'}
              </p>

              {/* Navigation Tabs */}
              <div className="flex bg-[#0d0d0d] p-1 rounded-xl mt-6 border border-[#262626]">
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    activeTab === 'login'
                      ? 'bg-[#ff6b35] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    activeTab === 'register'
                      ? 'bg-[#ff6b35] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('forgot')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    activeTab === 'forgot'
                      ? 'bg-[#ff6b35] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Form Container */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Feedback messages */}
              {errorMsg && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-xs sm:text-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-emerald-400 text-xs sm:text-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  <span className="leading-snug">{successMsg}</span>
                </div>
              )}

              {/* One-Click Google Sign In */}
              {activeTab !== 'forgot' && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#1f1f1f] hover:bg-[#282828] text-white font-medium rounded-xl flex items-center justify-center gap-3 border border-[#333] transition-colors text-sm shadow-sm cursor-pointer"
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
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-[#2d2d2d] w-full" />
                    <span className="bg-[#141414] px-3 text-[11px] uppercase tracking-wider text-gray-500 font-semibold absolute">
                      or continue with email
                    </span>
                  </div>
                </>
              )}

              {/* TAB 1: LOGIN FORM */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. user@example.com"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => handleTabChange('forgot')}
                        className="text-xs text-[#ff6b35] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
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
                    <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                  </button>
                </form>
              )}

              {/* TAB 2: REGISTER FORM */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Full Name or Nickname
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. user@example.com"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Password (at least 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
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
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Reference / Referral Code Input */}
                  <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-xl">
                    <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-[#ff6b35]" />
                        Reference / Referral Code (Optional)
                      </span>
                      <span className="text-[10px] text-[#ff6b35] font-normal">+50 Bonus Points</span>
                    </label>
                    <input
                      type="text"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      placeholder="e.g. BMW9X4A"
                      className="w-full bg-[#121212] border border-[#333] focus:border-[#ff6b35] focus:outline-none rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-500 uppercase tracking-wider"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Invited by a friend? Enter their BMW Cinema code to receive 50 bonus reward points upon registration.
                    </p>
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
                    <span>{loading ? 'Creating Account...' : 'Create Free Account'}</span>
                  </button>
                </form>
              )}

              {/* TAB 3: FORGOT PASSWORD FORM */}
              {activeTab === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-xs text-gray-400 leading-relaxed bg-[#1c1c1c] p-3 rounded-xl border border-[#282828]">
                    Enter the email address associated with your account. We will send you a secure link to reset your password.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Your Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. user@example.com"
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
                    <span>{loading ? 'Sending Link...' : 'Send Reset Link'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleTabChange('login')}
                      className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* CARD FOOTER */}
            <div className="px-6 py-4 bg-[#111] border-t border-[#222] text-center text-xs text-gray-500">
              Your account and viewing preferences are securely encrypted.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
