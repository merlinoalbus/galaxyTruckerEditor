import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RealApp } from './pages/RealApp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RealApp />
  </React.StrictMode>
);