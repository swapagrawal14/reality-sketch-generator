import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Loader2, Palette, AlertTriangle, Download, Copy, Check, Moon, Sun, Shuffle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { getRandomPrompt, enhancePrompt } from '@/utils/promptUtils';

const SwapMemes = () => {
  const [apiKey, setApiKey] = useState('');
  const [memeConcept, setMemeConcept] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage whenever it changes
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value) {
      localStorage.setItem('gemini-api-key', value);
    } else {
      localStorage.removeItem('gemini-api-key');
    }
  };

  // Construct detailed prompt for the AI
  const constructPrompt = (userConcept: string) => {
    return `Create a simple, hand-drawn, expressive social commentary cartoon in the style of newspaper editorial cartoons. The cartoon should visually represent this concept: "${userConcept}". 

Style requirements:
- Clean, minimalist line art with clear expressions
- Focus on visual storytelling and symbolic elements
- Characters should have exaggerated but relatable expressions
- Include environmental details that reinforce the message
- Black and white or minimal color palette
- Should evoke thought and potentially a wry smile
- Clear visual metaphors that make the social commentary obvious

The cartoon should be thought-provoking and capture the irony or reality of modern life as described in the concept.`;
  };

  const handleRandomPrompt = () => {
    const randomPrompt = getRandomPrompt();
    setMemeConcept(randomPrompt);
    toast({
      title: "Random Prompt Generated!",
      description: "A new satirical concept has been loaded for you.",
    });
  };

  const handleEnhancePrompt = () => {
    if (!memeConcept.trim()) {
      setError('Please enter a meme concept first to enhance it');
      return;
    }
    
    const enhancedPrompt = enhancePrompt(memeConcept);
    setMemeConcept(enhancedPrompt);
    toast({
      title: "Prompt Enhanced!",
      description: "Your concept has been enriched with additional context.",
    });
  };

  const generateMeme = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Google API key');
      return;
    }

    if (!memeConcept.trim()) {
      setError('Please enter a meme concept');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedImage('');
    setGeneratedText('');

    try {
      const prompt = constructPrompt(memeConcept);
      console.log('Sending prompt to AI:', prompt);

      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"]
        }
      };

      console.log('Full request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`API Error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      console.log('Full API response:', JSON.stringify(data, null, 2));

      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const parts = data.candidates[0].content.parts;
        
        // Look for image data
        const imagePart = parts.find(part => part.inlineData && part.inlineData.data);
        if (imagePart) {
          const mimeType = imagePart.inlineData.mimeType || 'image/png';
          const imageData = imagePart.inlineData.data;
          setGeneratedImage(`data:${mimeType};base64,${imageData}`);
        }

        // Look for text response
        const textPart = parts.find(part => part.text);
        if (textPart) {
          setGeneratedText(textPart.text);
        }

        if (!imagePart) {
          throw new Error('No image was generated in the response');
        }

        toast({
          title: "Meme Generated!",
          description: "Your satirical cartoon has been created successfully.",
        });

      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Unexpected response structure from API');
      }

    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate meme: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `swap-meme-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloaded!",
      description: "Your meme has been saved to your device.",
    });
  };

  const copyToClipboard = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied!",
        description: "Image copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Unable to copy image to clipboard.",
      });
    }
  };

  const exampleConcepts = [
    "Adults addicted to social media validation, neglecting real-life interactions",
    "The irony of 'save the environment' messages on disposable plastic cups",
    "People taking photos of their food instead of eating it",
    "Everyone being 'busy' but scrolling social media for hours",
    "Complaining about privacy while sharing everything online"
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with Dark Mode Toggle */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Palette className="w-8 h-8 text-blue-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Swap Memes
              </h1>
            </div>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-2">
              <Sun className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-yellow-500'}`} />
              <Switch 
                checked={isDarkMode} 
                onCheckedChange={toggleDarkMode}
                className="data-[state=checked]:bg-blue-600"
              />
              <Moon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-slate-400'}`} />
            </div>
          </div>
          <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Transform your observations about modern life into thought-provoking editorial cartoons using AI
          </p>
        </div>

        {/* Security Warning */}
        <Alert className={`mb-6 ${isDarkMode ? 'border-amber-500/50 bg-amber-500/10' : 'border-amber-400 bg-amber-50'}`}>
          <AlertTriangle className={`h-4 w-4 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
          <AlertDescription className={isDarkMode ? 'text-amber-200' : 'text-amber-800'}>
            <strong>Security Notice:</strong> Your API key is stored locally in your browser and sent directly to Google's servers. 
            Never share your API key or use it on public/shared computers.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className={`${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Palette className="w-5 h-5 text-blue-400" />
                Create Your Cartoon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Google Gemini API Key
                </label>
                <Input
                  type="password"
                  placeholder="Enter your API key..."
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className={`${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                />
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Get your API key from{' '}
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>

              {/* Meme Concept Input */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Your Meme Concept
                </label>
                
                {/* Prompt Action Buttons */}
                <div className="flex gap-2 mb-2">
                  <Button
                    onClick={handleRandomPrompt}
                    variant="outline"
                    size="sm"
                    className={`flex-1 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Shuffle className="w-3 h-3 mr-1" />
                    Random
                  </Button>
                  <Button
                    onClick={handleEnhancePrompt}
                    variant="outline"
                    size="sm"
                    className={`flex-1 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Enhance
                  </Button>
                </div>
                
                <Textarea
                  placeholder="Describe a modern life irony or social observation..."
                  value={memeConcept}
                  onChange={(e) => setMemeConcept(e.target.value)}
                  className={`min-h-[120px] ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                />
                
                {/* Example Concepts */}
                <div className="space-y-2">
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Example concepts:</p>
                  <div className="flex flex-wrap gap-1">
                    {exampleConcepts.map((concept, index) => (
                      <button
                        key={index}
                        onClick={() => setMemeConcept(concept)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      >
                        {concept.slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateMeme}
                disabled={isGenerating || !apiKey.trim() || !memeConcept.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sketching Your Reality...
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4 mr-2" />
                    Generate Cartoon
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <Alert className={`${isDarkMode ? 'border-red-500/50 bg-red-500/10' : 'border-red-400 bg-red-50'}`}>
                  <AlertTriangle className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <AlertDescription className={isDarkMode ? 'text-red-200' : 'text-red-800'}>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className={`${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Your Generated Cartoon</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <div className="space-y-4">
                  {/* Original Concept */}
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Your Concept:</h3>
                    <p className={`italic ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>"{memeConcept}"</p>
                  </div>

                  {/* Generated Image */}
                  <div className="bg-white p-4 rounded-lg">
                    <img
                      src={generatedImage}
                      alt="Generated meme cartoon"
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>

                  {/* AI Text Response */}
                  {generatedText && (
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>AI Commentary:</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{generatedText}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={downloadImage}
                      variant="outline"
                      className={`flex-1 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className={`flex-1 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Palette className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`} />
                  <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                    {isGenerating ? 'Creating your cartoon...' : 'Your generated cartoon will appear here'}
                  </p>
                  {isGenerating && (
                    <div className="mt-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className={`text-center mt-12 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          <p>Powered by Google's Gemini AI • Transform reality into art</p>
        </div>
      </div>
    </div>
  );
};

export default SwapMemes;
