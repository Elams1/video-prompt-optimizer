export class PromptOptimizer {
  static optimizeImagePrompt(prompt: string): string {
    if (!prompt.trim()) return '';
    
    let optimized = prompt;
    
    // Add educational framing if missing
    if (!optimized.toLowerCase().includes('educational')) {
      optimized = `Educational content: ${optimized}`;
    }
    
    // Add visual descriptors if missing
    const visualWords = ['show', 'visualize', 'illustrate', 'display'];
    if (!visualWords.some(word => optimized.toLowerCase().includes(word))) {
      optimized = optimized.replace(/\.$/, '') + '. Visualize this with clear, professional imagery.';
    }
    
    // Add style descriptors if missing
    const styleKeywords = ['detailed', 'realistic', 'professional', 'clean', 'modern'];
    const hasStyle = styleKeywords.some(kw => optimized.toLowerCase().includes(kw));
    if (!hasStyle) {
      optimized += ' Use detailed, professional style with clean modern design.';
    }
    
    return optimized.trim();
  }

  static optimizeVideoPrompt(prompt: string): string {
    if (!prompt.trim()) return '';
    
    let optimized = prompt;
    
    // Add scene structure if missing
    if (!optimized.toLowerCase().includes('scene') && !optimized.toLowerCase().includes('sequence')) {
      optimized += ' Structure as engaging scenes with smooth transitions.';
    }
    
    // Add motion descriptors if missing
    const motionWords = ['movement', 'animation', 'transition', 'flow', 'dynamic', 'moving'];
    if (!motionWords.some(word => optimized.toLowerCase().includes(word))) {
      optimized += ' Include smooth transitions and dynamic movement.';
    }
    
    // Add duration awareness if missing
    if (!optimized.toLowerCase().includes('brief') && !optimized.toLowerCase().includes('quick') && !optimized.toLowerCase().includes('short')) {
      optimized += ' Keep scenes brief for optimal video generation (4-5 seconds each).';
    }
    
    return optimized.trim();
  }

  static optimizeVoiceScript(script: string): string {
    if (!script.trim()) return '';
    
    let optimized = script;
    
    // Add narration structure if missing
    if (!optimized.toLowerCase().includes('explain') && !optimized.toLowerCase().includes('narrat')) {
      optimized += ' Include clear narration that explains key concepts.';
    }
    
    // Add educational tone if missing
    const educationalTone = ['learn', 'understand', 'discover', 'explore', 'knowledge'];
    if (!educationalTone.some(word => optimized.toLowerCase().includes(word))) {
      optimized += ' This helps you understand and learn the concept better.';
    }
    
    // Expand if too short
    if (script.length < 50) {
      optimized += ' Provide a clear, detailed explanation of the key ideas and concepts.';
    }
    
    return optimized.trim();
  }

  static optimizeFullPrompt(imagePrompt: string, narrationScript: string): string {
    const optimizedImage = this.optimizeImagePrompt(imagePrompt);
    const optimizedVideo = this.optimizeVideoPrompt(imagePrompt);
    const optimizedVoice = this.optimizeVoiceScript(narrationScript);
    
    return `IMAGE PROMPT:
${optimizedImage}

VIDEO PROMPT:
${optimizedVideo}

VOICE SCRIPT:
${optimizedVoice}`;
  }
}
