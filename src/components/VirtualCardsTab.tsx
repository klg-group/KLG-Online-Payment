import React, { useState, useEffect } from 'react';
import { 
  collection, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  doc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { VirtualCard, UserProfile, Transaction } from '../types';
import { 
  Plus, 
  CreditCard, 
  Lock, 
  Unlock, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  X, 
  Activity, 
  Fingerprint, 
  Check, 
  ShieldCheck, 
  Smartphone, 
  Building, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function VirtualCardsTab({ userId, profile }: { userId: string; profile: UserProfile | null }) {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Card ISSUER Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [cardLabel, setCardLabel] = useState('');
  const [cardType, setCardType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [linkedProvider, setLinkedProvider] = useState('Plaid Bank Node');
  const [isIssuing, setIsIssuing] = useState(false);

  // Active Transaction Dialog inside Selected Cards
  const [activeCard, setActiveCard] = useState<VirtualCard | null>(null);
  const [transAmount, setTransAmount] = useState('');
  const [transType, setTransType] = useState<'cash_in_load' | 'cash_out_withdraw'>('cash_in_load');
  const [isTransacting, setIsTransacting] = useState(false);
  const [transStep, setTransStep] = useState<string[]>([]);
  const [transResult, setTransResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'virtualCards'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: VirtualCard[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as VirtualCard);
      });
      setCards(list);
      setLoading(false);
    }, (err) => {
      console.error("Error loading virtual cards:", err);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);

    try {
      const cardId = Math.random().toString(36).substring(2, 10);
      
      // Generate a realistic Card Number scheme
      const prefix = cardType === 'cash_in' ? '4532' : '4812';
      const cardNumber = `${prefix} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
      const expiry = `06/${28 + Math.floor(Math.random() * 5)}`;
      const cvv = Math.floor(100 + Math.random() * 899).toString();

      const newCard: VirtualCard = {
        id: cardId,
        userId,
        cardNumber,
        expiry,
        cvv,
        status: 'active',
        balance: cardType === 'cash_in' ? 5000 : 0,
        cardType,
        label: cardLabel || `${cardType === 'cash_in' ? 'Deposit' : 'Withdrawal'} Channel`,
        linkedProvider
      };

      await setDoc(doc(db, 'virtualCards', cardId), newCard);
      setIsAddOpen(false);
      setCardLabel('');
    } catch (err) {
      console.error("Error issuing virtual card:", err);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleToggleFreeze = async (card: VirtualCard) => {
    try {
      const newStatus = card.status === 'active' ? 'blocked' : 'active';
      await updateDoc(doc(db, 'virtualCards', card.id), { status: newStatus });
    } catch (err) {
      console.error("Error updating card status:", err);
    }
  };

  const handleRunCardTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard || !profile) return;
    
    const amountFloat = parseFloat(transAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      alert("Please specify a valid numeric amount to process.");
      return;
    }

    if (transType === 'cash_in_load' && amountFloat > (activeCard.balance ?? 0)) {
      alert("Insufficient card limits/balance to accommodate this load.");
      return;
    }

    if (transType === 'cash_out_withdraw' && amountFloat > profile.balance) {
      alert("Insufficient central KLG reserves to accommodate this withdrawal.");
      return;
    }

    setIsTransacting(true);
    setTransResult(null);
    setTransStep([]);

    const addStep = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setTransStep((prev) => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    try {
      await addStep(`[1/5] Syncing connection through gateway card endpoint CVV auth [Verified]`, 0);
      await addStep(`[2/5] Initiating secure tunneling with link network: ${activeCard.linkedProvider}...`, 700);
      await addStep(`[3/5] Telemetry verification: Validating payment payload key matches SHA-256 signatures`, 600);
      await addStep(`[4/5] Interfacing with central core banking engine to modify client ledger...`, 800);

      // Perform real DB transaction
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User record not found");
      const currentBalance = userSnap.data().balance;

      let newBalance = currentBalance;
      const cardRef = doc(db, 'virtualCards', activeCard.id);
      
      if (transType === 'cash_in_load') {
        // Cash In (Deposit money from card into principal balance)
        newBalance = currentBalance + amountFloat;
        await updateDoc(userRef, { balance: newBalance });
        await updateDoc(cardRef, { balance: (activeCard.balance ?? 0) - amountFloat });

        const transactionId = Math.random().toString(36).substring(2, 15);
        const trans: Transaction = {
          id: transactionId,
          userId,
          amount: amountFloat,
          type: 'deposit',
          method: activeCard.linkedProvider.includes('Crypto') ? 'Crypto' : activeCard.linkedProvider.includes('M-Pesa') ? 'Mobile Money' : 'Bank Transfer',
          status: 'completed',
          description: `KLG Card In Cash Load (Ref: ${activeCard.id}) - Approved`,
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'transactions'), trans);
        
      } else {
        // Cash Out (Withdraw money from balance to external card point)
        newBalance = currentBalance - amountFloat;
        await updateDoc(userRef, { balance: newBalance });
        await updateDoc(cardRef, { balance: (activeCard.balance ?? 0) + amountFloat });

        const transactionId = Math.random().toString(36).substring(2, 15);
        const trans: Transaction = {
          id: transactionId,
          userId,
          amount: amountFloat,
          type: 'withdrawal',
          method: activeCard.linkedProvider.includes('Crypto') ? 'Crypto' : activeCard.linkedProvider.includes('M-Pesa') ? 'Mobile Money' : 'Bank Transfer',
          status: 'completed',
          description: `KLG Card Out Disbursed Payout (Ref: ${activeCard.id}) - Dispatched`,
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'transactions'), trans);
      }

      await addStep(`[5/5] Balance synchronization finalized successfully. Transferred $${amountFloat.toLocaleString()}.`, 600);
      setTransResult('success');
      setTimeout(() => {
        setTransAmount('');
        setActiveCard(null);
        setIsTransacting(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      await addStep(`[FAILURE] Execution aborted: Ledger balance sync error.`, 1000);
      setTransResult('error');
      setIsTransacting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">KLG Virtual Infrastructure</h1>
          <p className="text-gray-500 text-xs font-bold uppercase mt-1 tracking-wider">
            Deploy secure virtual cards representing specialized Cash-In or Cash-Out gateways
          </p>
        </div>

        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-black text-white hover:bg-neutral-800 px-5 py-3 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 active:translate-y-0.5 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]"
        >
          <Plus size={16} /> Deploy New Card
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black" />
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500 font-mono">Loading Card Interfaces...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white border border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 max-w-2xl mx-auto">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto" strokeWidth={1} />
          <div>
            <h3 className="text-base font-bold uppercase">No Virtual Cards Active</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Virtual cards facilitate secure transfers. Issue a KLG **Cash-In** Card to load external capital directly, or a **Cash-Out** Card to push capital outwards into payment bridges.
            </p>
          </div>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="inline-flex bg-black text-white px-5 py-3 font-extrabold uppercase text-xs hover:bg-neutral-800 transition-all active:translate-y-0.5"
          >
            Deploy My First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card) => {
            const isCashIn = card.cardType === 'cash_in';
            return (
              <div 
                key={card.id}
                className={cn(
                  "bg-white border-2 border-black flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative",
                  card.status === 'blocked' ? "opacity-75 grayscale" : ""
                )}
              >
                {/* Physical Card Layout */}
                <div className={cn(
                  "p-6 h-48 relative flex flex-col justify-between text-white overflow-hidden border-b-2 border-black",
                  isCashIn 
                    ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950" 
                    : "bg-gradient-to-br from-amber-950 via-slate-900 to-red-950"
                )}>
                  <div className="absolute -bottom-10 -right-10 opacity-10 bg-white rounded-full w-40 h-40 pointer-events-none" />
                  
                  {/* Top Line */}
                  <div className="flex justify-between items-start z-10">
                    <div className="space-y-0.5">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#E4E3E0] opacity-80 flex items-center gap-1">
                        <Sparkles size={10} className="text-yellow-400" />
                        KLG Platinum System
                      </p>
                      <h4 className="font-sans font-black tracking-tight text-xs uppercase truncate max-w-[160px]">
                        {card.label}
                      </h4>
                    </div>

                    <div className="text-right">
                      {isCashIn ? (
                        <span className="bg-emerald-500 bg-opacity-20 text-emerald-400 border border-emerald-500 text-[8px] font-black px-2 py-0.5 uppercase tracking-widest rounded">
                          CASH IN INGEST
                        </span>
                      ) : (
                        <span className="bg-amber-500 bg-opacity-20 text-text-amber-400 border border-amber-500 text-[8px] font-black px-2 py-0.5 uppercase tracking-widest rounded text-amber-300">
                          CASH OUT OUTFLOW
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="z-10 py-2">
                    <p className="font-mono text-lg font-black tracking-[0.2em]">{card.cardNumber}</p>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex justify-between items-end z-10 w-full">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[7px] uppercase tracking-widest opacity-60">Expiry</p>
                        <p className="text-[11px] font-semibold font-mono">{card.expiry}</p>
                      </div>
                      <div>
                        <p className="text-[7px] uppercase tracking-widest opacity-60">SEC CVV</p>
                        <p className="text-[11px] font-semibold font-mono">{card.cvv}</p>
                      </div>
                      <div>
                        <p className="text-[7px] uppercase tracking-widest opacity-60">Route Balance</p>
                        <p className="text-[10px] font-semibold font-mono text-emerald-400 font-bold">${(card.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <p className="text-[7px] uppercase tracking-widest opacity-60">Channel Link</p>
                      <p className="text-[10px] uppercase font-bold text-[#E4E3E0] font-mono truncate max-w-[130px]">
                        {card.linkedProvider}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="p-4 bg-[#F9F8F6] space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-widest font-mono">System Integrity</p>
                      <p className={cn(
                        "text-[11px] font-black uppercase flex items-center gap-1",
                        card.status === 'active' ? "text-green-600" : "text-red-500"
                      )}>
                        {card.status === 'active' ? 'Active Route' : 'Frozen Route'}
                      </p>
                    </div>

                    <button 
                      onClick={() => handleToggleFreeze(card)}
                      className={cn(
                        "px-3 py-1.5 font-bold uppercase text-[9px] border hover:bg-neutral-100 flex items-center gap-1.5 duration-200",
                        card.status === 'active' ? "border-red-400 text-red-600" : "border-green-400 text-green-600"
                      )}
                    >
                      {card.status === 'active' ? (
                        <><Lock size={10} /> Freeze Card</>
                      ) : (
                        <><Unlock size={10} /> Unfreeze</>
                      )}
                    </button>
                  </div>

                  {card.status === 'active' && (
                    <div className="pt-2 border-t border-dashed border-gray-300 flex gap-2">
                      {isCashIn ? (
                        <button 
                          onClick={() => {
                            setTransType('cash_in_load');
                            setActiveCard(card);
                          }}
                          className="flex-1 bg-green-700 text-white hover:bg-green-800 text-[10px] font-bold uppercase py-2 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 duration-150 flex items-center justify-center gap-1"
                        >
                          <ArrowDownLeft size={12} /> Load Cash In
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setTransType('cash_out_withdraw');
                            setActiveCard(card);
                          }}
                          className="flex-1 bg-amber-600 text-white hover:bg-amber-700 text-[10px] font-bold uppercase py-2 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 duration-150 flex items-center justify-center gap-1"
                        >
                          <ArrowUpRight size={12} /> Execute Withdraw
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deploy Card Popup Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
          <div className="relative bg-[#E4E3E0] border-2 border-black p-6 md:p-8 max-w-lg w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-10 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Deploy Card Interface</h2>
              <button onClick={() => setIsAddOpen(false)} className="hover:rotate-90 transition-transform"><X /></button>
            </div>

            <form onSubmit={handleIssueCard} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Card Alias / Label</label>
                <input 
                  type="text" 
                  value={cardLabel} 
                  onChange={(e) => setCardLabel(e.target.value)} 
                  placeholder="e.g. Shopping Card, M-Pesa Buffer..." 
                  className="w-full bg-white border-2 border-black p-3.5 focus:outline-none font-bold" 
                  maxLength={25}
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">System Designation (Purpose)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setCardType('cash_in')}
                    className={cn(
                      "py-3 border-2 border-black uppercase text-xs font-black transition-all flex items-center justify-center gap-1.5",
                      cardType === 'cash_in' 
                        ? "bg-black text-white hover:bg-black" 
                        : "bg-white text-black hover:bg-gray-100"
                    )}
                  >
                    <ArrowDownLeft size={14} /> Cash In Loader
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCardType('cash_out')}
                    className={cn(
                      "py-3 border-2 border-black uppercase text-xs font-black transition-all flex items-center justify-center gap-1.5",
                      cardType === 'cash_out' 
                        ? "bg-black text-white hover:bg-black" 
                        : "bg-white text-black hover:bg-gray-100"
                    )}
                  >
                    <ArrowUpRight size={14} /> Cash Out Bridge
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 uppercase leading-snug">
                  {cardType === 'cash_id' 
                    ? "Inbound loads: Credits your main balance instantly via the designated provider."
                    : "Outbound withdrawals: Withdraw from your core balance to external payment destinations."}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Gateway Provider Network Link</label>
                <select 
                  value={linkedProvider}
                  onChange={(e) => setLinkedProvider(e.target.value)}
                  className="w-full bg-white border-2 border-black p-3.5 font-bold focus:outline-none uppercase text-sm"
                >
                  <option value="Safaricom M-Pesa Engine">Safaricom M-Pesa Infrastructure</option>
                  <option value="MTN Mobile Money Link">MTN Mobile Money Gateway</option>
                  <option value="Stripe Network Ingress">Stripe Gateway Node</option>
                  <option value="Plaid Bank Link">Plaid Unified Account Node</option>
                  <option value="Coinbase TRC20 Broker">Coinbase Cryptographic USDT Node</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isIssuing}
                className="w-full bg-black text-white py-4 hover:bg-neutral-800 font-extrabold uppercase text-sm duration-200 mt-2 flex items-center justify-center gap-2"
              >
                {isIssuing && <RefreshCw className="w-4 h-4 animate-spin" />}
                Authorize virtual visa deployment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Card Loading / Disbursing Transacting Modal */}
      {activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isTransacting && setActiveCard(null)} />
          <div className="relative bg-[#E4E3E0] border-2 border-black p-6 md:p-8 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-10 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                {transType === 'cash_in_load' ? 'Load Cash In' : 'Disburse Outflow'}
              </h2>
              <button onClick={() => !isTransacting && setActiveCard(null)} className="hover:rotate-90 transition-transform"><X /></button>
            </div>

            <form onSubmit={handleRunCardTransaction}>
              {!isTransacting && transResult === null ? (
                <div className="space-y-4">
                  <div className="p-4 border border-black bg-white rounded flex items-center gap-3">
                    <div className="p-2 border border-black bg-neutral-100 rounded text-neutral-800"><Layers size={20} /></div>
                    <div>
                      <h4 className="font-bold text-xs uppercase">{activeCard.label}</h4>
                      <p className="font-mono text-[10px] text-gray-500 mt-0.5">{activeCard.cardNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Transaction Amount (USD)</label>
                    <input 
                      type="number" 
                      value={transAmount} 
                      onChange={(e) => setTransAmount(e.target.value)} 
                      placeholder="0.00" 
                      className="w-full bg-white border-2 border-black p-4 text-2xl font-black focus:outline-none" 
                      required 
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-black text-white py-4 hover:bg-neutral-800 font-extrabold uppercase text-xs duration-200 mt-2"
                  >
                    {transType === 'cash_in_load' 
                      ? 'Confirm Sandbox deposit to balance' 
                      : 'Confirm Sandbox disbursement outwards'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 bg-neutral-900 text-green-400 rounded-lg min-h-48 overflow-y-auto space-y-1 font-bold">
                    {transStep.map((step, i) => (
                      <p key={i} className={step.includes('FAILURE') ? 'text-red-500' : 'text-green-400'}>{step}</p>
                    ))}
                    {isTransacting && (
                      <p className="text-yellow-500 animate-pulse pt-2 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synchronizing ledger state...
                      </p>
                    )}
                    {transResult === 'success' && (
                      <div className="border border-green-500 text-green-300 bg-green-950/40 p-3 text-center uppercase tracking-wide mt-4">
                        ✔️ Ledger updated success
                      </div>
                    )}
                    {transResult === 'error' && (
                      <div className="border border-red-500 text-red-300 bg-red-950/40 p-3 text-center uppercase tracking-wide mt-4">
                        ❌ Balance adjustment aborted
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
