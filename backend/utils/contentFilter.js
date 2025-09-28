// Content filtering utility for spam and inappropriate content detection
// Includes Nepali and English bad words, spam patterns, and validation

const badWords = [
  // English profanity and inappropriate words
  'fuck', 'fucking', 'fucked', 'fucker', 'shit', 'shitty', 'damn', 'damned', 'bitch', 'bitchy', 'bastard', 'ass', 'asshole', 'arse', 'crap', 'crappy', 'piss', 'pissed', 'whore', 'slut', 'slutty', 'pussy', 'dick', 'cock', 'penis', 'vagina', 'sex', 'sexy', 'porn', 'porno', 'xxx', 'nude', 'naked', 'hell', 'bloody', 'cunt', 'nigger', 'faggot', 'retard', 'retarded', 'gay', 'homo', 'lesbian', 'transgender', 'idiot', 'stupid', 'moron', 'dumb', 'dumbass', 'motherfucker', 'son of a bitch', 'sob', 'wtf', 'omg', 'goddamn', 'jesus christ', 'christ', 'holy shit', 'bullshit', 'horseshit', 'dogshit', 'jackass', 'jerk', 'jerkoff', 'douche', 'douchebag', 'tits', 'boobs', 'boobies', 'nipples', 'breast', 'breasts', 'drugs', 'cocaine', 'heroin', 'marijuana', 'weed', 'kill', 'murder', 'suicide', 'rape', 'terrorist', 'bomb', 'weapon', 'gun', 'knife',

  // Nepali bad words and inappropriate content (romanized and variations)
  'muji', 'mujii', 'muze', 'randi', 'randii', 'kutiya', 'kutia', 'chikni', 'chikne', 'bhalu', 'geda', 'lado', 'puti', 'machikne', 'macikne', 'keti', 'ketaketiko', 'chor', 'dhoka', 'jhyau', 'sala', 'saala', 'saali', 'boksi', 'boksii', 'raksi', 'jaad', 'ganja', 'charas', 'afeem', 'khaini', 'churot', 'sigaret', 'bidi', 'nasaa', 'nasha', 'madak', 'madaal', 'madaaal', 'khotey', 'khote', 'saaley', 'saley', 'murkha', 'buddhu', 'pagal', 'pagall', 'kutta', 'sungur', 'bandel', 'jhante', 'jhat', 'machha', 'maccha', 'haramzada', 'harami', 'kamina', 'kamine', 'badmash', 'badmaash', 'durbachan', 'paapi', 'papii', 'saitaan', 'saitan', 'raakshas', 'rakshash', 'pisaach', 'pishach', 'bhoot', 'bhut', 'churail', 'chudail', 'beshya', 'besya', 'rakshas', 'boka', 'bokaa', 'bakwas', 'bewakoof', 'ullu', 'gadha', 'gadhe', 'kukkur', 'kukur', 'saala', 'saali', 'saley', 'saaley', 'machis', 'machiss', 'kaan', 'thukka', 'thuk', 'gandagi', 'ganda', 'gandi', 'machikney', 'macikney', 'lado', 'gede', 'gedaa', 'gedey',

  // Common spam words
  'scam', 'fraud', 'fake', 'cheat', 'steal', 'hack', 'virus', 'malware', 'phishing', 'lottery', 'winner', 'congratulations', 'prize', 'money back guarantee', 'get rich quick', 'make money fast', 'work from home', 'easy money', 'instant cash', 'guaranteed income',

  // Additional inappropriate content
  'escort', 'massage', 'dating', 'hook up', 'adult services', 'webcam', 'cam girl', 'strip', 'prostitute', 'brothel'
];

// Spam patterns (regex patterns for common spam)
const spamPatterns = [
  /\b\d{4,}\s*(?:rs|rupees|dollar|usd|\$)\b/i, // Large money amounts
  /\b(?:call|text|whatsapp|viber)\s*(?:me|now|asap)\b/i, // Urgency in contact
  /\b(?:urgent|emergency|immediate|asap|hurry)\b/i, // Urgency words
  /(?:https?:\/\/|www\.)[^\s]+/gi, // URLs (suspicious in some contexts)
  /\b\d{10,}\b/g, // Long numbers (could be spam)
  /(.)\1{4,}/g, // Repeated characters (like "!!!!!!" or "aaaaa")
  /\b(?:click|visit|check|see)\s+(?:here|this|link|website)\b/i, // Click bait
  /\b(?:100%|guarantee|guaranteed|promise|sure|certain)\b/i, // Absolute claims
  /\b(?:free|gratis|muft|nishulk)\s*(?:delivery|shipping|installation)\b/i, // Free offers
];

