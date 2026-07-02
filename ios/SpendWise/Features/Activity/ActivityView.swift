import SwiftUI

/// Mobile transactions list (design spec `mTx`): search, All/Income/Expenses
/// segments and a grouped white card of transaction rows.
struct ActivityView: View {
    @Environment(SessionStore.self) private var session
    @State private var model = ActivityViewModel()

    @State private var searchText = ""
    @State private var query = ""
    @State private var filter: ActivityViewModel.Filter = .all
    @State private var isPresentingAdd = false
    @State private var debounceTask: Task<Void, Never>?

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
            .navigationTitle(Strings.Activity.title)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresentingAdd = true
                    } label: {
                        Image(systemName: "plus")
                            .fontWeight(.semibold)
                            .foregroundStyle(Emerald.primary)
                    }
                    .accessibilityLabel(Strings.Activity.addTransaction)
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
        let filter: ActivityViewModel.Filter
    }

    // MARK: - Subviews

    private var searchField: some View {
        HStack(spacing: 7) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(Emerald.text5)
            TextField(Strings.Activity.search, text: $searchText)
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
            ForEach(ActivityViewModel.Filter.allCases) { option in
                Text(option.label).tag(option)
            }
        }
        .pickerStyle(.segmented)
    }

    @ViewBuilder
    private var content: some View {
        switch model.phase {
        case .loading:
            ProgressView()
                .padding(.top, 60)
        case .failed(let message):
            ErrorStateView(message: message, retry: { Task { await load() } }, style: .button)
                .padding(.top, 60)
        case .loaded:
            if model.transactions.isEmpty {
                emptyState
            } else {
                transactionCard
            }
        }
    }

    private var transactionCard: some View {
        LazyVStack(spacing: 0) {
            ForEach(model.transactions) { tx in
                TransactionRow(transaction: tx, category: model.category(for: tx.categoryId))
                if tx.id != model.transactions.last?.id {
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
            Text(Strings.Activity.emptyTitle)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(Emerald.text3)
            Text(Strings.Activity.emptySubtitle)
                .font(.caption)
                .foregroundStyle(Emerald.text5)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    // MARK: - Data

    private func load() async {
        await model.load(api: session.api, query: query, filter: filter)
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
                Text(AppDate.shortDay(transaction.date))
                    .font(.caption)
                    .foregroundStyle(Emerald.text5)
            }
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 12)
    }
}
