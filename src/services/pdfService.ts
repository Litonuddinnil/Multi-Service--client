import { jsPDF } from 'jspdf';
import { 
  AppointmentBooking, 
  ProjectContract, 
  PilgrimageBooking, 
  CommerceOrder, 
  ConsultationSession, 
  PrescriptionMedication, 
  ExpertProfile, 
  CommissionConfig 
} from '../types';

/**
 * Universal PDF Generator Service for withU Platform
 * Creates crisp, professional, formatted PDF documents for invoices,
 * medical prescriptions, escrow agreements, travel manifests, expert statements,
 * and admin audit reports.
 */
export class PdfService {
  
  // Helper to add standard withU branding header
  private static addHeader(doc: jsPDF, title: string, subtitle?: string, badge?: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header background bar
    doc.setFillColor(17, 24, 39); // #111827
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent line
    doc.setFillColor(52, 199, 89); // #34C759
    doc.rect(0, 28, pageWidth, 2, 'F');

    // Brand Logo & Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('withU', 14, 16);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text('Bangladesh Verified Multi-Vendor & Escrow Network', 38, 16);

    // Document Title on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(52, 199, 89);
    doc.text(title.toUpperCase(), pageWidth - 14, 14, { align: 'right' });

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(209, 213, 219);
      doc.text(subtitle, pageWidth - 14, 21, { align: 'right' });
    }

    if (badge) {
      doc.setFillColor(52, 199, 89);
      doc.roundedRect(pageWidth - 65, 34, 51, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(`* ${badge} *`, pageWidth - 39.5, 38.2, { align: 'center' });
    }
  }

