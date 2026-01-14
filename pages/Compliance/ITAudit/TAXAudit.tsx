
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Client, AuditType, AuditStatus, View } from '../../../types';
import { useClientData } from '../../../hooks/useClientData';
import { PlusIcon, EyeIcon, TrashIcon, FilterIcon, BellIcon, SettingsIcon, CalendarIcon } from './icons';
import { useDueDate } from '../../../hooks/useDueDate';
import { FullDetailsModal } from './FullDetailsModal';

const getCurrentFinancialYear = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return currentMonth < 3 ? `${currentYear - 1}-${currentYear.toString().slice(-2)}` : `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
};

interface FlattenedAuditItem {
    client: Client;
    auditType: AuditType;
    auditData: {
        status: AuditStatus;
        dueDate?: string;
        completionDate?: string;
        assignedTo?: string;
        remarks?: string;
    };
}

const AddAuditClientModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (clientId: string, auditType: AuditType, assignedTo: string) => void;
    allClients: Client[];
    existingAudits: { clientId: string; auditType: AuditType }[];
}> = ({ isOpen, onClose, onAdd, allClients, existingAudits }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [auditType, setAuditType] = useState<AuditType>(AuditType.TAX_AUDIT_44AB);
    const [assignedTo, setAssignedTo] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const availableClients = useMemo(() => {
        if (!searchTerm) return [];
        const lowerSearch = searchTerm.toLowerCase();
        
        return allClients.filter(c => 
            ((c.legalName?.toLowerCase().includes(lowerSearch) || c.tradeName?.toLowerCase().includes(lowerSearch) || c.gstProfile?.gstin?.toLowerCase().includes(lowerSearch)) ||
             (c.itProfile?.pan?.toLowerCase().includes(lowerSearch)))
        );
    }, [allClients, searchTerm]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    
    const resetAndClose = () => {
        setSearchTerm('');
        setSelectedClient(null);
        setAuditType(AuditType.TAX_AUDIT_44AB);
        setAssignedTo('');
        onClose();
    };

    const handleAddClick = () => {
        if (selectedClient) {
            const isDuplicate = existingAudits.some(a => a.clientId === selectedClient.id && a.auditType === auditType);
            if (isDuplicate) {
                alert('This client already has this audit type assigned for the selected financial year.');
                return;
            }
            onAdd(selectedClient.id, auditType, assignedTo);
            resetAndClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Add Client to Audit List</h2>
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
                    <div>
                        <label className="block text-sm font-medium">Audit Type</label>
                        <select value={auditType} onChange={e => setAuditType(e.target.value as AuditType)} className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700">
                            {Object.values(AuditType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Assigned To</label>
                        <input type="text" placeholder="Staff name" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
                    </div>
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
                    <button onClick={resetAndClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                    <button onClick={handleAddClick} disabled={!selectedClient} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Add Client</button>
                </div>
            </div>
        </div>
    );
};

interface AuditProps {
    setActiveView: (view: View) => void;
}

export const Audit: React.FC<AuditProps> = ({ setActiveView }) => {
    const { clients, updateClient } = useClientData();
    const { getDueDate } = useDueDate();
    const [selectedFy, setSelectedFy] = useState<string>('');
    const [financialYears, setFinancialYears] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingData, setViewingData] = useState<{ client: Client, sno: number } | null>(null);
    const [isAddingFy, setIsAddingFy] = useState(false);
    const [newFyInput, setNewFyInput] = useState('');
    const [newFyError, setNewFyError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | AuditStatus>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | AuditType>('all');
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

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
                initialFys = [`${lastYear}-${(lastYear + 1).toString().slice(-2)}`, currentFy];
            }
        } else {
            const lastYear = parseInt(currentFy.split('-')[0]) - 1;
            initialFys = [`${lastYear}-${(lastYear + 1).toString().slice(-2)}`, currentFy];
        }
        
        const sortedFys = [...new Set(initialFys)].sort().reverse();
        setFinancialYears(sortedFys);
        localStorage.setItem('financialYears', JSON.stringify(sortedFys));
        setSelectedFy(currentFy);
    }, []);

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

    const auditClients = useMemo(() => {
        const flattened: FlattenedAuditItem[] = [];
        
        clients.forEach(client => {
            const clientAudits = client.audits?.[selectedFy];
            if (!clientAudits) return;
            
            Object.entries(clientAudits).forEach(([type, data]) => {
                if (data) {
                    flattened.push({ 
                        client, 
                        auditType: type as AuditType, 
                        auditData: data 
                    });
                }
            });
        });

        return flattened.filter(item => {
            if (statusFilter !== 'all' && item.auditData.status !== statusFilter) return false;
            if (typeFilter !== 'all' && item.auditType !== typeFilter) return false;
            if (searchTerm) {
                const lowerSearch = searchTerm.toLowerCase();
                return (
                    item.client.legalName?.toLowerCase().includes(lowerSearch) || 
                    item.client.tradeName?.toLowerCase().includes(lowerSearch) ||
                    item.client.gstProfile?.gstin?.toLowerCase().includes(lowerSearch) ||
                    item.client.itProfile?.pan?.toLowerCase().includes(lowerSearch)
                );
            }
            return true;
        });
    }, [clients, selectedFy, searchTerm, statusFilter, typeFilter]);
    
    const existingAuditsForModal = useMemo(() => {
        return auditClients.map(ac => ({ clientId: ac.client.id, auditType: ac.auditType }));
    }, [auditClients]);

    const dueDate = useMemo(() => {
        if (!selectedFy) return '';
        const date = getDueDate('Audit', selectedFy);
        return date ? `Due Date: ${new Date(date).toLocaleDateString('en-GB')}` : '';
    }, [selectedFy, getDueDate]);
    
    const handleUpdateAudit = (clientId: string, auditType: AuditType, field: string, value: any) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            const updatedClient = JSON.parse(JSON.stringify(client)) as Client;
            if (!updatedClient.audits) updatedClient.audits = {};
            if (!updatedClient.audits[selectedFy]) updatedClient.audits[selectedFy] = {};
            
            const fyAudits = updatedClient.audits[selectedFy];
            if (!fyAudits[auditType]) fyAudits[auditType] = { status: AuditStatus.PENDING };

            (fyAudits[auditType] as any)[field] = value;
            updateClient(updatedClient);
        }
    };

    const handleAddClientToAudit = (clientId: string, auditType: AuditType, assignedTo: string) => {
        const client = clients.find(c => c.id === clientId);
        if(client){
            const updatedClient = JSON.parse(JSON.stringify(client)) as Client;
            if (!updatedClient.audits) updatedClient.audits = {};
            if (!updatedClient.audits[selectedFy]) updatedClient.audits[selectedFy] = {};
            
            updatedClient.audits[selectedFy][auditType] = {
                status: AuditStatus.PENDING,
                assignedTo: assignedTo,
                dueDate: getDueDate('Audit', selectedFy)
            };
            updateClient(updatedClient);
        }
    };

    const handleRemoveAudit = (clientId: string, auditType: AuditType, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to remove this Audit (${auditType}) for F.Y. ${selectedFy}?`)) {
            const client = clients.find(c => c.id === clientId);
            if (client) {
                setTimeout(() => {
                    const updatedClient = JSON.parse(JSON.stringify(client)) as Client;
                    if (updatedClient.audits?.[selectedFy]?.[auditType]) {
                        delete updatedClient.audits[selectedFy][auditType];
                        if(Object.keys(updatedClient.audits[selectedFy]).length === 0){
                            delete updatedClient.audits[selectedFy];
                        }
                        updateClient(updatedClient);
                        setToastMessage({ type: 'success', message: 'Audit entry removed successfully.' });
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
    
    const getStatusColor = (status: AuditStatus) => {
        switch (status) {
            case AuditStatus.COMPLETED:
                return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
            case AuditStatus.IN_PROGRESS:
                return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
            case AuditStatus.DATA_REQUESTED:
                return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700';
            case AuditStatus.PENDING:
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Audit</h1>
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
                    ) : (<button onClick={() => setIsAddingFy(true)} className="px-3 py-2 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition">Add F.Y.</button>)}
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
                                <div className="flex items-center relative">Audit Type<button onClick={() => setOpenFilter(openFilter === 'type' ? null : 'type')} className="ml-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><FilterIcon /></button>
                                {openFilter === 'type' && <div ref={filterRef} className="absolute top-full mt-2 z-10 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-600"><ul><li onClick={() => { setTypeFilter('all'); setOpenFilter(null); }} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">All</li>{Object.values(AuditType).map(s => (<li key={s} onClick={() => { setTypeFilter(s); setOpenFilter(null); }} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">{s}</li>))}</ul></div>}
                                </div>
                                {typeFilter !== 'all' && <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{typeFilter}</div>}
                            </th>
                            <th className="p-3">
                                <div className="flex items-center relative">Status<button onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')} className="ml-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><FilterIcon /></button>
                                {openFilter === 'status' && <div ref={filterRef} className="absolute top-full mt-2 z-10 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-600"><ul><li onClick={() => { setStatusFilter('all'); setOpenFilter(null); }} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">All</li>{Object.values(AuditStatus).map(s => (<li key={s} onClick={() => { setStatusFilter(s); setOpenFilter(null); }} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">{s}</li>))}</ul></div>}
                                </div>
                                {statusFilter !== 'all' && <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{statusFilter}</div>}
                            </th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3">Completion Date</th>
                            <th className="p-3">Assigned To</th>
                            <th className="p-3">Remarks</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditClients.map((item: FlattenedAuditItem, index: number) => {
                            const { client, auditType, auditData } = item;
                            return (
                                <tr key={`${client.id}-${auditType}`} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3 font-medium">{client.tradeName || client.legalName}</td>
                                    <td className="p-3">{client.gstProfile?.gstin || client.itProfile?.pan}</td>
                                    <td className="p-3">{auditType}</td>
                                    <td className="p-3">
                                        <select 
                                            value={auditData.status} 
                                            onChange={e => handleUpdateAudit(client.id, auditType, 'status', e.target.value)} 
                                            className={`p-1 text-xs rounded border w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 ${getStatusColor(auditData.status)}`}
                                        >
                                            {Object.values(AuditStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3"><input type="date" value={auditData.dueDate || ''} onChange={e => handleUpdateAudit(client.id, auditType, 'dueDate', e.target.value)} className="p-1 text-xs rounded border w-32 bg-white dark:bg-gray-700"/></td>
                                    <td className="p-3"><input type="date" value={auditData.completionDate || ''} onChange={e => handleUpdateAudit(client.id, auditType, 'completionDate', e.target.value)} className="p-1 text-xs rounded border w-32 bg-white dark:bg-gray-700"/></td>
                                    <td className="p-3"><input type="text" defaultValue={auditData.assignedTo || ''} onBlur={e => handleUpdateAudit(client.id, auditType, 'assignedTo', e.target.value)} className="p-1 text-xs w-full rounded border bg-white dark:bg-gray-700"/></td>
                                    <td className="p-3"><input type="text" defaultValue={auditData.remarks || ''} onBlur={e => handleUpdateAudit(client.id, auditType, 'remarks', e.target.value)} className="p-1 text-xs w-full rounded border bg-white dark:bg-gray-700"/></td>
                                    <td className="p-3 flex items-center gap-2">
                                        <button onClick={() => { setViewingData({ client, sno: index + 1 }); setIsDetailsModalOpen(true);}} title="View Client"><EyeIcon /></button>
                                        <button onClick={(e) => handleRemoveAudit(client.id, auditType, e)} title="Remove from list" className="text-red-600 hover:text-red-800"><TrashIcon /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {auditClients.length === 0 && <p className="text-center p-8">No clients found for Audit in F.Y. {selectedFy}.</p>}
            </div>
             {toastMessage && <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg text-white shadow-lg z-50 animate-bounce ${toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toastMessage.message}</div>}
             <AddAuditClientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddClientToAudit} allClients={clients} existingAudits={existingAuditsForModal} />
             {isDetailsModalOpen && viewingData && <FullDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} client={viewingData.client} sno={viewingData.sno} onEditPassword={() => {}} onEdit={() => {}} context={viewingData.client.gstProfile ? 'gst' : 'it'}/>}
        </div>
    );
};
