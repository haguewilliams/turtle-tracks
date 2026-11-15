"""Reproduce pinned model/runtime assets without photos, API keys or paid services."""
import hashlib, pathlib, shutil, subprocess, sys
import requests
ROOT=pathlib.Path(__file__).resolve().parents[2]
cache=ROOT/'.model-cache/vision-evaluation/bioclip'
cache.mkdir(parents=True,exist_ok=True)
target=cache/'image_encoder_fp16.onnx'
url='https://huggingface.co/jsteinshouer/trail-bingo-bioclip-onnx/resolve/25d50dd481d6a748ce78c8bc513a420bf7d3d279/image_encoder_fp16.onnx'
if not target.exists():
    with requests.get(url,stream=True,timeout=60) as response:
        response.raise_for_status()
        with target.open('wb') as out:
            for chunk in response.iter_content(1024*1024):out.write(chunk)
assert hashlib.sha256(target.read_bytes()).hexdigest()=='5758de50beec26ac65a4fbd9cdcafe09a968bd2ba0183898c63f0ecfa0687bc3'
subprocess.run([sys.executable,str(pathlib.Path(__file__).with_name('quantize-bioclip.py'))],check=True)
target=cache/'image_encoder_q8.onnx'
assert hashlib.sha256(target.read_bytes()).hexdigest()=='9f0d0230172ad7f1d5696f7445bf7cd247ce0e35ad517645192c2b380ce2d112'
out=ROOT/'models/eastern-box-v2';out.mkdir(parents=True,exist_ok=True)
shutil.copyfile(target,out/'image-encoder-q8.onnx')
runtime=pathlib.Path(sys.argv[1])/'node_modules/onnxruntime-web/dist'
out=ROOT/'assets/onnx-runtime';out.mkdir(parents=True,exist_ok=True)
for source,dest in [('ort.wasm.min.js','ort.min.js'),('ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.mjs'),('ort-wasm-simd-threaded.wasm','ort-wasm-simd-threaded.wasm')]:
    shutil.copyfile(runtime/source,out/dest)
print('Built pinned browser model and WebAssembly assets')
