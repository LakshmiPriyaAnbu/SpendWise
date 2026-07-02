import SwiftUI

/// Mobile transactions list (design spec `mTx`): search, All/Income/Expenses
/// segments and a grouped white card of transaction rows.
struct ActivityView: View {
    @Environment(SessionStore.self) private var session

    @State private var searchText = ""
    @State private var query = ""
    @State private var filter: TxFilter = .all
    @State private var transactions: [Transaction] = []
    @State private var categoriesById: [String: Category] = [:]
    @State private var phase: LoadPhase = .loading
    @State private var isPresentingAdd = false
    @State private var debounceTask: Task<Void, Never>?

    private enum LoadPhase: Equatable {
        case loading
        case loaded
        case failed(String)
    }

    private enum TxFilter: String, CaseIterable, Identifiable {
        case all, income, expense

        var id: String { rawValue }

        var label: String {
            switch self {
            case .all: return "All"
            case .income: return "Income"
            case .expense: return "Expenses"
            }
        }
    }

    private var currentMonth: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        return formatter.string(from: Date())
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    searchField
                    segmentedFilter
                    content
                }
                .padding(.horizontal, 16)
                .padding(.top, 4)
                .padding(.bottom, 24)
            }
            .background(Emerald.background)
            .navigationTitle("Activity")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresentingAdd = true
                    } label: {
                        Image(systemName: "plus")
                            .fontWeight(.semibold)
                            .foregroundStyle(Emerald.primary)
                    }
                    .accessibilityLabel("Add transaction")
                }
            }
            .sheet(isPresented: $isPresentingAdd, onDismiss: {
                Task { await load() }
            }) {
                AddTransactionView()
            }
            .task(id: ReloadKey(query: query, filter: filter)) {
                await load()
            }
            .refreshable {
                await load()
            }
            .onChange(of: searchText) { _, newValue in
                debounceTask?.cancel()
                debounceTask = Task {
                    try? await Task.sleep(for: .milliseconds(300))
                    guard !Task.isCancelled else { return }
                    query = newValue
                }
            }
        }
    }

    private struct ReloadKey: Hashable {
        let query: String
        let filter: TxFilter
    }

    // MARK: - Subviews

    private var searchField: some View {
        HStack(spacing: 7) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(Emerald.text5)
            TextField("Search", text: $searchText)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, 12)
        .frame(height: 40)
        .background(Color(.systemGray6))
        .clipShape(.rect(cornerRadius: 12))
    }

    private var segmentedFilter: some View {
        Picker("Filter", selection: $filter) {
            ForEach(TxFilter.allCases) { option in
                Text(option.label).tag(option)
            }
        }
        .pickerStyle(.segmented)
    }

    @ViewBuilder
    private var content: some View {
        switch phase {
        case .loading:
            ProgressView()
                .padding(.top, 60)
        case .failed(let message):
            VStack(spacing: 12) {
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(Emerald.text3)
                    .multilineTextAlignment(.center)
                Button {
                    Task { await load() }
                } label: {
                    Text("Retry")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 22)
                        .padding(.vertical, 10)
                        .background(Emerald.primary)
                        .clipShape(.rect(cornerRadius: 12))
                }
            }
            .padding(.top, 60)
        case .loaded:
            if transactions.isEmpty {
                emptyState
            } else {
                transactionCard
            }
        }
    }

    private var transactionCard: some View {
        LazyVStack(spacing: 0) {
            ForEach(transactions) { tx in
                TransactionRow(
                    transaction: tx,
                    category: categoriesById[tx.categoryId] ?? .other
                )
                if tx.id != transactions.last?.id {
                    Divider()
                        .padding(.leading, 67)
                }
            }
        }
        .emeraldCard()
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 22, weight: .medium))
                .foregroundStyle(Emerald.text5)
                .frame(width: 52, height: 52)
                .background(Emerald.track)
                .clipShape(.rect(cornerRadius: 15))
            Text("No matching transactions")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(Emerald.text3)
            Text("Try a different search or filter")
                .font(.caption)
                .foregroundStyle(Emerald.text5)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    // MARK: - Data

    private func load() async {
        if transactions.isEmpty { phase = .loading }
        do {
            if categoriesById.isEmpty {
                let categories = try await session.api.categories()
                categoriesById = Dictionary(
                    uniqueKeysWithValues: categories.map { ($0.id, $0) }
                )
            }
            transactions = try await session.api.transactions(
                month: currentMonth,
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

// MARK: - Row

private struct TransactionRow: View {
    let transaction: Transaction
    let category: Category

    private var isIncome: Bool { transaction.amount > 0 }

    var body: some View {
        HStack(spacing: 12) {
            CategoryIconTile(category: category, size: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.merchant)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Emerald.text)
                    .lineLimit(1)
                Text("\(category.name) · \(transaction.paymentMethod)")
                    .font(.caption)
                    .foregroundStyle(Emerald.text5)
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            VStack(alignment: .trailing, spacing: 2) {
                Text(Money.format(transaction.amount, signed: isIncome))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(isIncome ? Emerald.success : Emerald.text)
                Text(Self.displayDate(transaction.date))
                    .font(.caption)
                    .foregroundStyle(Emerald.text5)
            }
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 12)
    }

    /// "yyyy-MM-dd" → "MMM d"
    private static func displayDate(_ isoDay: String) -> String {
        let parser = DateFormatter()
        parser.dateFormat = "yyyy-MM-dd"
        guard let date = parser.date(from: isoDay) else { return isoDay }
        let out = DateFormatter()
        out.dateFormat = "MMM d"
        return out.string(from: date)
    }
}
