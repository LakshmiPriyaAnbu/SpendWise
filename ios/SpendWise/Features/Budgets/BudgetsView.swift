import SwiftUI

/// Budgets screen per the mBudgets mobile spec: hero gradient card with the
/// overall budget ring, then one progress card per category budget.
struct BudgetsView: View {
    @Environment(SessionStore.self) private var session

    @State private var summary: AnalyticsSummary?
    @State private var errorMessage: String?

    private var month: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        return formatter.string(from: Date())
    }

    private var monthLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: Date())
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                content
                    .padding(16)
            }
            .background(Emerald.background)
            .navigationTitle("Budgets")
            .task { await load() }
            .refreshable { await load() }
            .animation(.easeOut(duration: 0.35), value: summary)
        }
    }

    @ViewBuilder
    private var content: some View {
        if let summary {
            VStack(alignment: .leading, spacing: 14) {
                heroCard(summary)

                Text("CATEGORIES")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Emerald.text5)
                    .padding(.top, 8)
                    .padding(.leading, 4)

                ForEach(summary.budgetUsage, id: \.category.id) { usage in
                    BudgetCategoryCard(usage: usage)
                }
            }
        } else if let errorMessage {
            VStack(spacing: 12) {
                Text(errorMessage)
                    .font(.subheadline)
                    .foregroundStyle(Emerald.text3)
                    .multilineTextAlignment(.center)
                Button {
                    Task { await load() }
                } label: {
                    Text("Retry")
                        .font(.subheadline.weight(.bold))
                        .padding(.horizontal, 24)
                        .padding(.vertical, 10)
                        .background(Emerald.primary)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }
            }
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
                Text("Monthly budget · \(monthLabel)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))
                Text("\(Money.format(summary.expense, abs: true)) of \(Money.format(summary.budgetTotal, abs: true))")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(.white)
                Text("\(Money.format(summary.budgetLeft, abs: true)) left to spend")
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

    // MARK: - Data

    private func load() async {
        errorMessage = nil
        do {
            summary = try await session.api.summary(month: month)
        } catch {
            if summary == nil {
                errorMessage = error.localizedDescription
            }
        }
    }
}
