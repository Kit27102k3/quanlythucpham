/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "../index.css";

export default function Pagination({
  totalRecords = 1,
  rowsPerPageOptions = [10],
  onPageChange,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(rowsPerPageOptions?.[0] || 10);

  const totalPages =
    rowsPerPage > 0 ? Math.ceil(totalRecords / rowsPerPage) : 1;
    
  // Reset to page 1 when totalRecords changes
  useEffect(() => {
    setCurrentPage(1);
  }, [totalRecords]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);

    if (typeof onPageChange === "function") {
      onPageChange({ page: newPage, rows: rowsPerPage });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the beginning
      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, 4);
      }
      
      // Adjust if we're at the end
      if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden shadow-sm">
        <button
          className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border-r border-gray-300 focus:outline-none"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          «
        </button>
        <button
          className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border-r border-gray-300 focus:outline-none"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        {getPageNumbers().map((pageNum, index) => (
          pageNum === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 bg-white text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              className={`px-3 py-2 ${
                currentPage === pageNum
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              } border-r border-gray-300 focus:outline-none min-w-[40px]`}
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </button>
          )
        ))}

        <button
          className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border-r border-gray-300 focus:outline-none"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 focus:outline-none"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          »
        </button>
      </div>
      
      <div className="ml-4 text-sm text-gray-600">
        {totalRecords > 0 ? (
          <span>
            Trang {currentPage} / {totalPages} ({totalRecords} đơn hàng)
          </span>
        ) : (
          <span>Không có đơn hàng</span>
        )}
      </div>
    </div>
  );
}
