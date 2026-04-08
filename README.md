# StableNaira TypeScript SDK

Official type-safe TypeScript/JavaScript SDK for the StableNaira v1 API.

## Requirements

- Node.js `>= 18` (native `fetch` required)
- A StableNaira API key

## Installation

```bash
npm install @stablenaira/sdk
```

## Exports

The package exports:

- `createStableNairaClient`
- `StableNairaClient`
- `StableNairaApiError`
- `StableNairaNetworkError`
- all public SDK types from `src/types.ts`

## Quick Start

```ts
import { createStableNairaClient } from "@stablenaira/sdk";

const client = createStableNairaClient({
  apiKey: process.env.STABLENAIRA_API_KEY!,
});

const banks = await client.banks.list();
console.log(banks.data[0]?.name);
```

## Client Configuration

```ts
import {
  createStableNairaClient,
  type StableNairaClientOptions,
} from "@stablenaira/sdk";

const options: StableNairaClientOptions = {
  apiKey: process.env.STABLENAIRA_API_KEY!, // required
  baseUrl: "https://api.stablenaira.com/v1", // optional (default)
  authMode: "x-api-key", // "x-api-key" | "bearer", default "x-api-key"
  timeoutMs: 15_000, // default 15000ms
  headers: {
    "X-Correlation-Id": "req_123",
  }, // optional extra headers
  // fetch: customFetch, // optional fetch implementation
};

const client = createStableNairaClient(options);
```

### Notes

- `apiKey` must be non-empty (constructor throws otherwise).
- `baseUrl` defaults to `https://api.stablenaira.com/v1`.
- `authMode: "x-api-key"` sends `X-Api-Key: <key>`.
- `authMode: "bearer"` sends `Authorization: Bearer <key>`.
- For non-GET requests with a body, SDK sets `Content-Type: application/json`.

## Response Shape

All successful calls resolve with:

```ts
type StableNairaSuccessResponse<TData> = {
  success: true;
  data: TData;
  message?: string;
  error: null;
};
```

Failures throw typed errors (see Error Handling), instead of returning `success: false`.

## API Surface

### Banks

#### `banks.list(query?)`

`GET /v1/banks`

```ts
const res = await client.banks.list({ scope: "transfer" });
// res.data is Bank[]
```

`ListBanksQuery`:

```ts
type ListBanksQuery = {
  scope?: string;
};
```

### Wallet

#### `wallet.list()`

`GET /v1/wallet`

```ts
const wallets = await client.wallet.list();
// wallets.data is MerchantWallet[]
```

#### `wallet.getBalance(query?)`

`GET /v1/wallet/balance`

```ts
const balance = await client.wallet.getBalance({
  walletAddress: "0xA7A3D7e7E4A2AbcD20DA74E846A7fA1d677f8E27",
});
// balance.data is WalletBalance

const primaryBalance = await client.wallet.getBalance();
// if walletAddress is omitted, API resolves merchant primary wallet
```

### Recipients

#### `recipients.list()`

`GET /v1/recipients`

```ts
const recipients = await client.recipients.list();
// recipients.data is Recipient[]
```

#### `recipients.create(body)`

`POST /v1/recipients`

```ts
const recipient = await client.recipients.create({
  accountNumber: "0123456789",
  accountName: "Jane Doe",
  bankId: "bank_01JXYZ...",
});
// recipient.data is Recipient
```

#### `recipients.remove(recipientId)`

`DELETE /v1/recipients/:recipientId`

```ts
await client.recipients.remove("recipient_01...");
// response.data is null
```

#### `recipients.setDefault(recipientId)`

`POST /v1/recipients/:recipientId/default`

```ts
await client.recipients.setDefault("recipient_01...");
// response.data is null
```

### Virtual Account

#### `virtualAccount.details()`

`GET /v1/virtual-account`

```ts
const va = await client.virtualAccount.details();
// va.data is VirtualAccount
```

#### `virtualAccount.balance()`

