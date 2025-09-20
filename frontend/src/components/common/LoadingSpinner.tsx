import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;