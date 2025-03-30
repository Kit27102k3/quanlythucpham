import { useState } from "react";

export function Dialog({ children, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {children}
        <button
          onClick={onClose}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export function DialogTrigger({ onOpen, children }) {
  return <button onClick={onOpen}>{children}</button>;
}

export function DialogContent({ children }) {
  return <div>{children}</div>;
}

export function DialogHeader({ children }) {
  return <div className="font-bold text-lg">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="text-xl font-semibold">{children}</h2>;
}

export function DialogDescription({ children }) {
  return <p className="text-gray-600">{children}</p>;
}

export function DialogFooter({ children }) {
  return <div className="mt-4">{children}</div>;
}
