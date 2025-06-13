import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';

export default function CodeEditor({ language, value, onChange }) {
  const editorRef = useRef();
  const monacoRef = useRef();

  useEffect(() => {
    if (!editorRef.current) return;
    monacoRef.current = monaco.editor.create(editorRef.current, {
      value: value || '',
      language: language === 'cpp' ? 'cpp' : language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      scrollBeyondLastLine: false,
    });
    monacoRef.current.onDidChangeModelContent(() => {
      onChange(monacoRef.current.getValue());
    });
    return () => monacoRef.current && monacoRef.current.dispose();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (monacoRef.current) {
      monaco.editor.setModelLanguage(monacoRef.current.getModel(), language === 'cpp' ? 'cpp' : language);
    }
  }, [language]);

  useEffect(() => {
    if (monacoRef.current && value !== monacoRef.current.getValue()) {
      monacoRef.current.setValue(value || '');
    }
    // eslint-disable-next-line
  }, [value]);

  return <div ref={editorRef} style={{ height: 300, border: '1px solid #eee', marginBottom: 8 }} />;
} 