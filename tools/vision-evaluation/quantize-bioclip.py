"""Make a browser candidate; this never enables or publishes a model."""
import collections, hashlib, json, pathlib
import numpy as np
import onnx
from onnx import numpy_helper
import onnxruntime as ort
from onnxruntime.quantization import quantize_dynamic, QuantType

ROOT = pathlib.Path(__file__).resolve().parents[2]
DEST = ROOT / '.model-cache/vision-evaluation/bioclip'
source = DEST / 'image_encoder_fp16.onnx'
assert hashlib.sha256(source.read_bytes()).hexdigest() == '5758de50beec26ac65a4fbd9cdcafe09a968bd2ba0183898c63f0ecfa0687bc3'
model = onnx.load(source)
weights = {w.name: w for w in model.graph.initializer}
remove = []
for node in model.graph.node:
    if node.op_type == 'Cast' and node.input[0] in weights:
        value = numpy_helper.to_array(weights[node.input[0]])
        dtype = next(a.i for a in node.attribute if a.name == 'to')
        if dtype == onnx.TensorProto.FLOAT:
            model.graph.initializer.append(numpy_helper.from_array(value.astype(np.float32), node.output[0]))
            remove.append(node)
for node in remove:
    model.graph.node.remove(node)
used = {name for node in model.graph.node for name in node.input}
for w in list(model.graph.initializer):
    if w.name not in used:
        model.graph.initializer.remove(w)
fp32 = DEST / 'image_encoder_fp32.onnx'
onnx.save(model, fp32)
options = ort.SessionOptions()
options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
options.optimized_model_filepath = str(DEST / 'image_encoder_preprocessed.onnx')
options.intra_op_num_threads = 4
session = ort.InferenceSession(str(fp32), options, providers=['CPUExecutionProvider'])
del session, model
target = DEST / 'image_encoder_q8.onnx'
quantize_dynamic(options.optimized_model_filepath, str(target), per_channel=True,
                 weight_type=QuantType.QUInt8, op_types_to_quantize=['MatMul', 'Gemm'])
model = onnx.load(target)
onnx.checker.check_model(model)
report = {'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
          'bytes': target.stat().st_size, 'onnxruntime': ort.__version__,
          'method': 'Fold fp16 constant casts, ORT basic preprocessing, dynamic per-channel uint8 MatMul/Gemm',
          'operators': dict(collections.Counter(n.op_type for n in model.graph.node))}
(DEST / 'quantization.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2))
