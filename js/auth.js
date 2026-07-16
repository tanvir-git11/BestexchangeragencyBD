/**
 * Shared Authentication Utilities
 * Dollar Exchange Bangladesh
 * 
 * Handles auth state, header profile icon injection,
 * sign in/out helpers, and auth guards.
 */

// ─── Auth State Management ─────────────────────────────────────
let currentUser = null;

/**
 * Listen to auth state changes and update UI globally
 */
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  updateHeaderAuth(user);
  
  if (user) {
    // Cache minimal user info in sessionStorage for quick access
    try {
      const userRef = db.collection('users').doc(user.uid);
      let userDoc = await userRef.get();
      if (userDoc.exists) {
        let data = userDoc.data();
        
        // Auto-generate 6-digit unique Account ID if missing
        if (!data.accountId) {
          const generatedId = Math.floor(100000 + Math.random() * 900000);
          await userRef.update({ accountId: generatedId });
          data.accountId = generatedId;
        }

        sessionStorage.setItem('user_profile', JSON.stringify({
          uid: user.uid,
          accountId: data.accountId,
          fullName: data.fullName || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          verificationStatus: data.verificationStatus || 'not_started',
          memberSince: data.memberSince ? data.memberSince.toDate().toISOString() : new Date().toISOString()
        }));
      }
    } catch (e) {
      console.warn('[Auth] Could not fetch user profile:', e);
    }
  } else {
    sessionStorage.removeItem('user_profile');
  }
});

/**
 * Update header to show profile icon or sign-in button
 */
function updateHeaderAuth(user) {
  const authContainer = document.getElementById('header-auth-container');
  if (!authContainer) return;

  if (user) {
    // Get cached profile for name initial
    const cached = sessionStorage.getItem('user_profile');
    let initial = '?';
    let fullName = 'User';
    let verStatus = 'not_started';
    
    if (cached) {
      const profile = JSON.parse(cached);
      initial = (profile.fullName || user.email || '?').charAt(0).toUpperCase();
      fullName = profile.fullName || user.email || 'User';
      verStatus = profile.verificationStatus || 'not_started';
    } else {
      initial = (user.email || '?').charAt(0).toUpperCase();
      fullName = user.email || 'User';
    }

    const statusColor = verStatus === 'approved' ? 'bg-emerald-500' : 
                         verStatus === 'pending' ? 'bg-amber-500' : 'bg-rose-500';

    authContainer.innerHTML = `
      <div class="relative" id="profile-dropdown-wrapper">
        <button id="btn-profile-toggle" class="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-all group" title="${fullName}">
          <div class="relative">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:shadow-md transition-shadow">
              ${initial}
            </div>
            <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 ${statusColor} rounded-full border-2 border-white"></span>
          </div>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block"></i>
        </button>

        <div id="profile-dropdown" class="hidden absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-100 shadow-premium-lg z-50 overflow-hidden animate-slide-up">
          <div class="p-4 border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                ${initial}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-800 truncate">${fullName}</p>
                <p class="text-[11px] text-slate-400 truncate">${user.email || ''}</p>
              </div>
            </div>
          </div>
          <div class="py-1.5">
            <a href="account.html" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <i data-lucide="user-circle" class="w-4 h-4 text-slate-400"></i>
              <span>আমার অ্যাকাউন্ট</span>
            </a>
            <a href="account.html#verification" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <i data-lucide="shield-check" class="w-4 h-4 text-slate-400"></i>
              <span>ভেরিফিকেশন</span>
              ${verStatus === 'pending' ? '<span class="ml-auto text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">পেন্ডিং</span>' : 
                verStatus === 'approved' ? '<span class="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">ভেরিফাইড</span>' : ''}
            </a>
            <a href="account.html#payment-method" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <i data-lucide="wallet" class="w-4 h-4 text-slate-400"></i>
              <span>পেমেন্ট মেথড</span>
            </a>
            <div class="border-t border-slate-100 my-1.5"></div>
            <button onclick="handleSignOut()" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors w-full text-left">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              <span>সাইন আউট</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Re-initialize Lucide icons for the injected content
    if (window.lucide) lucide.createIcons();

    // Toggle dropdown
    const toggleBtn = document.getElementById('btn-profile-toggle');
    const dropdown = document.getElementById('profile-dropdown');
    
    if (toggleBtn && dropdown) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('profile-dropdown-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      });
    }
  } else {
    authContainer.innerHTML = `
      <a href="signin.html" class="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-1.5">
        <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
        <span>সাইন ইন</span>
      </a>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

// ─── Auth Actions ──────────────────────────────────────────────

/**
 * Sign in with email and password
 */
async function signInUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    let message = 'সাইন ইন করতে সমস্যা হয়েছে।';
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।';
        break;
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে।';
        break;
      case 'auth/invalid-email':
        message = 'ইমেইল ঠিকানাটি সঠিক নয়।';
        break;
      case 'auth/user-disabled':
        message = 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।';
        break;
      case 'auth/too-many-requests':
        message = 'অনেকবার ভুল চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।';
        break;
    }
    return { success: false, message };
  }
}

/**
 * Register a new user with email/password and save profile to Firestore
 */
async function registerUser(email, password, profileData) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    const accountId = Math.floor(100000 + Math.random() * 900000);

    // Save user profile document in Firestore
    await db.collection('users').doc(user.uid).set({
      accountId: accountId,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      fullName: profileData.fullName,
      email: email,
      phone: profileData.phone,
      dateOfBirth: profileData.dateOfBirth,
      verificationStatus: 'not_started',
      memberSince: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, user };
  } catch (error) {
    let message = 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।';
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'এই ইমেইল দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট আছে।';
        break;
      case 'auth/invalid-email':
        message = 'ইমেইল ঠিকানাটি সঠিক নয়।';
        break;
      case 'auth/weak-password':
        message = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
        break;
      case 'auth/operation-not-allowed':
        message = 'ইমেইল/পাসওয়ার্ড সাইন-আপ বর্তমানে নিষ্ক্রিয়।';
        break;
    }
    return { success: false, message };
  }
}

/**
 * Sign out the current user
 */
async function handleSignOut() {
  try {
    await auth.signOut();
    sessionStorage.removeItem('user_profile');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('[Auth] Sign out error:', error);
  }
}

/**
 * Auth guard — redirect to signin if not authenticated
 */
function requireAuth(callback) {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'signin.html';
    } else if (callback) {
      callback(user);
    }
  });
}

/**
 * Get cached user profile from sessionStorage
 */
function getCachedProfile() {
  const cached = sessionStorage.getItem('user_profile');
  return cached ? JSON.parse(cached) : null;
}

/**
 * Compress an image file using Canvas before upload
 * Returns a Blob of the compressed image
 */
function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if wider than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
