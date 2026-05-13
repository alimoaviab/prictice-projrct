import { SelectedChildProvider } from "../../contexts/SelectedChildContext";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SelectedChildProvider>
      {children}
    </SelectedChildProvider>
  );
}
