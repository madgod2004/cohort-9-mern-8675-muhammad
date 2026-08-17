import { model, Schema, Types } from 'mongoose';
import sanitizeHtml from 'sanitize-html';

export interface INote {
  title: string;
  content: string;
  contentText: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
    },
    contentText: {
      type: String,
      default: '',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

noteSchema.index({ title: 'text', contentText: 'text' });

// block tags carry an implicit word break that tag-stripping would otherwise lose,
// and sanitize-html re-escapes its output so entities need decoding back to text
function toPlainText(html: string): string {
  const spaced = html.replace(/<\/(p|div|h[1-6]|li|blockquote|tr|td)>|<br\s*\/?>/gi, ' ');
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// keeps stored html safe and contentText in sync, whatever the write path
noteSchema.pre('save', function () {
  if (this.isModified('content')) {
    this.content = sanitizeHtml(this.content);
    this.contentText = toPlainText(this.content);
  }
});

export const Note = model<INote>('Note', noteSchema);
