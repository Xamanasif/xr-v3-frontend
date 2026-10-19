/**
 * The Super Admin's Institutions screens (owner-approved export design/v3-refined-b/roles/SA-v1,
 * `project/sa-views-b.js` `V.institutions`, `V.institution`): the SA-06 table cells (the kit's
 * `MissingTag` with the person-minus glyph, `QuietLine`, the group's inline label), the SA-07 page
 * (`DetailLayout` `stacked`), a plan's experiments in its band, activity per format and the people
 * with their inline override form (`InlineForm`). Markup against the export's classes and ARIA, the
 * class contract and the accessibility checks. The form dialogs are `ConfirmDialog`'s
 * (`dialog.test.tsx`).
 */
import { act, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { assertNoAxeViolations, expectV3ClassesOnly, saExportText } from '../testing/index.js';
import { Button } from './actions.js';
import { CourseCode, MissingTag } from './codes.js';
import { DecisionPanel, DetailLayout } from './detail.js';
import { Field, Textarea } from './fields.js';
import { FormatCells } from './formats.js';
import { V3_ICON_PATHS } from './icons.js';
import { Surface } from './page.js';
import { PlanBand } from './plan.js';
import { ActionGroup, ButtonRow, InlineForm, QuietLine } from './sa.js';
import {
  InstitutionFormatActivity,
  InstitutionInlineLabel,
  InstitutionPeople,
  InstitutionPerson,
  InstitutionPlanExperiments,
} from './sa-institutions.js';
import { StatusPill } from './status.js';
import { TermTrack } from './term-track.js';

const VIEWS = saExportText('sa-views-b.js');
const CORE = saExportText('sa-core.js');

/** The path of a symbol of the export's sprite (`['rbi-userminus', 'M15 …']`). */
function spritePath(id: string): string {
  const match = new RegExp(`\\['${id}', '([^']+)'\\]`).exec(CORE);
  if (!match) throw new Error(`No ${id} in the export's sprite.`);
  return match[1]!;
}

describe('SA-06 table cells (`V.institutions`)', () => {
  it('“Needs one”: the ivory tag with the export’s person-minus glyph', () => {
    expect(VIEWS).toContain(
      "'<span class=\"rk-tag-warn\">' + SA.ico('rbi-userminus', '') + 'Needs one</span>'",
    );
    const { container } = render(<MissingTag icon="userMinus">Needs one</MissingTag>);
    const tag = container.firstElementChild!;
    expect(tag.className).toBe('rk-tag-warn');
    expect(tag).toHaveTextContent('Needs one');
    const glyph = tag.querySelector('svg')!;
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph.querySelector('path')).toHaveAttribute('d', spritePath('rbi-userminus'));
    expect(V3_ICON_PATHS.userMinus).toBe(spritePath('rbi-userminus'));
    expectV3ClassesOnly(container);
  });

  it('the narrow layouts’ inline label, and a quiet line on its own', () => {
    expect(VIEWS).toContain('<span class="rk-inlabel">Access ends </span>');
    expect(VIEWS).toContain('<span class="rk-inlabel">Access ends: </span>not set yet');
    expect(VIEWS).toContain('<span class="rk-small">Assigned once access is active</span>');
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <td>
              <InstitutionInlineLabel label="Access ends">31 Oct 2026</InstitutionInlineLabel>
            </td>
            <td>
              <InstitutionInlineLabel label="Access ends:">not set yet</InstitutionInlineLabel>
            </td>
            <td>
              <QuietLine>Assigned once access is active</QuietLine>
            </td>
          </tr>
        </tbody>
      </table>,
    );
    const cells = container.querySelectorAll('td');
    expect(cells[0]!.innerHTML).toBe('<span class="rk-inlabel">Access ends </span>31 Oct 2026');
    expect(cells[1]!.innerHTML).toBe('<span class="rk-inlabel">Access ends: </span>not set yet');
    expect(cells[2]!.innerHTML).toBe(
      '<span class="rk-small">Assigned once access is active</span>',
    );
    expectV3ClassesOnly(container);
  });
});

