const tf = require('@tensorflow/tfjs');
const wasm = require('@tensorflow/tfjs-backend-wasm');
const mobilenet = require('@tensorflow-models/mobilenet');
const path = require('node:path');
(async () => {
  wasm.setWasmPaths(path.dirname(require.resolve('@tensorflow/tfjs-backend-wasm')) + '/');
  await tf.setBackend('wasm');
  await tf.ready();
  const model = await mobilenet.load({version:2,alpha:0.5});
  const input=tf.zeros([224,224,3]);
  const output=model.infer(input,true);
  console.log(JSON.stringify({backend:tf.getBackend(),embeddingShape:output.shape,values:(await output.data()).length}));
  output.dispose();input.dispose();model.model.dispose();
})();
