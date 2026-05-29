import React, { Component, useState, useEffect, useMemo } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation,
  Navigate
} from 'react-router-dom';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  Timestamp,
  getDocFromServer,
  limit,
  getDocs
} from 'firebase/firestore';
import { auth, db } from './firebase';
import APIConsole from './components/APIConsole';
import VirtualCardsTab from './components/VirtualCardsTab';
import { 
  UserProfile, 
  Transaction, 
  VirtualCard, 
  TransactionType, 
  TransactionMethod 
} from './types';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  History, 
  Settings as SettingsIcon, 
  LogOut, 
  ShieldCheck, 
  Plus, 
  Mail,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Menu,
  X,
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  Search,
  Filter,
  Eye,
  Check,
  Ban,
  Shield,
  HelpCircle,
  Code,
  Lock,
  RefreshCw,
  Fingerprint,
  Globe,
  Smartphone,
  Zap,
  MoreHorizontal,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { ethers } from 'ethers';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- Main App ---

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, 'users', u.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email || '',
              displayName: u.email === 'klgc.hq.2016@gmail.com' ? 'Super Admin' : (u.displayName || ''),
              role: u.email === 'klgc.hq.2016@gmail.com' ? 'admin' : 'user',
              balance: u.email === 'klgc.hq.2016@gmail.com' ? 1000000 : 1000,
              kycStatus: u.email === 'klgc.hq.2016@gmail.com' ? 'verified' : 'not_started',
              createdAt: Timestamp.now()
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
            try {
              localStorage.setItem(`klgc_profile_${u.uid}`, JSON.stringify(newProfile));
            } catch (_) {}
          } else {
            const data = snap.data() as UserProfile;
            let updated = false;
            if (u.email === 'klgc.hq.2016@gmail.com') {
              if (data.role !== 'admin') {
                data.role = 'admin';
                updated = true;
              }
              if (data.kycStatus !== 'verified') {
                data.kycStatus = 'verified';
                updated = true;
              }
            }
            if (updated) {
              await updateDoc(userRef, { role: 'admin', kycStatus: 'verified' });
            }
            setProfile(data);
            try {
              localStorage.setItem(`klgc_profile_${u.uid}`, JSON.stringify(data));
            } catch (_) {}
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
          // Load from localStorage cache fallback!
          const cachedJson = localStorage.getItem(`klgc_profile_${u.uid}`);
          if (cachedJson) {
            try {
              const data = JSON.parse(cachedJson);
              if (u.email === 'klgc.hq.2016@gmail.com') {
                data.role = 'admin';
                data.kycStatus = 'verified';
              }
              setProfile(data);
            } catch (_) {}
          } else {
            // Make a fallback default profile so it doesn't crash
            setProfile({
              uid: u.uid,
              email: u.email || '',
              displayName: u.email === 'klgc.hq.2016@gmail.com' ? 'Super Admin' : (u.displayName || ''),
              role: u.email === 'klgc.hq.2016@gmail.com' ? 'admin' : 'user',
              balance: u.email === 'klgc.hq.2016@gmail.com' ? 1000000 : 1000,
              kycStatus: u.email === 'klgc.hq.2016@gmail.com' ? 'verified' : 'not_started',
              createdAt: Timestamp.now()
            });
          }
        }
        setIsAuthReady(true);
        setLoading(false);
      } else {
        setUser(null);
        setProfile(null);
        
        // Auto sign in as super admin if they haven't explicitly logged out!
        const loggedOut = localStorage.getItem('klgc_logged_out');
        if (loggedOut !== 'true') {
          try {
            await signInWithEmailAndPassword(auth, 'klgc.hq.2016@gmail.com', 'Admin@1234567');
          } catch (loginErr: any) {
            // If the admin user doesn't exist yet, automatically register them!
            const isNoUser = loginErr.code === 'auth/user-not-found' || 
                             loginErr.message?.includes('user-not-found') || 
                             loginErr.message?.includes('invalid-credential') ||
                             loginErr.code === 'auth/invalid-credential';
            if (isNoUser) {
              try {
                await createUserWithEmailAndPassword(auth, 'klgc.hq.2016@gmail.com', 'Admin@1234567');
              } catch (regErr) {
                console.warn("Auto registration failed: ", regErr);
                setIsAuthReady(true);
                setLoading(false);
              }
            } else {
              console.warn("Auto sign-in failed: ", loginErr);
              setIsAuthReady(true);
              setLoading(false);
            }
          }
        } else {
          setIsAuthReady(true);
          setLoading(false);
        }
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0]">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginView /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout user={user} profile={profile}><DashboardView user={user} profile={profile} /></Layout> : <Navigate to="/login" />} />
        <Route path="/cards" element={user ? <Layout user={user} profile={profile}><VirtualCardsTab userId={user.uid} profile={profile} /></Layout> : <Navigate to="/login" />} />
        <Route path="/transactions" element={user ? <Layout user={user} profile={profile}><TransactionsView user={user} profile={profile} /></Layout> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Layout user={user} profile={profile}><SettingsView user={user} profile={profile} /></Layout> : <Navigate to="/login" />} />
        <Route path="/support" element={user ? <Layout user={user} profile={profile}><SupportView /></Layout> : <Navigate to="/login" />} />
        <Route path="/api" element={user ? <Layout user={user} profile={profile}><APIConsole userId={user.uid} /></Layout> : <Navigate to="/login" />} />
        <Route path="/terms" element={<TermsView />} />
        <Route path="/privacy" element={<PrivacyView />} />
        <Route path="/exchange" element={user ? <Layout user={user} profile={profile}><ExchangeView user={user} profile={profile} /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin" element={user && profile?.role === 'admin' ? <Layout user={user} profile={profile}><AdminView /></Layout> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

const EAC_COUNTRIES = [
  { id: 'ss', name: 'South Sudan', code: '+211' },
  { id: 'sd', name: 'Sudan', code: '+249' },
  { id: 'cd', name: 'DR Congo', code: '+243' },
  { id: 'ug', name: 'Uganda', code: '+256' },
  { id: 'ke', name: 'Kenya', code: '+254' },
  { id: 'tz', name: 'Tanzania', code: '+255' },
  { id: 'so', name: 'Somalia', code: '+252' },
  { id: 'rw', name: 'Rwanda', code: '+250' },
  { id: 'bi', name: 'Burundi', code: '+257' },
  { id: 'other', name: 'Other Countries', code: '' }
];

function LoginView() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Phone Inputs
  const [selectedCountryId, setSelectedCountryId] = useState('ss');
  const [customCountryCode, setCustomCountryCode] = useState('+');
  const [customCountryName, setCustomCountryName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (authMethod === 'email') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your email address and password.');
        }
        if (isSignUp) {
          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters.');
          }
          const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const userUid = userCred.user.uid;
          const profileData: UserProfile = {
            uid: userUid,
            email: email.trim(),
            displayName: email.trim() === 'klgc.hq.2016@gmail.com' ? 'Super Admin' : (displayName.trim() || email.trim().split('@')[0]),
            role: email.trim() === 'klgc.hq.2016@gmail.com' ? 'admin' : 'user',
            balance: email.trim() === 'klgc.hq.2016@gmail.com' ? 1000000 : 1000,
            kycStatus: email.trim() === 'klgc.hq.2016@gmail.com' ? 'verified' : 'not_started',
            createdAt: Timestamp.now()
          };
          await setDoc(doc(db, 'users', userUid), profileData);
        } else {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        }
      } else {
        // Phone method
        if (!phone.trim() || !password) {
          throw new Error('Please enter both your phone number and password.');
        }
        
        let finalCode = '';
        let finalCountryName = '';
        
        if (selectedCountryId === 'other') {
          if (!customCountryCode.trim() || customCountryCode.trim() === '+') {
            throw new Error('Please enter a country code (e.g. +1).');
          }
          finalCode = customCountryCode.trim();
          if (!finalCode.startsWith('+')) {
            finalCode = '+' + finalCode;
          }
          finalCountryName = customCountryName.trim() || 'Other Country';
        } else {
          const matched = EAC_COUNTRIES.find(c => c.id === selectedCountryId);
          finalCode = matched?.code || '';
          finalCountryName = matched?.name || '';
        }

        const cleanCode = finalCode.replace(/[^0-9]/g, '');
        const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
        
        if (!cleanPhone) {
          throw new Error('Please enter a valid phone number.');
        }
        
        const phoneEmail = `${cleanCode}${cleanPhone}@phone.klgpayments.internal`;
        
        if (isSignUp) {
          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters.');
          }
          const userCred = await createUserWithEmailAndPassword(auth, phoneEmail, password);
          const userUid = userCred.user.uid;
          const profileData: UserProfile = {
            uid: userUid,
            email: phoneEmail,
            displayName: displayName.trim() || `${finalCode} ${phone.trim()}`,
            phoneNumber: `${finalCode} ${phone.trim()}`,
            country: finalCountryName,
            role: 'user',
            balance: 1000,
            kycStatus: 'not_started',
            createdAt: Timestamp.now()
          };
          await setDoc(doc(db, 'users', userUid), profileData);
        } else {
          await signInWithEmailAndPassword(auth, phoneEmail, password);
        }
      }
      try {
        localStorage.removeItem('klgc_logged_out');
      } catch (_) {}
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let localizedMsg = err.message || String(err);
      if (localizedMsg.includes('auth/invalid-credential') || 
          localizedMsg.includes('auth/wrong-password') || 
          localizedMsg.includes('auth/user-not-found')) {
        localizedMsg = 'Invalid credentials. Please double check password or registration status.';
      } else if (localizedMsg.includes('auth/email-already-in-use')) {
        localizedMsg = 'An account with this email or phone number already exists.';
      } else if (localizedMsg.includes('auth/weak-password')) {
        localizedMsg = 'Password is too weak. Must be at least 6 characters.';
      } else if (localizedMsg.includes('auth/invalid-email')) {
        localizedMsg = 'Invalid email/phone format.';
      }
      setError(localizedMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#E4E3E0]">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full"
      >
        <div className="mb-6 text-center">
          <div className="inline-block p-4 bg-black text-white rotate-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">KLG PAYMENT</h1>
          </div>
        </div>

        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="flex border-b-2 border-black">
            <button 
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={cn(
                "flex-1 py-4 text-xs font-black uppercase tracking-wider border-r-2 border-black transition-all",
                !isSignUp ? "bg-white text-black" : "bg-gray-100 text-gray-500 hover:bg-gray-50"
              )}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={cn(
                "flex-1 py-4 text-xs font-black uppercase tracking-wider transition-all",
                isSignUp ? "bg-white text-black" : "bg-gray-100 text-gray-500 hover:bg-gray-50"
              )}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setError(null); }}
                className={cn(
                  "flex-1 py-2 text-xs font-black uppercase tracking-wider border border-black transition-all flex items-center justify-center gap-2",
                  authMethod === 'email' 
                    ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0)]" 
                    : "bg-white text-black hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                )}
              >
                <Mail size={14} /> Email Mode
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setError(null); }}
                className={cn(
                  "flex-1 py-2 text-xs font-black uppercase tracking-wider border border-black transition-all flex items-center justify-center gap-2",
                  authMethod === 'phone' 
                    ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0)]" 
                    : "bg-white text-black hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                )}
              >
                <Smartphone size={14} /> Phone Mode
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold uppercase flex items-center gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-black">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full p-3 border-2 border-black bg-white focus:outline-none focus:bg-gray-50 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            )}

            {authMethod === 'email' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-black">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 border-2 border-black bg-white focus:outline-none focus:bg-gray-50 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-black">Country Profile</label>
                  <select
                    value={selectedCountryId}
                    onChange={(e) => {
                      setSelectedCountryId(e.target.value);
                      setError(null);
                    }}
                    className="w-full p-3 border-2 border-black bg-white focus:outline-none focus:bg-gray-50 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {EAC_COUNTRIES.map((c) => (
                      <option key={c.id} value={c.id} className="font-bold">
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCountryId === 'other' && (
                  <div className="grid grid-cols-3 gap-2 animate-fadeIn">
                    <div className="col-span-1 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-black">Code</label>
                      <input 
                        type="text" 
                        value={customCountryCode}
                        onChange={(e) => setCustomCountryCode(e.target.value)}
                        placeholder="+1"
                        className="w-full p-3 border-2 border-black bg-white focus:outline-none focus:bg-gray-50 font-mono font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-black">Country Name</label>
                      <input 
                        type="text" 
                        value={customCountryName}
                        onChange={(e) => setCustomCountryName(e.target.value)}
                        placeholder="e.g. Canada"
                        className="w-full p-3 border-2 border-black bg-white focus:outline-none focus:bg-gray-50 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-black">Phone Number</label>
                  <div className="flex shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {selectedCountryId !== 'other' && (
                      <span className="flex items-center justify-center px-4 border-2 border-r-0 border-black bg-gray-100 font-mono font-black text-sm select-none">
                        {EAC_COUNTRIES.find(c => c.id === selectedCountryId)?.code}
                      </span>
                    )}
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 712345678"
                      className="flex-1 p-3 border-2 border-black bg-white focus:outline-none focus:bg-gray-50 font-mono font-black text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black">Secure Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 border-2 border-black bg-white focus:outline-none focus:bg-gray-50 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                required
              />
            </div>

            <Button 
              type="submit" 
              loading={loading} 
              className="w-full py-4 uppercase font-black tracking-widest bg-black hover:bg-gray-900 text-white mt-2 ring-2 ring-black"
            >
              {isSignUp ? 'Create KLG Account' : 'Authenticate Account'}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-xs text-gray-500 uppercase tracking-widest font-mono text-center">
          Secure • Encrypted • Global
        </p>
      </motion.div>
    </div>
  );
}

