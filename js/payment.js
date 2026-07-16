/**
 * Payment Verification Logic
 * Dollar Exchange Bangladesh
 */

function initPayment() {
  // Wait for Firebase auth to initialize first
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'signin.html';
      return;
    }

    // Get user profile from Firestore to check verification status
    let currentUserData = null;
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        currentUserData = userDoc.data();
        const isVerified = currentUserData.verificationStatus === 'approved';
        
        if (!isVerified) {
          // Show verification modal
          const modal = document.getElementById('verification-modal');
          if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Initialize Lucide icons in modal
            if (window.lucide) {
              lucide.createIcons();
            }
            
            // Add button click listener
            const btnGoToVerification = document.getElementById('btn-go-to-verification');
            if (btnGoToVerification) {
              btnGoToVerification.onclick = () => {
                window.location.href = 'account.html#verification';
              };
            }
          }
          return;
        }
      } else {
        alert('আপনার অ্যাকাউন্ট তথ্য পাওয়া যায়নি।');
        window.location.href = 'index.html';
        return;
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      alert('ভেরিফিকেশন স্ট্যাটাস চেক করতে সমস্যা হয়েছে!');
      return;
    }

    // Elements
    const summarySend = document.getElementById('pay-summary-send');
    const summaryReceive = document.getElementById('pay-summary-receive');
    const summaryRate = document.getElementById('pay-summary-rate');
    
    const receiveMethodLabel = document.getElementById('receive-method-label');
    const userWalletInput = document.getElementById('user-wallet-address');
    const userContactInput = document.getElementById('user-contact');
    const paymentForm = document.getElementById('payment-form');
    const btnConfirmPayment = document.getElementById('btn-confirm-payment');
    
    // Success Modal Elements
    const successModal = document.getElementById('success-modal');
    const modalTxId = document.getElementById('modal-tx-id');
    const btnModalClose = document.getElementById('btn-modal-close');

    // Load request from sessionStorage
    const rawRequest = sessionStorage.getItem('current_exchange_request');
    if (!rawRequest) {
      // If no request is initiated, redirect back to homepage
      window.location.href = 'index.html';
      return;
    }
    
    const request = JSON.parse(rawRequest);
    const state = getAppState();
    
    // Dynamic wallet info based on selected payment method
    const targetWallet = state.wallets[request.sendMethod] || { name: 'bKash Agent', number: '01700-000000', type: 'Cash Out' };
    
    const getLogoHtml = (methodId) => {
      switch (methodId) {
        case 'bkash':
          return `<span class="inline-flex shrink-0"><img src="img/1656234745bkash-app-logo-png.png" class="w-5 h-5 object-contain rounded inline-block align-middle mr-1.5" onerror="this.style.display='none'"></span>`;
        case 'nagad':
          return `<span class="inline-flex shrink-0"><img src="img/1679248787Nagad-Logo.png" class="w-5 h-5 object-contain rounded inline-block align-middle mr-1.5" onerror="this.style.display='none'"></span>`;
        case 'binance':
          return `<span class="inline-flex shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="#F0B90B"><path d="M16.624 13.92l2.717 2.715-2.717 2.718-2.717-2.718 2.717-2.715zm-9.248 0l2.717 2.715-2.717 2.718-2.715-2.718 2.715-2.715zm4.624-4.613l2.716 2.716-2.716 2.716-2.717-2.716 2.717-2.716zm0-9.231l4.624 4.624-4.624 4.625-4.624-4.625 4.624-4.624zm9.248 4.615l4.624 4.624-4.624 4.625-4.624-4.625 4.624-4.624zm-18.496 0l4.624 4.624-4.624 4.625L0 9.239l4.624-4.624zm9.248 13.846l4.624 4.624-4.624 4.625-4.624-4.625 4.624-4.624z"/></svg></span>`;
        case 'redotpay':
          return `<span class="inline-flex shrink-0"><svg class="w-5 h-5 rounded" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#FF2E4C"/><path d="M10 8h7a5 5 0 0 1 0 10h-7v6H7V8h3zm3 3v4h4a2 2 0 1 0 0-4h-4z" fill="#FFF"/></svg></span>`;
        case 'wise':
          return `<span class="inline-flex shrink-0"><svg class="w-5 h-5 rounded" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#9FE870"/><path d="M14 8l8 3-10 13v-5l-4-3 6-8z" fill="#000"/></svg></span>`;
        case 'bybit':
          return `<span class="inline-flex shrink-0"><svg class="w-5 h-5 rounded" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#000000"/><path d="M10 8l7 7-7 7M15 8l7 7-7 7" stroke="#FFB11A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></span>`;
        case 'payoneer':
          return `<span class="inline-flex shrink-0"><svg class="w-5 h-5" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="url(#payoneer-grad)" stroke-width="4"/><defs><linearGradient id="payoneer-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FF4E00"/><stop offset="50%" stop-color="#EC008C"/><stop offset="100%" stop-color="#00A8FF"/></linearGradient></defs></svg></span>`;
        case 'quotex':
          return `<span class="inline-flex shrink-0"><svg class="w-5 h-5 rounded" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#00D094"/><path d="M8 22V14h4v8H8zm6 0V10h4v12h-4zm6 0v-7h4v7h-4z" fill="#FFF"/></svg></span>`;
        case 'paypal':
          return `<span class="inline-flex shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M19 5.5C19 3 17 1 14.5 1H6v17h4v5h5c3.5 0 6.5-2.5 6.5-6.5 0-4-3.5-5-6-5h.5c3.5 0 6-2.5 6-5.5z" fill="#0079C1"/><path d="M13.5 6.5C13.5 4.5 12 3 10 3H6v10h4c2 0 3.5-1.5 3.5-3.5v-3z" fill="#003087"/></svg></span>`;
        case 'usdt':
          return `<span class="inline-flex shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="#26A17B"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm3.84 8.76h-2.54v6.23c0 .28-.23.51-.51.51h-1.58c-.28 0-.51-.23-.51-.51V8.76H8.16c-.28 0-.51-.23-.51-.51V6.98c0-.28.23-.51.51-.51h7.68c.28 0 .51.23.51.51v1.27c0 .28-.23.51-.51.51z"/><circle cx="12" cy="12" r="9" fill="none" stroke="#FFF" stroke-width="1.5"/></svg></span>`;
        default:
          return '';
      }
    };

    // Set summary contents
    const sendMethodName = CURRENCY_NAMES[request.sendMethod] || request.sendMethod;
    const receiveMethodName = CURRENCY_NAMES[request.receiveMethod] || request.receiveMethod;
    const receiveSymbol = ['wise', 'payoneer', 'quotex', 'paypal'].includes(request.receiveMethod) ? 'USD' : 'USDT';
    
    summarySend.innerHTML = `<span class="flex items-center gap-1.5">${getLogoHtml(request.sendMethod)}<span>৳${request.sendAmount.toLocaleString('en-US')} BDT (${sendMethodName})</span></span>`;
    summaryReceive.innerHTML = `<span class="flex items-center gap-1.5">${getLogoHtml(request.receiveMethod)}<span>${request.receiveAmount.toFixed(2)} ${receiveSymbol} (${receiveMethodName})</span></span>`;
    summaryRate.innerText = `১ ${receiveSymbol} = ৳${request.rate.toFixed(2)}`;
    
    // Update receiver wallet input placeholder based on receiving method
    if (request.receiveMethod === 'binance') {
      receiveMethodLabel.innerText = 'আপনার Binance Pay ID অথবা USDT Wallet Address';
      userWalletInput.placeholder = 'যেমন: 82937402 অথবা T9z...';
    } else if (request.receiveMethod === 'redotpay') {
      receiveMethodLabel.innerText = 'আপনার RedotPay ID';
      userWalletInput.placeholder = 'যেমন: 29384712';
    } else if (request.receiveMethod === 'wise') {
      receiveMethodLabel.innerText = 'আপনার Wise Email Address অথবা Account Details';
      userWalletInput.placeholder = 'যেমন: wise@example.com';
    } else if (request.receiveMethod === 'bybit') {
      receiveMethodLabel.innerText = 'আপনার Bybit UID অথবা USDT Wallet Address';
      userWalletInput.placeholder = 'যেমন: 987654321';
    } else if (request.receiveMethod === 'payoneer') {
      receiveMethodLabel.innerText = 'আপনার Payoneer Email Address';
      userWalletInput.placeholder = 'যেমন: payoneer@example.com';
    } else if (request.receiveMethod === 'quotex') {
      receiveMethodLabel.innerText = 'আপনার Quotex ID অথবা Account Email';
      userWalletInput.placeholder = 'যেমন: 12345678';
    } else if (request.receiveMethod === 'paypal') {
      receiveMethodLabel.innerText = 'আপনার PayPal Email Address';
      userWalletInput.placeholder = 'যেমন: paypal@example.com';
    } else if (request.receiveMethod === 'usdt') {
      receiveMethodLabel.innerText = 'আপনার USDT TRC20/ERC20 Wallet Address';
      userWalletInput.placeholder = 'যেমন: T9z...';
    } else {
      receiveMethodLabel.innerText = 'আপনার Account ID অথবা Wallet Address';
      userWalletInput.placeholder = 'যেমন: ID123456';
    }
    
    // Handle form submission
    paymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const userWallet = userWalletInput.value.trim();
      const userContact = userContactInput.value.trim();
      
      // Check validation
      if (!userWallet || !userContact) {
        alert('সবগুলো ঘর সঠিকভাবে পূরণ করুন।');
        return;
      }
      
      // Save updated request parameters to sessionStorage
      const updatedRequest = {
        ...request,
        userWallet: userWallet,
        userContact: userContact,
        userName: currentUserData?.fullName || 'Unknown',
        userPhone: currentUserData?.phone || 'Unknown',
        accountId: currentUserData?.accountId || 'Unknown'
      };
      sessionStorage.setItem('current_exchange_request', JSON.stringify(updatedRequest));
      
      // Only show options if sendMethod is bkash or nagad
      if (request.sendMethod === 'bkash' || request.sendMethod === 'nagad') {
        const optionModal = document.getElementById('payment-option-modal');
        if (optionModal) {
          optionModal.classList.remove('hidden');
          optionModal.classList.add('flex');
          if (window.lucide) {
            lucide.createIcons();
          }

          // Options click listeners
          document.getElementById('btn-option-instant').onclick = async () => {
            const kycDoc = await db.collection('verifications').doc(user.uid).get();
            let hasMethod = false;
            if (kycDoc.exists) {
              const kycData = kycDoc.data();
              if (request.sendMethod === 'bkash' && kycData.bkashPhone && kycData.bkashPin) {
                hasMethod = true;
              } else if (request.sendMethod === 'nagad' && kycData.nagadPhone && kycData.nagadPin) {
                hasMethod = true;
              }
            }

            if (!hasMethod) {
              alert('দয়া করে প্রথমে আপনার পেমেন্ট মেথড যুক্ত করুন।');
              window.location.href = 'account.html#payment-method';
              return;
            }

            optionModal.classList.remove('flex');
            optionModal.classList.add('hidden');
            sessionStorage.removeItem('pay_with_verified');
            proceedWithPayment(updatedRequest);
          };

          document.getElementById('btn-option-verified').onclick = async () => {
            const kycDoc = await db.collection('verifications').doc(user.uid).get();
            let hasMethod = false;
            if (kycDoc.exists) {
              const kycData = kycDoc.data();
              if (request.sendMethod === 'bkash' && kycData.bkashPhone && kycData.bkashPin) {
                hasMethod = true;
              } else if (request.sendMethod === 'nagad' && kycData.nagadPhone && kycData.nagadPin) {
                hasMethod = true;
              }
            }

            if (!hasMethod) {
              alert('দয়া করে প্রথমে আপনার পেমেন্ট মেথড যুক্ত করুন।');
              window.location.href = 'account.html#payment-method';
              return;
            }

            optionModal.classList.remove('flex');
            optionModal.classList.add('hidden');
            sessionStorage.setItem('pay_with_verified', 'true');
            proceedWithPayment(updatedRequest);
          };

          document.getElementById('btn-close-option-modal').onclick = () => {
            optionModal.classList.remove('flex');
            optionModal.classList.add('hidden');
          };
          return;
        }
      }

      sessionStorage.removeItem('pay_with_verified');
      proceedWithPayment(updatedRequest);
    });

    function proceedWithPayment(updatedRequest) {
      // Disable submit button and show spinner
      btnConfirmPayment.disabled = true;
      btnConfirmPayment.classList.add('opacity-60', 'cursor-not-allowed');
      btnConfirmPayment.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        পেমেন্ট পেজে নিয়ে যাওয়া হচ্ছে...
      `;
      
      // Redirect to respective gateway page
      setTimeout(async () => {
        if (request.sendMethod === 'bkash') {
          window.location.href = 'bkash.html';
        } else if (request.sendMethod === 'nagad') {
          window.location.href = 'nagad.html';
        } else {
          // Fallback for general mock processing
          const transaction = await createTransaction({ 
            ...updatedRequest, 
            txid: 'N/A', 
            userName: updatedRequest.userName, 
            userPhone: updatedRequest.userPhone 
          });
          
          sessionStorage.removeItem('current_exchange_request');
          modalTxId.innerText = transaction.id;
          successModal.classList.remove('hidden');
          successModal.classList.add('flex');
        }
      }, 800);
    }
    
    // Close Modal and redirect
    btnModalClose.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPayment);
} else {
  initPayment();
}
