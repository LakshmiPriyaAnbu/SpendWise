import SwiftUI
import Charts

/// Analytics screen (spec: mAnalytics). Insight cards, spending trend bars,
/// category donut and this month's subscriptions.
struct InsightsView: View {
    @Environment(SessionStore.self) private var session
    @State private var model = InsightsViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Emerald.background.ignoresSafeArea()
                content
            }
            .navigationTitle(Strings.Insights.title)
            .navigationBarTitleDisplayMode(.large)
            .task { await model.load(api: session.api) }
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
                    ForEach(Array(summary.insights.prefix(3)), id: \.title) { insight in
                        insightCard(insight)
                    }
                    trendCard(summary)
                    categoryCard(summary)
                    subscriptionsCard
                }
                .padding(.horizontal, 16)
                .padding(.top, 4)
                .padding(.bottom, 24)
                .animation(.easeOut(duration: 0.35), value: summary)
            }
            .refreshable { await model.load(api: session.api) }
        }
    }

    // MARK: insight cards

    private func insightCard(_ insight: Insight) -> some View {
        HStack(alignment: .top, spacing: 12) {
            tagChip(insight.tag)
            VStack(alignment: .leading, spacing: 2) {
                Text(insight.title)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Emerald.text)
                Text(insight.description)
                    .font(.caption)
                    .foregroundStyle(Emerald.text5)
            }
            Spacer(minLength: 0)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .emeraldCard()
    }

    private func tagChip(_ tag: String) -> some View {
        let colors = chipColors(for: tag)
        return Text(tag.uppercased())
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(colors.fg)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(colors.bg)
            .clipShape(Capsule())
    }

    private func chipColors(for tag: String) -> (bg: Color, fg: Color) {
        switch tag {
        case Strings.Insights.tagAlert: return (Emerald.dangerBg, Emerald.danger)
        case Strings.Insights.tagGreat: return (Emerald.successBg, Emerald.successDark)
        default: return (Emerald.warnBg, Emerald.warnText) // watch
        }
    }

    // MARK: spending trend

    private func trendCard(_ summary: AnalyticsSummary) -> some View {
        let lastMonth = summary.trend.last?.month
        return VStack(alignment: .leading, spacing: 4) {
            Text(Strings.Insights.spendingTrend)
                .font(.headline)
                .foregroundStyle(Emerald.text)
            Text(Strings.Insights.trendSubtitle(Money.format(model.trendAverage, abs: true)))
                .font(.caption)
                .foregroundStyle(Emerald.text5)
            Chart(summary.trend, id: \.month) { point in
                BarMark(
                    x: .value("Month", point.label),
                    y: .value("Spent", Double(point.expense) / 100)
                )
                .foregroundStyle(
                    point.month == lastMonth
                        ? AnyShapeStyle(Emerald.heroGradient)
                        : AnyShapeStyle(Emerald.chartTrackBar)
                )
                .cornerRadius(6)
            }
            .chartYAxis(.hidden)
            .frame(height: 180)
            .padding(.top, 10)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .emeraldCard()
    }

    // MARK: by category

    private func categoryCard(_ summary: AnalyticsSummary) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(Strings.Insights.byCategory)
                .font(.headline)
                .foregroundStyle(Emerald.text)
            HStack(alignment: .center, spacing: 16) {
                SpendingDonutChart(breakdown: summary.breakdown, totalExpense: summary.expense, size: 130)
                VStack(spacing: 7) {
                    ForEach(summary.breakdown, id: \.category.id) { slice in
                        CategoryLegendRow(slice: slice)
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .emeraldCard()
    }

    // MARK: subscriptions

    private var subscriptionsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(Strings.Insights.subscriptions)
                    .font(.headline)
                    .foregroundStyle(Emerald.text)
                Spacer()
                Text(Strings.Insights.perMonth(Money.format(model.subscriptionsTotal, abs: true)))
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Emerald.subscriptionAccent)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 3)
                    .background(Emerald.subscriptionAccentBg)
                    .clipShape(Capsule())
            }
            if model.subscriptions.isEmpty {
                Text(Strings.Insights.noSubscriptions)
                    .font(.caption)
                    .foregroundStyle(Emerald.text5)
            } else {
                ForEach(model.subscriptions) { tx in
                    subscriptionRow(tx)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .emeraldCard()
    }

    private func subscriptionRow(_ tx: Transaction) -> some View {
        HStack(spacing: 12) {
            CategoryIconTile(category: model.category(for: tx.categoryId), size: 34)
            VStack(alignment: .leading, spacing: 1) {
                Text(tx.merchant)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Emerald.text)
                    .lineLimit(1)
                Text(Strings.Insights.monthly)
                    .font(.caption)
                    .foregroundStyle(Emerald.text5)
            }
            Spacer()
            Text(Money.format(tx.amount, abs: true))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Emerald.text)
        }
    }
}
