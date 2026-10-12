import type { Specimen } from '../types';
import {
  ChoiceSpecimen,
  FieldSpecimen,
  SelectSpecimen,
  TextareaSpecimen,
  TextInputSpecimen,
} from './forms-a';

export const FORMS_A_SPECIMENS: Readonly<Record<string, Specimen>> = {
  'c-field': {
    title: 'Field: label, marker, hint, error on the primary action, read-only value',
    source:
      '03 "Form controls"; B2-07 "IA-10 Add student · 1440 · interactive"; B2-05 "IA-05 Give students access · 1440 · interactive · start here"',
    render: () => <FieldSpecimen />,
  },
  'c-text-input': {
    title: 'TextInput: text, e-mail (invalid), tel, date, toolbar search',
    source:
      '03 "Text input", "Checkbox · radio · search"; 09a "AR-2 · used by catalogue, queues, people, content lists"; B1-07 "PU-08 Request institutional access · 1440 · interactive"',
    render: () => <TextInputSpecimen />,
  },
  'c-select': {
    title: 'Select: long value, toolbar filter, invalid',
    source:
      '03 "Textarea · select · file", "Long values · at 375 and 768"; 09a "AR-2 · used by catalogue, queues, people, content lists"; B7-08 "SA-17 Role holder · Dr K. Iyer · no scope · 1440 · interactive"',
    render: () => <SelectSpecimen />,
  },
  'c-textarea': {
    title: 'Textarea: hint, optional, invalid reason',
    source: '03 "Textarea · select · file", "Decision panel and editable table"',
    render: () => <TextareaSpecimen />,
  },
  'c-choice': {
    title:
      'Checkbox and radio groups, choice cards (checked, unavailable), group errors under and before the options',
    source:
      '03 "Checkbox · radio · search", "Decision panel and editable table"; B1-07 "PU-08 Request institutional access · 1440 · interactive"; B1-11 "SA-03 Request decision · REQ-0042 · 1440 · interactive"; B5-04 "VE-04 Formats and delivery · step 2 · 1440 · interactive · 11 Aug 2026"',
    render: () => <ChoiceSpecimen />,
  },
};