describe('SA-07 page layout and plan band (`V.institution`, `planBand`)', () => {
  function Page() {
    return (
      <DetailLayout
        stacked
        asideId="in-panel"
        asideLabelledBy="in-panel-h"
        main={
          <>
            <Surface className="rk-mainsheet">
              <p>Facts</p>
            </Surface>
            <PlanBand
              kicker="Access plan"
              name="1 experiment · 120 licences"
              nameId="pl-0"
              status={<StatusPill tone="ok">Active</StatusPill>}
              line="120 licences, as approved. How licences are counted is still open."
              term={
                <TermTrack
                  inPlanBand
                  label="Yearly term"
                  remaining="345 days left"
                  remainingTone="calm"
                  start="8 Oct 2026"
                  end="7 Oct 2027"
                  elapsed={19 / 364}
                  showToday
                  description="Yearly term from 8 Oct 2026 to 7 Oct 2027. 345 days left."
                />
              }
              note={
                <InstitutionPlanExperiments
                  experiments={[
                    {
                      key: 'shell',
                      title: 'Shell-and-Tube Heat Exchanger',
                      course: (
                        <>
                          <CourseCode code="ME ZG523" />
                          <span>Thermodynamics &amp; Heat Transfer</span>
                        </>
                      ),
                      formats: (
                        <FormatCells
                          variant="strip"
                          label="In the plan: WEB, VR. Published: WEB, AR, VR."
                          cells={[
                            { format: 'WEB', state: 'on', words: 'In the plan' },
                            { format: 'AR', state: 'pub', words: 'Not in the plan' },
                            { format: 'VR', state: 'on', words: 'In the plan' },
                            { format: 'MR', state: 'none', words: 'Not published' },
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              }
            />
            <Surface>
              <p>Activity, people, history</p>
            </Surface>
          </>
        }
        aside={
          <DecisionPanel title="What you can do" titleId="in-panel-h">
            <ActionGroup label="Access">
              <Button>Pause access</Button>
            </ActionGroup>
          </DecisionPanel>
        }
      />
    );
  }

  it('the record column is a stack of surfaces beside the panel', async () => {
    expect(VIEWS).toContain(
      '<div class="rk-detailwrap"><div class="rk-detail"><div class="sa-stack"><div class="rk-surface rk-mainsheet">',
    );
    expect(VIEWS).toContain(
      '<aside class="rk-aside" id="in-panel" aria-labelledby="in-panel-h"><div class="rk-panel">',
    );
    const { container } = render(<Page />);
    const wrap = container.firstElementChild!;
    expect(wrap.className).toBe('rk-detailwrap');
    const detail = wrap.firstElementChild!;
    expect(detail.className).toBe('rk-detail');
    expect([...detail.children].map((child) => child.className)).toEqual(['sa-stack', 'rk-aside']);
    const stack = detail.firstElementChild!;
    expect([...stack.children].map((child) => child.className)).toEqual([
      'rk-surface rk-mainsheet',
      'rk-plan',
      'rk-surface',
    ]);
    const aside = screen.getByRole('complementary', { name: 'What you can do' });
    expect(aside).toHaveAttribute('id', 'in-panel');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a plan’s experiments follow the band’s grid, each with its format strip', () => {
    expect(VIEWS).toContain(
      '\'<div class="sa-plan-exps">\' + p.exps.map(e => \'<div class="sa-plan-exp"><div class="sa-plan-exp-t"><p class="rk-askrow-t">\'',
    );
    render(<Page />);
    const band = screen.getByRole('region', { name: '1 experiment · 120 licences' });
    expect([...band.children].map((child) => child.className)).toEqual([
      'rk-plan-grid',
      'sa-plan-exps',
    ]);
    const experiment = band.querySelector('.sa-plan-exp')!;
    // The export's `div.sa-plan-exp-t` carries a class no stylesheet defines: a plain div here.
    const name = experiment.firstElementChild!;
    expect(name.tagName).toBe('DIV');
    expect(name.className).toBe('');
    expect(name.querySelector('p.rk-askrow-t')).toHaveTextContent('Shell-and-Tube Heat Exchanger');
    expect(name.querySelector('p.rk-askrow-c')!.innerHTML).toBe(
      '<span class="rk-code">ME ZG523</span><span>Thermodynamics &amp; Heat Transfer</span>',
    );
    expect(
      within(experiment as HTMLElement).getByRole('list', {
        name: 'In the plan: WEB, VR. Published: WEB, AR, VR.',
      }),
    ).toHaveClass('rk-fstrip');
    expect(within(band).getByRole('img')).toHaveAccessibleName(
      'Yearly term from 8 Oct 2026 to 7 Oct 2027. 345 days left.',
    );
  });
});

describe('activity by format (`ul.sa-byfmt`)', () => {
  it('each format’s badge and its own figures, never added up', () => {
    expect(VIEWS).toContain(
      "<ul class=\"sa-byfmt\">' + x[2].map(f => '<li><span class=\"xr-fmt\">' + f[0] + '</span> '",
    );
    const { container } = render(
      <InstitutionFormatActivity
        items={[
          { format: 'WEB', words: '4 started · 2 completed' },
          { format: 'VR', words: '2 started · 1 completed' },
        ]}
      />,
    );
    const list = container.firstElementChild!;
    expect(list.className).toBe('sa-byfmt');
    expect([...list.children].map((item) => item.innerHTML)).toEqual([
      '<span class="xr-fmt">WEB</span> 4 started · 2 completed',
      '<span class="xr-fmt">VR</span> 2 started · 1 completed',
    ]);
    expectV3ClassesOnly(container);
  });
});

describe('people with the inline override form (`ul.sa-people`, `div.sa-inline`)', () => {
  function People() {
    const [open, setOpen] = useState(false);
    return (
      <InstitutionPeople>
        <InstitutionPerson
          name="Sneha Reddy"
          detail="GIT-2026-0352"
          status={<StatusPill tone="ended">Inactive</StatusPill>}
          action={
            open ? undefined : (
              <Button
                variant="ghost"
                aria-label="Change status for Sneha Reddy"
                onClick={() => setOpen(true)}
              >
                Change status
              </Button>
            )
          }
        >
          {open ? (
            <InlineForm>
              <Field
                id="stu-r-0"
                label="Reason for changing the status to Active"
                hint="An override, kept in the history. The Institute Admin normally changes this."
                error="Add a reason — it is kept in the history"
              >
                <Textarea />
              </Field>
              <ButtonRow>
                <Button variant="navy">Change to Active</Button>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
              </ButtonRow>
            </InlineForm>
          ) : null}
        </InstitutionPerson>
      </InstitutionPeople>
    );
  }

  it('the row: name and number, status, Change status; the form opens beside it', async () => {
    for (const piece of [
      '<ul class="sa-people">',
      '<li><div class="sa-people-row"><div><p class="sa-people-n">',
      '</p><p class="rk-small">',
      '<div class="sa-inline">',
      '<div class="sa-btnrow"><button type="button" class="rb-btn rb-btn--navy"',
      'class="rb-btn rb-btn--ghost"',
    ]) {
      expect(VIEWS).toContain(piece);
    }
    const { container } = render(<People />);
    const list = screen.getByRole('list');
    expect(list.className).toBe('sa-people');
    const row = list.querySelector('li > .sa-people-row')!;
    expect(row.firstElementChild!.innerHTML).toBe(
      '<p class="sa-people-n">Sneha Reddy</p><p class="rk-small">GIT-2026-0352</p>',
    );
    expect([...row.children].map((child) => child.className)).toEqual([
      '',
      'xr-st rk-st-ended',
      'rb-btn rb-btn--ghost',
    ]);
    await assertNoAxeViolations(container);
    act(() => screen.getByRole('button', { name: 'Change status for Sneha Reddy' }).click());
    // The row has no Change status while its form is open; the form follows the row.
    expect(screen.queryByRole('button', { name: 'Change status for Sneha Reddy' })).toBeNull();
    const form = list.querySelector('li > .sa-inline')!;
    expect(form.previousElementSibling).toHaveClass('sa-people-row');
    const reason = screen.getByRole('textbox', {
      name: 'Reason for changing the status to Active',
    });
    expect(reason).toHaveAccessibleDescription(
      'An override, kept in the history. The Institute Admin normally changes this. Add a reason — it is kept in the history',
    );
    expect(
      within(form as HTMLElement).getByRole('button', { name: 'Change to Active' }),
    ).toHaveClass('rb-btn--navy');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
