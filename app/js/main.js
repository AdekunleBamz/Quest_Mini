/**
 * Quest Mini - Main Entry Point
 * Application initialization and bootstrap
 */

(function() {
  'use strict';

  // Application namespace
  window.QuestMini = window.QuestMini || {};

  // Application config
  const config = {
    chainId: 8453,
    chainName: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    contracts: {
      token: '0xb3E3DE7248E69B1842C274fD1304d4419a734de7',
      hub: '0x957b578Ac7469BDD5f0c4097C8B98200553b12ba',
      vault: '0x449436Ed23595Fc95bf19181cca63cE83f0b5EC0',
      booster: '0xC13Ad15ac6c27477B8b56e242910A5b4cC7792Be'
    },
    refreshInterval: 30000, // 30 seconds
    debug: false
  };

  // Application state
  let initialized = false;
  let refreshTimer = null;

  /**
   * Initialize the application
   */
  async function init() {
    if (initialized) {
      console.warn('Quest Mini already initialized');
      return;
    }

    console.log('🎮 Quest Mini initializing...');

    try {
      // Register event listeners
      registerEventListeners();

      // Check for saved wallet connection
      await checkSavedConnection();

      // Initialize UI components
      initializeUI();

      // Start data refresh
      startRefreshTimer();

      initialized = true;
      console.log('✅ Quest Mini initialized');

      // Dispatch ready event
      if (typeof QuestEvents !== 'undefined') {
        QuestEvents.emit('app:ready', { timestamp: Date.now() });
      }
    } catch (error) {
      console.error('❌ Quest Mini initialization failed:', error);
      showError('Failed to initialize application');
    }
  }

  /**
   * Register global event listeners
   */
  function registerEventListeners() {
    // Wallet events from ethereum provider
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    // Button click handlers
    document.addEventListener('click', handleButtonClick);

    // Visibility change for refresh pause
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Handle button clicks via delegation
   */
  function handleButtonClick(event) {
    const button = event.target.closest('button, [data-action]');
    if (!button) return;

    const action = button.dataset.action;
    if (!action) return;

    switch (action) {
      case 'connect':
        connectWallet();
        break;
      case 'disconnect':
        disconnectWallet();
        break;
      case 'quest':
        const questType = parseInt(button.dataset.questType, 10);
        completeQuest(questType);
        break;
      case 'claim':
        claimRewards();
        break;
      case 'booster':
        const tier = parseInt(button.dataset.tier, 10);
        purchaseBooster(tier);
        break;
      case 'refresh':
        refreshData();
        break;
    }
  }

  /**
   * Handle accounts changed
   */
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      refreshData();
    }
  }

  /**
   * Handle chain changed
   */
  function handleChainChanged(chainId) {
    const id = parseInt(chainId, 16);
    if (id !== config.chainId) {
      showWarning(`Please switch to ${config.chainName}`);
    }
    window.location.reload();
  }

  /**
   * Handle wallet disconnect
   */
  function handleDisconnect() {
    disconnectWallet();
  }

  /**
   * Handle visibility change
   */
  function handleVisibilityChange() {
    if (document.hidden) {
      stopRefreshTimer();
    } else {
      startRefreshTimer();
      refreshData();
    }
  }

  /**
   * Check for saved wallet connection
   */
  async function checkSavedConnection() {
    if (typeof QuestStorage !== 'undefined') {
      const lastAddress = QuestStorage.wallet.getLastConnected();
      if (lastAddress && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          if (accounts.length > 0) {
            await onWalletConnected(accounts[0]);
          }
        } catch (error) {
          console.log('No previous connection');
        }
      }
    }
  }

  /**
   * Initialize UI components
   */
  function initializeUI() {
    // Update initial state
    updateWalletButton();
    
    // Hide loading overlay if exists
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('hidden');
    }
  }

  /**
   * Start data refresh timer
   */
  function startRefreshTimer() {
    if (refreshTimer) return;
    refreshTimer = setInterval(refreshData, config.refreshInterval);
  }

  /**
   * Stop data refresh timer
   */
  function stopRefreshTimer() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  /**
   * Refresh all data
   */
  async function refreshData() {
    // Implementation depends on app.js or contracts.js
    if (typeof window.refreshAllData === 'function') {
      await window.refreshAllData();
    }
  }

  /**
   * Connect wallet
   */
  async function connectWallet() {
    // Implementation depends on app.js
    if (typeof window.connectWallet === 'function') {
      await window.connectWallet();
    }
  }

  /**
   * Disconnect wallet
   */
  function disconnectWallet() {
    if (typeof window.disconnectWallet === 'function') {
      window.disconnectWallet();
    }
    updateWalletButton();
  }

  /**
   * Wallet connected callback
   */
  async function onWalletConnected(address) {
    if (typeof QuestStorage !== 'undefined') {
      QuestStorage.wallet.setLastConnected(address);
    }
    if (typeof QuestState !== 'undefined') {
      const chainId = parseInt(await window.ethereum.request({ 
        method: 'eth_chainId' 
      }), 16);
      QuestState.wallet.connect(address, chainId);
    }
    await refreshData();
    updateWalletButton();
  }

  /**
   * Complete quest
   */
  async function completeQuest(questType) {
    if (typeof window.completeQuest === 'function') {
      await window.completeQuest(questType);
    }
  }

  /**
   * Claim rewards
   */
  async function claimRewards() {
    if (typeof window.claimRewards === 'function') {
      await window.claimRewards();
    }
  }

  /**
   * Purchase booster
   */
  async function purchaseBooster(tier) {
    if (typeof window.purchaseBooster === 'function') {
      await window.purchaseBooster(tier);
    }
  }

  /**
   * Update wallet button state
   */
  function updateWalletButton() {
    const btn = document.getElementById('wallet-btn');
    if (!btn) return;
    
    if (typeof QuestState !== 'undefined' && QuestState.get('wallet.connected')) {
      const address = QuestState.get('wallet.address');
      const short = typeof QuestFormat !== 'undefined' 
        ? QuestFormat.shortenAddress(address)
        : `${address.slice(0, 6)}...${address.slice(-4)}`;
      btn.textContent = short;
      btn.dataset.action = 'disconnect';
    } else {
      btn.textContent = 'Connect Wallet';
      btn.dataset.action = 'connect';
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    if (typeof QuestToast !== 'undefined') {
      QuestToast.error(message);
    } else {
      console.error(message);
    }
  }

  /**
   * Show warning message
   */
  function showWarning(message) {
    if (typeof QuestToast !== 'undefined') {
      QuestToast.warning(message);
    } else {
      console.warn(message);
    }
  }

  // Expose to window
  window.QuestMini = {
    init,
    config,
    refreshData,
    connectWallet,
    disconnectWallet
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
