# StableNaira TypeScript SDK

Official type-safe SDK for integrating with the StableNaira v1 API.

## Installation

```bash
npm install @stablenaira/sdk
```

## Quick start

```ts
import { createStableNairaClient } from "@stablenaira/sdk";

const client = createStableNairaClient({
  apiKey: process.env.STABLENAIRA_API_KEY!,
  baseUrl: "https://api.stablenaira.com/v1",
});

const banks = await client.banks.list();
console.log(banks.data[0]?.name);
```

## Features

- End-to-end type-safe request and response models.
- Built-in API key authentication (`X-Api-Key` by default).
- Timeout support with `AbortController`.
- Ergonomic resource methods grouped by domain.
- Typed `StableNairaApiError` for robust error handling.

## Authentication

By default, the SDK sends your key as `X-Api-Key`.

You can switch to bearer auth:

```ts
const client = createStableNairaClient({
  apiKey: process.env.STABLENAIRA_API_KEY!,
  authMode: "bearer",
});
```

## Basic usage

```ts
const wallets = await client.wallet.list();
const walletBalance = await client.wallet.getBalance({
  walletAddress: "0xA7A3D7e7E4A2AbcD20DA74E846A7fA1d677f8E27",
});

const recipient = await client.recipients.create({
  accountNumber: "0123456789",
  accountName: "Jane Doe",
  bankId: "bank_01JXYZ...",
});

await client.transactions.acquire({
  amount: 25000,
  destinationWalletAddress: wallets.data[0]?.address,
});
```

## Error handling

```ts
import { StableNairaApiError } from "@stablenaira/sdk";

try {
  await client.transactions.redeem({ amount: 0 });
} catch (error) {
  if (error instanceof StableNairaApiError) {
    console.error(error.status, error.code, error.message);
  }
}
```
