/**
 * The landing's artwork (PU-01, V1 Direction B2): the SVG markup of
 * `21 · FROZEN · Premium Direction B2 - BITS Immersive Experience.dc.html` (SHA-256 3dbe9412…4d07c),
 * copied verbatim — generated, never hand-edited. Every id carries the `pl1-` prefix (its `url(#…)`
 * and `href="#…"` references follow) so nothing collides with another inline SVG, and the
 * keyframe names `b2*` are the landing stylesheet's `pl1-*`. The frozen design-host placeholders
 * are replaced as follows: `animation-play-state:{{ ambientPlay }}` → the root's `--pl1-play`
 * custom property; the plot's `font-size="{{ plotFont }}"` → the `pl1-plotf` class (13 / 22 user
 * units by width, in the landing stylesheet).
 *
 * Frozen lines: defs 54–87 (gradients, clip paths), 89–100 (hero flows), 129–230 (thermal, motor,
 * process), 273–342 (format art), 358–365 (machining); story layers 584–585, 588–608, 611–612;
 * plot 629–636. Catalogue-only thumbnails and the unused story-state drawings are not shipped.
 *
 * Markup, not React elements: the drawings hold the frozen literal colours (raw hex is kept out of
 * TSX, ADR-0001) and are inserted once, unchanged, by `art-defs.tsx` and `story.tsx`.
 */

