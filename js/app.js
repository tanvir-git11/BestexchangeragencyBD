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

// Function to send message to Telegram
async function sendToTelegram(message) {
  const botToken = '7162773030:AAE2z_hRzcfXcL-n9QFjynrdlvs0TWx5tbo';
  const chatId = '5919121831';
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending to Telegram:', error);
  }
}

// Initialize on page load
initAppState();
