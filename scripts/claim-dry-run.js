import "dotenv/config";

const [platform, link, name = "Manual Claim Test"] = process.argv.slice(2);

if (!platform || !link) {
  console.error("用法：node scripts/claim-dry-run.js <platform> <url> [name]");
  process.exit(1);
}

process.env.CLAIM_DRY_RUN = "true";

const { claimGame } = await import("../src/platforms/claimers.js");

const result = await claimGame({
  name,
  platform,
  link,
  availability: "永久加入",
});

console.log(JSON.stringify(result, null, 2));
