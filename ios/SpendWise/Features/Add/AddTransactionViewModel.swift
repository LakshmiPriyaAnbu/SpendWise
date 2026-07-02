import Foundation
import Observation

enum TxType: String, CaseIterable, Identifiable {
    case expense, income

    var id: String { rawValue }

    var label: String {
        switch self {
        case .expense: return Strings.Add.expense
        case .income: return Strings.Add.income
        }
    }
}

/// Form state + save logic for the manual add-transaction sheet.
@Observable
@MainActor
final class AddTransactionViewModel {
    var txType: TxType = .expense
    var amountText = ""
    var merchant = ""
    var date = Date()
    var paymentMethod = Strings.Add.defaultPaymentMethod
    var newCategoryName = ""
    var isAddingCategory = false
    private(set) var selectedCategoryId: String?
    private(set) var categories: [Category] = []
    private(set) var isSaving = false
    private(set) var errorMessage: String?

    var amountValue: Double? {
        Double(amountText.replacingOccurrences(of: ",", with: ""))
    }

    var isValid: Bool {
        guard let amount = amountValue, amount > 0 else { return false }
        guard !merchant.trimmingCharacters(in: .whitespaces).isEmpty else { return false }
        return selectedCategoryId != nil
    }

    func selectCategory(_ id: String) {
        selectedCategoryId = id
    }

    func loadCategories(api: APIClient) async {
        do {
            categories = try await api.categories()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func addCategory(api: APIClient) async {
        let name = newCategoryName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        do {
            let category = try await api.createCategory(name: name)
            categories.append(category)
            selectedCategoryId = category.id
            newCategoryName = ""
            isAddingCategory = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Returns `true` on success, so the view can dismiss.
    func save(api: APIClient) async -> Bool {
        guard let amount = amountValue, amount > 0,
              let categoryId = selectedCategoryId else { return false }

        let paise = Int((amount * 100).rounded())
        let request = CreateTxRequest(
            merchant: merchant.trimmingCharacters(in: .whitespaces),
            categoryId: categoryId,
            date: AppDate.apiDayString(from: date),
            paymentMethod: paymentMethod,
            amount: txType == .expense ? -paise : paise
        )

        errorMessage = nil
        isSaving = true
        defer { isSaving = false }
        do {
            _ = try await api.createTransaction(request)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}
