import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt?: string;
  referralCode: string;
  referredBy?: string | null;
  referralCount: number;
  referralPoints: number;
  vipStatus?: 'free' | 'silver' | 'gold' | 'vip';
}

/**
 * Generate a short, unique 6-character referral code (e.g., BMW-9X4A)
 */
export function generateReferralCode(seed?: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BMW';
  const source = (seed || Math.random().toString(36).substring(2)).toUpperCase();
  for (let i = 0; i < 4; i++) {
    const charIndex = Math.floor(Math.random() * chars.length);
    result += chars[charIndex];
  }
  return result;
}

/**
 * Find user by referral code to validate before registration
 */
export async function findUserByReferralCode(code: string): Promise<{ uid: string; displayName: string } | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const q = query(collection(db, 'users'), where('referralCode', '==', cleanCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data();
      return {
        uid: docData.uid,
        displayName: docData.displayName || 'BMW Member',
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to lookup referral code:', err);
    return null;
  }
}

/**
 * Sync or create user profile document in Firestore
 */
export async function syncUserProfile(
  user: User,
  customName?: string,
  usedReferralCode?: string
): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // Determine referral code
      const referralCode = generateReferralCode(user.uid);
      const cleanRefCode = usedReferralCode ? usedReferralCode.trim().toUpperCase() : null;

      // Initial user profile
      const profile: UserProfileData = {
        uid: user.uid,
        email: user.email || '',
        displayName: customName || user.displayName || user.email?.split('@')[0] || 'BMW Member',
        photoURL: user.photoURL || '',
        createdAt: now,
        lastLoginAt: now,
        referralCode,
        referredBy: cleanRefCode || null,
        referralCount: 0,
        referralPoints: cleanRefCode ? 50 : 10, // 50 bonus pts if joined with friend referral, else 10 welcome pts
        vipStatus: 'free',
      };

      await setDoc(userRef, profile);

      // If referred by someone, award the referrer!
      if (cleanRefCode) {
        awardReferrerBonus(cleanRefCode, user.uid, profile.displayName);
      }

      return profile;
    } else {
      await updateDoc(userRef, {
        lastLoginAt: now,
        ...(customName ? { displayName: customName } : {}),
      });
      const data = snap.data() as UserProfileData;
      // Backfill referralCode if an old account didn't have one
      if (!data.referralCode) {
        const referralCode = generateReferralCode(user.uid);
        await updateDoc(userRef, {
          referralCode,
          referralCount: data.referralCount || 0,
          referralPoints: data.referralPoints || 10,
          vipStatus: data.vipStatus || 'free',
        });
        data.referralCode = referralCode;
        data.referralCount = data.referralCount || 0;
        data.referralPoints = data.referralPoints || 10;
        data.vipStatus = data.vipStatus || 'free';
      }
      return data;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

/**
 * Give points/reward to the referrer when a new friend registers with their code
 */
async function awardReferrerBonus(refCode: string, newUserId: string, newUserName: string) {
  try {
    const q = query(collection(db, 'users'), where('referralCode', '==', refCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const referrerDoc = snap.docs[0];
      const referrerRef = referrerDoc.ref;
      const refData = referrerDoc.data();
      const newCount = (refData.referralCount || 0) + 1;
      const newPoints = (refData.referralPoints || 0) + 100; // 100 points per invited friend!

      let newVip = refData.vipStatus || 'free';
      if (newCount >= 10) newVip = 'vip';
      else if (newCount >= 5) newVip = 'gold';
      else if (newCount >= 2) newVip = 'silver';

      await updateDoc(referrerRef, {
        referralCount: newCount,
        referralPoints: newPoints,
        vipStatus: newVip,
      });

      // Record referral log in subcollection
      const logRef = doc(collection(referrerRef, 'referrals'), newUserId);
      await setDoc(logRef, {
        refereeUid: newUserId,
        refereeName: newUserName,
        rewardPoints: 100,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error('Error awarding referral bonus:', e);
  }
}

/**
 * Register a new user with real Firebase Authentication & Firestore
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  name: string,
  referralCode?: string
): Promise<UserProfileData> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return await syncUserProfile(cred.user, name.trim(), referralCode);
}

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfileData> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return await syncUserProfile(cred.user);
}

/**
 * Sign in with Google (One-Click)
 */
export async function loginWithGoogle(referralCode?: string): Promise<UserProfileData> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return await syncUserProfile(cred.user, undefined, referralCode);
}

/**
 * Send Password Reset Email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign Out
 */
export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Fetch profile data for a user
 */
export async function getUserProfile(uid: string): Promise<UserProfileData | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (err) {
    console.error('Failed to get user profile from Firestore:', err);
    return null;
  }
}

/**
 * Fetch referrals list for a user
 */
export async function getUserReferrals(uid: string): Promise<Array<{ refereeName: string; createdAt: string; rewardPoints: number }>> {
  try {
    const colRef = collection(db, 'users', uid, 'referrals');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as any);
  } catch (err) {
    console.error('Failed to get user referrals:', err);
    return [];
  }
}
