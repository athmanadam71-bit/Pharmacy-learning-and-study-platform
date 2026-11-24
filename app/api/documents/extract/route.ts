
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";

export const runtime = "nodejs";

function collectSlideText(value: unknown): string[] {
  const results: string[] = [];

  function walk(item: unknown) {
    if (!item || typeof item !== "object") return;

    if (Array.isArray(item)) {
      item.forEach(walk);
      return;
    }

    for (const [key, child] of Object.entries(item)) {
      if (key === "a:t" && typeof child === "string") {
        results.push(child);
      } else {
        walk(child);
      }
    }
  }

  walk(value);
  return results;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const documentId =
      typeof body?.documentId === "string" ? body.documentId : "";

    if (!documentId) {
      return NextResponse.json(
        { error: "Please select a document." },
        { status: 400 }
      );
    }

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id, user_id, file_name, storage_path, mime_type")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from("student-documents")
      .download(document.storage_path);

    if (downloadError || !file) {
      return NextResponse.json(
        { error: "Could not download the selected document." },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = document.mime_type;
    const fileName = document.file_name.toLowerCase();

    let extractedText = "";

    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      const result = await pdfParse(buffer);
      extractedText = result.text;
    } else if (
      mimeType === "text/plain" ||
      fileName.endsWith(".txt")
    ) {
      extractedText = buffer.toString("utf-8");
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      fileName.endsWith(".pptx")
    ) {
      const zip = new AdmZip(buffer);
      const entries = zip
        .getEntries()
        .filter((entry) =>
          /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName)
        )
        .sort((a, b) => {
          const getNumber = (name: string) =>
            Number(name.match(/slide(\d+)\.xml$/)?.[1] || 0);

          return getNumber(a.entryName) - getNumber(b.entryName);
        });

      const parser = new XMLParser({
        ignoreAttributes: true,
        parseTagValue: false,
      });

      extractedText = entries
        .map((entry) => {
          const xml = entry.getData().toString("utf-8");
          const parsed = parser.parse(xml);
          return collectSlideText(parsed).join(" ");
        })
        .join("\n");
    } else if (
      mimeType === "image/png" ||
      mimeType === "image/jpeg" ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg")
    ) {
      return NextResponse.json(
        {
          error:
            "Image text extraction is not available yet. OCR support will be added separately.",
        },
        { status: 415 }
      );
    } else {
      return NextResponse.json(
        { error: "This document format is not supported." },
        { status: 415 }
      );
    }

    const cleanedText = extractedText
      .replace(/\u0000/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (cleanedText.length < 100) {
      return NextResponse.json(
        {
          error:
            "Not enough readable text was found. The document may be scanned or image-based.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      document: {
        id: document.id,
        fileName: document.file_name,
      },
      text: cleanedText.slice(0, 18000),
      characterCount: cleanedText.length,
    });
  } catch (error) {
    console.error("Document extraction error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Document extraction failed.",
      },
      { status: 500 }
    );
  }
}
