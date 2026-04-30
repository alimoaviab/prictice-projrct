import { colors, spacing } from "@edu/shared/design-system/tokens";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: colors.surface,
                padding: spacing.lg
            }}
        >
            {children}
        </div>
    );
}
