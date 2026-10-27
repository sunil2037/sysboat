const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config'); // Import Reanimated wrapper

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    // Your existing Metro configuration options would go here.
    // In your current setup, it's an empty object, which is fine for a default project.
};

// First, get the default Metro configuration and merge it with your custom config.
const baseConfig = mergeConfig(getDefaultConfig(__dirname), config);

// Then, wrap the combined configuration with the Reanimated wrapper.
module.exports = wrapWithReanimatedMetroConfig(baseConfig);
