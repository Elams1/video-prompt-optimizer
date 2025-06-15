export interface AnalysisBlock {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface PromptAnalysis {
  image: AnalysisBlock;
  video: AnalysisBlock;
  voice: AnalysisBlock;
  overall: { 
    score: number; 
    readiness: 'Production Ready' | 'Good' | 'Needs Work' | 'Poor' 
  };
}

export interface Scene {
  id: string;
  scene_order: number;
  image_prompt: string;
  narration_script: string;
  analysis?: PromptAnalysis;
}
