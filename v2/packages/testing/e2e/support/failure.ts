/** The error a helper threw, or a failure when it did not throw (helpers are expected to fail). */
export async function failureOf(work: Promise<unknown>): Promise<Error> {
  try {
    await work;
  } catch (error) {
    if (error instanceof Error) return error;
    throw new Error(`The helper threw a non-Error value: ${String(error)}`);
  }
  throw new Error('Expected the helper to fail, but it passed.');
}
