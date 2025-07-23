import '@/global.css';

import { App } from '@/App';
import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('app')!).render(
    createElement(StrictMode, null, createElement(App)),
);
