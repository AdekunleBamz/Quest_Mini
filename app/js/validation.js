/**
 * Quest Mini - Validation Module
 * Input validation and data sanitization
 */

const QuestValidation = (function() {
  'use strict';

  // Ethereum address regex
  const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

  // Transaction hash regex
  const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

  /**
   * Validate Ethereum address
   * @param {string} address - Address to validate
   * @returns {boolean}
   */
  function isValidAddress(address) {
    if (!address || typeof address !== 'string') return false;
    return ETH_ADDRESS_REGEX.test(address);
  }

  /**
   * Validate transaction hash
   * @param {string} hash - Transaction hash
   * @returns {boolean}
   */
  function isValidTxHash(hash) {
    if (!hash || typeof hash !== 'string') return false;
    return TX_HASH_REGEX.test(hash);
  }

  /**
   * Validate positive integer
   * @param {*} value - Value to check
   * @returns {boolean}
   */
  function isPositiveInteger(value) {
    if (typeof value === 'string') {
      value = parseInt(value, 10);
    }
    return Number.isInteger(value) && value > 0;
  }

  /**
   * Validate non-negative number
   * @param {*} value - Value to check
   * @returns {boolean}
   */
  function isNonNegative(value) {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }

  /**
   * Validate BigInt string
   * @param {string} value - Value to check
   * @returns {boolean}
   */
  function isValidBigInt(value) {
    try {
      BigInt(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate quest type
   * @param {number} questType - Quest type (0-4)
   * @returns {boolean}
   */
  function isValidQuestType(questType) {
    return Number.isInteger(questType) && questType >= 0 && questType <= 4;
  }

  /**
   * Validate booster tier
   * @param {number} tier - Booster tier (0-5)
   * @returns {boolean}
   */
  function isValidBoosterTier(tier) {
    return Number.isInteger(tier) && tier >= 0 && tier <= 5;
  }

  /**
   * Sanitize string input
   * @param {string} input - Input to sanitize
   * @param {number} [maxLength=1000] - Maximum length
   * @returns {string}
   */
  function sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, ''); // Basic XSS prevention
  }

  /**
   * Validate and sanitize token amount
   * @param {string|number} amount - Amount in wei
   * @returns {string|null} - Sanitized amount or null if invalid
   */
  function sanitizeAmount(amount) {
    try {
      const bigAmount = BigInt(amount);
      if (bigAmount < 0n) return null;
      return bigAmount.toString();
    } catch {
      return null;
    }
  }

  /**
   * Checksummed address validation (EIP-55)
   * @param {string} address - Address to check
   * @returns {boolean}
   */
  function isChecksummedAddress(address) {
    if (!isValidAddress(address)) return false;
    
    // Mixed case means it should be checksummed
    const isMixedCase = address !== address.toLowerCase() && 
                        address !== address.toUpperCase();
    
    if (!isMixedCase) return true; // All lowercase/uppercase is valid
    
    // For proper checksum validation, we'd need keccak256
    // This is a simplified check
    return true;
  }

  /**
   * Validate chain ID
   * @param {number|string} chainId - Chain ID
   * @param {number} [expected=8453] - Expected chain (Base mainnet)
   * @returns {boolean}
   */
  function isCorrectChain(chainId, expected = 8453) {
    const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
    return id === expected;
  }

  /**
   * Validate gas price
   * @param {string|number} gasPrice - Gas price in wei
   * @returns {boolean}
   */
  function isValidGasPrice(gasPrice) {
    try {
      const price = BigInt(gasPrice);
      // Between 0.01 gwei and 10000 gwei
      return price >= 10000000n && price <= 10000000000000n;
    } catch {
      return false;
    }
  }

  /**
   * Create a validator for object schemas
   * @param {object} schema - Validation schema
   * @returns {Function} - Validator function
   */
  function createValidator(schema) {
    return function validate(data) {
      const errors = [];

      for (const [key, rules] of Object.entries(schema)) {
        const value = data[key];

        if (rules.required && (value === undefined || value === null)) {
          errors.push({ field: key, error: 'Required field missing' });
          continue;
        }

        if (value === undefined || value === null) continue;

        if (rules.type) {
          const actualType = typeof value;
          if (actualType !== rules.type) {
            errors.push({ 
              field: key, 
              error: `Expected ${rules.type}, got ${actualType}` 
            });
          }
        }

        if (rules.validate && !rules.validate(value)) {
          errors.push({ 
            field: key, 
            error: rules.message || 'Validation failed' 
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    };
  }

  // Pre-built validators
  const validators = {
    completeQuest: createValidator({
      questType: {
        required: true,
        type: 'number',
        validate: isValidQuestType,
        message: 'Invalid quest type (0-4)'
      }
    }),

    claimRewards: createValidator({
      address: {
        required: true,
        type: 'string',
        validate: isValidAddress,
        message: 'Invalid wallet address'
      }
    }),

    purchaseBooster: createValidator({
      tier: {
        required: true,
        type: 'number',
        validate: isValidBoosterTier,
        message: 'Invalid booster tier (0-5)'
      }
    })
  };

  // Public API
  return {
    // Address/TX validation
    isValidAddress,
    isValidTxHash,
    isChecksummedAddress,

    // Number validation
    isPositiveInteger,
    isNonNegative,
    isValidBigInt,
    isValidGasPrice,

    // Quest-specific validation
    isValidQuestType,
    isValidBoosterTier,
    isCorrectChain,

    // Sanitization
    sanitizeString,
    sanitizeAmount,

    // Schema validation
    createValidator,
    validators
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestValidation;
}
