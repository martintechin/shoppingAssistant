import { TableClient } from "@azure/data-tables";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

const clients = new Map<string, TableClient>();

export function getTableClient(tableName: string): TableClient {
  let client = clients.get(tableName);
  if (!client) {
    client = TableClient.fromConnectionString(connectionString, tableName);
    clients.set(tableName, client);
  }
  return client;
}

/** Idempotent table creation — a 409 means it already exists. */
export async function ensureTableExists(client: TableClient): Promise<void> {
  try {
    await client.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) throw error;
  }
}

export function generateRowKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
