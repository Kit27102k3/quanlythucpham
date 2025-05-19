import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { utils, writeFile } from 'xlsx';

// Format currency to VND
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(value || 0);
};

// Colors for charts
export const COLORS = [
  '#4ade80', // green
  '#60a5fa', // blue
  '#f97316', // orange
  '#a78bfa', // purple
  '#f87171', // red
  '#fbbf24', // yellow
  '#38bdf8', // sky
  '#fb7185', // rose
  '#34d399', // emerald
  '#a3e635'  // lime
];

// Export report to PDF
export const exportToPDF = async (reportId, setExportLoading) => {
  if (setExportLoading) setExportLoading(true);
  
  try {
    const element = document.getElementById(`${reportId}-report`);
    if (!element) {
      console.error(`Element with ID "${reportId}-report" not found`);
      return;
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`bao-cao-${reportId}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    console.log(`PDF export of ${reportId} report completed`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
  } finally {
    if (setExportLoading) setExportLoading(false);
  }
};

// Export report data to Excel
export const exportToExcel = (data, reportId, setExportLoading) => {
  if (setExportLoading) setExportLoading(true);
  
  try {
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data for Excel export');
      return;
    }
    
    // Create a new workbook
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, `${reportId}`);
    
    // Write to file
    writeFile(wb, `bao-cao-${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    console.log(`Excel export of ${reportId} data completed`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
  } finally {
    if (setExportLoading) setExportLoading(false);
  }
};

// Send report via email
export const sendReportEmail = (reportId, setExportLoading) => {
  if (setExportLoading) setExportLoading(true);
  
  try {
    // In a real application, this would make an API call to send the report
    // For now, we'll just simulate a delay
    setTimeout(() => {
      console.log(`Email with ${reportId} report sent successfully`);
      if (setExportLoading) setExportLoading(false);
      
      // Show success message to user
      alert('Báo cáo đã được gửi qua email thành công!');
    }, 2000);
  } catch (error) {
    console.error('Error sending report email:', error);
    if (setExportLoading) setExportLoading(false);
    
    // Show error message to user
    alert('Có lỗi xảy ra khi gửi báo cáo qua email. Vui lòng thử lại sau.');
  }
}; 