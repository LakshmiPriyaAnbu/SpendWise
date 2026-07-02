import SwiftUI

/// Manual add-transaction sheet (design spec `mAdd`): Expense/Income toggle,
/// big centered ₹ amount entry, detail rows, category chips and Save button.
struct AddTransactionView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var txType: TxType = .expense
    @State private var amountText = ""
    @State private var merchant = ""
    @State private var date = Date()
    @State private var paymentMethod = "UPI · GPay"
    @State private var categories: [Category] = []
    @State private var selectedCategoryId: String?
    @State private var isAddingCategory = false
    @State private var newCategoryName = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    @FocusState private var amountFocused: Bool
    @FocusState private var newCategoryFocused: Bool

    private static let paymentMethods = [
        "UPI · GPay", "UPI · PhonePe", "Credit card",
        "Debit card", "Cash", "Bank transfer"
    ]

    private enum TxType: String, CaseIterable, Identifiable {
        case expense, income

        var id: String { rawValue }

        var label: String {
            switch self {
            case .expense: return "Expense"
            case .income: return "Income"
            }
        }
    }

    private var amountValue: Double? {
        Double(amountText.replacingOccurrences(of: ",", with: ""))
    }

    private var isValid: Bool {
        guard let amount = amountValue, amount > 0 else { return false }
        guard !merchant.trimmingCharacters(in: .whitespaces).isEmpty else { return false }
        return selectedCategoryId != nil
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    typeSegment
                    amountEntry
                    detailsCard
                    categorySection

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(Emerald.danger)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 16)
            }
            .background(Emerald.background)
            .navigationTitle("Add")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Emerald.primary)
                }
            }
            .safeAreaInset(edge: .bottom) {
                saveButton
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(.thinMaterial)
            }
            .task {
                await loadCategories()
            }
            .onAppear {
                amountFocused = true
            }
        }
    }

    // MARK: - Type segment (custom Emerald pill)

    private var typeSegment: some View {
        HStack(spacing: 0) {
            ForEach(TxType.allCases) { type in
                Button {
                    txType = type
                } label: {
                    Text(type.label)
                        .font(.subheadline.weight(txType == type ? .bold : .medium))
                        .foregroundStyle(txType == type ? Emerald.text : Emerald.text3)
                        .frame(maxWidth: .infinity)
                        .frame(height: 34)
                        .background {
                            if txType == type {
                                RoundedRectangle(cornerRadius: 11)
                                    .fill(.white)
                                    .shadow(color: .black.opacity(0.08), radius: 3, y: 1)
                            }
                        }
                }
                .buttonStyle(.plain)
            }
        }
        .padding(2)
        .background(Emerald.track)
        .clipShape(.rect(cornerRadius: 13))
        .animation(.easeInOut(duration: 0.15), value: txType)
    }

    // MARK: - Amount

    private var amountEntry: some View {
        HStack(alignment: .center, spacing: 2) {
            Text("₹")
                .font(.system(size: 30, weight: .semibold, design: .rounded))
                .foregroundStyle(Emerald.primary)
            TextField("0", text: $amountText)
                .keyboardType(.decimalPad)
                .font(.system(size: 40, weight: .bold, design: .rounded))
                .foregroundStyle(Emerald.primary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: true, vertical: false)
                .frame(minWidth: 60, maxWidth: 220)
                .focused($amountFocused)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
    }

    // MARK: - Detail rows

    private var detailsCard: some View {
        VStack(spacing: 0) {
            detailRow("Merchant") {
                TextField("Where did you spend?", text: $merchant)
                    .font(.subheadline.weight(.semibold))
                    .multilineTextAlignment(.trailing)
            }
            Divider().padding(.leading, 15)
            detailRow("Date") {
                DatePicker("", selection: $date, displayedComponents: .date)
                    .datePickerStyle(.compact)
                    .labelsHidden()
            }
            Divider().padding(.leading, 15)
            detailRow("Payment") {
                Menu {
                    ForEach(Self.paymentMethods, id: \.self) { method in
                        Button(method) { paymentMethod = method }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(paymentMethod)
                            .font(.subheadline)
                            .foregroundStyle(Emerald.text)
                        Image(systemName: "chevron.up.chevron.down")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(Emerald.text5)
                    }
                }
            }
        }
        .emeraldCard()
    }

    private func detailRow(_ label: String, @ViewBuilder trailing: () -> some View) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(Emerald.text5)
                .frame(width: 96, alignment: .leading)
            Spacer(minLength: 8)
            trailing()
        }
        .padding(.horizontal, 15)
        .frame(minHeight: 48)
    }

    // MARK: - Categories

    private var categorySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("CATEGORY")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Emerald.text5)
                .padding(.leading, 4)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 8)], spacing: 8) {
                ForEach(categories) { category in
                    categoryChip(category)
                }
                newCategoryChip
            }

            if isAddingCategory {
                newCategoryEntry
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isAddingCategory)
    }

    private func categoryChip(_ category: Category) -> some View {
        let color = Color(hexString: category.color)
        let isSelected = selectedCategoryId == category.id
        return Button {
            selectedCategoryId = category.id
        } label: {
            HStack(spacing: 6) {
                Circle()
                    .fill(color)
                    .frame(width: 8, height: 8)
                Text(category.name)
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(isSelected ? color : Emerald.text3)
                    .lineLimit(1)
            }
            .padding(.horizontal, 13)
            .frame(height: 36)
            .frame(maxWidth: .infinity)
            .background(isSelected ? Color(hexString: category.bg) : .white)
            .clipShape(.capsule)
            .overlay {
                Capsule()
                    .strokeBorder(isSelected ? color : Emerald.border, lineWidth: 1.5)
            }
        }
        .buttonStyle(.plain)
    }

    private var newCategoryChip: some View {
        Button {
            isAddingCategory = true
            newCategoryFocused = true
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "plus")
                    .font(.system(size: 12, weight: .bold))
                Text("New")
                    .font(.system(size: 12.5, weight: .bold))
            }
            .foregroundStyle(Emerald.text3)
            .padding(.horizontal, 13)
            .frame(height: 36)
            .frame(maxWidth: .infinity)
            .background(.white)
            .clipShape(.capsule)
            .overlay {
                Capsule()
                    .strokeBorder(Emerald.text7, style: StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
            }
        }
        .buttonStyle(.plain)
    }

    private var newCategoryEntry: some View {
        HStack(spacing: 8) {
            TextField("New category name", text: $newCategoryName)
                .focused($newCategoryFocused)
                .padding(.horizontal, 14)
                .frame(height: 44)
                .background(Color(hex: 0xF6FBF9))
                .clipShape(.rect(cornerRadius: 11))
                .overlay {
                    RoundedRectangle(cornerRadius: 11)
                        .strokeBorder(Emerald.primary, lineWidth: 1.5)
                }
                .onSubmit { addCategory() }

            Button {
                addCategory()
            } label: {
                Text("Add")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 18)
                    .frame(height: 44)
                    .background(Emerald.primary)
                    .clipShape(.rect(cornerRadius: 11))
            }
            .disabled(newCategoryName.trimmingCharacters(in: .whitespaces).isEmpty)

            Button("Cancel") {
                isAddingCategory = false
                newCategoryName = ""
            }
            .font(.subheadline)
            .foregroundStyle(Emerald.text3)
        }
    }

    // MARK: - Save

    private var saveButton: some View {
        Button {
            save()
        } label: {
            Text(isSaving ? "Saving…" : "Save Transaction")
                .font(.body.weight(.bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Emerald.primary)
                .clipShape(.rect(cornerRadius: 14))
        }
        .disabled(!isValid || isSaving)
        .opacity(isValid && !isSaving ? 1 : 0.5)
    }

    // MARK: - Actions

    private func loadCategories() async {
        do {
            categories = try await session.api.categories()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func addCategory() {
        let name = newCategoryName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        Task {
            do {
                let category = try await session.api.createCategory(name: name)
                categories.append(category)
                selectedCategoryId = category.id
                newCategoryName = ""
                isAddingCategory = false
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func save() {
        guard let amount = amountValue, amount > 0,
              let categoryId = selectedCategoryId else { return }

        let paise = Int((amount * 100).rounded())
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        let request = CreateTxRequest(
            merchant: merchant.trimmingCharacters(in: .whitespaces),
            categoryId: categoryId,
            date: formatter.string(from: date),
            paymentMethod: paymentMethod,
            amount: txType == .expense ? -paise : paise
        )

        errorMessage = nil
        isSaving = true
        Task {
            defer { isSaving = false }
            do {
                _ = try await session.api.createTransaction(request)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
