import "dotenv/config";
import { claimGame } from "../src/platforms/claimers.js";

const [platform, link, name = "Manual Claim Test"] = process.argv.slice(2);

if (!platform || !link) {
  console.error("用法：node scripts/test-claim.js <platform> <url> [name]");
  process.exit(1);
}

process.env.CLAIM_DRY_RUN = "true";

const result = await claimGame({
  name,
  platform,
  link,
  availability: "永久加入",
});

console.log(JSON.stringify(result, null, 2));
