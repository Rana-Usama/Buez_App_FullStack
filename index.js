// Silences non-essential console output in release builds. Must stay the first
// import so it runs before any application code logs. See app/utils/consoleGuard.ts.
import './app/utils/consoleGuard';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
