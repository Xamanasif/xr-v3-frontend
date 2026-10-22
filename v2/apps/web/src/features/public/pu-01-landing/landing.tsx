'use client';

import './landing-v1.css';

import { SkipLink } from '@xr/ui';
import {
  type PointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { HERO_SCENES } from '@/copy/landing-v1';
import { AREAS, CATALOGUE } from '@/copy/public';
import { DocumentTitle } from '@/features/shared/document-title';
import { useAppNavigation } from '@/nav/navigation';
import { usePublicCatalogue, usePublicStructure } from '@/queries/catalogue';

import { FailedBlock } from '../shared/blocks';
import { LandingArtDefs } from './art-defs';
import { areaPanels, featuredCards, formatCounts, heroChips } from './bind';
import { Explorer, Featured } from './discover';
import { LandingHeader, type LandingSection } from './header';
import { Hero, Tricolour } from './hero';
import { heroReducer, INITIAL_HERO, motionOn, ROTATION_MS, rotates } from './hero-state';
import {
  breakpointOf,
  INTRO_DELAY_MS,
  landingLayout,
  REVEAL_DELAY_MS,
  storyConfig,
  type StoryConfig,
} from './layout';
import { Academic, Access, Closing, Formats, LandingFooter } from './lower';
import { setupReveal } from './reveal';
import { Story } from './story';
import { StoryEngine } from './story-engine';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduce(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const reducedNow = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(REDUCE_QUERY).matches;

/** `prefers-reduced-motion`, read and followed as the frozen file does (1118–1124). */
function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduce, reducedNow, () => false);
}

/** The hero's parallax layers move together (frozen `heroMove` 1248, `heroLeave` 1252). */
function moveLayers(
  layers: readonly (HTMLElement | null)[],
  transition: string,
  transform: string,
): void {
  for (const layer of layers) {
    if (!layer) continue;
    layer.style.transition = transition;
    layer.style.transform = transform;
  }
}

/** The document offset of an element (the frozen `offsetTop`, 1555). */
function offsetTopOf(element: HTMLElement): number {
  let y = 0;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.offsetParent as HTMLElement | null
  ) {
    y += node.offsetTop;
  }
  return y;
}

/**
 * PU-01 Landing with PU-14 — the V1 Direction B2 landing (owner-authorised prompt 13): an isolated,
 * one-to-one translation of `21 · FROZEN · Premium Direction B2 - BITS Immersive Experience`'s
 * LANDING view (SHA-256 3dbe9412…4d07c) — not its catalogue subview, harness or scaled frame.
 * Section order (frozen 404–920): sticky header → hero → tricolour → Featured → Explore by area →
 * Inside a simulation → Formats → Academic quality → For institutions (PU-14) → closing band →
 * footer.
 *
 * It owns the frozen component's state (1106: the hero scene and motion, the selector's hover,
 * the explorer's area, the previewed format, the featured hover, the story step, the intro) and
 * its timers, observers and listeners, and reads its data from the existing catalogue reads
 * (`bind.ts`). Its look is `landing-v1.css`, scoped to the landing root in the `xr.product` layer.
 * The landing renders outside the v46 public shell (its own route group), so its header sticks.
 */
