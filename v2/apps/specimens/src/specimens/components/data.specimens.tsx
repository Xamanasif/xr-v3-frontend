import type { Specimen } from '../types';
import {
  DataTableFlushSpecimen,
  DataTableShellSpecimen,
  DataTableSpecimen,
  DataTableStatesSpecimen,
  DecisionLayoutSpecimen,
  SectionTabs375Specimen,
  TabsSpecimen,
  TimelineSpecimen,
} from './data';

export const DATA_SPECIMENS: Readonly<Record<string, Specimen>> = {
  'c-data-table': {
    title:
      'DataTable with ListToolbar: search, two filters, More filters, chips, row links, the sortable "Received" column and its sort bar',
    source:
      'B1-10 "SA-02 Requests · 1440 · interactive", "More filters open · Internal or external = External", "No match", "Mobile 375"; 03 "Search, filter, segmented and tabs"; Appendix E §7.1 (PF-01)',
    render: () => <DataTableSpecimen />,
  },
  'c-data-table-shell': {
    title:
      'DataTable sort in the workspace shell (Super Admin): drawer below 1024, rail 1024–1279, full from 1280',
    source:
      'B1-10 "SA-02 Requests · 1440 · interactive", "Filtered · Under review", "Mobile 375"; 06 "Collapsed rail and mobile drawer"; Appendix E §6.1, §7.1',
    render: () => <DataTableShellSpecimen sidebar="auto" />,
  },
  'c-data-table-shell-expanded': {
    title:
      'DataTable sort in the workspace shell (Super Admin), sidebar expanded at 1024–1279 (content 759/760 at app 1071/1072)',
    source:
      'B1-10 "SA-02 Requests · 1440 · interactive"; 06 "Collapsed rail and mobile drawer", "Behaviour"; Appendix E §6.1, §7.1',
    render: () => <DataTableShellSpecimen sidebar="expanded" />,
  },
  'c-data-table-states': {
    title: 'DataTable states: loading, empty, no match, failed + retry, changed and error rows',
    source:
      'B1-10 "Loading", "Empty · no requests yet", "No match", "Failed + retry"; 04 "State grammar · one pattern per state"; 03 "Decision panel and editable table"',
    render: () => <DataTableStatesSpecimen />,
  },
  'c-data-table-flush': {
    title: 'DataTable flush inside a section (xw-table-flush)',
    source: 'B2-03 "After SACC-0310 · 9 Oct 2026"; 11 "1440 · Institute Admin · People › Students"',
    render: () => <DataTableFlushSpecimen />,
  },
  'c-tabs': {
    title: 'Tabs: section tabs on white, record-hub tabs, status tabs with their tab panel',
    source:
      '03 "Section tabs · sub-navigation inside “People”"; B2-12 "ST-05 Experiment hub · Overview · 1440 · Rahul, 9 Oct 2026"; B7-02 "SA-06 Institutions · 1440 · 23 Oct 2026 · interactive"',
    render: () => <TabsSpecimen />,
  },
  'c-tabs-375': {
    title: 'Section tabs: the current tab scrolled into view in a narrow strip',
    source: '11 "Section tabs at 375 px · each People tab as the current one"',
    render: () => <SectionTabs375Specimen />,
  },
  'c-timeline': {
    title: 'Timeline: labelled history with p lines; product history with div lines',
    source: '03 "Timeline · history last on a record"; B2-03 "After SACC-0310 · 9 Oct 2026"',
    render: () => <TimelineSpecimen />,
  },
  'c-decision-layout': {
    title: 'DecisionLayout with a sticky DecisionPanel and "Go to decision"',
    source:
      'B1-11 "SA-03 Request decision · REQ-0042 · 1440 · interactive"; 11 "Expected behaviour at about 768 px (admin)"',
    render: () => <DecisionLayoutSpecimen position="sticky" />,
  },
  'c-decision-layout-static': {
    title: 'DecisionLayout with a static DecisionPanel (xg-static, VD-05)',
    source: 'B7-05 "SA-11 Release or hold an update · 1440 · interactive"',
    render: () => <DecisionLayoutSpecimen position="static" />,
  },
};
