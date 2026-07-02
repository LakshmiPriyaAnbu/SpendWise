import Foundation

// Codable mirrors of @spendwise/shared (shared/src). Amounts are signed paise.

struct User: Codable, Equatable {
    let id: String
    let name: String
    let email: String
    let plan: String
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct Category: Codable, Identifiable, Equatable {
    let id: String
    let key: String
    let name: String
    let color: String
    let bg: String
    let icon: String
    let isCustom: Bool
}

struct ReceiptLineItem: Codable, Equatable {
    let name: String
    let amount: Int
}

struct Transaction: Codable, Identifiable, Equatable {
    let id: String
    let merchant: String
    let categoryId: String
    /// yyyy-mm-dd
    let date: String
    let paymentMethod: String
    let amount: Int
    let notes: String?
    let lineItems: [ReceiptLineItem]?
}

struct CreateTxRequest: Codable {
    let merchant: String
    let categoryId: String
    let date: String
    let paymentMethod: String
    let amount: Int
    var notes: String? = nil
    var lineItems: [ReceiptLineItem]? = nil
}

struct CategoryBreakdown: Codable, Equatable {
    let category: Category
    let spent: Int
    let pct: Int
}

struct BudgetUsage: Codable, Equatable {
    let category: Category
    let spent: Int
    let budget: Int
    let pct: Int
    /// 'on-track' | 'close' | 'over'
    let status: String
}

struct TrendPoint: Codable, Equatable {
    let month: String
    let label: String
    let expense: Int
}

struct TopMerchant: Codable, Equatable {
    let merchant: String
    let spent: Int
}

struct Insight: Codable, Equatable {
    /// 'watch' | 'alert' | 'great'
    let tag: String
    let title: String
    let description: String
}

struct AnalyticsSummary: Codable, Equatable {
    let month: String
    let balance: Int
    let income: Int
    let expense: Int
    let savings: Int
    let budgetTotal: Int
    let budgetLeft: Int
    let budgetPct: Int
    let overBudgetCount: Int
    let breakdown: [CategoryBreakdown]
    let budgetUsage: [BudgetUsage]
    let trend: [TrendPoint]
    let topMerchants: [TopMerchant]
    let insights: [Insight]
    let recentTransactions: [Transaction]
}

struct ScanDuplicate: Codable, Equatable {
    let merchant: String
    let date: String
    let amount: Int
}

struct ScanResult: Codable, Equatable {
    let merchant: String
    let date: String
    let total: Int
    let lineItems: [ReceiptLineItem]
    let suggestedCategoryId: String
    let confidence: Int
    let duplicate: ScanDuplicate?
}

struct APIErrorEnvelope: Codable {
    struct Detail: Codable {
        let code: String
        let message: String
    }
    let error: Detail
}
