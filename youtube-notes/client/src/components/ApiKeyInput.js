import React from 'react';

const ApiKeyInput = ({ 
  apiKey, 
  onChange, 
  provider, 
  onProviderChange,
  detailLevel,
  onDetailLevelChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label 
          htmlFor="apiKey" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          API Key
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={onChange}
            placeholder={`Enter your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Your API key is only sent to the AI provider and is never stored
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label 
            htmlFor="provider" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            AI Provider
          </label>
          <select
            id="provider"
            value={provider}
            onChange={onProviderChange}
            className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </div>

        <div>
          <label 
            htmlFor="detailLevel" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Detail Level
          </label>
          <select
            id="detailLevel"
            value={detailLevel}
            onChange={onDetailLevelChange}
            className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="low">Concise</option>
            <option value="medium">Standard</option>
            <option value="high">Detailed</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyInput; 