import React, { useState } from "react";
import "../index.css";

export default function Pagination({
  totalRecords = 1,
  rowsPerPageOptions = [10],
  onPageChange,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions?.[0] || 10);

  const totalPages =
    rowsPerPage > 0 ? Math.ceil(totalRecords / rowsPerPage) : 1;

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);

    if (typeof onPageChange === "function") {
      onPageChange({ page: newPage, rows: rowsPerPage });
    }
  };

  const handleRowsChange = (event) => {
    const newRows = parseInt(event.target.value, 10);
    setRowsPerPage(newRows);
    setCurrentPage(1);

    if (typeof onPageChange === "function") {
      onPageChange({ page: 1, rows: newRows });
    }
  };

  return (
    <div className="pagination-container">
      <button
        className="page-btn"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
      >
        «
      </button>
      <button
        className="page-btn"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </button>

      {[...Array(totalPages)].map((_, index) => (
        <button
          key={index + 1}
          className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
          onClick={() => handlePageChange(index + 1)}
        >
          {index + 1}
        </button>
      ))}

      <button
        className="page-btn"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
      <button
        className="page-btn"
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        »
      </button>

      <select
        className="rows-select"
        value={rowsPerPage}
        onChange={handleRowsChange}
      >
        {rowsPerPageOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