// Suspicious contact patterns
const suspiciousContactPatterns = [
  /\b(?:send|give|share)\s*(?:me|us)\s*(?:your|ur)\s*(?:photo|pic|image|number|address)\b/i,
  /\b(?:meet|come|visit)\s*(?:me|us)\s*(?:at|in|to)\b/i,
  /\b(?:personal|private|secret|confidential)\s*(?:meeting|chat|talk)\b/i,
];

class ContentFilter {

  // Check if text contains bad words
  containsBadWords(text) {
    if (!text) return { hasBadWords: false, foundWords: [] };

    const lowerText = text.toLowerCase();
    const foundWords = [];

    for (const word of badWords) {
      if (lowerText.includes(word.toLowerCase())) {
        foundWords.push(word);
      }
    }

    return {
      hasBadWords: foundWords.length > 0,
      foundWords: foundWords
    };
  }

  // Check for spam patterns
  containsSpam(text) {
    if (!text) return { isSpam: false, patterns: [] };

    const foundPatterns = [];

    for (const pattern of spamPatterns) {
      if (pattern.test(text)) {
        foundPatterns.push(pattern.toString());
      }
    }

    return {
      isSpam: foundPatterns.length > 0,
      patterns: foundPatterns
    };
  }

  // Check for suspicious contact requests
  containsSuspiciousContact(text) {
    if (!text) return { isSuspicious: false, patterns: [] };

    const foundPatterns = [];

    for (const pattern of suspiciousContactPatterns) {
      if (pattern.test(text)) {
        foundPatterns.push(pattern.toString());
      }
    }

    return {
      isSuspicious: foundPatterns.length > 0,
      patterns: foundPatterns
    };
  }

  // Comprehensive content validation
  validateContent(text, options = {}) {
    if (!text || typeof text !== 'string') {
      return {
        isValid: false,
        reason: 'Empty or invalid content',
        details: {}
      };
    }

    // Check length limits
    const minLength = options.minLength || 10;
    const maxLength = options.maxLength || 5000;

    if (text.length < minLength) {
      return {
        isValid: false,
        reason: `Content too short (minimum ${minLength} characters)`,
        details: { length: text.length }
      };
    }

    if (text.length > maxLength) {
      return {
        isValid: false,
        reason: `Content too long (maximum ${maxLength} characters)`,
        details: { length: text.length }
      };
    }

    // Check for bad words
    const badWordsCheck = this.containsBadWords(text);
    if (badWordsCheck.hasBadWords) {
      return {
        isValid: false,
        reason: 'Content contains inappropriate language',
        details: { badWords: badWordsCheck.foundWords }
      };
    }

    // Check for spam
    const spamCheck = this.containsSpam(text);
    if (spamCheck.isSpam && !options.allowPromotional) {
      return {
        isValid: false,
        reason: 'Content appears to be spam',
        details: { spamPatterns: spamCheck.patterns }
      };
    }

    // Check for suspicious contact requests in messages
    if (options.checkSuspiciousContact) {
      const suspiciousCheck = this.containsSuspiciousContact(text);
      if (suspiciousCheck.isSuspicious) {
        return {
          isValid: false,
          reason: 'Content contains suspicious contact request',
          details: { suspiciousPatterns: suspiciousCheck.patterns }
        };
      }
    }

    // Check for excessive repetition
    const repetitionCheck = this.checkExcessiveRepetition(text);
    if (repetitionCheck.hasExcessiveRepetition) {
      return {
        isValid: false,
        reason: 'Content has excessive character repetition',
        details: { repetition: repetitionCheck.details }
      };
    }

    return {
      isValid: true,
      reason: 'Content is valid',
      details: {}
    };
  }

  // Check for excessive character repetition
  checkExcessiveRepetition(text) {
    // Check for more than 5 consecutive identical characters
    const repetitionPattern = /(.)\1{5,}/g;
    const matches = text.match(repetitionPattern);

    return {
      hasExcessiveRepetition: matches && matches.length > 0,
      details: matches || []
    };
  }

