/**
 * A new tab for a link the service gives only after a command (ST-06 a resource, ST-08 the WEB
 * link): opened blank in the click's own task — a browser's popup blocker refuses a tab opened
 * after the answer arrives — then pointed at the link, or closed when no link comes. `null` when
 * the browser refused to open a tab at all, so the page can say it didn't open instead of claiming
 * it did. The new page gets no handle on this one (no opener).
 */
export interface PendingTab {
  readonly go: (href: string) => void;
  readonly cancel: () => void;
}

export function openPendingTab(): PendingTab | null {
  let tab: Window | null;
  try {
    tab = window.open('', '_blank');
  } catch {
    return null;
  }
  if (!tab) return null;
  const opened = tab;
  try {
    opened.opener = null;
  } catch {
    // Already detached from this page.
  }
  return {
    go: (href) => opened.location.replace(href),
    cancel: () => opened.close(),
  };
}
