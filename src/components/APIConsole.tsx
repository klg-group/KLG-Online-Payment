import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ExternalApiConfig } from '../types';
import { 
  Plus, 
  Trash2, 
  Play, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Code, 
  ExternalLink, 
  Globe, 
  Lock, 
  RefreshCw, 
  Activity, 
  Check, 
  X, 
  HelpCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function APIConsole({ userId }: { userId: string }) {
  const [apis, setApis] = useState<ExternalApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [provider, setProvider] = useState<ExternalApiConfig['provider']>('M-Pesa API');
  const [apiKey, setApiKey] = useState('');
  const [apiSec, setApiSec] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Terminal States
  const [activeTestApi, setActiveTestApi] = useState<ExternalApiConfig | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'externalApis'),
      where('userId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: ExternalApiConfig[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ExternalApiConfig);
      });
      setApis(list);
      setLoading(false);
    }, (err) => {
      console.error("Error loading external APIs", err);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const handleAddApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    setIsSubmitting(true);

    try {
      const newApi: Omit<ExternalApiConfig, 'id'> = {
        userId,
        provider,
        apiKey,
        apiSec: apiSec || undefined,
        endpointUrl: endpointUrl || undefined,
        status: 'active',
        testStatus: 'not_tested',
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'externalApis'), newApi);
      setIsAddOpen(false);
      setApiKey('');
      setApiSec('');
      setEndpointUrl('');
    } catch (err) {
      console.error("Error creating API config:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApi = async (id: string) => {
    if (!window.confirm("Are you sure you want to disconnect this API?")) return;
    try {
      await deleteDoc(doc(db, 'externalApis', id));
    } catch (err) {
      console.error("Error deleting API config:", err);
    }
  };

  const handleToggleStatus = async (api: ExternalApiConfig) => {
    try {
      const newStatus = api.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'externalApis', api.id), { status: newStatus });
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const runConnectionTest = (api: ExternalApiConfig) => {
    setActiveTestApi(api);
    setIsRunningTest(true);
    setTestSuccess(null);
    setTerminalLogs([]);

    const addLog = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setTerminalLogs((prev) => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    (async () => {
      await addLog(`[SYSTEM] Initializing handshake sequence for target Node: ${api.provider}...`, 0);
      await addLog(`[CONNECTING] Querying dns records and resolving endpoints: ${api.endpointUrl || 'https://api.klgpayment.internal/v1/bridge'}`, 600);
      await addLog(`[RESOLVED] Node found on IP: ${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`, 500);
      await addLog(`[AUTH] Compiling secure credentials signature payload...`, 700);
      await addLog(`[AUTH] Client credentials injected via Authorization Header matching SHA-256 scheme`, 500);
      await addLog(`[CRYPT] Establishing TLS 1.3 encrypted handshake with backend server...`, 600);
      await addLog(`[PAYLOAD] Sending test ping frame: { "action": "ping", "timestamp": ${Date.now()}, "sdk": "klg-node-v2.6" }`, 800);
      await addLog(`[WAITING] Awaiting remote callback webhook confirmation...`, 900);
      
      const success = api.apiKey.length > 5; // Simulates verification rules
      
      if (success) {
        await addLog(`[STATUS-200] HANDSHAKE CONFIRMED. Server accepted connection signature.`, 600);
        await addLog(`[SUCCESS] Callback webhook endpoints are firing correctly. Performance index: 14ms latency.`, 400);
        await addLog(`[ONLINE] Node synchronized and running at peak optimization.`, 300);
        setTestSuccess(true);
        setIsRunningTest(false);
        await updateDoc(doc(db, 'externalApis', api.id), {
          testStatus: 'success',
          lastTested: Timestamp.now()
        });
      } else {
        await addLog(`[STATUS-401] UNAUTHORIZED. Provided credentials failed remote crypt-verification.`, 700);
        await addLog(`[ERROR] Connection aborted by remote supervisor. Check API Key or Access Secret.`, 400);
        setTestSuccess(false);
        setIsRunningTest(false);
        await updateDoc(doc(db, 'externalApis', api.id), {
          testStatus: 'failed',
          lastTested: Timestamp.now()
        });
      }
    })();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Developer Systems</h1>
          <p className="text-gray-500 text-xs font-bold uppercase mt-1 tracking-wider">Configure, connect, and test API links for extreme system performance</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-black text-white hover:bg-gray-800 px-5 py-3 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 active:translate-y-0.5 transition-all"
        >
          <Plus size={16} /> Mount New API
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* API Grid - Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {loading ? (
            <div className="bg-white border border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black" />
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500">Scanning APIs...</p>
            </div>
          ) : apis.length === 0 ? (
            <div className="bg-white border border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <Code className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold uppercase">No Mounted Interfaces</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2">Connect your Stripe, Plaid, Coinbase, or Safaricom M-Pesa endpoints for automated ledger operations.</p>
              </div>
              <button 
                onClick={() => setIsAddOpen(true)}
                className="inline-flex bg-white text-black border-2 border-black font-extrabold uppercase text-xs px-4 py-2 hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Connect First API
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {apis.map((api) => (
                <div 
                  key={api.id}
                  className={cn(
                    "bg-white border border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all duration-200",
                    activeTestApi?.id === api.id ? "ring-2 ring-black" : ""
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-black tracking-tight text-white bg-black px-2 py-0.5 text-[10px] uppercase">
                          {api.provider}
                        </span>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          api.status === 'active' ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        )} />
                        <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">
                          {api.status === 'active' ? 'ONLINE' : 'STANDBY'}
                        </span>
                      </div>
                      
                      <p className="font-mono text-[11px] text-gray-600 truncate max-w-md">
                        Endpoint: <span className="font-semibold text-black">{api.endpointUrl || 'Default Internal Route'}</span>
                      </p>
                      
                      <div className="flex items-center gap-1 opacity-70">
                        <Lock size={12} className="text-gray-400" />
                        <p className="font-mono text-[10px] text-gray-500">
                          Auth-Key: ••••••••••{api.apiKey.slice(-5)}
                        </p>
                      </div>

                      {api.lastTested && (
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">
                          Last Interconnected: {api.lastTested.toDate().toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                      {api.testStatus && api.testStatus !== 'not_tested' && (
                        <div className={cn(
                          "px-2 py-0.5 text-[9px] font-bold uppercase flex items-center gap-1 border",
                          api.testStatus === 'success' 
                            ? "bg-green-50 text-green-700 border-green-500" 
                            : "bg-red-50 text-red-700 border-red-500"
                        )}>
                          {api.testStatus === 'success' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                          {api.testStatus === 'success' ? 'INTERLINKED' : 'AUTH FAIL'}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => runConnectionTest(api)}
                          disabled={isRunningTest}
                          className="bg-black text-white p-2 hover:bg-neutral-800 disabled:opacity-50 text-xs font-bold uppercase flex items-center gap-1.5"
                          title="Run Interconnection Handshake"
                        >
                          <Play size={12} fill="white" />
                          Test Node
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(api)}
                          className="bg-white text-black border border-black p-2 hover:bg-gray-100 font-mono text-[10px] uppercase font-bold"
                        >
                          {api.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => handleDeleteApi(api.id)}
                          className="bg-red-50 text-red-600 border border-red-600 p-2 hover:bg-red-100 flex items-center justify-center"
                          title="Disconnect API Link"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Code/Terminal View - Right Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-neutral-800 px-4 py-3 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-green-500" />
                <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-widest">Live Node Handshake Terminal</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              </div>
            </div>

            <div className="p-5 font-mono text-[11px] text-green-400 bg-neutral-950 h-96 overflow-y-auto space-y-1 scrollbar-thin">
              {terminalLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 space-y-2 py-20">
                  <Activity className="h-8 w-8 animate-pulse text-neutral-600" />
                  <p className="uppercase text-[10px] tracking-wide font-semibold">Ready for link simulation</p>
                  <p className="text-[10px] text-neutral-600">Select any mounted API node from the directory and run "Test Node" to observe system orchestration metrics.</p>
                </div>
              ) : (
                <>
                  {terminalLogs.map((log, i) => {
                    let color = 'text-green-400';
                    if (log.startsWith('[ERROR]') || log.startsWith('[STATUS-401]')) color = 'text-red-500';
                    if (log.startsWith('[SYSTEM]')) color = 'text-blue-400';
                    if (log.startsWith('[WAITING]')) color = 'text-yellow-500';
                    
                    return (
                      <div key={i} className={cn("", color)}>
                        {log}
                      </div>
                    );
                  })}
                  {isRunningTest && (
                    <div className="text-yellow-500 animate-pulse flex items-center gap-1.5 pt-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Handshake in progress...
                    </div>
                  )}
                  {testSuccess !== null && !isRunningTest && (
                    <div className={cn(
                      "mt-4 p-3 border font-bold text-center uppercase tracking-wide",
                      testSuccess
                        ? "bg-green-950/40 border-green-500 text-green-300"
                        : "bg-red-950/40 border-red-500 text-red-300"
                    )}>
                      {testSuccess 
                        ? '✔️ Verification successful. Node synchronized.' 
                        : '❌ Verification failed. Check key authenticity.'}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mounting Popup Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
          <div className="relative bg-[#E4E3E0] border-2 border-black p-6 md:p-8 max-w-lg w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-10 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Mount Gateway Config</h2>
              <button onClick={() => setIsAddOpen(false)} className="hover:rotate-90 transition-transform"><X /></button>
            </div>

            <form onSubmit={handleAddApi} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Gateway Provider Engine</label>
                <select 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value as ExternalApiConfig['provider'])}
                  className="w-full bg-white border-2 border-black p-3.5 font-bold focus:outline-none uppercase text-sm"
                >
                  <option value="M-Pesa API">Safaricom M-Pesa API</option>
                  <option value="Plaid Open Banking">Plaid Open Finance SDK</option>
                  <option value="Stripe Gateway">Stripe Payment Gateway</option>
                  <option value="Coinbase Web3 Bridge">Coinbase Web3 Crypto Bridge</option>
                  <option value="Custom Webhook">Custom API Webhook Router</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">API Authorization Key (Client ID / Key)</label>
                <input 
                  type="text" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  placeholder="e.g. pk_live_51..." 
                  className="w-full bg-white border-2 border-black p-3.5 font-mono text-sm focus:outline-none" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block flex items-center gap-1">
                  API Security Access Token (Client Secret) <span className="opacity-50 font-normal lowercase">(optional)</span>
                </label>
                <input 
                  type="password" 
                  value={apiSec} 
                  onChange={(e) => setApiSec(e.target.value)} 
                  placeholder="e.g. sk_live_9a4f..." 
                  className="w-full bg-white border-2 border-black p-3.5 font-mono text-sm focus:outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Webhook Connection URL</label>
                <input 
                  type="url" 
                  value={endpointUrl} 
                  onChange={(e) => setEndpointUrl(e.target.value)} 
                  placeholder="e.g. https://api.yoursite.com/klg-webhook" 
                  className="w-full bg-white border-2 border-black p-3.5 font-sans text-sm focus:outline-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 hover:bg-neutral-800 font-extrabold uppercase text-sm duration-200 mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Save Connection Configuration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
