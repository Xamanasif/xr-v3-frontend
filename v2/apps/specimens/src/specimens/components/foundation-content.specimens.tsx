import type { Specimen } from '../types';
import {
  FormatBadgeSpecimen,
  LinksSpecimen,
  MessageConfirmationSpecimen,
  MessagePageSpecimen,
  NoticeSpecimen,
  ShellBannerSpecimen,
  StatesSpecimen,
  StatusPillSpecimen,
} from './foundation-content';

export const FOUNDATION_CONTENT_SPECIMENS: Readonly<Record<string, Specimen>> = {
  'c-links': {
    title: 'Link, BackLink, JumpLink: inline, external, back, "Go to decision" to the panel',
    source:
      '02 "Links and focus"; 03 "Back link"; 09a "Decision page — “Should I approve this?”"; 13 "Batch-0 review corrections · 8 Oct 2026" (Mobile decision shortcut)',
    render: () => <LinksSpecimen />,
  },
  'c-format-badge': {
    title: 'FormatBadge and FormatSet: offered, yours, off, compact, on-dark',
    source:
      '04 "Format chips · WEB · AR · VR · MR"; B2-11 "ST-03 Course detail · ME ZG523"; B3-01 "ST-06 Resources · 1440 · interactive · 12 Oct 2026"',
    render: () => <FormatBadgeSpecimen />,
  },
  'c-status-pill': {
    title: 'StatusPill: seven tones, read-only, live',
    source: '04 "Status chips · tone, icon, words"',
    render: () => <StatusPillSpecimen />,
  },
  'c-notice': {
    title: 'Notice: info, success, warning with an action, error, quiet',
    source: '03 "Notices, empty, error, loading and read-only"; 04 "Refused with reason"',
    render: () => <NoticeSpecimen />,
  },
  'c-shell-banner-paused': {
    title: 'ShellBanner (XS-08): paused',
    source: 'B2-10 "Institution paused"; 04 "Paused · shell banner"',
    render: () => <ShellBannerSpecimen kind="paused" />,
  },
  'c-shell-banner-inactive': {
    title: 'ShellBanner (XS-08): inactive',
    source: 'B2-10 "Student inactive"; 04 "Inactive · shell banner"',
    render: () => <ShellBannerSpecimen kind="inactive" />,
  },
  'c-states': {
    title: 'EmptyState, NoMatch, FailedState, LoadingState',
    source:
      '04 "State grammar · one pattern per state"; 03 "Empty", "Loading"; B1-10 "No match", "Loading", "Failed + retry", "Empty · no requests yet"',
    render: () => <StatesSpecimen />,
  },
  'c-message-page': {
    title: 'MessagePage (AR-10, GL-04): not available, inside the page area',
    source: '08 "In context · Student workspace · 1312 px"; 08 "Anatomy"',
    render: () => <MessagePageSpecimen />,
  },
  'c-message-page-confirmation': {
    title: 'MessagePage: a confirmation shown in place, the focus target after the action',
    source: 'B4-12 "ST-13 Assessment attempt · 1440 · interactive · 5 Nov 2026"',
    render: () => <MessageConfirmationSpecimen />,
  },
};