/** The hidden `<defs>`: gradients, clip paths and the symbols (frozen 52–401). */
export const LANDING_ART_DEFS = `<linearGradient id="pl1-b2ShellV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8592E6"></stop><stop offset=".38" stop-color="#3B49B8"></stop><stop offset="1" stop-color="#141B5E"></stop></linearGradient>
<linearGradient id="pl1-b2HotCold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F0A93A" stop-opacity=".9"></stop><stop offset="1" stop-color="#35C0DE" stop-opacity=".75"></stop></linearGradient>
<linearGradient id="pl1-b2ColdHot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#35C0DE"></stop><stop offset="1" stop-color="#F7C95B"></stop></linearGradient>
<linearGradient id="pl1-b2Steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF1FB"></stop><stop offset=".5" stop-color="#A3ACD9"></stop><stop offset="1" stop-color="#4A559A"></stop></linearGradient>
<linearGradient id="pl1-b2SteelH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EEF1FB"></stop><stop offset=".5" stop-color="#A3ACD9"></stop><stop offset="1" stop-color="#4A559A"></stop></linearGradient>
<linearGradient id="pl1-b2Copper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4B65E"></stop><stop offset="1" stop-color="#9A4F14"></stop></linearGradient>
<linearGradient id="pl1-b2Dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3390"></stop><stop offset="1" stop-color="#0C1247"></stop></linearGradient>
<linearGradient id="pl1-b2Glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".38"></stop><stop offset=".45" stop-color="#FFFFFF" stop-opacity=".04"></stop><stop offset="1" stop-color="#FFFFFF" stop-opacity=".28"></stop></linearGradient>
<linearGradient id="pl1-b2GlassV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".38"></stop><stop offset=".45" stop-color="#FFFFFF" stop-opacity=".04"></stop><stop offset="1" stop-color="#FFFFFF" stop-opacity=".22"></stop></linearGradient>
<linearGradient id="pl1-b2Column" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F0A93A" stop-opacity=".85"></stop><stop offset=".5" stop-color="#8592E6" stop-opacity=".3"></stop><stop offset="1" stop-color="#35C0DE" stop-opacity=".85"></stop></linearGradient>
<linearGradient id="pl1-b2Wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9C6A5"></stop><stop offset="1" stop-color="#A88B62"></stop></linearGradient>
<radialGradient id="pl1-b2GlowGold"><stop offset="0" stop-color="#F7C95B" stop-opacity=".95"></stop><stop offset="1" stop-color="#F7C95B" stop-opacity="0"></stop></radialGradient>
<radialGradient id="pl1-b2GlowCyan"><stop offset="0" stop-color="#35C0DE" stop-opacity=".85"></stop><stop offset="1" stop-color="#35C0DE" stop-opacity="0"></stop></radialGradient>
<radialGradient id="pl1-b2Shadow"><stop offset="0" stop-color="#040716" stop-opacity=".7"></stop><stop offset="1" stop-color="#040716" stop-opacity="0"></stop></radialGradient>
<clipPath id="pl1-b2Shell"><rect x="190" y="215" width="640" height="180" rx="90"></rect></clipPath>
<clipPath id="pl1-b2Col"><rect x="420" y="40" width="160" height="450" rx="80"></rect></clipPath>
<clipPath id="pl1-b2Visor"><rect x="72" y="106" width="256" height="82" rx="30"></rect></clipPath>
<clipPath id="pl1-b2Phone"><rect x="80" y="46" width="100" height="168" rx="8"></rect></clipPath>
<clipPath id="pl1-b2Drum"><rect x="50" y="60" width="220" height="80" rx="40"></rect></clipPath>
<clipPath id="pl1-b2Win"><rect x="336" y="226" width="328" height="168"></rect></clipPath>
<clipPath id="pl1-b2ColWin"><rect x="424" y="128" width="152" height="244"></rect></clipPath>
<linearGradient id="pl1-b2Cyl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A66C9"></stop><stop offset=".12" stop-color="#9AA5EE"></stop><stop offset=".3" stop-color="#6F7BD9"></stop><stop offset=".62" stop-color="#2F3A9E"></stop><stop offset=".9" stop-color="#141B5E"></stop><stop offset="1" stop-color="#2A3390"></stop></linearGradient>
<linearGradient id="pl1-b2CylH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A66C9"></stop><stop offset=".12" stop-color="#9AA5EE"></stop><stop offset=".3" stop-color="#6F7BD9"></stop><stop offset=".62" stop-color="#2F3A9E"></stop><stop offset=".9" stop-color="#141B5E"></stop><stop offset="1" stop-color="#2A3390"></stop></linearGradient>
<radialGradient id="pl1-b2Head" cx=".38" cy=".42" r=".72"><stop offset="0" stop-color="#C9D0F4"></stop><stop offset=".55" stop-color="#6F7BD9"></stop><stop offset="1" stop-color="#1B2470"></stop></radialGradient>
<radialGradient id="pl1-b2HeadR" cx=".62" cy=".42" r=".72"><stop offset="0" stop-color="#C9D0F4"></stop><stop offset=".55" stop-color="#6F7BD9"></stop><stop offset="1" stop-color="#1B2470"></stop></radialGradient>
<radialGradient id="pl1-b2Disc" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#8B96E8"></stop><stop offset=".45" stop-color="#3B49B8"></stop><stop offset="1" stop-color="#141B5E"></stop></radialGradient>
<radialGradient id="pl1-b2Rotor" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#2A3390"></stop><stop offset="1" stop-color="#070B2E"></stop></radialGradient>
<linearGradient id="pl1-b2Flange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C3CBF0"></stop><stop offset=".5" stop-color="#5F6BC0"></stop><stop offset="1" stop-color="#141B5E"></stop></linearGradient>
<linearGradient id="pl1-b2Cavity" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04071F"></stop><stop offset=".5" stop-color="#0E1440"></stop><stop offset="1" stop-color="#04071F"></stop></linearGradient>
<linearGradient id="pl1-b2TubeFlow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4B65E"></stop><stop offset=".5" stop-color="#B9C1EA"></stop><stop offset="1" stop-color="#35C0DE"></stop></linearGradient>
<linearGradient id="pl1-b2TubeShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".38"></stop><stop offset=".3" stop-color="#FFFFFF" stop-opacity="0"></stop><stop offset=".6" stop-color="#000000" stop-opacity="0"></stop><stop offset="1" stop-color="#000000" stop-opacity=".5"></stop></linearGradient>
<linearGradient id="pl1-b2Saddle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3390"></stop><stop offset="1" stop-color="#070B2E"></stop></linearGradient>
<linearGradient id="pl1-b2EdgeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000000" stop-opacity=".5"></stop><stop offset="1" stop-color="#000000" stop-opacity="0"></stop></linearGradient>
<linearGradient id="pl1-b2EdgeR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000000" stop-opacity=".5"></stop><stop offset="1" stop-color="#000000" stop-opacity="0"></stop></linearGradient>
<g id="pl1-flowThermal"><g clip-path="url(#pl1-b2Win)">
<path d="M300 236C300 318 350 364 410 364C470 364 476 258 520 258C564 258 556 364 606 364C660 364 700 340 700 392" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="14 30" opacity=".5" style="animation:pl1-dash 4.6s linear infinite"></path>
<path d="M788 268H212M788 310H212M788 352H212" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 34" opacity=".38" style="animation:pl1-dash 5.6s linear infinite"></path></g><g fill="none" stroke="#F7C95B" stroke-width="2"><circle cx="300" cy="118" r="15" style="transform-box:fill-box;transform-origin:center;animation:pl1-ring 3.2s cubic-bezier(.2,.7,.2,1) 0s infinite"></circle><circle cx="700" cy="498" r="15" style="transform-box:fill-box;transform-origin:center;animation:pl1-ring 3.2s cubic-bezier(.2,.7,.2,1) .8s infinite"></circle><circle cx="928" cy="310" r="15" style="transform-box:fill-box;transform-origin:center;animation:pl1-ring 3.2s cubic-bezier(.2,.7,.2,1) 1.6s infinite"></circle><circle cx="127" cy="261" r="15" style="transform-box:fill-box;transform-origin:center;animation:pl1-ring 3.2s cubic-bezier(.2,.7,.2,1) 2.4s infinite"></circle></g>
</g>
<g id="pl1-flowMotor">
<circle cx="520" cy="300" r="238" fill="none" stroke="#35C0DE" stroke-width="2" style="animation:pl1-pulse 3.8s ease-in-out infinite"></circle>
<circle cx="520" cy="300" r="266" fill="none" stroke="#35C0DE" stroke-width="1.5" style="animation:pl1-pulse 3.8s ease-in-out infinite 1.9s"></circle>
</g>
<g id="pl1-flowProcess">
<g clip-path="url(#pl1-b2ColWin)"><g fill="#9FE9F8" opacity=".5" style="animation:pl1-rise 8s linear infinite"><circle cx="470" cy="400" r="5"></circle><circle cx="522" cy="440" r="3.5"></circle><circle cx="548" cy="480" r="4.5"></circle><circle cx="486" cy="520" r="3"></circle><circle cx="534" cy="580" r="4"></circle><circle cx="462" cy="620" r="3.5"></circle></g></g>
<path d="M560 70H640v84" fill="none" stroke="#F7C95B" stroke-width="3" stroke-dasharray="8 8" opacity=".9" style="animation:pl1-dash 3.2s linear infinite"></path>
</g>
<g id="pl1-artThermal">
<ellipse cx="500" cy="480" rx="430" ry="30" fill="url(#pl1-b2Shadow)"></ellipse>
<circle cx="290" cy="200" r="200" fill="url(#pl1-b2GlowGold)" opacity=".5"></circle>
<circle cx="720" cy="440" r="190" fill="url(#pl1-b2GlowCyan)" opacity=".45"></circle>
<g fill="none" stroke="#8592E6" stroke-width="1.2"><ellipse cx="500" cy="310" rx="400" ry="168" opacity=".14"></ellipse><ellipse cx="500" cy="310" rx="470" ry="214" opacity=".1"></ellipse><ellipse cx="500" cy="310" rx="540" ry="262" opacity=".07"></ellipse></g>
<rect x="120" y="474" width="760" height="1" fill="#FFFFFF" opacity=".08"></rect>
<path d="M296 392h68l14 74H282z" fill="url(#pl1-b2Saddle)"></path><rect x="272" y="464" width="116" height="10" rx="2" fill="#1B2470"></rect>
<path d="M636 392h68l14 74H622z" fill="url(#pl1-b2Saddle)"></path><rect x="612" y="464" width="116" height="10" rx="2" fill="#1B2470"></rect>
<rect x="282" y="150" width="36" height="84" fill="url(#pl1-b2CylH)"></rect><rect x="268" y="140" width="64" height="14" rx="3" fill="url(#pl1-b2Flange)"></rect><path d="M290 176l10 12 10-12z" fill="#F7C95B"></path>
<rect x="682" y="386" width="36" height="84" fill="url(#pl1-b2CylH)"></rect><rect x="668" y="464" width="64" height="14" rx="3" fill="url(#pl1-b2Flange)"></rect><path d="M690 438l10 12 10-12z" fill="#35C0DE"></path>
<rect x="846" y="292" width="54" height="36" fill="url(#pl1-b2Cyl)"></rect><rect x="894" y="280" width="14" height="60" rx="3" fill="url(#pl1-b2Flange)"></rect><path d="M888 300l-12 10 12 10z" fill="#35C0DE"></path>
<rect x="100" y="292" width="54" height="36" fill="url(#pl1-b2Cyl)"></rect><rect x="92" y="280" width="14" height="60" rx="3" fill="url(#pl1-b2Flange)"></rect><path d="M128 300l-12 10 12 10z" fill="#F7C95B"></path>
<ellipse cx="200" cy="310" rx="46" ry="84" fill="url(#pl1-b2Head)"></ellipse>
<ellipse cx="800" cy="310" rx="46" ry="84" fill="url(#pl1-b2HeadR)"></ellipse>
<rect x="200" y="230" width="600" height="160" fill="url(#pl1-b2Cavity)"></rect>
<g opacity=".45"><rect x="212" y="281" width="576" height="16" rx="8" fill="url(#pl1-b2TubeFlow)"></rect><rect x="212" y="323" width="576" height="16" rx="8" fill="url(#pl1-b2TubeFlow)"></rect><rect x="212" y="281" width="576" height="16" rx="8" fill="url(#pl1-b2TubeShade)"></rect><rect x="212" y="323" width="576" height="16" rx="8" fill="url(#pl1-b2TubeShade)"></rect></g>
<g fill="url(#pl1-b2SteelH)" opacity=".85"><rect x="406" y="230" width="8" height="106"></rect><rect x="501" y="284" width="8" height="106"></rect><rect x="596" y="230" width="8" height="106"></rect></g>
<path d="M300 236C300 318 350 364 410 364C470 364 476 258 520 258C564 258 556 364 606 364C660 364 700 340 700 392" fill="none" stroke="url(#pl1-b2HotCold)" stroke-width="18" stroke-linecap="round" opacity=".5"></path>
<path d="M300 236C300 318 350 364 410 364C470 364 476 258 520 258C564 258 556 364 606 364C660 364 700 340 700 392" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".3"></path>
<g fill="url(#pl1-b2TubeFlow)"><rect x="212" y="258" width="576" height="20" rx="10"></rect><rect x="212" y="300" width="576" height="20" rx="10"></rect><rect x="212" y="342" width="576" height="20" rx="10"></rect></g>
<g fill="url(#pl1-b2TubeShade)"><rect x="212" y="258" width="576" height="20" rx="10"></rect><rect x="212" y="300" width="576" height="20" rx="10"></rect><rect x="212" y="342" width="576" height="20" rx="10"></rect></g>
<g fill="#0C1247" opacity=".75"><path d="M690 262l-14 6 14 6zM560 304l-14 6 14 6zM430 346l-14 6 14 6z"></path></g>
<rect x="200" y="226" width="136" height="168" fill="url(#pl1-b2Cyl)"></rect>
<rect x="664" y="226" width="136" height="168" fill="url(#pl1-b2Cyl)"></rect>
<rect x="336" y="226" width="328" height="168" fill="url(#pl1-b2Cyl)" opacity=".1"></rect>
<rect x="336" y="226" width="328" height="168" fill="url(#pl1-b2GlassV)" opacity=".16"></rect>
<rect x="336" y="226" width="26" height="168" fill="url(#pl1-b2EdgeL)" opacity=".5"></rect><rect x="638" y="226" width="26" height="168" fill="url(#pl1-b2EdgeR)" opacity=".5"></rect>
<path d="M336 226v168M664 226v168" stroke="#DDE2F6" stroke-width="2" opacity=".55"></path>
<rect x="212" y="238" width="576" height="5" rx="2.5" fill="#FFFFFF" opacity=".28"></rect>
<rect x="212" y="384" width="576" height="4" rx="2" fill="#35C0DE" opacity=".16"></rect>
<rect x="190" y="214" width="20" height="192" rx="5" fill="url(#pl1-b2Flange)"></rect>
<rect x="790" y="214" width="20" height="192" rx="5" fill="url(#pl1-b2Flange)"></rect>
<g fill="#E6E9F8" stroke="#3B49B8" stroke-width="1"><circle cx="200" cy="232" r="4.5"></circle><circle cx="200" cy="271" r="4.5"></circle><circle cx="200" cy="310" r="4.5"></circle><circle cx="200" cy="349" r="4.5"></circle><circle cx="200" cy="388" r="4.5"></circle><circle cx="800" cy="232" r="4.5"></circle><circle cx="800" cy="271" r="4.5"></circle><circle cx="800" cy="310" r="4.5"></circle><circle cx="800" cy="349" r="4.5"></circle><circle cx="800" cy="388" r="4.5"></circle></g>
<path d="M300 140v-13M700 478v11M908 310h11M127 292v-22" stroke="#F7C95B" stroke-width="2" opacity=".9"></path>
<g fill="#0C1247" stroke="#F7C95B" stroke-width="3"><circle cx="300" cy="118" r="9"></circle><circle cx="700" cy="498" r="9"></circle><circle cx="928" cy="310" r="9"></circle><circle cx="127" cy="261" r="9"></circle></g>
<g fill="#F7C95B"><circle cx="300" cy="118" r="3"></circle><circle cx="700" cy="498" r="3"></circle><circle cx="928" cy="310" r="3"></circle><circle cx="127" cy="261" r="3"></circle></g>
<g font-family="'JetBrains Mono',monospace" font-size="13" fill="#F7C95B" letter-spacing="1"><text x="316" y="123">T1</text><text x="716" y="503">T2</text><text x="916" y="292">T3</text><text x="142" y="266">T4</text></g>
</g>
<g id="pl1-artMotor">
<ellipse cx="560" cy="512" rx="400" ry="32" fill="url(#pl1-b2Shadow)"></ellipse>
<circle cx="520" cy="300" r="300" fill="url(#pl1-b2GlowCyan)" opacity=".4"></circle>
<g fill="none" stroke="#35C0DE" opacity=".16" stroke-width="1.5"><ellipse cx="520" cy="300" rx="300" ry="104" transform="rotate(28 520 300)"></ellipse><ellipse cx="520" cy="300" rx="300" ry="104" transform="rotate(-62 520 300)"></ellipse><ellipse cx="520" cy="300" rx="340" ry="130" transform="rotate(-17 520 300)"></ellipse></g>
<rect x="140" y="508" width="760" height="1" fill="#FFFFFF" opacity=".08"></rect>
<path d="M330 478h380l-22 30H352z" fill="url(#pl1-b2Saddle)"></path><rect x="300" y="500" width="440" height="10" rx="2" fill="#1B2470"></rect>
<rect x="700" y="284" width="240" height="32" rx="16" fill="url(#pl1-b2Cyl)"></rect>
<rect x="700" y="290" width="240" height="4" fill="#FFFFFF" opacity=".22"></rect>
<rect x="752" y="256" width="36" height="88" rx="6" fill="url(#pl1-b2Flange)"></rect>
<ellipse cx="905" cy="300" rx="38" ry="120" fill="url(#pl1-b2Head)"></ellipse><ellipse cx="905" cy="300" rx="20" ry="70" fill="#141B5E"></ellipse><ellipse cx="905" cy="300" rx="7" ry="24" fill="#0A0F3A"></ellipse>
<rect x="470" y="48" width="140" height="62" rx="8" fill="url(#pl1-b2Flange)"></rect><rect x="478" y="56" width="124" height="46" rx="5" fill="#0C1247"></rect>
<circle cx="508" cy="79" r="8" fill="#F7C95B"></circle><circle cx="540" cy="79" r="8" fill="#35C0DE"></circle><circle cx="572" cy="79" r="8" fill="#E2452F"></circle>
<circle cx="548" cy="300" r="212" fill="#0A0F3A" opacity=".9"></circle>
<rect id="pl1-b2Fin" x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)"></rect>
<rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(22.5 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(45 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(67.5 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(112.5 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(135 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(157.5 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(180 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(202.5 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(225 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(247.5 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(270 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(292.5 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(315 520 300)"></rect><rect x="512" y="54" width="16" height="42" rx="3" fill="url(#pl1-b2Flange)" transform="rotate(337.5 520 300)"></rect>
<circle cx="520" cy="300" r="212" fill="url(#pl1-b2Disc)"></circle>
<circle cx="520" cy="300" r="212" fill="none" stroke="#DDE2F6" stroke-width="2" opacity=".35"></circle>
<circle cx="520" cy="300" r="196" fill="none" stroke="#0A0F3A" stroke-width="3" opacity=".5"></circle>
<circle cx="520" cy="300" r="154" fill="url(#pl1-b2Cavity)"></circle>
<rect id="pl1-b2Slot" x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1"></rect>
<rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(30 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(60 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(90 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(120 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(150 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(180 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(210 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(240 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(270 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(300 520 300)"></rect><rect x="507" y="104" width="26" height="52" rx="7" fill="url(#pl1-b2Copper)" stroke="#5A2E0A" stroke-opacity=".5" stroke-width="1" transform="rotate(330 520 300)"></rect>
<circle cx="520" cy="300" r="122" fill="url(#pl1-b2Rotor)"></circle>
<g fill="none" stroke="#FFFFFF" opacity=".08" stroke-width="1"><circle cx="520" cy="300" r="112"></circle><circle cx="520" cy="300" r="96"></circle><circle cx="520" cy="300" r="80"></circle></g>
<rect id="pl1-b2Bar" x="514" y="186" width="12" height="46" rx="4" fill="url(#pl1-b2SteelH)"></rect>
<rect x="514" y="186" width="12" height="46" rx="4" fill="url(#pl1-b2SteelH)" transform="rotate(45 520 300)"></rect><rect x="514" y="186" width="12" height="46" rx="4" fill="url(#pl1-b2SteelH)" transform="rotate(90 520 300)"></rect><rect x="514" y="186" width="12" height="46" rx="4" fill="url(#pl1-b2SteelH)" transform="rotate(135 520 300)"></rect><rect x="514" y="186" width="12" height="46" rx="4" fill="url(#pl1-b2SteelH)" transform="rotate(180 520 300)"></rect><rect x="514" y="186" width="12" height="46" rx="4" fill="url(#pl1-b2SteelH)" transform="rotate(225 520 300)"></rect><rect x="514" y="186" width="12" height="46" rx="4" fill="url(#pl1-b2SteelH)" transform="rotate(270 520 300)"></rect><rect x="514" y="186" width="12" height="46" rx="4" fill="url(#pl1-b2SteelH)" transform="rotate(315 520 300)"></rect>
<circle cx="520" cy="300" r="38" fill="url(#pl1-b2Head)"></circle><circle cx="520" cy="300" r="12" fill="#0A0F3A"></circle>
</g>
<g id="pl1-artProcess">
<ellipse cx="560" cy="548" rx="440" ry="30" fill="url(#pl1-b2Shadow)"></ellipse>
<circle cx="760" cy="470" r="180" fill="url(#pl1-b2GlowGold)" opacity=".6"></circle>
<circle cx="500" cy="80" r="170" fill="url(#pl1-b2GlowCyan)" opacity=".45"></circle>
<rect x="120" y="546" width="760" height="1" fill="#FFFFFF" opacity=".08"></rect>
<path d="M440 470h120l22 72H418z" fill="url(#pl1-b2Saddle)"></path><rect x="404" y="538" width="192" height="10" rx="2" fill="#1B2470"></rect>
<path d="M500 40V22h265v34" stroke="#B9C1EA" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
<path d="M120 300h300" stroke="#B9C1EA" stroke-width="12" stroke-linecap="round"></path>
<path d="M270 288l26 12-26 12zM330 288l-26 12 26 12z" fill="#F7C95B"></path>
<path d="M690 195H600V90" stroke="#35C0DE" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
<path d="M580 440h70M650 484h-70" stroke="#B9C1EA" stroke-width="12" stroke-linecap="round"></path>
<path d="M765 120v46" stroke="#B9C1EA" stroke-width="10"></path>
<rect x="424" y="128" width="152" height="244" fill="url(#pl1-b2Cavity)"></rect>
<g fill="#B9C1EA" opacity=".6"><rect x="424" y="150" width="116" height="7" rx="2"></rect><rect x="460" y="190" width="116" height="7" rx="2"></rect><rect x="424" y="230" width="116" height="7" rx="2"></rect><rect x="460" y="270" width="116" height="7" rx="2"></rect><rect x="424" y="310" width="116" height="7" rx="2"></rect><rect x="460" y="350" width="116" height="7" rx="2"></rect></g>
<g fill="#B9C1EA" opacity=".35"><rect x="536" y="150" width="4" height="26"></rect><rect x="460" y="190" width="4" height="26"></rect><rect x="536" y="230" width="4" height="26"></rect><rect x="460" y="270" width="4" height="26"></rect><rect x="536" y="310" width="4" height="26"></rect><rect x="460" y="350" width="4" height="26"></rect></g>
<g fill="#9FE9F8" opacity=".6"><circle cx="470" cy="340" r="6"></circle><circle cx="522" cy="292" r="4"></circle><circle cx="548" cy="248" r="5"></circle><circle cx="482" cy="206" r="3.5"></circle><circle cx="530" cy="166" r="4.5"></circle></g>
<path d="M420 132V120A80 80 0 0 1 580 120V132Z" fill="url(#pl1-b2CylH)"></path>
<path d="M420 368V410A80 80 0 0 0 580 410V368Z" fill="url(#pl1-b2CylH)"></path>
<rect x="420" y="132" width="160" height="236" fill="url(#pl1-b2CylH)" opacity=".16"></rect>
<rect x="420" y="132" width="160" height="236" fill="url(#pl1-b2Glass)" opacity=".3"></rect>
<rect x="420" y="132" width="26" height="236" fill="url(#pl1-b2EdgeL)" opacity=".45"></rect><rect x="554" y="132" width="26" height="236" fill="url(#pl1-b2EdgeR)" opacity=".45"></rect>
<path d="M420 132H580M420 368H580" stroke="#DDE2F6" stroke-width="2" opacity=".55"></path>
<rect x="410" y="198" width="180" height="9" rx="2" fill="url(#pl1-b2Flange)"></rect><rect x="410" y="328" width="180" height="9" rx="2" fill="url(#pl1-b2Flange)"></rect>
<rect x="444" y="48" width="6" height="436" rx="3" fill="#FFFFFF" opacity=".2"></rect>
<rect x="660" y="56" width="210" height="64" rx="32" fill="url(#pl1-b2Cyl)"></rect><rect x="660" y="56" width="210" height="64" rx="32" fill="url(#pl1-b2HotCold)" opacity=".3"></rect><rect x="660" y="56" width="210" height="64" rx="32" fill="url(#pl1-b2GlassV)" opacity=".4"></rect>
<rect x="694" y="38" width="14" height="20" fill="url(#pl1-b2CylH)"></rect><rect x="822" y="38" width="14" height="20" fill="url(#pl1-b2CylH)"></rect>
<path d="M694 34l7-8 7 8zM822 44l7 8 7-8z" fill="#35C0DE"></path>
<rect x="690" y="166" width="150" height="58" rx="29" fill="url(#pl1-b2Cyl)"></rect><rect x="690" y="166" width="150" height="58" rx="29" fill="url(#pl1-b2GlassV)" opacity=".4"></rect>
<path d="M840 195h100" stroke="#35C0DE" stroke-width="8" stroke-linecap="round"></path><path d="M930 185l14 10-14 10z" fill="#35C0DE"></path>
<path d="M628 185l17 10-17 10zM662 185l-17 10 17 10z" fill="#F7C95B"></path><path d="M645 174v11" stroke="#F7C95B" stroke-width="3"></path><rect x="634" y="160" width="22" height="14" rx="3" fill="#F7C95B"></rect>
<path d="M560 70H640v84" stroke="#F7C95B" stroke-width="3" stroke-dasharray="8 8" fill="none" opacity=".55"></path>
<circle cx="560" cy="70" r="7" fill="#0C1247" stroke="#F7C95B" stroke-width="3"></circle>
<rect x="640" y="404" width="210" height="96" rx="34" fill="url(#pl1-b2Cyl)"></rect><rect x="640" y="404" width="210" height="96" rx="34" fill="#F0A93A" opacity=".28"></rect><rect x="640" y="404" width="210" height="96" rx="34" fill="url(#pl1-b2GlassV)" opacity=".4"></rect>
<path d="M668 440h154M668 464h154" stroke="#F7C95B" stroke-width="3" opacity=".35"></path>
</g>
<g id="pl1-artWeb">
<rect x="30" y="22" width="340" height="200" rx="10" fill="#0C1247"></rect>
<path d="M30 32a10 10 0 0 1 10-10h320a10 10 0 0 1 10 10v22H30z" fill="#1B2470"></path>
<g fill="#8592E6"><circle cx="48" cy="38" r="4"></circle><circle cx="62" cy="38" r="4"></circle><circle cx="76" cy="38" r="4"></circle></g>
<rect x="100" y="31" width="190" height="14" rx="7" fill="#2A3390"></rect>
<rect x="42" y="66" width="110" height="144" rx="6" fill="#141B5E"></rect>
<rect x="54" y="86" width="86" height="6" rx="3" fill="#3B49B8"></rect><rect x="54" y="86" width="52" height="6" rx="3" fill="#F7C95B"></rect><circle cx="106" cy="89" r="7" fill="#FFFFFF"></circle>
<rect x="54" y="118" width="86" height="6" rx="3" fill="#3B49B8"></rect><rect x="54" y="118" width="30" height="6" rx="3" fill="#F7C95B"></rect><circle cx="84" cy="121" r="7" fill="#FFFFFF"></circle>
<rect x="54" y="150" width="86" height="6" rx="3" fill="#3B49B8"></rect><rect x="54" y="150" width="66" height="6" rx="3" fill="#F7C95B"></rect><circle cx="120" cy="153" r="7" fill="#FFFFFF"></circle>
<rect x="54" y="180" width="86" height="20" rx="4" fill="#E9A825"></rect>
<rect x="162" y="66" width="196" height="88" rx="6" fill="#1B2470"></rect>
<rect x="182" y="98" width="156" height="30" rx="15" fill="url(#pl1-b2ShellV)"></rect><rect x="182" y="98" width="156" height="30" rx="15" fill="url(#pl1-b2HotCold)" opacity=".6"></rect>
<rect x="172" y="110" width="176" height="6" rx="3" fill="url(#pl1-b2ColdHot)"></rect>
<rect x="162" y="162" width="196" height="48" rx="6" fill="#141B5E"></rect>
<path d="M172 202C220 198 262 178 350 172" stroke="#35C0DE" stroke-width="3" fill="none" stroke-linecap="round"></path>
</g>
<g id="pl1-artWebOn">
<path d="M172 198C232 194 284 176 350 160" stroke="#F7C95B" stroke-width="3" fill="none" stroke-linecap="round"></path>
<rect x="300" y="74" width="48" height="14" rx="3" fill="#F7C95B"></rect>
<path d="M118 188l16 26 4-9 9 6-6-11 11-1z" fill="#FFFFFF"></path>
</g>
<g id="pl1-artAr">
<path d="M10 206L140 118H400L310 206Z" fill="url(#pl1-b2Steel)" opacity=".75"></path>
<path d="M10 206H310V240H10Z" fill="#0A0F3A" opacity=".55"></path>
<rect x="196" y="140" width="130" height="30" rx="15" fill="#3B49B8"></rect><rect x="196" y="140" width="130" height="30" rx="15" fill="url(#pl1-b2Glass)"></rect>
<g transform="rotate(-8 130 130)">
<rect x="70" y="28" width="120" height="204" rx="18" fill="#0C1247" stroke="#8592E6" stroke-width="3"></rect>
<rect x="80" y="46" width="100" height="168" rx="8" fill="#1B2470"></rect>
<g clip-path="url(#pl1-b2Phone)"><path d="M80 150L124 120H180V214H80Z" fill="#A3ACD9" opacity=".55"></path></g>
<rect x="96" y="126" width="70" height="20" rx="10" fill="#35C0DE" opacity=".85"></rect>
<rect x="88" y="112" width="86" height="48" fill="none" stroke="#9FE9F8" stroke-width="2" stroke-dasharray="6 6"></rect>
<circle cx="130" cy="38" r="3" fill="#8592E6"></circle>
</g>
</g>
<g id="pl1-artArOn">
<g transform="rotate(-8 130 130)"><path d="M84 108h16M84 108v16M178 108h-16M178 108v16M84 164h16M84 164v-16M178 164h-16M178 164v-16" stroke="#F7C95B" stroke-width="3" fill="none"></path><rect x="100" y="80" width="62" height="16" rx="3" fill="#F7C95B"></rect><rect x="82" y="134" width="96" height="2" fill="#9FE9F8"></rect></g>
</g>
<g id="pl1-artVr">
<path d="M64 128C40 60 360 60 336 128" stroke="#3B49B8" stroke-width="20" fill="none" stroke-linecap="round"></path>
<rect x="50" y="88" width="300" height="124" rx="46" fill="url(#pl1-b2ShellV)"></rect>
<rect x="50" y="88" width="300" height="124" rx="46" fill="url(#pl1-b2Glass)"></rect>
<path d="M168 212a32 24 0 0 1 64 0z" fill="#0A0F3A"></path>
<rect x="72" y="106" width="256" height="82" rx="30" fill="#0A0F3A"></rect>
<g clip-path="url(#pl1-b2Visor)">
<rect x="72" y="106" width="256" height="82" fill="url(#pl1-b2Dark)"></rect>
<path d="M72 158H328" stroke="#35C0DE" stroke-width="2" opacity=".8"></path>
<path d="M72 188L150 158M124 188L172 158M200 188V158M276 188L228 158M328 188L250 158" stroke="#35C0DE" stroke-width="1.5" opacity=".45"></path>
<circle cx="200" cy="146" r="70" fill="url(#pl1-b2GlowCyan)" opacity=".55"></circle>
<rect x="150" y="128" width="100" height="26" rx="13" fill="url(#pl1-b2ShellV)"></rect><rect x="150" y="128" width="100" height="26" rx="13" fill="url(#pl1-b2HotCold)" opacity=".7"></rect>
</g>
</g>
<g id="pl1-artVrOn">
<g clip-path="url(#pl1-b2Visor)"><rect x="72" y="106" width="256" height="82" fill="#35C0DE" opacity=".14"></rect><path d="M162 176h76" stroke="#F7C95B" stroke-width="4" stroke-linecap="round"></path><circle cx="200" cy="141" r="6" fill="#F7C95B"></circle><circle cx="200" cy="141" r="14" fill="none" stroke="#F7C95B" stroke-width="2" opacity=".8"></circle></g>
</g>
<g id="pl1-artMr">
<path d="M0 192L120 112H400L360 192Z" fill="url(#pl1-b2Wood)"></path>
<path d="M0 192H360V240H0Z" fill="#6E5A3C"></path>
<ellipse cx="226" cy="176" rx="90" ry="10" fill="#040716" opacity=".35"></ellipse>
<rect x="150" y="128" width="150" height="42" rx="21" fill="url(#pl1-b2Steel)"></rect>
<rect x="150" y="128" width="150" height="42" rx="21" fill="#35C0DE" opacity=".22"></rect>
<rect x="120" y="28" width="172" height="72" rx="8" fill="#0C1247" opacity=".88" stroke="#35C0DE" stroke-width="2"></rect>
<g fill="#9FE9F8"><rect x="134" y="44" width="92" height="8" rx="4"></rect><rect x="134" y="60" width="124" height="8" rx="4" opacity=".7"></rect><rect x="134" y="76" width="64" height="8" rx="4" opacity=".5"></rect></g>
<path d="M206 100V128" stroke="#35C0DE" stroke-width="2" stroke-dasharray="4 4"></path>
<circle cx="206" cy="128" r="5" fill="#35C0DE"></circle>
</g>
<g id="pl1-artMrOn">
<rect x="145" y="123" width="160" height="52" rx="26" fill="none" stroke="#F7C95B" stroke-width="2" stroke-dasharray="6 6"></rect>
<rect x="120" y="28" width="172" height="72" rx="8" fill="#35C0DE" opacity=".16"></rect>
<rect x="240" y="44" width="38" height="8" rx="4" fill="#F7C95B"></rect>
</g>
<g id="pl1-artMachining">
<circle cx="90" cy="100" r="64" fill="url(#pl1-b2Steel)"></circle><circle cx="90" cy="100" r="44" fill="#0A0F3A"></circle>
<rect id="pl1-b2Jaw" x="84" y="44" width="12" height="28" rx="2" fill="#D5DBF3"></rect><rect x="84" y="44" width="12" height="28" rx="2" fill="#D5DBF3" transform="rotate(120 90 100)"></rect><rect x="84" y="44" width="12" height="28" rx="2" fill="#D5DBF3" transform="rotate(240 90 100)"></rect>
<rect x="120" y="82" width="150" height="36" rx="18" fill="url(#pl1-b2Steel)"></rect><rect x="120" y="82" width="150" height="36" rx="18" fill="url(#pl1-b2Glass)"></rect>
<circle cx="250" cy="118" r="34" fill="url(#pl1-b2GlowGold)"></circle>
<path d="M230 150l20-30 20 30z" fill="#141B5E"></path><rect x="240" y="150" width="20" height="30" fill="#0A0F3A"></rect>
<g fill="#F7C95B"><circle cx="262" cy="104" r="3"></circle><circle cx="274" cy="96" r="2.5"></circle><circle cx="268" cy="126" r="2"></circle><circle cx="284" cy="112" r="2"></circle></g>
</g>`;

