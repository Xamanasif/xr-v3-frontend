/**
 * The foundation the V3 layer implements (design/v3-refined-b/pack/FOUNDATION-LOCK.json). The
 * provenance test checks these values against the lock and the reference files; a new owner-approved
 * foundation changes them together with the generated stylesheet.
 */
export const FOUNDATION_ID = 'XR-V3-RB-1.0';

/** SHA-256 of each Refined B source file the layer is built from (FOUNDATION-LOCK `baseFiles`). */
export const FOUNDATION_SOURCES: Readonly<Record<string, string>> = {
  'references/v3/HANDOFF-original.md':
    '3598572e00da8148a47f5abda743eb868c3020d8405ac8f4530581f8e49cae67',
  'references/v3/design-tokens.json':
    '98b94673f7363b4bf64f7e9dde24fd29ecde9eb0cc3889e230caf4c497b1d5a3',
  'references/v3/project/IA01.dc.html':
    'f06c6e3e2fd8900a2a9f34360e11363f6ab506fb1d5676e4d4e0b0265a524b92',
  'references/v3/project/IA02.dc.html':
    '71280219faa1f3910cff66ed65b9b2a7ee3664afc97398dc630bb5614c98a54f',
  'references/v3/project/SA01.dc.html':
    '3cdd6a194b3441d628b335d254782009bc8cecea92dda48667474ccf258e91fc',
  'references/v3/project/SA02.dc.html':
    '4d88600e819c3b89b14efdfaf37914e23c57414e23fb947f1386ff5cda1d0496',
  'references/v3/project/canvas.json':
    '2131cfa9fcd0fb2a1889ed30ec943ada2c31638cca9f13cb17a91447233ff030',
  'references/v3/project/core.css':
    '6b2be461041569e2ee4c083f6e5b29f73313363ef2568f7a0a4775400011a42b',
  'references/v3/project/rb-kit.css':
    '812daa6c8f4a02b505a417fe0b4f54206f513051f8a5caed06d3d05d080cd704',
  'references/v3/project/rb.css':
    'd2390e1e7bf2db081ec09d9b0b744832391a553f9346d7891eab31e30e5abaf2',
};
