package fees

import (
	"fmt"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
)

// syncInvoicesForClass ensures all active students in a class have up-to-date
// invoices for the current month based on the class's fee configuration.
func (h *Handler) syncInvoicesForClass(ctx *api.RequestContext, classID string) {
	h.Store.Lock()
	defer h.Store.Unlock()
	h.syncInvoicesForClassLocked(ctx, classID)
}

func (h *Handler) syncInvoicesForClassLocked(ctx *api.RequestContext, classID string) {
	now := time.Now()
	month := strings.ToLower(now.Month().String())
	year := now.Year()
	
	yearID := tenant.ResolveAcademicYearIDLocked(h.Store, ctx, "")
	if yearID == "" {
		return
	}

	// 1. Resolve active class fee components for this month
	components := make([]*store.ClassFee, 0)
	for _, cf := range h.Store.ClassFees {
		if cf.SchoolID != ctx.SchoolID || cf.ClassID != classID || cf.Status != "active" {
			continue
		}
		if cf.AcademicYearID != yearID {
			continue
		}
		if cf.Type == "recurring" && cf.RecurringCycle == "monthly" {
			components = append(components, cf)
			continue
		}
		if cf.Type == "onetime" && strings.EqualFold(cf.DueMonth, month) && cf.DueYear == year {
			components = append(components, cf)
		}
	}

	// 2. Identify students in the class
	students := make([]*store.Student, 0)
	for _, s := range h.Store.Students {
		if s.SchoolID == ctx.SchoolID && s.ClassID == classID && s.Status == "active" {
			students = append(students, s)
		}
	}

	dueAt := time.Date(year, now.Month(), 10, 23, 59, 59, 0, time.UTC)
	
	for _, stu := range students {
		var existing *store.Fee
		for _, f := range h.Store.Fees {
			if f.SchoolID == ctx.SchoolID && f.StudentID == stu.ID &&
				strings.EqualFold(f.Month, month) && f.Year == year &&
				f.Status != "void" {
				existing = f
				break
			}
		}

		total := 0.0
		feeComps := make([]store.FeeComponent, 0)
		for _, cf := range components {
			feeComps = append(feeComps, store.FeeComponent{
				FeeTypeID: cf.FeeTypeID,
				FeeType:   feeTypeName(h.Store, ctx.SchoolID, cf.FeeTypeID),
				Amount:    cf.Amount,
			})
			total += cf.Amount
		}

		// Arrears calculation
		arrears := 0.0
		for _, f := range h.Store.Fees {
			if f.SchoolID == ctx.SchoolID && f.StudentID == stu.ID && f.Status != "void" {
				mNum, _ := monthToNum(f.Month)
				isPast := f.Year < year || (f.Year == year && mNum < int(now.Month()))
				if isPast {
					eff := f.Amount + f.AdjustmentAmount
					unpaid := eff - f.PaidAmount
					if unpaid > 0 {
						arrears += unpaid
					}
				}
			}
		}

		if arrears > 0 {
			feeComps = append(feeComps, store.FeeComponent{
				FeeType: "Previous Arrears",
				Amount:  arrears,
			})
			total += arrears
		}

		if existing != nil {
			// Update existing invoice
			existing.Amount = total
			existing.FeeComponents = feeComps
			existing.UpdatedAt = now
			existing.Status = feeStatus(total+existing.AdjustmentAmount, existing.PaidAmount)
			h.Save("fees", existing)
		} else {
			if len(feeComps) == 0 {
				continue
			}
			adjustment := h.adjustmentsForStudent(ctx.SchoolID, stu.ID, yearID, dueAt)
			fee := &store.Fee{
				ID:               store.NewID("fee"),
				SchoolID:         ctx.SchoolID,
				StudentID:        stu.ID,
				ClassID:          stu.ClassID,
				AcademicYearID:   yearID,
				InvoiceNo:        makeInvoiceNo(stu.ID, month, year),
				Title:            fmt.Sprintf("%s %d", titleCase(month), year),
				Amount:           total,
				Currency:         "Rs",
				Month:            month,
				Year:             year,
				DueAt:            dueAt,
				Status:           "unpaid",
				PaidAmount:       0,
				AdjustmentAmount: adjustment,
				GeneratedAt:      now,
				GeneratedBy:      ctx.UserID,
				FeeComponents:    feeComps,
				CreatedAt:        now,
				UpdatedAt:        now,
			}
			h.Store.Fees = append(h.Store.Fees, fee)
			h.Save("fees", fee)
		}
	}
}
