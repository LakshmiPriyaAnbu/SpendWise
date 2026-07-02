import SwiftUI

/// Mobile dashboard (spec: mHome). Greeting header, balance hero, quick
/// actions, spending donut, budget progress, insight banner and recent rows.
struct HomeView: View {
    @Environment(SessionStore.self) private var session
    @State private var model = HomeViewModel()
    @State private var activeSheet: HomeQuickAction?

    var body: some View {
        NavigationStack {
            ZStack {
                Emerald.background.ignoresSafeArea()
                content
            }
            .toolbar(.hidden, for: .navigationBar)
            .task { await model.load(api: session.api) }
        }
        .sheet(item: $activeSheet) { action in
            switch action {
            case .add: AddTransactionView()
            case .scan: ScanView()
            case .budgets: BudgetsView()
            case .insights: InsightsView()
            }
        }
    }

    // MARK: content states

    @ViewBuilder
    private var content: some View {
        if model.isLoading {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let message = model.errorMessage, model.summary == nil {
            ErrorStateView(message: message, retry: { Task { await model.load(api: session.api) } })
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let summary = model.summary {
            ScrollView {
                VStack(spacing: 14) {
                    greetingHeader
                    heroCard(summary)
                    quickActionsRow
                    spendingCard(summary)
                    budgetCard(summary)
                    if let insight = summary.insights.first {
                        insightBanner(insight)
                    }
                    recentCard(summary)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 24)
                .animation(.easeOut(duration: 0.35), value: summary)
            }
            .refreshable { await model.load(api: session.api) }
        }
    }

    // MARK: greeting header

    private var greetingHeader: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text(Strings.Home.greeting)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Emerald.text5)
                Text(firstName)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(Emerald.text)
            }
            Spacer()
            Text(userInitial)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 38, height: 38)
                .background(Emerald.avatarGradient)
                .clipShape(Circle())
        }
        .padding(.top, 4)
    }

    private var firstName: String {
        let name = session.user?.name ?? "there"
        return name.split(separator: " ").first.map(String.init) ?? name
    }

    private var userInitial: String {
        String(session.user?.name.prefix(1) ?? "U").uppercased()
    }

    // MARK: balance hero

    private func heroCard(_ summary: AnalyticsSummary) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(Strings.Home.totalBalance)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
            Text(Money.format(summary.balance))
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            HStack(spacing: 14) {
                heroMiniStat(label: Strings.Home.income, amount: summary.income)
                Rectangle()
                    .fill(.white.opacity(0.25))
                    .frame(width: 1, height: 30)
                heroMiniStat(label: Strings.Home.spent, amount: summary.expense)
            }
            .padding(.top, 12)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Emerald.heroGradient)
        .clipShape(.rect(cornerRadius: 20))
    }

    private func heroMiniStat(label: String, amount: Int) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
            Text(Money.format(amount, abs: true))
                .font(.system(size: 16, weight: .semibold, design: .rounded))
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: quick actions

    private var quickActionsRow: some View {
        HStack(spacing: 10) {
            ForEach(HomeQuickAction.allCases) { action in
                Button {
                    activeSheet = action
                } label: {
                    VStack(spacing: 7) {
                        Image(systemName: action.symbol)
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(Emerald.primary)
                            .frame(width: 54, height: 54)
                            .background(Emerald.card)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Emerald.border, lineWidth: 1))
                        Text(action.title)
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(Emerald.text2)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.top, 2)
    }

    // MARK: spending by category

    private func spendingCard(_ summary: AnalyticsSummary) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(Strings.Home.spendingByCategory)
                .font(.headline)
                .foregroundStyle(Emerald.text)
            HStack(spacing: 16) {
                SpendingDonutChart(breakdown: summary.breakdown, totalExpense: summary.expense)
                VStack(spacing: 8) {
                    ForEach(Array(summary.breakdown.prefix(4)), id: \.category.id) { slice in
                        CategoryLegendRow(slice: slice)
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .emeraldCard()
    }

    // MARK: monthly budget

    private func budgetCard(_ summary: AnalyticsSummary) -> some View {
        let fraction = min(1, Double(summary.budgetPct) / 100)
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(Strings.Home.monthlyBudget)
                    .font(.headline)
                    .foregroundStyle(Emerald.text)
                Spacer()
                Text(Strings.Home.budgetPctUsed(summary.budgetPct))
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Emerald.primary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Emerald.track)
                    Capsule()
                        .fill(Emerald.heroGradient)
                        .frame(width: geo.size.width * fraction)
                }
            }
            .frame(height: 10)
            .animation(.easeOut(duration: 0.5), value: fraction)
            HStack {
                Text(Strings.Home.amountLeft(Money.format(summary.budgetLeft, abs: true)))
                    .font(.caption)
                    .foregroundStyle(Emerald.text5)
                Spacer()
                Text(Strings.Home.ofAmount(Money.format(summary.budgetTotal, abs: true)))
                    .font(.caption)
                    .foregroundStyle(Emerald.text5)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .emeraldCard()
    }

    // MARK: insight banner

    private func insightBanner(_ insight: Insight) -> some View {
        let isGreat = insight.tag == Strings.Insights.tagGreat
        return VStack(alignment: .leading, spacing: 2) {
            Text(insight.title)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(isGreat ? Emerald.successDark : Emerald.warnText)
            Text(insight.description)
                .font(.system(size: 12))
                .foregroundStyle(isGreat ? Emerald.successDark.opacity(0.8) : Emerald.warnTextMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(isGreat ? Emerald.successPanel : Emerald.warnBg)
        .clipShape(.rect(cornerRadius: 16))
    }

    // MARK: recent transactions

    private func recentCard(_ summary: AnalyticsSummary) -> some View {
        let recent = Array(summary.recentTransactions.prefix(5))
        return VStack(alignment: .leading, spacing: 0) {
            Text(Strings.Home.recentTransactions)
                .font(.headline)
                .foregroundStyle(Emerald.text)
                .padding(.bottom, 6)
            ForEach(recent) { tx in
                transactionRow(tx)
                if tx.id != recent.last?.id {
                    Divider()
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .emeraldCard()
    }

    private func transactionRow(_ tx: Transaction) -> some View {
        let category = model.category(for: tx.categoryId)
        let isIncome = tx.amount > 0
        return HStack(spacing: 12) {
            CategoryIconTile(category: category, size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(tx.merchant)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Emerald.text)
                    .lineLimit(1)
                Text("\(category.name) · \(AppDate.shortDay(tx.date))")
                    .font(.caption)
                    .foregroundStyle(Emerald.text5)
            }
            Spacer()
            Text(isIncome ? Money.format(tx.amount, signed: true) : Money.format(tx.amount))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(isIncome ? Emerald.success : Emerald.text)
        }
        .padding(.vertical, 10)
    }
}

// MARK: - quick action model

enum HomeQuickAction: String, CaseIterable, Identifiable {
    case add, scan, budgets, insights

    var id: String { rawValue }

    var title: String {
        switch self {
        case .add: return Strings.Home.addAction
        case .scan: return Strings.Home.scanAction
        case .budgets: return Strings.Home.budgetsAction
        case .insights: return Strings.Home.insightsAction
        }
    }

    var symbol: String {
        switch self {
        case .add: return "plus.circle.fill"
        case .scan: return "viewfinder"
        case .budgets: return "chart.pie.fill"
        case .insights: return "chart.bar.fill"
        }
    }
}
