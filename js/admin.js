/**
 * Admin Dashboard Controller Logic
 * Dollar Exchange Bangladesh
 */

function initAdmin() {
  const loginOverlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const adminPasscode = document.getElementById('admin-passcode');
  const loginError = document.getElementById('login-error');
  const dashboardContent = document.getElementById('dashboard-content');
  
  // Rate Configuration Elements
  const rateBinanceInput = document.getElementById('rate-binance');
  const rateRedotpayInput = document.getElementById('rate-redotpay');
  const rateWiseInput = document.getElementById('rate-wise');
  const rateBybitInput = document.getElementById('rate-bybit');
  const ratePayoneerInput = document.getElementById('rate-payoneer');
  const rateQuotexInput = document.getElementById('rate-quotex');
  const ratePaypalInput = document.getElementById('rate-paypal');
  const rateUsdtInput = document.getElementById('rate-usdt');
  const limitMinInput = document.getElementById('limit-min');
  const limitMaxInput = document.getElementById('limit-max');
  const noticeInput = document.getElementById('admin-notice');
  const formRates = document.getElementById('form-rates');
  
  // Wallet Numbers Elements
  const walletBkashInput = document.getElementById('wallet-bkash');
  const walletNagadInput = document.getElementById('wallet-nagad');
  const formWallets = document.getElementById('form-wallets');
  
  // Transaction table container
  const txTableBody = document.getElementById('tx-table-body');
  const btnLogout = document.getElementById('btn-logout');
  
  // Toast notifications helper
  const toast = document.getElementById('admin-toast');
  const toastMessage = document.getElementById('toast-message');
  
  function showToast(msg, type = 'success') {
    toastMessage.innerText = msg;
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg transition-all duration-300 transform translate-y-0 z-50 flex items-center gap-2 ${
      type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
    }`;
    
    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
  }

  // Check login status from sessionStorage
  function checkLogin() {
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
      loginOverlay.classList.add('hidden');
      dashboardContent.classList.remove('hidden');
      loadConfigValues();
      renderTransactionsTable();
    } else {
      loginOverlay.classList.remove('hidden');
      dashboardContent.classList.add('hidden');
    }
  }

  // Handle Login
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (adminPasscode.value === 'admin123') {
      sessionStorage.setItem('admin_logged_in', 'true');
      loginError.classList.add('hidden');
      adminPasscode.value = '';
      checkLogin();
      showToast('অ্যাডমিন প্যানেলে সফলভাবে লগইন করেছেন।');
    } else {
      loginError.innerText = 'ভুল পাসকোড! আবার চেষ্টা করুন।';
      loginError.classList.remove('hidden');
    }
  });

  // Handle Logout
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('admin_logged_in');
    checkLogin();
  });

  // Load state config values into input fields
  function loadConfigValues() {
    const state = getAppState();
    
    // Rates
    rateBinanceInput.value = state.rates['binance'] || state.rates['binance_usdt'] || 0;
    rateRedotpayInput.value = state.rates['redotpay'] || 0;
    rateWiseInput.value = state.rates['wise'] || 0;
    rateBybitInput.value = state.rates['bybit'] || 0;
    ratePayoneerInput.value = state.rates['payoneer'] || 0;
    rateQuotexInput.value = state.rates['quotex'] || 0;
    ratePaypalInput.value = state.rates['paypal'] || 0;
    rateUsdtInput.value = state.rates['usdt'] || 0;
    
    // Limits & Notice
    limitMinInput.value = state.settings.min_amount_bdt;
    limitMaxInput.value = state.settings.max_amount_bdt;
    noticeInput.value = state.settings.notice;
    
    // Wallets
    walletBkashInput.value = state.wallets['bkash'].number;
    walletNagadInput.value = state.wallets['nagad'].number;
  }

  // Save rates and configuration
  formRates.addEventListener('submit', (e) => {
    e.preventDefault();
    const state = getAppState();
    
    state.rates['binance'] = Number(rateBinanceInput.value);
    state.rates['redotpay'] = Number(rateRedotpayInput.value);
    state.rates['wise'] = Number(rateWiseInput.value);
    state.rates['bybit'] = Number(rateBybitInput.value);
    state.rates['payoneer'] = Number(ratePayoneerInput.value);
    state.rates['quotex'] = Number(rateQuotexInput.value);
    state.rates['paypal'] = Number(ratePaypalInput.value);
    state.rates['usdt'] = Number(rateUsdtInput.value);
    
    state.settings.min_amount_bdt = Number(limitMinInput.value);
    state.settings.max_amount_bdt = Number(limitMaxInput.value);
    state.settings.notice = noticeInput.value;
    
    saveAppState(state);
    showToast('এক্সচেঞ্জ রেট এবং জেনারেল সেটিংস সফলভাবে আপডেট করা হয়েছে।');
  });

  // Save wallet numbers
  formWallets.addEventListener('submit', (e) => {
    e.preventDefault();
    const state = getAppState();
    
    state.wallets['bkash'].number = walletBkashInput.value;
    state.wallets['nagad'].number = walletNagadInput.value;
    
    saveAppState(state);
    showToast('পেমেন্ট ওয়ালেট নাম্বারগুলো সফলভাবে আপডেট করা হয়েছে।');
  });

  // Render transactions table
  function renderTransactionsTable() {
    const state = getAppState();
    txTableBody.innerHTML = '';
    
    if (state.transactions.length === 0) {
      txTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="px-6 py-10 text-center text-slate-400 text-sm">
            কোন লেনদেনের তথ্য পাওয়া যায়নি।
          </td>
        </tr>
      `;
      return;
    }
    
    state.transactions.forEach((tx) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 text-sm';
      
      // Status styling
      let statusBadge = '';
      if (tx.status === 'pending') {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>পেন্ডিং</span>`;
      } else if (tx.status === 'approved') {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>অনুমোদিত</span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>বাতিল</span>`;
      }
      
      // Action buttons
      let actionButtons = '';
      if (tx.status === 'pending') {
        actionButtons = `
          <div class="flex items-center gap-2">
            <button onclick="updateTxStatus('${tx.id}', 'approved')" class="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-medium transition shadow-sm">অনুমোদন</button>
            <button onclick="updateTxStatus('${tx.id}', 'rejected')" class="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-xs font-medium transition shadow-sm">বাতিল</button>
          </div>
        `;
      } else {
        actionButtons = `
          <button onclick="deleteTx('${tx.id}')" class="text-rose-500 hover:text-rose-700 transition" title="মুছে ফেলুন">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        `;
      }
      
      const sendLabel = CURRENCY_NAMES[tx.sendMethod] || tx.sendMethod;
      const receiveLabel = CURRENCY_NAMES[tx.receiveMethod] || tx.receiveMethod;
      const formattedDate = formatTxDate(tx.date);

      tr.innerHTML = `
        <td class="px-6 py-4 font-semibold text-slate-800">${tx.id}</td>
        <td class="px-6 py-4 text-slate-500 whitespace-nowrap">${formattedDate}</td>
        <td class="px-6 py-4 text-slate-700">${sendLabel} ➔ ${receiveLabel}</td>
        <td class="px-6 py-4 text-slate-800 font-medium">৳${tx.sendAmount} BDT</td>
        <td class="px-6 py-4 text-slate-800 font-medium">${tx.receiveAmount.toFixed(2)}</td>
        <td class="px-6 py-4 text-slate-600 max-w-[150px] truncate" title="${tx.userWallet}">${tx.userWallet}</td>
        <td class="px-6 py-4 text-slate-600">${tx.userContact}</td>
        <td class="px-6 py-4 text-slate-700 font-mono font-medium">${tx.txid}</td>
        <td class="px-6 py-4">${statusBadge}</td>
        <td class="px-6 py-4">${actionButtons}</td>
      `;
      
      txTableBody.appendChild(tr);
    });
  }

  // Globally bind action triggers
  window.updateTxStatus = function(txId, status) {
    const state = getAppState();
    const tx = state.transactions.find(t => t.id === txId);
    
    if (tx) {
      tx.status = status;
      saveAppState(state);
      renderTransactionsTable();
      
      const message = status === 'approved' ? 'লেনদেনটি সফলভাবে অনুমোদিত হয়েছে।' : 'লেনদেনটি বাতিল করা হয়েছে।';
      showToast(message, status === 'approved' ? 'success' : 'error');
    }
  };

  window.deleteTx = function(txId) {
    if (!confirm('আপনি কি নিশ্চিত যে এই লেনদেনের তথ্যটি মুছে ফেলতে চান?')) return;
    
    const state = getAppState();
    state.transactions = state.transactions.filter(t => t.id !== txId);
    saveAppState(state);
    renderTransactionsTable();
    showToast('লেনদেনের তথ্যটি স্থায়ীভাবে মুছে ফেলা হয়েছে।', 'error');
  };

  // ─── Tab Switching ───
  const btnTabExchange = document.getElementById('btn-tab-exchange');
  const btnTabVerification = document.getElementById('btn-tab-verification');
  const panelExchange = document.getElementById('panel-exchange');
  const panelVerification = document.getElementById('panel-verification');
  const filterKycStatus = document.getElementById('filter-kyc-status');
  const kycRequestsContainer = document.getElementById('kyc-requests-container');

  if (btnTabExchange && btnTabVerification) {
    btnTabExchange.addEventListener('click', () => {
      btnTabExchange.classList.add('border-indigo-600', 'text-indigo-600');
      btnTabExchange.classList.remove('border-transparent', 'text-slate-500');
      
      btnTabVerification.classList.remove('border-indigo-600', 'text-indigo-600');
      btnTabVerification.classList.add('border-transparent', 'text-slate-500');
      
      panelExchange.classList.remove('hidden');
      panelVerification.classList.add('hidden');
    });

    btnTabVerification.addEventListener('click', () => {
      btnTabVerification.classList.add('border-indigo-600', 'text-indigo-600');
      btnTabVerification.classList.remove('border-transparent', 'text-slate-500');
      
      btnTabExchange.classList.remove('border-indigo-600', 'text-indigo-600');
      btnTabExchange.classList.add('border-transparent', 'text-slate-500');
      
      panelVerification.classList.remove('hidden');
      panelExchange.classList.add('hidden');
      
      renderKycRequests();
    });
  }

  if (filterKycStatus) {
    filterKycStatus.addEventListener('change', renderKycRequests);
  }

  // ─── KYC Rendering ───
  async function renderKycRequests() {
    if (!kycRequestsContainer) return;
    kycRequestsContainer.innerHTML = `
      <div class="md:col-span-2 text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-premium text-slate-400">
        <div class="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-sm font-medium">ভেরিফিকেশন ডাটা লোড হচ্ছে...</p>
      </div>
    `;

    try {
      const statusFilter = filterKycStatus.value;
      let query = db.collection('verifications');
      
      if (statusFilter !== 'all') {
        query = query.where('status', '==', statusFilter);
      }
      
      // Fetch without orderBy to prevent Firestore index errors
      const snapshot = await query.get();
      
      kycRequestsContainer.innerHTML = '';
      
      if (snapshot.empty) {
        kycRequestsContainer.innerHTML = `
          <div class="md:col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-premium text-slate-400">
            <i data-lucide="shield-alert" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
            <p class="text-sm font-medium">কোন ভেরিফিকেশন রিকোয়েস্ট পাওয়া যায়নি।</p>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }
      
      // Sort manually by submittedAt descending
      const docs = snapshot.docs.sort((a, b) => {
        const t1 = a.data().submittedAt ? a.data().submittedAt.toMillis() : 0;
        const t2 = b.data().submittedAt ? b.data().submittedAt.toMillis() : 0;
        return t2 - t1;
      });
      
      docs.forEach(doc => {
        const kyc = doc.data();
        const uid = doc.id;
        const submittedDate = kyc.submittedAt ? kyc.submittedAt.toDate().toLocaleString('bn-BD') : 'N/A';
        
        let statusBadge = '';
        if (kyc.status === 'pending') {
          statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>পেন্ডিং</span>`;
        } else if (kyc.status === 'approved') {
          statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>অনুমোদিত</span>`;
        } else {
          statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>বাতিলকৃত</span>`;
        }
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-slate-100 shadow-premium p-5 flex flex-col justify-between space-y-4';
        
        card.innerHTML = `
          <div class="space-y-3">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="font-bold text-slate-800 text-base">${kyc.fullName}</h3>
                <p class="text-xs text-slate-400 mt-0.5">জমা: ${submittedDate}</p>
              </div>
              <div>
                ${statusBadge}
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="bg-slate-50 p-2.5 rounded-lg">
                <span class="block text-slate-400 font-semibold mb-0.5">মোবাইল নাম্বার</span>
                <span class="font-bold text-slate-700">${kyc.phone}</span>
              </div>
              <div class="bg-slate-50 p-2.5 rounded-lg">
                <span class="block text-slate-400 font-semibold mb-0.5">পেমেন্ট মেথড</span>
                <span class="font-bold text-slate-700 capitalize">${kyc.paymentMethod} (${kyc.accountType || 'Personal'})</span>
              </div>
              <div class="bg-slate-50 p-2.5 rounded-lg">
                <span class="block text-slate-400 font-semibold mb-0.5">হোল্ডার নেম</span>
                <span class="font-bold text-slate-700 truncate block" title="${kyc.accountHolderName}">${kyc.accountHolderName}</span>
              </div>
              <div class="bg-slate-50 p-2.5 rounded-lg">
                <span class="block text-slate-400 font-semibold mb-0.5">অ্যাকাউন্ট নাম্বার</span>
                <span class="font-bold text-slate-700">${kyc.accountNumber}</span>
              </div>
            </div>
            
            ${kyc.rejectionReason ? `
              <div class="bg-rose-50 text-rose-700 p-2.5 rounded-lg text-xs border border-rose-100">
                <span class="font-bold block mb-0.5">বাতিলের কারণ:</span>
                <span>${kyc.rejectionReason}</span>
              </div>
            ` : ''}
            
            <div>
              <span class="block text-xs font-semibold text-slate-500 mb-2">ব্যালেন্স ও অ্যাকাউন্ট সহ হোম স্ক্রিনশট:</span>
              <div class="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 relative aspect-video flex items-center justify-center">
                <img data-src="${kyc.screenshotUrl}" class="lazy-load max-h-48 object-contain cursor-zoom-in" alt="Payment Method Screenshot" onclick="window.open('${kyc.screenshotUrl}', '_blank')">
                <div class="absolute inset-0 flex items-center justify-center bg-slate-100/50 lazy-loader-placeholder">
                  <div class="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pt-3 border-t border-slate-100 flex gap-2">
            <button onclick="updateKycStatus('${uid}', 'approved')" class="flex-1 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
              <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> অনুমোদন
            </button>
            <button onclick="updateKycStatus('${uid}', 'rejected')" class="flex-1 h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
              <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> বাতিল করুন
            </button>
            ${kyc.status !== 'pending' ? `
              <button onclick="updateKycStatus('${uid}', 'pending')" class="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition flex items-center justify-center" title="পেন্ডিং করুন">
                <i data-lucide="clock" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        `;
        
        kycRequestsContainer.appendChild(card);
      });
      
      if (window.lucide) lucide.createIcons();
      setupLazyLoading();
      
    } catch (e) {
      console.error('[KYC] Error rendering requests:', e);
      if (kycRequestsContainer) {
        kycRequestsContainer.innerHTML = `
          <div class="md:col-span-2 text-center py-16 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl">
            <p class="text-sm font-semibold">ভেরিফিকেশন ডাটা লোড করতে ব্যর্থ হয়েছে।</p>
            <p class="text-xs mt-1">${e.message}</p>
          </div>
        `;
      }
    }
  }

  // Lazy Loading Handler using Intersection Observer
  function setupLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy-load');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.getAttribute('data-src');
            img.addEventListener('load', () => {
              img.classList.add('loaded');
              const placeholder = img.nextElementSibling;
              if (placeholder && placeholder.classList.contains('lazy-loader-placeholder')) {
                placeholder.classList.add('hidden');
              }
            });
            obs.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(img => observer.observe(img));
    } else {
      lazyImages.forEach(img => {
        img.src = img.getAttribute('data-src');
        img.classList.add('loaded');
        const placeholder = img.nextElementSibling;
        if (placeholder) placeholder.classList.add('hidden');
      });
    }
  }

  // Global Actions inside window
  window.updateKycStatus = async function(uid, status) {
    let rejectionText = null;
    if (status === 'rejected') {
      rejectionText = prompt('ভেরিফিকেশন বাতিল করার কারণ লিখুন (গ্রাহক এটি দেখতে পাবেন):');
      if (rejectionText === null) return;
      if (!rejectionText.trim()) {
        alert('বাতিল করার কারণ দেওয়া আবশ্যক।');
        return;
      }
    }

    try {
      showToast('স্ট্যাটাস আপডেট করা হচ্ছে...');
      
      const updateData = {
        status: status,
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      if (status === 'rejected') {
        updateData.rejectionReason = rejectionText;
      } else {
        updateData.rejectionReason = firebase.firestore.FieldValue.delete();
      }

      await db.collection('verifications').doc(uid).update(updateData);
      
      await db.collection('users').doc(uid).update({
        verificationStatus: status
      });

      showToast(`গ্রাহক ভেরিফিকেশন স্ট্যাটাস সফলভাবে '${status}' করা হয়েছে।`, 'success');
      renderKycRequests();
      
    } catch (e) {
      console.error('[KYC] Update status error:', e);
      showToast('আপডেট করতে ত্রুটি হয়েছে: ' + e.message, 'error');
    }
  };

  // Check login status from sessionStorage
  function checkLogin() {
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
      loginOverlay.classList.add('hidden');
      dashboardContent.classList.remove('hidden');
      loadConfigValues();
      renderTransactionsTable();
      renderKycRequests();
    } else {
      loginOverlay.classList.remove('hidden');
      dashboardContent.classList.add('hidden');
    }
  }

  // Run Check
  checkLogin();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}
