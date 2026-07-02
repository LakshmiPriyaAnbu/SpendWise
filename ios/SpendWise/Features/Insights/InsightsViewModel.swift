import Foundation
import Observation

/// Loads analytics summary, categories and this month's expense transactions
/// (for the Subscriptions card) for InsightsView.
@Observable
@MainActor
final class InsightsViewModel {
    private(set) var summary: AnalyticsSummary?
    private(set) var subscriptions: [Transaction] = []
    private(set) var categoriesById: [String: Category] = [:]
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    func load(api: APIClient) async {
        if summary == nil { isLoading = true }
        errorMessage = nil
        do {
            let month = HomeViewModel.currentMonth
            async let summaryTask = api.summary(month: month)
            async let categoriesTask = api.categories()
            async let transactionsTask = api.transactions(month: month, type: "expense")
            let (loadedSummary, categories, transactions) = try await (summaryTask, categoriesTask, transactionsTask)
            categoriesById = Dictionary(uniqueKeysWithValues: categories.map { ($0.id, $0) })
            let subsCategoryIds = Set(categories.filter { $0.key == "subs" }.map(\.id))
            subscriptions = transactions.filter { subsCategoryIds.contains($0.categoryId) }
            summary = loadedSummary
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func category(for id: String) -> Category {
        categoriesById[id] ?? .other
    }

    /// Sum of this month's subscription charges, in positive paise.
    var subscriptionsTotal: Int {
        subscriptions.reduce(0) { $0 + abs($1.amount) }
    }

    /// Average monthly expense across the trend window, in paise.
    var trendAverage: Int {
        guard let trend = summary?.trend, !trend.isEmpty else { return 0 }
        return trend.reduce(0) { $0 + $1.expense } / trend.count
    }
}