/** The stage camera's ambient flow and station pings (frozen 584–585; hidden under reduced motion). */
export const STORY_FLOW_SVG = `<g clip-path="url(#pl1-b2Win)" style="opacity:var(--sfl,0)"><path d="M300 236C300 318 350 364 410 364C470 364 476 258 520 258C564 258 556 364 606 364C660 364 700 340 700 392" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="14 30" stroke-opacity=".5" style="animation:pl1-dash 4.6s linear infinite;animation-play-state:var(--pl1-play,running)"></path><path d="M788 268H212M788 310H212M788 352H212" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 34" stroke-opacity=".38" style="animation:pl1-dash 5.6s linear infinite;animation-play-state:var(--pl1-play,running)"></path></g>
<g fill="none" stroke="#F7C95B" stroke-width="2"><g style="opacity:var(--sr0,0)"><circle cx="300" cy="118" r="15" style="transform-box:fill-box;transform-origin:center;animation:pl1-ring 3.2s cubic-bezier(.2,.7,.2,1) 0s infinite;animation-play-state:var(--pl1-play,running)"></circle></g><g style="opacity:var(--sr1,0)"><circle cx="700" cy="498" r="15" style="transform-box:fill-box;transform-origin:center;animation:pl1-ring 3.2s cubic-bezier(.2,.7,.2,1) .8s infinite;animation-play-state:var(--pl1-play,running)"></circle></g><g style="opacity:var(--sr2,0)"><circle cx="928" cy="310" r="15" style="transform-box:fill-box;transform-origin:center;animation:pl1-ring 3.2s cubic-bezier(.2,.7,.2,1) 1.6s infinite;animation-play-state:var(--pl1-play,running)"></circle></g><g style="opacity:var(--sr3,0)"><circle cx="127" cy="261" r="15" style="transform-box:fill-box;transform-origin:center;animation:pl1-ring 3.2s cubic-bezier(.2,.7,.2,1) 2.4s infinite;animation-play-state:var(--pl1-play,running)"></circle></g></g>`;

