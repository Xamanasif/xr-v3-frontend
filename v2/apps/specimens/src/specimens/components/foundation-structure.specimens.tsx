import type { Specimen } from '../types';
import {
  AttentionAllClearSpecimen,
  AvatarCountSpecimen,
  BreadcrumbsSpecimen,
  LogoPlaceholderSpecimen,
  PageHeaderSpecimen,
  RowsSpecimen,
  SectionSpecimen,
  SkipLinkSpecimen,
  TypographySpecimen,
} from './foundation-structure';

export const FOUNDATION_STRUCTURE_SPECIMENS: Readonly<Record<string, Specimen>> = {
  'c-section': {
    title:
      'Section / Stack: titled, with body, focus-target H2 with a live count, ID in the head, labelled, plain surface, surface focus target',
    source:
      '05 "GL-01 Workspace Shell"; 07 "State 3 · Report detail · resolved with note · Faculty"; 09a "Record detail — “What is this, and where is it now?”"; B1-11 "SA-03 Request decision · REQ-0042 · 1440 · interactive"; B4-08 "FA-16 Draft with assistance · 1440 · interactive"; B3-07 "ST-18 My device · 1440 · interactive · 22 Oct 2026"; B2-07 "IA-10 Add student · 1440 · interactive"; B4-04 "FA-07 Create assessment · 1440 · interactive · 26 Oct 2026"',
    render: () => <SectionSpecimen />,
  },
  'c-page-header': {
    title: 'PageHeader: back link, overline + ID, focus-target H1, status, actions',
    source:
      '03 "Breadcrumbs, back link and page header"; B2-06 "IA-07 Student record · Rahul Verma · before access"; B5-03 "VE-03 Create experiment · step 1 · 1440 · interactive · 10 Aug 2026"',
    render: () => <PageHeaderSpecimen />,
  },
  'c-breadcrumbs': {
    title: 'Breadcrumbs in the top bar (from 1024 px of app width)',
    source:
      '03 "Top-bar breadcrumbs"; B2-08 "IA-14 Group · ME ZG523 — Sem II · 1440 · interactive"',
    render: () => <BreadcrumbsSpecimen />,
  },
  'c-logo-placeholder': {
    title: 'LogoPlaceholder in the sidebar head',
    source:
      '06 "The seven sidebars · full width (≥ 1280 px)"; 07 "State 2 · My reports · open / reopened / resolved · Institute Admin"',
    render: () => <LogoPlaceholderSpecimen />,
  },
  'c-avatar-count': {
    title: 'Avatar in a named button, sidebar count in words, tab counts',
    source:
      '06 "Drawer · Student · 375 px"; B1-10 "SA-02 Requests · 1440 · interactive"; 03 "Section tabs · sub-navigation inside “People”"',
    render: () => <AvatarCountSpecimen />,
  },
  'c-typography': {
    title: 'Typography (workspace scale), IdChip, tabular figures, screen-reader words',
    source:
      '02 "Type scale"; 02 "Hierarchy in use"; 02 "Links and focus"; 02 "Typeface"; 09a "Overview / Home — “What needs my attention?”"',
    render: () => <TypographySpecimen />,
  },
  'c-rows': {
    title: 'Rows / AttentionList: attention items, row links, plain rows',
    source:
      '03 "List rows and attention items"; 05 "GL-01 Workspace Shell"; 09a "Overview / Home — “What needs my attention?”"; 11 "1024 · Super Admin · Request decision"',
    render: () => <RowsSpecimen />,
  },
  'c-attention-all-clear': {
    title: 'AttentionList all clear',
    source: '09a "Overview / Home — “What needs my attention?”"',
    render: () => <AttentionAllClearSpecimen />,
  },
  'c-skip-link': {
    title: 'SkipLink first in the shell, focus to main',
    source: '05 "GL-01 Workspace Shell"; 12 "Shell tab order"',
    render: () => <SkipLinkSpecimen />,
  },
};
