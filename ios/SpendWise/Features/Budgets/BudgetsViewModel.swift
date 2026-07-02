import Foundation
import Observation

/// Loads the current month's analytics summary (for the budget ring + per
/// category cards) for BudgetsView.
@Observable
@MainActor
final class BudgetsViewModel {
    private(set) var summary: AnalyticsSummary?
    private(set) var errorMessage: String?

    func load(api: APIClient) async {
        errorMessage = nil
        do {
            summary = try await api.summary(month: AppDate.currentMonth)
        } catch {
            if summary == nil {
                errorMessage = error.localizedDescription
            }
        }
    }
}
