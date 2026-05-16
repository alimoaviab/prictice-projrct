package store

import "time"

// SchoolPackage represents a custom package assigned to a school.
// It defines student limits, pricing, and subscription details.
type SchoolPackage struct {
	ID              string    `json:"_id"`
	SchoolID        string    `json:"school_id"`
	PackageName     string    `json:"package_name"`
	AllowedStudents int       `json:"allowed_students"`
	Price           float64   `json:"price"`
	DurationType    string    `json:"duration_type"` // monthly, quarterly, yearly, lifetime
	StartDate       time.Time `json:"start_date"`
	ExpiryDate      time.Time `json:"expiry_date"`
	PaymentStatus   string    `json:"payment_status"` // pending, paid, overdue, cancelled
	IsActive        bool      `json:"is_active"`
	Notes           string    `json:"notes"`
	CreatedBy       string    `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Expense represents a financial expense record.
// Expenses are categorized by type (mutual, ali, abdul_rehman).
type Expense struct {
	ID          string    `json:"_id"`
	ExpenseType string    `json:"expense_type"` // mutual, ali, abdul_rehman
	Title       string    `json:"title"`
	Amount      float64   `json:"amount"`
	Note        string    `json:"note"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// RevenueRecord tracks revenue from school packages and other sources.
type RevenueRecord struct {
	ID         string    `json:"_id"`
	SchoolID   string    `json:"school_id"`
	PackageID  string    `json:"package_id"`
	Amount     float64   `json:"amount"`
	RevenueType string   `json:"revenue_type"` // package, addon, other
	RecordedAt time.Time `json:"recorded_at"`
	CreatedAt  time.Time `json:"created_at"`
}

// Invoice represents a billing invoice for a school package.
type Invoice struct {
	ID            string    `json:"_id"`
	SchoolID      string    `json:"school_id"`
	PackageID     string    `json:"package_id"`
	InvoiceNumber string    `json:"invoice_number"`
	Amount        float64   `json:"amount"`
	Status        string    `json:"status"` // draft, sent, paid, overdue, cancelled
	DueDate       time.Time `json:"due_date"`
	IssuedAt      time.Time `json:"issued_at"`
	PaidAt        *time.Time `json:"paid_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Transaction represents a payment transaction.
type Transaction struct {
	ID            string    `json:"_id"`
	InvoiceID     string    `json:"invoice_id"`
	SchoolID      string    `json:"school_id"`
	Amount        float64   `json:"amount"`
	PaymentMethod string    `json:"payment_method"` // manual, card, bank_transfer, online, other
	ReferenceNo   string    `json:"reference_no"`
	Status        string    `json:"status"` // pending, completed, failed, refunded
	Notes         string    `json:"notes"`
	ProcessedBy   string    `json:"processed_by"`
	ProcessedAt   time.Time `json:"processed_at"`
	CreatedAt     time.Time `json:"created_at"`
}

// Subscription represents a school's subscription to a package.
type Subscription struct {
	ID          string    `json:"_id"`
	SchoolID    string    `json:"school_id"`
	PackageID   string    `json:"package_id"`
	Status      string    `json:"status"` // active, paused, cancelled, expired
	AutoRenew   bool      `json:"auto_renew"`
	NextRenewal time.Time `json:"next_renewal"`
	CancelledAt *time.Time `json:"cancelled_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
