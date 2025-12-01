// Generated config wrapper to inject secrets from .env into Expo config at build/runtime
// Keeps secrets out of app.json and allows runtime access via Constants.manifest.extra / expoConfig.extra

try {
  // Load environment from the repository root `.env` (if present).
  require('dotenv').config();
} catch (e) {
  // dotenv is optional in environments where it's not installed (e.g., EAS builds providing env)
}

const appJson = require('./app.json');

module.exports = () => {
  const expo = { ...(appJson.expo || {}) };

  // Ensure android google maps api key is set from env when present
  expo.android = expo.android || {};
  expo.android.config = expo.android.config || {};
  expo.android.config.googleMaps = expo.android.config.googleMaps || {};
  expo.android.config.googleMaps.apiKey = process.env.GOOGLE_MAPS_API_KEY || expo.android.config.googleMaps.apiKey || '';

  // Expose keys via expo.extra so the app can read them at runtime using expo-constants
  expo.extra = expo.extra || {};
  expo.extra.FINNHUB_KEY = process.env.FINNHUB_KEY || expo.extra.FINNHUB_KEY || '';
  expo.extra.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || expo.extra.GOOGLE_MAPS_API_KEY || '';
  expo.extra.TOLLGURU_KEY = process.env.TOLLGURU_KEY || expo.extra.TOLLGURU_KEY || '';
  expo.extra.TOLL_PROVIDER = process.env.TOLL_PROVIDER || expo.extra.TOLL_PROVIDER || 'heuristic';

  return { expo };
};
