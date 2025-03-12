import React, { useState } from 'react';

const NotesDisplay = ({ analysis, videoUrl }) => {
  const [activeTab, setActiveTab] = useState('themes');
  const [expandedThemes, setExpandedThemes] = useState({});
  
  // Extract video ID from URL
  const getVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const videoId = getVideoId(videoUrl);
  
  const toggleTheme = (themeIndex) => {
    setExpandedThemes(prev => ({
      ...prev,
      [themeIndex]: !prev[themeIndex]
    }));
  };
  
  const handleTimestampClick = (timestamp) => {
    // Convert timestamp to seconds
    const timeComponents = timestamp.split(':');
    let seconds = 0;
    
    if (timeComponents.length === 3) {
      // HH:MM:SS format
      seconds = parseInt(timeComponents[0]) * 3600 + 
                parseInt(timeComponents[1]) * 60 + 
                parseInt(timeComponents[2]);
    } else if (timeComponents.length === 2) {
      // MM:SS format
      seconds = parseInt(timeComponents[0]) * 60 + 
                parseInt(timeComponents[1]);
    }
    
    // Open YouTube video at specific timestamp
    window.open(`https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`, '_blank');
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{analysis.title}</h1>
        <p className="text-gray-700">{analysis.summary}</p>
      </div>
      
      {videoId && (
        <div className="mb-6 aspect-video">
          <iframe
            className="w-full h-full rounded-lg shadow-md"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}
      
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('themes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'themes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Key Themes
          </button>
          <button
            onClick={() => setActiveTab('timestamps')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timestamps'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Timestamps
          </button>
        </nav>
      </div>
      
      {activeTab === 'themes' && (
        <div className="space-y-6">
          {analysis.keyThemes.map((theme, index) => (
            <div 
              key={index} 
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
            >
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleTheme(index)}
              >
                <h3 className="text-lg font-medium text-gray-900">{theme.theme}</h3>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-gray-500 transition-transform ${expandedThemes[index] ? 'transform rotate-180' : ''}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className={`px-4 py-3 ${expandedThemes[index] ? 'block' : 'hidden'}`}>
                <p className="text-gray-700 mb-4">{theme.description}</p>
                <ul className="space-y-2">
                  {theme.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex">
                      <span className="text-primary-500 mr-2">•</span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'timestamps' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <ul className="divide-y divide-gray-200">
            {analysis.timestamps.map((ts, index) => (
              <li 
                key={index} 
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start"
                onClick={() => handleTimestampClick(ts.time)}
              >
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mr-3">
                  {ts.time}
                </span>
                <span className="text-gray-700">{ts.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotesDisplay; 