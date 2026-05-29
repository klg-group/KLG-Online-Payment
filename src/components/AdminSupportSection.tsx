import React, { useState, useEffect } from 'react';
import { SupportTicket } from '../types';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MessageSquare, Check, Keyboard, Filter, Search, Send, Clock, AlertCircle } from 'lucide-react';

export function AdminSupportSection() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket)));
      setLoading(false);
    }, () => {
      // Offline fallback
      const cached = localStorage.getItem('klgc_local_tickets');
      if (cached) {
        try {
          setTickets(JSON.parse(cached));
        } catch (_) {}
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSendReply = async (ticket: SupportTicket) => {
    const replyText = replies[ticket.id]?.trim();
    if (!replyText) return;

    try {
      const ticketRef = doc(db, 'support_tickets', ticket.id);
      await updateDoc(ticketRef, {
        adminReply: replyText,
        status: 'resolved',
        updatedAt: Timestamp.now()
      });

      // Erase from input buffer
      setReplies(prev => {
        const copy = { ...prev };
        delete copy[ticket.id];
        return copy;
      });

      // Synchronize in cached storage if any
      const updatedTickets = tickets.map(t => 
        t.id === ticket.id ? { ...t, adminReply: replyText, status: 'resolved' as const, updatedAt: Timestamp.now() } : t
      );
      localStorage.setItem('klgc_local_tickets', JSON.stringify(updatedTickets));
    } catch (err) {
      console.error("Failed to answer support ticket: ", err);
    }
  };

  const toggleStatus = async (ticket: SupportTicket) => {
    const nextStatus = ticket.status === 'open' ? 'resolved' : 'open';
    try {
      const ticketRef = doc(db, 'support_tickets', ticket.id);
      await updateDoc(ticketRef, {
        status: nextStatus,
        updatedAt: Timestamp.now()
      });
      
      const updatedTickets = tickets.map(t => 
        t.id === ticket.id ? { ...t, status: nextStatus, updatedAt: Timestamp.now() } : t
      );
      localStorage.setItem('klgc_local_tickets', JSON.stringify(updatedTickets));
    } catch (err) {
      console.error("Failed to toggle ticket status: ", err);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = 
      t.userEmail.toLowerCase().includes(searchStr) || 
      t.subject.toLowerCase().includes(searchStr) || 
      t.message.toLowerCase().includes(searchStr);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 border border-black items-end">
        <div className="md:col-span-1">
          <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1">Search Tickets</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by keywords, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-8 text-xs border border-black font-semibold focus:outline-none bg-white"
            />
            <Search size={12} className="absolute left-2.5 top-3 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1">Status Filter</label>
          <div className="flex border border-black divide-x divide-black rounded-none">
            {(['all', 'open', 'resolved'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-wider ${
                  filter === f ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Incoming Support Queue</p>
          <p className="text-lg font-black">{filteredTickets.length} Items Listed</p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500 font-bold animate-pulse">Synchronizing communication database...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="border border-black border-dashed p-8 text-center text-gray-400 italic bg-white rounded-none">
          No customer tickets found in active logs matching filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map(t => (
            <div key={t.id} className="bg-white border border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 border text-[9px] font-black uppercase ${
                    t.status === 'open' 
                      ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' 
                      : 'bg-green-50 border-green-500 text-green-600'
                  }`}>
                    {t.status}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">ID: {t.id}</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1">
                    <Clock size={10} /> {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs uppercase font-black tracking-tight text-gray-500">Sender / Correspondent</h4>
                  <p className="text-xs font-mono font-black text-black">{t.userEmail}</p>
                </div>

                <div>
                  <h4 className="text-xs uppercase font-black tracking-tight text-gray-500">Subject / Matter</h4>
                  <p className="text-sm font-black text-gray-900 leading-snug">{t.subject}</p>
                </div>

                <div className="p-3 bg-gray-50 border border-black border-dashed text-xs leading-relaxed max-h-36 overflow-auto">
                  {t.message}
                </div>

                {t.adminReply && (
                  <div className="p-3 bg-green-50/50 border border-green-300 text-xs text-green-900 leading-relaxed">
                    <p className="font-bold text-[9px] uppercase text-green-700 tracking-wider mb-1">✔️ Outgoing Admin Response Delivered:</p>
                    {t.adminReply}
                  </div>
                )}
              </div>

              {/* Responder Controls */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-black/10 pt-4 md:pt-0 md:pl-6 space-y-3 shrink-0">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                  <Keyboard size={10} /> Responder Desk
                </p>
                
                <textarea
                  placeholder="Enter administrative reply response..."
                  value={replies[t.id] || ''}
                  onChange={(e) => setReplies(prev => ({ ...prev, [t.id]: e.target.value }))}
                  rows={3}
                  className="w-full p-2 border border-black text-xs font-semibold focus:outline-none bg-white font-sans"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendReply(t)}
                    disabled={!replies[t.id]?.trim()}
                    className="flex-1 py-2 bg-black hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send size={10} /> Deliver Response
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(t)}
                    className="py-2 px-3 bg-white hover:bg-gray-50 border border-black text-black text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    {t.status === 'open' ? 'Resolve' : 'Reopen'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
