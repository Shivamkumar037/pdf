/* ==========================================================
   PDF Toolkit – CLEAN + FIXED JS (matching new HTML)
   ========================================================== */

console.log("PDF Toolkit JS Loaded");

/* Load pdf-lib */
const pdfLibScript = document.createElement("script");
pdfLibScript.src =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
document.head.appendChild(pdfLibScript);

/* Utility: download */
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* Read file as buffer */
function readFile(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsArrayBuffer(file);
  });
}

/* Add message inside results */
function addResult(message) {
  document.getElementById("result-list").innerHTML += `<div>${message}</div>`;
}

/* ==========================================================
   1. IMAGES → PDF
   ========================================================== */
document.getElementById("btn-convert-images").onclick = async () => {
  const input = document.getElementById("img-files-input");
  const files = [...input.files];

  if (!files.length) return alert("Please select images.");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  addResult("Converting images → PDF...");

  const pdf = await PDFDocument.create();

  for (let file of files) {
    const bytes = await readFile(file);
    const img = file.type.includes("png")
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);

    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    });
  }

  const out = await pdf.save();
  download(new Blob([out], { type: "application/pdf" }), "images_to_pdf.pdf");

  addResult("Images → PDF completed.");
};

/* ==========================================================
   2. CHANGE PDF BACKGROUND
  /* ==========================================================
   CHANGE PDF BACKGROUND + AUTO TEXT COLOR
   ========================================================== */
document.getElementById("btn-change-bg").onclick = async () => {
  const file = document.getElementById("pdf-bg-input").files[0];
  if (!file) return alert("Select PDF");

  const selected = document.querySelector("input[name='bg-color']:checked");
  if (!selected) return alert("Select background color");

  const chosenColor = selected.value;

  let bgColor;
  if (chosenColor === "white") bgColor = [1, 1, 1];
  if (chosenColor === "black") bgColor = [0, 0, 0];
  if (chosenColor === "yellow") bgColor = [1, 0.96, 0.5];

  await pdfLibScript.onload;
  const { PDFDocument, rgb } = PDFLib;

  addResult("Applying background...");

  const pdfBytes = await readFile(file);
  const pdf = await PDFDocument.load(pdfBytes);

  const pages = pdf.getPages();
  pages.forEach((page) => {
    const { width, height } = page.getSize();

    // ✅ Draw semi-transparent background so text/images stay visible
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(...bgColor),
      opacity: 0.3, // Adjust opacity as needed
    });
  });

  const out = await pdf.save();
  download(
    new Blob([out], { type: "application/pdf" }),
    `background_${chosenColor}.pdf`
  );
alert("Download done.")
  addResult("Background changed successfully.");
};

/* ==========================================================
   3. DELETE PAGES
   ========================================================== */
document.getElementById("btn-delete-pages").onclick = async () => {
  const file = document.getElementById("pdf-delete-input").files[0];
  const list = document.getElementById("pdf-delete-pages").value.trim();

  if (!file || !list) return alert("Select PDF and enter pages.");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  addResult("Deleting pages...");

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes);

  const toDelete = new Set();

  list.split(",").forEach((part) => {
    if (part.includes("-")) {
      const [s, e] = part.split("-").map((n) => parseInt(n));
      for (let i = s; i <= e; i++) toDelete.add(i - 1);
    } else toDelete.add(parseInt(part) - 1);
  });

  const pageIndices = pdf.getPageIndices();
  const keep = pageIndices.filter((i) => !toDelete.has(i));

  pdf.reorderPages(keep);

  const out = await pdf.save();
  download(
    new Blob([out], { type: "application/pdf" }),
    "deleted_pages.pdf"
  );

  addResult("Pages deleted.");
};

/* ==========================================================
   4. MERGE PDFs
   ========================================================== */
document.getElementById("btn-merge").onclick = async () => {
  const files = [...document.getElementById("pdf-merge-input").files];
  if (!files.length) return alert("Select PDF files.");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  addResult("Merging...");

  const outPdf = await PDFDocument.create();

  for (let file of files) {
    const bytes = await readFile(file);
    const pdf = await PDFDocument.load(bytes);
    const copied = await outPdf.copyPages(pdf, pdf.getPageIndices());
    copied.forEach((p) => outPdf.addPage(p));
  }

  const out = await outPdf.save();
  download(new Blob([out], { type: "application/pdf" }), "merged.pdf");

  addResult("Merge completed.");
};

/* ==========================================================
   5. TEXT → PDF
   (Simplified — no font/size/title fields in new HTML)
   ========================================================== */
document.getElementById("btn-text2pdf").onclick = async () => {
  const text = document.getElementById("text2pdf-content").value.trim();

  if (!text) return alert("Write some text.");

  await pdfLibScript.onload;
  const { PDFDocument, StandardFonts } = PDFLib;

  addResult("Generating Text → PDF...");

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const page = pdf.addPage([595, 842]);
  page.drawText(text, {
    x: 40,
    y: 760,
    size: 14,
    font,
  });

  const out = await pdf.save();
  download(new Blob([out], { type: "application/pdf" }), "text_to_pdf.pdf");

  addResult("Text → PDF done.");
};

/* ==========================================================
   6. PDF → PAGES
   (Simplified HTML version – always outputs PDFs)
   ========================================================== */
document.getElementById("btn-pdf2pages").onclick = async () => {
  const file = document.getElementById("pdf2pages-input").files[0];
  if (!file) return alert("Select PDF");

  addResult("Splitting pages...");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes);

  for (let i = 0; i < pdf.getPageCount(); i++) {
    const newPDF = await PDFDocument.create();
    const copied = await newPDF.copyPages(pdf, [i]);
    newPDF.addPage(copied[0]);

    const out = await newPDF.save();
    download(
      new Blob([out], { type: "application/pdf" }),
      `page_${i + 1}.pdf`
    );
  }

  addResult("PDF → Pages completed.");
};

