import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface DashboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  isSubmitting?: boolean;
}

export function DashboardDrawer({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  icon, 
  children,
  primaryActionLabel = "Close Panel",
  onPrimaryAction,
  isSubmitting = false
}: DashboardDrawerProps) {
  // Prevent scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[500px] flex-col bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.05)] border-l border-slate-100"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="relative px-8 pt-10 pb-6 border-b border-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {icon && (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50">
                        <span className="material-symbols-outlined text-[22px]">{icon}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold tracking-tight text-slate-900 leading-none">{title}</h3>
                      {description && (
                        <p className="text-[11px] font-medium text-slate-500 mt-2 leading-relaxed max-w-[280px]">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 pt-24">
                {children}
              </div>
 
              {/* Footer */}
              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-[10px] font-bold normal-case  text-slate-400 hover:text-slate-900 transition-all disabled:opacity-50"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={onPrimaryAction || onClose}
                  disabled={isSubmitting}
                  className="flex-1 max-w-[180px] rounded-xl bg-blue-600 py-3 text-[10px] font-bold normal-case  text-white transition-all hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-[0.98] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isSubmitting ? "Processing..." : primaryActionLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
