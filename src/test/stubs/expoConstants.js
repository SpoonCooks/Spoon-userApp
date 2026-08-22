/**
 * Node stub for `expo-constants`.
 *
 * The live-backend suite runs headlessly, where the real module reaches into native bindings that
 * do not exist. It only ever supplies `expoConfig.extra`, and the live suite builds its own client
 * rather than reading app config, so an empty shape is enough — and honest: nothing under test
 * consumes it.
 */
module.exports = { __esModule: true, default: { expoConfig: { extra: {} } } };
