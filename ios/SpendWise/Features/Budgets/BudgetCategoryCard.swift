import SwiftUI

/// One category budget card: icon tile, spent/budget, status chip,
/// progress bar and a "% used / left" footer.
struct BudgetCategoryCard: View {
    let usage: BudgetUsage

    var body: some View {
        VStack(spacing: 11) {
            HStack(spacing: 12) {
                CategoryIconTile(category: usage.category, size: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text(usage.category.name)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Emerald.text)
                    Text(Strings.Budgets.spentOfBudget(
                        Money.format(usage.spent, abs: true), Money.format(usage.budget, abs: true)
                    ))
                        .font(.caption)
                        .foregroundStyle(Emerald.text5)
                }

                Spacer(minLength: 8)

                statusChip
            }

            progressBar

            HStack {
                Text(Strings.Budgets.pctUsed(usage.pct))
                    .font(.caption.weight(.bold))
                    .foregroundStyle(statusColor)
                Spacer()
                remainingLabel
            }
        }
        .padding(15)
        .emeraldCard()
    }

    // MARK: - Status

    private var statusColor: Color {
        switch usage.status {
        case "over": Emerald.danger
        case "close": Emerald.closeStatus
        default: Emerald.success
        }
    }

    private var statusChip: some View {
        let (label, bg, fg): (String, Color, Color) = switch usage.status {
        case "over": (Strings.Budgets.statusOver, Emerald.dangerBg, Emerald.danger)
        case "close": (Strings.Budgets.statusClose, Emerald.warnBg, Emerald.closeStatus)
        default: (Strings.Budgets.statusOnTrack, Emerald.successBg, Emerald.success)
        }
        return Text(label)
            .font(.caption2.weight(.bold))
            .foregroundStyle(fg)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(bg)
            .clipShape(Capsule())
    }

    // MARK: - Progress

    private var fillStyle: AnyShapeStyle {
        switch usage.status {
        case "over": AnyShapeStyle(Emerald.danger)
        case "close": AnyShapeStyle(Emerald.warn)
        default: AnyShapeStyle(Emerald.heroGradient)
        }
    }

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Emerald.track)
                Capsule()
                    .fill(fillStyle)
                    .frame(width: geo.size.width * CGFloat(min(usage.pct, 100)) / 100)
            }
        }
        .frame(height: 8)
    }

    @ViewBuilder
    private var remainingLabel: some View {
        if usage.spent > usage.budget {
            Text(Strings.Budgets.overBy(Money.format(usage.spent - usage.budget, abs: true)))
                .font(.caption)
                .foregroundStyle(Emerald.danger)
        } else {
            Text(Strings.Budgets.amountLeft(Money.format(usage.budget - usage.spent, abs: true)))
                .font(.caption)
                .foregroundStyle(Emerald.text5)
        }
    }
}
