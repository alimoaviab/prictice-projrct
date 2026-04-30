"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ email: "", password: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Login failed");
            }

            const data = await response.json();
            localStorage.setItem("token", data.token);
            router.push("/student/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                background: colors.surfaceContainer,
                borderRadius: "12px",
                padding: spacing.xl,
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
            }}
        >
            <h1 style={{ ...typography.h2, color: colors.onSurface, marginBottom: spacing.lg }}>
                Login
            </h1>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.md }}>
                <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                />

                <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Minimum 6 characters"
                    minLength={6}
                />

                {error && (
                    <div style={{ color: colors.error, ...typography.bodyMd }}>
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={loading}
                    style={{
                        background: colors.actionBlue,
                        color: "white",
                        padding: `${spacing.md}px`,
                        marginTop: spacing.md
                    }}
                >
                    {loading ? "Logging in..." : "Login"}
                </Button>
            </form>

            <div style={{ marginTop: spacing.lg, textAlign: "center" }}>
                <p style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                    Don't have an account?{" "}
                    <Link
                        href="/auth/signup"
                        style={{ color: colors.actionBlue, textDecoration: "none" }}
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
