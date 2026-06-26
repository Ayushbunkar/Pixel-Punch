import { promises as fs } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data", "submissions");

// Ensure the data directory exists
async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Directory already exists or cannot be created
  }
}

/**
 * Saves submission data to a JSON file.
 */
export async function saveSubmission(id: string, data: any): Promise<void> {
  await ensureDir();
  const filePath = join(DATA_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Retrieves submission data from a JSON file.
 */
export async function getSubmission(id: string): Promise<any | null> {
  await ensureDir();
  const filePath = join(DATA_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}
