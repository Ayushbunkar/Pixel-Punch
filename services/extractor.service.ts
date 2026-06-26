import { parseOffice } from "officeparser";

interface DocumentInput {
  name: string;
  type: string;
  base64: string;
}

/**
 * Extracts plain text from an uploaded document based on its extension.
 * Supports .txt, .md, .pdf, .doc, and .docx files.
 */
export async function extractTextFromDoc(doc: DocumentInput): Promise<string> {
  const ext = doc.name.split(".").pop()?.toLowerCase();

  // For plain text formats (TXT, MD) we can decode directly
  if (ext === "txt" || ext === "md") {
    try {
      return Buffer.from(doc.base64, "base64").toString("utf-8");
    } catch (err) {
      console.error(`[extractor] Failed to decode text/md file ${doc.name}:`, err);
      throw new Error(`Failed to decode text file: ${doc.name}`);
    }
  }

  // For complex formats (PDF, DOC, DOCX) we run officeparser
  try {
    const buffer = Buffer.from(doc.base64, "base64");
    const ast = await parseOffice(buffer);
    return ast.toText() || "";
  } catch (err) {
    console.error(`[extractor] officeparser failed on ${doc.name}:`, err);
    throw new Error(`Failed to parse binary document: ${doc.name}. Make sure it is a valid PDF or Word document.`);
  }
}
