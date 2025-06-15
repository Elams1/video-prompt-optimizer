import { AnalysisBlock, PromptAnalysis } from '../types/scene';

export class PromptAnalyzer {
  private static readonly TOPIC_KEYWORDS = {
    educational: ['learn', 'explain', 'understand', 'concept', 'theory', 'principle', 'definition'],
    visual: ['visualize', 'illustrate', 'display', 'show', 'demonstrate', 'present', 'reveal'],
    motion: ['move', 'transition', 'flow', 'slide', 'zoom', 'pan', 'rotate', 'animate'],
    engagement: ['interactive', 'engaging', 'compelling', 'captivating', 'dynamic', 'vibrant']
  };

  private static readonly MOTION_VERBS = [
    'moves', 'flows', 'transitions', 'slides', 'zooms', 'pans', 'rotates', 'animates',
    'shifts', 'transforms', 'morphs', 'evolves', 'emerges', 'unfolds', 'reveals'
  ];

  private static calculateSentiment(text: string): number {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'best', 'beautiful', 'clear', 'easy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'wrong', 'difficult', 'hard', 'confusing', 'unclear'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return score;
  }

  private static calculateFleschKincaid(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const syllables = text.split(/\s+/).reduce((count, word) => {
      return count + Math.max(1, word.replace(/[^aeiouAEIOU]/g, '').length);
    }, 0);

    if (sentences === 0 || words === 0) return 0;
    
    return 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  }

  private static detectProperNouns(text: string): string[] {
    const words = text.split(/\s+/);
    const properNouns = words.filter(word => 
      word.length > 2 && 
      word[0] === word[0].toUpperCase() && 
      word.slice(1) === word.slice(1).toLowerCase() &&
      !['The', 'A', 'An', 'This', 'That'].includes(word)
    );
    return properNouns;
  }

  private static scoreTopicRelevance(text: string): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    Object.values(this.TOPIC_KEYWORDS).forEach(keywords => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) score += 10;
      });
    });
    
    return Math.min(100, score);
  }

  private static analyzeImage(prompt: string): AnalysisBlock {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 50; // Base score

    // Length check
    if (prompt.length < 50) {
      issues.push('Image prompt too short');
      suggestions.push('Add more visual descriptors and details');
      score -= 20;
    } else if (prompt.length > 200) {
      score += 10;
    }

    // Visual keywords
    const visualKeywords = ['color', 'style', 'lighting', 'composition', 'detailed', 'realistic', 'artistic'];
    const hasVisualKeywords = visualKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    
    if (!hasVisualKeywords) {
      issues.push('Missing visual style descriptors');
      suggestions.push('Specify art style, colors, or lighting');
      score -= 15;
    } else {
      score += 15;
    }

    // Topic relevance
    const topicScore = this.scoreTopicRelevance(prompt);
    score += topicScore * 0.2;

    // Proper nouns (might need pronunciation)
    const properNouns = this.detectProperNouns(prompt);
    if (properNouns.length > 3) {
      issues.push('Many proper nouns may need pronunciation guide');
      suggestions.push('Consider simplifying technical terms');
      score -= 10;
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      issues,
      suggestions
    };
  }

  private static analyzeVideo(prompt: string): AnalysisBlock {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 50; // Base score

    // Motion verbs check
    const hasMotion = this.MOTION_VERBS.some(verb => 
      prompt.toLowerCase().includes(verb)
    );
    
    if (!hasMotion) {
      issues.push('No motion described');
      suggestions.push('Add motion verbs like "flows", "transitions", "zooms"');
      score -= 25;
    } else {
      score += 20;
    }

    // Duration indicators
    const durationKeywords = ['second', 'duration', 'time', 'quick', 'slow', 'smooth'];
    const hasDuration = durationKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    
    if (!hasDuration) {
      issues.push('Duration unclear');
      suggestions.push('Specify timing like "smooth 4-second transition"');
      score -= 15;
    } else {
      score += 15;
    }

    // Engagement keywords
    const engagementWords = this.TOPIC_KEYWORDS.engagement;
    const hasEngagement = engagementWords.some(word => 
      prompt.toLowerCase().includes(word)
    );
    
    if (hasEngagement) {
      score += 10;
    }

    // Length appropriateness
    if (prompt.length < 30) {
      issues.push('Video description too brief');
      suggestions.push('Describe the visual sequence in more detail');
      score -= 15;
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      issues,
      suggestions
    };
  }

  private static analyzeVoice(script: string): AnalysisBlock {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 50; // Base score

    // Length check
    if (script.length < 50) {
      issues.push('Narration too short');
      suggestions.push('Expand explanation for better understanding');
      score -= 25;
    } else if (script.length > 500) {
      issues.push('Narration might be too long for video segment');
      suggestions.push('Consider breaking into shorter segments');
      score -= 10;
    } else {
      score += 15;
    }

    // Readability (Flesch-Kincaid)
    const readability = this.calculateFleschKincaid(script);
    if (readability < 60) { // Difficult to read
      issues.push('Complex language detected');
      suggestions.push('Simplify vocabulary and sentence structure');
      score -= 20;
    } else if (readability > 80) { // Easy to read
      score += 15;
    }

    // Sentiment check
    const sentiment = this.calculateSentiment(script);
    if (sentiment < -2) {
      issues.push('Negative tone detected');
      suggestions.push('Use more positive, encouraging language');
      score -= 15;
    } else if (sentiment > 2) {
      score += 10;
    }

    // Educational keywords
    const educationalScore = this.scoreTopicRelevance(script);
    score += educationalScore * 0.15;

    // Proper nouns for pronunciation
    const properNouns = this.detectProperNouns(script);
    if (properNouns.length > 5) {
      issues.push('Many technical terms may need pronunciation guide');
      suggestions.push('Add phonetic spelling for complex terms');
      score -= 10;
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      issues,
      suggestions
    };
  }

  static analyzePrompt(imagePrompt: string, script: string): PromptAnalysis {
    const imageAnalysis = this.analyzeImage(imagePrompt);
    const videoAnalysis = this.analyzeVideo(imagePrompt);
    const voiceAnalysis = this.analyzeVoice(script);
    
    const overallScore = Math.round(
      (imageAnalysis.score + videoAnalysis.score + voiceAnalysis.score) / 3
    );
    
    let readiness: 'Production Ready' | 'Good' | 'Needs Work' | 'Poor';
    if (overallScore >= 80) readiness = 'Production Ready';
    else if (overallScore >= 60) readiness = 'Good';
    else if (overallScore >= 40) readiness = 'Needs Work';
    else readiness = 'Poor';

    return {
      image: imageAnalysis,
      video: videoAnalysis,
      voice: voiceAnalysis,
      overall: { score: overallScore, readiness }
    };
  }
}
