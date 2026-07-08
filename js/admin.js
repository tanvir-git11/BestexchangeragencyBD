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

  // Run Check
  checkLogin();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}
