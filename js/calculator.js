/**
 * Home Page Exchange Calculator Logic
 * Dollar Exchange Bangladesh
 */

function initCalculator() {
  const sendMethodSelect = document.getElementById('send-method');
  const receiveMethodSelect = document.getElementById('receive-method');
  const sendAmountInput = document.getElementById('send-amount');
  const receiveAmountInput = document.getElementById('receive-amount');
  const rateDisplay = document.getElementById('rate-display');
  
  // Summary card elements
  const summarySendAmount = document.getElementById('summary-send-amount');
  const summarySendMethod = document.getElementById('summary-send-method');
  const summaryReceiveAmount = document.getElementById('summary-receive-amount');
  const summaryReceiveMethod = document.getElementById('summary-receive-method');
  
  const calculatorError = document.getElementById('calculator-error');
  const btnExchange = document.getElementById('btn-exchange');
  
  // Load current app state
  const state = getAppState();
  
  // Expose configuration variables
  const rates = state.rates;
  const settings = state.settings;

  // Initialize display notice if it exists
  const noticeBannerText = document.getElementById('notice-banner-text');
  if (noticeBannerText && settings.notice) {
    noticeBannerText.innerText = settings.notice;
  }

  const getLogoHtml = (methodId) => {
    switch (methodId) {
      case 'bkash':
        return `<span class="inline-flex shrink-0"><img src="img/1656234745bkash-app-logo-png.png" class="custom-select-logo w-5 h-5 object-contain rounded" onerror="this.style.display='none'"></span>`;
      case 'nagad':
        return `<span class="inline-flex shrink-0"><img src="img/1679248787Nagad-Logo.png" class="custom-select-logo w-5 h-5 object-contain rounded" onerror="this.style.display='none'"></span>`;
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

  // Custom selector creation helper
  function createCustomSelect(selectEl) {
    // Hide original select and sibling chevron container
    selectEl.style.display = 'none';
    const chevronSib = selectEl.nextElementSibling;
    if (chevronSib && chevronSib.classList.contains('absolute')) {
      chevronSib.style.display = 'none';
    }
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-container w-full';
    
    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger w-full h-12 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none text-sm flex items-center justify-between';
    
    const triggerContent = document.createElement('div');
    triggerContent.className = 'flex items-center gap-2.5';
    
    trigger.appendChild(triggerContent);
    
    // Chevron icon
    const chevron = document.createElement('span');
    chevron.className = 'text-slate-400 flex items-center';
    chevron.innerHTML = '<i data-lucide="chevron-down" class="w-4 h-4"></i>';
    trigger.appendChild(chevron);
    
    // Options menu
    const optionsMenu = document.createElement('div');
    optionsMenu.className = 'custom-select-options';
    
    // Populate options
    const selectOptions = Array.from(selectEl.options);
    selectOptions.forEach(opt => {
      const optEl = document.createElement('div');
      optEl.className = 'custom-select-option';
      optEl.dataset.value = opt.value;
      
      const logoHtml = getLogoHtml(opt.value);
      optEl.innerHTML = `${logoHtml}<span>${opt.text}</span>`;
      
      if (opt.value === selectEl.value) {
        optEl.classList.add('selected');
        triggerContent.innerHTML = `${logoHtml}<span class="trigger-text">${opt.text}</span>`;
      }
      
      optEl.addEventListener('click', (e) => {
        optionsMenu.querySelectorAll('.custom-select-option').forEach(item => item.classList.remove('selected'));
        optEl.classList.add('selected');
        
        triggerContent.innerHTML = `${logoHtml}<span class="trigger-text">${opt.text}</span>`;
        
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event('change'));
        
        wrapper.classList.remove('open');
        e.stopPropagation();
      });
      
      optionsMenu.appendChild(optEl);
    });
    
    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsMenu);
    
    // Insert custom select wrapper after the original select element
    selectEl.after(wrapper);
    
    // Toggle dropdown on trigger click
    trigger.addEventListener('click', (e) => {
      document.querySelectorAll('.custom-select-container').forEach(container => {
        if (container !== wrapper) container.classList.remove('open');
      });
      wrapper.classList.toggle('open');
      e.stopPropagation();
    });
    
    // Close dropdown on outside click
    document.addEventListener('click', () => {
      wrapper.classList.remove('open');
    });

    // Convert data-lucide chevrons inside custom elements
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: {
          class: 'lucide'
        },
        nameAttr: 'data-lucide'
      });
    }
  }

  // Create custom select elements
  createCustomSelect(sendMethodSelect);
  createCustomSelect(receiveMethodSelect);

  // Update exchange rate badge and calculate outputs
  function updateCalculator() {
    const sendMethod = sendMethodSelect.value;
    const receiveMethod = receiveMethodSelect.value;
    const sendAmount = parseFloat(sendAmountInput.value) || 0;
    
    // Get rate for selected receive method
    const currentRate = rates[receiveMethod] || 120;
    
    // Display current exchange rate
    const receiveUnitSymbol = ['wise', 'payoneer', 'quotex', 'paypal'].includes(receiveMethod) ? 'USD' : 'USDT';
    rateDisplay.innerHTML = `বর্তমান রেট: 1 ${receiveUnitSymbol} = ৳${currentRate.toFixed(2)}`;
    
    const receiveUnitLabel = document.getElementById('receive-unit-label');
    if (receiveUnitLabel) {
      receiveUnitLabel.innerText = receiveUnitSymbol;
    }
    
    // Calculate output amount (Send BDT / Rate = Receive USD)
    let calculatedReceive = 0;
    if (currentRate > 0) {
      calculatedReceive = sendAmount / currentRate;
    }
    
    // Keep 2 decimal digits for receive amount
    receiveAmountInput.value = calculatedReceive > 0 ? calculatedReceive.toFixed(2) : '';
    
    // Update summary card
    summarySendAmount.innerText = `৳${sendAmount.toLocaleString('en-US')}`;
    summarySendMethod.innerHTML = `<span class="flex items-center gap-1.5">${getLogoHtml(sendMethod)}<span>${CURRENCY_NAMES[sendMethod] || sendMethod}</span></span>`;
    
    summaryReceiveAmount.innerText = `${calculatedReceive > 0 ? calculatedReceive.toFixed(2) : '0.00'} ${receiveUnitSymbol}`;
    summaryReceiveMethod.innerHTML = `<span class="flex items-center gap-1.5">${getLogoHtml(receiveMethod)}<span>${CURRENCY_NAMES[receiveMethod] || receiveMethod}</span></span>`;

    // Validation checks
    let errorMessage = '';
    if (sendAmount > 0) {
      if (sendAmount < settings.min_amount_bdt) {
        errorMessage = `সর্বনিম্ন এক্সচেঞ্জ পরিমাণ ৳${settings.min_amount_bdt} BDT`;
      } else if (sendAmount > settings.max_amount_bdt) {
        errorMessage = `সর্বোচ্চ এক্সচেঞ্জ পরিমাণ ৳${settings.max_amount_bdt} BDT`;
      }
    }
    
    if (errorMessage) {
      calculatorError.innerText = errorMessage;
      calculatorError.classList.remove('hidden');
      btnExchange.disabled = true;
      btnExchange.classList.add('opacity-60', 'cursor-not-allowed');
    } else {
      calculatorError.innerText = '';
      calculatorError.classList.add('hidden');
      btnExchange.disabled = sendAmount <= 0;
      if (sendAmount <= 0) {
        btnExchange.classList.add('opacity-60', 'cursor-not-allowed');
      } else {
        btnExchange.classList.remove('opacity-60', 'cursor-not-allowed');
      }
    }
  }

  // Bind change and input events
  sendMethodSelect.addEventListener('change', updateCalculator);
  receiveMethodSelect.addEventListener('change', updateCalculator);
  sendAmountInput.addEventListener('input', updateCalculator);

  // Handle Exchange Form Submission
  btnExchange.addEventListener('click', (e) => {
    e.preventDefault();
    
    const sendAmount = parseFloat(sendAmountInput.value) || 0;
    const sendMethod = sendMethodSelect.value;
    const receiveMethod = receiveMethodSelect.value;
    const receiveAmount = parseFloat(receiveAmountInput.value) || 0;
    const rate = rates[receiveMethod] || 120;
    
    // Final check
    if (sendAmount < settings.min_amount_bdt || sendAmount > settings.max_amount_bdt) {
      return;
    }
    
    // Store transaction request parameters in sessionStorage for checkout page
    const checkoutParams = {
      sendMethod,
      sendAmount,
      receiveMethod,
      receiveAmount,
      rate
    };
    
    sessionStorage.setItem('current_exchange_request', JSON.stringify(checkoutParams));
    
    // Add dynamic animation state before redirection
    btnExchange.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      প্রসেস করা হচ্ছে...
    `;
    
    setTimeout(() => {
      window.location.href = 'payment.html';
    }, 600);
  });

  // Initial Calculation Run
  updateCalculator();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
