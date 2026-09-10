/**
 * Proves the forms foundation — React Hook Form + Zod through @hookform/resolvers —
 * without any product form existing yet.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const schema = z.object({
  institution: z.string().trim().min(3, 'Institution name needs at least 3 characters'),
});
type Values = z.infer<typeof schema>;

function DemoForm({ onSubmit }: { readonly onSubmit: (values: Values) => void }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { institution: '' },
  });
  const error = form.formState.errors.institution?.message;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <label>
        Institution
        <input {...form.register('institution')} />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit">Submit</button>
    </form>
  );
}

describe('forms foundation', () => {
  it('validates with the Zod schema and submits parsed values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<DemoForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Institution'), 'ab');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('at least 3 characters');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Institution'), 'c');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ institution: 'abc' });
  });
});
