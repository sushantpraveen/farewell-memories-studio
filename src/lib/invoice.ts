// Lightweight helper to generate an invoice PDF using jsPDF loaded from CDN at runtime.
// We avoid bundler dependencies by injecting a script tag when needed.

type JsPDFCtor = new (options?: any) => any;

export interface InvoiceCompany {
  name: string;
  gstin: string;
  cin?: string;
  logoUrl?: string; // optional logo image URL
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  printPrice: number;
  gstRate: number; // e.g., 0.05 for 5%
}

export interface InvoiceMeta {
  invoiceId: string;
  dateISO: string;
  customerName: string;
  customerEmail: string;
  shippingAddress?: string;
}

async function loadJsPDF(): Promise<JsPDFCtor> {
  if ((window as any).jspdf?.jsPDF) {
    return (window as any).jspdf.jsPDF as JsPDFCtor;
  }
  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('jspdf-cdn') as HTMLScriptElement | null;

    if (existing) {
      // Script tag already exists; if it finished loading we resolve immediately.
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }

      // Otherwise wait for the existing script to complete.
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load jsPDF')), { once: true });
      return;
    }

    const s = document.createElement('script');
    s.id = 'jspdf-cdn';
    s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = 'true';
      resolve();
    };
    s.onerror = () => reject(new Error('Failed to load jsPDF'));
    document.body.appendChild(s);
  });

  const jsPdfNamespace = (window as any).jspdf;
  if (!jsPdfNamespace?.jsPDF) {
    throw new Error('jsPDF failed to initialize');
  }

  return jsPdfNamespace.jsPDF as JsPDFCtor;
}

export async function generateInvoicePdfBase64(
  company: InvoiceCompany,
  meta: InvoiceMeta,
  items: InvoiceItem[]
): Promise<string> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const left = 40;
  let y = 50;

  // Logo
  if (company.logoUrl) {
    try {
      const img = await fetch(company.logoUrl).then(r => r.blob());
      const dataUrl = await blobToDataURL(img);
      // 80x80 logo
      doc.addImage(dataUrl, 'PNG', left, y, 60, 60);
    } catch (_) {
      // ignore logo failures
    }
  }

  // Company
  doc.setFontSize(16);
  doc.text(company.name, left + 70, y + 20);
  doc.setFontSize(10);
  doc.text(`GSTIN: ${company.gstin}`, left + 70, y + 38);
  if (company.cin) doc.text(`CIN: ${company.cin}`, left + 70, y + 54);

  // Invoice meta
  y += 90;
  doc.setFontSize(14);
  doc.text('TAX INVOICE', left, y);
  doc.setFontSize(10);
  y += 18;
  doc.text(`Invoice #: ${meta.invoiceId}`, left, y);
  y += 16;
  doc.text(`Date: ${new Date(meta.dateISO).toLocaleString()}`, left, y);
  y += 16;
  doc.text(`Bill To: ${meta.customerName}`, left, y);
  y += 14;
  doc.text(`Email: ${meta.customerEmail}`, left, y);
  if (meta.shippingAddress) { y += 14; doc.text(`Ship To: ${meta.shippingAddress}`, left, y); }

  // Table header
  y += 26;
  doc.setFontSize(11);
  doc.text('Description', left, y);
  doc.text('Qty', 330, y);
  doc.text('Unit', 370, y);
  doc.text('Print', 430, y);
  doc.text('GST', 490, y);
  doc.text('Amount', 540, y);
  y += 8;
  doc.line(left, y, 560, y);

  let subtotal = 0;
  let gstTotal = 0;
  let grand = 0;

  items.forEach((it) => {
    const perItemSubtotal = it.unitPrice + it.printPrice;
    const perItemGst = Math.round(perItemSubtotal * it.gstRate);
    const perItemTotal = perItemSubtotal + perItemGst;
    const lineSubtotal = perItemSubtotal * it.quantity;
    const lineGst = perItemGst * it.quantity;
    const lineTotal = perItemTotal * it.quantity;

    subtotal += lineSubtotal;
    gstTotal += lineGst;
    grand += lineTotal;

    y += 18;
    doc.setFontSize(10);
    doc.text(it.description, left, y);
    doc.text(String(it.quantity), 330, y, { align: 'right' });
    doc.text(String(it.unitPrice), 400, y, { align: 'right' });
    doc.text(String(it.printPrice), 460, y, { align: 'right' });
    doc.text(`${Math.round(it.gstRate * 100)}%`, 510, y, { align: 'right' });
    doc.text(String(lineTotal), 560, y, { align: 'right' });
  });

  // Totals
  y += 14;
  doc.line(left, y, 560, y);
  y += 18;
  doc.text('Subtotal', 480, y, { align: 'right' });
  doc.text(String(subtotal), 560, y, { align: 'right' });
  y += 16;
  doc.text('GST', 480, y, { align: 'right' });
  doc.text(String(gstTotal), 560, y, { align: 'right' });
  y += 16;
  doc.setFontSize(12);
  doc.text('Total', 480, y, { align: 'right' });
  doc.text(String(grand), 560, y, { align: 'right' });

  const base64 = doc.output('datauristring');
  // Strip the prefix "data:application/pdf;base64,"
  const commaIdx = base64.indexOf(',');
  return base64.substring(commaIdx + 1);
}

export async function downloadInvoice(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


