import SwiftUI

/// Manual add-transaction sheet (design spec `mAdd`): Expense/Income toggle,
/// big centered ₹ amount entry, detail rows, category chips and Save button.
struct AddTransactionView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss
    @Bindable private var model = AddTransactionViewModel()

    @FocusState private var amountFocused: Bool
    @FocusState private var newCategoryFocused: Bool

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    typeSegment
                    amountEntry
                    detailsCard
                    categorySection

                    if let errorMessage = model.errorMessage {
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
            .navigationTitle(Strings.Add.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(Strings.Common.cancel) { dismiss() }
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
                await model.loadCategories(api: session.api)
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
                    model.txType = type
                } label: {
                    Text(type.label)
                        .font(.subheadline.weight(model.txType == type ? .bold : .medium))
                        .foregroundStyle(model.txType == type ? Emerald.text : Emerald.text3)
                        .frame(maxWidth: .infinity)
                        .frame(height: 34)
                        .background {
                            if model.txType == type {
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
        .animation(.easeInOut(duration: 0.15), value: model.txType)
    }

    // MARK: - Amount

    private var amountEntry: some View {
        HStack(alignment: .center, spacing: 2) {
            Text("₹")
                .font(.system(size: 30, weight: .semibold, design: .rounded))
                .foregroundStyle(Emerald.primary)
            TextField("0", text: $model.amountText)
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
            detailRow(Strings.Add.merchantLabel) {
                TextField(Strings.Add.merchantPlaceholder, text: $model.merchant)
                    .font(.subheadline.weight(.semibold))
                    .multilineTextAlignment(.trailing)
            }
            Divider().padding(.leading, 15)
            detailRow(Strings.Add.dateLabel) {
                DatePicker("", selection: $model.date, displayedComponents: .date)
                    .datePickerStyle(.compact)
                    .labelsHidden()
            }
            Divider().padding(.leading, 15)
            detailRow(Strings.Add.paymentLabel) {
                Menu {
                    ForEach(Strings.Add.paymentMethods, id: \.self) { method in
                        Button(method) { model.paymentMethod = method }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(model.paymentMethod)
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
            Text(Strings.Add.categoryHeader)
                .font(.caption.weight(.semibold))
                .foregroundStyle(Emerald.text5)
                .padding(.leading, 4)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 8)], spacing: 8) {
                ForEach(model.categories) { category in
                    categoryChip(category)
                }
                newCategoryChip
            }

            if model.isAddingCategory {
                newCategoryEntry
            }
        }
        .animation(.easeInOut(duration: 0.2), value: model.isAddingCategory)
    }

    private func categoryChip(_ category: Category) -> some View {
        let color = Color(hexString: category.color)
        let isSelected = model.selectedCategoryId == category.id
        return Button {
            model.selectCategory(category.id)
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
            model.isAddingCategory = true
            newCategoryFocused = true
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "plus")
                    .font(.system(size: 12, weight: .bold))
                Text(Strings.Add.newCategory)
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
            TextField(Strings.Add.newCategoryPlaceholder, text: $model.newCategoryName)
                .focused($newCategoryFocused)
                .padding(.horizontal, 14)
                .frame(height: 44)
                .background(Emerald.inputBg)
                .clipShape(.rect(cornerRadius: 11))
                .overlay {
                    RoundedRectangle(cornerRadius: 11)
                        .strokeBorder(Emerald.primary, lineWidth: 1.5)
                }
                .onSubmit { Task { await model.addCategory(api: session.api) } }

            Button {
                Task { await model.addCategory(api: session.api) }
            } label: {
                Text(Strings.Add.addButton)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 18)
                    .frame(height: 44)
                    .background(Emerald.primary)
                    .clipShape(.rect(cornerRadius: 11))
            }
            .disabled(model.newCategoryName.trimmingCharacters(in: .whitespaces).isEmpty)

            Button(Strings.Common.cancel) {
                model.isAddingCategory = false
                model.newCategoryName = ""
            }
            .font(.subheadline)
            .foregroundStyle(Emerald.text3)
        }
    }

    // MARK: - Save

    private var saveButton: some View {
        Button {
            Task {
                if await model.save(api: session.api) {
                    dismiss()
                }
            }
        } label: {
            Text(model.isSaving ? Strings.Add.saving : Strings.Add.saveTransaction)
                .font(.body.weight(.bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Emerald.primary)
                .clipShape(.rect(cornerRadius: 14))
        }
        .disabled(!model.isValid || model.isSaving)
        .opacity(model.isValid && !model.isSaving ? 1 : 0.5)
    }
}
