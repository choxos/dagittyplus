import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./icons";

interface ModalProps {
  title: string;
  width?: number;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, width = 480, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,20,32,.45)" }}
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-panel border border-line rounded-[16px] p-6 max-w-full max-h-[88vh] overflow-auto"
        style={{ width, boxShadow: "0 24px 60px -20px rgba(0,0,0,.5)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans font-bold text-[17px] text-text">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-[30px] h-[30px] rounded-lg border border-line bg-bg text-dim cursor-pointer flex items-center justify-center hover:text-text transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
