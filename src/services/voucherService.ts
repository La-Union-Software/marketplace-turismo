import { Booking } from '@/types';

/**
 * Voucher Service for generating PDF vouchers
 * 
 * Note: This service requires jsPDF to be installed
 * Run: npm install jspdf
 */

interface VoucherData {
  booking: Booking;
  type: 'client' | 'publisher';
}

class VoucherService {
  /**
   * Generate a PDF voucher for a booking
   */
  async generateVoucher(data: VoucherData): Promise<void> {
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const { booking, type } = data;
      
      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;
      
      // Helper function to add text
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        if (align === 'center') {
          doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
        } else if (align === 'right') {
          doc.text(text, pageWidth - margin, yPosition, { align: 'right' });
        } else {
          doc.text(text, margin, yPosition);
        }
        yPosition += 7;
      };
      
      const addSpace = (space: number = 5) => {
        yPosition += space;
      };
      
      const addLine = () => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      };
      
      // Header
      doc.setFillColor(139, 69, 19); // Primary brown
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      yPosition = 15;
      addText('VOUCHER DE RESERVA', 20, true, 'center');
      yPosition = 28;
      addText('MKT Turismo', 12, false, 'center');
      
      doc.setTextColor(0, 0, 0);
      yPosition = 50;
      
      // Booking ID and Status
      addText(`Reserva #${booking.id.substring(0, 8).toUpperCase()}`, 14, true);
      
      // Status badge
      const statusText = this.getStatusText(booking.status);
      const statusColor = this.getStatusColor(booking.status);
      doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
      doc.roundedRect(margin, yPosition - 5, 40, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(statusText, margin + 20, yPosition, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPosition += 10;
      
      addSpace(5);
      addLine();
      addSpace(5);
      
      // Service Information
      addText('INFORMACIÓN DEL SERVICIO', 14, true);
      addSpace(3);
      addText(`Servicio: ${booking.post.title}`, 11);
      addText(`Categoría: ${booking.post.category}`, 11);
      addText(`Ubicación: ${booking.post.location}`, 11);
      
      addSpace(5);
      addLine();
      addSpace(5);
      
      // Dates and Guests
      addText('DETALLES DE LA RESERVA', 14, true);
      addSpace(3);
      addText(`Fecha de inicio: ${this.formatDate(booking.startDate)}`, 11);
      addText(`Fecha de fin: ${this.formatDate(booking.endDate)}`, 11);
      addText(`Número de huéspedes: ${booking.guestCount}`, 11);
      
      addSpace(5);
      addLine();
      addSpace(5);
      
      // Contact Information - varies by voucher type
      if (type === 'client') {
        // Show publisher/owner contact info for client
        addText('INFORMACIÓN DEL PRESTADOR', 14, true);
        addSpace(3);
        if (booking.owner) {
          addText(`Nombre: ${booking.owner.name}`, 11);
          addText(`Email: ${booking.owner.email}`, 11);
          if (booking.owner.phone) {
            addText(`Teléfono: ${booking.owner.phone}`, 11);
          }
        }
      } else {
        // Show client contact info for publisher
        addText('INFORMACIÓN DEL CLIENTE', 14, true);
        addSpace(3);
        addText(`Nombre: ${booking.clientData.name}`, 11);
        addText(`Email: ${booking.clientData.email}`, 11);
        addText(`Teléfono: ${booking.clientData.phone}`, 11);
        if (booking.clientData.notes) {
          addSpace(3);
          addText('Notas adicionales:', 11, true);
          addText(booking.clientData.notes, 10);
        }
      }
      
      addSpace(5);
      addLine();
      addSpace(5);
      
      // Payment Information
      addText('INFORMACIÓN DE PAGO', 14, true);
      addSpace(3);
      addText(`Total: ${this.formatCurrency(booking.totalAmount, booking.currency)}`, 12, true);
      addText(`Estado de pago: ${booking.status === 'paid' ? 'Pagado' : 'Pendiente'}`, 11);
      
      if (booking.paidAt) {
        addText(`Fecha de pago: ${this.formatDate(booking.paidAt)}`, 11);
      }
      
      if (booking.paymentData) {
        addText(`Método de pago: ${booking.paymentData.method || 'N/A'}`, 11);
      }
      
      addSpace(10);
      addLine();
      addSpace(5);
      
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      yPosition = doc.internal.pageSize.getHeight() - 30;
      addText(`Generado el: ${new Date().toLocaleString('es-ES')}`, 9, false, 'center');
      yPosition += 5;
      addText('Este documento es un comprobante de su reserva', 9, false, 'center');
      yPosition += 5;
      addText('MKT Turismo - Plataforma de Turismo Argentina', 9, false, 'center');
      
      // Generate filename
      const filename = `voucher_${type}_${booking.id.substring(0, 8)}_${Date.now()}.pdf`;
      
      // Download the PDF
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating voucher:', error);
      throw new Error('Error al generar el voucher. Por favor, intenta nuevamente.');
    }
  }
  
  /**
   * Get status text in Spanish
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'requested': 'Solicitada',
      'accepted': 'Aceptada',
      'declined': 'Rechazada',
      'pending_payment': 'Pago Pendiente',
      'paid': 'Pagada',
      'cancelled': 'Cancelada',
      'completed': 'Completada'
    };
    return statusMap[status] || status;
  }
  
  /**
   * Get status color
   */
  private getStatusColor(status: string): { r: number; g: number; b: number } {
    const colorMap: Record<string, { r: number; g: number; b: number }> = {
      'requested': { r: 59, g: 130, b: 246 }, // blue
      'accepted': { r: 34, g: 197, b: 94 }, // green
      'declined': { r: 239, g: 68, b: 68 }, // red
      'pending_payment': { r: 245, g: 158, b: 11 }, // amber
      'paid': { r: 16, g: 185, b: 129 }, // emerald
      'cancelled': { r: 107, g: 114, b: 128 }, // gray
      'completed': { r: 139, g: 92, b: 246 } // purple
    };
    return colorMap[status] || { r: 107, g: 114, b: 128 };
  }
  
  /**
   * Format date
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

export const voucherService = new VoucherService();
export default VoucherService;
