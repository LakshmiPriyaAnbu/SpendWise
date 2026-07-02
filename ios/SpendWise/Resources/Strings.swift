import Foundation

/// Every piece of user-facing copy in the app, grouped by feature. Views must
/// not hardcode text inline — reference a constant here instead, so wording
/// changes happen in exactly one place and apply everywhere it's used.
enum Strings {
    enum Common {
        static let retry = "Retry"
        static let cancel = "Cancel"
        static let ok = "OK"
        static let somethingWentWrong = "Something went wrong"
        static let pleaseTryAgain = "Please try again."
    }

    enum Auth {
        static let tagline = "Personal finance, made simple"
        static let namePlaceholder = "Name"
        static let emailPlaceholder = "Email"
        static let passwordPlaceholder = "Password"
        static let signIn = "Sign in"
        static let signingIn = "Signing in…"
        static let createAccount = "Create account"
        static let creatingAccount = "Creating account…"
        static let switchToSignIn = "Have an account? **Sign in**"
        static let switchToRegister = "New here? **Create an account**"
    }

    enum Home {
        static let greeting = "Good morning"
        static let totalBalance = "Total balance"
        static let income = "Income"
        static let spent = "Spent"
        static let spendingByCategory = "Spending by category"
        static let monthlyBudget = "Monthly budget"
        static let recentTransactions = "Recent transactions"
        static let addAction = "Add"
        static let scanAction = "Scan"
        static let budgetsAction = "Budgets"
        static let insightsAction = "Insights"
        static func budgetPctUsed(_ pct: Int) -> String { "\(pct)% used" }
        static func amountLeft(_ amount: String) -> String { "\(amount) left" }
        static func ofAmount(_ amount: String) -> String { "of \(amount)" }
    }

    enum Activity {
        static let title = "Activity"
        static let search = "Search"
        static let addTransaction = "Add transaction"
        static let filterAll = "All"
        static let filterIncome = "Income"
        static let filterExpense = "Expenses"
        static let emptyTitle = "No matching transactions"
        static let emptySubtitle = "Try a different search or filter"
    }

    enum Add {
        static let title = "Add"
        static let expense = "Expense"
        static let income = "Income"
        static let merchantLabel = "Merchant"
        static let merchantPlaceholder = "Where did you spend?"
        static let dateLabel = "Date"
        static let paymentLabel = "Payment"
        static let categoryHeader = "CATEGORY"
        static let newCategory = "New"
        static let newCategoryPlaceholder = "New category name"
        static let addButton = "Add"
        static let saveTransaction = "Save Transaction"
        static let saving = "Saving…"
        static let paymentMethods = [
            "UPI · GPay", "UPI · PhonePe", "Credit card",
            "Debit card", "Cash", "Bank transfer"
        ]
        static let defaultPaymentMethod = paymentMethods[0]
    }

    enum Budgets {
        static let title = "Budgets"
        static let categoriesHeader = "CATEGORIES"
        static func monthlyBudget(_ monthLabel: String) -> String { "Monthly budget · \(monthLabel)" }
        static func spentOfBudget(_ spent: String, _ budget: String) -> String { "\(spent) of \(budget)" }
        static func amountLeftToSpend(_ amount: String) -> String { "\(amount) left to spend" }
        static func pctUsed(_ pct: Int) -> String { "\(pct)% used" }
        static func amountLeft(_ amount: String) -> String { "\(amount) left" }
        static func overBy(_ amount: String) -> String { "Over by \(amount)" }
        static let statusOver = "Over"
        static let statusClose = "Close"
        static let statusOnTrack = "On track"
    }

    enum Insights {
        static let title = "Insights"
        static let spendingTrend = "Spending trend"
        static func trendSubtitle(_ average: String) -> String { "Last 6 months · avg \(average)/mo" }
        static let byCategory = "By category"
        static let subscriptions = "Subscriptions"
        static let noSubscriptions = "No subscriptions this month"
        static let monthly = "Monthly"
        static func perMonth(_ amount: String) -> String { "\(amount)/mo" }
        static let tagAlert = "alert"
        static let tagGreat = "great"
        static let tagWatch = "watch"
    }

    enum Scan {
        static let title = "Scan Receipt"
        static let positionReceipt = "Position receipt in frame"
        static let autoDetectHint = "We'll auto-detect the merchant, date and total for you"
        static let takePhoto = "Take Photo"
        static let uploadFromFiles = "Upload from Files"
        static let readingReceipt = "Reading receipt…"
        static let savedToast = "Saved to transactions"
        static func confidence(_ pct: Int) -> String { "Extracted with \(pct)% confidence · review below" }
        static func duplicateWarning(_ amount: String, _ date: String) -> String {
            "Possible duplicate — similar \(amount) charge on \(date). Save anyway?"
        }
        static let merchantLabel = "Merchant"
        static let dateLabel = "Date"
        static let totalLabel = "Total"
        static let categoryLabel = "Category"
        static let chooseCategory = "Choose…"
        static let confirmAndSave = "Confirm & Save"
        static let saving = "Saving…"
        static let scanAgain = "Scan again"
        static let paymentMethod = "Receipt scan"
    }

    /// Shared across the Home and Insights spending donut charts.
    enum Charts {
        static let totalSpent = "Total spent"
    }
}