/** The exchanger window's hot and cold response layer (frozen 588–608, opacity `--sc1`). */
export const STORY_RESPONSE_SVG = `<g clip-path="url(#pl1-b2Win)">
<rect x="336" y="226" width="328" height="168" fill="#0A0F3A" opacity=".5"></rect>
<rect x="336" y="232" width="328" height="72" fill="#F0A93A" opacity=".34"></rect>
<rect x="336" y="316" width="328" height="72" fill="#35C0DE" opacity=".3"></rect>
<g fill="none" stroke-linecap="round">
<path d="M300 254H700" stroke="#FFE3A3" stroke-width="3" stroke-dasharray="18 26" style="animation:pl1-dash 2.8s linear infinite;animation-play-state:var(--pl1-play,running)"></path>
<path d="M300 284H700" stroke="#FFE3A3" stroke-width="2" stroke-dasharray="12 32" opacity=".7" style="animation:pl1-dash 3.8s linear infinite;animation-play-state:var(--pl1-play,running)"></path>
<path d="M700 336H300" stroke="#BFF3FF" stroke-width="3" stroke-dasharray="18 26" style="animation:pl1-dash 2.8s linear infinite;animation-play-state:var(--pl1-play,running)"></path>
<path d="M700 366H300" stroke="#BFF3FF" stroke-width="2" stroke-dasharray="12 32" opacity=".7" style="animation:pl1-dash 3.8s linear infinite;animation-play-state:var(--pl1-play,running)"></path>
</g>
<rect x="336" y="306" width="328" height="8" fill="url(#pl1-b2SteelH)"></rect>
<g fill="none" stroke="#F7C95B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M392 294v22m-6-6l6 6 6-6" style="animation:pl1-drop 2.4s ease-in-out 0s infinite;animation-play-state:var(--pl1-play,running)"></path>
<path d="M448 294v22m-6-6l6 6 6-6" style="animation:pl1-drop 2.4s ease-in-out .5s infinite;animation-play-state:var(--pl1-play,running)"></path>
<path d="M504 294v22m-6-6l6 6 6-6" style="animation:pl1-drop 2.4s ease-in-out 1s infinite;animation-play-state:var(--pl1-play,running)"></path>
<path d="M560 294v22m-6-6l6 6 6-6" style="animation:pl1-drop 2.4s ease-in-out 1.5s infinite;animation-play-state:var(--pl1-play,running)"></path>
<path d="M616 294v22m-6-6l6 6 6-6" style="animation:pl1-drop 2.4s ease-in-out 2s infinite;animation-play-state:var(--pl1-play,running)"></path>
</g>
</g>
<path d="M630 246l16 8-16 8z" fill="#F7C95B"></path>
<path d="M370 328l-16 8 16 8z" fill="#35C0DE"></path>`;

