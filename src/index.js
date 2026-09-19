import "dotenv/config";
import { checkUpdates } from "./sources/fourgamers.js";

async function main() {
  await checkUpdates();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
