/* ==========================================================
   PDF Toolkit – FULL JS FUNCTIONALITY (Client-Side)

   Libraries used:
   - pdf-lib (https://pdf-lib.js.org) via CDN
   - Browser canvas for image exports
   ========================================================== */

console.log("PDF Toolkit JS Loaded");

// Load PDF-LIB from CDN
const pdfLibScript = document.createElement("script");
pdfLibScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
document.head.appendChild(pdfLibScript);

/* Utility log */
function log(msg) {
  const logBox = document.getElementById("activity-log");
  logBox.innerHTML += `<div>• ${msg}</div>`;
}

/* Utility: download file */
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* Read file as ArrayBuffer */
function readFile(file) {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsArrayBuffer(file);
  });
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

  log("Converting images → PDF...");

  const pdf = await PDFDocument.create();

  for (let file of files) {
    const bytes = await readFile(file);
    const img = file.type.includes("png")
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);

    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }

  const pdfBytes = await pdf.save();
  download(new Blob([pdfBytes], { type: "application/pdf" }), "images_to_pdf.pdf");

  log("Images → PDF done.");
};

/* ==========================================================
   2. CHANGE PDF BACKGROUND
   ========================================================== */
document.getElementById("btn-change-bg").onclick = async () => {
  const file = document.getElementById("pdf-bg-input").files[0];
  const selectedColor = document.querySelector(".color-swatch.selected");

  if (!file) return alert("Select PDF");
  if (!selectedColor) return alert("Select color");

  const colorValue = selectedColor.dataset.color;
  const colorMap = {
    white: [1, 1, 1],
    black: [0, 0, 0],
    light: [0.95, 0.95, 0.98],
    sepia: [0.96, 0.90, 0.84],
    blue: [0.4, 0.6, 1]
  };

  const bgColor = colorMap[colorValue];

  await pdfLibScript.onload;
  const { PDFDocument, rgb } = PDFLib;

  log("Changing background...");

  const pdfBytes = await readFile(file);
  const pdf = await PDFDocument.load(pdfBytes);
  const pages = pdf.getPages();

  pages.forEach((p) => {
    const { width, height } = p.getSize();
    p.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(...bgColor),
      opacity: 1
    });
  });

  const out = await pdf.save();
  download(new Blob([out], { type: "application/pdf" }), "background_changed.pdf");

  log("Background changed.");
};

// select highlight
document.querySelectorAll(".color-swatch").forEach((el) => {
  el.onclick = () => {
    document.querySelectorAll(".color-swatch").forEach((x) => x.classList.remove("selected"));
    el.classList.add("selected");
  };
});

/* ==========================================================
   3. DELETE PAGES
   ========================================================== */
document.getElementById("btn-delete-pages").onclick = async () => {
  const file = document.getElementById("pdf-delete-input").files[0];
  const list = document.getElementById("pdf-delete-pages").value.trim();

  if (!file || !list) return alert("Select PDF & enter page numbers");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  log("Deleting pages...");

  const pdfBytes = await readFile(file);
  const pdf = await PDFDocument.load(pdfBytes);

  // parse pages
  const toDelete = new Set();
  list.split(",").forEach((part) => {
    if (part.includes("-")) {
      const [s, e] = part.split("-").map((n) => parseInt(n));
      for (let i = s; i <= e; i++) toDelete.add(i - 1);
    } else toDelete.add(parseInt(part) - 1);
  });

  const pages = pdf.getPages().map((_, i) => i);
  const keep = pages.filter((i) => !toDelete.has(i));

  pdf.reorderPages(keep);

  const out = await pdf.save();
  download(new Blob([out], { type: "application/pdf" }), "deleted_pages.pdf");

  log("Pages deleted.");
};

/* ==========================================================
   4. MERGE PDFs
   ========================================================== */
document.getElementById("btn-merge").onclick = async () => {
  const files = [...document.getElementById("pdf-merge-input").files];
  if (!files.length) return alert("Select PDFs");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  log("Merging PDFs...");

  const outPdf = await PDFDocument.create();

  for (let file of files) {
    const bytes = await readFile(file);
    const pdf = await PDFDocument.load(bytes);
    const copied = await outPdf.copyPages(pdf, pdf.getPageIndices());
    copied.forEach((p) => outPdf.addPage(p));
  }

  const out = await outPdf.save();
  download(new Blob([out], { type: "application/pdf" }), "merged.pdf");

  log("Merge completed.");
};

/* ==========================================================
   5. TEXT → PDF
   ========================================================== */
document.getElementById("btn-text2pdf").onclick = async () => {
  const text = document.getElementById("text2pdf-content").value.trim();
  const size = document.getElementById("text2pdf-size").value;
  const fontName = document.getElementById("text2pdf-font").value;
  const title = document.getElementById("text2pdf-title").value;

  if (!text) return alert("Enter text");

  await pdfLibScript.onload;
  const { PDFDocument, StandardFonts } = PDFLib;

  log("Generating PDF from text...");

  const pdf = await PDFDocument.create();
  const font =
    fontName === "Times"
      ? await pdf.embedFont(StandardFonts.TimesRoman)
      : await pdf.embedFont(StandardFonts.Helvetica);

  const page = pdf.addPage(size === "A4" ? [595, 842] : size === "Letter" ? [612, 792] : [420, 595]);

  page.drawText(text, { x: 40, y: page.getHeight() - 80, size: 14, font });

  if (title)
    page.drawText(title, { x: 40, y: page.getHeight() - 40, size: 20, font });

  const out = await pdf.save();
  download(new Blob([out], { type: "application/pdf" }), "text_to_pdf.pdf");

  log("Text → PDF done.");
};

/* ==========================================================
   6. PDF → PAGES
   ========================================================== */
document.getElementById("btn-pdf2pages").onclick = async () => {
  const file = document.getElementById("pdf2pages-input").files[0];
  const format = document.getElementById("pdf2pages-format").value;

  if (!file) return alert("Select PDF");
  log("Extracting pages...");

  await pdfLibScript.onload;
  const { PDFDocument } = PDFLib;

  const bytes = await readFile(file);
  const pdf = await PDFDocument.load(bytes);

  const outList = document.getElementById("pdf2pages-list");
  outList.innerHTML = "";

  for (let i = 0; i < pdf.getPageCount(); i++) {
    const newPdf = await PDFDocument.create();
    const copied = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copied[0]);

    const out = await newPdf.save();

    if (format === "pdf") {
      const blob = new Blob([out], { type: "application/pdf" });
      const link = document.createElement("a");
      link.textContent = `Download Page ${i + 1}`;
      link.style.display = "block";
      link.onclick = () => download(blob, `page_${i + 1}.pdf`);
      outList.appendChild(link);
    } else {
      // PDF → Image via Canvas
      const uint8 = new Uint8Array(out);
      const blob = new Blob([uint8], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const img = document.createElement("img");
      img.src = url;
      img.style.width = "180px";
      img.style.border = "1px solid #222";

      const downloadLink = document.createElement("a");
      downloadLink.textContent = `Download Page ${i + 1}`;
      downloadLink.href = url;
      downloadLink.download = `page_${i + 1}.${format}`;

      outList.appendChild(img);
      outList.appendChild(downloadLink);
    }
  }

  log("PDF → Pages completed.");
};
