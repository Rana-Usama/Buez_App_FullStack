// Silences non-essential console output in release builds. Must stay the first
// import so it runs before any application code logs. See app/utils/consoleGuard.ts.
import './app/utils/consoleGuard';

import './app/observability/init';

import { registerRootComponent } from 'expo';

import App from './App';
import { wrapRootComponent } from './app/observability';

registerRootComponent(wrapRootComponent(App));
