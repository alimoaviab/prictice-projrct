import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";

interface TimetableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function TimetableDrawer({ isOpen, onClose, title, description, children }: TimetableDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop with extreme glassmorphism */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[100] transition-opacity duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer Panel - Ultra Premium */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-[540px] bg-white z-[101] shadow-[0_0_100px_rgba(0,0,0,0.15)] transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full relative">
          {/* Header with gradient subtle glow */}
          <div className="relative px-8 py-10 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
            
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{title}</h2>
              <button 
                onClick={onClose}
                className="h-11 w-11 flex items-center justify-center rounded-[1.25rem] bg-blue-50 text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-all duration-300 active:scale-90"
              >
                <X className="h-6 w-6 stroke-[3px]" />
              </button>
            </div>
            {description && (
              <p className="text-[11px] font-black text-blue-600/60 uppercase tracking-[0.2em]">{description}</p>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar bg-white">
            <div className="max-w-md mx-auto">
              {children}
            </div>
          </div>

          {/* Footer Branding (Subtle) */}
          <div className="px-8 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Eduplexo Scheduler Engine v2.0</p>
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-blue-100" />
              <div className="h-1 w-1 rounded-full bg-blue-100" />
              <div className="h-1 w-1 rounded-full bg-blue-100" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
