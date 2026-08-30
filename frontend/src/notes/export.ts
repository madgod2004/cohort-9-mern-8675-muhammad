import TurndownService from 'turndown';

import type { Note } from '../api/notes';

export type ExportFormat = 'markdown' | 'text';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'LI',
  'BLOCKQUOTE',
  'PRE',
  'TR',
]);

export function toMarkdown(note: Note): string {
  const body = turndown.turndown(note.content).trim();
  return body ? `# ${note.title}\n\n${body}\n` : `# ${note.title}\n`;
}

function textOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }
  if (!(node instanceof Element)) {
    return '';
  }
  if (node.tagName === 'BR') {
    return '\n';
  }

  const inner = Array.from(node.childNodes).map(textOf).join('');
  return BLOCK_TAGS.has(node.tagName) ? `${inner}\n` : inner;
}

export function toPlainText(note: Note): string {
  const doc = new DOMParser().parseFromString(note.content, 'text/html');
  const body = textOf(doc.body)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return body ? `${note.title}\n\n${body}\n` : `${note.title}\n`;
}

export function fileNameFor(note: Note, format: ExportFormat): string {
  // the collapse above leaves no repeated dashes, so there is only ever one to trim
  const slug = note.title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .slice(0, 60)
    .replace(/^-/, '')
    .replace(/-$/, '');

  return `${slug || 'note'}.${format === 'markdown' ? 'md' : 'txt'}`;
}

export function downloadNote(note: Note, format: ExportFormat): void {
  const contents = format === 'markdown' ? toMarkdown(note) : toPlainText(note);
  const type = format === 'markdown' ? 'text/markdown' : 'text/plain';

  const url = URL.createObjectURL(new Blob([contents], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileNameFor(note, format);

  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
