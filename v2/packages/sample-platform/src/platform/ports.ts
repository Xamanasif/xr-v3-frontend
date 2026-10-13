/**
 * The 22 product ports over one platform core and one session context (Appendix C §3; ADR-0008
 * decision 1). Every method of the WP-0.10 surface exists; the later-phase ones reject naming
 * their phase (`deferred`).
 */
import type { ProductPorts } from '@xr/contracts/draft';

import { accessRequestPort } from '../handlers/access-request.js';
import {
  assessmentPort,
  markingPort,
  questionBankPort,
  teachingPort,
} from '../handlers/assessment.js';
import { cataloguePort, selectionPort } from '../handlers/catalogue.js';
import { correctionPort } from '../handlers/correction.js';
import { institutionPort } from '../handlers/institution.js';
import { feedbackPort, learningPort } from '../handlers/learning.js';
import { operationsPort } from '../handlers/operations.js';
import {
  facultyCoursePort,
  groupPort,
  institutionCourseCodePort,
  peoplePort,
} from '../handlers/people.js';
import { productionPort } from '../handlers/production.js';
import { sessionPort } from '../handlers/session.js';
import { studentAccessPort } from '../handlers/student-access.js';
import {
  academicStructurePort,
  platformCourseCodePort,
  platformRolePort,
} from '../handlers/structure.js';
import type { PlatformCore, SessionContext } from './core.js';

export function buildPorts(
  core: PlatformCore,
  context: SessionContext,
  commandId: string | null,
): ProductPorts {
  const call = { core, context, commandId };
  return {
    session: sessionPort(call),
    catalogue: cataloguePort(call),
    selection: selectionPort(call),
    accessRequests: accessRequestPort(call),
    institutions: institutionPort(call),
    people: peoplePort(call),
    groups: groupPort(call),
    facultyCourses: facultyCoursePort(call),
    institutionCourseCodes: institutionCourseCodePort(call),
    studentAccess: studentAccessPort(call),
    learning: learningPort(call),
    feedback: feedbackPort(call),
    assessments: assessmentPort(call),
    questionBank: questionBankPort(call),
    marking: markingPort(call),
    teaching: teachingPort(call),
    production: productionPort(call),
    corrections: correctionPort(call),
    academicStructure: academicStructurePort(call),
    platformCourseCodes: platformCourseCodePort(call),
    platformRoles: platformRolePort(call),
    operations: operationsPort(call),
  };
}
