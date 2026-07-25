import { vi } from "vitest";
import { HttpRequest, InvocationContext } from "@azure/functions";

interface MockRequestOptions {
  method?: string;
  query?: Record<string, string>;
  body?: unknown;
}

export function createMockRequest(options: MockRequestOptions = {}): HttpRequest {
  const params = new URLSearchParams(options.query ?? {});
  const url = `http://localhost:7071/api/test?${params.toString()}`;
  const bodyText = options.body === undefined ? "" : JSON.stringify(options.body);
  return {
    method: options.method ?? "GET",
    url,
    headers: new Headers(),
    query: params,
    params: {},
    text: () => Promise.resolve(bodyText),
    json: () => Promise.resolve(options.body ?? {}),
    formData: () => Promise.resolve({} as any),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve({} as any),
    body: null,
    bodyUsed: false,
    user: null,
  } as unknown as HttpRequest;
}

export function createMockContext(): InvocationContext {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  } as unknown as InvocationContext;
}
