import React, { useState } from 'react';
import { UserProfile, KYCStatus } from '../types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, Ban, CheckCircle, Trash2, Edit3, UserCheck, AlertOctagon, RefreshCw } from 'lucide-react';

export function AdminUsersSection({ 
  users, 
  onRefresh 
}: { 
  users: UserProfile[]; 
  onRefresh?: () => void; 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustingBalanceUserId, setAdjustingBalanceUserId] = useState<string | null>(null);
  const [newBalanceAmount, setNewBalanceAmount] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const searchLow = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(searchLow) ||
      (u.displayName && u.displayName.toLowerCase().includes(searchLow)) ||
      u.uid.toLowerCase().includes(searchLow)
    );
  });

  const toggleBlock = async (user: UserProfile) => {
    const isBlocked = (user as any).blocked === true;
    setUpdating(user.uid);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        blocked: !isBlocked
      });
      // Also update localStorage cache if they are block/unblocked
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to toggle block: ", err);
    } finally {
      setUpdating(null);
    }
  };

  const toggleSuspension = async (user: UserProfile) => {
    const isSuspended = (user as any).suspended === true;
    setUpdating(user.uid);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        suspended: !isSuspended
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to toggle suspension: ", err);
    } finally {
      setUpdating(null);
    }
  };

  const updateKYC = async (userUid: string, status: KYCStatus) => {
    setUpdating(userUid);
    try {
      await updateDoc(doc(db, 'users', userUid), {
        kycStatus: status
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to update KYC: ", err);
    } finally {
      setUpdating(null);
    }
  };

  const adjustBalance = async (userUid: string, currentBalance: number) => {
    const val = parseFloat(newBalanceAmount);
    if (isNaN(val)) return;
    setUpdating(userUid);
    try {
      await updateDoc(doc(db, 'users', userUid), {
        balance: val
      });
      setAdjustingBalanceUserId(null);
      setNewBalanceAmount('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to adjust balance: ", err);
    } finally {
      setUpdating(null);
    }
  };

  const removeUser = async (userUid: string) => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE? This deletes the user profile data locally. This action is irreversible.")) return;
    setUpdating(userUid);
    try {
      await deleteDoc(doc(db, 'users', userUid));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to delete user profile: ", err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50 p-4 border border-black">
        <div className="w-full sm:max-w-md">
          <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1">Search Directory</label>
          <input
            type="text"
            placeholder="Type email, profile UID, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 text-xs border border-black font-semibold focus:outline-none bg-white"
          />
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-black uppercase text-gray-400">Total Indicated Records</p>
          <p className="text-xl font-black">{filteredUsers.length} Users</p>
        </div>
      </div>

      <div className="border border-black overflow-x-auto bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left text-xs divide-y divide-black font-sans">
          <thead className="bg-[#E4E3E0] uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="p-3 border-r border-black">Security Profile</th>
              <th className="p-3 border-r border-black">Account Role</th>
              <th className="p-3 border-r border-black">KYC Operations</th>
              <th className="p-3 border-r border-black text-right">Ledger Balance</th>
              <th className="p-3 text-center">Enforcement Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black font-sans select-none">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 italic font-medium">No matching accounts located in active roster.</td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isBlocked = (u as any).blocked === true;
                const isSuspended = (u as any).suspended === true;
                return (
                  <tr key={u.uid} className={`hover:bg-gray-50 transition-colors ${isBlocked ? 'bg-red-50/50' : isSuspended ? 'bg-amber-50/40' : ''}`}>
                    {/* User profile ID */}
                    <td className="p-3 border-r border-black">
                      <div className="font-bold flex items-center gap-1.5 text-xs truncate max-w-[240px]">
                        {isBlocked && <AlertOctagon size={12} className="text-red-600 animate-pulse shrink-0" />}
                        {isSuspended && <Ban size={12} className="text-amber-600 shrink-0" />}
                        {u.displayName || 'Unnamed Partner'}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 truncate max-w-[240px]">{u.email}</div>
                      <div className="text-[9px] font-mono tracking-tighter text-gray-300">UID: {u.uid}</div>
                    </td>

                    {/* Role */}
                    <td className="p-3 border-r border-black">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${u.role === 'admin' ? 'bg-red-600 text-white border-black' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* KYC compliance */}
                    <td className="p-3 border-r border-black space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase text-center px-2 py-0.5 border ${
                          u.kycStatus === 'verified' ? 'bg-green-100 text-green-800 border-green-600' :
                          u.kycStatus === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-600 animate-pulse' :
                          u.kycStatus === 'rejected' ? 'bg-red-100 text-red-800 border-red-600' :
                          'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          {u.kycStatus}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateKYC(u.uid, 'verified')}
                          className="px-1.5 py-0.5 bg-green-600 text-white font-bold text-[8px] uppercase hover:bg-green-700 shrink-0 border border-black"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateKYC(u.uid, 'rejected')}
                          className="px-1.5 py-0.5 bg-red-600 text-white font-bold text-[8px] uppercase hover:bg-red-700 shrink-0 border border-black"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => updateKYC(u.uid, 'pending')}
                          className="px-1.5 py-0.5 bg-amber-400 text-black font-bold text-[8px] uppercase hover:bg-amber-500 shrink-0 border border-black"
                        >
                          Pending
                        </button>
                      </div>
                    </td>

                    {/* Ledger value */}
                    <td className="p-3 border-r border-black text-right font-mono">
                      {adjustingBalanceUserId === u.uid ? (
                        <div className="flex justify-end gap-1">
                          <input
                            type="number"
                            value={newBalanceAmount}
                            onChange={(e) => setNewBalanceAmount(e.target.value)}
                            placeholder={u.balance.toFixed(2)}
                            className="w-20 p-1 border border-black text-xs h-6 bg-white text-right font-bold focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => adjustBalance(u.uid, u.balance)}
                            className="bg-black text-white px-1.5 text-[8px] font-bold uppercase hover:bg-gray-800 border border-black"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustingBalanceUserId(null)}
                            className="bg-white text-black px-1.5 text-[8px] font-bold uppercase hover:bg-gray-100 border border-black"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-bold text-gray-900">${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingBalanceUserId(u.uid);
                              setNewBalanceAmount(u.balance.toString());
                            }}
                            className="p-1 text-gray-400 hover:text-black border border-transparent hover:border-black rounded hover:bg-gray-100 transition-all"
                          >
                            <Edit3 size={10} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Execution elements */}
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleSuspension(u)}
                          className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border border-black ${
                            isSuspended 
                              ? 'bg-amber-400 text-black font-black' 
                              : 'bg-white text-gray-700 hover:bg-amber-100'
                          }`}
                        >
                          <Ban size={10} /> {isSuspended ? 'Suspended' : 'Suspend'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBlock(u)}
                          className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border border-black ${
                            isBlocked 
                              ? 'bg-red-600 text-white font-black' 
                              : 'bg-white text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Ban size={10} /> {isBlocked ? 'Blocked' : 'Block Access'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeUser(u.uid)}
                          disabled={u.email === 'klgc.hq.2016@gmail.com'}
                          className="p-1 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-300 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