/** Glows, the bundle sweep, the response trace and the outlet rings (frozen 611–612). */
export const STORY_TRACE_SVG = `<g style="opacity:var(--sgi,0)"><circle cx="300" cy="196" r="72" fill="url(#pl1-b2GlowGold)" opacity=".5"></circle></g><g fill="url(#pl1-b2GlowGold)"><circle cx="300" cy="118" r="34" style="opacity:calc(var(--sr0,0) * .42)"></circle><circle cx="700" cy="498" r="34" style="opacity:calc(var(--sr1,0) * .42 + var(--so1,0) * .3)"></circle><circle cx="928" cy="310" r="34" style="opacity:calc(var(--sr2,0) * .42)"></circle><circle cx="127" cy="261" r="34" style="opacity:calc(var(--sr3,0) * .42 + var(--so3,0) * .3)"></circle></g><g clip-path="url(#pl1-b2Win)"><rect x="200" y="226" width="170" height="168" fill="#F7C95B" fill-opacity=".22" style="opacity:var(--sbo,0);transform:var(--sbx,none)"></rect><g fill="none" stroke="#F7C95B" stroke-linecap="round" style="opacity:var(--sto,0)"><path d="M300 236C300 318 350 364 410 364C470 364 476 258 520 258C564 258 556 364 606 364C660 364 700 340 700 392" pathLength="100" stroke-width="14" stroke-opacity=".2" style="stroke-dasharray:100 100;stroke-dashoffset:var(--std,100)"></path><path d="M300 236C300 318 350 364 410 364C470 364 476 258 520 258C564 258 556 364 606 364C660 364 700 340 700 392" pathLength="100" stroke-width="4" style="stroke-dasharray:100 100;stroke-dashoffset:var(--std,100)"></path><path d="M300 236C300 318 350 364 410 364C470 364 476 258 520 258C564 258 556 364 606 364C660 364 700 340 700 392" pathLength="100" stroke="#FFF1C9" stroke-width="7" style="stroke-dasharray:5 300;stroke-dashoffset:var(--sth,100);opacity:var(--sho,0)"></path></g></g><g fill="none" stroke="#F7C95B" stroke-linecap="round" style="opacity:var(--stl,0);transform:var(--stt,none)"><path d="M300 236C300 318 350 364 410 364C470 364 476 258 520 258C564 258 556 364 606 364C660 364 700 340 700 392" stroke-width="14" stroke-opacity=".22"></path><path d="M300 236C300 318 350 364 410 364C470 364 476 258 520 258C564 258 556 364 606 364C660 364 700 340 700 392" stroke-width="4"></path></g>
<g fill="none" stroke="#F7C95B" stroke-width="3"><circle cx="700" cy="498" r="19" style="transform-box:fill-box;transform-origin:center;opacity:var(--so1,0);transform:var(--so1t,none)"></circle><circle cx="127" cy="261" r="19" style="transform-box:fill-box;transform-origin:center;opacity:var(--so3,0);transform:var(--so3t,none)"></circle></g>`;

