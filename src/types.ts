import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'user';
export type KYCStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  country?: string;
  role: UserRole;
  balance: number;
  kycStatus: KYCStatus;
  walletAddress?: string;
  createdAt: Timestamp;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'exchange' | 'crypto_buy' | 'crypto_sell';
export type TransactionMethod = 'Mobile Money' | 'Crypto' | 'Bank Transfer' | 'Stripe' | 'PayPal' | 'Flutterwave' | 'M-Pesa';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'processing';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  method: TransactionMethod;
  status: TransactionStatus;
  description?: string;
  recipientId?: string;
  createdAt: Timestamp;
}

export interface VirtualCard {
  id: string;
  userId: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  status: 'active' | 'blocked';
  balance: number;
  cardType?: 'cash_in' | 'cash_out';
  label?: string;
  linkedProvider?: string;
}

export interface ExternalApiConfig {
  id: string;
  userId: string;
  provider: 'M-Pesa API' | 'Plaid Open Banking' | 'Stripe Gateway' | 'Coinbase Web3 Bridge' | 'Custom Webhook';
  apiKey: string;
  apiSec?: string;
  endpointUrl?: string;
  status: 'active' | 'inactive';
  lastTested?: Timestamp;
  testStatus?: 'success' | 'failed' | 'not_tested';
  createdAt: Timestamp;
}

export interface AdConfig {
  id: string;
  type: 'fixed_top' | 'fixed_bottom' | 'popup' | 'sliding';
  isActive: boolean;
  content: string; // HTML script, link or text message
  linkUrl?: string;
  imageUrl?: string;
  slidingDirection?: 'left-to-right' | 'right-to-left';
  createdAt: Timestamp;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  adminReply?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SecurityAlert {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  status: 'active' | 'resolved';
  createdAt: Timestamp;
}

export interface WasteItem {
  id: string;
  type: 'virtual_card' | 'transaction' | 'ticket';
  title: string;
  deletedAt: Timestamp;
  originalData: any;
}

