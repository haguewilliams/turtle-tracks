# BioCLIP browser trial — November 14, 2026

This experimental replacement improves Eastern box turtle suggestions and adds a
narrow **likely adult** suggestion. It does not estimate sex, identify juveniles
or hatchlings reliably, determine exact age, or identify individual turtles.

The photo remains in the browser. The first check downloads about 103 MB of model
and runtime assets; only the model, never photographs, is cached explicitly.
No account, API key, per-photo payment, or inference server is required.

## What was checked

The fixed species threshold is 0.63. Classifier weights were not refit during this
browser conversion. This export uses shared JavaScript antialiased bicubic center
cropping, so preprocessing and quantization both differ from the original export.

| Cohort | Original released MobileNet | Browser BioCLIP Q8 |
| --- | --- | --- |
| Additional 53 Eastern / 90 other photos | 17 correct Eastern suggestions; 2 false suggestions | 40 correct; 2 false; 13 Eastern missed |
| Development test, 128 Eastern / 170 other | 61 correct; 0 false | 92 correct; 2 false; 36 Eastern missed |
| Ten original internet photos, 6 Eastern / 4 other | 5 correct; 0 false | 5 correct; 0 false |

The 770 existing validation/test/additional photographs and ten internet photos
were replayed. These cohorts have been examined repeatedly; this is not a new
independent estimate of general accuracy. Community species labels and foundation
model pretraining overlap are additional limitations. The smaller export trades
some accuracy for a practical download: the original FP16 candidate found 41 of
53 Eastern turtles with one false suggestion on the additional cohort.

### Adult-only stage trial

Adult/juvenile classification together failed validation: juvenile predictions
were particularly unreliable. A narrower adult-only threshold of 0.80 was selected
from validation results, then checked on test data and 29 newly collected licensed
2018–2022 photographs. Sex remains disabled, including when an adult is suggested.

| Cohort | Likely-adult suggestions | Matches / errors | Unclassified |
| --- | --- | --- | --- |
| Validation: 121 adult, 41 juvenile | 56 | 56 / 0 | 106 |
| Held-out test: 57 adult, 37 juvenile | 20 | 19 / 1 | 74 |
| Internet: 4 adult, 2 juvenile | 3 | 3 / 0 | 3 |
| New stage check: 25 adult, 4 juvenile | 10 | 10 / 0 | 19 |

These are matches to source/community annotations, not expert validation of visible
age evidence. Four juveniles in the fresh check is weak negative coverage. The new
cohort excludes published attribution strings; changed names can defeat that check.
No confidence percentage is shown. Unknown never means juvenile. No anatomy or
scale evidence is invented from a class score. Exact ages are never estimated.

The male/female head still fails: at a 0.5 threshold, 27 of 92 validation suggestions
were wrong. Increasing its threshold leaves too few examples to validate. It also
cannot establish two visible diagnostic features. It is not a released capability.

## Browser checks and limits

Desktop Chrome WebAssembly ran all ten original internet photographs, with roughly
0.8–1.0 seconds per photo after loading. The app's upload, cancel, retry, review,
and journal flow are checked separately. These timings are not iPhone benchmarks.
Physical iPhone and Android memory/startup performance remain unverified; this is
an experimental trial, not a completed identification release. The 180-second
deadline and explicit Cancel check control preserve the photo on failure.

## Reproduction and provenance

- Base: [Imageomics BioCLIP](https://huggingface.co/imageomics/bioclip), ViT-B/16,
  MIT; Stevens et al., *BioCLIP: A Vision Foundation Model for the Tree of Life*,
  CVPR 2024. The original training uses TreeOfLife-10M.
- Pinned ONNX export: `jsteinshouer/trail-bingo-bioclip-onnx`, revision
  `25d50dd481d6a748ce78c8bc513a420bf7d3d279`, MIT.
- ONNX Runtime Web 1.21.0, WASM-only build, MIT. Licenses are retained here and in
  `assets/onnx-runtime/LICENSE`.
- Source encoder SHA-256:
  `5758de50beec26ac65a4fbd9cdcafe09a968bd2ba0183898c63f0ecfa0687bc3`.
- Q8 encoder: 89,646,093 bytes; SHA-256
  `9f0d0230172ad7f1d5696f7445bf7cd247ce0e35ad517645192c2b380ce2d112`.
- `tools/vision-evaluation/quantize-bioclip.py` folds constant fp16 casts,
  preprocesses with ORT basic optimization, and quantizes MatMul/Gemm weights
  dynamically to per-channel uint8. It never changes classifier weights.
- `.github/workflows/build-photo-model.yml` rebuilds and checks the exact model
  bytes before committing assets. It does not activate or change app configuration.
- Classifier source/partition/attribution: `../eastern-box-v1/sources.json`.
- Complete comparison and stage results:
  `../../tools/vision-evaluation/results/browser-candidate-evaluation.json`.

Photos, GPS, notes, and private user data are not part of the shipped model files.
