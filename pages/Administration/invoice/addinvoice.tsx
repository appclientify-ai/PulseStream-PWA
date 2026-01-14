import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Payment, Client, PaymentItem, PaymentMode } from '../types';
import { XIcon, PlusIcon, TrashIcon } from './icons';

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payment: Payment | Omit<Payment, 'id' | 'invoiceNumber' | 'totalAmount'>) => void;
    paymentToEdit: Payment | null;
    clients: Client[];
}

const PaymentModeModal: React.FC<{
    onSelect: (mode: PaymentMode) => void;
    onClose: () => void;
}> = ({ onSelect, onClose }) => {
    const modes: PaymentMode[] = ['Cash', 'Cheque', 'Online'];
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold">Select Payment Mode</h3>
                </div>
                <div className="p-6 flex flex-col space-y-3">
                    {modes.map(mode => (
                        <button key={mode} onClick={() => onSelect(mode)} className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                            {mode}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


const defaultItem: PaymentItem = { description: '', amount: 0 };

const defaultState: Omit<Payment, 'id' | 'invoiceNumber' | 'totalAmount'> = {
    clientId: '',
    items: [{...defaultItem}],
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Pending',
    paymentMode: undefined,
    chequeNumber: '',
    miscClientMobile: '',
    miscClientAddress: '',
};

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, onSave, paymentToEdit, clients }) => {
    const [formData, setFormData] = useState<Omit<Payment, 'id' | 'invoiceNumber' | 'totalAmount'> | Payment>(paymentToEdit || defaultState);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientList, setShowClientList] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [isModeModalOpen, setModeModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (paymentToEdit) {
                setFormData({ ...paymentToEdit });
                const client = clients.find(c => c.id === paymentToEdit.clientId);
                setClientSearch(client?.gstDetails?.tradeName || client?.itDetails?.name || paymentToEdit.clientName || '');
            } else {
                setFormData({ ...defaultState });
                setClientSearch('');
            }
        }
    }, [isOpen, paymentToEdit, clients]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowClientList(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredClients = useMemo(() => {
        if (!clientSearch) return [];
        const lowerSearch = clientSearch.toLowerCase();
        return clients.filter(c => 
            (c.gstDetails?.tradeName || c.itDetails?.name || '').toLowerCase().includes(lowerSearch)
        );
    }, [clientSearch, clients]);

    const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setClientSearch(value);
        setShowClientList(true);
        // Treat as misc client until one is selected
        setFormData(prev => ({
            ...prev,
            clientId: '', // Clear ID
            clientName: value, // Set name directly
        }));
    };

    const handleClientSelect = (client: Client) => {
        setFormData(prev => ({ 
            ...prev, 
            clientId: client.id, 
            clientName: client.gstDetails?.tradeName || client.itDetails?.name,
            // Clear misc fields
            miscClientMobile: '',
            miscClientAddress: ''
        }));
        setClientSearch(client.gstDetails?.tradeName || client.itDetails?.name || '');
        setShowClientList(false);
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'status' && value === 'Received') {
            setModeModalOpen(true);
        } else if (name === 'status' && (value === 'Pending' || value === 'Send')) {
            setFormData(prev => ({ ...prev, status: value, paymentMode: undefined, paymentDate: undefined, chequeNumber: undefined }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSelectMode = (mode: PaymentMode) => {
        const updatedState = {
            ...formData,
            status: 'Received' as 'Received',
            paymentMode: mode,
            paymentDate: formData.paymentDate || new Date().toISOString().split('T')[0]
        };

        if (mode !== 'Cheque') {
            (updatedState as Payment).chequeNumber = undefined;
        }

        setFormData(updatedState);
        setModeModalOpen(false);
    };


    const handleItemChange = (index: number, field: keyof PaymentItem, value: string | number) => {
        const newItems = [...formData.items];
        const item = { ...newItems[index] };
        (item[field] as any) = field === 'amount' ? parseFloat(value as string) || 0 : value;
        newItems[index] = item;
        setFormData(prev => ({...prev, items: newItems}));
    };

    const handleAddItem = () => {
        setFormData(prev => ({...prev, items: [...prev.items, {...defaultItem}]}));
    };

    const handleRemoveItem = (index: number) => {
        if (formData.items.length <= 1) return; // Must have at least one item
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({...prev, items: newItems}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-bold">{paymentToEdit ? 'Edit' : 'Add'} Invoice</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="relative" ref={searchRef}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client</label>
                                <input type="search" value={clientSearch} onChange={handleClientSearchChange} onFocus={() => setShowClientList(true)} placeholder="Search or type a new client name" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                                {showClientList && filteredClients.length > 0 && (
                                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                        {filteredClients.map(client => (
                                            <li key={client.id} onClick={() => handleClientSelect(client)} className="px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900">
                                                <p className="font-semibold">{client.gstDetails?.tradeName || client.itDetails?.name}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                             {!formData.clientId && clientSearch && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg space-y-4 animate-fade-in">
                                    <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">Miscellaneous Client Details</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Client Mobile No.</label>
                                        <input name="miscClientMobile" type="tel" value={(formData as Payment).miscClientMobile || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Client Address</label>
                                        <textarea name="miscClientAddress" value={(formData as Payment).miscClientAddress || ''} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Services</label>
                                 <div className="mt-1 space-y-2">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input type="text" placeholder="Service Description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required className="flex-grow px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                                            <input type="number" placeholder="Amount" value={item.amount || ''} step="0.01" onChange={e => handleItemChange(index, 'amount', e.target.value)} required className="w-32 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                                            <button type="button" onClick={() => handleRemoveItem(index)} disabled={formData.items.length <= 1} className="p-2 text-red-600 disabled:text-gray-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddItem} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline mt-2"><PlusIcon/> Add Service</button>
                                 </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Date</span>
                                    <input name="invoiceDate" type="date" value={formData.invoiceDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</span>
                                    <input name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md sm:text-sm">
                                        <option value="Pending">Pending</option>
                                        <option value="Send">Send</option>
                                        <option value="Received">Received</option>
                                    </select>
                                </label>
                                {formData.status === 'Received' && (
                                    <label className="block">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Mode</span>
                                        <input type="text" value={(formData as Payment).paymentMode || ''} readOnly onClick={() => setModeModalOpen(true)} className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm sm:text-sm cursor-pointer"/>
                                    </label>
                                )}
                            </div>
                            {formData.status === 'Received' && (
                               <div className="grid grid-cols-2 gap-4">
                                    <label className="block">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</span>
                                        <input name="paymentDate" type="date" value={(formData as Payment).paymentDate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                                    </label>
                                    {(formData as Payment).paymentMode === 'Cheque' && (
                                        <label className="block">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cheque No.</span>
                                            <input name="chequeNumber" type="text" value={(formData as Payment).chequeNumber || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                                        </label>
                                    )}
                               </div>
                            )}
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
                        </div>
                    </form>
                </div>
            </div>
            {isModeModalOpen && <PaymentModeModal onSelect={handleSelectMode} onClose={() => setModeModalOpen(false)} />}
        </>
    );
}