# Original-photo evaluation

Research only. This directory does not activate or change the public analyzer.
Original photographs are downloaded from source URLs. The user's screenshot is
not in this comparison, and no user photo is used for training or redistributed.
Inference runs locally; no paid API or hosting account is required for these tests.

The ten distinct photographs in `internet-sources.json` include four adult Eastern
box turtles labeled male/female by theTurtleRoom, two source-labeled juveniles,
an ornate box turtle, a slider, a largely obscured frog, and a cane toad. Source
captions are reference labels, not independent expert validation. A known sex
does not imply the diagnostic features are visible in that photograph. The
obscured frog is useful for checking restraint, not demanding exact identification.

Source images remain in ignored `.model-cache`. Checksums prevent silently
changing the sample. Some sources retain copyright; these photos are used for
local evaluation only, not training or redistribution. The separate training
corpus contains CC0/CC BY photos with attribution retained in the model sources.

## Initial findings, November 14, 2026

| Candidate | Six Eastern box turtle photos | Sex/stage findings |
| --- | --- | --- |
| Released MobileNet classifier | Five Eastern suggestions, one abstention; no Eastern suggestions on the four comparison photos | Both fields remain disabled |
| SmolVLM 500M, q8 | Generic “turtle” for all six; no Eastern identification | Two wrong sex answers on four source-labeled adults; two wrong juvenile answers on adults |
| Qwen 3.5 0.8B, q4 language/fp32 vision | No clear correct Eastern identification; several wrong or invented species names | All sex answers unknown; stage explanations often incomplete or unsupported |
| BioCLIP with fixed 28-label comparison | Eastern ranked first on four of six; two ranked as spotted turtles | Species model only; no sex/stage inference |

Raw outputs are in `results/`. These are a feasibility screen, not a measured
general accuracy rate. BioCLIP's relative scores depend on the candidate labels
and are not calibrated probabilities. The language-model generation budget was
120 tokens per question, so incomplete explanations are not treated as valid
answers. CPU timings are from this workspace, not an iPhone. Concurrent CPU
work also makes these timings unsuitable as a speed comparison.

The original photos demonstrate that changing the screenshot crop alone does
not solve the model's weaknesses. Neither general-purpose vision-language model
qualifies as a replacement.

## Trained BioCLIP findings

Training small heads over BioCLIP features materially improved the larger
species comparison. The validation-selected threshold was 0.63; it was not
changed after examining either test cohort.

| Cohort | Released classifier | Trained BioCLIP candidate |
| --- | --- | --- |
| Development test: 128 Eastern, 170 other | 61 correct Eastern suggestions, 0 wrong; 67 Eastern missed | 96 correct, 1 wrong; 32 Eastern missed |
| Additional cohort: 53 Eastern, 90 other | 17 correct Eastern suggestions, 2 wrong; 36 Eastern missed | 41 correct, 1 wrong; 12 Eastern missed |
| Ten original-photo screen: 6 Eastern, 4 other | 5 correct Eastern suggestions, 0 wrong; 1 Eastern missed | 5 correct, 0 wrong; 1 Eastern missed (a different juvenile) |

The additional-cohort precision was 41/42 (97.6%) and recall 41/53 (77.4%).
These results justify a browser feasibility test, not a general accuracy or
readiness claim. There are still misses and one false species suggestion.
The image encoder alone downloads 172,899,543 bytes before browser runtime;
phone download time, memory and inference remain unverified.

Stage classification matched 81/94 held-out community labels; sex matched
35/47. On the six source-labeled Eastern photos in the internet screen, the stage
head matched all six labels, but the sex head matched only **one of four** labeled
adults. The low-confidence sex scores are diagnostic output, not user-facing
suggestions. No age/sex field is ready for release, and the classifier artifact
keeps every head disabled. This research commit does not switch the public app
to BioCLIP.

The exact disabled classifier and evaluation outputs are preserved in `results/`.
The additional-cohort report's SHA-256 identifies the saved classifier bytes.

## Reproduce the original-photo screen

Run from the repository root with Node 22+ and Python 3:

```sh
python -m pip install -r tools/model-development/requirements.txt
npm ci --prefix tools/model-development
npm ci --prefix tools/vision-evaluation
python tools/vision-evaluation/download-fixtures.py
node tools/vision-evaluation/baseline.mjs
node tools/vision-evaluation/compare.mjs smol
node tools/vision-evaluation/compare.mjs qwen
python tools/vision-evaluation/download-bioclip.py
node tools/vision-evaluation/bioclip.mjs
```

The VLM models download from pinned public Hugging Face revisions into the
ignored cache. BioCLIP's export is pinned and checked by SHA-256. BioCLIP uses
its documented 224-pixel bicubic center crop and CLIP channel normalization.
VLM input resizing preserves aspect ratio with a maximum edge of 448 pixels.
The original files are not rewritten by any model's preprocessing.

## Turtle-specific BioCLIP experiment

After preparing the existing development and additional-cohort manifests and
photos using `tools/model-development/README.md`:

```sh
node tools/vision-evaluation/extract-bioclip.mjs
python tools/model-development/train.py --backbone bioclip
python tools/model-development/evaluate-fresh.py --backbone bioclip
node tools/vision-evaluation/classify-bioclip.mjs
```

This fits small classification heads over frozen BioCLIP features. It does not
retrain the full vision model. Observer partitions, duplicate removal, validation
threshold rules, and comparison cohorts stay the same as the earlier experiment.
Only training photos fit the classifier; validation selects regularization and
the species threshold. Test/cohort results are reported without tuning on them.
These comparison cohorts have been examined across several candidates and are
not a new independent final validation. Public-photo overlap with a foundation
model's pretraining is unknown.

Training always exports disabled heads. Sex and stage need validation of the
visible evidence, and browser/phone memory, startup, inference, and cancellation
must be tested before any candidate becomes an app feature.

Model references:

- [SmolVLM 500M](https://huggingface.co/HuggingFaceTB/SmolVLM-500M-Instruct)
- [Qwen ONNX export](https://huggingface.co/onnx-community/Qwen3.5-0.8B-ONNX-OPT)
- [BioCLIP](https://huggingface.co/imageomics/bioclip) and its [ONNX export](https://huggingface.co/jsteinshouer/trail-bingo-bioclip-onnx)

## Browser conversion and adult-only trial

The subsequent Q8 browser conversion and additional stage check are documented in [the current model card](../../models/eastern-box-v2/README.md). Reproduce with `restore-cohorts.py`, `quantize-bioclip.py`, `evaluate-browser-candidate.mjs`, `fresh-stage-check.py`, `evaluate-browser-candidate.mjs --fresh-stage`, and `summarize-browser-candidate.py`. The fresh collector is time/query-dependent; `results/fresh-stage-sources.json` preserves the exact evaluated source photos and checksums. The full adult/juvenile and male/female heads still fail their validation gates; only a separately evaluated adult-only output is enabled.
