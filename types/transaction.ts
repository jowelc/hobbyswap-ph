export type TransactionStatus = 'accepted' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  offererUsername: string;
  receiverUsername: string;
  offeredItemName: string;
  receivedItemName: string;
  cashDifference: number;
  cashPaidBy: 'offerer' | 'receiver' | 'none';
  status: TransactionStatus;
  completedAt: string;
  notes?: string;
}
