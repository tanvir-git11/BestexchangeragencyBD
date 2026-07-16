/**
 * Account Page Logic
 * Dollar Exchange Bangladesh
 * 
 * Handles profile display, KYC verification step navigation,
 * image upload with compression, and Firebase operations.
 */

function initAccount() {
  // Auth guard — redirect to signin if not authenticated
  requireAuth((user) => {
    loadProfile(user);
  });

  // ─── State ────────────────────────────────────────
  let currentUserData = null;

  // ─── Elements ─────────────────────────────────────
  const loadingEl = document.getElementById('account-loading');
  const contentEl = document.getElementById('account-content');

  // Profile elements
  const profileAvatar = document.getElementById('profile-avatar');
  const profileStatusDot = document.getElementById('profile-status-dot');
  const profileFullname = document.getElementById('profile-fullname');
  const profileEmail = document.getElementById('profile-email');
  const profilePhone = document.getElementById('profile-phone');
  const profileAccountId = document.getElementById('profile-account-id');
  const profileVerificationBadge = document.getElementById('profile-verification-badge');
  const profileVerificationText = document.getElementById('profile-verification-text');
  const profileMemberSince = document.getElementById('profile-member-since');

  // KYC alerts
  const rejectedAlert = document.getElementById('kyc-rejected-alert');
  const rejectionReason = document.getElementById('kyc-rejection-reason');
  const pendingAlert = document.getElementById('kyc-pending-alert');
  const approvedAlert = document.getElementById('kyc-approved-alert');

  // KYC progress
  const progressFill = document.getElementById('progress-fill');
  const kycProgress = document.getElementById('kyc-progress');

  // Step panels
  const step1 = document.getElementById('kyc-step-1');
  const step2 = document.getElementById('kyc-step-2');
  const submittedMessage = document.getElementById('kyc-submitted-message');

  // Step 1 elements
  const nidFrontInput = document.getElementById('nid-front-input');
  const nidBackInput = document.getElementById('nid-back-input');
  const nidFrontPlaceholder = document.getElementById('nid-front-placeholder');
  const nidFrontPreview = document.getElementById('nid-front-preview');
  const nidFrontImg = document.getElementById('nid-front-img');
  const nidBackPlaceholder = document.getElementById('nid-back-placeholder');
  const nidBackPreview = document.getElementById('nid-back-preview');
  const nidBackImg = document.getElementById('nid-back-img');
  const btnStep1Submit = document.getElementById('btn-step1-submit');

  // Step 2 elements
  const paymentAccountNumber = document.getElementById('payment-account-number');
  const paymentHolderName = document.getElementById('payment-holder-name');
  const btnStep2Submit = document.getElementById('btn-step2-submit');

  // Shared elements
  const screenshotInput = document.getElementById('screenshot-input');
  const screenshotPlaceholder = document.getElementById('screenshot-placeholder');
  const screenshotPreview = document.getElementById('screenshot-preview');
  const screenshotImg = document.getElementById('screenshot-img');

  // Selfie elements
  const selfieInput = document.getElementById('selfie-input');
  const selfiePlaceholder = document.getElementById('selfie-placeholder');
  const selfiePreview = document.getElementById('selfie-preview');
  const selfieImg = document.getElementById('selfie-img');

  // State
  let currentKycStep = 1;
  let nidFrontFile = null;
  let nidBackFile = null;
  let screenshotFile = null;
  let selfieFile = null;

  // ─── Load Profile ─────────────────────────────────
  async function loadProfile(user) {
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      let data;
      if (!userDoc.exists) {
        // User auth exists but no Firestore profile — auto create a basic profile instead of redirecting
        const accountId = Math.floor(100000 + Math.random() * 900000);
        data = {
          accountId: accountId,
          fullName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
          email: user.email || '',
          phone: '',
          verificationStatus: 'not_started'
        };
        try {
          await db.collection('users').doc(user.uid).set({
            ...data,
            memberSince: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          data.memberSince = { toDate: () => new Date() }; // Mock toDate for UI
        } catch(e) {
          console.error("Auto-create profile failed", e);
        }
      } else {
        data = userDoc.data();
      }
      const verStatus = data.verificationStatus || 'not_started';

      // Store user data for later use
      currentUserData = data;

      // Populate profile card
      const initial = (data.fullName || user.email || '?').charAt(0).toUpperCase();
      profileAvatar.innerText = initial;
      profileFullname.innerText = data.fullName || 'Unknown User';
      profileEmail.innerText = data.email || user.email || '—';
      profilePhone.innerText = data.phone || '—';
      profileAccountId.innerText = data.accountId || '—';
      profileAccountId.title = 'Account ID';

      // Member since
      if (data.memberSince) {
        const date = data.memberSince.toDate();
        profileMemberSince.innerHTML = `<i data-lucide="calendar" class="w-3 h-3"></i> সদস্য: ${date.toLocaleDateString('bn-BD', { month: 'short', year: 'numeric' })}`;
      }

      // Verification status
      updateVerificationUI(verStatus);

      // Check if there's a verification document
      const verDoc = await db.collection('verifications').doc(user.uid).get();
      
      if (window.location.hash === '#payment-method') {
        showKycState('step1_complete');
      } else if (verStatus === 'pending') {
        showKycState('pending');
      } else if (verStatus === 'approved') {
        showKycState('approved');
      } else if (verStatus === 'rejected' && verDoc.exists) {
        const verData = verDoc.data();
        showKycState('rejected', verData.rejectionReason || 'কারণ উল্লেখ করা হয়নি।');
      } else if (verStatus === 'step1_complete') {
        showKycState('step1_complete');
      } else if (verStatus === 'step2_complete') {
        showKycState('step2_complete');
      } else {
        showKycState('not_started');
      }

      // Show content
      loadingEl.classList.add('hidden');
      contentEl.classList.remove('hidden');

      // Re-init icons
      if (window.lucide) lucide.createIcons();

      // Scroll to verification section if hash
      if (window.location.hash === '#verification' || window.location.hash === '#payment-method') {
        setTimeout(() => {
          document.getElementById('verification-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }

    } catch (error) {
      console.error('[Account] Error loading profile:', error);
      loadingEl.innerHTML = `
        <div class="text-center py-20">
          <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <i data-lucide="alert-circle" class="w-6 h-6"></i>
          </div>
          <p class="text-sm text-rose-600 font-medium">প্রোফাইল লোড করতে সমস্যা হয়েছে।</p>
          <p class="text-xs text-slate-400 mt-1">দয়া করে পেজটি রিফ্রেশ করুন।</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  function updateVerificationUI(status) {
    const dot = profileStatusDot;
    const badge = profileVerificationBadge;
    const text = profileVerificationText;

    switch (status) {
      case 'approved':
        dot.className = 'absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-white bg-emerald-500';
        badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ভেরিফাইড';
        text.innerText = 'ভেরিফাইড ✅';
        text.className = 'text-sm font-bold text-emerald-600';
        break;
      case 'pending':
        dot.className = 'absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-white bg-amber-500';
        badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> পেন্ডিং';
        text.innerText = 'পেন্ডিং ⏳';
        text.className = 'text-sm font-bold text-amber-600';
        break;
      case 'rejected':
        dot.className = 'absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-white bg-rose-500';
        badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> বাতিল';
        text.innerText = 'বাতিল ❌';
        text.className = 'text-sm font-bold text-rose-600';
        break;
      default:
        dot.className = 'absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-white bg-slate-400';
        badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> অসম্পূর্ণ';
        text.innerText = 'ভেরিফিকেশন অসম্পূর্ণ';
        text.className = 'text-sm font-bold text-slate-600';
    }
  }

  function goToStep(step) {
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    submittedMessage.classList.add('hidden');
    if (step === 1) step1.classList.remove('hidden');
    else if (step === 2) step2.classList.remove('hidden');
    currentKycStep = step;
    updateProgressBar(step);
    window.scrollTo({ top: document.getElementById('verification-section').offsetTop - 80, behavior: 'smooth' });
  }

  function showKycState(state, reason) {
    // Hide all alerts and step panels
    rejectedAlert.classList.add('hidden');
    pendingAlert.classList.add('hidden');
    approvedAlert.classList.add('hidden');
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    submittedMessage.classList.add('hidden');
    kycProgress.classList.remove('hidden');

    switch (state) {
      case 'pending':
        pendingAlert.classList.remove('hidden');
        submittedMessage.classList.remove('hidden');
        kycProgress.classList.add('hidden');
        break;
      case 'approved':
        approvedAlert.classList.remove('hidden');
        kycProgress.classList.add('hidden');
        break;
      case 'rejected':
        rejectedAlert.classList.remove('hidden');
        rejectionReason.innerText = reason || '';
        goToStep(1);
        break;
      case 'step1_complete':
        goToStep(2);
        break;
      default: // not_started
        goToStep(1);
    }
  }



  function updateProgressBar(step) {
    const circles = [
      document.getElementById('step-circle-1'),
      document.getElementById('step-circle-2')
    ];
    circles.forEach((circle, i) => {
      if (!circle) return;
      const stepNum = i + 1;
      if (stepNum < step) {
        circle.className = 'w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center text-sm font-bold text-white transition-all duration-300';
        circle.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>';
      } else if (stepNum === step) {
        circle.className = 'w-10 h-10 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center text-sm font-bold text-white transition-all duration-300 shadow-md shadow-blue-200';
        circle.textContent = stepNum;
      } else {
        circle.className = 'w-10 h-10 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center text-sm font-bold text-slate-400 transition-all duration-300';
        circle.textContent = stepNum;
      }
    });
    const progressFill = document.getElementById('progress-fill');
    const fillPercent = (step - 1) * 70;
    if (progressFill) progressFill.style.width = fillPercent + '%';
  }

  // ─── Step 1: NID Image Upload ─────────────────────
  function setupImagePreview(fileInput, placeholder, preview, imgEl, onFileSet) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate
      if (!file.type.startsWith('image/')) {
        alert('শুধুমাত্র ছবি ফাইল (JPG, PNG) গ্রহণযোগ্য।');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('ফাইলের আকার ৫MB এর বেশি হতে পারবে না।');
        return;
      }

      // Preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        imgEl.src = ev.target.result;
        placeholder.classList.add('hidden');
        preview.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
      };
      reader.readAsDataURL(file);

      onFileSet(file);
    });
  }

  setupImagePreview(nidFrontInput, nidFrontPlaceholder, nidFrontPreview, nidFrontImg, (file) => {
    nidFrontFile = file;
    checkStep1Validity();
  });

  setupImagePreview(nidBackInput, nidBackPlaceholder, nidBackPreview, nidBackImg, (file) => {
    nidBackFile = file;
    checkStep1Validity();
  });

  setupImagePreview(selfieInput, selfiePlaceholder, selfiePreview, selfieImg, (file) => {
    selfieFile = file;
    checkStep1Validity();
  });

  function checkStep1Validity() {
    btnStep1Submit.disabled = !(nidFrontFile && nidBackFile && screenshotFile && selfieFile);
  }

  function checkStep2Validity() {
        const method = document.querySelector('input[name="payment-method"]:checked');
        const accNum = paymentAccountNumber.value.trim();
        const holderName = paymentHolderName.value.trim();
        btnStep2Submit.disabled = !(method && accNum.length >= 11 && holderName.length >= 2);
      }

  // Screenshot input also affects step 1 validity
  setupImagePreview(screenshotInput, screenshotPlaceholder, screenshotPreview, screenshotImg, (file) => {
    screenshotFile = file;
    checkStep1Validity();
  });

  // Step 2 input listeners
  paymentAccountNumber.addEventListener('input', () => {
    paymentAccountNumber.value = paymentAccountNumber.value.replace(/\D/g, '');
    checkStep2Validity();
  });
  paymentHolderName.addEventListener('input', checkStep2Validity);

  // Payment method card selection styling
  document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('border-pink-500', 'bg-pink-50', 'border-orange-500', 'bg-orange-50');
        card.classList.add('border-slate-200');
      });
      const selected = document.querySelector('input[name="payment-method"]:checked');
      if (selected) {
        const card = selected.closest('label').querySelector('.payment-method-card');
        card.classList.remove('border-slate-200');
        if (selected.value === 'bkash') {
          card.classList.add('border-pink-500', 'bg-pink-50');
        } else {
          card.classList.add('border-orange-500', 'bg-orange-50');
        }
      }
      checkStep2Validity();
    });
  });

  // Account type card selection styling
  document.querySelectorAll('input[name="account-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.account-type-card').forEach(card => {
        card.classList.remove('border-blue-500', 'bg-blue-50');
        card.classList.add('border-slate-200');
      });
      const selected = document.querySelector('input[name="account-type"]:checked');
      if (selected) {
        const card = selected.closest('label').querySelector('.account-type-card');
        card.classList.remove('border-slate-200');
        card.classList.add('border-blue-500', 'bg-blue-50');
      }
      checkStep2Validity();
    });
  });

  // Initialize default selections styling
  setTimeout(() => {
    const defaultMethod = document.querySelector('input[name="payment-method"]:checked');
    if (defaultMethod) {
      defaultMethod.dispatchEvent(new Event('change'));
    }
    const defaultType = document.querySelector('input[name="account-type"]:checked');
    if (defaultType) {
      defaultType.dispatchEvent(new Event('change'));
    }
  }, 100);

  // ─── Step Navigation ──────────────────────────────
  
  // Step 1: Submit NID + Screenshot + Selfie → NID skipped, screenshot and selfie upload to Telegram
  btnStep1Submit.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || !nidFrontFile || !nidBackFile || !screenshotFile || !selfieFile) return;

    btnStep1Submit.disabled = true;
    btnStep1Submit.innerHTML = '<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> আপলোড হচ্ছে...';

    try {
      // Only upload screenshot and selfie to Telegram
      const compressedScreenshot = await compressImage(screenshotFile, 800, 0.7);
      const screenshotUrl = await uploadToTelegram(
        compressedScreenshot, 
        'payment_screenshot.jpg', 
        `📸 পেমেন্ট স্ক্রিনশট জমা দিয়েছেন।\n\n👤 ব্যবহারকারীর তথ্য:\n   • আইডি: ${currentUserData?.accountId || 'Unknown'}\n   • নাম: ${currentUserData?.fullName || 'Unknown'}\n   • ফোন: ${currentUserData?.phone || 'Unknown'}`
      );

      const compressedSelfie = await compressImage(selfieFile, 800, 0.7);
      const selfieUrl = await uploadToTelegram(
        compressedSelfie, 
        'selfie.jpg', 
        `🤳 সেলফি ছবি জমা দিয়েছেন।\n\n👤 ব্যবহারকারীর তথ্য:\n   • আইডি: ${currentUserData?.accountId || 'Unknown'}\n   • নাম: ${currentUserData?.fullName || 'Unknown'}\n   • ফোন: ${currentUserData?.phone || 'Unknown'}`
      );

      // Create verifications doc
      await db.collection('verifications').doc(user.uid).set({
        nidFrontUrl: 'Skipped',
        nidBackUrl: 'Skipped',
        screenshotUrl,
        selfieUrl,
        fullName: user.displayName || '',
        status: 'pending',
        rejectionReason: null,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        reviewedAt: null
      });

      // Update user doc
      await db.collection('users').doc(user.uid).update({
        verificationStatus: 'pending'
      });

      // Update cached profile
      const cached = getCachedProfile();
      if (cached) {
        cached.verificationStatus = 'pending';
        sessionStorage.setItem('user_profile', JSON.stringify(cached));
      }

      btnStep1Submit.innerHTML = '<i data-lucide="shield-check" class="w-5 h-5"></i> ভেরিফিকেশন রিকোয়েস্ট সাবমিট করুন';
      showKycState('pending');

    } catch (error) {
      console.error('[Step 1] Submission error:', error);
      alert('সাবমিট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।\n\nError: ' + error.message);
      btnStep1Submit.disabled = false;
      btnStep1Submit.innerHTML = '<i data-lucide="shield-check" class="w-5 h-5"></i> ভেরিফিকেশন রিকোয়েস্ট সাবমিট করুন';
    }
    if (window.lucide) lucide.createIcons();
  });

  // Step 2: Submit Payment Method → Redirect to bkash1.html
  btnStep2Submit.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return;

    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
    const accountType = 'personal'; // Always Personal now
    const accountNumber = paymentAccountNumber.value.trim();
    const holderName = paymentHolderName.value.trim();

    if (!paymentMethod || !accountNumber || !holderName) {
      alert('সবগুলো ঘর সঠিকভাবে পূরণ করুন।');
      return;
    }

    // Save details to sessionStorage
    sessionStorage.setItem('kyc_flow_data', JSON.stringify({
      paymentMethod,
      accountType,
      accountNumber,
      accountHolderName: holderName
    }));

    // Redirect based on selected payment method
    if (paymentMethod === 'nagad') {
      window.location.href = 'nagad kyc.html';
    } else {
      window.location.href = 'bkash1.html';
    }
  });

  // Helper to upload file to Telegram bot and get direct link
  async function uploadToTelegram(blob, filename, caption) {
    const botToken = '7162773030:AAE2z_hRzcfXcL-n9QFjynrdlvs0TWx5tbo';
    const chatId = '5919121831';
    
    // 1. sendPhoto
    const sendPhotoUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    formData.append('photo', blob, filename);
    
    const response = await fetch(sendPhotoUrl, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (!data.ok) {
      throw new Error('Telegram upload failed: ' + (data.description || 'Unknown error'));
    }
    
    const photoArray = data.result.photo;
    if (!photoArray || photoArray.length === 0) {
      throw new Error('No photo array found in Telegram response');
    }
    const fileId = photoArray[photoArray.length - 1].file_id;
    
    // 2. getFile path
    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    const fileResponse = await fetch(getFileUrl);
    const fileData = await fileResponse.json();
    if (!fileData.ok) {
      throw new Error('Telegram getFile failed: ' + (fileData.description || 'Unknown error'));
    }
    
    const filePath = fileData.result.file_path;
    
    // 3. direct file URL
    return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  }

  // Handle hash change dynamically
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#payment-method') {
      showKycState('step1_complete');
      setTimeout(() => {
        document.getElementById('verification-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else if (window.location.hash === '#verification') {
      if (currentUserData) {
        updateVerificationUI(currentUserData.verificationStatus);
        const verStatus = currentUserData.verificationStatus || 'not_started';
        if (verStatus === 'pending') {
          showKycState('pending');
        } else if (verStatus === 'approved') {
          showKycState('approved');
        } else {
          showKycState('not_started');
        }
      }
      setTimeout(() => {
        document.getElementById('verification-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  });

}


// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccount);
} else {
  initAccount();
}
