import StarterKit from '@tiptap/starter-kit';

export const editorExtensions = [
  // StarterKit already carries Link, so it must not be added again
  StarterKit.configure({
    link: {
      openOnClick: false,
      protocols: ['http', 'https', 'mailto'],
      HTMLAttributes: { target: null, rel: null },
    },
  }),
];
