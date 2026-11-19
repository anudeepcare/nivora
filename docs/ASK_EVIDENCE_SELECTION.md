# Bounded Ask evidence selection

Ask remains a selected-company research view, not unrestricted web research, portfolio analysis or arbitrary agent tools. It does not send the question or private holdings to market-data providers. The existing AI provider receives the user's question and validated selected-company evidence only after the account, feature and AI allowance checks; questions are not shared-cached.

Topic selection is explicit and bounded: matching requested topics follow their order in the question, with an explicit 'focus on' / 'prioritize' cue taking precedence. Simple exclusion clauses are omitted. Earnings calls no longer match options merely because they contain 'call'. At most two additional topics are retrieved, and limitations list omitted topics and the selected subject. This is a conservative lexical planner, not general language understanding or company-name resolution. Explicit dollar-prefixed tickers that differ from the selected company and explicit portfolio or whole-market requests are rejected before evidence retrieval. Unrecognized questions can use existing dated financial evidence without claiming broader retrieval.

Published analyst changes now select the existing fixed per-ticker analyst-actions adapter rather than mistakenly retrieving only consensus. Evidence includes bounded firm attribution, original rating terms and valid action dates within ninety days. It withholds preview, unknown action types, wrong echoed tickers and future dates. It does not treat published notes as consensus changes, infer targets/currency/split basis, or forward arbitrary provider fields. Official contract: https://sentisense.ai/docs/api/analyst-ratings/ .

Maximum extra acquisition stays one verified stock profile plus two selected datasets, and optionally one EOD publisher-headline request when news is selected. Existing transport caches, limits and shared guard apply. All payload text remains untrusted and escaped; the language model has no tools. Numerical claims remain restricted to validated evidence selected by ID.

Tests cover priority/exclusion, unsupported and ambiguous explicit subject, wrong/preview/future evidence, route feature checks before acquisition, no portfolio auto-transmission, missing evidence, and actual route-through-answer-to-React rendering. No live account/provider or browser validation was performed.

Deployment prerequisite remains AURYN_AI_ENABLED=true with OPENAI_API_KEY and OPENAI_MODEL. No automatic model/key fallback exists. Source changes alone do not enable an unconfigured deployment.

## Structured conversational output and review
The model returns a short answer and separately labeled tentative interpretation,
each with source IDs, plus exact-fact IDs and predefined missing-evidence categories.
The server rejects uncited text, generated URLs/contact details, numeric characters,
currency and direct trade verbs; it renders exact figures only from supplied facts.
These structural checks are not semantic entailment checks and are not claimed as such.
A second bounded model request reviews every claim against the question and evidence.
Unsupported/uncertain claims, refusal, invalid response, timeout or unavailable review
withhold the entire generated answer. Revenue alone does not establish an executive
resignation. Different periods/currencies/scopes must not be silently equated.

Both generation and review remain fallible. A reviewer can falsely approve a claim;
this is a risk-reduction layer, not proof that an answer is true. UI labels interpretation
and warns that AI can err. Source passages are attributed unverified content. The model
has no tools; no private portfolio payload, shared question cache or generated URL is
introduced. One question reserves the existing account allowance once and uses up to
two billable model calls (generation18s, review15s), with no fallback retries in this
workflow. This can add latency/cost; no subscription or budget setting was changed.
Read-only live AI quality and runtime configuration have not been verified.

POST bodies are streamed with an 8192-byte limit, fatal UTF-8 decoding and a five-second
upload deadline. Oversized or malformed inputs stop before research or AI retrieval.
Story titles retain provider-generated editorial provenance and require a supplied
story event time; cluster assembly timestamps are never substituted for event dates.
Configuration availability still requires enable flag, API key and model. Configuration
alone is not a verified live-health check; no production configuration was changed.

### Total request deadline
A request-start 55-second application deadline races the entire route, including
body/auth/data acquisition. The route stops with a controlled unavailable response
rather than intentionally running up to the platform's 60-second termination.
Generation reserves 8.5 seconds for review/response and needs at least 11 seconds
remaining before AI allowance reservation; each model timeout shrinks to the remaining
budget. Review and generation signals include client cancellation and total deadline.
Shared cached market-data transports are not aborted globally (that could affect other
callers); already-started shared requests may finish, but later topic fanout and model
calls are checked before initiation. Budget/RPC work already in flight may finish after
a timeout, and a started attempt can consume the existing allowance. No auto-retry.

### Audit interpretation of tests and cost
The synthesis and review calls use the same configured model, not independent models.
Both can falsely approve an unsupported assertion. Regression fixtures deliberately
supply supported:false to exercise rejection; they do not establish measured model
accuracy, prompt-injection resistance in live use, or semantic truth. The existing
allowance counts a logical Ask request, not model calls or tokens: up to two calls can
incur cost for one allowance reservation. No token-cost ceiling is claimed.

## Explicit public-topic news search
Ask offers a separate, unchecked opt-in. Its topic is initially empty and is never
copied from the question. The UI shows the exact ticker/topic,7or14daywindow and
20-result bound sent to SentiSense. Changing company or disabling/re-enabling the
control clears consent/topic. Only the explicit topic is sent to the market provider;
the question and portfolio are not forwarded. Obvious private identifiers/URLs and
foreign cashtags are rejected, but automated checks cannot guarantee a topic is public.
The user must not put private information in this field.

The fixed `GET /api/v1/documents/stories/search` request replaces normal news
retrieval for that question and occupies one of at most two additional topic slots.
No full story detail calls, arbitrary URLs, shared question/topic cache or new
subscriptions are introduced. Existing confirmed-account, AI/news feature,
market/research/AI quota and credential-scoped provider controls remain in force.
Search receives the absolute Ask cancellation signal and its own12second cap.

Only exact returned ticker membership, dated within the chosen lookback window,
is admitted; assembly time does not substitute for missing publication time.
Preview, invalid, empty or unavailable results remain explicit and do not establish
absence of news. At most eight AI/editorial titles become attributed untrusted text
observations. No numeric scores or sentiment are added. Source links identify the
provider documentation, not an original article. Both synthesis and review receive
these limitations. They remain fallible model calls, not semantic proof.

Verified contract: https://sentisense.ai/docs/api/documents/ (stories/search).
Local fixture tests cover privacy/consent, route→actualguard→transport→projection,
model response plumbing, cancellation, exact subject/window, preview and interactive
company changes. They do not measure live provider coverage or AI answer quality.
