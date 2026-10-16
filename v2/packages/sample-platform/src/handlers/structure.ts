/**
 * §3.14 AcademicStructureService + PlatformCourseCodeService (SA-14, SA-15, CM-09) and §3.15
 * PlatformRoleService (SA-16, SA-17).
 *
 * Engineering area groups courses — no Programme level, no Module layer (BC2). A course move is
 * blocked while people are filed against it (B7-07); its preview answers that as a value. The
 * platform code has one writer, the Content Manager (M-2). A holder starts with no scope and
 * nothing is sent when one is registered (T-11); a scope change applies to the holder's very next
 * call, because every call resolves the actor from the records.
 */
import {
  type AcademicStructureService,
  addAreaInput,
  addCourseInput,
  assignScopeInput,
  editDescriptionInput,
  moveCourseInput,
  type PlatformCourseCodeService,
  type PlatformRoleService,
  previewMoveCourseInput,
  registerHolderInput,
  renameInput,
  restoreScopeInput,
  savePlatformCodesInput,
  withdrawScopeInput,
} from '@xr/contracts/draft';
import {
  addArea,
  addCourse,
  assignScope,
  type Course,
  type CourseUsage,
  editDescription,
  type EngineeringArea,
  type InputIssue,
  moveCourse,
  type PlatformRoleHolder,
  planTermState,
  platformCodeKey,
  registerHolder,
  renameStructure,
  restoreScope,
  savePlatformCourseCodes,
  type ScopeTarget,
  scopeCovers,
  type SubjectOf,
  withdrawScope,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import { command, type Op, read, refuse } from '../pipeline/runner.js';
import { values } from '../world/records.js';
import { deferred } from './deferred.js';
import { decideWithIdentity } from './identity-safeguard.js';
import { filedAgainst, structureSubject } from './subjects.js';

function field(input: unknown, name: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[name]
    : undefined;
}

function publishedIn(op: Op, courseId: string): number {
  return values(op.records.experiments).filter((experiment) => experiment.courseId === courseId)
    .length;
}

/** "What uses this course" (SA-15) — derived from the records the course is referenced by. */
function usageOfCourse(op: Op, course: Course): CourseUsage {
  const experiments = new Set(
    values(op.records.experiments)
      .filter((experiment) => experiment.courseId === course.id)
      .map((experiment) => experiment.id as string),
  );
  const institutions = new Set<string>();
  for (const plan of values(op.records.plans)) {
    if (planTermState(plan, op.now) === 'ended') continue;
    if (plan.items.some((item) => experiments.has(item.experimentId)))
      institutions.add(plan.institutionId);
  }
  const filed = filedAgainst(op.records, course.id);
  return {
    institutionsWithAccess: [...institutions] as CourseUsage['institutionsWithAccess'][number][],
    vendorsInScope: values(op.records.holders).filter(
      (holder) => holder.role === 'vendor' && scopeCovers(holder, { courseId: course.id }),
    ).length,
    facultyMapped: filed.faculty,
    studentsFiled: filed.students,
    publishedExperiments: experiments.size,
  };
}

/** The area or course a rename or description edit names. */
function structureRecord(op: Op, input: unknown): EngineeringArea | Course {
  const id = op.idText(field(input, 'id'));
  const kind = field(input, 'kind');
  if (kind === 'area') return op.found(op.records.areas[id]);
  if (kind === 'course') return op.found(op.records.courses[id]);
  return refuse({ kind: 'not-found' });
}

function isCourse(record: EngineeringArea | Course): record is Course {
  return 'areaId' in record;
}

function putStructure(op: Op, record: EngineeringArea | Course): void {
  if (isCourse(record)) op.tx.put('courses', record.id, record);
  else op.tx.put('areas', record.id, record);
}

export function academicStructurePort(call: Call): AcademicStructureService {
  return {
    getArea: deferred('AcademicStructureService.getArea'),
    getCourse: deferred('AcademicStructureService.getCourse'),

    getStructure: () =>
      read(call, 'AcademicStructureService.getStructure', (op) => {
        op.person();
        const courses = values(op.records.courses);
        return values(op.records.areas).map((area) => ({
          area,
          courses: courses
            .filter((course) => course.areaId === area.id)
            .map((course) => ({ course, publishedExperiments: publishedIn(op, course.id) })),
        }));
      }),

    addArea: (input) =>
      command(call, 'AcademicStructureService.addArea', (op) => {
        const person = op.person();
        op.allow(person, 'structure.add-area', structureSubject(op.records, null));
        const accepted = op.parse(addAreaInput, input);
        const area = op.decide(
          addArea({
            areas: values(op.records.areas),
            name: accepted.name,
            description: accepted.description,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          () => ({ name: accepted.name }),
        );
        // The public explorer is unchanged until the area has published experiments (OD-B7-13).
        op.tx.put('areas', area.id, area);
        return { value: area, decision: 'addArea', actor: person.ref };
      }),

    addCourse: (input) =>
      command(call, 'AcademicStructureService.addCourse', (op) => {
        const person = op.person();
        op.allow(person, 'structure.add-course', structureSubject(op.records, null));
        const accepted = op.parse(addCourseInput, input);
        if (!op.records.areas[accepted.areaId]) refuse({ kind: 'not-found' });
        const course = op.decide(
          addCourse({
            courses: values(op.records.courses),
            areas: values(op.records.areas),
            areaId: accepted.areaId,
            name: accepted.name,
            description: accepted.description,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          () => ({ name: accepted.name }),
        );
        // No platform code: "added by the Content Manager in Course codes" (B7-07).
        op.tx.put('courses', course.id, course);
        return { value: course, decision: 'addCourse', actor: person.ref };
      }),

    rename: (input) =>
      command(call, 'AcademicStructureService.rename', (op) => {
        const person = op.person();
        const record = structureRecord(op, input);
        op.allow(
          person,
          'structure.rename',
          structureSubject(op.records, isCourse(record) ? record : null),
        );
        const accepted = op.parse(renameInput, input);
        op.rev(record, accepted.expectedRev);
        const renamed = isCourse(record)
          ? op.decide(
              renameStructure({
                record,
                siblings: values(op.records.courses),
                name: accepted.name,
                actor: person.ref,
                now: op.now,
                ids: op.ids,
              }),
              input,
              () => ({ name: accepted.name }),
            )
          : op.decide(
              renameStructure({
                record,
                siblings: values(op.records.areas),
                name: accepted.name,
                actor: person.ref,
                now: op.now,
                ids: op.ids,
              }),
              input,
              () => ({ name: accepted.name }),
            );
        putStructure(op, renamed);
        return { value: renamed, decision: 'renameStructure', actor: person.ref };
      }),

    editDescription: (input) =>
      command(call, 'AcademicStructureService.editDescription', (op) => {
        const person = op.person();
        const record = structureRecord(op, input);
        op.allow(
          person,
          'structure.rename',
          structureSubject(op.records, isCourse(record) ? record : null),
        );
        const accepted = op.parse(editDescriptionInput, input);
        op.rev(record, accepted.expectedRev);
        const edited = isCourse(record)
          ? op.decide(
              editDescription({
                record,
                description: accepted.description,
                actor: person.ref,
                now: op.now,
                ids: op.ids,
              }),
              input,
            )
          : op.decide(
              editDescription({
                record,
                description: accepted.description,
                actor: person.ref,
                now: op.now,
                ids: op.ids,
              }),
              input,
            );
        putStructure(op, edited);
        return { value: edited, decision: 'editDescription', actor: person.ref };
      }),

    previewMoveCourse: (input) =>
      read(call, 'AcademicStructureService.previewMoveCourse', (op) => {
        const person = op.person();
        const course = op.found(op.records.courses[op.idText(field(input, 'courseId'))]);
        const filed = filedAgainst(op.records, course.id);
        // The role may move a course; the people filed against it are the preview's value.
        op.allow(person, 'structure.move-course', {
          ...structureSubject(op.records, course),
          filed: { students: 0, faculty: 0 },
        });
        const accepted = op.parse(previewMoveCourseInput, input);
        const decision = moveCourse({
          course,
          areas: values(op.records.areas),
          targetAreaId: accepted.toAreaId,
          filed,
          actor: person.ref,
          now: op.now,
          ids: op.ids,
        });
        const blocked =
          !decision.ok &&
          decision.refusal.kind === 'refused' &&
          decision.refusal.code === 'course-has-people-filed';
        if (!decision.ok && !blocked) op.decide(decision, input);
        return { blocked, blockers: filed, movesWithIt: usageOfCourse(op, course) };
      }),

    moveCourse: (input) =>
      command(call, 'AcademicStructureService.moveCourse', (op) => {
        const person = op.person();
        const course = op.found(op.records.courses[op.idText(field(input, 'courseId'))]);
        const subject: SubjectOf<'structure'> = structureSubject(op.records, course);
        op.allow(person, 'structure.move-course', subject);
        const accepted = op.parse(moveCourseInput, input);
        op.rev(course, accepted.expectedRev);
        const moved = op.decide(
          moveCourse({
            course,
            areas: values(op.records.areas),
            targetAreaId: accepted.toAreaId,
            filed: subject.filed,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        // Published experiments, access and Vendor course lists reference the course, not the area.
        op.tx.put('courses', moved.id, moved);
        return { value: moved, decision: 'moveCourse', actor: person.ref };
      }),
  };
}

export function platformCourseCodePort(call: Call): PlatformCourseCodeService {
  return {
    list: () =>
      read(call, 'PlatformCourseCodeService.list', (op) => {
        // CM-09 is the Content Manager's: the one writer of platform codes (M-2). The Super Admin
        // reads them in Academic structure (SA-14), not here.
        const person = op.person();
        if (person.role !== 'content_manager')
          refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
        const published = values(op.records.experiments);
        return values(op.records.courses)
          .map((course) => ({
            course,
            areaName: op.records.areas[course.areaId]?.name ?? '',
            publishedExperiments: published.filter(
              (experiment) => experiment.courseId === course.id,
            ).length,
          }))
          .filter((row) => row.areaName !== '');
      }),

    save: (input) =>
      command(call, 'PlatformCourseCodeService.save', (op) => {
        const person = op.person();
        op.allow(person, 'platform-course-code.save', structureSubject(op.records, null));
        const accepted = op.parse(savePlatformCodesInput, input);
        for (const change of accepted.changes) {
          const course = op.records.courses[change.courseId];
          if (course) op.rev(course, change.expectedRev);
        }
        const courses = values(op.records.courses);
        const codeOf = (courseId: string): string | null => {
          const change = accepted.changes.findLast((candidate) => candidate.courseId === courseId);
          if (change) return change.code;
          return courses.find((course) => course.id === courseId)?.platformCode ?? null;
        };
        const saved = op.decide(
          savePlatformCourseCodes({
            courses,
            changes: accepted.changes,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          (issue: InputIssue): Readonly<Record<string, string>> => {
            if (issue.rule !== 'code-taken') return {};
            const code = codeOf(issue.field) ?? '';
            const other = courses.find(
              (course) =>
                course.id !== issue.field &&
                codeOf(course.id) !== null &&
                platformCodeKey(codeOf(course.id)!) === platformCodeKey(code),
            );
            return { code, course: other?.name ?? '' };
          },
        );
        for (const course of saved) op.tx.put('courses', course.id, course);
        const named = new Set(accepted.changes.map((change) => change.courseId as string));
        return {
          value: saved.filter((course) => named.has(course.id)),
          decision: 'savePlatformCourseCodes',
          actor: person.ref,
        };
      }),
  };
}

function holderSubject(
  op: Op,
  holder: PlatformRoleHolder | null,
  scopeId: unknown,
): SubjectOf<'role-holder'> {
  return {
    kind: 'role-holder',
    holder,
    holders: values(op.records.holders),
    scopeId:
      typeof scopeId === 'string' && scopeId !== ''
        ? (scopeId as SubjectOf<'role-holder'>['scopeId'])
        : null,
  };
}

/** "<X> is already in scope" (B7-08): the course code, the experiment's name, or the drawn label. */
function targetWords(op: Op, target: ScopeTarget): string {
  if (target.kind === 'course') {
    const course = op.records.courses[target.courseId];
    return course?.platformCode ?? course?.name ?? target.courseId;
  }
  if (target.kind === 'experiment') {
    return op.records.experiments[target.experimentId]?.live.catalogue.name ?? target.experimentId;
  }
  return 'All experiments';
}

export function platformRolePort(call: Call): PlatformRoleService {
  return {
    listHolders: deferred('PlatformRoleService.listHolders'),
    getHolder: deferred('PlatformRoleService.getHolder'),

    registerHolder: (input) =>
      command(call, 'PlatformRoleService.registerHolder', (op) => {
        const person = op.person();
        op.allow(person, 'platform-role.register', holderSubject(op, null, null));
        const accepted = op.parse(registerHolderInput, input);
        // Package 2B (PC-49): an e-mail another sample identity signs in with is refused with SA-16's
        // own words ("Someone is already registered with this e-mail address"), not shadowed.
        const holder = decideWithIdentity(
          op,
          registerHolder({
            holders: values(op.records.holders),
            role: accepted.role,
            name: accepted.name,
            workEmail: accepted.workEmail,
            organisation: accepted.organisation,
            personId: op.ids.next('person'),
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          {
            email: accepted.workEmail,
            field: 'workEmail',
            key: 'SA-16.workEmail.taken',
            order: ['role', 'name', 'workEmail', 'organisation'],
          },
        );
        // "They start with no scope — you assign it next. Nothing is sent from here." (T-11)
        op.tx.put('holders', holder.id, holder);
        return { value: holder, decision: 'registerHolder', actor: person.ref };
      }),

    assignScope: (input) =>
      command(call, 'PlatformRoleService.assignScope', (op) => {
        const person = op.person();
        const holder = op.found(op.records.holders[op.idText(field(input, 'holderId'))]);
        op.allow(person, 'platform-role.assign-scope', holderSubject(op, holder, null));
        const accepted = op.parse(assignScopeInput, input);
        const target = accepted.target;
        if (target.kind === 'course' && !op.records.courses[target.courseId])
          refuse({ kind: 'not-found' });
        if (target.kind === 'experiment' && !op.records.experiments[target.experimentId])
          refuse({ kind: 'not-found' });
        op.rev(holder, accepted.expectedRev);
        const next = op.decide(
          assignScope({ holder, target, actor: person.ref, now: op.now, ids: op.ids }),
          input,
          () => ({ target: targetWords(op, target) }),
        );
        op.tx.put('holders', next.id, next);
        return { value: next, decision: 'assignScope', actor: person.ref };
      }),

    withdrawScope: (input) =>
      command(call, 'PlatformRoleService.withdrawScope', (op) => {
        const person = op.person();
        const holder = op.found(op.records.holders[op.idText(field(input, 'holderId'))]);
        op.allow(
          person,
          'platform-role.withdraw-scope',
          holderSubject(op, holder, field(input, 'scopeId')),
        );
        const accepted = op.parse(withdrawScopeInput, input);
        op.rev(holder, accepted.expectedRev);
        const next = op.decide(
          withdrawScope({
            holder,
            scopeId: accepted.scopeId,
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        // Work in flight is not changed (ROLE-09 open): the queues read the scopes as they are.
        op.tx.put('holders', next.id, next);
        return { value: next, decision: 'withdrawScope', actor: person.ref };
      }),

    restoreScope: (input) =>
      command(call, 'PlatformRoleService.restoreScope', (op) => {
        const person = op.person();
        const holder = op.found(op.records.holders[op.idText(field(input, 'holderId'))]);
        op.allow(
          person,
          'platform-role.restore-scope',
          holderSubject(op, holder, field(input, 'scopeId')),
        );
        const accepted = op.parse(restoreScopeInput, input);
        op.rev(holder, accepted.expectedRev);
        const next = op.decide(
          restoreScope({
            holder,
            scopeId: accepted.scopeId,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('holders', next.id, next);
        return { value: next, decision: 'restoreScope', actor: person.ref };
      }),
  };
}
