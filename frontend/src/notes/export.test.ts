import { fakeNote } from '../../test/factories';
import { downloadNote, fileNameFor, toMarkdown, toPlainText } from './export';

describe('toMarkdown', () => {
  it('puts the title in as a heading', () => {
    const note = fakeNote({ title: 'Meeting notes', content: '<p>Hello.</p>' });

    expect(toMarkdown(note)).toBe('# Meeting notes\n\nHello.\n');
  });

  it('converts headings, emphasis and lists', () => {
    const note = fakeNote({
      title: 'Plan',
      content: '<h2>Roadmap</h2><p>Agree <strong>owners</strong>.</p><ul><li>Dates</li></ul>',
    });

    const markdown = toMarkdown(note);

    expect(markdown).toContain('## Roadmap');
    expect(markdown).toContain('**owners**');
    expect(markdown).toMatch(/- +Dates/);
  });

  it('still produces a heading for a note with no body', () => {
    expect(toMarkdown(fakeNote({ title: 'Blank', content: '' }))).toBe('# Blank\n');
  });
});

describe('toPlainText', () => {
  it('keeps the breaks between blocks that contentText would have collapsed', () => {
    const note = fakeNote({
      title: 'Meeting notes',
      content: '<h2>Roadmap</h2><p>First.</p><p>Second.</p>',
      contentText: 'Roadmap First. Second.',
    });

    expect(toPlainText(note)).toBe('Meeting notes\n\nRoadmap\nFirst.\nSecond.\n');
  });

  it('turns a <br> into a newline', () => {
    const note = fakeNote({ title: 'Address', content: '<p>Line one<br>Line two</p>' });

    expect(toPlainText(note)).toContain('Line one\nLine two');
  });

  it('does not repeat text held in nested blocks', () => {
    const note = fakeNote({ title: 'List', content: '<div><ul><li>Only once</li></ul></div>' });

    expect(toPlainText(note).match(/Only once/g)).toHaveLength(1);
  });

  it('strips tags without leaving markup behind', () => {
    const note = fakeNote({
      title: 'Styled',
      content: '<p><em>Tilted</em> and <strong>bold</strong></p>',
    });

    expect(toPlainText(note)).toBe('Styled\n\nTilted and bold\n');
  });
});

describe('fileNameFor', () => {
  it('slugs the title', () => {
    expect(fileNameFor(fakeNote({ title: 'Meeting Notes!' }), 'markdown')).toBe('meeting-notes.md');
    expect(fileNameFor(fakeNote({ title: 'Meeting Notes!' }), 'text')).toBe('meeting-notes.txt');
  });

  it('falls back to "note" when the title slugs to nothing', () => {
    expect(fileNameFor(fakeNote({ title: '???' }), 'markdown')).toBe('note.md');
  });

  it('caps a very long title', () => {
    const name = fileNameFor(fakeNote({ title: 'a'.repeat(200) }), 'markdown');

    expect(name).toBe(`${'a'.repeat(60)}.md`);
  });
});

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe('downloadNote', () => {
  const createObjectURL = jest.fn((_blob: Blob) => 'blob:fake');
  const revokeObjectURL = jest.fn();
  let clicked: { download: string; parentAtClick: string | null } | null;

  beforeEach(() => {
    jest.clearAllMocks();
    clicked = null;
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      // recorded at click time, because the anchor is removed straight after
      clicked = { download: this.download, parentAtClick: this.parentElement?.tagName ?? null };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('hands the browser a named markdown file', async () => {
    downloadNote(fakeNote({ title: 'Meeting notes', content: '<p>Hi.</p>' }), 'markdown');

    expect(clicked?.download).toBe('meeting-notes.md');
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe('text/markdown;charset=utf-8');
    await expect(readBlob(blob)).resolves.toBe('# Meeting notes\n\nHi.\n');
  });

  it('hands the browser a named text file', async () => {
    downloadNote(fakeNote({ title: 'Meeting notes', content: '<p>Hi.</p>' }), 'text');

    expect(clicked?.download).toBe('meeting-notes.txt');
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe('text/plain;charset=utf-8');
    await expect(readBlob(blob)).resolves.toBe('Meeting notes\n\nHi.\n');
  });

  it('attaches the anchor before clicking, which Firefox needs', () => {
    downloadNote(fakeNote(), 'markdown');

    expect(clicked?.parentAtClick).toBe('BODY');
  });

  it('cleans up the object URL and the anchor', () => {
    downloadNote(fakeNote(), 'markdown');

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