`GET /v1/virtual-account/balance`

```ts
const vaBalance = await client.virtualAccount.balance();
// vaBalance.data is VirtualAccountBalance
```

#### `virtualAccount.withdraw(body)`

`POST /v1/virtual-account/withdraw`

```ts
const withdrawal = await client.virtualAccount.withdraw({
  amount: 25000,
  recipientId: "recipient_01...", // optional
});
// withdrawal.data is { transaction: Transaction }
```

### Transactions

#### `transactions.list()`

`GET /v1/transactions`

```ts
const txs = await client.transactions.list();
// txs.data is Transaction[]
```

#### `transactions.redeem(body)`

`POST /v1/transactions/redeem`

```ts
const redeemed = await client.transactions.redeem({
  amount: 15000,
  recipientId: "recipient_01...", // optional
});
// redeemed.data is RedeemResponseData
```

#### `transactions.acquire(body)`

`POST /v1/transactions/acquire`

```ts
const acquired = await client.transactions.acquire({
  amount: 50000,
  destinationWalletAddress: "0xabc...", // optional
});
// acquired.data is { transaction: Transaction }
```

#### `transactions.withdraw(body)`

`POST /v1/transactions/withdraw`

```ts
const withdrawn = await client.transactions.withdraw({
  amount: 5000,
  recipientId: "recipient_01...", // optional
});
// withdrawn.data is { transaction: Transaction }
```

## Error Handling

### `StableNairaApiError`

Thrown when:

- the API responds with a non-2xx status, or
- the API returns `success: false`

Properties:

- `name: "StableNairaApiError"`
- `status: number` (HTTP status)
- `code: number` (API error code or fallback status code)
- `message: string`
- `details?: StableNairaFailureResponse`

### `StableNairaNetworkError`

Thrown on transport-level failures (network issues, timeout, invalid response body).

Properties:

- `name: "StableNairaNetworkError"`
- `message: string`
- `cause?: unknown`

### Example

```ts
import {
  createStableNairaClient,
  StableNairaApiError,
  StableNairaNetworkError,
} from "@stablenaira/sdk";

const client = createStableNairaClient({
  apiKey: process.env.STABLENAIRA_API_KEY!,
  timeoutMs: 5_000,
});

try {
  await client.transactions.redeem({ amount: 0 });
} catch (error) {
  if (error instanceof StableNairaApiError) {
    console.error("API error", error.status, error.code, error.message);
    console.error("details", error.details);
  } else if (error instanceof StableNairaNetworkError) {
    console.error("Network error", error.message, error.cause);
  } else {
    console.error("Unknown error", error);
  }
}
```

## Type Highlights

Commonly used types:

- `Bank`
- `MerchantWallet`
- `WalletBalance`
- `Recipient`
- `VirtualAccount`
- `VirtualAccountBalance`
- `Transaction`
- `RedeemResponseData`
- `StableNairaSuccessResponse<T>`
- `StableNairaFailureResponse`

Import any type directly:

```ts
import type {
  Transaction,
  StableNairaSuccessResponse,
} from "@stablenaira/sdk";
```

## End-to-End Example

```ts
import { createStableNairaClient } from "@stablenaira/sdk";

const client = createStableNairaClient({
  apiKey: process.env.STABLENAIRA_API_KEY!,
});

const wallets = await client.wallet.list();
const primaryWallet = wallets.data.find((w) => w.isPrimary) ?? wallets.data[0];

const recipient = await client.recipients.create({
  accountNumber: "0123456789",
  accountName: "Jane Doe",
  bankId: "bank_01JXYZ...",
});

const acquireTx = await client.transactions.acquire({
  amount: 25000,
  destinationWalletAddress: primaryWallet?.address,
});

const redeemTx = await client.transactions.redeem({
  amount: 10000,
  recipientId: recipient.data.id,
});

console.log({
  acquireReference: acquireTx.data.transaction.reference,
  redeemReference: redeemTx.data.transaction.reference,
});
```
