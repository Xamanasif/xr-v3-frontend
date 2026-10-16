import { ExperimentEditor } from '@/features/vendor/editor/experiment-editor';

/** VE-03 Create experiment, with VE-04 … VE-06 as its `?step=`s (boards B5-03 … B5-05). */
export default function PageNewExperiment() {
  return <ExperimentEditor mode="create" submissionId={null} />;
}
