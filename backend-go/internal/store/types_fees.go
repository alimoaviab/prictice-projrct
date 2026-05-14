// Fees-domain document types. They mirror the original Mongoose schemas
// in old-app/shared/models/{fee,fee-type,fee-payment,fee-adjustment,class-fee}.model.ts.
//
// Naming and JSON tags follow the lean-doc shapes the React frontend
// already consumes via the existing fee modules in school-react-app.
package store

import "time"

// FeeType mirrors fee-type.model.ts.
type FeeType struct {
	ID          string    `json:"_id"`
	SchoolID    string    `json:"school_id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	IsRecurring bool      `json:"is_recurring"`
	Category    string    `json:"category"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ClassFee mirrors class-fee.model.ts.
type ClassFee struct {
	ID             string    `json:"_id"`
	SchoolID       string    `json:"school_id"`
	ClassID        string    `json:"class_id"`
	AcademicYearID string    `json:"academic_year_id"`
	FeeTypeID      string    `json:"fee_type_id"`
	Amount         float64   `json:"amount"`
	Type           string    `json:"type"`            // recurring | onetime
	RecurringCycle string    `json:"recurring_cycle"` // monthly | quarterly | yearly
	DueMonth       string    `json:"due_month,omitempty"`
	DueYear        int       `json:"due_year,omitempty"`
	Notes          string    `json:"notes,omitempty"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// FeeComponent is one line item on a generated invoice.
type FeeComponent struct {
	FeeTypeID  string  `json:"fee_type_id,omitempty"`
	FeeType    string  `json:"fee_type,omitempty"`
	Amount     float64 `json:"amount"`
	PaidAmount float64 `json:"paid_amount"`
}

// Fee is the generated invoice. Mirrors fee.model.ts.
type Fee struct {
	ID               string         `json:"_id"`
	SchoolID         string         `json:"school_id"`
	StudentID        string         `json:"student_id"`
	ClassID          string         `json:"class_id,omitempty"`
	AcademicYearID   string         `json:"academic_year_id,omitempty"`
	FeeTypeID        string         `json:"fee_type_id,omitempty"`
	InvoiceNo        string         `json:"invoice_no"`
	Title            string         `json:"title"`
	Amount           float64        `json:"amount"`
	Currency         string         `json:"currency"`
	Month            string         `json:"month"`
	Year             int            `json:"year"`
	DueAt            time.Time      `json:"due_at"`
	Status           string         `json:"status"` // unpaid | partial | paid | void
	PaidAmount       float64        `json:"paid_amount"`
	AdjustmentAmount float64        `json:"adjustment_amount"`
	GeneratedAt      time.Time      `json:"generated_at"`
	GeneratedBy      string         `json:"generated_by,omitempty"`
	FeeComponents    []FeeComponent `json:"fee_components,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

// FeeAdjustment mirrors fee-adjustment.model.ts.
type FeeAdjustment struct {
	ID             string    `json:"_id"`
	SchoolID       string    `json:"school_id"`
	StudentID      string    `json:"student_id"`
	AcademicYearID string    `json:"academic_year_id"`
	Type           string    `json:"type"` // discount | waiver | penalty | scholarship
	Amount         float64   `json:"amount"`
	Reason         string    `json:"reason"`
	ValidFrom      time.Time `json:"valid_from"`
	ValidUntil     time.Time `json:"valid_until"`
	Status         string    `json:"status"`
	AppliedBy      string    `json:"applied_by,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// FeePaymentAllocation distributes one payment across one or more invoices.
type FeePaymentAllocation struct {
	FeeID     string  `json:"fee_id,omitempty"`
	FeeTypeID string  `json:"fee_type_id,omitempty"`
	Month     string  `json:"month,omitempty"`
	Amount    float64 `json:"amount"`
}

// FeePayment mirrors fee-payment.model.ts.
type FeePayment struct {
	ID             string                 `json:"_id"`
	SchoolID       string                 `json:"school_id"`
	ReceiptNo      string                 `json:"receipt_no"`
	StudentID      string                 `json:"student_id"`
	ClassID        string                 `json:"class_id,omitempty"`
	AcademicYearID string                 `json:"academic_year_id,omitempty"`
	Amount         float64                `json:"amount"`
	PaymentDate    time.Time              `json:"payment_date"`
	PaymentMethod  string                 `json:"payment_method"`
	ReferenceNo    string                 `json:"reference_no,omitempty"`
	Notes          string                 `json:"notes,omitempty"`
	Status         string                 `json:"status"`
	Allocations    []FeePaymentAllocation `json:"allocations,omitempty"`
	ReceivedBy     string                 `json:"received_by,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
}
