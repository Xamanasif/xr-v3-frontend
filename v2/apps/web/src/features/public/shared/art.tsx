/**
 * The concept artwork of the public pages (assets.json "Area and format artwork (19 files) —
 * Approved B2 illustrations, concept only"; `project/art/*.svg`, copied byte-identical into
 * `@xr/ui/styles.css` as the `xp-art--<key>` background classes). An area or experiment record
 * names its artwork by key (`artworkKey`, PC-31); this table is the asset metadata the boards draw
 * with each file — its atmosphere, the full drawing a crop belongs to, and the description a board
 * gives it. It holds no experiment or area data.
 *
 * Art is drawn as `div.xp-bgart.xp-art--<key>` inside the board's media box — the boards' own live
 * markup (B1-01 / B1-02 explorer `bgCls`, B1-04 rows `bgCls`). Images never carry information
 * (B1-02 "Images are decorative"), except where a board describes the drawing (the hero).
 */

/** The `xp-atm-*` backdrop of each drawing (B1-01 A3 data, B1-04 `atm`). */
const ATMOSPHERE: Readonly<Record<string, string>> = {
  thermal: 'thermal',
  'thermal-crop': 'thermal',
  motor: 'motor',
  'motor-crop': 'motor',
  process: 'process',
  'process-crop': 'process',
  bundle: 'cool',
  materials: 'warm',
  machining: 'steel',
  casting: 'warm',
  syncgen: 'cool',
  coil: 'steel',
  switching: 'cool',
  drum: 'warm',
  orifice: 'cool',
  'fmt-web': 'steel',
  'fmt-ar': 'cool',
  'fmt-vr': 'motor',
  'fmt-mr': 'warm',
};

/** The full drawing of a catalogue crop (B1-05 hero: thermal.svg for the row's thermal-crop.svg). */
const FULL_DRAWING: Readonly<Record<string, string>> = {
  'thermal-crop': 'thermal',
  'motor-crop': 'motor',
  'process-crop': 'process',
};

/** The descriptions the boards give a drawing (B1-01 hero, B1-05 hero `alt`). */
const DESCRIPTION: Readonly<Record<string, string>> = {
  thermal:
    'Illustration: a shell-and-tube heat exchanger in cutaway, with four temperature stations T1 to T4. Concept artwork, not a simulation capture.',
};

/** Whether a key names a drawing of the asset set (anything else shows the fallback). */
export function isKnownArt(key: string | null): key is string {
  return key !== null && Object.hasOwn(ATMOSPHERE, key);
}

export function atmosphereClass(key: string): string {
  return `xp-atm-${ATMOSPHERE[key] ?? 'steel'}`;
}

export function fullDrawingOf(key: string): string {
  return FULL_DRAWING[key] ?? key;
}

export function descriptionOf(key: string): string | null {
  return DESCRIPTION[key] ?? null;
}

/** "MM" for "Mechanical & Manufacturing" (B1-01 A3 `ini`): the first letter of the first two words. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');
}

/**
 * The drawing itself (`div.xp-bgart.xp-art--<key>`). Decorative unless `description` is given —
 * then it is an image with that description.
 */
export function Drawing({
  artKey,
  description = null,
}: {
  readonly artKey: string;
  readonly description?: string | null;
}) {
  return description ? (
    <div className={`xp-bgart xp-art--${artKey}`} role="img" aria-label={description} />
  ) : (
    <div className={`xp-bgart xp-art--${artKey}`} />
  );
}

/** "Pattern + initials; never a broken image" (B1-01 / B1-03 "Area without artwork → fallback card"). */
export function ArtFallback({ name }: { readonly name: string }) {
  return (
    <div className="xp-ex-fallback" aria-hidden="true">
      <span>{initialsOf(name)}</span>
    </div>
  );
}

/**
 * A media box (`xp-card-media`, `xp-erow-media`) with its atmosphere and drawing, or the fallback
 * pattern when the record has no known artwork.
 */
export function ArtMedia({
  className,
  artKey,
  name,
}: {
  readonly className: string;
  readonly artKey: string | null;
  readonly name: string;
}) {
  if (!isKnownArt(artKey)) {
    return (
      <div className={className}>
        <ArtFallback name={name} />
      </div>
    );
  }
  return (
    <div className={`${className} ${atmosphereClass(artKey)}`}>
      <Drawing artKey={artKey} />
    </div>
  );
}
