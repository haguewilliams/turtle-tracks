# iNaturalist approval plan alongside the Turtle Tracks release

Decision: November 13, 2026. Finish and release Turtle Tracks using the existing official iNaturalist uploader handoff. Add direct submission in a later update to the same app, from the same GitHub `main` source. iNaturalist developer approval is not a first-release dependency.

## What visitors can do in the first release

Record a sighting in Turtle Tracks, save the photograph/date/GPS, prepare a contribution, and open the official iNaturalist uploader. They sign into their own iNaturalist account, review the details and location privacy, and submit there. Ordinary participation does not require approval of a Turtle Tracks API application. The app must clearly distinguish preparing a contribution from actually submitting one.

The direct-integration code stays saved and disabled. Later, it can add account connection and in-app submission without introducing a competing app or design. Preserve existing journal records and backup compatibility when adding it. A native iOS update will use the same App Store listing and go through Apple's review; approval is not guaranteed.

## Two efforts that can proceed together

| Work | Hague's part | Development work | Ready when |
| --- | --- | --- | --- |
| Finish photo analysis | Connect owner-controlled OpenAI and hosting accounts; approve the chosen budget | Configure secure backend and persistent limits; evaluate reviewed real turtle photos | Live consent, uncertainty, error handling, and reviewed saving verified |
| Finish the first release | Try recording and reviewing sightings on actual phones; complete Apple account/terms when needed | Check recording, backup, camera/GPS permissions, accessibility, privacy/support pages; package and test the native app | Release checks pass; Apple approves any App Store release |
| Establish iNaturalist account | Sign into an existing personal account or create one; retain ownership | Check the actual account age and help document eligibility once access is available | Verified owner account and creation date |
| Build genuine participation | Learn and make independently supported identifications of other people's observations | Help find official identification guidance and explain diagnostic evidence; do not post automated IDs or agreements | At least ten current improving IDs created in the preceding month, and account older than two months |
| Obtain app-owner approval | Review and submit the application as account owner | Prepare the description, app URL, privacy explanation, and response to staff questions | Staff grants app-owner access |
| Add direct submission later | Approve application access and a genuine test contribution | Register/configure OAuth, verify live authorization/revocation/privacy/receipts/recovery; release an update | Actual live integration tests pass; release verified |

## Practical eligibility sequence

1. **Start with the account.** If Hague already has an iNaturalist account, use it and check its creation date. An older account may already meet the age rule, avoiding a new two-month wait. No account age or username has been verified yet.
2. **Use the existing iNaturalist website.** The Identify page is https://www.inaturalist.org/observations/identify. Filter for organisms and places Hague knows; inspect the photos, location, date, and evidence. This activity does not require Turtle Tracks, an API application, or a finished native app.
3. **Build confidence first.** Begin with familiar organisms and clear photographs. Add only an identification that Hague can independently explain. A broader accurate identification is preferable to an unsupported species guess. Use the community's feedback and official help to learn. Do not rely solely on AI or accept suggested IDs merely to reach a number.
4. **Understand the specific count.** An improving identification is the first suggestion of a taxon that the community subsequently agrees with. Ten personal observation uploads, ten comments, or ten supporting agreements do not establish ten improving IDs. Community agreement takes time and is not guaranteed.
5. **Time the application window.** The account must be older than two months, and at least ten qualifying IDs on other users' observations must have been created within the preceding month and remain current/improving. If the account is new, early weeks can be spent learning; maintain genuine participation during the second month and check the actual qualifying count near the application date. Do not promise a fixed approval date or count old IDs that have fallen outside the window.
6. **Apply once eligible.** Submit the prepared description below through the official app-owner request. After staff approval, register Turtle Tracks and configure the already implemented callback and secure credentials. Staff approval has no guaranteed turnaround in this plan.

Optional earlier route: Hague can ask help@inaturalist.org for guidance and whether an early review or another approved route is possible for the educational field-guide project. Explain the real app and its human-reviewed submissions; do not assume an exception will be granted. This is a suggestion, not an email that has been sent, and it does not hold up release.

## Prepared app-owner application description

Turtle Tracks is an Eastern Box Turtle field guide and personal sighting journal at https://turtletracks.haguewilliams.com/. It helps people photograph wildlife, record a real encounter's date and location, revisit their own sightings, and learn about turtle conservation. Its first release directs people to iNaturalist's official website uploader. We are requesting app-owner access for a later update that will allow contributors to authorize their own iNaturalist accounts and explicitly review and submit their observations from Turtle Tracks.

Each submission will require the contributor's consent and review of the photograph, date, GPS, public notes, and location visibility. The proposed integration defaults to obscured geoprivacy and offers private visibility; contributors are told that iNaturalist receives the exact coordinates. Private journal notes are excluded. Optional AI photo suggestions remain separate from submission and will not be posted as automatic identifications. We will not use a shared account, post synthetic wildlife observations, or automate community identifications. The implementation includes request limits, duplicate prevention, partial-failure recovery, and verified observation receipts. Direct submission remains disabled until approval and live verification are complete.

## Later-update readiness

- Keep `INAT_ENABLED=false` through the first release.
- Keep the public app at https://turtletracks.haguewilliams.com/ and source on GitHub `main`.
- Verify account eligibility from the real account rather than estimating from this document.
- Obtain staff approval and application credentials through owner-controlled accounts.
- Use the exact callback documented in DEPLOYMENT.md after backend hosting is ready.
- Test provider authorization, revocation, privacy, and a genuine explicitly authorized observation; do not send synthetic test sightings.
- Verify old journals and backups still open, and that manual contribution remains usable.
- Publish an update only after live checks pass. A code-complete integration is not an activated one.

## Verified sources

Checked November 13, 2026:

- Current eligibility implementation: https://github.com/inaturalist/inaturalist/blob/main/app/controllers/oauth_applications_controller.rb
- Official app-owner policy: https://forum.inaturalist.org/t/community-guidelines-update-re-machine-generated-content/29029/1
- Identifying others' observations: https://help.inaturalist.org/en/support/solutions/articles/151000171681
- Definition of improving versus supporting IDs: https://help.inaturalist.org/en/support/solutions/articles/151000170241
- API authorization: https://www.inaturalist.org/pages/api+reference

No account, application, email, reminder, or background task has been created by this plan. The account/signup and spending steps still require Hague's participation.