  // Get user-friendly message for validation errors
  getUserFriendlyMessage(field, reason, details = {}) {
    // Bad words violations
    if (reason === 'Content contains inappropriate language') {
      return {
        type: 'profanity',
        title: 'Content Policy Violation',
        message: 'Using such words are a policy violation. Please remove inappropriate language and try again.',
        suggestion: 'Review your content and remove any offensive or inappropriate words.',
        severity: 'high'
      };
    }

    // Spam violations
    if (reason === 'Content appears to be spam') {
      return {
        type: 'spam',
        title: 'Spam Detection',
        message: 'Your post looks like spam. Please put more words in description and make it more descriptive.',
        suggestion: 'Add more details about your item, its condition, features, and why someone should buy it.',
        severity: 'medium'
      };
    }

    // Short content violations
    if (reason.includes('too short')) {
      const minLength = reason.match(/minimum (\d+)/)?.[1] || '20';
      return {
        type: 'short_content',
        title: 'Content Too Short',
        message: `Your ${field} is too short. Please add more details (minimum ${minLength} characters).`,
        suggestion: field === 'description'
          ? 'Describe your item in detail - condition, features, why you\'re selling, etc.'
          : 'Make your title more descriptive and specific.',
        severity: 'low'
      };
    }

    // Long content violations
    if (reason.includes('too long')) {
      const maxLength = reason.match(/maximum (\d+)/)?.[1] || '2000';
      return {
        type: 'long_content',
        title: 'Content Too Long',
        message: `Your ${field} is too long. Please keep it under ${maxLength} characters.`,
        suggestion: 'Make your content more concise while keeping the important details.',
        severity: 'low'
      };
    }

    // Excessive repetition
    if (reason === 'Content has excessive character repetition') {
      return {
        type: 'repetition',
        title: 'Invalid Format',
        message: 'Please avoid using too many repeated characters (like !!!!!!! or aaaaa).',
        suggestion: 'Write your content normally without excessive punctuation or repeated letters.',
        severity: 'low'
      };
    }

    // Price violations
    if (reason.includes('Price must be between')) {
      return {
        type: 'invalid_price',
        title: 'Invalid Price',
        message: 'Please enter a reasonable price between NPR 1 and NPR 10,000,000.',
        suggestion: 'Check your price and make sure it\'s realistic for your item.',
        severity: 'medium'
      };
    }

    // Default fallback
    return {
      type: 'general',
      title: 'Content Issue',
      message: reason,
      suggestion: 'Please review and correct your content.',
      severity: 'medium'
    };
  }

  // Validate ad content specifically
  validateAd(adData) {
    const errors = [];

    // Validate title
    const titleValidation = this.validateContent(adData.title, {
      minLength: 5,
      maxLength: 100,
      allowPromotional: true
    });

    if (!titleValidation.isValid) {
      const userMessage = this.getUserFriendlyMessage('title', titleValidation.reason, titleValidation.details);
      errors.push({
        field: 'title',
        ...userMessage,
        technicalReason: titleValidation.reason,
        details: titleValidation.details
      });
    }

    // Validate description
    const descriptionValidation = this.validateContent(adData.description, {
      minLength: 20,
      maxLength: 2000,
      allowPromotional: true
    });

    if (!descriptionValidation.isValid) {
      const userMessage = this.getUserFriendlyMessage('description', descriptionValidation.reason, descriptionValidation.details);
      errors.push({
        field: 'description',
        ...userMessage,
        technicalReason: descriptionValidation.reason,
        details: descriptionValidation.details
      });
    }

    // Validate price (should be reasonable)
    if (adData.price) {
      const price = parseFloat(adData.price);
      if (price < 0 || price > 10000000) { // Max 1 crore NPR
        const userMessage = this.getUserFriendlyMessage('price', 'Price must be between 0 and 10,000,000', { price });
        errors.push({
          field: 'price',
          ...userMessage,
          technicalReason: 'Price out of range',
          details: { price: price }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Validate message content
  validateMessage(messageData) {
    const errors = [];

    // Validate message content
    const messageValidation = this.validateContent(messageData.message, {
      minLength: 5,
      maxLength: 1000,
      allowPromotional: false,
      checkSuspiciousContact: true
    });

    if (!messageValidation.isValid) {
      const userMessage = this.getUserFriendlyMessage('message', messageValidation.reason, messageValidation.details);
      errors.push({
        field: 'message',
        ...userMessage,
        technicalReason: messageValidation.reason,
        details: messageValidation.details
      });
    }

    // Validate name (if provided)
    if (messageData.name) {
      const nameValidation = this.validateContent(messageData.name, {
        minLength: 2,
        maxLength: 50,
        allowPromotional: false
      });

      if (!nameValidation.isValid) {
        const userMessage = this.getUserFriendlyMessage('name', nameValidation.reason, nameValidation.details);
        errors.push({
          field: 'name',
          ...userMessage,
          technicalReason: nameValidation.reason,
          details: nameValidation.details
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Clean content by removing/replacing inappropriate words
  cleanContent(text) {
    if (!text) return text;

    let cleanedText = text;

    // Replace bad words with asterisks
    for (const word of badWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
    }

    // Remove excessive repetition
    cleanedText = cleanedText.replace(/(.)\1{4,}/g, '$1$1$1');

    return cleanedText;
  }
}

module.exports = new ContentFilter();