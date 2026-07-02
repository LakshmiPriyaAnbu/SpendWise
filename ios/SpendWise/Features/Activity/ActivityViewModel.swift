import Foundation
import Observation

/// Loads and filters this month's transactions for ActivityView.
@Observable
@MainActor
final class ActivityViewModel {
    enum Filter: String, CaseIterable, Identifiable {
        case all, income, expense

        var id: String { rawValue }

        var label: String {
            switch self {
            case .all: return Strings.Activity.filterAll
            case .income: return Strings.Activity.filterIncome
            case .expense: return Strings.Activity.filterExpense
            }
        }
    }

    enum LoadPhase: Equatable {
        case loading
        case loaded
        case failed(String)
    }

    private(set) var transactions: [Transaction] = []
    private(set) var categoriesById: [String: Category] = [:]
    private(set) var phase: LoadPhase = .loading

    func category(for id: String) -> Category {
        categoriesById[id] ?? .other
    }

    func load(api: APIClient, query: String, filter: Filter) async {
        if transactions.isEmpty { phase = .loading }
        do {
            if categoriesById.isEmpty {
                let categories = try await api.categories()
                categoriesById = Dictionary(uniqueKeysWithValues: categories.map { ($0.id, $0) })
            }
            transactions = try await api.transactions(
                month: AppDate.currentMonth,
                type: filter.rawValue,
                q: query
            )
            phase = .loaded
        } catch {
            guard !Task.isCancelled else { return }
            phase = .failed(error.localizedDescription)
        }
    }
}
