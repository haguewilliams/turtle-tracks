# Reproduce the experimental model

Run from the repository root with Python 3 and Node 22+. These tools download
public, CC0/CC BY photos and never submit wildlife records. No account or paid API
is used. The ignored `.model-cache` holds images and intermediate features.

```sh
python -m pip install -r tools/model-development/requirements.txt
npm ci --prefix tools/model-development
python tools/model-development/collect.py
node tools/model-development/extract.cjs
python tools/model-development/train.py
python tools/model-development/prune.py
node tools/model-development/verify-export.cjs
python tools/model-development/fresh-check.py
node tools/model-development/extract.cjs --fresh
python tools/model-development/evaluate-fresh.py
```

Collection queries return recent observations, so a later run produces a different
sample. `models/eastern-box-v1/sources.json` preserves the exact evaluated sample,
labels, attribution and partitions. To reproduce those photographs instead of
collecting new ones, reconstruct manifests from those URLs and source labels;
source removal/license changes can prevent exact replay. Follow source licensing.
Training uses observer hashes from the original collection, not random photo
splits. Fresh collection excludes development observers; perceptual duplicates
are removed before evaluation. All downloaded API query caches are sanitized.

Training exports disabled heads. Publishing is a separate deliberate decision;
the script never activates the app. Keep species errors and abstention counts,
and never enable sex or stage from community annotation accuracy alone. The current
species trial missed the 95% target on its additional cohort and is disclosed as
experimental. See the model card and evaluation report for actual results.

`extract.cjs --export-only` exports the original backbone without extracting images.
`--follow` is an optional development mode for overlapping image downloads with
feature extraction. The published pruned graph retains only embedding ancestors.
`verify-runtime.cjs` is a runtime smoke check, not a classifier accuracy test.
