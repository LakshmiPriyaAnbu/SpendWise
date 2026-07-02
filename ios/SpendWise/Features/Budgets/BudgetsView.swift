import SwiftUI

/// Budgets screen per the mBudgets mobile spec: hero gradient card with the
/// overall budget ring, then one progress card per category budget.
struct BudgetsView: View {
    @Environment(SessionStore.self) private var session
    @State private var model = BudgetsViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                content
                    .padding(16)
            }
            .background(Emerald.background)
            .navigationTitle(Strings.Budgets.title)
            .task { await model.load(api: session.api) }
            .refreshable { await model.load(api: session.api) }
            .animation(.easeOut(duration: 0.35), value: model.summary)
        }
    }

    @ViewBuilder
    private var content: some View {
        if let summary = model.summary {
            VStack(alignment: .leading, spacing: 14) {
                heroCard(summary)

                Text(Strings.Budgets.categoriesHeader)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Emerald.text5)
                    .padding(.top, 8)
                    .padding(.leading, 4)

                ForEach(summary.budgetUsage, id: \.category.id) { usage in
                    BudgetCategoryCard(usage: usage)
                }
            }
        } else if let errorMessage = model.errorMessage {
            ErrorStateView(message: errorMessage, retry: { Task { await model.load(api: session.api) } }, style: .button)
                .frame(maxWidth: .infinity)
                .padding(.top, 120)
        } else {
            ProgressView()
                .tint(Emerald.primary)
                .frame(maxWidth: .infinity)
                .padding(.top, 160)
        }
    }

    // MARK: - Hero

    private func heroCard(_ summary: AnalyticsSummary) -> some View {
        HStack(spacing: 18) {
            budgetRing(pct: summary.budgetPct)

            VStack(alignment: .leading, spacing: 4) {
                Text(Strings.Budgets.monthlyBudget(AppDate.currentMonthLabel))
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))
                Text(Strings.Budgets.spentOfBudget(
                    Money.format(summary.expense, abs: true),
                    Money.format(summary.budgetTotal, abs: true)
                ))
                    .font(.title3.weight(.bold))
                    .foregroundStyle(.white)
                Text(Strings.Budgets.amountLeftToSpend(Money.format(summary.budgetLeft, abs: true)))
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))
            }

            Spacer(minLength: 0)
        }
        .padding(18)
        .background(Emerald.heroGradient)
        .clipShape(.rect(cornerRadius: 20))
    }

    private func budgetRing(pct: Int) -> some View {
        ZStack {
            Circle()
                .stroke(.white.opacity(0.18), lineWidth: 12)
            Circle()
                .trim(from: 0, to: CGFloat(min(pct, 100)) / 100)
                .stroke(.white, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(pct)%")
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
        }
        .frame(width: 96, height: 96)
    }
}
