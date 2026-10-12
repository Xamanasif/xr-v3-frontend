/**
 * v46 role and format vocabulary (WP-0.3): display words from the frozen boards; stable ids.
 * Evidence: design/handoff-v46 boards B8-03 (role names, formats), B6-07 (`fmtName`,
 * `fmtText`), B5-04 (Vendor format labels).
 */
import { describe, expect, it } from 'vitest';

import { isRole, PLATFORM_ROLES, ROLE_LABEL, ROLE_PLANE } from './roles.js';
import {
  FORMAT_DISPLAY_ORDER,
  FORMAT_META,
  inDisplayOrder,
  sortTechnologies,
  TECHNOLOGIES,
} from './technology.js';

describe('roles', () => {
  it('keeps the seven stable internal ids, tenant_admin included', () => {
    expect(PLATFORM_ROLES).toEqual([
      'student',
      'faculty',
      'tenant_admin',
      'vendor',
      'academic_reviewer',
      'content_manager',
      'super_admin',
    ]);
    expect(isRole('tenant_admin')).toBe(true);
    expect(isRole('public')).toBe(false); // PUBLIC is a surface, not a role (BC1)
  });

  it('labels every role with the v46 display name and nothing else', () => {
    expect(ROLE_LABEL).toEqual({
      student: 'Student',
      faculty: 'Faculty',
      tenant_admin: 'Institute Admin',
      vendor: 'Vendor',
      academic_reviewer: 'Academic Reviewer',
      content_manager: 'Content Manager',
      super_admin: 'Super Admin',
    });
    for (const label of Object.values(ROLE_LABEL)) {
      expect(label).not.toContain('/'); // no dual "planning" labels
    }
  });

  it('leaves role planes unchanged', () => {
    expect(Object.keys(ROLE_PLANE)).toEqual([...PLATFORM_ROLES]);
    expect(ROLE_PLANE.super_admin).toBe('both');
  });
});

describe('technology formats', () => {
  it('keeps the canonical identifier order unchanged (FRD data order, not display order)', () => {
    expect(TECHNOLOGIES).toEqual(['web', 'vr', 'mr', 'ar']);
    expect(sortTechnologies(['ar', 'web', 'mr', 'vr', 'web'])).toEqual(['web', 'vr', 'mr', 'ar']);
  });

  it('displays formats WEB · AR · VR · MR', () => {
    expect(FORMAT_DISPLAY_ORDER).toEqual(['web', 'ar', 'vr', 'mr']);
    expect(inDisplayOrder(['mr', 'vr', 'ar', 'web'])).toEqual(['web', 'ar', 'vr', 'mr']);
    expect(inDisplayOrder(['vr', 'web', 'vr'])).toEqual(['web', 'vr']);
    expect(FORMAT_DISPLAY_ORDER.map((id) => FORMAT_META[id].code)).toEqual([
      'WEB',
      'AR',
      'VR',
      'MR',
    ]);
  });

  it('carries the v46 board words for every format', () => {
    expect(Object.keys(FORMAT_META).sort()).toEqual([...TECHNOLOGIES].sort());
    expect(FORMAT_META.web).toMatchObject({
      code: 'WEB',
      name: 'Browser',
      vendorLabel: 'Browser (WEB)',
      delivery: 'hosted',
    });
    expect(FORMAT_META.ar).toMatchObject({
      code: 'AR',
      name: 'Augmented reality',
      vendorLabel: 'Augmented reality (AR)',
      delivery: 'package',
    });
    expect(FORMAT_META.vr).toMatchObject({
      code: 'VR',
      name: 'Virtual reality',
      vendorLabel: 'Virtual reality (VR)',
      delivery: 'package',
    });
    expect(FORMAT_META.mr).toMatchObject({
      code: 'MR',
      name: 'Mixed reality',
      vendorLabel: 'Mixed reality (MR)',
      delivery: 'package',
    });
    expect(FORMAT_META.web.howItRuns).toBe(
      'The experiment in a web browser, on a laptop or desktop.',
    );
  });
});
