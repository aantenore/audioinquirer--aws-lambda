
var serverlessSDK = require('./serverless_sdk/index.js');
serverlessSDK = new serverlessSDK({
  orgId: 'aantenore',
  applicationName: 'be-lambda-audioinquirer',
  appUid: 'ljLXWk4vf2dC63tlPd',
  orgUid: 'c233f810-137c-4028-9314-d5b7c8252b8e',
  deploymentUid: '3a5d82e1-7fcd-4c4f-810e-3b47199d8d2c',
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

const handlerWrapperArgs = { functionName: 'be-lambda-audioinquirer-dev-option', timeout: 6 };

try {
  const userHandler = require('./handler.js');
  module.exports.handler = serverlessSDK.handler(userHandler.handleOptions, handlerWrapperArgs);
} catch (error) {
  module.exports.handler = serverlessSDK.handler(() => { throw error }, handlerWrapperArgs);
}