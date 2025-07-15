import React from 'react';
import EnhancedNovaInterface from './components/EnhancedNovaInterface';

// NOVA - Neural Operational Virtual Assistant
// Built by Jackson Alex - Founder & CEO of ImaraBuildor
// Aether Core Unit 001 - Advanced AI System

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <EnhancedNovaInterface />
      {/* Creator Attribution */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 opacity-60 hover:opacity-100 transition-opacity">
        <div>NOVA v1.0.0 - Aether Core Unit 001</div>
        <div>Built with ❤️ by Jackson Alex</div>
        <div>Founder & CEO - ImaraBuildor</div>
      </div>
    </div>
  );
}

export default App;