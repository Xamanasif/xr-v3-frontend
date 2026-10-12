'use client';

import {
  AccountMenu,
  Button,
  ConfirmDialog,
  DrawerCloseButton,
  DrawerMenuButton,
  DrawerScrim,
  EditDialog,
  Icon,
  RailTooltip,
  ReasonDialog,
  useDrawer,
  type AccountMenuItem,
  type DialogAlign,
  type IconName,
} from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

/**
 * Overlay specimens (Appendix E §3.4; board 10 dialogs, boards 05/06/12 drawer, account menu and
 * rail tooltip). Harness state stands in for the caller: it opens and closes the dialogs, applies
 * the board's validation messages, and finishes a busy confirm after a short wait, as board 10
 * "Try it · keyboard and pointer" does. The dialogs report Cancel while busy too (no board
 * disables it); this harness then abandons the pending wait, so nothing changes. Nothing here is
 * a product screen.
 */

/** How long a confirmed dialog stays busy before the harness closes it (board 10 waits 1100 ms). */
const BUSY_MS = 2000;

/**
 * Harness only: marks the specimen root once React has hydrated it, so the browser specs press
 * keys only when the handlers are attached (`[data-ready]`).
 */
function markReady(element: HTMLElement | null): void {
  element?.setAttribute('data-ready', 'true');
}

type DialogId = 'publish' | 'remove' | 'return' | 'withdraw' | 'rename';

interface Result {
  readonly title?: string;
  readonly body: string;
}

/** The harness's stand-in for an action in progress: what it shows when it finishes. */
interface Pending {
  readonly result: Result;
  /** DL-3: the new group name, applied when the wait ends. */
  readonly groupName?: string;
}

function FieldError({ id, message }: { readonly id: string; readonly message: string }) {
  return (
    <span id={id} className="xr-error">
      <Icon name="failed" />
      {message}
    </span>
  );
}

/**
 * Board 10 "Try it · keyboard and pointer": DL-1 Publish, destructive DL-1 Remove from group,
 * DL-2 Return to vendor and Withdraw access, DL-3 Rename group. Removing the member removes the
 * dialog's trigger, so focus goes to the flash notice (Appendix E §5.3).
 */
