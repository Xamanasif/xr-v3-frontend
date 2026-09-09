# Question Bank import — the file format

| | |
|---|---|
| **Scope** | The spreadsheet a Faculty member uploads at **Question Bank → Import questions** |
| **Formats** | `.csv` and `.xlsx` |
| **Authority** | The columns and rules below are generated from one array — `COLUMNS` in `js/question-import.js`. The downloadable template, the on-screen column table, the validator and this document all read it, so they cannot drift apart |
| **Not** | A bulk-assessment import. Imported questions go into the **Question Bank only**; adding them to an assessment is a separate, deliberate step, exactly as it is for a question typed by hand |

---

## 1 · The columns

The header row must carry every **required** column. Order does not matter, capitalisation does not
matter, and `question type` / `question_type` / `Question Type` are all accepted.

| Column | Needed for | What it must contain |
|---|---|---|
| `question_type` | **Required** | One of `multiple_choice`, `true_false`, `descriptive` |
| `question` | **Required** | The question text a student reads. Up to 2000 characters |
| `option_a` … `option_d` | Multiple choice only | At least two must be filled in for a multiple-choice question. Ignored for the other types. Up to 600 characters each |
| `correct_answer` | Multiple choice and true/false | MCQ: the letter of the correct option (`a`, `b`, `c` or `d`), or its exact text. True/false: `TRUE` or `FALSE`. Descriptive: leave it blank |
| `marks` | **Required** | A whole number between 1 and 100 — the same rule the *Add a question* form enforces |
| `explanation` | Optional | Shown after an attempt, exactly as it is for a question added by hand. Up to 2000 characters |

### 1.1 · Accepted spellings

The type column is generous about spelling, because a spreadsheet written by a person is. These all
resolve to the same three product types, and **nothing else does**:

| Product type | Accepted in the file |
|---|---|
| Multiple choice | `multiple_choice` · `multiple choice` · `multiplechoice` · `multi_choice` · `mcq` |
| True / false | `true_false` · `true false` · `true/false` · `truefalse` · `tf` · `boolean` |
| Descriptive | `descriptive` · `long_answer` · `long answer` · `written` · `essay` |

`TRUE` / `FALSE` may also be written `T` / `F`, `yes` / `no`, or `1` / `0`.

> **No question type is invented.** The Question Bank stores exactly three, and a file asking for a
> fourth — `matching`, `fill_in_the_blank`, `ordering` — is refused with the row named, rather than
> being coerced into something the bank can hold.

---

## 2 · Example

```
question_type,question,option_a,option_b,option_c,option_d,correct_answer,marks,explanation
multiple_choice,Which laboratory test measures shear strength along a predefined failure plane?,Direct shear test,Triaxial compression test,Consolidation test,Permeability test,a,2,The direct shear test forces failure along the horizontal plane of the shear box.
true_false,A normally consolidated clay has a preconsolidation pressure greater than its current overburden pressure.,,,,,FALSE,1,For a normally consolidated soil the two pressures are equal.
descriptive,Explain how pore water pressure affects effective stress in a saturated soil.,,,,,,5,
```

This is the downloadable template. It carries one row of each supported type — including a
descriptive row with an empty answer, so the file itself demonstrates that the answer column is not
universal.

**Download it from the import screen**, as CSV or as XLSX. Both are generated from the column
contract, and the template you download re-imports with zero errors.

---

## 3 · How the import behaves

### 3.1 · The Course and Experiment are chosen before the file

Every imported question is filed against **one Experiment**, and against the Course that Experiment
belongs to. You choose it on the import screen, from the experiments mapped to you, **before**
choosing a file.

> **A row cannot name its own Experiment, and there is no column for one.** If there were, a file
> could file questions against an Experiment its author holds no mapping for, and a Faculty member's
> scope would be decided by whoever wrote the spreadsheet. The chosen Experiment is checked against
> your mappings before a single row is read, and checked again at the moment of writing.

### 3.2 · Nothing is written until you confirm

Choosing a file parses it, validates every row and shows you a preview. **Your Question Bank is not
touched.** Navigating away, choosing a different file, or pressing *Start again* leaves it exactly as
it was.

The preview shows the **resolved** values — the mapped question type, the options that were kept, and
which option the answer key landed on — because that resolution is the part you cannot check by
re-reading your own spreadsheet.

### 3.3 · All or nothing

If any row carries a blocking error, **the whole file is blocked**. You cannot end up with half a
file in your bank and no way to tell which half — and there is no per-question undo that would leave
an assessment holding a copy of a question that was never meant to exist.

