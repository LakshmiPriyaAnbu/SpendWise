import Foundation
import Observation

/// Loads the dashboard data (analytics summary + categories) for HomeView.
@Observable
@MainActor
final class HomeViewModel {
    private(set) var summary: AnalyticsSummary?
    private(set) var categoriesById: [String: Category] = [:]
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    func load(api: APIClient) async {
        if summary == nil { isLoading = true }
        errorMessage = nil
        do {
            async let summaryTask = api.summary(month: AppDate.currentMonth)
            async let categoriesTask = api.categories()
            let (loadedSummary, categories) = try await (summaryTask, categoriesTask)
            summary = loadedSummary
            categoriesById = Dictionary(uniqueKeysWithValues: categories.map { ($0.id, $0) })
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func category(for id: String) -> Category {
        categoriesById[id] ?? .other
    }
}
