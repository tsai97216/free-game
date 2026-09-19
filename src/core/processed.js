import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config.js";

const dataDir = path.resolve("data");
const filePath = path.join(dataDir, "processed.json");

async function readLinks() {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLinks(links) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(links, null, 2) + "\n");
}

export async function isProcessed(link) {
  const links = await readLinks();
  return links.includes(link);
}

export async function markAsProcessed(link) {
  const links = await readLinks();
  if (!links.includes(link)) links.push(link);

  const trimmed = links.slice(-config.processedLimit);
  await writeLinks(trimmed);
}

export async function exportProcessedLinks() {
  return readLinks();
}
