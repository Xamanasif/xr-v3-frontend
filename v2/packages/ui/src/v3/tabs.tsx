'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';

import { useLinkComponent } from '../link.js';

export interface LinkTab {
  readonly label: ReactNode;
  readonly href: string;
  readonly current?: boolean;
}

export interface LinkTabsProps {
  /** The navigation's name: "Content access". */
  readonly label: string;
  readonly tabs: readonly LinkTab[];
}

/**
 * Tabs that are navigation links (`nav.rk-tabs` > `a.rk-tab[aria-current=page]`; IA-02
 * "Experiments · Course codes"): each tab is an address, so they are links, not ARIA tabs.
 */
export function LinkTabs({ label, tabs }: LinkTabsProps) {
  const Link = useLinkComponent();
  if (tabs.filter((tab) => tab.current).length > 1) {
    throw new Error('LinkTabs: at most one tab is current.');
  }
  return (
    <nav className="rk-tabs" aria-label={label}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          className="rk-tab"
          href={tab.href}
          aria-current={tab.current ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export interface PanelTab<Value extends string> {
  readonly value: Value;
  readonly label: ReactNode;
}

export interface TabsProps<Value extends string> {
  /** The tab list's name. */
  readonly label: string;
  readonly tabs: readonly PanelTab<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  /** Prefix of the tab and panel ids (`<prefix>-tab-<value>`, `<prefix>-panel-<value>`). */
  readonly idPrefix: string;
}

/** The id of the panel a tab of `Tabs` controls (`<prefix>-panel-<value>`), for `TabPanel`. */
export function tabPanelId(idPrefix: string, value: string): string {
  return `${idPrefix}-panel-${value}`;
}

function tabId(idPrefix: string, value: string): string {
  return `${idPrefix}-tab-${value}`;
}

/**
 * In-page ARIA tabs (`div.rk-tabs[role=tablist]` > `button.rk-tab[role=tab][aria-selected]`;
 * rb-kit.css draws the selected underline on `[aria-selected="true"]`): one Tab stop, the arrow
 * keys, Home and End move between tabs and select the one they reach.
 */
export function Tabs<Value extends string>({
  label,
  tabs,
  value,
  onChange,
  idPrefix,
}: TabsProps<Value>) {
  const listRef = useRef<HTMLDivElement>(null);
  const moveTo = (index: number) => {
    const count = tabs.length;
    const position = ((index % count) + count) % count;
    const next = tabs[position];
    if (!next) return;
    onChange(next.value);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[position]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const target = keys[event.key];
    if (target === undefined) return;
    event.preventDefault();
    moveTo(target);
  };
  return (
    <div ref={listRef} className="rk-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={tabId(idPrefix, tab.value)}
            className="rk-tab"
            aria-selected={selected}
            aria-controls={tabPanelId(idPrefix, tab.value)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  readonly idPrefix: string;
  readonly value: string;
  readonly children: ReactNode;
}

/** The panel of the selected tab (`div[role=tabpanel]`, labelled by its tab, one Tab stop). */
export function TabPanel({ idPrefix, value, children }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={tabPanelId(idPrefix, value)}
      aria-labelledby={tabId(idPrefix, value)}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
