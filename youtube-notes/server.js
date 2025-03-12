require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');
const { OpenAI } = require('openai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

// API Routes
app.post('/api/transcript', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    
    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Get transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      return res.status(404).json({ error: 'No transcript found for this video' });
    }
    
    return res.json({ transcript });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { transcript, apiKey, provider, detailLevel } = req.body;
    
    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ error: 'No transcript provided' });
    }
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Combine transcript text
    const fullText = transcript.map(item => item.text).join(' ');
    
    // Check if transcript is too large and needs chunking
    const MAX_CHARS = 100000; // Adjust based on model limits
    let analysis;
    
    if (fullText.length > MAX_CHARS) {
      // For very long transcripts, we'll use a different approach
      const chunks = chunkText(fullText, MAX_CHARS);
      console.log(`Transcript is large (${fullText.length} chars), processing in ${chunks.length} chunks`);
      
      // Process each chunk and combine results
      if (provider === 'openai') {
        analysis = await analyzeWithOpenAIChunked(chunks, apiKey, detailLevel);
      } else if (provider === 'anthropic') {
        analysis = await analyzeWithAnthropicChunked(chunks, apiKey, detailLevel);
      } else {
        return res.status(400).json({ error: 'Invalid AI provider' });
      }
    } else {
      // For normal-sized transcripts, use the original approach
      if (provider === 'openai') {
        analysis = await analyzeWithOpenAI(fullText, apiKey, detailLevel);
      } else if (provider === 'anthropic') {
        analysis = await analyzeWithAnthropic(fullText, apiKey, detailLevel);
      } else {
        return res.status(400).json({ error: 'Invalid AI provider' });
      }
    }
    
    return res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    return res.status(500).json({ error: 'Failed to analyze transcript: ' + error.message });
  }
});

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper function to chunk text into smaller pieces
function chunkText(text, maxChunkSize) {
  const chunks = [];
  let currentChunk = '';
  
  // Split by sentences to avoid cutting in the middle of a sentence
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Analyze transcript with OpenAI for chunked text
async function analyzeWithOpenAIChunked(chunks, apiKey, detailLevel) {
  const openai = new OpenAI({ apiKey });
  
  // First pass: analyze each chunk separately
  const chunkAnalyses = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i+1}/${chunks.length} with OpenAI`);
    
    const prompt = `
      Analyze the following part (${i+1}/${chunks.length}) of a YouTube video transcript and extract key themes, topics, and important points.
      Format the output as JSON with the following structure:
      {
        "keyThemes": [
          {
            "theme": "Theme name",
            "description": "Brief description of this theme",
            "points": ["Important point 1", "Important point 2"]
          }
        ],
        "timestamps": [
          {
            "time": "Approximate timestamp in the video",
            "description": "What happens at this timestamp"
          }
        ]
      }
      
      Transcript part ${i+1}/${chunks.length}:
      ${chunks[i]}
    `;
    
    try {
      // First try with response_format
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant that analyzes YouTube video transcripts and extracts key themes and important points. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      const chunkResult = JSON.parse(response.choices[0].message.content);
      chunkAnalyses.push(chunkResult);
    } catch (error) {
      console.log(`Error with response_format in chunk ${i+1}, trying without it:`, error.message);
      
      // If that fails, try without response_format
      const fallbackResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant that analyzes YouTube video transcripts and extracts key themes and important points. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ]
      });
      
      const chunkResult = JSON.parse(fallbackResponse.choices[0].message.content);
      chunkAnalyses.push(chunkResult);
    }
  }
  
  // Second pass: combine the analyses
  const combinedThemes = [];
  const combinedTimestamps = [];
  
  // Collect all themes and timestamps
  chunkAnalyses.forEach(analysis => {
    if (analysis.keyThemes) {
      combinedThemes.push(...analysis.keyThemes);
    }
    if (analysis.timestamps) {
      combinedTimestamps.push(...analysis.timestamps);
    }
  });
  
  // Final pass: generate a summary and consolidate themes
  const summaryPrompt = `
    Based on the following themes extracted from a YouTube video, create a title and summary for the video.
    
    Themes:
    ${JSON.stringify(combinedThemes)}
    
    Format the output as JSON with the following structure:
    {
      "title": "Suggested title based on content",
      "summary": "A concise 2-3 sentence summary of the video"
    }
  `;
  
  let summaryResult;
  try {
    // First try with response_format
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes content based on extracted themes. Always respond with valid JSON." },
        { role: "user", content: summaryPrompt }
      ],
      response_format: { type: "json_object" }
    });
    
    summaryResult = JSON.parse(summaryResponse.choices[0].message.content);
  } catch (error) {
    console.log("Error with response_format in summary, trying without it:", error.message);
    
    // If that fails, try without response_format
    const fallbackSummaryResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes content based on extracted themes. Always respond with valid JSON." },
        { role: "user", content: summaryPrompt }
      ]
    });
    
    summaryResult = JSON.parse(fallbackSummaryResponse.choices[0].message.content);
  }
  
  // Consolidate similar themes
  const consolidationPrompt = `
    Consolidate these themes from a YouTube video by merging similar ones and organizing them in order of importance.
    Adjust the detail level to be ${detailLevel} (low = fewer themes, high = more themes).
    
    Themes:
    ${JSON.stringify(combinedThemes)}
    
    Format the output as JSON with the following structure:
    {
      "keyThemes": [
        {
          "theme": "Theme name",
          "description": "Brief description of this theme",
          "points": ["Important point 1", "Important point 2"]
        }
      ]
    }
  `;
  
  let consolidatedThemes;
  try {
    // First try with response_format
    const consolidationResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that consolidates and organizes themes from content analysis. Always respond with valid JSON." },
        { role: "user", content: consolidationPrompt }
      ],
      response_format: { type: "json_object" }
    });
    
    consolidatedThemes = JSON.parse(consolidationResponse.choices[0].message.content);
  } catch (error) {
    console.log("Error with response_format in consolidation, trying without it:", error.message);
    
    // If that fails, try without response_format
    const fallbackConsolidationResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that consolidates and organizes themes from content analysis. Always respond with valid JSON." },
        { role: "user", content: consolidationPrompt }
      ]
    });
    
    consolidatedThemes = JSON.parse(fallbackConsolidationResponse.choices[0].message.content);
  }
  
  // Combine everything into the final result
  return {
    title: summaryResult.title,
    summary: summaryResult.summary,
    keyThemes: consolidatedThemes.keyThemes,
    timestamps: combinedTimestamps
  };
}

// Analyze transcript with Anthropic for chunked text
async function analyzeWithAnthropicChunked(chunks, apiKey, detailLevel) {
  // First pass: analyze each chunk separately
  const chunkAnalyses = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i+1}/${chunks.length} with Anthropic`);
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `
              Analyze the following part (${i+1}/${chunks.length}) of a YouTube video transcript and extract key themes, topics, and important points.
              Format the output as JSON with the following structure:
              {
                "keyThemes": [
                  {
                    "theme": "Theme name",
                    "description": "Brief description of this theme",
                    "points": ["Important point 1", "Important point 2"]
                  }
                ],
                "timestamps": [
                  {
                    "time": "Approximate timestamp in the video",
                    "description": "What happens at this timestamp"
                  }
                ]
              }
              
              Transcript part ${i+1}/${chunks.length}:
              ${chunks[i]}
            `
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    const chunkResult = JSON.parse(response.data.content[0].text);
    chunkAnalyses.push(chunkResult);
  }
  
  // Second pass: combine the analyses
  const combinedThemes = [];
  const combinedTimestamps = [];
  
  // Collect all themes and timestamps
  chunkAnalyses.forEach(analysis => {
    if (analysis.keyThemes) {
      combinedThemes.push(...analysis.keyThemes);
    }
    if (analysis.timestamps) {
      combinedTimestamps.push(...analysis.timestamps);
    }
  });
  
  // Final pass: generate a summary and consolidate themes
  const summaryResponse = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `
            Based on the following themes extracted from a YouTube video, create a title and summary for the video.
            
            Themes:
            ${JSON.stringify(combinedThemes)}
            
            Format the output as JSON with the following structure:
            {
              "title": "Suggested title based on content",
              "summary": "A concise 2-3 sentence summary of the video"
            }
          `
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }
  );
  
  const summaryResult = JSON.parse(summaryResponse.data.content[0].text);
  
  // Consolidate similar themes
  const consolidationResponse = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `
            Consolidate these themes from a YouTube video by merging similar ones and organizing them in order of importance.
            Adjust the detail level to be ${detailLevel} (low = fewer themes, high = more themes).
            
            Themes:
            ${JSON.stringify(combinedThemes)}
            
            Format the output as JSON with the following structure:
            {
              "keyThemes": [
                {
                  "theme": "Theme name",
                  "description": "Brief description of this theme",
                  "points": ["Important point 1", "Important point 2"]
                }
              ]
            }
          `
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }
  );
  
  const consolidatedThemes = JSON.parse(consolidationResponse.data.content[0].text);
  
  // Combine everything into the final result
  return {
    title: summaryResult.title,
    summary: summaryResult.summary,
    keyThemes: consolidatedThemes.keyThemes,
    timestamps: combinedTimestamps
  };
}

