/* ============================================================
   Unified Functional Platform — LOCAL ASSISTANCE SIMULATION.

   ⛔ THERE IS NO AI PROVIDER HERE, AND NO NETWORK CALL.
   Nothing in this file contacts a service, names a vendor, or claims a
   model. `STK31-33` records the provider as technically pending and
   `ND-09` records the Taxila auto-review mechanics as NOT AVAILABLE and
   NOT TO BE INVENTED. What this file contains is a deterministic local
   simulation whose only purpose is to make the two Faculty workflows
   that depend on assistance explorable end to end:

     1 · AI question DRAFTING          (STK31-33 · FRD 5.1.2)
     2 · AI-assisted descriptive REVIEW (STK31-31)

   Both are governed by the same rule, which is the whole point:

     ASSISTANCE PRODUCES A DRAFT OR A SUGGESTION.
     A FACULTY MEMBER PRODUCES THE OUTCOME.

   Nothing generated here reaches the Question Bank, an assessment, a
   Student, or an evaluated result until a Faculty member explicitly
   confirms it. `state.js` enforces that; this file cannot write state
   at all.

   Determinism matters for a prototype: the same prompt against the same
   experiment always produces the same drafts, so a QA path is
   repeatable and no demonstration depends on chance.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.assist = (function () {
  'use strict';

  var data = XRSLP.data;

  /* ---------- deterministic helpers (no Math.random anywhere) ---------- */

  function hash(str) {
    var h = 2166136261;
    var s = String(str == null ? '' : str);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  var STOPWORDS = {
    the: 1, and: 1, for: 1, that: 1, this: 1, with: 1, from: 1, into: 1, than: 1, then: 1,
    are: 1, was: 1, were: 1, will: 1, which: 1, what: 1, when: 1, your: 1, you: 1, its: 1,
    about: 1, create: 1, write: 1, question: 1, questions: 1, beginner: 1, please: 1,
    make: 1, some: 1, they: 1, their: 1, have: 1, has: 1, had: 1, been: 1, over: 1, each: 1,
    also: 1, more: 1, most: 1, very: 1, such: 1, used: 1, using: 1, use: 1, does: 1, not: 1,
    /* Instruction words that appear in evaluation guidance because it is
       written as an instruction to the reader, not because they are
       something an answer should contain. */
    look: 1, refer: 1, mention: 1, sentences: 1, sentence: 1, words: 1, answer: 1, answers: 1,
    should: 1, would: 1, could: 1, shape: 1, context: 1
  };

  function tokens(text) {
    return String(text || '').toLowerCase().split(/[^a-z0-9]+/)
      .filter(function (t) { return t.length >= 4 && !STOPWORDS[t]; });
  }

  /* Split on sentence enders WITHOUT a lookbehind assertion: support for
     it is uneven across the browsers this prototype gets opened in, and
     a regex literal that fails to parse would take the whole file down
     before a single function ran. */
  function sentences(text) {
    var raw = String(text || '');
    var out = [], buf = '';
    for (var i = 0; i < raw.length; i++) {
      var c = raw.charAt(i);
      buf += c;
      if (c === '.' || c === '!' || c === '?') {
        var next = raw.charAt(i + 1);
        if (next === '' || next === ' ' || next === '\n') { out.push(buf.replace(/^\s+|\s+$/g, '')); buf = ''; }
      }
    }
    var tail = buf.replace(/^\s+|\s+$/g, '');
    if (tail) { out.push(tail); }
    return out.filter(function (t) { return t.length > 25; });
  }

  function clip(text, max) {
    var t = String(text || '').trim();
    if (t.length <= max) { return t; }
    var cut = t.slice(0, max);
    var sp = cut.lastIndexOf(' ');
    return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:]$/, '') + '…';
  }

  /* A resource title carries a prefix in the sample content
     ("Introduction — shear strength of soil"). The topic phrase is what
     is left, which reads naturally inside a question stem. */
  function topicPhrase(resource) {
    if (resource.topic) { return resource.topic; }
    var t = String(resource.title || '').split('—');
    var phrase = (t.length > 1 ? t.slice(1).join('—') : t[0]).trim();
    return phrase.charAt(0).toLowerCase() + phrase.slice(1);
  }

  /* ============================================================
     1 · QUESTION DRAFTING

     Drafts are built from the EXPERIMENT'S OWN seeded learning
     resources — real sample content that already exists in this
     prototype — rather than from invented subject matter. The Faculty
     prompt does two things, both deterministic: it seeds the ordering,
     and its words are matched against the source material so that a
     prompt about "specimen preparation" genuinely pulls the
     preparation material to the front.
     ============================================================ */

  /* Faculty-supplied SOURCE MATERIAL becomes additional source items
     alongside the experiment's own learning resources. `STK31-33` is
     explicit that generation must not be prompt-only, so material the
     Faculty member supplies is ranked FIRST when it is present.

     The material is read in the browser and never leaves it. */
  function materialItems(sourceText) {
    var text = String(sourceText || '').replace(/^\s+|\s+$/g, '');
    if (!text) { return []; }
    var chunks = text.split(/\n\s*\n/).map(function (c) {
      return c.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    }).filter(function (c) { return c.length > 40; });
    if (!chunks.length && text.length > 40) { chunks = [text.replace(/\s+/g, ' ')]; }
    return chunks.slice(0, 8).map(function (c, i) {
      var first = sentences(c)[0] || c;
      return {
        id: 'src-' + i,
        title: 'Your material — ' + clip(first, 60),
        /* A short, readable label. A sentence lifted out of the middle
           of a paragraph does not survive being dropped into a question
           stem, so material-sourced drafts use their own templates
           below and this phrase only where it reads naturally.

           ⚠ It must be DISTINCT per chunk. A single shared phrase let the
           false-True/False template pair a chunk with itself and produce
           "the material you supplied and the material you supplied
           describe the same thing", keyed False — a statement that is in
           fact true. */
        topic: chunks.length > 1
          ? 'the material you supplied (extract ' + (i + 1) + ')'
          : 'the material you supplied',
        body: c,
        fromMaterial: true
      };
    });
  }

  function rankResources(experimentId, prompt, sourceText) {
    var supplied = materialItems(sourceText);
    var list = supplied.concat(data.resourcesFor(experimentId).slice());
    var want = tokens(prompt);
    var seed = hash(prompt + '|' + experimentId);
    return list.map(function (r, i) {
      var pool = tokens(r.title + ' ' + r.body);
      var score = 0;
      want.forEach(function (w) {
        if (pool.indexOf(w) !== -1) { score += 2; }
        else if (pool.some(function (t) { return t.indexOf(w) === 0 || w.indexOf(t) === 0; })) { score += 1; }
      });
      /* Supplied material outranks seeded resources at equal relevance:
         the Faculty member chose it. */
      if (r.fromMaterial) { score += 3; }
      return { resource: r, score: score, tie: (seed + i * 2654435761) >>> 0, index: i };
    }).sort(function (a, b) {
      if (a.score !== b.score) { return b.score - a.score; }
      return a.tie - b.tie;
    }).map(function (x) { return x.resource; });
  }

  var TYPE_CYCLE = ['mcq', 'tf', 'descriptive'];

  /* opts: { experimentId, prompt, sourceText, type: 'mixed'|'mcq'|'tf'|'descriptive', count }
     Returns an array of DRAFT objects. A draft is not a Question Bank
     item and has no id in any collection. */
  function draftQuestions(opts) {
    var experimentId = opts.experimentId;
    var prompt = String(opts.prompt || '').trim();
    var count = Math.max(1, Math.min(6, Number(opts.count) || 3));
    var mode = TYPE_CYCLE.indexOf(opts.type) === -1 ? 'mixed' : opts.type;
    var ctx = data.contextOf(experimentId);
    if (!ctx) { return []; }
    var expName = ctx.experiment.name;
    var material = String(opts.sourceText || '').replace(/^\s+|\s+$/g, '');
    var ranked = rankResources(experimentId, prompt, material);
    if (!ranked.length) { return []; }
    var seed = hash(prompt + '|' + material.slice(0, 500) + '|' + experimentId + '|' + mode);

    var out = [];
    for (var i = 0; i < count; i++) {
      var type = mode === 'mixed' ? TYPE_CYCLE[(seed + i) % 3] : mode;
      var primary = ranked[i % ranked.length];
      var other = ranked[(i + 1 + (seed % Math.max(1, ranked.length - 1))) % ranked.length];
      if (other === primary) { other = ranked[(i + 1) % ranked.length]; }
      out.push(buildDraft(type, i, seed, expName, primary, other, ranked, prompt));
    }
    return out;
  }

  function buildDraft(type, i, seed, expName, primary, other, ranked, prompt) {
    var topic = topicPhrase(primary);
    var lead = sentences(primary.body)[0] || primary.body;
    var base = {
      draftId: 'draft-' + i,
      type: type,
      points: type === 'descriptive' ? 3 : 1,
      explanation: '',
      guidance: '',
      options: [],
      answer: null,
      sourceTitle: primary.title,
      fromMaterial: !!primary.fromMaterial,
      prompt: prompt
    };

    if (type === 'mcq') {
      /* The correct option is a real statement from the resource this
         question is about. The distractors are real statements from the
         OTHER resources of the same experiment — wrong here, but
         plausible, which is what a usable distractor has to be. */
      var correct = clip(lead, 150);
      /* Distractors must be DISTINCT from the key and from each other.
         Two sources can open with the same sentence, and a duplicate
         option is a question with two right answers, only one of which
         the key points at. */
      var seenOpt = {};
      seenOpt[correct] = true;
      var distractors = [];
      ranked.forEach(function (rsrc) {
        if (rsrc === primary || distractors.length >= 3) { return; }
        var text = clip(sentences(rsrc.body)[0] || rsrc.body, 150);
        if (!text || seenOpt[text]) { return; }
        seenOpt[text] = true;
        distractors.push(text);
      });
      var opts = [correct].concat(distractors);
      /* Deterministic rotation so the key is not always option 1. */
      var shift = (seed + i) % opts.length;
      var rotated = opts.slice(shift).concat(opts.slice(0, shift));
      base.text = primary.fromMaterial
        ? 'According to the material you supplied, which statement about the ' + expName + ' is correct?'
        : 'In the ' + expName + ', which statement best describes ' + topic + '?';
      base.options = rotated;
      base.answer = rotated.indexOf(correct);
      base.explanation = primary.fromMaterial
        ? 'Drawn from the source material you supplied.'
        : 'Drawn from the experiment’s ' + primary.title.toLowerCase() + ' material.';
      return base;
    }

    if (type === 'tf') {
      var isTrue = ((seed + i) % 2) === 0;
      if (isTrue) {
        base.text = primary.fromMaterial
          ? 'The material you supplied states: ' + clip(lead, 200)
          : 'In the ' + expName + ': ' + clip(lead, 200);
        base.answer = true;
        base.explanation = primary.fromMaterial
          ? 'This restates the source material you supplied.'
          : 'This restates the experiment’s ' + primary.title.toLowerCase() + ' material.';
      } else {
        var otherTopic = topicPhrase(other);
        if (otherTopic === topic) {
          /* Nothing distinct to contrast with — fall back to the true
             form rather than emit a statement keyed False that is
             actually true. */
          base.text = primary.fromMaterial
            ? 'The material you supplied states: ' + clip(lead, 200)
            : 'In the ' + expName + ': ' + clip(lead, 200);
          base.answer = true;
          base.explanation = 'This restates the source material this question was built from.';
          return base;
        }
        base.text = 'In the ' + expName + ', ' + topic + ' and ' + otherTopic +
          ' describe the same thing.';
        base.answer = false;
        base.explanation = 'They are separate parts of the experiment and are covered by different material.';
      }
      return base;
    }

    var cue = sentences(primary.body)[1] || sentences(primary.body)[0] || primary.body;
    base.text = primary.fromMaterial
      ? 'The material you supplied states: “' + clip(lead, 140) + '” Explain what this means for the ' +
        expName + ', and why it matters for the result you report.'
      : 'Explain ' + topic + ' in the ' + expName +
        ', and say why it matters for the result you report.';
    base.guidance = 'Look for: ' + clip(cue, 180);
    return base;
  }

  /* ============================================================
     2 · AI-ASSISTED DESCRIPTIVE REVIEW SUGGESTION

     ⚠ READ THIS BEFORE CHANGING ANYTHING BELOW.

     `ND-09` records that the referenced Taxila auto-review mechanics
     are NOT available in the project sources, and `18_REQUIREMENT_
     SAFETY_CHECK.md` lists "inventing … an auto-review algorithm"
     among the things this project must not do. So this function does
     NOT model one, and the surface that renders it does not present
     one:

       · no confidence score
       · no similarity or match percentage
       · no model, provider or vendor
       · no claim that the suggested figure is correct
       · no claim that this is how a production auto-review scores

     What it does instead is deliberately small, and — this matters — it
     does not pretend to have no arithmetic. A suggested figure has to
     come from somewhere. It comes from the OBSERVATIONS the screen shows
     under "Why this was suggested": how long the answer is, and which
     points from the Faculty member's own evaluation guidance appear in
     it. That is the whole derivation, and it is a crude placeholder —
     not a model of anything.

     ⚠ THE CLAIM MUST STAY ACCURATE. Earlier wording here promised "no
     weighting, threshold or scoring band" while the function plainly
     contains a weighted blend and length bands — a claim the code
     contradicted. The claim is therefore what it should always have
     been: nothing here is presented as, or asserted to be, how a
     production auto-review scores a written answer. That question is
     `ND-09`, and it is left open.

     ⚠ WHERE THAT IS SAID. It used to be said in a paragraph inside the
     suggestion panel, which put implementation-facing prose in the
     middle of a Faculty member's review. The OBSERVATIONS stay on the
     screen — they are what the figure came from, so the reader can see
     it — but the account of what `ND-09` leaves unspecified now lives in
     README.md and QA_CHECKLIST.md. Removing it from both places would
     make this comment false; keep it in the documentation.

     The Faculty member remains the evaluator. Nothing here writes a
     result; `state.finaliseReview` is the only writer, and only a
     Faculty member calls it.
     ============================================================ */

  function keyTerms(question) {
    /* The evaluation guidance Faculty wrote comes first; the question
       text is the fallback when there is no guidance. */
    var src = (question && question.guidance) ? question.guidance : (question ? question.text : '');
    /* Evaluation guidance is conventionally written as "Look for: …".
       That prefix is an instruction to the marker, not a point the
       answer has to contain, so it is dropped before the comparison. */
    src = String(src || '').replace(/^\s*(look for|check for|expect)\s*:?\s*/i, '');
    var seen = {}, out = [];
    tokens(src).forEach(function (t) {
      if (seen[t]) { return; }
      seen[t] = true;
      out.push(t);
    });
    return out.slice(0, 8);
  }

  function reviewSuggestion(input) {
    var answer = String(input.answer || '').replace(/^\s+|\s+$/g, '');
    var max = Number(input.maxMarks) || 1;
    var q = input.question || null;
    var terms = keyTerms(q);
    var words = answer ? answer.split(/\s+/).filter(Boolean).length : 0;
    var pool = tokens(answer);
    var matched = terms.filter(function (t) {
      return pool.indexOf(t) !== -1 ||
        pool.some(function (w) { return w.indexOf(t) === 0 || t.indexOf(w) === 0; });
    });
    var missing = terms.filter(function (t) { return matched.indexOf(t) === -1; });
    var hasGuidance = !!(q && q.guidance);

    /* Observations only. No ratio, no percentage, no score, and — since
       these are read by a Faculty member mid-review — phrased as short
       labelled facts rather than as a diagnostic dump. The long-form
       account of WHY the derivation is only a placeholder is documentation
       (README § assistance, QA_CHECKLIST), not product copy. */
    var reasons = [
      { label: 'Answer length', value: words + ' ' + (words === 1 ? 'word' : 'words') },
      { label: hasGuidance ? 'Guidance points found' : 'Question terms found',
        value: matched.length ? matched.join(', ') : 'None' },
      { label: hasGuidance ? 'Guidance points not found' : 'Question terms not found',
        value: missing.length ? missing.join(', ') : 'None' }
    ];
    if (!hasGuidance) {
      reasons.push({ label: 'Evaluation guidance', value: 'None set for this question' });
    }

    if (!words) {
      return {
        marks: 0,
        feedback: 'No answer was written for this question.',
        reasons: reasons
      };
    }

    var coverage = terms.length ? matched.length / terms.length : 0.5;
    var lengthBand = words < 15 ? 0.25 : words < 35 ? 0.6 : words < 120 ? 1 : 0.85;
    var marks = Math.round(max * ((coverage * 0.75) + (lengthBand * 0.25)) * 2) / 2;
    if (marks > max) { marks = max; }
    if (marks < 0) { marks = 0; }

    /* With no evaluation guidance there are no terms to compare, so
       `coverage` is the neutral 0.5 and there is nothing to name as
       missing. Saying "Missing or unclear: ." would be a sentence about
       nothing. */
    var feedback;
    if (!terms.length) {
      feedback = 'No evaluation guidance was set for this question, so there is nothing to compare the ' +
        'answer against. Read it and decide.';
    } else if (coverage >= 0.75) {
      feedback = 'Covers the points your evaluation guidance asks for.' +
        (missing.length ? ' You could go further on: ' + missing.join(', ') + '.' : '');
    } else if (coverage >= 0.4) {
      feedback = 'Part of the expected reasoning is here. Missing or unclear: ' + missing.join(', ') + '.';
    } else {
      feedback = 'The answer does not yet address the points your evaluation guidance asks for' +
        (missing.length ? ': ' + missing.join(', ') : '') + '.';
    }

    return {
      marks: marks,
      feedback: feedback.replace(/^\s+|\s+$/g, ''),
      reasons: reasons
    };
  }

  return {
    draftQuestions: draftQuestions,
    reviewSuggestion: reviewSuggestion,
    /* exported for the QA note on the drafting screen */
    rankResources: rankResources
  };
})();
