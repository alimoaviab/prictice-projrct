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

// autoGenerateForMonth creates invoices for the given month/year for all
// students who don't already have one. This is called automatically when
// the admin views the ledger for a specific month — no manual "Generate"
// button needed.
//
// It only generates for the current or past months (not future months
// beyond the current date) to avoid creating premature invoices.
func (h *Handler) autoGenerateForMonth(ctx *api.RequestContext, classFilter, month string, year int, yearID string) {
	mn, ok := monthToNum(month)
	if !ok || yearID == "" {
		return
	}

	// Don't auto-generate for future months beyond the current date.
	now := time.Now()
	targetEnd := time.Date(year, time.Month(mn)+1, 0, 23, 59, 59, 0, time.UTC) // last day of target month
	if targetEnd.After(now.AddDate(0, 1, 0)) {
		// More than 1 month in the future — skip.
		return
	}

	h.Store.Lock()

	// Find all classes to process (or just the filtered one).
	classIDs := make([]string, 0)
	for _, c := range h.Store.Classes {
		if c.SchoolID != ctx.SchoolID {
			continue
		}
		if c.AcademicYearID != "" && c.AcademicYearID != yearID {
			continue
		}
		if classFilter != "" && c.ID != classFilter {
			continue
		}
		if c.Status == "archived" {
			continue
		}
		classIDs = append(classIDs, c.ID)
	}

	dueAt := time.Date(year, time.Month(mn), 10, 23, 59, 59, 0, time.UTC)
	generated := make([]*store.Fee, 0)

	for _, cid := range classIDs {
		// Resolve active fee components for this class + month.
		components := make([]*store.ClassFee, 0)
		for _, cf := range h.Store.ClassFees {
			if cf.SchoolID != ctx.SchoolID || cf.ClassID != cid || cf.Status != "active" {
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
		if len(components) == 0 {
			continue
		}

		// Find active students in this class.
		for _, stu := range h.Store.Students {
			if stu.SchoolID != ctx.SchoolID || stu.ClassID != cid || stu.Status != "active" {
				continue
			}

			// Skip if invoice already exists for this student × month × year.
			exists := false
			for _, f := range h.Store.Fees {
				if f.SchoolID == ctx.SchoolID && f.StudentID == stu.ID &&
					strings.EqualFold(f.Month, month) && f.Year == year &&
					f.Status != "void" {
					exists = true
					break
				}
			}
			if exists {
				continue
			}

			// Build the invoice.
			total := 0.0
			feeComps := make([]store.FeeComponent, 0, len(components))
			for _, cf := range components {
				feeComps = append(feeComps, store.FeeComponent{
					FeeTypeID: cf.FeeTypeID,
					FeeType:   feeTypeName(h.Store, ctx.SchoolID, cf.FeeTypeID),
					Amount:    cf.Amount,
				})
				total += cf.Amount
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
				Month:            strings.ToLower(month),
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
			generated = append(generated, fee)
		}
	}

	// Release the lock BEFORE persisting to PG — holding it during N
	// Save calls blocks ALL other HTTP handlers and freezes the app.
	h.Store.Unlock()

	// Persist outside the lock.
	for _, fee := range generated {
		h.Save("fees", fee)
	}

	if len(generated) > 0 {
		fmt.Printf("[fees] auto-generated %d invoices for %s %d\n", len(generated), month, year)
	}
}
