import React, { useState, useEffect } from 'react';

interface EditableCaseHistoryProps {
  value?: string;
  onSave: (val: string) => Promise<void> | void;
  className?: string;
}

export const EditableCaseHistory: React.FC<EditableCaseHistoryProps> = ({
  value = '',
  onSave,
  className = ''
}) => {
  const [text, setText] = useState(value || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setText(value || '');
  }, [value]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(text);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save case history:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setText(value || '');
    setIsEditing(false);
  };

  return (
    <div className={`col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase text-slate-400">Case History</p>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
          >
            Edit History
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancel}
              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
          {value ? value : <span className="text-slate-400 italic">No case history logged.</span>}
        </p>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter detailed case history, hearing dates, and current status updates..."
          rows={4}
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all resize-y"
        />
      )}
    </div>
  );
};

export default EditableCaseHistory;
