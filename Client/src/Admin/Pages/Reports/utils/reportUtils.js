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
    // Chỉ lấy đúng phần tử báo cáo doanh thu khi reportId là 'revenue'
    let element = document.getElementById(`${reportId}-report`);
    if (!element) {
      alert(`Không tìm thấy phần tử báo cáo với id: ${reportId}-report. Vui lòng kiểm tra lại giao diện báo cáo.`);
      if (setExportLoading) setExportLoading(false);
      return;
    }
    
    // Apply a temporary style to replace oklch colors with standard RGB
    const tempStyle = document.createElement('style');
    tempStyle.innerHTML = `
      * {
        color-scheme: light !important;
        color: black !important;
        background-color: white !important;
        border-color: #e5e7eb !important;
      }
      .bg-green-50 { background-color: #f0fdf4 !important; }
      .bg-blue-50 { background-color: #eff6ff !important; }
      .bg-yellow-50 { background-color: #fefce8 !important; }
      .bg-purple-50 { background-color: #faf5ff !important; }
      .bg-green-100 { background-color: #dcfce7 !important; }
      .bg-blue-100 { background-color: #dbeafe !important; }
      .bg-yellow-100 { background-color: #fef9c3 !important; }
      .bg-purple-100 { background-color: #f3e8ff !important; }
      .text-green-600 { color: #16a34a !important; }
      .text-blue-600 { color: #2563eb !important; }
      .text-yellow-600 { color: #ca8a04 !important; }
      .text-purple-600 { color: #9333ea !important; }
    `;
    document.head.appendChild(tempStyle);
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      removeContainer: true,
      // Ignore CSS color functions that aren't supported
      onclone: (clonedDoc) => {
        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const bgColor = style.backgroundColor;
          const color = style.color;
          
          // Replace any oklch colors with standard colors
          if (bgColor.includes('oklch')) {
            el.style.backgroundColor = '#ffffff';
          }
          if (color.includes('oklch')) {
            el.style.color = '#000000';
          }
        });
      }
    });
    
    // Remove the temporary style
    document.head.removeChild(tempStyle);
    
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
    
    // Tạo tên file với ngày giờ hiện tại để tránh trùng lặp
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `bao-cao-${reportId}-${dateStr}-${timeStr}.pdf`;
    const filePath = `D:/LUANVANTOTNGHIEP/${fileName}`;
    
    // Lưu file vào đường dẫn chỉ định
    try {
      // Trong môi trường web, không thể trực tiếp lưu vào đường dẫn hệ thống
      // Thay vào đó, chúng ta tạo một tải xuống cho người dùng
      pdf.save(fileName);
      
      // Hiển thị thông báo cho người dùng
      alert(`Báo cáo đã được tạo thành công!\nVui lòng lưu file vào thư mục D:/LUANVANTOTNGHIEP`);
    } catch (saveError) {
      console.error('Lỗi khi lưu file PDF:', saveError);
      // Fallback: Lưu file với phương thức mặc định
      pdf.save(fileName);
    }
    
    console.log(`PDF export of ${reportId} report completed`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    // Hiển thị thông báo lỗi cho người dùng
    alert(`Có lỗi khi xuất báo cáo PDF: ${error.message}`);
  } finally {
    if (setExportLoading) setExportLoading(false);
  }
};

// Export report data to Excel
export const exportToExcel = (reportId, setExportLoading) => {
  if (setExportLoading) setExportLoading(true);
  
  try {
    // Thử lấy phần tử báo cáo, nếu không có thì lấy toàn bộ nội dung trang
    let dashboardElement = document.getElementById(`${reportId}-report`);
    if (!dashboardElement) {
      console.log(`Phần tử có ID "${reportId}-report" không tìm thấy, sử dụng nội dung trang hiện tại`);
      // Sử dụng phần tử chính của trang báo cáo
      dashboardElement = document.querySelector('.MuiCard-root') || document.body;
    }
    
    // Extract data from the dashboard
    const data = [];
    
    // Get revenue data
    const revenueChart = dashboardElement.querySelector('.recharts-surface');
    if (revenueChart) {
      const revenueData = {
        title: 'Doanh thu theo thời gian',
        data: []
      };
      
      // Try to extract data from chart
      const chartLabels = dashboardElement.querySelectorAll('.recharts-cartesian-axis-tick-value');
      chartLabels.forEach((label, index) => {
        if (index < chartLabels.length / 2) { // Only process X-axis labels
          revenueData.data.push({
            'Ngày': label.textContent,
            'Doanh thu': 'Xem biểu đồ chi tiết'
          });
        }
      });
      
      data.push(revenueData);
    }
    
    // Get top products data
    const productsTable = dashboardElement.querySelector('table');
    if (productsTable) {
      const topProducts = {
        title: 'Top sản phẩm bán chạy',
        data: []
      };
      
      // Get table headers
      const headers = [];
      const headerCells = productsTable.querySelectorAll('thead th');
      headerCells.forEach(cell => {
        headers.push(cell.textContent.trim());
      });
      
      // Get table rows
      const rows = productsTable.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const rowData = {};
        const cells = row.querySelectorAll('td');
        
        cells.forEach((cell, index) => {
          if (headers[index]) {
            rowData[headers[index]] = cell.textContent.trim();
          }
        });
        
        if (Object.keys(rowData).length > 0) {
          topProducts.data.push(rowData);
        }
      });
      
      data.push(topProducts);
    }
    
    // Extract summary data
    const statCards = dashboardElement.querySelectorAll('.bg-green-50, .bg-blue-50, .bg-yellow-50, .bg-purple-50');
    const summaryData = {
      title: 'Tổng quan',
      data: []
    };
    
    statCards.forEach(card => {
      const title = card.querySelector('p')?.textContent;
      const value = card.querySelector('h3')?.textContent;
      
      if (title && value) {
        summaryData.data.push({
          'Chỉ số': title,
          'Giá trị': value
        });
      }
    });
    
    data.push(summaryData);
    
    // Create a workbook with multiple sheets
    const wb = utils.book_new();
    
    // Add each section as a separate sheet
    data.forEach(section => {
      if (section.data && section.data.length > 0) {
        const ws = utils.json_to_sheet(section.data);
        utils.book_append_sheet(wb, ws, section.title);
      }
    });
    
    // Tạo tên file với ngày giờ hiện tại để tránh trùng lặp
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `bao-cao-${reportId}-${dateStr}-${timeStr}.xlsx`;
    const filePath = `D:/LUANVANTOTNGHIEP/${fileName}`;
    
    // Lưu file vào đường dẫn chỉ định
    try {
      // Trong môi trường web, không thể trực tiếp lưu vào đường dẫn hệ thống
      // Thay vào đó, chúng ta tạo một tải xuống cho người dùng
      writeFile(wb, fileName);
      
      // Hiển thị thông báo cho người dùng
      alert(`Báo cáo Excel đã được tạo thành công!\nVui lòng lưu file vào thư mục D:/LUANVANTOTNGHIEP`);
    } catch (saveError) {
      console.error('Lỗi khi lưu file Excel:', saveError);
      // Fallback: Lưu file với phương thức mặc định
      writeFile(wb, fileName);
    }
    
    console.log(`Excel export of ${reportId} data completed`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    // Hiển thị thông báo lỗi cho người dùng
    alert(`Có lỗi khi xuất báo cáo Excel: ${error.message}`);
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