export function Landing() {
  const navigation = useAppNavigation();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const parallax = useRef<(HTMLDivElement | null)[]>([]);
  const parallaxLayer = useCallback((index: number, node: HTMLDivElement | null) => {
    parallax.current[index] = node;
  }, []);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [width, setWidth] = useState<number | null>(null);
  const [viewH, setViewH] = useState<number | null>(null);
  const [hero, dispatch] = useReducer(heroReducer, INITIAL_HERO);
  const [intro, setIntro] = useState(false);
  const [heroHover, setHeroHover] = useState(-1);
  const [expSel, setExpSel] = useState(0);
  const [fmtSel, setFmtSel] = useState(-1);
  const [featHover, setFeatHover] = useState(-1);
  const [storySel, setStorySel] = useState(0);

  // ---- data (bind.ts; D-14) ----
  const structure = usePublicStructure();
  const all = usePublicCatalogue({ text: '', areaId: null, featured: false, sort: 'default' });
  const featured = usePublicCatalogue({ text: '', areaId: null, featured: true, sort: 'default' });
  const entries = all.data?.ok ? all.data.value.entries : null;
  const total = all.data?.ok ? all.data.value.total : null;
  const structureRows = structure.data?.ok ? structure.data.value : null;
  const chips = useMemo(() => heroChips(entries), [entries]);
  const cards = useMemo(
    () => (featured.data?.ok ? featuredCards(featured.data.value.entries, structureRows) : []),
    [featured.data, structureRows],
  );
  const panels = useMemo(() => (structureRows ? areaPanels(structureRows) : []), [structureRows]);
  const counts = useMemo(() => (entries ? formatCounts(entries) : null), [entries]);

  // ---- measure (the frozen frame width; the real viewport height, D-9) ----
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      setWidth(root.clientWidth);
      setViewH(window.innerHeight);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(root);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  const layout = landingLayout(width ?? 1440);
  const narrow = width !== null && breakpointOf(width) !== 'mid' && breakpointOf(width) !== 'wide';
  const config: StoryConfig | null =
    width === null || viewH === null ? null : storyConfig(width, reduce, viewH);
  const configRef = useRef(config);
  // The sticky stage's top (1740 `stageTop`): a value only the viewport decides, written onto the
  // root as a custom property, as the story engine writes the stage's.
  const stickyTop = config?.stickyTop ?? null;
  useLayoutEffect(() => {
    if (stickyTop !== null) rootRef.current?.style.setProperty('--pl1-stage-top', `${stickyTop}px`);
  }, [stickyTop]);
  const storySelRef = useRef(storySel);
  // The story engine runs outside React (requestAnimationFrame); it reads the latest of both.
  useLayoutEffect(() => {
    configRef.current = config;
    storySelRef.current = storySel;
  });

  // ---- reduced motion stops rotation (1120–1122) ----
  useEffect(() => {
    if (reduce) dispatch({ type: 'reduce', matches: true });
  }, [reduce]);

  // ---- the intro stagger, 90 ms after mount (1152) ----
  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(true), INTRO_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // ---- scroll reveals, 160 ms after mount (1153, setupReveal 1190–1214) ----
  useEffect(() => {
    let release: (() => void) | null = null;
    const timer = window.setTimeout(() => {
      if (rootRef.current) release = setupReveal(rootRef.current, reducedNow());
    }, REVEAL_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      release?.();
    };
  }, []);

  // ---- hero rotation (tick 1218–1231; visibilitychange 1148) ----
  const live = rotates(hero, reduce);
  useEffect(() => {
    if (!live) return;
    let timer = 0;
    const tick = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = 0;
        if (document.hidden) return;
        const node = heroRef.current;
        if (node) {
          const box = node.getBoundingClientRect();
          // Skipped while the hero is off screen (1227), then tried again.
          if (box.bottom < 40 || box.top > window.innerHeight) {
            tick();
            return;
          }
        }
        dispatch({ type: 'advance', count: HERO_SCENES.length });
      }, ROTATION_MS);
    };
    const onVisibility = () => {
      if (document.hidden) {
        window.clearTimeout(timer);
        timer = 0;
      } else tick();
    };
    tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [live, hero.gen]);

  // ---- pointer parallax (heroMove 1236–1250, heroLeave 1251–1253) ----
  const pointer = useRef({ x: 0, y: 0, raf: 0 });
  useEffect(() => {
    const state = pointer.current;
    return () => {
      if (state.raf) window.cancelAnimationFrame(state.raf);
    };
  }, []);
  const onHeroMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (reduce) return;
      const node = heroRef.current;
      if (!node) return;
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const state = pointer.current;
      state.x = (event.clientX - box.left) / box.width - 0.5;
      state.y = (event.clientY - box.top) / box.height - 0.5;
      if (state.raf) return;
      state.raf = window.requestAnimationFrame(() => {
        state.raf = 0;
        const tx = (-state.x * 14).toFixed(1);
        const ty = (-state.y * 9).toFixed(1);
        moveLayers(
          parallax.current,
          'transform 600ms cubic-bezier(.2,.7,.2,1)',
          `translate3d(${tx}px,${ty}px,0)`,
        );
      });
    },
    [reduce],
  );
  const onHeroLeave = useCallback(() => {
    moveLayers(parallax.current, 'transform 900ms cubic-bezier(.2,.7,.2,1)', 'translate3d(0,0,0)');
  }, []);

  // ---- the story engine (1255–1449) ----
  const engineRef = useRef<StoryEngine | null>(null);
  useEffect(() => {
    const engine = new StoryEngine({
      config: () => configRef.current,
      stage: () => stageRef.current,
      track: () => trackRef.current,
      selected: () => storySelRef.current,
      select: (index) => setStorySel(index),
    });
    engineRef.current = engine;
    const kick = () => engine.kick();
    const invalidate = () => engine.invalidate();
    const input = () => engine.input();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', invalidate);
    // Wheel, touch, pointer and key input cancel a scroll-mode tween before the index acts
    // (`_onStoryInput` 1156–1157 sits under the buttons' own handlers).
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    for (const name of inputs)
      window.addEventListener(name, input, { passive: true, capture: true });
    const observer =
      typeof ResizeObserver === 'undefined' || !rootRef.current
        ? null
        : new ResizeObserver(invalidate);
    if (observer && rootRef.current) observer.observe(rootRef.current);
    let alive = true;
    try {
      void document.fonts?.ready.then(() => {
        if (alive) invalidate();
      });
    } catch {
      // No font loading API: the 1.5 s geometry refresh covers it.
    }
    engine.sync();
    return () => {
      alive = false;
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', invalidate);
      for (const name of inputs) window.removeEventListener(name, input, { capture: true });
      observer?.disconnect();
    };
  }, []);
  // After every render: the geometry may have moved and the mode may have changed (1161–1175).
  useEffect(() => {
    engineRef.current?.sync();
  });

  // ---- section scrolling (scrollToRef / goSection 1552–1563) ----
  const goSection = useCallback(
    (section: LandingSection) => {
      const target = document.getElementById(section);
      if (!target) return;
      const top = Math.max(0, offsetTopOf(target) - layout.headerH);
      if (reducedNow()) window.scrollTo(0, top);
      else window.scrollTo({ top, behavior: 'smooth' });
    },
    [layout.headerH],
  );

  const motion = motionOn(hero, reduce);
  const ambientOn = !reduce && hero.ambient;

  const featuredStatus = featured.isError ? (
    <FailedBlock
      title={CATALOGUE.failedTitle}
      line={CATALOGUE.failedLine}
      retryLabel={CATALOGUE.retry}
      onRetry={() => void featured.refetch()}
    />
  ) : featured.data?.ok ? null : (
    <span className="xr-sr" role="status">
      {CATALOGUE.loading}
    </span>
  );
  const explorerStatus = structure.isError ? (
    <FailedBlock
      compact
      title={AREAS.failedTitle}
      line={AREAS.failedLine}
      retryLabel={AREAS.retry}
      onRetry={() => void structure.refetch()}
      forward={{ href: '/experiments', label: AREAS.browse }}
    />
  ) : structureRows ? null : (
    <span className="xr-sr" role="status">
      {AREAS.loading}
    </span>
  );

  return (
    <div ref={rootRef} className="pl1" data-landing="v1">
      <div
        className="pl1-root"
        data-intro={intro || reduce ? 'on' : undefined}
        data-reduce={reduce ? 'on' : undefined}
        data-still={ambientOn ? undefined : 'on'}
        data-motion={motion ? 'on' : undefined}
        data-smode={config?.mode ?? 'scroll'}
      >
        <DocumentTitle title="" />
        <LandingArtDefs />
        <SkipLink />
        <LandingHeader goSection={goSection} />
        <main id="main" tabIndex={-1} className="pl1-main">
          <Hero
            state={hero}
            reduce={reduce}
            hover={heroHover}
            chips={chips}
            heroRef={heroRef}
            parallaxLayer={parallaxLayer}
            onPointerMove={onHeroMove}
            onPointerLeave={onHeroLeave}
            onSelect={(index) => dispatch({ type: 'select', index })}
            onHover={(index, on) =>
              setHeroHover((current) => (on ? index : current === index ? -1 : current))
            }
            onTogglePlay={() => dispatch({ type: 'toggle', reduce })}
            goSection={goSection}
          />
          <Tricolour />
          <Featured
            cards={cards}
            total={total}
            hover={featHover}
            reduce={reduce}
            onHover={(index, on) =>
              setFeatHover((current) => (on ? index : current === index ? -1 : current))
            }
            onOpen={(href) => navigation.navigate(href)}
            status={featuredStatus}
          />
          <Explorer
            panels={panels}
            selected={Math.min(expSel, Math.max(0, panels.length - 1))}
            narrow={narrow}
            onSelect={setExpSel}
            status={explorerStatus}
          />
          <Story
            selected={storySel}
            trackRef={trackRef}
            stageRef={stageRef}
            onChoose={(index) => engineRef.current?.choose(index)}
          />
          <Formats counts={counts} total={total} selected={fmtSel} onPreview={setFmtSel} />
          <Academic />
          <Access />
          <Closing />
        </main>
        <LandingFooter goSection={goSection} />
      </div>
    </div>
  );
}
