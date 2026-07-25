import { TableClient } from "@azure/data-tables";

const connectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";
const tableName = "DeviceAuth";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment()}-${segment()}-${segment()}`;
}

async function main() {
  const count = parseInt(process.argv[2] || "3", 10);
  const client = TableClient.fromConnectionString(connectionString, tableName);

  try {
    await client.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) throw error;
  }

  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = generateCode();
    await client.createEntity({
      partitionKey: "code",
      rowKey: code,
      status: "active",
    });
    codes.push(code);
  }

  console.log(`\nCreated ${codes.length} activation code(s):\n`);
  codes.forEach((code, i) => console.log(`  ${i + 1}. ${code}`));
  console.log("\nStore these securely — each can only be used once.\n");
}

main().catch((err) => {
  console.error("Failed to seed codes:", err);
  process.exit(1);
});
