(function () {
  const PROFILE_COLLECTION = 'users';
  const DEFAULT_AVATAR =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#e2e8f0"/><circle cx="60" cy="46" r="22" fill="#94a3b8"/><path d="M24 104c6-24 22-36 36-36s30 12 36 36" fill="#94a3b8"/></svg>'
    );

  let appReady = false;
  let auth = null;
  let db = null;
  let storage = null;
  const listeners = new Set();
  let currentState = { user: null, profile: null, loading: true };

  function hasFirebaseServices() {
    return Boolean(window.firebase && firebase.auth && firebase.firestore && firebase.storage);
  }

  function initFirebase() {
    if (appReady || !hasFirebaseServices() || !window.firebaseConfig) return appReady;

    if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    appReady = true;
    bindAuthState();
    return true;
  }

  function bindAuthState() {
    auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          clearLocalSession();
          currentState = { user: null, profile: null, loading: false };
          emit();
          return;
        }

        const profile = await ensureUserProfile(user).catch((profileError) => {
          console.warn('Using Firebase Auth session without Firestore profile sync:', profileError);
          return buildFallbackProfile(user);
        });
        saveLocalSession(user, profile);
        currentState = { user, profile, loading: false };
        emit();
      } catch (error) {
        console.error('Auth state sync failed:', error);
        currentState = { user, profile: null, loading: false, error };
        emit();
      }
    });
  }

  function emit() {
    listeners.forEach((listener) => listener(currentState));
  }

  function onAuthState(callback) {
    initFirebase();
    listeners.add(callback);
    callback(currentState);
    return () => listeners.delete(callback);
  }

  function getProvider(user) {
    const providerId = user && user.providerData && user.providerData[0]
      ? user.providerData[0].providerId
      : 'password';

    if (providerId === 'google.com') return 'google';
    if (providerId === 'facebook.com') return 'facebook';
    return 'password';
  }

  function profileRef(uid) {
    return db.collection(PROFILE_COLLECTION).doc(uid);
  }

  function buildFallbackProfile(user) {
    const provider = getProvider(user);
    return {
      uid: user.uid,
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
      email: user.email || '',
      phone: '',
      bio: '',
      profilePhoto: provider === 'password' ? '' : (user.photoURL || ''),
      provider,
      links: {
        github: '',
        linkedin: '',
        twitter: '',
        instagram: '',
        website: '',
        portfolio: '',
        youtube: '',
        custom: ''
      },
      createdAt: null,
      updatedAt: new Date().toISOString()
    };
  }

  function serverTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  async function ensureUserProfile(user) {
    initFirebase();
    const provider = getProvider(user);
    const ref = profileRef(user.uid);
    
    let existing = {};
    let dbSuccess = false;
    try {
      const getPromise = ref.get();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000));
      const snap = await Promise.race([getPromise, timeoutPromise]);
      existing = snap.exists ? snap.data() : {};
      dbSuccess = true;
    } catch (e) {
      console.warn("Firestore get failed or timed out, reading from local fallback:", e);
      try {
        existing = JSON.parse(localStorage.getItem(`local_profile_${user.uid}`) || '{}');
      } catch (err) {
        console.warn("Failed to read local fallback profile:", err);
      }
    }

    const providerPhoto = provider === 'password' ? '' : (user.photoURL || existing.profilePhoto || '');
    const displayName = existing.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'User');

    const profile = {
      uid: user.uid,
      displayName,
      email: user.email || existing.email || '',
      phone: existing.phone || '',
      bio: existing.bio || '',
      profilePhoto: existing.profilePhoto || providerPhoto || '',
      provider,
      links: existing.links || [],
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (dbSuccess) {
      try {
        const setPromise = ref.set(profile, { merge: true });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000));
        await Promise.race([setPromise, timeoutPromise]);
      } catch (e) {
        console.warn("Failed to sync profile back to Firestore:", e);
      }
    } else {
      try {
        localStorage.setItem(`local_profile_${user.uid}`, JSON.stringify(profile));
      } catch (err) {
        console.warn("Failed to write local profile:", err);
      }
    }

    return profile;
  }

  async function updateProfile(updates) {
    initFirebase();
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to update your profile.');

    const payload = Object.assign({}, updates, { updatedAt: serverTimestamp() });
    
    let dbSuccess = false;
    try {
      // 3-second timeout to prevent hangs when Firestore is not created or connection fails
      const writePromise = profileRef(user.uid).set(payload, { merge: true });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000));
      await Promise.race([writePromise, timeoutPromise]);
      dbSuccess = true;
    } catch (e) {
      console.warn("Firestore write failed, falling back to localStorage profile:", e);
    }

    if (updates.displayName && updates.displayName !== user.displayName) {
      try {
        await user.updateProfile({ displayName: updates.displayName });
      } catch (authErr) {
        console.warn("Auth displayName update failed:", authErr);
      }
    }

    // Load/merge profile
    let profile;
    if (dbSuccess) {
      profile = await ensureUserProfile(auth.currentUser).catch(() => buildFallbackProfile(user));
    } else {
      // Build local fallback profile and merge updates
      let existingLocal = {};
      try {
        existingLocal = JSON.parse(localStorage.getItem(`local_profile_${user.uid}`) || '{}');
      } catch (err) {
        console.warn("Failed to read local profile:", err);
      }
      profile = Object.assign(buildFallbackProfile(user), existingLocal, updates, { updatedAt: new Date().toISOString() });
      try {
        localStorage.setItem(`local_profile_${user.uid}`, JSON.stringify(profile));
      } catch (err) {
        console.warn("Failed to write local profile:", err);
      }
    }

    currentState = { user: auth.currentUser, profile, loading: false };
    saveLocalSession(auth.currentUser, profile);
    emit();
    return profile;
  }

  async function uploadProfilePhoto(blob) {
    initFirebase();
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to upload a profile photo.');

    const path = `users/${user.uid}/profile/avatar.jpg`;
    const ref = storage.ref(path);
    await ref.put(blob, {
      contentType: 'image/jpeg',
      customMetadata: { owner: user.uid }
    });
    const url = await ref.getDownloadURL();
    await user.updateProfile({ photoURL: url });
    await updateProfile({ profilePhoto: url });
    return url;
  }

  function getAvatar(profile, user) {
    if (profile && profile.profilePhoto) return profile.profilePhoto;
    if (user && getProvider(user) !== 'password' && user.photoURL) return user.photoURL;
    return DEFAULT_AVATAR;
  }

  function saveLocalSession(user, profile) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', (profile && profile.displayName) || user.displayName || 'User');
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('userPicture', getAvatar(profile, user));
    localStorage.setItem('userUid', user.uid);
  }

  function clearLocalSession() {
    ['isLoggedIn', 'userName', 'userEmail', 'userPicture', 'userUid'].forEach((key) => localStorage.removeItem(key));
  }

  async function signOut() {
    initFirebase();
    await auth.signOut();
    clearLocalSession();
  }

  function getAuth() {
    initFirebase();
    return auth;
  }

  function getFirestore() {
    initFirebase();
    return db;
  }

  function getStorage() {
    initFirebase();
    return storage;
  }

  window.PortfolioAuth = {
    DEFAULT_AVATAR,
    initFirebase,
    onAuthState,
    ensureUserProfile,
    updateProfile,
    uploadProfilePhoto,
    getAvatar,
    getAuth,
    getFirestore,
    getStorage,
    signOut
  };

  initFirebase();
  window.addEventListener('firebase-config-ready', initFirebase, { once: true });
})();