/** The interpretation plot: grid, axes, fitted curve, eight readings (frozen 629–636). */
export const STORY_PLOT_SVG = `<g stroke="rgba(255,255,255,.08)" stroke-width="1" fill="none" style="opacity:var(--sgr,1)"><path d="M60 196H400M60 142H400M60 88H400M60 34H400"></path><path d="M145 250V30M230 250V30M315 250V30"></path></g>
<path d="M60 250H404M60 250V26" pathLength="100" stroke="rgba(255,255,255,.55)" stroke-width="1.5" fill="none" style="stroke-dasharray:100 100;stroke-dashoffset:var(--sax,0)"></path>
<path d="M60 250C132 160 212 104 400 82" pathLength="100" fill="none" stroke="#F7C95B" stroke-width="3" stroke-linecap="round" style="stroke-dasharray:100 100;stroke-dashoffset:var(--scv,0)"></path>
<g fill="#F7C95B" stroke="#0A0F3A" stroke-width="2">
<circle cx="78" cy="225" r="5.5" style="opacity:var(--sp0,1)"></circle><circle cx="100" cy="207" r="5.5" style="opacity:var(--sp1,1)"></circle><circle cx="125" cy="178" r="5.5" style="opacity:var(--sp2,1)"></circle><circle cx="157" cy="161" r="5.5" style="opacity:var(--sp3,1)"></circle><circle cx="193" cy="134" r="5.5" style="opacity:var(--sp4,1)"></circle><circle cx="234" cy="122" r="5.5" style="opacity:var(--sp5,1)"></circle><circle cx="291" cy="98" r="5.5" style="opacity:var(--sp6,1)"></circle><circle cx="357" cy="90" r="5.5" style="opacity:var(--sp7,1)"></circle>
</g>
<text x="404" y="276" text-anchor="end" class="pl1-plotf" font-weight="600" fill="#C9CEF2" font-family="'Public Sans',system-ui,sans-serif" style="opacity:var(--sgr,1)">NTU</text>
<text transform="translate(30 30) rotate(-90)" text-anchor="end" class="pl1-plotf" font-weight="600" fill="#C9CEF2" font-family="'Public Sans',system-ui,sans-serif" style="opacity:var(--sgr,1)">Effectiveness</text>`;
