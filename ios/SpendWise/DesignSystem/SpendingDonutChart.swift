import SwiftUI
import Charts

/// Category spend donut with a "Total spent" center label. Shared by
/// HomeView and InsightsView so both stay visually identical.
struct SpendingDonutChart: View {
    let breakdown: [CategoryBreakdown]
    let totalExpense: Int
    var size: CGFloat = 140

    var body: some View {
        Chart(breakdown, id: \.category.id) { slice in
            SectorMark(
                angle: .value("Spent", slice.spent),
                innerRadius: .ratio(0.72),
                angularInset: 1.5
            )
            .foregroundStyle(Color(hexString: slice.category.color))
        }
        .chartLegend(.hidden)
        .frame(width: size, height: size)
        .overlay {
            VStack(spacing: 2) {
                Text(Strings.Charts.totalSpent)
                    .font(.system(size: 10))
                    .foregroundStyle(Emerald.text5)
                Text(Money.format(totalExpense, abs: true))
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(Emerald.text)
            }
        }
    }
}

/// One category row (dot, name, amount, %) used beside the donut chart on
/// Home and Insights.
struct CategoryLegendRow: View {
    let slice: CategoryBreakdown

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(Color(hexString: slice.category.color))
                .frame(width: 8, height: 8)
            Text(slice.category.name)
                .font(.caption)
                .foregroundStyle(Emerald.text2)
                .lineLimit(1)
            Spacer(minLength: 4)
            Text(Money.format(slice.spent, abs: true))
                .font(.caption.weight(.bold))
                .foregroundStyle(Emerald.text)
            Text("\(slice.pct)%")
                .font(.caption2)
                .foregroundStyle(Emerald.text5)
        }
    }
}
