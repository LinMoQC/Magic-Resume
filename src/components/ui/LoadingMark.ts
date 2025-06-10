import { Mark, mergeAttributes } from '@tiptap/core';

export interface LoadingOptions {
  HTMLAttributes: Record<string, any>;
}

export const LoadingMark = Mark.create<LoadingOptions>({
  name: 'loading',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.ai-loading-effect',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // A single span is cleaner. The spinner will be an `::after` pseudo-element.
    return ['span', mergeAttributes(this.options.HTMLAttributes, { class: 'ai-loading-effect' }), 0];
  },
}); 