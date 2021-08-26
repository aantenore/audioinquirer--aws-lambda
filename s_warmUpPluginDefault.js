
var serverlessSDK = require('./serverless_sdk/index.js');
serverlessSDK = new serverlessSDK({
  orgId: 'aantenore',
  applicationName: 'be-lambda-audioinquirer',
  appUid: 'ljLXWk4vf2dC63tlPd',
  orgUid: 'c233f810-137c-4028-9314-d5b7c8252b8e',
  deploymentUid: 'e18c4581-689f-4832-99a0-0b7d7efe98eb',
  serviceName: 'be-lambda-audioinquirer',
  shouldLogMeta: true,
  shouldCompressLogs: true,
  disableAwsSpans: false,
  disableHttpSpans: false,
  stageName: 'dev',
  serverlessPlatformStage: 'prod',
  devModeEnabled: false,
  accessKey: null,
  pluginVersion: '5.4.3',
  disableFrameworksInstrumentation: false
});

const handlerWrapperArgs = { functionName: 'be-lambda-audioinquirer-dev-warmup-plugin-default', timeout: 10 };

try {
  const userHandler = require('./.warmup/default/index.js');
  module.exports.handler = serverlessSDK.handler(userHandler.warmUp, handlerWrapperArgs);
} catch (error) {
  module.exports.handler = serverlessSDK.handler(() => { throw error }, handlerWrapperArgs);
}