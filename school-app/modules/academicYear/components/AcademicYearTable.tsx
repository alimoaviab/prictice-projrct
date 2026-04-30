"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { DataTable } from "../../../components/ui";
import { AcademicYearRow } from "../types/academicYear.types";
import { ACADEMIC_YEAR_TABLE_COLUMNS } from "../constants/academicYear.constants";

export function AcademicYearTable({ years }: { years: AcademicYearRow[] }) {
    return (
        <table
            style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: typography.bodyMd.fontFamily
            }}
        >
            <thead>
                <tr style={{ background: colors.surfaceContainerHigh, borderBottom: `1px solid ${colors.cardBorder}` }}>
                    {ACADEMIC_YEAR_TABLE_COLUMNS.map((col) => (
                        <th
                            key={col.key}
                            style={{
                                padding: spacing.md,
                                textAlign: "left",
                                width: col.width,
                                ...typography.tableHeader,
                                color: colors.onSurface
                            }}
                        >
                            {col.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {years.map((year) => (
                    <tr key={year._id} style={{ borderBottom: `1px solid ${colors.cardBorder}`, "&:hover": { background: colors.rowHover } }}>
                        <td style={{ padding: spacing.md, ...typography.bodyMd }}>{year.year}</td>
                        <td style={{ padding: spacing.md, ...typography.bodyMd }}>
                            {new Date(year.start_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: spacing.md, ...typography.bodyMd }}>
                            {new Date(year.end_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: spacing.md }}>
                            <span
                                style={{
                                    background:
                                        year.status === "active"
                                            ? colors.success
                                            : year.status === "completed"
                                                ? colors.outlineVariant
                                                : colors.outline,
                                    color: "white",
                                    padding: `${spacing.xs}px ${spacing.sm}px`,
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    textTransform: "capitalize"
                                }}
                            >
                                {year.status}
                            </span>
                        </td>
                        <td style={{ padding: spacing.md, textAlign: "center" }}>
                            <input
                                type="checkbox"
                                checked={year.is_active}
                                disabled
                                style={{ width: "20px", height: "20px", cursor: "not-allowed" }}
                            />
                        </td>
                        <td style={{ padding: spacing.md }}>
                            <button
                                style={{
                                    background: colors.actionBlue,
                                    color: "white",
                                    border: "none",
                                    padding: `${spacing.xs}px ${spacing.sm}px`,
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px"
                                }}
                            >
                                Edit
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
