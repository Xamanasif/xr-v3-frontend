'use client';

import {
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { TabCount } from '../foundation/avatar.js';
import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';

/**
 * Scrolls a tab strip sideways so `tab` is fully in view, clear of the strip's scroll padding
 * (`.xr-tabs{scroll-padding-inline:48px}`, which also clears the right-edge fade). Board 11
 * "Section tabs at 375 px · each People tab as the current one": "the current tab is scrolled
 * into view when the page opens". Only the strip scrolls — never the page (unlike
 * `scrollIntoView`), so a strip below the fold does not move the page on load.
 */
export function scrollTabIntoView(strip: HTMLElement, tab: HTMLElement): void {
  const style = getComputedStyle(strip);
  const start = Number.parseFloat(style.scrollPaddingLeft) || 0;
  const end = Number.parseFloat(style.scrollPaddingRight) || 0;
  const stripBox = strip.getBoundingClientRect();
  const tabBox = tab.getBoundingClientRect();
  if (tabBox.right > stripBox.right - end) {
    strip.scrollLeft += tabBox.right - stripBox.right + end;
  } else if (tabBox.left < stripBox.left + start) {
    strip.scrollLeft -= stripBox.left + start - tabBox.left;
  }
}

/**
 * Brings the strip's current tab into view when it mounts and when the current tab changes, and
 * again after each batch of web fonts finishes loading (wider glyphs move the tabs; board 11's own
 * script re-aligns after the font swap for the same reason) unless the strip was scrolled
 * meanwhile. Every batch, not only the first: a face is fetched when the layout first needs it, so
 * `document.fonts.ready` can resolve with the regular face loaded and the tabs' semibold and bold
 * faces still to come (measured in Package 1E: board 11's 375 px strip left unscrolled).
 */
function useCurrentTabInView(
  strip: RefObject<HTMLElement | null>,
  selector: string,
  current: string | number,
): void {
  useLayoutEffect(() => {
    const element = strip.current;
    if (!element) return;
    let aligned = 0;
    const align = () => {
      const tab = element.querySelector<HTMLElement>(selector);
      if (tab) scrollTabIntoView(element, tab);
      aligned = element.scrollLeft;
    };
    align();
    const realign = () => {
      if (element.scrollLeft === aligned) align();
    };
    // No font set to listen to (a document without the CSS Font Loading API): nothing more to do.
    const fonts = element.ownerDocument.fonts as FontFaceSet | undefined;
    if (typeof fonts?.addEventListener !== 'function') return;
    fonts.addEventListener('loadingdone', realign);
    return () => fonts.removeEventListener('loadingdone', realign);
  }, [strip, selector, current]);
}

/** The strip's background: the page canvas (default) or a white surface (`xr-tabs--on-white`). */
export type TabsSurface = 'canvas' | 'white';

/** One link tab. */
export interface SectionTab {
  /** The address of this section: section tabs change the address (board 03). */
  readonly href: string;
  /** The section's name ("Students"). */
  readonly label: ReactNode;
  /** The figure after the label (`span.xr-tab-count`, "Students 214"; 0 is drawn). */
  readonly count?: number | string;
  /** The section on screen: `aria-current="page"` (gold rule + bold, never colour alone). */
  readonly current?: boolean;
}

export interface SectionTabsProps {
  /** The `nav` landmark's name ("People sections", "People"). */
  readonly label: string;
  /** The sections, in board order; one is `current`. */
  readonly tabs: readonly SectionTab[];
  /** `white` adds `xr-tabs--on-white` (board 03 draws section tabs on a white card). */
  readonly surface?: TabsSurface;
  /** Board context classes on the `nav`. */
  readonly className?: string;
}

function LinkTabs({
  label,
  tabs,
  classes,
}: {
  readonly label: string;
  readonly tabs: readonly SectionTab[];
  readonly classes: string;
}) {
  const LinkComponent = useLinkComponent();
  const strip = useRef<HTMLElement>(null);
  useCurrentTabInView(
    strip,
    '[aria-current="page"]',
    tabs.findIndex((tab) => tab.current),
  );
  return (
    <nav ref={strip} className={classes} aria-label={label}>
      {tabs.map((tab, index) => (
        <LinkComponent
          key={`${index}:${tab.href}`}
          className="xr-tab"
          href={tab.href}
          aria-current={tab.current ? 'page' : undefined}
        >
          {tab.label}
          {tab.count !== undefined ? (
            <>
              {' '}
              <TabCount count={tab.count} />
            </>
          ) : null}
        </LinkComponent>
      ))}
    </nav>
  );
}

/**
 * Section tabs: sub-navigation inside one sidebar destination (`nav.xr-tabs` of links; board 03
 * "Section tabs · sub-navigation inside “People”", board 06, board 11, B2-06). Ordinary links,
 * reached with Tab (board 12 "Patterns"); the current one carries `aria-current="page"` and is
 * scrolled into view when the strip is wider than its space.
 */
export function SectionTabs({ label, tabs, surface = 'canvas', className }: SectionTabsProps) {
  return (
    <LinkTabs
      label={label}
      tabs={tabs}
      classes={joinClasses('xr-tabs', surface === 'white' && 'xr-tabs--on-white', className)}
    />
  );
}

export interface RecordHubTabsProps {
  /** The record the hub is about ("Shell-and-Tube Heat Exchanger"): the `nav`'s name. */
  readonly label: string;
  /** The hub's pages ("Overview", "Resources" …); one is `current`. */
  readonly tabs: readonly SectionTab[];
  /** Board context classes on the `nav`. */
  readonly className?: string;
}

/**
 * Record-hub tabs: the section tabs of one record's hub, drawn as links on white with the hub
 * spacing (`nav.xr-tabs.xr-tabs--on-white.xw-hubtabs`; B2-12 "ST-05 Experiment hub · Overview ·
 * 1440 · Rahul, 9 Oct 2026"; 67 instances on 13 boards). Same links as SectionTabs.
 */
export function RecordHubTabs({ label, tabs, className }: RecordHubTabsProps) {
  return (
    <LinkTabs
      label={label}
      tabs={tabs}
      classes={joinClasses('xr-tabs', 'xr-tabs--on-white', 'xw-hubtabs', className)}
    />
  );
}

/** One status tab: a view of the one list below it. */
export interface StatusTab {
  /** Stable key; also part of the tab's id (`<idPrefix>-tab-<id>`, as B6-06 draws it). */
  readonly id: string;
  /** The view's name ("Access active"). */
  readonly label: ReactNode;
  /** The number of records in this view (`span.xr-tab-count`). */
  readonly count?: number | string;
}

export interface StatusTabsProps {
  /** The tablist's name ("Show", "Content library", "Role"). */
  readonly label: string;
  /** The views, in board order. */
  readonly tabs: readonly StatusTab[];
  /** The id of the selected tab (controlled). */
  readonly selected: string;
  /** Called with a tab's id on click, ←/→ and Home/End (selection follows focus). */
  readonly onSelect: (id: string) => void;
  /** Prefix of the tab and panel ids; generated when omitted. */
  readonly idPrefix?: string;
  /** The boards draw every status tablist on white (`xr-tabs--on-white`). */
  readonly surface?: TabsSurface;
  /** Board context classes on the tablist. */
  readonly className?: string;
  /** Board context classes on the tab panel. */
  readonly panelClassName?: string;
  /** The panel: the one list the tabs filter (toolbar, count, table). */
  readonly children: ReactNode;
}

/**
 * Status tabs: buttons that filter one list (`div.xr-tabs[role="tablist"]` of
 * `button.xr-tab[role="tab"][aria-selected]`; B7-02 "SA-06 Institutions · 1440 · 23 Oct 2026 ·
 * interactive", B6-06 "CM-04 Content library · 1440"). Keyboard per board 12 "Patterns" (Record
 * tabs): ← → move between the tabs and select (Home/End: first/last), one tab stop (roving
 * `tabindex`), and Tab enters the panel. No board draws the `tabpanel`: it is an ARIA completion
 * (`role="tabpanel"`, labelled by the selected tab, `tabindex="0"`) with no visual change —
 * PROVISIONAL, VD-14.
 */
export function StatusTabs({
  label,
  tabs,
  selected,
  onSelect,
  idPrefix,
  surface = 'white',
  className,
  panelClassName,
  children,
}: StatusTabsProps) {
  const generated = useId();
  const prefix = idPrefix ?? generated;
  const strip = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === selected),
  );
  const tabId = (tab: StatusTab) => `${prefix}-tab-${tab.id}`;
  const panelId = `${prefix}-panel`;
  useCurrentTabInView(strip, '[aria-selected="true"]', selectedIndex);

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    onSelect(tab.id);
    buttons.current[next]?.focus();
  };

  const current = tabs[selectedIndex];
  return (
    <>
      <div
        ref={strip}
        className={joinClasses('xr-tabs', surface === 'white' && 'xr-tabs--on-white', className)}
        role="tablist"
        aria-label={label}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            className="xr-tab"
            id={tabId(tab)}
            aria-selected={index === selectedIndex}
            tabIndex={index === selectedIndex ? 0 : -1}
            aria-controls={panelId}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => move(event, index)}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <>
                {' '}
                <TabCount count={tab.count} />
              </>
            ) : null}
          </button>
        ))}
      </div>
      <div
        className={panelClassName}
        role="tabpanel"
        id={panelId}
        aria-labelledby={current ? tabId(current) : undefined}
        tabIndex={0}
      >
        {children}
      </div>
    </>
  );
}
