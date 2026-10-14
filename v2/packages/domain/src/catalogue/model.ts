/**
 * M06 Engineering area, M07 Course (+ platform course code), M08 Institution course code,
 * M09 Experiment (versions, format delivery, learning outcomes, resources) — Appendix C §2.
 *
 * Engineering area is a catalogue grouping of courses: there is no Programme level and no Module
 * layer (BC2; matrix CRS-07). An experiment exists only once published; an unpublished one is a
 * Submission (M10). Every surface reads only the live version (B7-11). The two Composite Wall
 * experiments are two records with two slugs — never merged or de-duplicated (BC11, EXP-11).
 */
import type { ActorRef } from '../roles.js';
import { inDisplayOrder, type Technology } from '../technology.js';
import type { Brand } from '../kernel/brand.js';
import type { HistoryEntry } from '../kernel/history.js';
import type {
  AreaId,
  CourseId,
  ExperimentId,
  InstitutionId,
  LearningOutcomeId,
  ResourceId,
  SubmissionId,
  UpdateId,
} from '../kernel/ids.js';
import type { RecordMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';

export type StructureEvent =
  | 'area-added'
  | 'course-added'
  | 'renamed'
  | 'description-changed'
  | 'course-moved'
  | 'platform-code-set';

export interface EngineeringArea extends RecordMeta {
  readonly id: AreaId;
  /** Unique among areas: 'Mechanical & Manufacturing'. */
  readonly name: string;
  readonly description: string | null;
  /** Concept artwork from the asset set; initials when absent (no upload, D3). */
  readonly artworkKey: string | null;
  readonly history: readonly HistoryEntry<StructureEvent>[];
}

/** 'ME ZG523' — contains a space; may be blank (T-17). */
export type PlatformCourseCode = Brand<string, 'PlatformCourseCode'>;

export interface Course extends RecordMeta {
  readonly id: CourseId;
  readonly areaId: AreaId;
  /** Unique among courses: 'Thermodynamics & Heat Transfer'. */
  readonly name: string;
  readonly description: string | null;
  /** Single writer: the Content Manager (M-2; CC-04). */
  readonly platformCode: PlatformCourseCode | null;
  readonly history: readonly HistoryEntry<StructureEvent>[];
}

/** "What uses this course" (SA-15), listed before a move — derived by the service. */
export interface CourseUsage {
  readonly institutionsWithAccess: readonly InstitutionId[];
  readonly vendorsInScope: number;
  readonly facultyMapped: number;
  readonly studentsFiled: number;
  readonly publishedExperiments: number;
}

/** The institution's own code for a course (IA-16); keyed by (institution, course). */
export interface InstitutionCourseCode extends RecordMeta {
  readonly institutionId: InstitutionId;
  readonly courseId: CourseId;
  /** 'MEC-523' — no format rule. */
  readonly code: string | null;
  /** 'Sem II' — optional, and needs a code (BR-021). */
  readonly semester: string | null;
  readonly setAt: IsoInstant;
  readonly setBy: ActorRef;
}

/** "Missing / Added" (B2-03 `stateText`) — derived from the code. */
export const INSTITUTION_CODE_STATUSES = ['missing', 'added'] as const;
export type InstitutionCodeStatus = (typeof INSTITUTION_CODE_STATUSES)[number];

export interface CatalogueDetails {
  readonly name: string;
  readonly summary: string;
  readonly description: string;
}

export type FormatDelivery =
  | {
      readonly format: 'web';
      readonly webLink: string;
      readonly browserAndComputer: string;
      readonly notes: string | null;
    }
  | {
      readonly format: 'ar' | 'vr' | 'mr';
      readonly packageLabel: string;
      readonly packageReference: string | null;
      readonly packageFileName: string | null;
      readonly deviceNeeded: string;
      readonly installNotes: string;
      readonly notes: string | null;
    };

/** Only formats that passed governance (LD-2), in display order WEB · AR · VR · MR. */
export interface PublishedFormat {
  readonly format: Technology;
  readonly delivery: FormatDelivery;
}

export interface PreviewLink {
  readonly label: string | null;
  readonly link: string;
}

/** Sample file names only — nothing is uploaded (OD-B5-11). */
export interface DocumentRef {
  readonly fileName: string;
}

/** One ordered experiment-level set for every format, written by the Academic Reviewer (LD-3). */
export interface LearningOutcome {
  readonly id: LearningOutcomeId;
  readonly text: string;
}

export interface LearningResource {
  readonly id: ResourceId;
  readonly title: string;
  /** 'PDF document' · 'Web page' · 'Spreadsheet' (sample, OD-B3-06). */
  readonly kind: string;
  readonly sizeLabel: string;
  /** Opens in a new tab (T-15). */
  readonly href: string;
}

export interface ExperimentVersion {
  /** '1.0' at first publication; '1.2', '1.3' after releases. */
  readonly label: string;
  readonly liveFrom: IsoInstant;
  readonly liveUntil: IsoInstant | null;
  readonly source:
    | {
        readonly kind: 'first-publication';
        readonly submissionId: SubmissionId | null;
        readonly revision: number | null;
      }
    | { readonly kind: 'correction-release'; readonly updateId: UpdateId };
  readonly catalogue: CatalogueDetails;
  readonly formats: readonly PublishedFormat[];
  readonly preview: PreviewLink | null;
  readonly documents: readonly DocumentRef[];
}

export interface Experiment extends RecordMeta {
  readonly id: ExperimentId;
  readonly courseId: CourseId;
  /** SUB-0077 → EXP; null for catalogue items published before the sample period. */
  readonly originSubmissionId: SubmissionId | null;
  readonly vendorOrganisation: string;
  /**
   * Concept artwork from the asset set for the catalogue row, cards and hero (B1-01, B1-04 `art`,
   * B1-05; "Thumbnail (concept artwork, decorative)"); null when none is assigned — no artwork
   * upload is designed (D3), so an experiment published in the sample period has none.
   * Provisional contract register PC-31.
   */
  readonly artworkKey: string | null;
  readonly live: ExperimentVersion;
  /** Every version and decision is kept (B7-11). */
  readonly versions: readonly ExperimentVersion[];
  readonly learningOutcomes: readonly LearningOutcome[];
  readonly resources: readonly LearningResource[];
  readonly publishedAt: IsoInstant;
  readonly publishedBy: ActorRef;
  /** At most one open correction (B6-08 "Never a second, conflicting update"). */
  readonly openUpdateId: UpdateId | null;
}

/** The published formats of the live version, in display order (WEB · AR · VR · MR). */
export function publishedFormats(experiment: Experiment): readonly Technology[] {
  return inDisplayOrder(experiment.live.formats.map((entry) => entry.format));
}
