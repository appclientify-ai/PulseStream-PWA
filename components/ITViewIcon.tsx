import React, { useState } from 'react';
import { Client } from '../types';
import ITDetailModal from './ITDetailModal';
import ITClientFormModal from '../pages/Clientform/ITClientFormModal';

interface ITViewIconProps {
  client: Client;
  className?: string;
  onEdit?: (client: Client) => void;
  onDataChange?: () => void;
}

const ITViewIcon: React.FC<ITViewIconProps> = ({ client, className = '', onEdit, onDataChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(client);

  const handleEditClick = (c: Client) => {
    setIsOpen(false);
    if (onEdit) {
      onEdit(c);
    } else {
      setIsEditOpen(true);
    }
  };

  const handleSave = (data: Client) => {
    setCurrentClient(data);
    setIsEditOpen(false);
    if (onDataChange) {
      onDataChange();
    }
  };

  return (
    <>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm flex items-center justify-center transition-all ${className}`}
        title="View IT Profile"
      >
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 12z" />
        </svg>
      </button>
      <ITDetailModal isOpen={isOpen} onClose={() => setIsOpen(false)} client={currentClient} onEdit={handleEditClick} />
      {isEditOpen && (
        <ITClientFormModal 
          isOpen={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          onSave={handleSave} 
          initialData={currentClient}
        />
      )}
    </>
  );
};

export default ITViewIcon;
