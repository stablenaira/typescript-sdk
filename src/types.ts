export type StableNairaAuthMode = "x-api-key" | "bearer";

export type StableNairaApiErrorShape = {
  code: number;
  message: string;
};

export type StableNairaSuccessResponse<TData> = {
  success: true;
  data: TData;
  message?: string;
  error: null;
};

export type StableNairaFailureResponse = {
  success: false;
  data: null;
  message?: string;
  error: StableNairaApiErrorShape;
};

export type StableNairaApiResponse<TData> =
  | StableNairaSuccessResponse<TData>
  | StableNairaFailureResponse;

export type ListBanksQuery = {
  scope?: string;
};

export type Bank = {
  id: string;
  name: string;
  code: string;
  is_test: boolean;
  active: boolean;
};

export type MerchantWallet = {
  id: string;
  address: string;
  walletType: string;
  isPrimary: boolean;
  chain: string;
  network: string;
};

export type WalletBalance = {
  balance: number;
};

export type Recipient = {
  id: string;
  accountName: string;
  accountNumber: string;
  bankId: string;
  bank?: string;
  defaultRedeem: boolean;
  defaultVaWithdrawal: boolean;
  recipient_code?: string;
};

export type CreateRecipientBody = {
  accountNumber: string;
  accountName: string;
  bankId: string;
};

export type VirtualAccount = {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  currency: "NGN" | string;
  status: string;
  autoConvert: boolean;
};

export type VirtualAccountBalance = {
  currency: "NGN";
  availableBalanceNgn: number;
  bvnVerified: boolean;
};

export type WithdrawVirtualAccountBody = {
  amount: number;
  recipientId?: string;
};

export type RedeemBody = {
  amount: number;
  recipientId?: string;
};

export type AcquireBody = {
  amount: number;
  destinationWalletAddress?: string;
};

export type WithdrawBody = {
  amount: number;
  recipientId?: string;
};

export type Transaction = {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: number;
  completed?: boolean;
  createdAt?: string;
};

export type TransactionWithEnvelope = {
  transaction: Transaction;
};

export type RedeemResponseData = {
  transaction: Transaction;
  redeem?: {
    id: string;
    amount: number;
    status: string;
  };
  recipient?: Pick<Recipient, "id" | "accountName" | "accountNumber" | "bankId">;
};

export type GetWalletBalanceQuery = {
  walletAddress: string;
};