function Layout({ children, user, profile }: { children: React.ReactNode; user: User; profile: UserProfile | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: CreditCard, label: 'Cards', path: '/cards' },
    { icon: History, label: 'Transactions', path: '/transactions' },
    { icon: ArrowUpRight, label: 'Exchange', path: '/exchange' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ icon: ShieldCheck, label: 'Admin', path: '/admin' });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="bg-black text-white p-1 px-2 font-black italic text-sm">KLG</Link>
            <nav className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-wider">
              {navItems.map(item => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={cn(
                    "hover:underline",
                    location.pathname === item.path ? "underline" : "opacity-50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {!navigator.onLine && (
              <div className="bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded border border-black flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                OFFLINE
              </div>
            )}
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-full">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border border-white"></span>
            </button>
            <div className="hidden sm:block text-right border-l border-black/10 pl-4 h-8 flex flex-col justify-center">
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Logged in as</p>
              <p className="text-xs font-black">
                {profile?.displayName || 
                 (user.email?.endsWith('@phone.klgpayments.internal') 
                   ? `+${user.email.split('@')[0]}` 
                   : user.email)}
              </p>
            </div>
            <Button onClick={() => {
              try {
                localStorage.setItem('klgc_logged_out', 'true');
              } catch (_) {}
              signOut(auth);
            }} variant="ghost" className="p-2">
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>
      
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed top-16 right-4 z-50 w-80">
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border-2 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold uppercase text-xs">Notifications</h4>
                <button onClick={() => setShowNotifications(false)}><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div className="p-2 bg-gray-50 border border-black/10">
                  <p className="text-[10px] font-bold text-green-600 uppercase">System</p>
                  <p className="text-xs">Welcome to KLG Payment! Your account is now active.</p>
                </div>
                <div className="p-2 bg-gray-50 border border-black/10">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Security</p>
                  <p className="text-xs">2FA is enabled via your linked Google account.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-black p-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="font-black italic text-xl">KLG ONLINE</p>
            <p className="text-[10px] font-bold uppercase opacity-50">© 2026 KLG Global Financial Services</p>
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest opacity-50">
            <Link to="/terms" className="hover:opacity-100">Terms</Link>
            <Link to="/privacy" className="hover:opacity-100">Privacy</Link>
            <Link to="/support" className="hover:opacity-100">Support</Link>
            <Link to="/api" className="hover:opacity-100">API</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardView({ user, profile }: { user: User; profile: UserProfile | null }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'deposit' | 'withdrawal' | 'transfer' | null>(null);

  // Form States
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Active Multi-Channel Tabs
  const [activeTab, setActiveTab] = useState<'Bank Transfer' | 'Mobile Money' | 'Crypto' | 'Email Transfer'>('Bank Transfer');
  
  // Tab-Specific Input Fields
  const [mobilePhone, setMobilePhone] = useState('');
  const [carrier, setCarrier] = useState('Safaricom M-Pesa');
  
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoCoin, setCryptoCoin] = useState('USDT TRC20');
  
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingCode, setRoutingCode] = useState('');
  const [accountName, setAccountName] = useState('');

  // Live Peer-to-Peer Transfer Lookup
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<UserProfile | null>(null);
  const [checkingRecipient, setCheckingRecipient] = useState(false);

  // Interactive UI logs
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);

  const chartData = useMemo(() => {
    const currentBalance = profile?.balance ?? 0;
    
    if (transactions.length === 0) {
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: format(d, 'MMM dd'),
          balance: currentBalance
        };
      });
    }

    const validTxs = transactions.slice(0, 10).filter(t => t.status !== 'failed');
    const balances: number[] = [];
    let running = currentBalance;

    for (let i = 0; i < validTxs.length; i++) {
      balances.push(running);
      const t = validTxs[i];
      if (t.type === 'deposit' || (t.type === 'transfer' && t.recipientId && t.recipientId === user.uid)) {
        running -= t.amount;
      } else {
        running += t.amount;
      }
    }
    balances.push(running);

    const chronologicalTxs = [...validTxs].reverse();
    const history = chronologicalTxs.map((t, idx) => {
      const balanceAfter = balances[validTxs.length - 1 - idx];
      return {
        date: format(t.createdAt.toDate(), 'MMM dd'),
        balance: balanceAfter
      };
    });

    if (chronologicalTxs.length > 0) {
      const oldestTxDate = chronologicalTxs[0].createdAt.toDate();
      const anchorDate = new Date(oldestTxDate);
      anchorDate.setDate(anchorDate.getDate() - 1);
      history.unshift({
        date: format(anchorDate, 'MMM dd'),
        balance: balances[balances.length - 1]
      });
    }

    return history;
  }, [profile?.balance, transactions, user.uid]);

  useEffect(() => {
    if (modalType === 'transfer') {
      setActiveTab('Email Transfer');
    } else {
      setActiveTab('Bank Transfer');
    }
  }, [modalType]);

  useEffect(() => {
    if (modalType !== 'transfer' || !recipientEmail) {
      setRecipientProfile(null);
      setRecipientError(null);
      return;
    }
    if (recipientEmail.trim() === user.email) {
      setRecipientError("You are not allowed to transfer reserves to your own email.");
      setRecipientProfile(null);
      return;
    }
    
    setCheckingRecipient(true);
    setRecipientError(null);
    const delay = setTimeout(async () => {
      try {
        const q = query(collection(db, 'users'), where('email', '==', recipientEmail.trim()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const matchedUser = snap.docs[0].data() as UserProfile;
          setRecipientProfile(matchedUser);
          setRecipientError(null);
        } else {
          setRecipientError("No registered KLG account matches this email.");
          setRecipientProfile(null);
        }
      } catch (e) {
        console.error("Live lookup failed", e);
      } finally {
        setCheckingRecipient(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [recipientEmail, modalType, user.email]);

  useEffect(() => {
    const transQuery = query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const transUnsub = onSnapshot(transQuery, (snap) => {
      setTransactions(snap.docs.map(d => d.data() as Transaction));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const cardsUnsub = onSnapshot(query(collection(db, 'virtualCards'), where('userId', '==', user.uid), limit(1)), (snap) => {
      setCards(snap.docs.map(d => d.data() as VirtualCard));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'virtualCards'));

    return () => {
      transUnsub();
      cardsUnsub();
    };
  }, [user]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setMessage({ type: 'error', text: 'Specify a valid numeric amount to transact.' });
      return;
    }

    if ((modalType === 'withdrawal' || modalType === 'transfer') && val > profile.balance) {
      setMessage({ type: 'error', text: 'Insufficient KLG ledger reserves.' });
      return;
    }

    if (modalType === 'transfer' && !recipientProfile) {
      setMessage({ type: 'error', text: 'Select a verified recipient before transferring resource.' });
      return;
    }

    setSubmitting(true);
    setTelemetryLogs([]);
    setMessage(null);

    const runLogs = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setTelemetryLogs((prev) => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    try {
      await runLogs(`[1/4] Connecting to payment gateway pipeline through channel: ${activeTab}...`, 0);
      
      const transId = Math.random().toString(36).substring(2, 15);
      
      if (modalType === 'transfer' && recipientProfile) {
        await runLogs(`[2/4] Awaiting multi-sig authorization handshake of account ledger nodes...`, 600);
        await runLogs(`[3/4] Booking dual ledgers: Sender - $${val} / Recipient + $${val}`, 500);

        // Deduct from current user
        await updateDoc(doc(db, 'users', user.uid), { balance: profile.balance - val });
        // Add to recipient
        await updateDoc(doc(db, 'users', recipientProfile.uid), { balance: recipientProfile.balance + val });

        // Record for sender
        const outTrans: Transaction = {
          id: transId,
          userId: user.uid,
          amount: val,
          type: 'transfer',
          method: 'Bank Transfer',
          status: 'completed',
          description: `Direct transfer to ${recipientEmail}`,
          recipientId: recipientProfile.uid,
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'transactions'), outTrans);

        // Record for receiver
        const inTransId = Math.random().toString(36).substring(2, 15);
        const inTrans: Transaction = {
          id: inTransId,
          userId: recipientProfile.uid,
          amount: val,
          type: 'deposit',
          method: 'Bank Transfer',
          status: 'completed',
          description: `Received direct transfer from ${profile.displayName || profile.email}`,
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'transactions'), inTrans);

      } else if (modalType === 'deposit') {
        await runLogs(`[2/4] Running connection check for inbound funding link...`, 600);
        await runLogs(`[3/4] Depositing $${val} via KLG Ingress Channel: ${activeTab}`, 500);

        // Update balance
        const newBalance = profile.balance + val;
        await updateDoc(doc(db, 'users', user.uid), { balance: newBalance });

        // Record transact
        const desc = activeTab === 'Mobile Money' ? `Deposit via ${carrier} (${mobilePhone})` : activeTab === 'Crypto' ? `Deposit via crypto (${cryptoCoin})` : `Direct Bank Wire Deposit (${bankName})`;
        const newTrans: Transaction = {
          id: transId,
          userId: user.uid,
          amount: val,
          type: 'deposit',
          method: activeTab === 'Crypto' ? 'Crypto' : activeTab === 'Mobile Money' ? 'Mobile Money' : 'Bank Transfer',
          status: 'completed',
          description: desc,
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'transactions'), newTrans);

      } else { // withdrawal
        await runLogs(`[2/4] Testing connection metrics for remote outbound node...`, 700);
        await runLogs(`[3/4] Reserving $${val} for outbound transmission to: ${activeTab}`, 600);

        // Update balance
        const newBalance = profile.balance - val;
        await updateDoc(doc(db, 'users', user.uid), { balance: newBalance });

        // Record transact
        const desc = activeTab === 'Mobile Money' ? `Withdraw to ${carrier} (${mobilePhone})` : activeTab === 'Crypto' ? `Withdraw to Chain Address (${cryptoAddress.slice(0, 10)}...)` : `Withdraw to Bank Account (${accountNumber.slice(-4)})`;
        const newTrans: Transaction = {
          id: transId,
          userId: user.uid,
          amount: val,
          type: 'withdrawal',
          method: activeTab === 'Crypto' ? 'Crypto' : activeTab === 'Mobile Money' ? 'Mobile Money' : 'Bank Transfer',
          status: 'pending',
          description: desc,
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'transactions'), newTrans);
      }

      await runLogs(`[4/4] Ledger system synchronized. Broadcast success!`, 500);
      setMessage({ type: 'success', text: modalType === 'deposit' || modalType === 'transfer' ? 'Transaction successful!' : 'Outflow requested. Submitted for administrator verification.' });
      
      setTimeout(() => {
        setIsModalOpen(false);
        setAmount('');
        setRecipientEmail('');
        setMobilePhone('');
        setCryptoAddress('');
        setAccountNumber('');
        setTelemetryLogs([]);
      }, 2000);

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Network synchronization error.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-8">
        <Card className="bg-black text-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
          <p className="col-header text-white/50 mb-2">Available Balance</p>
          <h2 className="text-5xl font-black tracking-tighter mb-8">
            ${(profile?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => { setModalType('deposit'); setIsModalOpen(true); }} variant="secondary" className="bg-white text-black hover:bg-gray-200">
              <ArrowDownLeft size={16} /> Deposit
            </Button>
            <Button onClick={() => { setModalType('withdrawal'); setIsModalOpen(true); }} variant="secondary" className="bg-white text-black hover:bg-gray-200">
              <ArrowUpRight size={16} /> Withdraw
            </Button>
          </div>
          <Button onClick={() => { setModalType('transfer'); setIsModalOpen(true); }} variant="secondary" className="w-full mt-2 bg-white text-black hover:bg-gray-200">
            <Send size={16} /> Send Money
          </Button>
        </Card>

        {profile?.kycStatus !== 'verified' && (
          <Card className="bg-orange-50 border-orange-200 border-2">
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="font-bold text-orange-900">Complete KYC</h3>
                <p className="text-sm text-orange-800 mb-4">Unlock higher limits and all payment methods.</p>
                <Button onClick={() => navigate('/settings')} className="bg-orange-600 hover:bg-orange-700 text-white border-none">
                  Verify Identity
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card title="Quick Card Access">
          {cards.length > 0 ? (
            <div className="bg-gradient-to-br from-gray-900 to-black text-white p-4 rounded-lg shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-20"><CreditCard size={48} /></div>
              <p className="text-[10px] font-mono mb-4 uppercase tracking-widest">KLG Virtual Platinum</p>
              <p className="text-lg font-mono mb-4 tracking-[0.2em]">{cards[0].cardNumber}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] uppercase opacity-50">Expiry</p>
                  <p className="text-xs font-mono">{cards[0].expiry}</p>
                </div>
                <Link to="/cards" className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold hover:bg-white/30 transition-colors">VIEW ALL</Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500 mb-4">No active cards</p>
              <Button onClick={() => navigate('/cards')} variant="outline" className="text-xs w-full">Issue New Card</Button>
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-8">
        <Card title="Balance Performance">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Balance']} />
                <Area type="monotone" dataKey="balance" stroke="#000" fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <History size={20} /> Recent Activity
            </h2>
            <Link to="/transactions" className="text-[10px] font-bold hover:underline">VIEW ALL HISTORY</Link>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-4 col-header px-4 mb-2">
              <div>Date</div>
              <div>Description</div>
              <div>Status</div>
              <div className="text-right">Amount</div>
            </div>
            {transactions.map(t => (
              <div key={t.id} className="data-row grid-cols-4 items-center">
                <div className="data-value text-[11px]">{t.createdAt.toDate().toLocaleDateString()}</div>
                <div className="text-xs font-bold truncate pr-4">{t.description}</div>
                <div className={cn(
                  "text-[10px] font-bold uppercase",
                  t.status === 'completed' ? 'text-green-600' : t.status === 'pending' ? 'text-orange-500' : 'text-red-600'
                )}>{t.status}</div>
                <div className={cn("data-value text-right font-bold", t.type === 'deposit' ? 'text-green-600' : 'text-red-600')}>
                  {t.type === 'deposit' ? '+' : '-'}${t.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { 
          if (!submitting) {
            setIsModalOpen(false); 
            setMessage(null); 
            setRecipientEmail('');
          }
        }} 
        title={`${modalType} balance`}
      >
        <form onSubmit={handleTransaction} className="space-y-5">
          {message && (
            <div className={cn(
              "p-4 border-2 flex items-center gap-2 font-bold text-xs uppercase",
              message.type === 'success' ? "bg-green-50 border-green-600 text-green-600" : "bg-red-50 border-red-600 text-red-600"
            )}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {/* Core Amount Input */}
          {!submitting && (
            <div className="space-y-1 font-sans">
              <label className="text-[10px] font-bold uppercase text-gray-400 font-sans tracking-widest block">Transfer Amount (USD)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00" 
                className="w-full bg-white border-2 border-black p-4 text-3xl font-black focus:outline-none" 
                required 
              />
            </div>
          )}

          {/* Interactive Multi-Channel Tabs */}
          {!submitting && modalType !== 'transfer' && (
            <div className="space-y-2 font-sans">
              <p className="text-[10px] font-bold uppercase text-gray-400 font-sans tracking-widest">Gateway Access Channel</p>
              <div className="grid grid-cols-3 border-2 border-black divide-x-2 divide-black">
                {(['Bank Transfer', 'Mobile Money', 'Crypto'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "py-2.5 text-[10px] uppercase font-black tracking-wider transition-all",
                      activeTab === tab 
                        ? "bg-black text-white" 
                        : "bg-white text-black hover:bg-gray-100"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Content Columns based on Channel Selection */}
          {!submitting && (
            <div className="p-4 border border-black bg-white space-y-3 font-sans">
              {/* 1. BANK TAB INPUTS */}
              {activeTab === 'Bank Transfer' && modalType !== 'transfer' && (
                <div className="space-y-3">
                  {modalType === 'deposit' ? (
                    <div className="p-3 bg-neutral-900 text-white font-mono text-[10px] leading-relaxed space-y-1 select-all border border-black">
                      <p className="text-yellow-400 font-bold uppercase">WIRE INSTRUCTIONS (KLG CORP ACCOUNT)</p>
                      <p>Bank Name: JPMorgan Chase Bank, NY</p>
                      <p>Swift/BIC: KLGUS33XXX</p>
                      <p>IBAN: US89 0001 2299 8834 52</p>
                      <p>Ref Memo: {user.uid.slice(0, 8)}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-gray-400">Destination Bank Name</label>
                          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Chase" className="w-full p-2 border border-black font-semibold text-xs" required />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-gray-400">Account Holder Name</label>
                          <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Jane Doe" className="w-full p-2 border border-black font-semibold text-xs" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-gray-400">Account Number / IBAN</label>
                          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="123456789" className="w-full p-2 border border-black text-xs" required />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-gray-400">Routing Code (ABA/Swift)</label>
                          <input type="text" value={routingCode} onChange={(e) => setRoutingCode(e.target.value)} placeholder="021000021" className="w-full p-2 border border-black text-xs" required />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. MOBILE MONEY TAB INPUTS */}
              {activeTab === 'Mobile Money' && modalType !== 'transfer' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-gray-400">Network Provider</label>
                      <select 
                        value={carrier} 
                        onChange={(e) => setCarrier(e.target.value)} 
                        className="w-full p-2 border border-black font-bold text-xs uppercase focus:outline-none"
                      >
                        <option value="Safaricom M-Pesa">Safaricom M-Pesa</option>
                        <option value="MTN Mobile Money">MTN MoMo</option>
                        <option value="Orange Cash">Orange Money</option>
                        <option value="Airtel Money">Airtel Cash</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase text-gray-400">Mobile Account / Phone No.</label>
                      <input 
                        type="text" 
                        value={mobilePhone} 
                        onChange={(e) => setMobilePhone(e.target.value)} 
                        placeholder="+254 7123..." 
                        className="w-full p-2 border border-black font-bold text-xs focus:outline-none" 
                        required 
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-normal">
                    * Interactive USSD trigger signal will fire directly to your handset. Response authentication validates automatically.
                  </p>
                </div>
              )}

              {/* 3. CRYPTOCURRENCY TAB INPUTS */}
              {activeTab === 'Crypto' && modalType !== 'transfer' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-gray-400">Select Currency Chain</label>
                      <select 
                        value={cryptoCoin} 
                        onChange={(e) => setCryptoCoin(e.target.value)} 
                        className="w-full p-2 border border-black font-bold text-xs uppercase focus:outline-none"
                      >
                        <option value="USDT TRC20">USDT (Tron Network)</option>
                        <option value="BTC Native">BTC (Bitcoin Mainnet)</option>
                        <option value="ETH ERC20">ETH (Ethereum Mainnet)</option>
                        <option value="USDC SOL">USDC (Solana Mainnet)</option>
                      </select>
                    </div>
                    {modalType === 'withdrawal' && (
                      <div>
                        <label className="text-[9px] font-bold uppercase text-gray-400">Target Blockchain Address</label>
                        <input 
                          type="text" 
                          value={cryptoAddress} 
                          onChange={(e) => setCryptoAddress(e.target.value)} 
                          placeholder="e.g. 0x51A2... or TXf8..." 
                          className="w-full p-2 border border-black text-xs font-mono focus:outline-none" 
                          required 
                        />
                      </div>
                    )}
                  </div>
                  {modalType === 'deposit' ? (
                    <div className="p-3 bg-neutral-900 text-white font-mono text-[9px] space-y-1 block border border-black select-all">
                      <p className="text-emerald-400 font-bold uppercase">SECURE BLOCKCHAIN INGEST ADDRESS</p>
                      {cryptoCoin === 'USDT TRC20' && <p>TRON (USDT): TXf8xJwP3zKLaR8uNWp6Y7qD9mXevZcA3h</p>}
                      {cryptoCoin === 'BTC Native' && <p>BTC: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfllzhwj9</p>}
                      {cryptoCoin === 'ETH ERC20' && <p>ETH: 0x71C7656EC7ab88b098defB7512FC2300171ff3E3</p>}
                      {cryptoCoin === 'USDC SOL' && <p>Solana (USDC): H8uNWp6Y7qD9mXevZcA3hTXf8xJwP3zKLaR</p>}
                      <p className="opacity-60 text-yellow-500 font-bold py-1">⚠️ SEND ONLY MATCHING NETWORK TOKENS</p>
                    </div>
                  ) : (
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-normal">
                      * Real blockchain payload broadcast will execute upon administrative ledger confirm. Check destination address carefully.
                    </p>
                  )}
                </div>
              )}

              {/* 4. EMAIL DIRECT TRANSFER INPUTS */}
              {modalType === 'transfer' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 font-mono tracking-widest block">Recipient Registered KLG Email</label>
                    <input 
                      type="email" 
                      value={recipientEmail} 
                      onChange={(e) => setRecipientEmail(e.target.value)} 
                      placeholder="e.g. user@example.com" 
                      className="w-full bg-white border-2 border-black p-3 font-semibold text-sm focus:outline-none focus:bg-gray-50 bg-white" 
                      required 
                    />
                  </div>

                  {checkingRecipient && (
                    <div className="text-[10px] font-mono text-yellow-600 font-bold uppercase animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Fetching ledger registries...
                    </div>
                  )}

                  {recipientError && (
                    <div className="p-3 border border-red-500 text-red-600 bg-red-50 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 leading-snug">
                      <AlertCircle size={12} /> {recipientError}
                    </div>
                  )}

                  {recipientProfile && (
                    <div className="p-3 border border-green-500 text-green-700 bg-green-50 text-[10px] font-extrabold uppercase tracking-wide flex justify-between items-center leading-snug">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-green-600" /> Account Verified: {recipientProfile.displayName || recipientProfile.email}
                      </span>
                      <span className="font-mono text-[9px] bg-green-200 px-1 py-0.5 text-green-800 rounded">UID FOUND</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Core Submit Button Grid & Processing Status Screen */}
          {!submitting ? (
            <Button 
              type="submit" 
              className="w-full py-4 text-xs font-semibold uppercase tracking-widest text-[#E4E3E0]"
              disabled={modalType === 'transfer' && !recipientProfile}
            >
              Authorize {modalType} Frame
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="bg-neutral-900 border border-black p-4 rounded text-green-400 font-bold font-mono text-[10px] h-36 overflow-y-auto space-y-1">
                {telemetryLogs.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
                <p className="text-yellow-500 animate-pulse pt-1 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Updating ledger registers...
                </p>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function CardsView({ user, profile }: { user: User; profile: UserProfile | null }) {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cardsUnsub = onSnapshot(query(collection(db, 'virtualCards'), where('userId', '==', user.uid)), (snap) => {
      setCards(snap.docs.map(d => d.data() as VirtualCard));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'virtualCards'));
    return cardsUnsub;
  }, [user]);

  const createVirtualCard = async () => {
    setSubmitting(true);
    try {
      const cardId = Math.random().toString(36).substring(2, 10);
      const newCard: VirtualCard = {
        id: cardId,
        userId: user.uid,
        cardNumber: `4532 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
        expiry: '12/28',
        cvv: Math.floor(100 + Math.random() * 899).toString(),
        status: 'active',
        balance: 0
      };
      await setDoc(doc(db, 'virtualCards', cardId), newCard);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'virtualCards');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCardStatus = async (card: VirtualCard) => {
    try {
      const newStatus = card.status === 'active' ? 'blocked' : 'active';
      await updateDoc(doc(db, 'virtualCards', card.id), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `virtualCards/${card.id}`);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    try {
      await updateDoc(doc(db, 'virtualCards', cardId), { status: 'blocked' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `virtualCards/${cardId}`);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Virtual Cards</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Card</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map(card => (
          <Card key={card.id} className="p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 relative">
              <div className="absolute top-0 right-0 p-4 opacity-20"><CreditCard size={64} /></div>
              <p className="text-xs font-mono mb-8 uppercase tracking-widest">KLG Virtual Platinum</p>
              <p className="text-2xl font-mono mb-8 tracking-[0.2em]">{card.cardNumber}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase opacity-50">Expiry</p>
                  <p className="text-sm font-mono">{card.expiry}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-50">CVV</p>
                  <p className="text-sm font-mono">{card.cvv}</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded font-bold italic">VISA</div>
              </div>
            </div>
              <div className="p-4 flex justify-between items-center bg-white">
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-50">Card Status</p>
                  <p className={cn("text-sm font-bold uppercase", card.status === 'active' ? 'text-green-600' : 'text-red-600')}>{card.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => toggleCardStatus(card)} variant="outline" className="text-xs">
                    {card.status === 'active' ? 'Freeze' : 'Unfreeze'}
                  </Button>
                </div>
              </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Virtual Card">
        <div className="space-y-6">
          <p className="text-sm text-gray-600">Instantly generate a virtual Visa card for secure online shopping. Cards are linked directly to your KLG balance.</p>
          <Button onClick={createVirtualCard} loading={submitting} className="w-full py-4">Generate Card Now</Button>
        </div>
      </Modal>
    </div>
  );
}

function TransactionsView({ user, profile }: { user: User; profile: UserProfile | null }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const transQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const transUnsub = onSnapshot(transQuery, (snap) => {
      setTransactions(snap.docs.map(d => d.data() as Transaction));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));
    return transUnsub;
  }, [user]);

  return (
    <div className="max-w-7xl w-full mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-8">Transaction History</h1>
      <Card>
        <div className="grid grid-cols-5 col-header px-4 mb-4">
          <div>Date</div>
          <div>Description</div>
          <div>Method</div>
          <div>Status</div>
          <div className="text-right">Amount</div>
        </div>
        {transactions.map(t => (
          <div key={t.id} className="data-row grid-cols-5 items-center">
            <div className="data-value text-xs">{t.createdAt.toDate().toLocaleString()}</div>
            <div className="text-sm font-bold">{t.description}</div>
            <div className="text-[10px] font-bold uppercase opacity-60">{t.method}</div>
            <div className={cn("text-[10px] font-bold uppercase", t.status === 'completed' ? 'text-green-600' : t.status === 'pending' ? 'text-orange-500' : 'text-red-600')}>{t.status}</div>
            <div className={cn("data-value text-right font-bold", t.type === 'deposit' ? 'text-green-600' : 'text-red-600')}>
              {t.type === 'deposit' ? '+' : '-'}${t.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SettingsView({ user, profile }: { user: User; profile: UserProfile | null }) {
  const [isVerifying, setIsVerifying] = useState(false);

  const startKYC = async () => {
    setIsVerifying(true);
    // Simulate Onfido/Sumsub verification flow
    setTimeout(async () => {
      if (profile) {
        await updateDoc(doc(db, 'users', user.uid), { kycStatus: 'verified' });
        alert("Identity verified successfully!");
      }
      setIsVerifying(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic">Account Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card title="Profile Information">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="col-header block mb-2">
                    {user.email?.endsWith('@phone.klgpayments.internal') ? 'Phone Number' : 'Email Address'}
                  </label>
                  <input 
                    type="text" 
                    value={
                      user.email?.endsWith('@phone.klgpayments.internal') 
                        ? (profile?.phoneNumber || `+${user.email.split('@')[0]}`)
                        : (user.email || '')
                    } 
                    disabled 
                    className="w-full p-3 border border-black bg-gray-50 font-mono text-sm" 
                  />
                </div>
                <div>
                  <label className="col-header block mb-2">User ID</label>
                  <input type="text" value={user.uid} disabled className="w-full p-3 border border-black bg-gray-50 font-mono text-sm" />
                </div>
              </div>
              <Button variant="secondary">Update Profile</Button>
            </div>
          </Card>

          <Card title="Security & Privacy">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-black">
                <div className="flex items-center gap-3">
                  <Lock size={20} />
                  <div>
                    <p className="font-bold">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Secure your account with MFA</p>
                  </div>
                </div>
                <Button variant="secondary" className="px-3 py-1 text-xs">Enable</Button>
              </div>
              <div className="flex items-center justify-between p-4 border border-black">
                <div className="flex items-center gap-3">
                  <Fingerprint size={20} />
                  <div>
                    <p className="font-bold">Biometric Login</p>
                    <p className="text-xs text-gray-500">Use FaceID or TouchID</p>
                  </div>
                </div>
                <Button variant="secondary" className="px-3 py-1 text-xs">Setup</Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card title="Identity Verification">
            <div className="text-center space-y-4">
              <div className={cn(
                "w-20 h-20 mx-auto rounded-full flex items-center justify-center",
                profile?.kycStatus === 'verified' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
              )}>
                {profile?.kycStatus === 'verified' ? <CheckCircle2 size={40} /> : <Shield size={40} />}
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-sm">
                  Status: {profile?.kycStatus?.replace('_', ' ') || 'Not Started'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {profile?.kycStatus === 'verified' 
                    ? "Your account is fully verified. You have access to all features."
                    : "Verify your identity to increase limits and unlock all payment methods."}
                </p>
              </div>
              {profile?.kycStatus !== 'verified' && (
                <Button onClick={startKYC} disabled={isVerifying} className="w-full">
                  {isVerifying ? "Verifying..." : "Start Verification"}
                </Button>
              )}
            </div>
          </Card>

          <Card title="Limits">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase mb-1">
                  <span>Daily Limit</span>
                  <span>$2,500 / $10,000</span>
                </div>
                <div className="w-full h-2 bg-gray-100 border border-black">
                  <div className="h-full bg-black" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase mb-1">
                  <span>Monthly Limit</span>
                  <span>$12,400 / $50,000</span>
                </div>
                <div className="w-full h-2 bg-gray-100 border border-black">
                  <div className="h-full bg-black" style={{ width: '24.8%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SupportView() {
  return (
    <div className="max-w-4xl w-full mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-8">Support Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Contact Us">
          <p className="text-sm mb-4">Need help? Our team is available 24/7 to assist you with any issues.</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-2"><Bell size={16} /></div>
              <div>
                <p className="text-[10px] font-bold uppercase opacity-50">Email Support</p>
                <p className="text-sm font-bold">support@klgpayment.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-2"><Users size={16} /></div>
              <div>
                <p className="text-[10px] font-bold uppercase opacity-50">Live Chat</p>
                <p className="text-sm font-bold">Available in-app</p>
              </div>
            </div>
          </div>
        </Card>
        <Card title="FAQs">
          <div className="space-y-4">
            <details className="group border-b border-black pb-2">
              <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                How long do withdrawals take?
                <Plus size={14} className="group-open:rotate-45 transition-transform" />
              </summary>
              <p className="text-xs mt-2 text-gray-600">Withdrawals are typically processed within 24 hours after admin approval.</p>
            </details>
            <details className="group border-b border-black pb-2">
              <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                Are virtual cards free?
                <Plus size={14} className="group-open:rotate-45 transition-transform" />
              </summary>
              <p className="text-xs mt-2 text-gray-600">Yes, KLG users can issue up to 3 virtual cards for free.</p>
            </details>
          </div>
        </Card>
      </div>
    </div>
  );
}

function APIView() {
  return (
    <div className="max-w-4xl w-full mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-8">Developer API</h1>
      <Card className="font-mono text-xs overflow-auto">
        <div className="bg-gray-900 text-green-400 p-6 rounded-lg">
          <p className="mb-4 text-white font-bold uppercase tracking-widest text-[10px]"># Authentication</p>
          <p className="mb-2">GET /api/v1/balance</p>
          <p className="mb-4 opacity-50">Authorization: Bearer YOUR_API_KEY</p>
          
          <p className="mb-4 text-white font-bold uppercase tracking-widest text-[10px]"># Response</p>
          <p className="mb-2">{"{"}</p>
          <p className="ml-4">"status": "success",</p>
          <p className="ml-4">"data": {"{"}</p>
          <p className="ml-8">"balance": 1250.50,</p>
          <p className="ml-8">"currency": "USD"</p>
          <p className="ml-4">{"}"}</p>
          <p className="mb-0">{"}"}</p>
        </div>
        <div className="mt-8 space-y-4">
          <p className="text-black font-bold uppercase tracking-widest text-[10px]">API Documentation</p>
          <p className="text-gray-600">Integrate KLG payments directly into your application using our robust REST API. Support for webhooks, recurring payments, and automated payouts.</p>
          <Button variant="outline" className="text-[10px]">Download SDK</Button>
        </div>
      </Card>
    </div>
  );
}

function TermsView() {
  return (
    <div className="min-h-screen bg-[#E4E3E0] p-8">
      <div className="max-w-3xl mx-auto bg-white border-2 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <Link to="/" className="inline-block mb-8 font-black italic text-2xl bg-black text-white px-4 py-1">KLG</Link>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-8">Terms of Service</h1>
        <div className="space-y-6 text-sm leading-relaxed">
          <p>By using KLG Payment Services, you agree to the following terms and conditions. These terms govern your access to and use of our platform.</p>
          <h3 className="font-bold uppercase tracking-widest text-xs">1. Account Eligibility</h3>
          <p>You must be at least 18 years old to create an account. You are responsible for maintaining the security of your account credentials.</p>
          <h3 className="font-bold uppercase tracking-widest text-xs">2. Financial Transactions</h3>
          <p>All deposits are final. Withdrawals and transfers are subject to administrative review and may take up to 48 hours to process.</p>
          <h3 className="font-bold uppercase tracking-widest text-xs">3. Prohibited Activities</h3>
          <p>Users are prohibited from using KLG for money laundering, fraud, or any illegal activities. Accounts found in violation will be terminated immediately.</p>
        </div>
        <div className="mt-12 pt-8 border-t border-black">
          <Link to="/" className="font-bold underline uppercase text-xs">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

function PrivacyView() {
  return (
    <div className="min-h-screen bg-[#E4E3E0] p-8">
      <div className="max-w-3xl mx-auto bg-white border-2 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <Link to="/" className="inline-block mb-8 font-black italic text-2xl bg-black text-white px-4 py-1">KLG</Link>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-sm leading-relaxed">
          <p>At KLG, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.</p>
          <h3 className="font-bold uppercase tracking-widest text-xs">1. Data Collection</h3>
          <p>We collect information you provide during account creation, including your name, email, and transaction history.</p>
          <h3 className="font-bold uppercase tracking-widest text-xs">2. Data Usage</h3>
          <p>Your data is used solely to provide financial services, process transactions, and improve our platform's security.</p>
          <h3 className="font-bold uppercase tracking-widest text-xs">3. Data Security</h3>
          <p>We use industry-standard encryption and security protocols to ensure your data remains safe and confidential.</p>
        </div>
        <div className="mt-12 pt-8 border-t border-black">
          <Link to="/" className="font-bold underline uppercase text-xs">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

function ExchangeView({ user, profile }: { user: User; profile: UserProfile | null }) {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('BTC');
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const [rates, setRates] = useState<Record<string, number>>({
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 151.4,
    'BTC': 0.000015,
    'ETH': 0.00028
  });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const fiatRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const fiatData = await fiatRes.json();
        
        const cryptoRes = await fetch('https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=BTC,ETH');
        const cryptoData = await cryptoRes.json();

        if (fiatData && fiatData.rates && cryptoData) {
          setRates({
            'USD': 1,
            'EUR': fiatData.rates.EUR || 0.92,
            'GBP': fiatData.rates.GBP || 0.79,
            'JPY': fiatData.rates.JPY || 151.4,
            'BTC': cryptoData.BTC || 0.000015,
            'ETH': cryptoData.ETH || 0.00028
          });
        }
      } catch (err) {
        console.warn("Failed to fetch live exchange rates, using fallback: ", err);
      }
    };
    fetchRates();
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      setIsConnecting(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setWalletAddress(accounts[0]);
        if (profile) {
          await updateDoc(doc(db, 'users', user.uid), { walletAddress: accounts[0] });
        }
      } catch (err) {
        console.error("Wallet connection failed", err);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet.");
    }
  };

  const handleExchange = async () => {
    if (!profile) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || val > profile.balance) return;

    const result = (val / rates[fromCurrency]) * rates[toCurrency];
    
    try {
      const transId = Math.random().toString(36).substring(2, 15);
      const newTrans: Transaction = {
        id: transId,
        userId: user.uid,
        amount: val,
        type: 'exchange',
        method: 'Crypto',
        status: 'completed',
        description: `Exchanged ${val} ${fromCurrency} to ${result.toFixed(6)} ${toCurrency}`,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'transactions'), newTrans);
      await updateDoc(doc(db, 'users', user.uid), { balance: profile.balance - val });
      
      alert(`Exchange successful! You received ${result.toFixed(6)} ${toCurrency}`);
      setAmount('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Exchange & Web3</h1>
        <Button onClick={connectWallet} disabled={isConnecting}>
          <Wallet size={16} /> {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Currency Converter">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="col-header block mb-2">From</label>
                <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="w-full p-4 border border-black font-bold">
                  {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="col-header block mb-2">To</label>
                <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="w-full p-4 border border-black font-bold">
                  {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="col-header block mb-2">Amount</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 border border-black font-bold text-2xl"
                placeholder="0.00"
              />
            </div>
            {amount && (
              <div className="p-4 bg-gray-50 border border-black border-dashed">
                <p className="text-xs uppercase font-bold text-gray-500">Estimated Result</p>
                <p className="text-2xl font-black">
                  {((parseFloat(amount) / rates[fromCurrency]) * rates[toCurrency]).toFixed(6)} {toCurrency}
                </p>
              </div>
            )}
            <Button onClick={handleExchange} className="w-full py-6 text-lg">Execute Exchange</Button>
          </div>
        </Card>

        <Card title="Crypto Assets">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border border-black">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Zap size={20} /></div>
                <div>
                  <p className="font-bold">Bitcoin (BTC)</p>
                  <p className="text-xs text-gray-500">${(1 / (rates['BTC'] || 0.000015)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <p className="font-black text-green-600">+2.4%</p>
            </div>
            <div className="flex justify-between items-center p-4 border border-black">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Zap size={20} /></div>
                <div>
                  <p className="font-bold">Ethereum (ETH)</p>
                  <p className="text-xs text-gray-500">${(1 / (rates['ETH'] || 0.00028)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <p className="font-black text-red-600">-1.2%</p>
            </div>
            <div className="p-4 border border-black border-dashed text-center">
              <p className="text-xs uppercase font-bold text-gray-500 mb-2">Wallet Balance</p>
              <p className="font-mono text-sm break-all">{walletAddress || 'Not Connected'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AdminView() {
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPendingTransactions(snap.docs.map(d => d.data() as Transaction));
      setLoading(false);
    });

    const usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => d.data() as UserProfile));
    });

    return () => { unsub(); usersUnsub(); };
  }, []);

  const handleApprove = async (trans: Transaction) => {
    try {
      const transRef = query(collection(db, 'transactions'), where('id', '==', trans.id));
      const transSnap = await getDocs(transRef);
      if (!transSnap.empty) {
        await updateDoc(transSnap.docs[0].ref, { status: 'completed' });
        
        // If it's a transfer, add balance to recipient
        if (trans.type === 'transfer' && trans.recipientId) {
          const recipientRef = doc(db, 'users', trans.recipientId);
          const recipientSnap = await getDoc(recipientRef);
          if (recipientSnap.exists()) {
            const recipientData = recipientSnap.data() as UserProfile;
            await updateDoc(recipientRef, { balance: recipientData.balance + trans.amount });
            
            // Also create a transaction record for the recipient
            const recipientTransId = Math.random().toString(36).substring(2, 15);
            const recipientTrans: Transaction = {
              id: recipientTransId,
              userId: trans.recipientId,
              amount: trans.amount,
              type: 'deposit',
              method: trans.method,
              status: 'completed',
              description: `Received from ${trans.userId}`,
              createdAt: Timestamp.now()
            };
            await addDoc(collection(db, 'transactions'), recipientTrans);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (trans: Transaction) => {
    try {
      const userRef = doc(db, 'users', trans.userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      const userData = userSnap.data() as UserProfile;
      // Refund balance
      await updateDoc(userRef, { balance: userData.balance + trans.amount });
      
      const transRef = query(collection(db, 'transactions'), where('id', '==', trans.id));
      const transSnap = await getDocs(transRef);
      if (!transSnap.empty) {
        await updateDoc(transSnap.docs[0].ref, { status: 'failed' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <ShieldCheck className="text-red-600" size={32} />
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Admin Control Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Pending Approvals">
          <div className="space-y-4">
            {pendingTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No pending transactions</p>
            ) : (
              pendingTransactions.map(t => (
                <div key={t.id} className="border border-black p-4 bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold uppercase">{t.type} - {t.method}</p>
                    <p className="text-lg font-black">${t.amount.toFixed(2)}</p>
                    <p className="text-[10px] opacity-50">User: {t.userId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(t)} className="p-2 bg-green-600 text-white hover:bg-green-700"><Check size={16} /></button>
                    <button onClick={() => handleReject(t)} className="p-2 bg-red-600 text-white hover:bg-red-700"><Ban size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="User Directory">
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.uid} className="flex justify-between items-center p-2 border-b border-gray-200">
                <div>
                  <p className="text-xs font-bold">{u.displayName || u.email}</p>
                  <p className="text-[10px] opacity-50">{u.role}</p>
                </div>
                <p className="font-mono text-xs font-bold">${u.balance.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Helper for Firestore Errors ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isOfflineError = errMsg.toLowerCase().includes('offline') || 
                          errMsg.toLowerCase().includes('could not reach') ||
                          errMsg.toLowerCase().includes('unreachable') ||
                          errMsg.toLowerCase().includes('network');

  const errInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };

  if (isOfflineError) {
    console.warn('Firestore is operating in Offline mode:', errMsg, 'at path', path);
    // Do not throw the error for offline states, since Firestore handles offline mode gracefully!
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled,
  loading,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; 
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-white text-black border border-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    outline: 'border border-black hover:bg-gray-100',
    ghost: 'hover:bg-gray-200'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      className={cn(
        'px-4 py-2 font-bold transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

const Card = ({ children, className, title }: { children: React.ReactNode; className?: string; title?: string; key?: string | number }) => (
  <div className={cn('bg-white border border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]', className)}>
    {title && <h3 className="col-header mb-4">{title}</h3>}
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-[#E4E3E0] border-2 border-black p-8 max-w-lg w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold uppercase tracking-tighter italic">{title}</h2>
            <button onClick={onClose} className="hover:rotate-90 transition-transform"><X /></button>
          </div>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
