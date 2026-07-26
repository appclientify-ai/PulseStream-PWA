import React, { useState, useEffect } from 'react';

interface EditableRemarkProps {
  value?: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const EditableRemark: React.FC<EditableRemarkProps> = ({
  value = '',
  onSave,
  placeholder = 'Add remark...',
  className = ''
}) => {
  const [text, setText] = useState(value || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setText(value || '');
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== (value || '')) {
      onSave(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div 
      className={`relative flex items-center w-full min-w-[110px] ${className}`}
      title={text ? text : placeholder}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full bg-transparent border border-transparent px-2 py-1 text-[11px] font-bold rounded-lg transition-all outline-none truncate ${
          isEditing
            ? 'bg-white border-indigo-300 ring-2 ring-indigo-500/20 text-slate-900 shadow-sm'
            : text
            ? 'text-slate-800 hover:bg-slate-100/80 hover:border-slate-200'
            : 'text-slate-400 placeholder-slate-300 hover:bg-slate-100/80 hover:border-slate-200'
        }`}
        title={text ? text : "Click to edit remark"}
      />
    </div>
  );
};

export default EditableRemark;
