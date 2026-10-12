import type { Specimen } from '../types';
import { ButtonSpecimen, IconButtonSpecimen } from './foundation-actions';

export const FOUNDATION_ACTION_SPECIMENS: Readonly<Record<string, Specimen>> = {
  'c-button': {
    title: 'Button: variants, sizes, icon, disabled, busy',
    source: '03 "Actions"; B2-05 "IA-05 Give students access · 1440 · interactive · start here"',
    render: () => <ButtonSpecimen />,
  },
  'c-icon-button': {
    title: 'IconButton: named, unavailable',
    source: '10 "Keyboard path and phone layout"; B4-05 "FA-09 Questions · 1440 · interactive"',
    render: () => <IconButtonSpecimen />,
  },
};
