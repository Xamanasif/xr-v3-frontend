/**
 * The Super Admin components of SA-14 Academic structure and SA-15 Area / course record (the
 * owner-approved Super Admin export, design/v3-refined-b/roles/SA-v1 `sa-views-c.js`
 * `V.structure`, `V.area`, `V.course`): the export's classes and ARIA, the words and destinations
 * from the caller. "No platform code yet" is the kit's `MissingTag` without an icon; the
 * structure's dialogs are `ConfirmDialog` form dialogs (`dialog.test.tsx`).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectV3ClassesOnly, saExportText } from '../testing/index.js';
import { MissingTag } from './codes.js';
import { RecordList } from './sa.js';
import { StructureAreaGroup, StructureLinks, StructureReadOnlyCode } from './sa-structure.js';

const VIEWS = saExportText('sa-views-c.js');
const CORE = saExportText('sa-core.js');

describe('StructureAreaGroup (SA-14 `V.structure` › `section.rk-course`)', () => {
  it('the area’s name, description and “Open area”, then its courses — as the export emits them', () => {
    const { container } = render(
      <StructureAreaGroup
        title="Chemical & Process"
        titleId="ar-chemical"
        description="Distillation, process control and flow measurement."
        open={{
          href: '/admin/structure/areas/chemical-process',
          label: 'Open area',
          accessibleName: 'Open area Chemical & Process',
        }}
      >
        <RecordList
          rows={[
            {
              key: 'pic',
              href: '/admin/structure/courses/pic',
              title: 'Process Instrumentation & Control',
              details: <span className="rk-code">CHE ZG513</span>,
            },
          ]}
        />
      </StructureAreaGroup>,
    );
    const section = container.querySelector('section.rk-course')!;
    expect(section.getAttribute('aria-labelledby')).toBe('ar-chemical');
    expect(screen.getByRole('region', { name: 'Chemical & Process' })).toBe(section);
    expect(
      section.querySelector(
        ':scope > div.rk-course-h > div.rk-course-id > h2.rk-course-t#ar-chemical',
      ),
    ).toHaveTextContent('Chemical & Process');
    expect(section.querySelector('.rk-course-id > p.rk-course-codes')).toHaveTextContent(
      'Distillation, process control and flow measurement.',
    );
    const open = screen.getByRole('link', { name: 'Open area Chemical & Process' });
    expect(open).toHaveClass('rb-link');
    expect(open).toHaveTextContent('Open area');
    expect(open).toHaveAttribute('href', '/admin/structure/areas/chemical-process');
    expect(open.parentElement).toHaveClass('rk-course-h');
    expect(section.querySelector(':scope > ul.sa-list a.sa-list-row')).toHaveAttribute(
      'href',
      '/admin/structure/courses/pic',
    );
    // The export's markup, in the same nesting.
    expect(VIEWS).toContain(
      '<section class="rk-course" aria-labelledby="ar-\' + a.id + \'"><div class="rk-course-h"><div class="rk-course-id"><h2 class="rk-course-t"',
    );
    expect(VIEWS).toContain('<p class="rk-course-codes">');
    expect(VIEWS).toContain('</p></div><a class="rb-link" href="#/structure/areas/');
    expectV3ClassesOnly(container);
  });
});

describe('MissingTag without an icon, StructureReadOnlyCode, StructureLinks', () => {
  it('“No platform code yet” is the ivory tag without an icon, as the rows and the head draw it', () => {
    const { container } = render(<MissingTag icon={null}>No platform code yet</MissingTag>);
    const tag = container.firstElementChild!;
    expect(tag.outerHTML).toBe('<span class="rk-tag-warn">No platform code yet</span>');
    expect(VIEWS).toContain('<span class="rk-tag-warn">No platform code yet</span>');
    expectV3ClassesOnly(container);
  });

  it('a read-only code: the chip, a space, the quiet note', () => {
    const { container } = render(
      <dl>
        <dt>Platform course code</dt>
        <dd>
          <StructureReadOnlyCode code="ME ZG523" note="Read-only here" />
        </dd>
      </dl>,
    );
    expect(container.querySelector('dd')!.innerHTML).toBe(
      '<span class="rk-code">ME ZG523</span> <span class="rk-hint">Read-only here</span>',
    );
    expect(VIEWS).toContain('SA.code(c.code) + \' <span class="rk-hint">Read-only here</span>\'');
    expect(CORE).toContain('<span class="rk-code">');
    expectV3ClassesOnly(container);
  });

  it('records named in a value: plain links, the caller’s separator, words after a link', () => {
    const { container } = render(
      <p>
        <StructureLinks
          separator=", "
          links={[
            {
              key: 'godavari',
              href: '/admin/institutions/godavari',
              label: 'Godavari Institute of Technology',
              after: ' (MEC-523)',
            },
            {
              key: 'malnad',
              href: '/admin/institutions/malnad',
              label: 'Malnad College of Engineering',
              after: ' (ended)',
            },
          ]}
        />
      </p>,
    );
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.getAttribute('class'))).toEqual([null, null]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/admin/institutions/godavari',
      '/admin/institutions/malnad',
    ]);
    expect(container.textContent).toBe(
      'Godavari Institute of Technology (MEC-523), Malnad College of Engineering (ended)',
    );
    expect(VIEWS).toContain(
      "'<a href=\"#/institutions/' + i.id + '\">' + esc(i.name) + '</a>').join(', ')",
    );
  });
});
