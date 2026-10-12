import type { IconName } from '@xr/ui';

/**
 * Harness fixture copy for the WP-0.8 role-shell specimens (boards 05 and 06): kept out of the
 * 'use client' role-shells.tsx so the server-side specimen registry gets plain data, not client
 * references. The browser suite compares what renders with the frozen board 06 itself.
 */

const GIT = 'Godavari Institute of Technology';

export interface RoleFixture {
  /** The workspace label (B8-03). */
  readonly workspace: string;
  /** The institution or organisation line; none for the platform roles (board 06). */
  readonly line?: string;
  /** Board 05's sample person. */
  readonly person: string;
  readonly initials: string;
  /** Board 06 `raw[]`: label, registry icon, sample count. */
  readonly destinations: readonly {
    readonly label: string;
    readonly icon: IconName;
    readonly count?: { readonly value: number; readonly label: string };
  }[];
}

export const ROLE_FIXTURES = {
  student: {
    workspace: 'Student',
    line: GIT,
    person: 'Rahul Verma',
    initials: 'RV',
    destinations: [
      { label: 'Home', icon: 'home' },
      { label: 'My courses', icon: 'myCourses' },
      { label: 'Assessments', icon: 'assessments' },
      { label: 'Progress', icon: 'progress' },
    ],
  },
  faculty: {
    workspace: 'Faculty',
    line: GIT,
    person: 'Dr S. Ranganathan',
    initials: 'SR',
    destinations: [
      { label: 'Overview', icon: 'overview' },
      { label: 'My courses', icon: 'myCourses' },
      { label: 'Assessments', icon: 'assessments' },
      { label: 'Question bank', icon: 'questionBank' },
      {
        label: 'Marking',
        icon: 'marking',
        count: { value: 12, label: '12 written answers to mark' },
      },
      { label: 'Students', icon: 'studentsPeople' },
    ],
  },
  'institute-admin': {
    workspace: 'Institute Admin',
    line: GIT,
    person: 'Meera Iyer',
    initials: 'MI',
    destinations: [
      { label: 'Overview', icon: 'overview' },
      { label: 'Content access', icon: 'contentAccess' },
      { label: 'Student access', icon: 'studentAccess' },
      { label: 'People', icon: 'studentsPeople' },
      {
        label: 'Requests',
        icon: 'requests',
        count: { value: 2, label: '2 device requests to forward' },
      },
      { label: 'Usage', icon: 'usage' },
    ],
  },
  vendor: {
    workspace: 'Vendor',
    line: 'Northline Simulation Studio',
    person: 'Anil Shetty',
    initials: 'AS',
    destinations: [
      { label: 'Overview', icon: 'overview' },
      { label: 'My experiments', icon: 'myExperiments' },
    ],
  },
  'academic-reviewer': {
    workspace: 'Academic Reviewer',
    person: 'Prof. A. Menon',
    initials: 'AM',
    destinations: [
      { label: 'Overview', icon: 'overview' },
      {
        label: 'Review queue',
        icon: 'reviewQueue',
        count: { value: 4, label: '4 waiting for review' },
      },
      { label: 'Reviewed by me', icon: 'reviewedByMe' },
    ],
  },
  'content-manager': {
    workspace: 'Content Manager',
    person: 'Kavya Nair',
    initials: 'KN',
    destinations: [
      { label: 'Overview', icon: 'overview' },
      {
        label: 'Ready to publish',
        icon: 'readyToPublish',
        count: { value: 2, label: '2 ready to publish' },
      },
      { label: 'Content library', icon: 'contentLibrary' },
      { label: 'Updates', icon: 'updates' },
      { label: 'Course codes', icon: 'courseCodes' },
    ],
  },
  'super-admin': {
    workspace: 'Super Admin',
    person: 'Arjun Mehta',
    initials: 'AM',
    destinations: [
      { label: 'Overview', icon: 'overview' },
      {
        label: 'Requests',
        icon: 'requests',
        count: { value: 3, label: '3 requests under review' },
      },
      { label: 'Institutions', icon: 'institutions' },
      { label: 'Content', icon: 'content' },
      { label: 'Academic structure', icon: 'academicStructure' },
      { label: 'Platform roles', icon: 'platformRoles' },
      { label: 'Operations', icon: 'operations' },
    ],
  },
} as const satisfies Readonly<Record<string, RoleFixture>>;

export type RoleSlug = keyof typeof ROLE_FIXTURES;
