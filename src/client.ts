import { StableNairaApiError, StableNairaNetworkError } from "./errors";
import type {
  AcquireBody,
  Bank,
  CreateRecipientBody,
  GetWalletBalanceQuery,
  ListBanksQuery,
  MerchantWallet,
  Recipient,
  RedeemBody,
  RedeemResponseData,
  StableNairaApiResponse,
  StableNairaAuthMode,
  StableNairaFailureResponse,
  StableNairaSuccessResponse,
  Transaction,
  TransactionWithEnvelope,
  VirtualAccount,
  VirtualAccountBalance,
  WalletBalance,
  WithdrawBody,
  WithdrawVirtualAccountBody,
} from "./types";

export type StableNairaClientOptions = {
  apiKey: string;
  baseUrl?: string;
  authMode?: StableNairaAuthMode;
  timeoutMs?: number;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
};

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

const DEFAULT_BASE_URL = "https://api.stablenaira.com/v1";
const DEFAULT_TIMEOUT_MS = 15_000;

function ensureTrailingSlashRemoved(url: string): string {
  return url.replace(/\/+$/, "");
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(path, `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function isApiFailureResponse(data: unknown): data is StableNairaFailureResponse {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<StableNairaFailureResponse>;
  return (
    candidate.success === false &&
    candidate.data === null &&
    !!candidate.error &&
    typeof candidate.error.code === "number" &&
    typeof candidate.error.message === "string"
  );
}

export class StableNairaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly authMode: StableNairaAuthMode;
  private readonly fetchImpl: typeof fetch;
  private readonly extraHeaders: Record<string, string> | undefined;

  public constructor(options: StableNairaClientOptions) {
    if (!options.apiKey?.trim()) {
      throw new Error("StableNaira SDK requires a non-empty apiKey");
    }
    this.apiKey = options.apiKey.trim();
    this.baseUrl = ensureTrailingSlashRemoved(options.baseUrl ?? DEFAULT_BASE_URL);
    this.authMode = options.authMode ?? "x-api-key";
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.extraHeaders = options.headers ? options.headers : undefined;
  }

  public readonly banks = {
    list: (query?: ListBanksQuery) =>
      this.request<Bank[]>("/banks", query ? { query } : {}),
  };

  public readonly wallet = {
    list: () => this.request<MerchantWallet[]>("/wallet"),
    getBalance: (query: GetWalletBalanceQuery) =>
      this.request<WalletBalance>("/wallet/balance", { query }),
  };

  public readonly recipients = {
    list: () => this.request<Recipient[]>("/recipients"),
    create: (body: CreateRecipientBody) =>
      this.request<Recipient>("/recipients", { method: "POST", body }),
    remove: (recipientId: string) =>
      this.request<null>(`/recipients/${encodeURIComponent(recipientId)}`, {
        method: "DELETE",
      }),
    setDefault: (recipientId: string) =>
      this.request<null>(
        `/recipients/${encodeURIComponent(recipientId)}/default`,
        {
          method: "POST",
        },
      ),
  };

  public readonly virtualAccount = {
    details: () => this.request<VirtualAccount>("/virtual-account"),
    balance: () =>
      this.request<VirtualAccountBalance>("/virtual-account/balance"),
    withdraw: (body: WithdrawVirtualAccountBody) =>
      this.request<TransactionWithEnvelope>("/virtual-account/withdraw", {
        method: "POST",
        body,
      }),
  };

  public readonly transactions = {
    list: () => this.request<Transaction[]>("/transactions"),
    redeem: (body: RedeemBody) =>
      this.request<RedeemResponseData>("/transactions/redeem", {
        method: "POST",
        body,
      }),
    acquire: (body: AcquireBody) =>
      this.request<TransactionWithEnvelope>("/transactions/acquire", {
        method: "POST",
        body,
      }),
    withdraw: (body: WithdrawBody) =>
      this.request<TransactionWithEnvelope>("/transactions/withdraw", {
        method: "POST",
        body,
      }),
  };

  private async request<TData>(
    path: string,
    options: RequestOptions = {},
  ): Promise<StableNairaSuccessResponse<TData>> {
    const method = options.method ?? "GET";
    const url = buildUrl(this.baseUrl, path, options.query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...this.extraHeaders,
    };

    if (this.authMode === "x-api-key") {
      headers["X-Api-Key"] = this.apiKey;
    } else {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const hasBody = options.body !== undefined && method !== "GET";
    if (hasBody) {
      headers["Content-Type"] = "application/json";
    }

    let response: Response;
    try {
      const requestInit: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (hasBody) {
        requestInit.body = JSON.stringify(options.body);
      }
      response = await this.fetchImpl(url, requestInit);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new StableNairaNetworkError(
          `StableNaira request timed out after ${this.timeoutMs}ms`,
          error,
        );
      }
      throw new StableNairaNetworkError("StableNaira request failed", error);
    } finally {
      clearTimeout(timeout);
    }

    let parsed: unknown = null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      parsed = await response.json();
    }

    if (!response.ok) {
      if (isApiFailureResponse(parsed)) {
        throw new StableNairaApiError({
          status: response.status,
          code: parsed.error.code,
          message: parsed.error.message,
          details: parsed,
        });
      }
      throw new StableNairaApiError({
        status: response.status,
        code: response.status,
        message: `StableNaira API request failed with status ${response.status}`,
      });
    }

    const data = parsed as StableNairaApiResponse<TData>;
    if (!data || typeof data !== "object") {
      throw new StableNairaNetworkError(
        "StableNaira API returned an invalid response body",
      );
    }

    if (data.success === false) {
      throw new StableNairaApiError({
        status: response.status,
        code: data.error.code,
        message: data.error.message,
        details: data,
      });
    }

    return data;
  }
}

export function createStableNairaClient(
  options: StableNairaClientOptions,
): StableNairaClient {
  return new StableNairaClient(options);
}
