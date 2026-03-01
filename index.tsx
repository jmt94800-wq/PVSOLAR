
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { seedDevices } from './db';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize seed data for the first time
seedDevices().catch(console.error);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
