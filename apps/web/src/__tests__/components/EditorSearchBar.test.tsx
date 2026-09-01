import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorSearchBar } from '@/components/editor/EditorSearchBar';

const PLACEHOLDER = 'Search by name or email...';

function renderBar(value = '') {
  const onSearch = vi.fn();
  const utils = render(<EditorSearchBar value={value} onSearch={onSearch} placeholder={PLACEHOLDER} />);
  return { onSearch, input: () => screen.getByPlaceholderText(PLACEHOLDER) as HTMLInputElement, ...utils };
}

describe('EditorSearchBar', () => {
  it('does not search while typing', () => {
    const { onSearch, input } = renderBar();
    fireEvent.change(input(), { target: { value: 'anita pandey' } });
    expect(input().value).toBe('anita pandey');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('searches the trimmed term when the Search button is clicked', () => {
    const { onSearch, input } = renderBar();
    fireEvent.change(input(), { target: { value: '  anita  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('anita');
  });

  it('searches when the form is submitted (Enter key)', () => {
    const { onSearch, input } = renderBar();
    fireEvent.change(input(), { target: { value: 'deep darshan' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).toHaveBeenCalledWith('deep darshan');
  });

  it('Clear empties the input and resets a committed search immediately', () => {
    const { onSearch, input } = renderBar('anita');
    expect(input().value).toBe('anita');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input().value).toBe('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('clearing an uncommitted draft does not trigger a search', () => {
    const { onSearch, input } = renderBar();
    fireEvent.change(input(), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input().value).toBe('');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('hides the Clear button when there is nothing to clear', () => {
    renderBar();
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('follows the committed value when the parent resets it (e.g. tab change)', () => {
    const onSearch = vi.fn();
    const { rerender } = render(<EditorSearchBar value="anita" onSearch={onSearch} placeholder={PLACEHOLDER} />);
    rerender(<EditorSearchBar value="" onSearch={onSearch} placeholder={PLACEHOLDER} />);
    expect((screen.getByPlaceholderText(PLACEHOLDER) as HTMLInputElement).value).toBe('');
  });

  it('renders extra filter controls passed as children', () => {
    const onSearch = vi.fn();
    render(
      <EditorSearchBar value="" onSearch={onSearch} placeholder={PLACEHOLDER}>
        <select aria-label="Type"><option>All</option></select>
      </EditorSearchBar>
    );
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
  });
});
