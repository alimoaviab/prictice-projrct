"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const validateForm = () => {
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Signup failed");
            }

            router.push("/auth/login");
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
                Account Access
            </h1>

            <p style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md }}>
                New teacher and student accounts are created by the academy administration team.
            </p>

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

                <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter your password"
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
                    {loading ? "Creating account..." : "Sign Up"}
                </Button>
            </form>

            <div style={{ marginTop: spacing.lg, textAlign: "center" }}>
                <p style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                    Already have an account?{" "}
                    <Link
                        href="/auth/login"
                        style={{ color: colors.actionBlue, textDecoration: "none" }}
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
