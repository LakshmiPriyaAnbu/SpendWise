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

    /// Current month in the API's "yyyy-MM" format.
    static var currentMonth: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        return formatter.string(from: Date())
    }

    func load(api: APIClient) async {
        if summary == nil { isLoading = true }
        errorMessage = nil
        do {
            async let summaryTask = api.summary(month: Self.currentMonth)
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

    // MARK: date formatting ("yyyy-MM-dd" → "Jul 1")

    private static let isoDayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    private static let monthDayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter
    }()

    static func shortDate(_ isoDay: String) -> String {
        guard let date = isoDayFormatter.date(from: isoDay) else { return isoDay }
        return monthDayFormatter.string(from: date)
    }
}