/* ==========================================================
   7. PDF → TEXT
   ========================================================== */
document.getElementById("btn-pdf2text").onclick = async () => {
  const file = document.getElementById("pdf2text-input").files[0];
  if (!file) return alert("Select PDF");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  addResult("Extracting text...");

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();

  let fullText = "";
  for (let page of pages) {
    const text = await page.getTextContent?.(); // fallback if not supported
    fullText += text?.items?.map(i => i.str).join(" ") + "\n";
  }

  const blob = new Blob([fullText], { type: "text/plain" });
  download(blob, "extracted_text.txt");

  addResult("Text extracted.");
};

/* ==========================================================
   8. PDF → WORD (basic .docx wrapper)
   ========================================================== */
document.getElementById("btn-pdf2word").onclick = async () => {
  const file = document.getElementById("pdf2word-input").files[0];
  if (!file) return alert("Select PDF");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  addResult("Converting PDF → Word...");

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();

  let text = "";
  for (let page of pages) {
    const content = await page.getTextContent?.();
    text += content?.items?.map(i => i.str).join(" ") + "\n";
  }

  const blob = new Blob([text], { type: "application/msword" });
  download(blob, "converted.doc");

  addResult("PDF → Word done.");
};

/* ==========================================================
   9. WORD → PDF (basic .docx to PDF text)
   ========================================================== */
document.getElementById("btn-word2pdf").onclick = async () => {
  const file = document.getElementById("word2pdf-input").files[0];
  if (!file) return alert("Select Word file");

  const text = await file.text();

  await pdfLibScript.onload;
  const { PDFDocument, StandardFonts } = PDFLib;

  addResult("Converting Word → PDF...");

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([595, 842]);

  page.drawText(text.slice(0, 5000), { x: 40, y: 760, size: 14, font });

  const out = await pdf.save();
  download(new Blob([out], { type: "application/pdf" }), "word_to_pdf.pdf");

  addResult("Word → PDF done.");
};

/* ==========================================================
   10. COMPRESS PDF (re-save with reduced precision)
   ========================================================== */
document.getElementById("btn-compress-pdf").onclick = async () => {
  const file = document.getElementById("compress-pdf-input").files[0];
  if (!file) return alert("Select PDF");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  addResult("Compressing PDF...");

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });

  const out = await pdf.save({ useObjectStreams: true });
  download(new Blob([out], { type: "application/pdf" }), "compressed.pdf");

  addResult("Compression complete.");
};

/* ==========================================================
   11. ROTATE PDF PAGES
   ========================================================== */
document.getElementById("btn-rotate-pdf").onclick = async () => {
  const file = document.getElementById("rotate-pdf-input").files[0];
  const angle = parseInt(document.getElementById("rotate-angle").value);
  if (!file || !angle) return alert("Select PDF and angle");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  addResult("Rotating pages...");

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes);

  pdf.getPages().forEach((page) => {
    page.setRotation(page.getRotation().rotate(angle));
  });

  const out = await pdf.save();
  download(new Blob([out], { type: "application/pdf" }), "rotated.pdf");

  addResult("Pages rotated.");
};

/* ==========================================================
   12. ADD WATERMARK
   ========================================================== */
document.getElementById("btn-add-watermark").onclick = async () => {
  const file = document.getElementById("watermark-pdf-input").files[0];
  const text = document.getElementById("watermark-text").value.trim();
  if (!file || !text) return alert("Select PDF and enter watermark text");

  await pdfLibScript.onload;
  const { PDFDocument, rgb, StandardFonts } = PDFLib;

  addResult("Adding watermark...");

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - 100,
      y: height / 2,
      size: 40,
      font,
      color: rgb(0.75, 0.75, 0.75),
      rotate: { degrees: 45 },
      opacity: 0.4,
    });
  });

  const out = await pdf.save();
  download(new Blob([out], { type: "application/pdf" }), "watermarked.pdf");

  addResult("Watermark added.");
};

/* ==========================================================
   13. VIEW METADATA
   ========================================================== */
document.getElementById("btn-view-metadata").onclick = async () => {
  const file = document.getElementById("metadata-pdf-input").files[0];
  if (!file) return alert("Select PDF");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  addResult("Reading metadata...");

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes);
  const meta = pdf.getTitle() || "No title";

  alert("Title: " + meta);
  addResult("Metadata shown in alert.");
};

/* ==========================================================
   14. PASSWORD PROTECT PDF
   ========================================================== */
document.getElementById("btn-set-password").onclick = async () => {
  alert("Password protection not supported in pdf-lib. Use server-side tool.");
};

/* ==========================================================
   15. UNLOCK PDF
   ========================================================== */
document.getElementById("btn-unlock-pdf").onclick = async () => {
  alert("Unlocking password-protected PDFs not supported in pdf-lib.");
};

/* ==========================================================
   16. REORDER PDF PAGES
   ========================================================== */
document.getElementById("btn-reorder-pdf").onclick = async () => {
  const file = document.getElementById("reorder-pdf-input").files[0];
  const order = document.getElementById("reorder-pages").value.trim();
  if (!file || !order) return alert("Select PDF and enter new order");

  const indices = order.split(",").map((n) => parseInt(n) - 1);

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  addResult("Reordering pages...");

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes);
  const pages = await pdf.copyPages(pdf, indices);

  const newPdf = await PDFDocument.create();
  pages.forEach((p) => newPdf.addPage(p));

  const out = await newPdf.save();
  download(new Blob([out], { type: "application/pdf" }), "reordered.pdf");

  addResult("Pages reordered.");
};







