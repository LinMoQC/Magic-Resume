import { Mark, mergeAttributes } from '@tiptap/core';

export interface LoadingOptions {
  HTMLAttributes: Record<string, unknown>;
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
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 
      class: 'ai-loading-effect',
      'data-loading': 'true',
      'aria-label': 'AI正在优化此文本...'
    }), 0];
  },
}); 