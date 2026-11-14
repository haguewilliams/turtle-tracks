# Experimental Eastern box turtle photo check

This is a free, browser-only **species trial**, not a validated wildlife identifier.
It suggests “Possible Eastern box turtle” or returns unknown. It does not estimate
sex, life stage, exact age, or individual identity. It cannot explain visible
anatomy, and it does not fabricate that evidence from a classification score.

The additional frozen evaluation produced 19 suggestions from 143 photographs:
17 matched the source labels and 2 were other turtles. It identified only 17 of
53 Eastern box turtle photographs. This **did not meet the 95% precision target**.
The owner-requested experimental trial is therefore explicitly labeled, requires
review before saving, and makes no accuracy guarantee. Full identification release
and age/sex functionality remain unfinished. Earlier development results (61/61
suggestions on a 298-photo test partition) must not be quoted alone as accuracy.

## Model and data

- TensorFlow.js MobileNet V2, alpha 0.5, 224-pixel input, frozen 1,280-dimensional
  image features; a balanced four-class logistic-regression head is trained here.
- Unit-normalized features, C=1, threshold 0.64, selected on the development
  validation partition. Threshold is not a calibrated probability.
- 1,766 licensed source images, 5 perceptual duplicates removed. Observer-group
  separation gives 1,134 training, 329 validation, and 298 development test images.
- A separate 143-photo cohort excludes development observers and near duplicates.
  Neither threshold nor coefficients were retuned on that cohort.
- Positive labels: Terrapene carolina carolina. Negatives: other box turtles,
  other turtles, frogs, lizards, plants, and mammals. Coverage is incomplete.
- Community research-grade taxon labels are not independent expert certification.
  Sex and life-stage annotations do not guarantee visible diagnostic features.
  Exploratory sex accuracy was 24/47; stage accuracy was 74/94. Both are disabled.
- See `evaluation.json` for denominators, confusion matrices, failed baseline,
  and limitations; `sources.json` contains photo attribution, licenses, and links.
  Source photographs, precise locations, and observer identifiers are not shipped.

The full ImageNet classifier was pruned from the backbone. Remaining weights total
2,713,640 bytes. The exported graph produced exactly the same 1,280 features as the
original on the export verification photograph. Model files and runtime are served
from the same site. Photos are decoded locally and passed to a Web Worker; there
is no remote photo-analysis request, API key, server inference, or per-photo fee.
The initial model/runtime download requires connectivity. No offline guarantee.

## Provenance and limitations

Backbone: Google TensorFlow Hub MobileNet V2 0.50 224 classification v2,
https://tfhub.dev/google/imagenet/mobilenet_v2_050_224/classification/2
(loaded with TensorFlow.js `fromTFHub: true`).
Apache-2.0 license is included in `../../assets/ml-runtime/LICENSE`.
The graph was pruned; weights of retained nodes were not changed. The new linear
head was trained using the listed CC0/CC BY sources. This project is not endorsed
by Google, TensorFlow, iNaturalist, or source photographers.

Evaluation used a small opportunistic sample and small source photographs. Species
overlap, hybrids, poor lighting, unusual views, unrelated objects and distribution
shift can cause errors. Desktop Chrome workflow is checked; physical iPhone and
Android performance still needs testing. Never use a result to justify handling,
relocating, or submitting an unreviewed identification of an animal.
