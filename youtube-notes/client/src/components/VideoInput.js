import React from 'react';

const VideoInput = ({ videoUrl, onChange }) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor="videoUrl" 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        YouTube Video URL
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-gray-400" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        </div>
        <input
          id="videoUrl"
          type="text"
          value={videoUrl}
          onChange={onChange}
          placeholder="https://www.youtube.com/watch?v=..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Enter a valid YouTube video URL that has captions available
      </p>
    </div>
  );
};

export default VideoInput; 