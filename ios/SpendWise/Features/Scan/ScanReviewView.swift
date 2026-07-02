import SwiftUI

/// Review step of the scan flow: confidence banner, editable details,
/// extracted line items, optional duplicate warning, confirm/retry buttons.
struct ScanReviewView: View {
    let result: ScanResult
    let categories: [Category]

    @Binding var merchant: String
    @Binding var dateString: String
    @Binding var totalRupees: String
    @Binding var selectedCategoryId: String

    let isSaving: Bool
    let onConfirm: () -> Void
    let onScanAgain: () -> Void

    private var selectedCategory: Category? {
        categories.first { $0.id == selectedCategoryId }
    }

    var body: some View {
        VStack(spacing: 14) {
            confidenceBanner
            detailsCard
            lineItemsCard

            if let duplicate = result.duplicate {
                duplicateBanner(duplicate)
            }

            Button {
                onConfirm()
            } label: {
                Text(isSaving ? "Saving…" : "Confirm & Save")
                    .font(.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Emerald.primary)
                    .foregroundStyle(.white)
                    .clipShape(.rect(cornerRadius: 14))
            }
            .disabled(isSaving)

            Button {
                onScanAgain()
            } label: {
                Text("Scan again")
                    .font(.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Emerald.card)
                    .foregroundStyle(Emerald.primary)
                    .clipShape(.rect(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Emerald.border, lineWidth: 1)
                    )
            }
            .disabled(isSaving)
        }
    }

    // MARK: - Banners

    private var confidenceBanner: some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(Emerald.success)
            Text("Extracted with \(result.confidence)% confidence · review below")
                .font(.caption.weight(.bold))
                .foregroundStyle(Emerald.successDark)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Emerald.successPanel)
        .clipShape(.rect(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: 0xCDEEE0), lineWidth: 1)
        )
    }

    private func duplicateBanner(_ duplicate: ScanDuplicate) -> some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.footnote)
                .foregroundStyle(Emerald.warn)
            Text("Possible duplicate — similar \(Money.format(duplicate.amount, abs: true)) charge on \(prettyDate(duplicate.date)). Save anyway?")
                .font(.caption)
                .foregroundStyle(Emerald.warnText)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Emerald.warnBg)
        .clipShape(.rect(cornerRadius: 12))
    }

    // MARK: - Details

    private var detailsCard: some View {
        VStack(spacing: 0) {
            fieldRow("Merchant") {
                TextField("Merchant", text: $merchant)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Emerald.text)
                    .multilineTextAlignment(.trailing)
            }
            Divider().padding(.leading, 15)

            fieldRow("Date") {
                Text(prettyDate(dateString))
                    .font(.subheadline)
                    .foregroundStyle(Emerald.text)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
            Divider().padding(.leading, 15)

            fieldRow("Total") {
                TextField("0", text: $totalRupees)
                    .keyboardType(.decimalPad)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Emerald.primary)
                    .multilineTextAlignment(.trailing)
            }
            Divider().padding(.leading, 15)

            fieldRow("Category") {
                categoryMenu
            }
        }
        .emeraldCard()
    }

    private var categoryMenu: some View {
        Menu {
            ForEach(categories) { category in
                Button {
                    selectedCategoryId = category.id
                } label: {
                    if category.id == selectedCategoryId {
                        Label(category.name, systemImage: "checkmark")
                    } else {
                        Text(category.name)
                    }
                }
            }
        } label: {
            HStack(spacing: 7) {
                Spacer(minLength: 0)
                Circle()
                    .fill(Color(hexString: selectedCategory?.color ?? "#8A9691"))
                    .frame(width: 9, height: 9)
                Text(selectedCategory?.name ?? "Choose…")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Emerald.text)
                Image(systemName: "chevron.up.chevron.down")
                    .font(.caption2)
                    .foregroundStyle(Emerald.text7)
            }
        }
    }

    private func fieldRow(_ label: String, @ViewBuilder content: () -> some View) -> some View {
        HStack(spacing: 10) {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(Emerald.text5)
                .frame(width: 96, alignment: .leading)
            content()
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 13)
    }

    // MARK: - Line items

    private var lineItemsCard: some View {
        VStack(spacing: 0) {
            ForEach(Array(result.lineItems.enumerated()), id: \.offset) { index, item in
                HStack {
                    Text(item.name)
                        .font(.subheadline)
                        .foregroundStyle(Emerald.text3)
                    Spacer()
                    Text(Money.format(item.amount, abs: true))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Emerald.text)
                }
                .padding(.horizontal, 15)
                .padding(.vertical, 12)

                if index < result.lineItems.count - 1 {
                    Divider().padding(.leading, 15)
                }
            }
        }
        .emeraldCard()
    }

    // MARK: - Helpers

    private func prettyDate(_ iso: String) -> String {
        let input = DateFormatter()
        input.dateFormat = "yyyy-MM-dd"
        guard let date = input.date(from: iso) else { return iso }
        let output = DateFormatter()
        output.dateFormat = "MMM d, yyyy"
        return output.string(from: date)
    }
}
