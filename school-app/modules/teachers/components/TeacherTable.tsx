"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { TeacherRow } from "../types/teacher.types";

export function TeacherTable({ teachers }: { teachers: TeacherRow[] }) {
    return (
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: typography.bodyMd.fontFamily }}>
            <thead>
                <tr style={{ background: colors.surfaceContainerHigh, borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <th style={{ padding: spacing.md, textAlign: "left", ...typography.tableHeader, color: colors.onSurface }}>Employee No</th>
                    <th style={{ padding: spacing.md, textAlign: "left", ...typography.tableHeader, color: colors.onSurface }}>Name</th>
                    <th style={{ padding: spacing.md, textAlign: "left", ...typography.tableHeader, color: colors.onSurface }}>Email</th>
                    <th style={{ padding: spacing.md, textAlign: "left", ...typography.tableHeader, color: colors.onSurface }}>Phone</th>
                    <th style={{ padding: spacing.md, textAlign: "left", ...typography.tableHeader, color: colors.onSurface }}>Qualification</th>
                    <th style={{ padding: spacing.md, textAlign: "left", ...typography.tableHeader, color: colors.onSurface }}>Subjects</th>
                    <th style={{ padding: spacing.md, textAlign: "left", ...typography.tableHeader, color: colors.onSurface }}>Status</th>
                </tr>
            </thead>
            <tbody>
                {teachers.map((teacher) => (
                    <tr key={teacher._id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                        <td style={{ padding: spacing.md, ...typography.bodyMd }}>{teacher.employee_no}</td>
                        <td style={{ padding: spacing.md, ...typography.bodyMd }}>{teacher.first_name} {teacher.last_name}</td>
                        <td style={{ padding: spacing.md, ...typography.bodyMd }}>{teacher.email}</td>
                        <td style={{ padding: spacing.md, ...typography.bodyMd }}>{teacher.phone}</td>
                        <td style={{ padding: spacing.md, ...typography.bodyMd }}>{teacher.qualification || "N/A"}</td>
                        <td style={{ padding: spacing.md, ...typography.bodyMd }}>{teacher.subjects.join(", ")}</td>
                        <td style={{ padding: spacing.md }}>
                            <span style={{ background: colors.success, color: "white", padding: `${spacing.xs}px ${spacing.sm}px`, borderRadius: "4px", fontSize: "12px" }}>
                                {teacher.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
