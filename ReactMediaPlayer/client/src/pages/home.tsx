import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Copy, 
  Settings, 
  Moon, 
  Sun,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  EyeOff,
  Lightbulb,
  Target,
  Undo,
  Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Scene, PromptAnalysis } from '../types/scene';
import { PromptAnalyzer } from '../utils/promptAnalyzer';
import { PromptOptimizer } from '../utils/promptOptimizer';
import { useDebounce } from '../hooks/useDebounce';

const VideoPromptOptimizer: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: '1',
      scene_order: 1,
      image_prompt: '',
      narration_script: ''
    }
  ]);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  
  // Undo/Redo functionality
  const [history, setHistory] = useState<Scene[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;
  
  const analyzeTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Auto-save to localStorage
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem('videoPromptScenes', JSON.stringify(scenes));
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [scenes]);

  // Load saved scenes on mount
  useEffect(() => {
    const saved = localStorage.getItem('videoPromptScenes');
    if (saved) {
      try {
        const parsedScenes = JSON.parse(saved);
        if (parsedScenes.length > 0) {
          setScenes(parsedScenes);
        }
      } catch (error) {
        console.error('Failed to load saved scenes:', error);
      }
    }
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // History management
  const saveToHistory = useCallback((newScenes: Scene[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newScenes)));
      return newHistory.slice(-maxHistorySize);
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [historyIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setScenes(JSON.parse(JSON.stringify(previousState)));
      setHistoryIndex(prev => prev - 1);
      toast({
        title: "Undone",
        description: "Previous state restored",
      });
    }
  }, [history, historyIndex, toast]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setScenes(JSON.parse(JSON.stringify(nextState)));
      setHistoryIndex(prev => prev + 1);
      toast({
        title: "Redone",
        description: "Next state restored",
      });
    }
  }, [history, historyIndex, toast]);

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(scenes))]);
      setHistoryIndex(0);
    }
  }, [scenes, history.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          analyzeAllScenes();
        } else if (e.shiftKey && e.key === 'C') {
          e.preventDefault();
          copyOptimizedPrompts();
        } else if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [undo, redo]);

  const updateScene = useCallback((sceneId: string, field: 'image_prompt' | 'narration_script', value: string) => {
    setScenes(prev => {
      const newScenes = prev.map(scene => 
        scene.id === sceneId 
          ? { ...scene, [field]: value, analysis: undefined }
          : scene
      );
      saveToHistory(newScenes);
      return newScenes;
    });
  }, [saveToHistory]);

  const addNewScene = () => {
    const newScene: Scene = {
      id: Date.now().toString(),
      scene_order: scenes.length + 1,
      image_prompt: '',
      narration_script: ''
    };
    setScenes(prev => {
      const newScenes = [...prev, newScene];
      saveToHistory(newScenes);
      return newScenes;
    });
    toast({
      title: "Scene Added",
      description: "New scene added successfully",
    });
  };

  const removeScene = (sceneId: string) => {
    if (scenes.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one scene is required",
        variant: "destructive"
      });
      return;
    }
    
    setScenes(prev => {
      const filtered = prev.filter(s => s.id !== sceneId);
      const newScenes = filtered.map((scene, index) => ({
        ...scene,
        scene_order: index + 1
      }));
      saveToHistory(newScenes);
      return newScenes;
    });
    
    toast({
      title: "Scene Removed",
      description: "Scene removed successfully",
    });
  };

  const analyzeAllScenes = async () => {
    if (scenes.every(s => !s.image_prompt && !s.narration_script)) {
      toast({
        title: "No Content",
        description: "Please add content to at least one scene",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    setScenes(prev => prev.map(scene => {
      if (scene.image_prompt || scene.narration_script) {
        const analysis = PromptAnalyzer.analyzePrompt(scene.image_prompt, scene.narration_script);
        return { ...scene, analysis };
      }
      return scene;
    }));

    setIsAnalyzing(false);
    toast({
      title: "Analysis Complete",
      description: "All scenes have been analyzed successfully",
    });
  };

  const copyOptimizedPrompts = () => {
    const optimizedPrompts = scenes.map(scene => {
      const optimizedImage = PromptOptimizer.optimizeImagePrompt(scene.image_prompt);
      const optimizedVoice = PromptOptimizer.optimizeVoiceScript(scene.narration_script);
      
      return `Scene ${scene.scene_order}:
Image: ${optimizedImage}
Narration: ${optimizedVoice}
`;
    }).join('\n');

    navigator.clipboard.writeText(optimizedPrompts).then(() => {
      toast({
        title: "Copied!",
        description: "Optimized prompts copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    });
  };

  const exportToCSV = () => {
    const headers = ['scene_order', 'image_prompt', 'narration_script'];
    const csvContent = [
      headers.join(','),
      ...scenes.map(scene => [
        scene.scene_order,
        `"${scene.image_prompt.replace(/"/g, '""')}"`,
        `"${scene.narration_script.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-prompts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "CSV file exported successfully",
    });
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        if (!headers.includes('scene_order') || !headers.includes('image_prompt') || !headers.includes('narration_script')) {
          throw new Error('Invalid CSV format. Required headers: scene_order, image_prompt, narration_script');
        }

        const newScenes: Scene[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const scene: Scene = {
            id: (Date.now() + i).toString(),
            scene_order: parseInt(values[0]) || i,
            image_prompt: values[1] || '',
            narration_script: values[2] || ''
          };
          newScenes.push(scene);
        }

        setScenes(newScenes);
        toast({
          title: "Import Successful",
          description: `Imported ${newScenes.length} scenes successfully`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "Failed to import CSV",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'Production Ready':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Good':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'Needs Work':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'Poor':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getOverallAnalysis = () => {
    const analyzedScenes = scenes.filter(s => s.analysis);
    if (analyzedScenes.length === 0) return null;
    
    const totalScore = analyzedScenes.reduce((sum, scene) => sum + (scene.analysis?.overall.score || 0), 0);
    const averageScore = Math.round(totalScore / analyzedScenes.length);
    
    let readiness: 'Production Ready' | 'Good' | 'Needs Work' | 'Poor';
    if (averageScore >= 80) readiness = 'Production Ready';
    else if (averageScore >= 60) readiness = 'Good';
    else if (averageScore >= 40) readiness = 'Needs Work';
    else readiness = 'Poor';
    
    return { score: averageScore, readiness };
  };

  const overallAnalysis = getOverallAnalysis();
  const selectedScene = selectedSceneId ? scenes.find(s => s.id === selectedSceneId) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Video Prompt Optimizer</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Local analysis • No API required</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd>
                <span>Analyze</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Z</kbd>
                <span>Undo</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Y</kbd>
                <span>Redo</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              <Button variant="ghost" size="sm" aria-label="Settings">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button onClick={analyzeAllScenes} disabled={isAnalyzing}>
              <Zap className="w-4 h-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze All Scenes'}
            </Button>
            <Button variant="outline" onClick={addNewScene}>
              <Plus className="w-4 h-4 mr-2" />
              Add Scene
            </Button>
            
            {/* Undo/Redo Controls */}
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <input
                type="file"
                id="csvImport"
                accept=".csv"
                className="hidden"
                onChange={handleCSVImport}
              />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('csvImport')?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Auto-saved
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Scene Input Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-blue-600" />
                  Scene Editor
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create and optimize your video prompts with real-time analysis</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {scenes.map((scene) => (
                  <div key={scene.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-medium">
                          {scene.scene_order}
                        </div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">Scene {scene.scene_order}</h3>
                        {scene.analysis && (
                          <Badge className={getStatusClasses(scene.analysis.overall.readiness)}>
                            {scene.analysis.overall.readiness} ({scene.analysis.overall.score})
                          </Badge>
                        )}
                      </div>
                      {scenes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScene(scene.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Image Prompt <span className="text-gray-500 font-normal">(Visual description)</span>
                        </label>
                        <Textarea
                          value={scene.image_prompt}
                          onChange={(e) => updateScene(scene.id, 'image_prompt', e.target.value)}
                          placeholder="Describe the visual elements, style, composition, and details for this scene..."
                          className="h-24 resize-none"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {scene.analysis?.image && (
                              <span>Image Score: {scene.analysis.image.score}%</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{scene.image_prompt.length} / 500</div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Narration Script <span className="text-gray-500 font-normal">(Voice-over content)</span>
                        </label>
                        <Textarea
                          value={scene.narration_script}
                          onChange={(e) => updateScene(scene.id, 'narration_script', e.target.value)}
                          placeholder="Write the narration script that will be spoken during this scene..."
                          className="h-32 resize-none"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {scene.analysis?.voice && (
                              <span>Voice Score: {scene.analysis.voice.score}%</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {scene.narration_script.trim().split(/\s+/).filter(w => w.length > 0).length} words
                          </div>
                        </div>
                      </div>

                      {scene.analysis && (
                        <div className="space-y-3">
                          {/* Quick Analysis */}
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">Quick Analysis:</span>
                              <div className="flex space-x-2">
                                <span>Image: {scene.analysis.image.score}%</span>
                                <span>Video: {scene.analysis.video.score}%</span>
                                <span>Voice: {scene.analysis.voice.score}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Optimized Prompts */}
                          {(scene.image_prompt || scene.narration_script) && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                                <Lightbulb className="w-4 h-4 mr-1" />
                                Optimized Prompts
                              </h4>
                              
                              {scene.image_prompt && (
                                <div className="mb-3">
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Optimized Image Prompt:</p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 p-2 rounded border">
                                    {PromptOptimizer.optimizeImagePrompt(scene.image_prompt)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 h-6 px-2 text-xs"
                                    onClick={() => {
                                      const optimized = PromptOptimizer.optimizeImagePrompt(scene.image_prompt);
                                      navigator.clipboard.writeText(optimized).then(() => {
                                        toast({
                                          title: "Copied!",
                                          description: "Optimized image prompt copied to clipboard",
                                        });
                                      });
                                    }}
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy Image
                                  </Button>
                                </div>
                              )}
                              
                              {scene.narration_script && (
                                <div className="mb-3">
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Optimized Voice Script:</p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 p-2 rounded border">
                                    {PromptOptimizer.optimizeVoiceScript(scene.narration_script)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 h-6 px-2 text-xs"
                                    onClick={() => {
                                      const optimized = PromptOptimizer.optimizeVoiceScript(scene.narration_script);
                                      navigator.clipboard.writeText(optimized).then(() => {
                                        toast({
                                          title: "Copied!",
                                          description: "Optimized voice script copied to clipboard",
                                        });
                                      });
                                    }}
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy Voice
                                  </Button>
                                </div>
                              )}
                              
                              {(scene.image_prompt && scene.narration_script) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full h-7 px-2 text-xs"
                                  onClick={() => {
                                    const optimized = PromptOptimizer.optimizeFullPrompt(scene.image_prompt, scene.narration_script);
                                    navigator.clipboard.writeText(optimized).then(() => {
                                      toast({
                                        title: "Copied!",
                                        description: `Complete optimized prompt for Scene ${scene.scene_order} copied to clipboard`,
                                      });
                                    });
                                  }}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy Complete Scene
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results Column */}
          <div className="space-y-6">
            {/* Overall Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Overall Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {overallAnalysis ? (
                  <>
                    <div className={`text-3xl font-bold mb-2 ${getScoreColor(overallAnalysis.score)}`}>
                      {overallAnalysis.score}
                    </div>
                    <Badge className={`mb-4 ${getStatusClasses(overallAnalysis.readiness)}`}>
                      {overallAnalysis.readiness}
                    </Badge>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {overallAnalysis.readiness === 'Production Ready' && 'Excellent! Your prompts are optimized and ready for video production.'}
                      {overallAnalysis.readiness === 'Good' && 'Good quality prompts with minor improvements possible.'}
                      {overallAnalysis.readiness === 'Needs Work' && 'Prompts need significant improvements before production.'}
                      {overallAnalysis.readiness === 'Poor' && 'Prompts require major revisions and optimization.'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-400 dark:text-gray-500 mb-2">--</div>
                    <Badge variant="secondary" className="mb-4">Ready to analyze</Badge>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click "Analyze All Scenes" to get detailed insights
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Scene Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle>Scene Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scene</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Image</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Voice</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {scenes.map((scene) => (
                        <tr key={scene.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            Scene {scene.scene_order}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {scene.analysis?.image.score ? `${scene.analysis.image.score}%` : '--'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {scene.analysis?.voice.score ? `${scene.analysis.voice.score}%` : '--'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge className={getStatusClasses(scene.analysis?.overall.readiness || 'Pending')}>
                              {scene.analysis?.overall.readiness || 'Pending'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis */}
            {scenes.some(s => s.analysis) && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analysis</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Issues and suggestions for improvement</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {scenes.filter(s => s.analysis).slice(0, 1).map(scene => (
                    <div key={scene.id}>
                      {/* Image Analysis */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          <Eye className="w-4 h-4 mr-2 text-blue-600" />
                          Image Prompt
                        </h4>
                        {scene.analysis?.image.issues.map((issue, index) => (
                          <div key={index} className="flex items-start space-x-2 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </div>
                        ))}
                        {scene.analysis?.image.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start space-x-2 text-xs text-blue-600 dark:text-blue-400">
                            <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>

                      {/* Voice Analysis */}
                      <div className="space-y-3 mt-6">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          <Play className="w-4 h-4 mr-2 text-green-600" />
                          Voice Script
                        </h4>
                        {scene.analysis?.voice.issues.map((issue, index) => (
                          <div key={index} className="flex items-start space-x-2 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </div>
                        ))}
                        {scene.analysis?.voice.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start space-x-2 text-xs text-blue-600 dark:text-blue-400">
                            <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button onClick={copyOptimizedPrompts} className="w-full">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Optimized Prompts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Tips */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Performance Tips
                </h3>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Use specific visual descriptors</li>
                  <li>• Include motion verbs for video</li>
                  <li>• Keep narration concise and clear</li>
                  <li>• Test readability scores &gt; 60</li>
                </ul>
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Privacy & Security
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">
                      100% Local Processing
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      All analysis happens in your browser. No data sent to servers.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">
                      What We Don't Collect
                    </h4>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
                      <li>• No personal information or tracking</li>
                      <li>• No prompt content or analysis results</li>
                      <li>• No usage statistics or device data</li>
                      <li>• Auto-save uses local storage only</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-green-200 dark:border-green-700">
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Your creative content remains completely private and secure.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-sm mx-4">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Analyzing Scenes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing your prompts with local analysis engine...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoPromptOptimizer;
