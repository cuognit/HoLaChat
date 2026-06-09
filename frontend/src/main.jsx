import './polyfills.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ChatProvider from './context/ChatContext.jsx';
import AuthProvider from './context/AuthContext.jsx';
import { CallProvider } from './context/CallContext.jsx';
createRoot(document.getElementById('root')).render(

    <AuthProvider>
    <ChatProvider>
    <CallProvider>
      <App />
    </CallProvider>
    </ChatProvider>
    </AuthProvider>
 
);
