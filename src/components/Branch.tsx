import React, { useState } from 'react';

interface BranchProps {
  label: string;
  content?: string;
  style?: React.CSSProperties;
  onChange?: (label: string, content: string) => void;
}

const Branch: React.FC<BranchProps> = ({ label, content, style, onChange }) => {
  const [editLabel, setEditLabel] = useState(label);
  const [editContent, setEditContent] = useState(content || '');

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditLabel(e.target.value);
    if (onChange) onChange(e.target.value, editContent);
  };
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    if (onChange) onChange(editLabel, e.target.value);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #8d6748 80%, #c2b280 100%)',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(80,60,40,0.12)',
        padding: '1.2rem 1.6rem',
        minWidth: '220px',
        maxWidth: '340px',
        color: '#3e2c18',
        fontWeight: 600,
        fontSize: '1.1rem',
        margin: '0.5rem',
        ...style,
      }}
      aria-label="Branch block"
    >
      <input
        type="text"
        value={editLabel}
        onChange={handleLabelChange}
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: '#3e2c18',
          outline: 'none',
        }}
        aria-label="Branch title"
      />
      <textarea
        value={editContent}
        onChange={handleContentChange}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = `${target.scrollHeight}px`;
        }}
        style={{
          fontSize: '1rem',
          opacity: 0.85,
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: '#3e2c18',
          outline: 'none',
          resize: 'none',
          overflow: 'hidden',
          minHeight: '3em',
        }}
        rows={1}
        aria-label="Branch content"
      />
    </div>
  );
};

export default Branch;
