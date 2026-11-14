"""Download pinned public research weights, with no account or paid inference."""
import concurrent.futures,hashlib,pathlib,requests
ROOT=pathlib.Path(__file__).resolve().parents[2]
DEST=ROOT/'.model-cache/vision-evaluation/bioclip'
BASE='https://huggingface.co/jsteinshouer/trail-bingo-bioclip-onnx/resolve/25d50dd481d6a748ce78c8bc513a420bf7d3d279/'
FILES={
 'manifest.json':'cdaa27936f3123a277bb157f95b535f3d8d2c9f605a8ff6458e1abc35635c0fd',
 'text_encoder_fp16.onnx':'bd84391a49fe76923dd5e72bd3a4b0ae05008090b0453517ccf699c1990a513e',
 'tokenizer_config.json':'3f74b6a4d97fee70b3b96921a687fc5e3f2fb583f5f81e7c178c0c22281beade',
 'tokenizer.json':'a83e0809aa4c3af7208b2df632a7a69668c6d48775b3c3fe4e1b1199d1f8b8f4',
 'image_encoder_fp16.onnx':'5758de50beec26ac65a4fbd9cdcafe09a968bd2ba0183898c63f0ecfa0687bc3',
}
DEST.mkdir(parents=True,exist_ok=True)
def download(name):
 target=DEST/name
 if not target.exists():
  with requests.get(BASE+name,stream=True,timeout=60) as response:
   response.raise_for_status();temporary=target.with_suffix(target.suffix+'.part')
   with temporary.open('wb') as out:
    for chunk in response.iter_content(1024*1024):out.write(chunk)
   if hashlib.sha256(temporary.read_bytes()).hexdigest()!=FILES[name]:raise ValueError('Weight checksum mismatch: '+name)
   temporary.replace(target)
 if hashlib.sha256(target.read_bytes()).hexdigest()!=FILES[name]:raise ValueError('Cached weight checksum mismatch: '+name)
 print('Verified',name,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(download,FILES))
