import type { Specimen } from '../types';
import {
  ErrorSummarySpecimen,
  FileInputSpecimen,
  FormFooterSpecimen,
  SegmentedControlSpecimen,
  StepperSpecimen,
} from './forms-b';

export const FORMS_B_SPECIMENS: Readonly<Record<string, Specimen>> = {
  'c-segmented-control': {
    title: 'SegmentedControl: pressed, switching one list view',
    source: '03 "Segmented control"; B2-05 "Step 2 · students"',
    render: () => <SegmentedControlSpecimen />,
  },
  'c-file-input': {
    title: 'FileInput in a Field: label, marker, hint, native chooser',
    source: '03 "Textarea · select · file"; 07 "State 1 · Report a problem · Student"',
    render: () => <FileInputSpecimen />,
  },
  'c-stepper': {
    title: 'Stepper: done, current, upcoming; count; phone rule',
    source: '03 "Stepper · guided flows (AR-5)"; 09a "Guided flow — “What do I do in this step?”"',
    render: () => <StepperSpecimen />,
  },
  'c-error-summary': {
    title: 'ErrorSummary: shown on submit, focused, links focus fields (xw-errsum, VD-22)',
    source: 'B4-04 "Step 2 · validation"; 12 "Patterns"; 03 "Form controls"',
    render: () => <ErrorSummarySpecimen />,
  },
  'c-form-footer': {
    title: 'FormFooter: Cancel, Back, destructive; Save and primary; busy; phone stacking',
    source:
      '03 "Button order"; B2-05 "Step 3 · review"; B4-04 "Step 2 · rules start empty"; B6-09 "Correction draft (AR-8) · just opened from Edit catalogue details · 1440"',
    render: () => <FormFooterSpecimen />,
  },
};