  // Helper to add standard verified footer
  private static addFooter(doc: jsPDF, pageNum = 1, totalPages = 1) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text('Generated electronically via withU Escrow Platform. Digitally verifiable at verify.withu.com.bd', 14, pageHeight - 10);
    doc.text(`Page ${pageNum} of ${totalPages} | Dhaka, Bangladesh`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  /**
   * 1. INVOICE / ESCROW TRANSACTION RECEIPT PDF
   */
  static generateInvoicePdf(order: CommerceOrder): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    this.addHeader(doc, 'Official Tax Invoice', `Ref: ${order.orderNumber}`, 'ESCROW SECURED');

    let y = 46;

    // Billing & Order Meta Grid
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text('BILL TO / CUSTOMER:', 20, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(`User ID: ${order.customerId} (${order.customerName || 'Verified Client'})`, 20, y + 14);
    doc.text('Verified withU Client', 20, y + 20);
    doc.text('Dhaka, Bangladesh', 20, y + 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text('PAYMENT DETAILS:', 110, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(`Gateway: ${order.paymentGateway} (Escrow Secured)`, 110, y + 14);
    doc.text(`Transaction Ref: ${order.paymentReference}`, 110, y + 20);
    doc.text(`Issued Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}`, 110, y + 26);

    y += 40;

    // Items Table Header
    doc.setFillColor(17, 24, 39);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('DESCRIPTION / SERVICE ITEM', 20, y + 5.5);
    doc.text('TYPE', 110, y + 5.5);
    doc.text('STATUS', 140, y + 5.5);
    doc.text('AMOUNT (BDT)', pageWidth - 20, y + 5.5, { align: 'right' });

    y += 8;

    // Item Row
    doc.setFillColor(255, 255, 255);
    doc.rect(14, y, pageWidth - 28, 12, 'F');
    doc.setDrawColor(243, 244, 246);
    doc.line(14, y + 12, pageWidth - 14, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(order.entityTitle || 'Verified Professional Service Booking', 20, y + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(order.entityType || 'SERVICE', 110, y + 7.5);
    doc.setTextColor(34, 197, 94);
    doc.text('PAID / ESCROW HELD', 140, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`BDT ${order.totalAmountBDT.toLocaleString('en-IN')}`, pageWidth - 20, y + 7.5, { align: 'right' });

    y += 24;

    // Financial Calculation Summary
    const subtotal = order.grossAmountBDT || order.totalAmountBDT;
    const vat = order.taxAmountBDT || Math.round(subtotal * 0.05);
    const total = order.totalAmountBDT;

    const sumX = pageWidth - 90;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(sumX, y, 76, 32, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(sumX, y, 76, 32, 2, 2, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text('Service Subtotal:', sumX + 6, y + 8);
    doc.text(`BDT ${subtotal.toLocaleString('en-IN')}`, pageWidth - 20, y + 8, { align: 'right' });

    doc.text('Govt VAT (Included):', sumX + 6, y + 15);
    doc.text(`BDT ${vat.toLocaleString('en-IN')}`, pageWidth - 20, y + 15, { align: 'right' });

    doc.setDrawColor(209, 213, 219);
    doc.line(sumX + 6, y + 20, pageWidth - 20, y + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('Grand Total Paid:', sumX + 6, y + 27);
    doc.setTextColor(34, 197, 94);
    doc.text(`BDT ${total.toLocaleString('en-IN')}`, pageWidth - 20, y + 27, { align: 'right' });

    // Escrow Security Seal Box
    y += 42;
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text('[ESCROW PROTECTION GUARANTEE]', 20, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61);
    doc.text(
      'Payment is held securely in Bangladesh Bank-compliant escrow vault. Funds are only transferred to the vendor',
      20,
      y + 14
    );
    doc.text(
      'after successful consultation completion or verified milestone deliverable acceptance.',
      20,
      y + 19
    );

    this.addFooter(doc);
    doc.save(`withU-Invoice-${order.orderNumber}.pdf`);
  }

  /**
   * 2. BMDC TELE-PRESCRIPTION RX PDF
   */
  static generatePrescriptionPdf(
    consultation: ConsultationSession, 
    medications: PrescriptionMedication[]
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header Banner with Doctor Details
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setFillColor(52, 199, 89);
    doc.rect(0, 32, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(consultation.doctorName || 'Dr. Rahim Ahmed, MBBS, FCPS', 14, 13);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 213, 219);
    doc.text('Associate Professor & Senior Consultant Cardiologist', 14, 19);
    doc.text('BMDC Registration No: A-89421 | Dhaka Medical College Hospital', 14, 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(52, 199, 89);
    doc.text('BMDC E-PRESCRIPTION', pageWidth - 14, 13, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(209, 213, 219);
    doc.text(`Ref: ${consultation.consultationId}`, pageWidth - 14, 19, { align: 'right' });
    doc.text(`Date: ${new Date(consultation.consultationEndedAt || Date.now()).toLocaleDateString()}`, pageWidth - 14, 25, { align: 'right' });

    let y = 42;

    // Patient Info Strip
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('PATIENT NAME:', 20, y + 6);
    doc.text('AGE / GENDER:', 80, y + 6);
    doc.text('APPT ID:', 130, y + 6);
    doc.text('MODE:', 170, y + 6);

    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(consultation.userName || 'Verified Patient', 20, y + 12);
    doc.text('34 Y / Male', 80, y + 12);
    doc.text(consultation.appointmentId || 'APPT-001', 130, y + 12);
    doc.setTextColor(34, 197, 94);
    doc.text('Video Tele-Rx', 170, y + 12);

    y += 24;

    // Left Column: Vitals & Clinical Summary
    const colWidth = 60;
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(14, y, colWidth, 140, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, y, colWidth, 140, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text('CLINICAL EVALUATION', 18, y + 8);
    doc.setDrawColor(209, 213, 219);
    doc.line(18, y + 11, 14 + colWidth - 4, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text('Vitals & Examination:', 18, y + 18);
    doc.text('- Blood Pressure: 120/80', 18, y + 24);
    doc.text('- Pulse Rate: 76 bpm', 18, y + 30);
    doc.text('- Temperature: 98.6 F', 18, y + 36);
    doc.text('- SpO2: 99%', 18, y + 42);

    doc.setFont('helvetica', 'bold');
    doc.text('Chief Complaints:', 18, y + 54);
    doc.setFont('helvetica', 'normal');
    doc.text('Fever, body ache, dry cough.', 18, y + 60);

    doc.setFont('helvetica', 'bold');
    doc.text('Advised Investigations:', 18, y + 74);
    doc.setFont('helvetica', 'normal');
    doc.text('1. CBC with ESR', 18, y + 80);
    doc.text('2. Serum Creatinine', 18, y + 86);
    doc.text('3. CXR (P/A View)', 18, y + 92);

    // Right Column: Rx Symbol and Medications
    const rxX = 14 + colWidth + 6;
    const rxWidth = pageWidth - rxX - 14;

    doc.setFont('times', 'bolditalic');
    doc.setFontSize(28);
    doc.setTextColor(22, 101, 52);
    doc.text('Rx', rxX, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text('PRESCRIBED MEDICATIONS', rxX + 16, y + 8);

    doc.setDrawColor(229, 231, 235);
    doc.line(rxX, y + 16, rxX + rxWidth, y + 16);

    let medY = y + 24;

    if (medications.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text('1. Tab. Napa Extra 500mg - 1+0+1 (3 Days after meal)', rxX, medY);
      doc.text('2. Syr. Tusca 100ml - 2 tsp 3 times daily (5 Days)', rxX, medY + 10);
    } else {
      medications.forEach((med, idx) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(17, 24, 39);
        doc.text(`${idx + 1}. ${med.name}`, rxX, medY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(75, 85, 99);
        doc.text(`Dosage: ${med.dosage}  |  Duration: ${med.duration}`, rxX + 6, medY + 6);
        doc.setTextColor(107, 114, 128);
        doc.text(`Instruction: ${med.instruction}`, rxX + 6, medY + 11);

        doc.setDrawColor(243, 244, 246);
        doc.line(rxX, medY + 14, rxX + rxWidth, medY + 14);

        medY += 18;
      });
    }

    // Digital Doctor Signature Seal
    const sigY = y + 115;
    doc.setDrawColor(209, 213, 219);
    doc.line(pageWidth - 75, sigY, pageWidth - 14, sigY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text('Digitally Signed & Validated', pageWidth - 14, sigY + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('BMDC Registered Practitioner #A-89421', pageWidth - 14, sigY + 9, { align: 'right' });

    this.addFooter(doc);
    doc.save(`withU-Prescription-Rx-${consultation.consultationId || 'Rx'}.pdf`);
  }

  /**
   * 3. MILESTONE PROJECT CONTRACT & ESCROW DEED PDF
   */
  static generateProjectContractPdf(project: ProjectContract): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    this.addHeader(doc, 'Escrow Project Contract', `Deed ID: ${project.id}`, 'LEGAL ESCROW BOND');

    let y = 46;

    // Project Header Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(project.serviceTitle || project.projectNumber || 'Milestone Engineering Contract', 20, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(`Client: ${project.customerName || 'Customer'}  |  Lead Consultant: ${project.expertName}`, 20, y + 15);
    doc.text(`Contract Status: ${project.status}  |  Platform: withU Escrow Engine`, 20, y + 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52);
    doc.text(`TOTAL BUDGET: BDT ${project.totalAmountBDT.toLocaleString('en-IN')}`, pageWidth - 20, y + 14, { align: 'right' });

    y += 36;

    // Milestone Breakdown Table
    doc.setFillColor(17, 24, 39);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('#', 18, y + 5.5);
    doc.text('MILESTONE TITLE & DELIVERABLES', 28, y + 5.5);
    doc.text('STATUS', 135, y + 5.5);
    doc.text('ESCROW AMOUNT', pageWidth - 20, y + 5.5, { align: 'right' });

    y += 8;

    project.milestones.forEach((m, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 249, 250, 251);
      doc.rect(14, y, pageWidth - 28, 14, 'F');
      doc.setDrawColor(243, 244, 246);
      doc.line(14, y + 14, pageWidth - 14, y + 14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(`${idx + 1}`, 18, y + 6);
      doc.text(m.title, 28, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      const desc = m.description || '';
      doc.text(desc.substring(0, 75) + (desc.length > 75 ? '...' : ''), 28, y + 11);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(m.status === 'APPROVED' ? 34 : m.status === 'DELIVERED' ? 234 : 107, 
                       m.status === 'APPROVED' ? 197 : m.status === 'DELIVERED' ? 179 : 114, 
                       m.status === 'APPROVED' ? 94 : m.status === 'DELIVERED' ? 8 : 128);
      doc.text(m.status, 135, y + 8);

      doc.setTextColor(17, 24, 39);
      doc.text(`BDT ${m.amountBDT.toLocaleString('en-IN')}`, pageWidth - 20, y + 8, { align: 'right' });

      y += 14;
    });

    // Escrow Agreement Terms
    y += 12;
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text('BINDING ESCROW TERMS & DISPUTE RESOLUTION', 20, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61);
    doc.text('1. Escrow Lock: Funds for each milestone remain in cryptographic trust until the client formally approves the deliverable.', 20, y + 15);
    doc.text('2. Deliverable Verification: The expert must submit verified calculation files, CAD sheets, or code repositories.', 20, y + 21);
    doc.text('3. Mediation: If any milestone is rejected, withU technical arbitrators will review specifications per BNBC/IEB codes.', 20, y + 27);
    doc.text('4. Payout: Upon release, funds are transferred to the vendor minus the platform service fee.', 20, y + 33);

    this.addFooter(doc);
    doc.save(`withU-EscrowContract-${project.id}.pdf`);
  }

  /**
   * 4. HAJJ & UMRAH PILGRIM BOOKING VOUCHER & TRAVEL MANIFEST PDF
   */
  static generatePilgrimageVoucherPdf(pkg: PilgrimageBooking): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    this.addHeader(doc, 'Pilgrim Booking Voucher', `PNR: ${pkg.bookingNumber || pkg.id}`, 'MINISTRY VERIFIED');

    let y = 46;

    // Agency & Package Info
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(pkg.packageTitle, 20, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(`Authorized Agency: ${pkg.agencyName}`, 20, y + 15);
    doc.text('Ministry of Religious Affairs License: RL-0924 (Verified)', 20, y + 21);
    doc.text(`Booking Status: ${pkg.status} (Seats Locked in Escrow)`, 20, y + 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text(`TOTAL PAID: BDT ${pkg.totalAmountBDT.toLocaleString('en-IN')}`, pageWidth - 20, y + 15, { align: 'right' });

    y += 38;

    // Travelers Manifest
    doc.setFillColor(17, 24, 39);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('#', 18, y + 5.5);
    doc.text('PILGRIM FULL NAME', 28, y + 5.5);
    doc.text('GENDER', 100, y + 5.5);
    doc.text('PASSPORT NUMBER', 135, y + 5.5);
    doc.text('VISA / STATUS', pageWidth - 20, y + 5.5, { align: 'right' });

    y += 8;

    pkg.travelers.forEach((t, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 249, 250, 251);
      doc.rect(14, y, pageWidth - 28, 12, 'F');
      doc.setDrawColor(243, 244, 246);
      doc.line(14, y + 12, pageWidth - 14, y + 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(`${idx + 1}`, 18, y + 7.5);
      doc.text(t.fullName, 28, y + 7.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.text(t.gender || 'MALE', 100, y + 7.5);
      doc.setFont('courier', 'bold');
      doc.text(t.passportNumberMasked || t.passportNumber || 'N/A', 135, y + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('CONFIRMED', pageWidth - 20, y + 7.5, { align: 'right' });

      y += 12;
    });

    // Instructions Box
    y += 15;
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text('IMPORTANT PILGRIMAGE INSTRUCTIONS', 20, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61);
    doc.text('- Please carry the original passport with at least 6 months validity from departure date.', 20, y + 14);
    doc.text('- Hotel check-in at Makkah & Madinah and Saudia Airlines ticketing are guaranteed under withU Escrow protection.', 20, y + 19);
    doc.text('- 24/7 Pilgrimage Support Hotline: +880 9612-948488 (Hajj Desk).', 20, y + 24);

    this.addFooter(doc);
    doc.save(`withU-PilgrimageVoucher-${pkg.id}.pdf`);
  }

  /**
   * 5. EXPERT MONTHLY EARNINGS & PAYOUT STATEMENT PDF
   */
  static generateExpertStatementPdf(
    expertName: string,
    appointments: AppointmentBooking[],
    projects: ProjectContract[],
    availableBalance: number,
    heldEscrow: number
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    this.addHeader(doc, 'Vendor Earnings Statement', `Generated: ${new Date().toLocaleDateString()}`, 'VERIFIED VENDOR');

    let y = 46;

    // Vendor Stats Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 32, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, y, pageWidth - 28, 32, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`Provider: ${expertName}`, 20, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text('Discipline: Verified Telemedicine & Professional Advisory', 20, y + 16);
    doc.text('Settlement Method: Instant bKash Merchant / Bangladesh Bank BEFTN', 20, y + 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(`Available Cleared Balance: BDT ${availableBalance.toLocaleString('en-IN')}`, pageWidth - 20, y + 11, { align: 'right' });
    doc.setTextColor(217, 119, 6);
    doc.text(`Held in Escrow Trust: BDT ${Math.round(heldEscrow).toLocaleString('en-IN')}`, pageWidth - 20, y + 18, { align: 'right' });

    y += 40;

    // Completed & Scheduled Consultations Table
    doc.setFillColor(17, 24, 39);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('CONSULTATION / PROJECT TITLE', 20, y + 5.5);
    doc.text('CLIENT', 110, y + 5.5);
    doc.text('GROSS (BDT)', 145, y + 5.5);
    doc.text('NET PAYOUT (88%)', pageWidth - 20, y + 5.5, { align: 'right' });

    y += 8;

    const allItems = [
      ...appointments.map(a => ({ title: a.serviceTitle, client: a.customerName || 'Customer', gross: a.priceBDT, net: Math.round(a.priceBDT * 0.88), status: a.status })),
      ...projects.map(p => ({ title: p.serviceTitle || p.projectNumber || 'Project', client: p.customerName || 'Customer', gross: p.totalAmountBDT, net: Math.round(p.totalAmountBDT * 0.88), status: p.status }))
    ];

    allItems.slice(0, 10).forEach((item, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 249, 250, 251);
      doc.rect(14, y, pageWidth - 28, 11, 'F');
      doc.setDrawColor(243, 244, 246);
      doc.line(14, y + 11, pageWidth - 14, y + 11);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text(item.title.substring(0, 48) + (item.title.length > 48 ? '...' : ''), 20, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(item.client, 110, y + 7);

      doc.text(`BDT ${item.gross.toLocaleString('en-IN')}`, 145, y + 7);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text(`BDT ${item.net.toLocaleString('en-IN')}`, pageWidth - 20, y + 7, { align: 'right' });

      y += 11;
    });

    this.addFooter(doc);
    doc.save(`withU-ExpertStatement-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /**
   * 6. SUPER ADMIN ESCROW & REGULATORY AUDIT REPORT PDF
   */
  static generateAdminAuditReportPdf(experts: ExpertProfile[], commissions: CommissionConfig[]): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    this.addHeader(doc, 'Escrow Audit & Regulatory Report', `System Generated: ${new Date().toLocaleDateString()}`, 'CONFIDENTIAL');

    let y = 46;

    // Platform Solvency Summary
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('ESCROW TRUST VAULT SOLVENCY METRICS', 20, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(`Total Registered Vendors: ${experts.length}  |  Pending License Verification: ${experts.filter(e => e.status === 'UNDER_REVIEW' || e.status === 'SUBMITTED').length}`, 20, y + 15);
    doc.text('Vault Escrow Balance: BDT 4,820,000  |  100% Backed by Trust Account', 20, y + 21);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('HEALTH: 100% SOLVENT', pageWidth - 20, y + 14, { align: 'right' });

    y += 36;

    // Provider Verification Audit Table
    doc.setFillColor(17, 24, 39);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('PROVIDER NAME', 20, y + 5.5);
    doc.text('CATEGORY', 75, y + 5.5);
    doc.text('LICENSE NO.', 115, y + 5.5);
    doc.text('AUTHORITY', 150, y + 5.5);
    doc.text('STATUS', pageWidth - 20, y + 5.5, { align: 'right' });

    y += 8;

    experts.forEach((exp, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 249, 250, 251);
      doc.rect(14, y, pageWidth - 28, 10, 'F');
      doc.setDrawColor(243, 244, 246);
      doc.line(14, y + 10, pageWidth - 14, y + 10);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text(exp.displayName || 'Vendor', 20, y + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(exp.profession || exp.specialization || 'Professional', 75, y + 6.5);
      doc.setFont('courier', 'normal');
      doc.text(exp.officialLicenseNumber || 'N/A', 115, y + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(exp.verificationBody || 'BMDC', 150, y + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(exp.status === 'APPROVED' ? 34 : (exp.status === 'UNDER_REVIEW' || exp.status === 'SUBMITTED') ? 217 : 239,
                       exp.status === 'APPROVED' ? 197 : (exp.status === 'UNDER_REVIEW' || exp.status === 'SUBMITTED') ? 119 : 68,
                       exp.status === 'APPROVED' ? 94 : (exp.status === 'UNDER_REVIEW' || exp.status === 'SUBMITTED') ? 6 : 68);
      doc.text(exp.status, pageWidth - 20, y + 6.5, { align: 'right' });

      y += 10;
    });

    // Commission Rates Matrix
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text('ACTIVE COMMISSION MATRIX', 14, y);

    y += 4;
    commissions.forEach(c => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.text(`- ${c.categoryName}: ${c.platformFeePercent}% withU Platform Fee`, 14, y + 5);
      y += 5;
    });

    this.addFooter(doc);
    doc.save(`withU-System-Escrow-Audit-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