// Analyze transcript with OpenAI
async function analyzeWithOpenAI(text, apiKey, detailLevel = 'medium') {
  const openai = new OpenAI({ apiKey });
  
  const prompt = `
    Analyze the following YouTube video transcript and extract key themes, topics, and important points.
    Adjust the detail level to be ${detailLevel} (low = fewer themes, high = more themes).
    Format the output as JSON with the following structure:
    {
      "title": "Suggested title based on content",
      "summary": "A concise 2-3 sentence summary of the video",
      "keyThemes": [
        {
          "theme": "Theme name",
          "description": "Brief description of this theme",
          "points": ["Important point 1", "Important point 2"]
        }
      ],
      "timestamps": [
        {
          "time": "Approximate timestamp in the video",
          "description": "What happens at this timestamp"
        }
      ]
    }
    
    Transcript:
    ${text}
  `;
  
  try {
    // First try with GPT-4 and response_format
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that analyzes YouTube video transcripts and extracts key themes and important points. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.log("Error with response_format, trying without it:", error.message);
    
    // If that fails, try without response_format
    const fallbackResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that analyzes YouTube video transcripts and extracts key themes and important points. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ]
    });
    
    // Parse the response content as JSON
    return JSON.parse(fallbackResponse.choices[0].message.content);
  }
}

// Analyze transcript with Anthropic
async function analyzeWithAnthropic(text, apiKey, detailLevel = 'medium') {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `
            Analyze the following YouTube video transcript and extract key themes, topics, and important points.
            Adjust the detail level to be ${detailLevel} (low = fewer themes, high = more themes).
            Format the output as JSON with the following structure:
            {
              "title": "Suggested title based on content",
              "summary": "A concise 2-3 sentence summary of the video",
              "keyThemes": [
                {
                  "theme": "Theme name",
                  "description": "Brief description of this theme",
                  "points": ["Important point 1", "Important point 2"]
                }
              ],
              "timestamps": [
                {
                  "time": "Approximate timestamp in the video",
                  "description": "What happens at this timestamp"
                }
              ]
            }
            
            Transcript:
            ${text}
          `
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }
  );
  
  return JSON.parse(response.data.content[0].text);
}

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 