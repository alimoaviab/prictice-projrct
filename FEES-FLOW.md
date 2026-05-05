# Fees Flow

**Endpoints:** `/api/school/*`, `/api/teacher/*`, `/api/parent/*`

## Overview

Fee management covers configuration, monthly generation, adjustments, payment recording, and reporting.

## Key Flow

1. Configure fee types.
2. Set class fees.
3. Generate monthly fees.
4. Record payments.
5. Review analytics and defaulters.

## Admin Endpoints

- `GET /api/school/fees/types`
- `POST /api/school/fees/types`
- `GET /api/school/fees/classes/:class_id`
- `POST /api/school/fees/classes/:class_id`
- `POST /api/school/fees/classes/:class_id/add`
- `PUT /api/school/fees/classes/:class_id/:fee_id`
- `DELETE /api/school/fees/classes/:class_id/:fee_id`
- `POST /api/school/fees/check-duplicates`
- `POST /api/school/fees/generate`
- `GET /api/school/fees/monthly`
- `GET /api/school/fees/summary`
- `GET /api/school/fees/analytics`
- `GET /api/school/fees/defaulters`
- `GET /api/school/fees/breakdown`
- `GET /api/school/fees/payments`
- `POST /api/school/fees/payments`
- `POST /api/school/fees/payments/bulk`
- `GET /api/school/fees/payments/daily`
- `GET /api/school/fees/payments/receipt/:receipt_no`
- `GET /api/school/fees/adjustments`
- `POST /api/school/fees/adjustments`
- `PUT /api/school/fees/adjustments/:adjustment_id`
- `DELETE /api/school/fees/adjustments/:adjustment_id`

## Parent and Student Views

- `GET /api/parent/fees`
- `GET /api/parent/child/fees`
- `GET /api/parent/child/payments`

## Validation Rules

- Fees require configured class fees.
- Duplicate generation should be checked before creating monthly invoices.
- Payments are allocated oldest-first.
- Adjustments can be active, expired, or pending.

## Reports

- Monthly fee list
- Collection summary
- Daily collection
- Defaulters
- Analytics by month and class
- Fee breakdown per child

## Security Notes

- Fee data is tenant-scoped.
- Teachers have read-only access.
- Parents can only view linked children.