export function DialogSpecimen() {
  const [openId, setOpenId] = useState<DialogId | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const busy = pending !== null;
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [groupName, setGroupName] = useState('ME ZG523 · Sem II · Section A');
  const [memberShown, setMemberShown] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [confirms, setConfirms] = useState(0);
  const flash = useRef<HTMLDivElement>(null);

  // The wait ends after BUSY_MS; a cancel clears `pending` first, which abandons it.
  useEffect(() => {
    if (!pending) return undefined;
    const timer = window.setTimeout(() => {
      if (pending.groupName !== undefined) setGroupName(pending.groupName);
      setPending(null);
      setOpenId(null);
      setResult(pending.result);
    }, BUSY_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  const show = (id: DialogId) => {
    setOpenId(id);
    setPending(null);
    setReason('');
    setReasonError(undefined);
    setNameError(undefined);
    setResult(null);
    if (id === 'rename') setDraftName(groupName);
  };
  const cancel = () => {
    setPending(null);
    setOpenId(null);
  };
  const finish = (result: Result, groupNameAfter?: string) => {
    setPending({ result, groupName: groupNameAfter });
  };
  const common = (id: DialogId) => ({
    open: openId === id,
    busy: openId === id && busy,
    onCancel: cancel,
  });

  return (
    <div className="xr-app" data-probe="app" ref={markReady}>
      <main className="xr-page" id="main">
        <div className="xr-content">
          <h1 className="xr-h1">Dialogs</h1>
          <div className="xr-phead-actions">
            <Button variant="primary" onClick={() => show('publish')}>
              Publish…
            </Button>
            <Button variant="secondary" onClick={() => show('return')}>
              Return to vendor…
            </Button>
            <Button variant="danger-quiet" onClick={() => show('withdraw')}>
              Withdraw access…
            </Button>
            <Button variant="secondary" onClick={() => show('rename')}>
              Rename group…
            </Button>
          </div>
          <p className="xr-meta">
            Group name now: <strong data-probe="group-name">{groupName}</strong>
          </p>
          {memberShown ? (
            <p>
              Priya Natarajan ·{' '}
              <Button variant="danger-quiet" size="sm" onClick={() => show('remove')}>
                Remove from group…
              </Button>
            </p>
          ) : null}
          <p className="xr-meta" data-probe="confirms">{`Confirm presses: ${confirms}`}</p>
          <div role="status" tabIndex={-1} ref={flash} data-probe="flash">
            {result ? (
              <div className="xr-notice xr-notice--ok">
                <Icon name="reviewedByMe" />
                <div className="xr-notice-body">
                  {result.title ? <span className="xr-notice-title">{result.title}</span> : null}
                  <span>{result.body}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <ConfirmDialog
        {...common('publish')}
        returnFocusFallback={flash}
        title="Publish Shell-and-Tube Heat Exchanger?"
        effect="It will appear in the public catalogue with WEB and VR. Institutions still need access before their students can open it."
        confirmLabel="Publish"
        busyLabel="Publishing…"
        onConfirm={() => {
          setConfirms((count) => count + 1);
          finish({
            title: 'Published',
            body: 'Shell-and-Tube Heat Exchanger is now in the public catalogue.',
          });
        }}
      />

      <ConfirmDialog
        {...common('remove')}
        returnFocusFallback={flash}
        destructive
        title="Remove Priya Natarajan from Section A?"
        effect="You can add her to the group again later."
        confirmLabel="Remove from group"
        onConfirm={() => {
          setConfirms((count) => count + 1);
          setMemberShown(false);
          setOpenId(null);
          setResult({ body: 'Priya Natarajan was removed from the group.' });
        }}
      />

      <ReasonDialog
        {...common('return')}
        returnFocusFallback={flash}
        title="Return to vendor?"
        effect="The vendor sees your reason and can revise and resubmit."
        confirmLabel="Return to vendor"
        busyLabel="Returning…"
        onConfirm={() => {
          setConfirms((count) => count + 1);
          if (!reason.trim()) {
            setReasonError('Add a reason so the vendor knows what to change');
            return;
          }
          setReasonError(undefined);
          finish({
            title: 'Returned to vendor',
            body: 'Northline Simulation Studio can see your reason.',
          });
        }}
      >
        <div className="xr-field">
          <label className="xr-label" htmlFor="specimen-return-reason">
            Reason the vendor will see
          </label>
          <textarea
            id="specimen-return-reason"
            className="xr-textarea"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={openId === 'return' && reasonError ? true : undefined}
            aria-describedby={
              openId === 'return' && reasonError ? 'specimen-return-err' : undefined
            }
          />
          {openId === 'return' && reasonError ? (
            <FieldError id="specimen-return-err" message={reasonError} />
          ) : null}
        </div>
      </ReasonDialog>

      <ReasonDialog
        {...common('withdraw')}
        returnFocusFallback={flash}
        destructive
        title="Withdraw Rahul Verma’s access?"
        effect="He will no longer be able to open Shell-and-Tube Heat Exchanger."
        confirmLabel="Withdraw access"
        busyLabel="Withdrawing…"
        onConfirm={() => {
          setConfirms((count) => count + 1);
          if (!reason.trim()) {
            setReasonError('Add a reason for withdrawing access');
            return;
          }
          setReasonError(undefined);
          finish({
            title: 'Access withdrawn',
            body: 'Rahul Verma can no longer open Shell-and-Tube Heat Exchanger.',
          });
        }}
      >
        <div className="xr-field">
          <label className="xr-label" htmlFor="specimen-withdraw-reason">
            Reason
          </label>
          <textarea
            id="specimen-withdraw-reason"
            className="xr-textarea"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={openId === 'withdraw' && reasonError ? true : undefined}
            aria-describedby={
              openId === 'withdraw' && reasonError ? 'specimen-withdraw-err' : undefined
            }
          />
          {openId === 'withdraw' && reasonError ? (
            <FieldError id="specimen-withdraw-err" message={reasonError} />
          ) : null}
        </div>
      </ReasonDialog>

      <EditDialog
        {...common('rename')}
        returnFocusFallback={flash}
        title="Rename group"
        confirmLabel="Save"
        busyLabel="Saving…"
        onConfirm={() => {
          setConfirms((count) => count + 1);
          const name = draftName.trim();
          if (!name) {
            setNameError('Enter a group name');
            return;
          }
          setNameError(undefined);
          finish({ title: 'Group renamed', body: `The group is now called “${name}”.` }, name);
        }}
      >
        <div className="xr-field">
          <label className="xr-label" htmlFor="specimen-group-name">
            Group name
          </label>
          <input
            id="specimen-group-name"
            className="xr-input"
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? 'specimen-group-name-err' : undefined}
          />
          {nameError ? <FieldError id="specimen-group-name-err" message={nameError} /> : null}
        </div>
      </EditDialog>
    </div>
  );
}

/**
 * Board 10 "Keyboard path and phone layout" ("Return to vendor?" with its reason field), open on
 * load with one PF-04 alignment, for the geometry checks: bottom sheet below 600, the modifiers
 * from 600 (VD-08 mapping provisional).
 */
export function DialogAlignSpecimen({ align }: { readonly align: DialogAlign }) {
  const [open, setOpen] = useState(true);
  const [reason, setReason] = useState('');
  return (
    <div className="xr-app" data-probe="app" ref={markReady}>
      <main className="xr-page" id="main">
        <h1 className="xr-h1">Review a submission</h1>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Return to vendor…
        </Button>
      </main>
      <ReasonDialog
        open={open}
        align={align}
        title="Return to vendor?"
        effect="The vendor sees your reason and can revise and resubmit."
        confirmLabel="Return to vendor"
        onConfirm={() => undefined}
        onCancel={() => setOpen(false)}
      >
        <div className="xr-field">
          <label className="xr-label" htmlFor="specimen-align-reason">
            Reason the vendor will see
          </label>
          <textarea
            id="specimen-align-reason"
            className="xr-textarea"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      </ReasonDialog>
    </div>
  );
}

const STUDENT_NAV: readonly { label: string; href: string; icon: IconName }[] = [
  { label: 'Home', href: '#home', icon: 'home' },
  { label: 'My courses', href: '#my-courses', icon: 'myCourses' },
  { label: 'Assessments', href: '#assessments', icon: 'assessments' },
  { label: 'Progress', href: '#progress', icon: 'progress' },
];

function studentAccountItems(onSignOut: () => void): readonly AccountMenuItem[] {
  return [
    { kind: 'link', label: 'My device', href: '#my-device', icon: 'myDevice' },
    { kind: 'link', label: 'Help', href: '#help', icon: 'help' },
    { kind: 'separator' },
    { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: onSignOut },
  ];
}

/**
 * Board 05 / board 06 "Drawer · Student · 375 px": the workspace shell composed with useDrawer,
 * the Menu / Close menu buttons and the scrim (below 1024), rail tooltips (1024–1279) and the
 * account menu in the top bar. The shell itself is WP-0.8's; this is only its overlay behaviour.
 */
export function DrawerSpecimen() {
  const drawer = useDrawer();
  return (
    <div className="xr-app" data-probe="app" ref={markReady}>
      <a className="xr-skip" href="#main" {...drawer.backgroundProps}>
        Skip to main content
      </a>
      <div
        className={drawer.shellClassName ? `xr-shell ${drawer.shellClassName}` : 'xr-shell'}
        data-probe="shell"
      >
        <aside
          className="xr-side"
          aria-label="Student workspace"
          data-probe="side"
          {...drawer.sideProps}
        >
          <div className="xr-side-head">
            <div className="xr-side-top">
              <div className="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div>
              <DrawerCloseButton {...drawer.closeButtonProps} />
            </div>
            <span className="xr-product">XR Learning Platform</span>
          </div>
          <div className="xr-ws">
            <span className="xr-ws-label">Student</span>
            <span className="xr-ws-inst">Godavari Institute of Technology</span>
          </div>
          <nav aria-label="Student navigation">
            <ul className="xr-nav">
              {STUDENT_NAV.map((item, index) => (
                <li key={item.href}>
                  <a href={item.href} aria-current={index === 0 ? 'page' : undefined}>
                    <Icon name={item.icon} />
                    <span className="xr-nav-text">{item.label}</span>
                    <RailTooltip>{item.label}</RailTooltip>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="xr-side-foot">
            <ul className="xr-nav">
              <li>
                <a href="#help">
                  <Icon name="help" />
                  <span className="xr-nav-text">Help</span>
                  <RailTooltip>Help</RailTooltip>
                </a>
              </li>
            </ul>
          </div>
        </aside>
        <DrawerScrim {...drawer.scrimProps} />
        <div className="xr-main" data-probe="main" {...drawer.backgroundProps}>
          <header className="xr-top">
            <DrawerMenuButton {...drawer.menuButtonProps} />
            <div className="xr-top-loc">
              <span className="xr-top-title">Home</span>
              <ol className="xr-crumbs" aria-label="You are here">
                <li>
                  <span aria-current="page">Home</span>
                </li>
              </ol>
            </div>
            <AccountMenu
              name="Rahul Verma"
              role="Student"
              organisation="Godavari Institute of Technology"
              initials="RV"
              items={studentAccountItems(() => undefined)}
            />
          </header>
          <main className="xr-page" id="main" tabIndex={-1}>
            <span className="xr-overline">Student</span>
            <h1 className="xr-h1">Home</h1>
            <a href="#main" data-probe="page-link">
              A link on the page
            </a>
            <div className="specimen-spacer" aria-hidden="true" />
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Board 03 "Account menu" / B3-07 "Entry · account menu (Rahul has VR)": the disclosure in the top
 * bar (navy, avatar only below 1024; name and role from 1024), then the page.
 */
export function AccountMenuSpecimen() {
  const [signOuts, setSignOuts] = useState(0);
  return (
    <div className="xr-app" data-probe="app" ref={markReady}>
      <header className="xr-top">
        <div className="xr-top-loc">
          <span className="xr-top-title">My device</span>
          <ol className="xr-crumbs" aria-label="You are here">
            <li>
              <span aria-current="page">My device</span>
            </li>
          </ol>
        </div>
        <AccountMenu
          name="Rahul Verma"
          role="Student"
          organisation="Godavari Institute of Technology"
          initials="RV"
          items={studentAccountItems(() => setSignOuts((count) => count + 1))}
        />
      </header>
      <main className="xr-page" id="main" tabIndex={-1}>
        <h1 className="xr-h1">My device</h1>
        <a href="#main" data-probe="after-menu">
          A link after the account menu
        </a>
        <p role="status" data-probe="sign-outs">{`Sign out pressed ${signOuts}`}</p>
      </main>
    </div>
  );
}

const ADMIN_NAV: readonly { label: string; href: string; icon: IconName }[] = [
  { label: 'Overview', href: '#overview', icon: 'overview' },
  { label: 'Content access', href: '#content-access', icon: 'contentAccess' },
  { label: 'Student access', href: '#student-access', icon: 'studentAccess' },
  { label: 'People', href: '#people', icon: 'studentsPeople' },
  { label: 'Requests', href: '#requests', icon: 'requests' },
  { label: 'Usage', href: '#usage', icon: 'usage' },
];

/** Board 06 "Rail · Institute Admin · tooltip on hover and focus" (the standalone 72 px rail). */
export function RailTooltipSpecimen() {
  return (
    <div className="xr-app" data-probe="app" ref={markReady}>
      <aside
        className="xr-side xr-side--rail"
        aria-label="Institute Admin workspace"
        data-probe="rail"
      >
        <div className="xr-side-head">
          <div className="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div>
        </div>
        <nav aria-label="Institute Admin navigation">
          <ul className="xr-nav">
            {ADMIN_NAV.map((item, index) => (
              <li key={item.href}>
                <a href={item.href} aria-current={index === 0 ? 'page' : undefined}>
                  <Icon name={item.icon} />
                  <span className="xr-nav-text">{item.label}</span>
                  <RailTooltip>{item.label}</RailTooltip>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="xr-side-foot">
          <ul className="xr-nav">
            <li>
              <a href="#help">
                <Icon name="help" />
                <span className="xr-nav-text">Help</span>
                <RailTooltip>Help</RailTooltip>
              </a>
            </li>
          </ul>
        </div>
      </aside>
      <main className="xr-page" id="main">
        <h1 className="xr-h1">Overview</h1>
      </main>
    </div>
  );
}
