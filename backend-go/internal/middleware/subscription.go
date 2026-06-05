package middleware

import (
	"net/http"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/domain/subscription"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SubscriptionGate returns a middleware that checks the tenant's active subscription status.
// If the subscription is expired, it blocks all non-billing/support routes.
// If active, it ensures the school has access to the module required by the requested API path.
func SubscriptionGate(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := api.FromRequest(r)
			if ctx == nil || ctx.Role == "super_admin" || ctx.SchoolID == "system" || pool == nil {
				next.ServeHTTP(w, r)
				return
			}

			// Get the active subscription
			var planName, status string
			var endDate time.Time
			err := pool.QueryRow(r.Context(), `
				SELECT plan_name, status, end_date FROM subscriptions
				WHERE school_id = $1 AND status IN ('active', 'trial')
				ORDER BY created_at DESC LIMIT 1
			`, ctx.SchoolID).Scan(&planName, &status, &endDate)

			path := r.URL.Path

			// If no active subscription or the subscription is expired
			if err == pgx.ErrNoRows || (err == nil && time.Now().After(endDate)) {
				// Allow basic routes (subscription, billing, notifications) even when expired
				if subscription.IsExpiredAllowedAPI(path) {
					next.ServeHTTP(w, r)
					return
				}
				api.WriteResult(w, api.Fail("SUBSCRIPTION_EXPIRED", "Your school subscription has expired. Please renew your plan to continue.", 403, nil))
				return
			}
			if err != nil {
				// Allow fallback in case of query errors to avoid hard-locking the system
				next.ServeHTTP(w, r)
				return
			}

			// Enforce package/module-level gating on path
			reqPkg, reqModule := subscription.PackageForAPIPath(path)
			if reqPkg != "" {
				selected := subscription.ParseSelectedPackages(planName, nil)
				if !subscription.IsModuleAllowed(selected, reqPkg, reqModule) {
					api.WriteResult(w, api.Fail("MODULE_LOCKED", "This feature is not included in your active subscription package.", 403, nil))
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}
