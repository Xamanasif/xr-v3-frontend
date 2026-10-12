/** A v46 line icon (`svg.xr-ico`, xr-foundation.css), decorative as on the boards. */
export function Icon({ path }: { readonly path: string }) {
  return (
    <svg className="xr-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

// The paths board 06 "Drawer · Student · 375 px" draws (06-Sidebar-Variants.dc.html): Close, Menu
// and Help in the frame, Home from the board's icon map.
export const CLOSE = 'M6 6l12 12M18 6 6 18';
export const MENU = 'M4 7h16M4 12h16M4 17h16';
export const HOME = 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z';
export const HELP =
  'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 0 1 4.9.8c0 1.7-2.5 2.2-2.5 3.8M12 17h.01';
