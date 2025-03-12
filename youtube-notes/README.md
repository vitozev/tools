# YouTube Notes

A single-page application that extracts key themes from YouTube videos using their transcriptions.

## Features

- Extract and analyze YouTube video transcriptions
- Identify key themes, topics, and important points
- Generate concise, context-aware notes
- Display extracted themes in an organized format
- Include timestamp references to specific moments in the video
- Export or save generated notes
- Customize the level of detail in the notes

## Tech Stack

- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- APIs: YouTube Data API, OpenAI API, Anthropic API

## Installation

1. Clone the repository
2. Install server dependencies:
   ```
   npm install
   ```
3. Install client dependencies:
   ```
   cd client
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5001
   ```
5. Start the development server:
   ```
   npm run dev
   ```
6. In a separate terminal, start the client:
   ```
   cd client
   npm start
   ```

## Usage

1. Enter a YouTube video URL in the input field
2. Enter your OpenAI or Anthropic API key
3. Select the AI provider (OpenAI or Anthropic)
4. Click "Analyze" to extract themes from the video
5. View the generated notes and themes
6. Click on timestamps to jump to specific moments in the video
7. Export or save the notes if needed

## License

MIT 