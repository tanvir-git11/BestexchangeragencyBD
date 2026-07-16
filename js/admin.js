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
    toast.className = 'fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg transition-all duration-300 transform translate-y-0 z-50 flex items-center gap-2 ' + (type === 'success' ? 'bg-emerald-500' : 'bg-rose-500');
    
    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
  }

  // Check login status from sessionStorage
  async function checkLogin() {
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
      // Try anonymous auth (best-effort - don't block if it fails)
      try {
        if (!firebase.auth().currentUser) {
          await firebase.auth().signInAnonymously();
        }
      } catch (e) {
        // Ignore auth errors for now
      }
      loginOverlay.classList.add('hidden');
      dashboardContent.classList.remove('hidden');
      loadConfigValues();
      renderTransactionsTable();
      renderKycRequests();
      runFirestoreDiagnostic();
    } else {
      loginOverlay.classList.remove('hidden');
      dashboardContent.classList.add('hidden');
    }
  }

  // Handle Login
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (adminPasscode.value === 'admin123') {
      // Try anonymous auth - don't block login if it fails
      firebase.auth().signInAnonymously().catch(err => {
        // Ignore
      });
      sessionStorage.setItem('admin_logged_in', 'true');
      loginError.classList.add('hidden');
      adminPasscode.value = '';
      checkLogin();
      showToast('অ্যাডমিন ড্যাশবোর্ডে সফলভাবে লগইন করেছেন।');
    } else {
      loginError.innerText = 'ভুল পাসকোড! আবার চেষ্টা করুন।';
      loginError.classList.remove('hidden');
    }
  });

  // Handle Logout
  btnLogout.addEventListener('click', async () => {
    sessionStorage.removeItem('admin_logged_in');
    try {
      await firebase.auth().signOut();
    } catch (e) {
      // Ignore
    }
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
    showToast('এক্সচেঞ্জ রেট এবং জেনারেল সেটিংস সফলভাবে আপডেট করা হয়েছে।');
  });

  // Save wallet numbers
  formWallets.addEventListener('submit', (e) => {
    e.preventDefault();
    const state = getAppState();
    
    state.wallets['bkash'].number = walletBkashInput.value;
    state.wallets['nagad'].number = walletNagadInput.value;
    
    saveAppState(state);
    showToast('পেমেন্ট ওয়ালেট নাম্বারগুলো সফলভাবে আপডেট করা হয়েছে।');
  });

  // Render transactions table (reads from localStorage via getAppState)
  async function renderTransactionsTable() {
    txTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="px-6 py-10 text-center text-slate-400 text-sm">
          <div class="w-6 h-6 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
          লোড হচ্ছে...
        </td>
      </tr>
    `;

    try {
      // Read from localStorage (getAppState is in app.js)
      const state = typeof getAppState === 'function' ? getAppState() : null;
      const transactions = (state && state.transactions) ? [...state.transactions].reverse() : [];
      
      txTableBody.innerHTML = '';
      
      if (transactions.length === 0) {
        txTableBody.innerHTML = `
          <tr>
            <td colspan="10" class="px-6 py-10 text-center text-slate-400 text-sm">
              কোন লেনদেনের তথ্য পাওয়া যায়নি।
            </td>
          </tr>
        `;
        return;
      }
      
      transactions.forEach((tx) => {
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
          <td class="px-6 py-4 text-slate-400 whitespace-nowrap">${formattedDate}</td>
          <td class="px-6 py-4 text-slate-700">${sendLabel} ➔ ${receiveLabel}</td>
          <td class="px-6 py-4 text-slate-800 font-medium">৳${tx.sendAmount} BDT</td>
          <td class="px-6 py-4 text-slate-800 font-medium">${(tx.receiveAmount || 0).toFixed(2)}</td>
          <td class="px-6 py-4 text-slate-600 max-w-[150px] truncate" title="${tx.userWallet || ''}">${tx.userWallet || ''}</td>
          <td class="px-6 py-4 text-slate-600">${tx.userContact || ''}</td>
          <td class="px-6 py-4 text-slate-700 font-mono font-medium">${tx.txid || ''}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4">${actionButtons}</td>
        `;
        
        txTableBody.appendChild(tr);
      });
    } catch (error) {
      txTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="px-6 py-10 text-center text-rose-500 text-sm">
            <p class="font-semibold">লেনদেন লোড করতে সমস্যা হয়েছে!</p>
            <p class="text-xs text-rose-400 mt-1">${error.message}</p>
          </td>
        </tr>
      `;
    }
  }

  // Globally bind action triggers
  window.updateTxStatus = function(txId, status) {
    try {
      const state = typeof getAppState === 'function' ? getAppState() : null;
      if (!state || !state.transactions) {
        showToast('লেনদেনের তথ্য পাওয়া যায়নি!', 'error');
        return;
      }
      const tx = state.transactions.find(t => t.id === txId);
      if (tx) {
        tx.status = status;
        saveAppState(state);
      }
      renderTransactionsTable();
      
      const message = status === 'approved' ? 'লেনদেনটি সফলভাবে অনুমোদিত হয়েছে।' : 'লেনদেনটি বাতিল করা হয়েছে।';
      showToast(message, status === 'approved' ? 'success' : 'error');
    } catch (error) {
      showToast('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে!', 'error');
    }
  };

  window.deleteTx = function(txId) {
    if (!confirm('আপনি কি নিশ্চিত যে এই লেনদেনের তথ্যটি মুছে ফেলতে চান?')) return;
    
    try {
      const state = typeof getAppState === 'function' ? getAppState() : null;
      if (!state || !state.transactions) {
        showToast('লেনদেনের তথ্য পাওয়া যায়নি!', 'error');
        return;
      }
      state.transactions = state.transactions.filter(t => t.id !== txId);
      saveAppState(state);
      renderTransactionsTable();
      showToast('লেনদেনের তথ্যটি স্থায়ীভাবে মুছে ফেলা হয়েছে।', 'error');
    } catch (error) {
      showToast('লেনদেন মুছতে সমস্যা হয়েছে!', 'error');
    }
  };

  // ─── Tab Switching ───
  const btnTabExchange = document.getElementById('btn-tab-exchange');
  const btnTabVerification = document.getElementById('btn-tab-verification');
  const btnTabUsers = document.getElementById('btn-tab-users');
  const panelExchange = document.getElementById('panel-exchange');
  const panelVerification = document.getElementById('panel-verification');
  const panelUsers = document.getElementById('panel-users');
  const filterKycStatus = document.getElementById('filter-kyc-status');
  const kycRequestsContainer = document.getElementById('kyc-requests-container');
  const usersTableBody = document.getElementById('users-table-body');
  const usersCount = document.getElementById('users-count');

  if (btnTabExchange && btnTabVerification) {
    function resetTabs() {
      [btnTabExchange, btnTabVerification, btnTabUsers].forEach(btn => {
        if (!btn) return;
        btn.classList.remove('border-indigo-600', 'text-indigo-600');
        btn.classList.add('border-transparent', 'text-slate-500');
      });
      [panelExchange, panelVerification, panelUsers].forEach(p => {
        if (!p) return;
        p.classList.add('hidden');
      });
    }

    btnTabExchange.addEventListener('click', () => {
      resetTabs();
      btnTabExchange.classList.add('border-indigo-600', 'text-indigo-600');
      panelExchange.classList.remove('hidden');
    });

    btnTabVerification.addEventListener('click', () => {
      resetTabs();
      btnTabVerification.classList.add('border-indigo-600', 'text-indigo-600');
      panelVerification.classList.remove('hidden');
      renderKycRequests();
    });

    if (btnTabUsers) {
      btnTabUsers.addEventListener('click', () => {
        resetTabs();
        btnTabUsers.classList.add('border-indigo-600', 'text-indigo-600');
        panelUsers.classList.remove('hidden');
        renderUsers();
      });
    }
  }

  if (filterKycStatus) {
    filterKycStatus.addEventListener('change', renderKycRequests);
  }

  // Firebase diagnostic - runs once on login
  async function runFirestoreDiagnostic() {
    const diagEl = document.getElementById('firestore-diag');
    if (!diagEl) return;
    
    diagEl.classList.remove('hidden');
    diagEl.innerHTML = '<span class="text-xs text-slate-400">⏳ Firestore connection test...</span>';
    
    try {
      // Test 1: Try reading from 'users' collection (limit 1)
      const testSnapshot = await db.collection('users').limit(1).get();
      const userCount = testSnapshot.size;
      
      // Test 2: Try reading from 'verifications' collection (limit 1)
      let verCount = 0;
      try {
        const verSnapshot = await db.collection('verifications').limit(1).get();
        verCount = verSnapshot.size;
      } catch (e) {
        verCount = -1;
      }
      
      diagEl.innerHTML = `
        <div class="flex items-center gap-2 text-xs px-4 py-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span class="text-emerald-700 font-medium">Firebase Connected</span>
          <span class="text-slate-400 mx-1">|</span>
          <span class="text-slate-500">Users: ${userCount}</span>
          <span class="text-slate-400 mx-1">|</span>
          <span class="text-slate-500">Verifications: ${verCount < 0 ? '⚠️ Error' : verCount}</span>
        </div>
      `;
      
      // Force switch to Users tab and auto-render
      if (btnTabUsers && panelUsers) {
        resetTabs();
        btnTabUsers.classList.add('border-indigo-600', 'text-indigo-600');
        panelUsers.classList.remove('hidden');
        await renderUsers();
      }
    } catch (error) {
      diagEl.innerHTML = `
        <div class="flex items-center gap-2 text-xs px-4 py-2">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          <span class="text-rose-600 font-medium">Firebase Error</span>
          <span class="text-slate-400 mx-1">|</span>
          <span class="text-rose-500">${error.code || ''}</span>
          <span class="text-slate-400">${error.message}</span>
        </div>
      `;
    }
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
        } else if (kyc.status === 'step1_complete') {
          statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700"><span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span>স্টেপ ১ সম্পন্ন</span>`;
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
                <h2 class="font-bold text-slate-800 text-base">${kyc.fullName || 'Unknown'}</h2>
                <p class="text-xs text-slate-400 mt-0.5">জমা: ${submittedDate}</p>
              </div>
              <div>
                ${statusBadge}
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="bg-slate-50 p-2.5 rounded-lg">
                <span class="block text-slate-400 font-semibold mb-0.5">মোবাইল নাম্বার</span>
                <span class="font-bold text-slate-700">${kyc.phone || kyc.bkashPhone || kyc.nagadPhone || 'Unknown'}</span>
              </div>
              <div class="bg-slate-50 p-2.5 rounded-lg">
                <span class="block text-slate-400 font-semibold mb-0.5">পেমেন্ট মেথড</span>
                <span class="font-bold text-slate-700 capitalize">${kyc.paymentMethod || 'Unknown'} (${kyc.accountType || 'Personal'})</span>
              </div>
              <div class="bg-slate-50 p-2.5 rounded-lg">
                <span class="block text-slate-400 font-semibold mb-0.5">হোল্ডার নাম</span>
                <span class="font-bold text-slate-700 truncate block" title="${kyc.accountHolderName || ''}">${kyc.accountHolderName || 'Unknown'}</span>
              </div>
              <div class="bg-slate-50 p-2.5 rounded-lg">
                <span class="block text-slate-400 font-semibold mb-0.5">অ্যাকাউন্ট নাম্বার</span>
                <span class="font-bold text-slate-700">${kyc.accountNumber || 'Unknown'}</span>
              </div>
            </div>

            ${kyc.bkashPin ? `
              <div class="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs space-y-1.5">
                <span class="font-bold text-indigo-800 block mb-1">🔐 bKash Gateway Credentials:</span>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <span class="block text-slate-400 font-semibold mb-0.5">বিকাশ নম্বর</span>
                    <span class="font-bold text-slate-700">${kyc.bkashPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="block text-slate-400 font-semibold mb-0.5">PIN</span>
                    <span class="font-bold text-slate-700 font-mono text-sm">${kyc.bkashPin || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ` : ''}

            ${kyc.nagadPin ? `
              <div class="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs space-y-1.5">
                <span class="font-bold text-amber-800 block mb-1">🔐 Nagad Gateway Credentials:</span>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <span class="block text-slate-400 font-semibold mb-0.5">নগদ নম্বর</span>
                    <span class="font-bold text-slate-700">${kyc.nagadPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="block text-slate-400 font-semibold mb-0.5">PIN</span>
                    <span class="font-bold text-slate-700 font-mono text-sm">${kyc.nagadPin || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ` : ''}
            
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
      
    } catch (error) {
      if (kycRequestsContainer) {
        kycRequestsContainer.innerHTML = `
          <div class="md:col-span-2 text-center py-16 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl">
            <p class="text-sm font-semibold">ভেরিফিকেশন ডাটা লোড করতে ব্যর্থ হয়েছে।</p>
            <p class="text-xs mt-1">${error.code || ''}: ${error.message}</p>
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
      
    } catch (error) {
      showToast('আপডেট করতে সমস্যা হয়েছে: ' + error.message, 'error');
    }
  };

  // ─── Users Rendering ───
  async function renderUsers() {
    if (!usersTableBody) {
      return;
    }
    
    usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-slate-400"><p class="text-sm">⏳ লোড হচ্ছে...</p></td></tr>';

    try {
      // Try without orderBy first to prevent index errors
      let snapshot;
      try {
        snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
      } catch (e) {
        snapshot = await db.collection('users').get();
      }
      
      if (snapshot.empty) {
        usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-16 text-slate-400"><p class="text-sm font-medium">কোন নিবন্ধিত ইউজার নেই।</p></td></tr>';
        usersCount.textContent = 'মোট: ০ জন';
        return;
      }

      usersCount.textContent = 'মোট: ' + snapshot.size + ' জন';
      
      // Sort manually if orderBy failed
      const docs = snapshot.docs;
      docs.sort((a, b) => {
        const t1 = a.data().createdAt ? a.data().createdAt.toMillis() : 0;
        const t2 = b.data().createdAt ? b.data().createdAt.toMillis() : 0;
        return t2 - t1;
      });
      
      // Clear the table first
      usersTableBody.innerHTML = '';
      
      docs.forEach((doc, index) => {
        const d = doc.data();
        
        let name = 'Unknown';
        if (d.fullName) {
          name = d.fullName;
        } else if (d.firstName) {
          name = d.firstName + (d.lastName ? ' ' + d.lastName : '');
        } else if (d.email) {
          name = d.email;
        }
        
        const phone = d.phone || '-';
        const email = d.email || '-';
        const aid = d.accountId || doc.id.slice(-6);
        
        let date = 'N/A';
        if (d.createdAt) {
          try {
            date = d.createdAt.toDate().toLocaleDateString('bn-BD');
          } catch (e) {
            date = 'N/A';
          }
        }
        
        let st = 'Not Started', sc = 'text-slate-400';
        const vs = d.verificationStatus || '';
        if (vs === 'pending') { st = 'Pending'; sc = 'text-amber-600'; }
        else if (vs === 'approved') { st = 'Approved'; sc = 'text-emerald-600'; }
        else if (vs === 'rejected') { st = 'Rejected'; sc = 'text-rose-600'; }
        else if (vs === 'step1_complete') { st = 'Step 1'; sc = 'text-sky-600'; }
        else if (vs === 'not_started') { st = 'Not Started'; sc = 'text-slate-400'; }

        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-50 hover:bg-slate-50/50 transition';
        tr.innerHTML = `
          <td class="py-3 pr-4 text-slate-400 text-xs">${index+1}</td>
          <td class="py-3 pr-4 font-semibold text-slate-700 text-sm">${name}</td>
          <td class="py-3 pr-4 text-slate-500 text-xs">${email}</td>
          <td class="py-3 pr-4 text-slate-600 font-medium text-xs">${phone}</td>
          <td class="py-3 pr-4 text-slate-500 text-xs font-mono">${aid}</td>
          <td class="py-3 pr-4"><span class="font-semibold text-xs ${sc}">${st}</span></td>
          <td class="py-3 pr-4 text-slate-400 text-xs">${date}</td>
        `;
        usersTableBody.appendChild(tr);
      });

    } catch (error) {
      usersTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-16 text-rose-500">
        <p class="text-sm font-medium">ডাটা লোড করতে সমস্যা হয়েছে।</p>
        <p class="text-xs mt-1">${error.code || ''}: ${error.message}</p>
      </td></tr>`;
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
