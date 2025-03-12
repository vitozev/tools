import React, { useState } from 'react';
import Header from './components/Header';
import VideoInput from './components/VideoInput';
import ApiKeyInput from './components/ApiKeyInput';
import NotesDisplay from './components/NotesDisplay';
import LoadingState from './components/LoadingState';
import ErrorMessage from './components/ErrorMessage';
import axios from 'axios';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('openai');
  const [transcript, setTranscript] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailLevel, setDetailLevel] = useState('medium');

  const handleVideoUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
  };

  const handleProviderChange = (e) => {
    setProvider(e.target.value);
  };

  const handleDetailLevelChange = (e) => {
    setDetailLevel(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTranscript(null);
    setAnalysis(null);

    try {
      // Step 1: Fetch transcript
      const transcriptResponse = await axios.post('/api/transcript', { videoUrl });
      const fetchedTranscript = transcriptResponse.data.transcript;
      setTranscript(fetchedTranscript);

      // Step 2: Analyze transcript
      const analysisResponse = await axios.post('/api/analyze', {
        transcript: fetchedTranscript,
        apiKey,
        provider,
        detailLevel
      });
      
      setAnalysis(analysisResponse.data.analysis);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analysis) return;

    const analysisText = `
# ${analysis.title}

## Summary
${analysis.summary}

## Key Themes
${analysis.keyThemes.map(theme => `
### ${theme.theme}
${theme.description}

${theme.points.map(point => `- ${point}`).join('\n')}
`).join('\n')}

## Timestamps
${analysis.timestamps.map(ts => `- ${ts.time}: ${ts.description}`).join('\n')}
    `;

    const blob = new Blob([analysisText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Extract Themes from YouTube Video</h2>
          <form onSubmit={handleSubmit}>
            <VideoInput 
              videoUrl={videoUrl} 
              onChange={handleVideoUrlChange} 
            />
            <ApiKeyInput 
              apiKey={apiKey} 
              onChange={handleApiKeyChange}
              provider={provider}
              onProviderChange={handleProviderChange}
              detailLevel={detailLevel}
              onDetailLevelChange={handleDetailLevelChange}
            />
            <div className="mt-4">
              <button 
                type="submit" 
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                disabled={loading || !videoUrl || !apiKey}
              >
                {loading ? 'Processing...' : 'Analyze Video'}
              </button>
            </div>
          </form>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorMessage message={error} />}
        
        {analysis && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Analysis Results</h2>
              <button 
                onClick={handleExport}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-3 rounded-md text-sm transition duration-300"
              >
                Export as Markdown
              </button>
            </div>
            <NotesDisplay analysis={analysis} videoUrl={videoUrl} />
          </div>
        )}
      </main>
      <footer className="bg-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>YouTube Notes &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 