### 3.4 · What is checked

| Checked | Blocking? |
|---|---|
| The file extension is `.csv` or `.xlsx` — and, for a workbook, that the bytes really are one | **Yes** |
| Every required column is present in the header | **Yes** |
| The file has a header row and at least one question row | **Yes** |
| At most 500 question rows | **Yes** — a larger file is *refused*, never silently trimmed |
| The question type is present and is one this platform supports | **Yes** |
| The question text is present, and within 2000 characters | **Yes** |
| Marks are present, a whole number, and between 1 and 100 | **Yes** |
| A multiple-choice row has at least two options | **Yes** |
| Its correct answer names one of those options, and that option is not empty | **Yes** |
| A true/false row's answer reads as TRUE or FALSE | **Yes** |
| Options or explanations within their length limits | **Yes** |
| A duplicate of a question already in your bank for this Experiment | No — a warning |
| A row repeated within the file | No — a warning |
| An answer or options on a descriptive row | No — a warning; they are ignored |
| Options on a true/false row | No — a warning; they are ignored |

Every blocking problem is reported with **the row number as your spreadsheet shows it** (the header
is row 1, so the first question is row 2), the column, what is wrong, and how to correct it.

### 3.5 · Duplicates are flagged, never resolved for you

An identical question — same text, same type, same Experiment — is reported and **left to you**.
Importing it adds a second copy. Nothing is deleted, merged or skipped on your behalf, because
nothing in this product establishes that a repeated question is a mistake.

The same sentence asked as a *true/false* and again as a *descriptive* is two different questions,
and is not treated as a duplicate.

### 3.6 · Provenance

An imported question records that it came from a file, and which kind — *Imported from CSV* or
*Imported from XLSX*. That is kept **separate** from a draft made with assistance: an imported
question was written by a person, and labelling it as AI-assisted would be a false statement about
authorship in the one place a reader goes to check authorship.

Once imported, a question is an ordinary Question Bank question. Edit, delete and adding it to an
assessment all work exactly as they do for one typed by hand, and editing it does not rewrite where
it came from.

---

## 4 · Spreadsheet notes

- **Ordinary Excel output is read correctly**, including the self-closing empty cells Excel,
  LibreOffice and openpyxl all emit for styled blank cells, omitted blank rows, shared strings,
  inline strings, numeric cells and boolean cells.
- **Save as `.xlsx`**, not `.xls`. The older binary format is a different container and is not read;
  the import says so and tells you what to do instead.
- **Only the first worksheet is read.** Its name is shown on the import screen so you can confirm the
  right one was picked up.
- **A formula is read at its last calculated value.** If a cell shows `#REF!` in your spreadsheet, it
  arrives as `#REF!` here and is reported as an invalid value rather than guessed at.
- **Number formatting is not applied.** This matters for nothing in this schema — `marks` is a plain
  whole number — but a date-formatted cell would arrive as the serial number the spreadsheet stores.
- **A leading apostrophe** (`'2`), which some spreadsheets use to force text, becomes part of the
  value and will fail a marks check. Remove it.
- **Blank rows are ignored**, wherever they are — and they do **not** shift the row numbers you are
  shown. A problem on the row your spreadsheet calls row 7 is reported as row 7, whatever is above it.
- **A column this import does not recognise is named, not silently dropped.** Extra columns of your
  own are fine and are simply ignored; the warning exists so a *mistyped* column name — `optionB`
  where the schema says `option_b` — is visible rather than quietly costing you an answer option.
- **CSV encoding:** UTF-8 is expected, and Excel's byte-order mark is handled. Quoted values, commas
  and line breaks inside quotes, escaped quotes (`""`) and CRLF line endings are all handled.

---

## 5 · Why the spreadsheet support is first-party

`README.md` records this build's technology as *"Dependency-free HTML + CSS + vanilla JS (ES5-style)
… No framework, no build step, no backend"*, and
`17-stakeholder-correction-blueprint/11_XR_DELIVERY_AND_DEVICE_MODEL.md` §2 rules a CDN out of
scope. A vendored spreadsheet library would break the first of those; a CDN script tag would break
both.

So no third-party parser was added. `js/xlsx.js` implements exactly the subset an import needs, from
the published formats — a ZIP container reader, a raw DEFLATE decompressor, CRC-32 for writing, and
enough SpreadsheetML to walk a worksheet and its shared strings into rows. There is no network access
at build time or run time, and the prototype still opens from `file://`.
