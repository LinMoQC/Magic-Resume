import React, { useEffect, useRef } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';
import CodeTool from '@editorjs/code';

interface EditorProps {
  data?: OutputData;
  onChange: (data: OutputData) => void;
  holder: string;
  readOnly?: boolean;
}

const Editor: React.FC<EditorProps> = ({ data, onChange, holder, readOnly = false }) => {
  const ref = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!ref.current) {
      const editor = new EditorJS({
        holder: holder,
        tools: {
          header: Header,
          list: List,
          quote: Quote,
          table: Table,
          code: CodeTool,
        },
        data: data,
        readOnly: readOnly,
        async onChange(api, event) {
          const savedData = await api.saver.save();
          onChange(savedData);
        },
        placeholder: 'Let`s write an awesome story!',
      });
      ref.current = editor;
    }

    return () => {
      if (ref.current && ref.current.destroy) {
        ref.current.destroy();
        ref.current = null;
      }
    };
  }, []);

  return <div id={holder} className="prose max-w-full" />;
};

export default Editor; 