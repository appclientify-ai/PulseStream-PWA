
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Client, BalanceSheetStatus, View, PdfDocument } from '../../../types.ts';
import { useClientData } from '../../../hooks/useClientData.ts';
import { PlusIcon, EyeIcon, TrashIcon, FilterIcon, BellIcon, SettingsIcon, CloudUploadIcon, XIcon } from './icons.tsx';
import { useDueDate } from '../../../hooks/useDueDate.ts';
import { FullDetailsModal } from './FullDetailsModal.tsx';
import { PdfUploadWidget } from './PdfUploadWidget.tsx';

const getCurrentFinancialYear = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return currentMonth < 3 ? `${currentYear - 1}-${currentYear.toString().slice(-2)}` : `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
};

const AddBSClientModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (clientId: string) => void;
    allClients: Client[];
    existingClientIds: string[];
}> = ({ isOpen, onClose, onAdd, allClients, existingClientIds }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const availableClients = useMemo(() => {
        if (!searchTerm) return [];
        const existingIdsSet = new Set(existingClientIds);
        const lowerSearch = searchTerm.toLowerCase();
        return allClients.filter(c => 
            !existingIdsSet.has(c.id) &&
            ((c.legalName?.toLowerCase().includes(lowerSearch) || c.tradeName?.toLowerCase().includes(lowerSearch) || c.gstProfile?.gstin?.toLowerCase().includes(lowerSearch)) ||
             (c.itProfile?.pan?.toLowerCase().includes(lowerSearch)))
        );
    }, [allClients, existingClientIds, searchTerm]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    
    const resetAndClose = () => {
        setSearchTerm('');
        setSelectedClient(null);
        onClose();
    };

    const handleAddClick = () => {
        if (selectedClient) {
            onAdd(selectedClient.id);
            resetAndClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Add Client to Balance Sheet List</h2>
                    <button onClick={resetAndClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium">Search Client</label>
                        <input ref={searchRef} type="search" placeholder="By Name, GSTIN, or PAN" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); if (selectedClient) setSelectedClient(null); }} className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
                        {searchTerm && (
                            <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {availableClients.map((c: Client) => <li key={c.id} onClick={() => { setSelectedClient(c); setSearchTerm(''); }} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{c.tradeName || c.legalName} ({c.gstProfile?.gstin || c.itProfile?.pan})</li>)}
                            </ul>
                        )}
                    </div>
                    {selectedClient && (
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/50 rounded-md">
                            <p>Selected: <span className="font-bold">{selectedClient.tradeName || selectedClient.legalName}</span></p>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
                    <button onClick={resetAndClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                    <button onClick={handleAddClick} disabled={!selectedClient} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Add Client</button>
                </div>
            </div>
        </div>
    );
};

interface BalanceSheetProps {
    setActiveView: (view: View) => void;
}

export const BalanceSheet: React.FC<BalanceSheetProps> = ({ setActiveView }) => {
    const { clients, updateClient } = useClientData();
    const { getDueDate } = useDueDate();
    const [selectedFy, setSelectedFy] = useState<string>('');
    const [financialYears, setFinancialYears] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingClient, setViewingClient] = useState<{ client: Client, sno: number } | null>(null);
    const [isAddingFy, setIsAddingFy] = useState(false);
    const [newFyInput, setNewFyInput] = useState('');
    const [newFyError, setNewFyError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | BalanceSheetStatus>('all');
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    // Upload Modal States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadClient, setUploadClient] = useState<Client | null>(null);
    const [uploadDocuments, setUploadDocuments] = useState<PdfDocument[]>([]);

    useEffect(() => {
        const storedFys = localStorage.getItem('financialYears');
        const currentFy = getCurrentFinancialYear();
        let initialFys: string[];

        if (storedFys) {
            try {
                initialFys = JSON.parse(storedFys);
                if (!initialFys.includes(currentFy)) {
                    initialFys.push(currentFy);
                }
            } catch (e) {
                const lastYear = parseInt(currentFy.split('-')[0]) - 1;
                const lastFy = `${lastYear}-${(lastYear + 1).toString().slice(-2)}`;
                initialFys = [lastFy, currentFy];
            }
        } else {
            const lastYear = parseInt(currentFy.split('-')[0]) - 1;
            const lastFy = `${lastYear}-${(lastYear + 1).toString().slice(-2)}`;
            initialFys = [lastFy, currentFy];
        }
        
        const sortedFys = [...new Set(initialFys)].sort().reverse();
        setFinancialYears(sortedFys);
        localStorage.setItem('financialYears', JSON.stringify(sortedFys));
        setSelectedFy(currentFy);
    }, []);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                if ((event.target as Element).closest('th button')) return;
                setOpenFilter(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [filterRef]);

    const balanceSheetClients = useMemo(() => {
        let clientsToFilter = clients
            .filter(client => {
                return !!client.balanceSheets?.[selectedFy];
            });
            
        if (statusFilter !== 'all') {
            clientsToFilter = clientsToFilter.filter(item => (item.balanceSheets?.[selectedFy]?.status || BalanceSheetStatus.PENDING) === statusFilter);
        }

        if (!searchTerm) {
            return clientsToFilter;
        }

        const lowerSearch = searchTerm.toLowerCase();
        return clientsToFilter.filter(item => {
                return (item.legalName?.toLowerCase().includes(lowerSearch) || 
                        item.tradeName?.toLowerCase().includes(lowerSearch) ||
                        item.gstProfile?.gstin?.toLowerCase().includes(lowerSearch) ||
                        item.itProfile?.pan?.toLowerCase().includes(lowerSearch));
            });
    }, [clients, selectedFy, searchTerm, statusFilter]);

    const dueDate = useMemo(() => {
        if (!selectedFy) return '';
        const date = getDueDate('BalanceSheet', selectedFy);
        return date ? `Due Date: ${new Date(date).toLocaleDateString('en-GB')}` : '';
    }, [selectedFy, getDueDate]);
    
    const handleUpdateBalanceSheet = (clientId: string, field: string, value: any) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            const updatedClient = JSON.parse(JSON.stringify(client)) as Client;
            if (!updatedClient.balanceSheets) updatedClient.balanceSheets = {};
            if (!updatedClient.balanceSheets[selectedFy]) updatedClient.balanceSheets[selectedFy] = { status: BalanceSheetStatus.PENDING };
            
            const fyBS = updatedClient.balanceSheets[selectedFy];
            (fyBS as any)[field] = value;
            updateClient(updatedClient);
        }
    };

    const handleAddClientToBS = (clientId: string) => {
        handleUpdateBalanceSheet(clientId, 'status', BalanceSheetStatus.PENDING);
    };

    const handleRemoveBalanceSheet = (clientId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to remove this Balance Sheet for F.Y. ${selectedFy}?`)) {
            const client = clients.find(c => c.id === clientId);
            if (client) {
                setTimeout(() => {
                    const updatedClient = JSON.parse(JSON.stringify(client)) as Client;
                    if (updatedClient.balanceSheets?.[selectedFy]) {
                        delete updatedClient.balanceSheets[selectedFy];
                        updateClient(updatedClient);
                        setToastMessage({ type: 'success', message: 'Balance Sheet entry removed successfully.' });
                    }
                }, 0);
            }
        }
    };
    
    const handleSaveNewFy = () => {
        const newFy = newFyInput.trim();
        if (!/^\d{4}-\d{2}$/.test(newFy)) {
            setNewFyError("Invalid format. Use YYYY-YY."); return;
        }
        const [startYear, endYearShort] = newFy.split('-').map(Number);
        if (endYearShort !== (startYear + 1) % 100) {
            setNewFyError("Years must be consecutive (e.g., 2024-25)."); return;
        }
        if (financialYears.includes(newFy)) {
            setNewFyError("F.Y. already exists."); return;
        }
        const updatedFys = [...financialYears, newFy].sort().reverse();
        setFinancialYears(updatedFys);
        localStorage.setItem('financialYears', JSON.stringify(updatedFys));
        setSelectedFy(newFy);
        setIsAddingFy(false); setNewFyInput(''); setNewFyError('');
    };
    
    const handleBulkReminderClick = () => {
        localStorage.setItem('reminderContext', 'BalanceSheet');
        setActiveView(View.ReminderMessages);
    };

    const handleOpenUploadModal = (client: Client) => {
        setUploadClient(client);
        const docs = client.balanceSheets?.[selectedFy]?.documents || [];
        setUploadDocuments(docs);
        setIsUploadModalOpen(true);
    };

    const handleSaveDocuments = () => {
        if (uploadClient) {
            const updatedClient = JSON.parse(JSON.stringify(uploadClient)) as Client;
            if (!updatedClient.balanceSheets) updatedClient.balanceSheets = {};
            if (!updatedClient.balanceSheets[selectedFy]) updatedClient.balanceSheets[selectedFy] = { status: BalanceSheetStatus.PENDING };
            
            updatedClient.balanceSheets[selectedFy].documents = uploadDocuments;
            updateClient(updatedClient);
            setIsUploadModalOpen(false);
        }
    };

    const readFiles = (files: FileList): Promise<PdfDocument[]> => {
        return Promise.all(Array.from(files).map(file => {
            return new Promise<PdfDocument>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ name: file.name, dataUrl: reader.result as string });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }));
    };

    const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = await readFiles(e.target.files);
            setUploadDocuments(prev => [...prev, ...newFiles]);
        }
    };

    const handleFileDelete = (index: number) => {
        setUploadDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const getStatusColor = (status: BalanceSheetStatus) => {
        switch (status) {
            case BalanceSheetStatus.FINALIZED:
                return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
            case BalanceSheetStatus.IN_PROGRESS:
                return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
            case BalanceSheetStatus.DATA_RECEIVED:
                return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700';
            case BalanceSheetStatus.PENDING:
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold">Balance Sheet Finalization</h1>
                <div className="flex items-center gap-2">
                    <button onClick={handleBulkReminderClick} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-sm">
                        <BellIcon /> Reminder
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl shadow-sm">
                 <div className="flex items-center gap-2 flex-wrap">
                    <label>Financial Year:</label>
                    <select value={selectedFy} onChange={e => setSelectedFy(e.target.value)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {financialYears.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                    </select>
                    {isAddingFy ? (
                        <div className="flex items-center gap-2 relative">
                            <input type="text" value={newFyInput} onChange={e => { setNewFyInput(e.target.value); if(newFyError) setNewFyError(''); }} placeholder="YYYY-YY" className={`w-28 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${newFyError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                            <button onClick={handleSaveNewFy} className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition">Save</button>
                            <button onClick={() => { setIsAddingFy(false); setNewFyError(''); }} className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">Cancel</button>
                            {newFyError && <p className="absolute top-full left-0 mt-1 text-xs text-red-500">{newFyError}</p>}
                        </div>
                    ) : (
                        <button onClick={() => setIsAddingFy(true)} className="px-3 py-2 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition">Add F.Y.</button>
                    )}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    {dueDate && (
                        <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 text-right">
                            {dueDate}
                        </p>
                    )}
                    <input type="search" placeholder="Search Clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto px-3 py-1 border rounded-md bg-white dark:bg-gray-700"/>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"><PlusIcon /> Add Client</button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-left text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="p-3">S.No</th>
                            <th className="p-3">Client Name</th>
                            <th className="p-3">PAN/GSTIN</th>
                            <th className="p-3">
                                <div className="flex items-center relative">
                                    Status
                                    <button onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')} className="ml-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                        <FilterIcon />
                                    </button>
                                    {openFilter === 'status' && (
                                        <div ref={filterRef} className="absolute top-full mt-2 z-10 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-600">
                                            <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                                                <li onClick={() => { setStatusFilter('all'); setOpenFilter(null); }} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">All</li>
                                                {Object.values(BalanceSheetStatus).map((s: string) => (<li key={s} onClick={() => { setStatusFilter(s as BalanceSheetStatus); setOpenFilter(null); }} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">{s}</li>))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                {statusFilter !== 'all' && (<div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{statusFilter}</div>)}
                            </th>
                            <th className="p-3">Finalization Date</th>
                            <th className="p-3">Remarks</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {balanceSheetClients.map((client: Client, index: number) => {
                            const bsData = client.balanceSheets?.[selectedFy] || { status: BalanceSheetStatus.PENDING };
                            return (
                                <tr key={client.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3 font-medium">{client.tradeName || client.legalName}</td>
                                    <td className="p-3">{client.itProfile?.pan || client.gstProfile?.gstin}</td>
                                    <td className="p-3">
                                        <select 
                                            value={bsData.status} 
                                            onChange={e => handleUpdateBalanceSheet(client.id, 'status', e.target.value)} 
                                            className={`p-1 text-xs rounded border w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 ${getStatusColor(bsData.status)}`}
                                        >
                                            {Object.values(BalanceSheetStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3"><input type="date" value={bsData.finalizationDate || ''} onChange={e => handleUpdateBalanceSheet(client.id, 'finalizationDate', e.target.value)} className="p-1 text-xs rounded border w-32 bg-white dark:bg-gray-700"/></td>
                                    <td className="p-3"><input type="text" defaultValue={bsData.remarks || ''} onBlur={e => handleUpdateBalanceSheet(client.id, 'remarks', e.target.value)} className="p-1 text-xs w-full rounded border bg-white dark:bg-gray-700"/></td>
                                    <td className="p-3 flex items-center gap-2">
                                        <button onClick={() => handleOpenUploadModal(client)} title="Upload Documents" className="p-2 text-purple-600 dark:text-purple-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><CloudUploadIcon /></button>
                                        <button onClick={() => { setViewingClient({ client, sno: index + 1 }); setIsDetailsModalOpen(true);}} title="View Client"><EyeIcon /></button>
                                        <button onClick={(e) => handleRemoveBalanceSheet(client.id, e)} title="Remove from list" className="text-red-600 hover:text-red-800"><TrashIcon /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {balanceSheetClients.length === 0 && <p className="text-center p-8">No clients found for Balance Sheet in F.Y. {selectedFy}.</p>}
            </div>
             <AddBSClientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddClientToBS} allClients={clients} existingClientIds={balanceSheetClients.map(c => c.id)} />
             {isDetailsModalOpen && viewingClient && <FullDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} client={viewingClient.client} sno={viewingClient.sno} onEditPassword={() => {}} onEdit={() => {}} context={viewingClient.client.gstProfile ? 'gst' : 'it'}/>}
             {toastMessage && <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg text-white shadow-lg z-50 animate-bounce ${toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toastMessage.message}</div>}
             
             {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Documents: {uploadClient?.tradeName || uploadClient?.legalName} (F.Y. {selectedFy})
                            </h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <PdfUploadWidget 
                                title="Upload Balance Sheet Docs" 
                                documents={uploadDocuments} 
                                onFilesChange={handleFilesChange} 
                                onFileDelete={handleFileDelete} 
                            />
                        </div>
                        <div className="flex justify-end space-x-2 p-4 border-t dark:border-gray-700 mt-auto">
                            <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancel</button>
                            <button onClick={handleSaveDocuments} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceSheet;
