import Foundation
import Observation

/// Drives the receipt scan flow: idle → processing → review, and the save.
@Observable
@MainActor
final class ScanViewModel {
    enum Step {
        case idle
        case processing
        case review
    }

    private(set) var step: Step = .idle
    private(set) var result: ScanResult?
    private(set) var categories: [Category] = []

    // Editable review fields
    var merchant = ""
    var dateString = ""
    var totalRupees = ""
    var selectedCategoryId = ""

    private(set) var isSaving = false
    var errorMessage: String?
    var showError = false
    private(set) var showSavedToast = false

    func start(api: APIClient) async {
        errorMessage = nil
        step = .processing
        do {
            async let scanned = api.scanReceipt()
            async let loadedCategories = api.categories()
            // Keep the scan animation on screen long enough to read.
            try? await Task.sleep(nanoseconds: 1_900_000_000)

            let scan = try await scanned
            categories = try await loadedCategories

            result = scan
            merchant = scan.merchant
            dateString = scan.date
            let rupees = Double(scan.total) / 100
            totalRupees = rupees.truncatingRemainder(dividingBy: 1) == 0
                ? String(Int(rupees))
                : String(format: "%.2f", rupees)
            selectedCategoryId = scan.suggestedCategoryId

            step = .review
        } catch {
            errorMessage = error.localizedDescription
            showError = true
            step = .idle
        }
    }

    func save(api: APIClient) async {
        guard let result, !isSaving else { return }
        let rupees = Double(totalRupees) ?? Double(result.total) / 100
        let paise = -abs(Int((rupees * 100).rounded()))
        isSaving = true
        defer { isSaving = false }
        do {
            _ = try await api.createTransaction(CreateTxRequest(
                merchant: merchant,
                categoryId: selectedCategoryId,
                date: result.date,
                paymentMethod: Strings.Scan.paymentMethod,
                amount: paise,
                lineItems: result.lineItems
            ))
            reset()
            showSavedToast = true
            Task {
                try? await Task.sleep(nanoseconds: 2_200_000_000)
                showSavedToast = false
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
            reset()
        }
    }

    func reset() {
        step = .idle
        result = nil
        merchant = ""
        dateString = ""
        totalRupees = ""
        selectedCategoryId = ""
    }
}
