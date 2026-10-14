'use client';

import { ConfirmDialog, EditDialog, Field, ReasonDialog, Textarea, TextInput } from '@xr/ui';

/**
 * Board 10 "Dialogs DL-1 · DL-2 · DL-3" (WP-0.15 parity): each drawn state as the product dialog
 * renders it, open on its own page (native `dialog.xr-dialog`, top layer, PF-04). The reason box's
 * 96 px is the board's per-dialog composition (`textarea style="min-height: 96px"`).
 */
export type DialogState =
  | 'dl1-default'
  | 'dl1-destructive'
  | 'dl2-validation'
  | 'dl2-busy'
  | 'dl3-default'
  | 'dl3-validation'
  | 'phone';

const noop = () => undefined;

export function B10Dialog({ state }: { readonly state: DialogState }) {
  switch (state) {
    case 'dl1-default':
      return (
        <ConfirmDialog
          open
          title="Publish Shell-and-Tube Heat Exchanger?"
          effect="It will appear in the public catalogue with WEB and VR. Institutions still need access before their students can open it."
          confirmLabel="Publish"
          onConfirm={noop}
          onCancel={noop}
        />
      );
    case 'dl1-destructive':
      return (
        <ConfirmDialog
          open
          destructive
          title="Remove Priya Natarajan from Section A?"
          effect="You can add her to the group again later."
          confirmLabel="Remove from group"
          onConfirm={noop}
          onCancel={noop}
        />
      );
    case 'dl2-validation':
    case 'dl2-busy': {
      const busy = state === 'dl2-busy';
      return (
        <ReasonDialog
          open
          destructive={busy}
          busy={busy}
          busyLabel="Withdrawing…"
          title={busy ? 'Withdraw Rahul Verma’s access?' : 'Return to vendor?'}
          effect={
            busy
              ? 'He will no longer be able to open Shell-and-Tube Heat Exchanger.'
              : 'The vendor sees your reason and can revise and resubmit.'
          }
          confirmLabel={busy ? 'Withdraw access' : 'Return to vendor'}
          onConfirm={noop}
          onCancel={noop}
        >
          <Field
            id={busy ? 'sp-r2' : 'sp-r1'}
            label={busy ? 'Reason' : 'Reason the vendor will see'}
            error={busy ? undefined : 'Add a reason so the vendor knows what to change'}
          >
            <Textarea
              style={{ minHeight: 96 }}
              defaultValue={busy ? 'Moved to a different course group.' : ''}
            />
          </Field>
        </ReasonDialog>
      );
    }
    case 'dl3-default':
    case 'dl3-validation': {
      const invalid = state === 'dl3-validation';
      return (
        <EditDialog open title="Rename group" confirmLabel="Save" onConfirm={noop} onCancel={noop}>
          <Field
            id={invalid ? 'sp-n2' : 'sp-n1'}
            label="Group name"
            error={invalid ? 'Enter a group name' : undefined}
          >
            <TextInput defaultValue={invalid ? '' : 'ME ZG523 · Sem II · Section A'} />
          </Field>
        </EditDialog>
      );
    }
    case 'phone':
      return (
        <ReasonDialog
          open
          title="Return to vendor?"
          effect="The vendor sees your reason and can revise and resubmit."
          confirmLabel="Return to vendor"
          onConfirm={noop}
          onCancel={noop}
        >
          <Field id="m-r" label="Reason the vendor will see">
            <Textarea style={{ minHeight: 96 }} />
          </Field>
        </ReasonDialog>
      );
  }
}
