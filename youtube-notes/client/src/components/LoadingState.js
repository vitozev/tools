import React from 'react';

const LoadingState = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Video</h3>
        <p className="text-gray-500 text-center max-w-md">
          We're fetching the transcript and analyzing the content. This may take a minute or two depending on the video length.
        </p>
        
        <div className="w-full max-w-md mt-6">
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100">
              <div className="animate-pulse w-full h-full bg-primary-500"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Fetching transcript</span>
            <span>Analyzing content</span>
            <span>Generating notes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState; 