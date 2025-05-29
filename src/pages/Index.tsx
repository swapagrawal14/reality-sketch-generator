
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Palette, AlertTriangle, Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SwapMemes = () => {
  const [apiKey, setApiKey] = useState('');
  const [memeConcept, setMemeConcept] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Palette className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Swap Memes
            </h1>
          </div>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Transform your observations about modern life into thought-provoking editorial cartoons using AI
          </p>
        </div>

        {/* Security Warning */}
        <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200">
            <strong>Security Notice:</strong> Your API key is stored locally in your browser and sent directly to Google's servers. 
            Never share your API key or use it on public/shared computers.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-400" />
                Create Your Cartoon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Google Gemini API Key
                </label>
                <Input
                  type="password"
                  placeholder="Enter your API key..."
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
                <p className="text-xs text-slate-400">
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
                <label className="text-sm font-medium text-slate-300">
                  Your Meme Concept
                </label>
                <Textarea
                  placeholder="Describe a modern life irony or social observation..."
                  value={memeConcept}
                  onChange={(e) => setMemeConcept(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[120px]"
                />
                
                {/* Example Concepts */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Example concepts:</p>
                  <div className="flex flex-wrap gap-1">
                    {exampleConcepts.map((concept, index) => (
                      <button
                        key={index}
                        onClick={() => setMemeConcept(concept)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors"
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
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Your Generated Cartoon</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <div className="space-y-4">
                  {/* Original Concept */}
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Your Concept:</h3>
                    <p className="text-slate-200 italic">"{memeConcept}"</p>
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
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">AI Commentary:</h3>
                      <p className="text-slate-200 text-sm">{generatedText}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={downloadImage}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
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
                  <Palette className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
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
        <div className="text-center mt-12 text-slate-400 text-sm">
          <p>Powered by Google's Gemini AI • Transform reality into art</p>
        </div>
      </div>
    </div>
  );
};

export default SwapMemes;
