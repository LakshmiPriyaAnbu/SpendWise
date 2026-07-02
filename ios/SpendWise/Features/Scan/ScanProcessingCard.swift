import SwiftUI

/// Processing state: a miniature fake receipt with an animated scan laser
/// sweeping top→bottom (swscan in the design prototype).
struct ScanProcessingCard: View {
    @State private var sweeping = false

    var body: some View {
        VStack(spacing: 22) {
            fakeReceipt
                .overlay {
                    GeometryReader { geo in
                        Capsule()
                            .fill(Emerald.mint)
                            .frame(height: 3)
                            .shadow(color: Emerald.mint.opacity(0.7), radius: 7, y: 0)
                            .offset(y: sweeping ? geo.size.height - 8 : 6)
                            .animation(
                                .easeInOut(duration: 1.1).repeatForever(autoreverses: true),
                                value: sweeping
                            )
                    }
                }
                .clipShape(.rect(cornerRadius: 8))

            HStack(spacing: 10) {
                ProgressView()
                    .tint(Emerald.primary)
                Text("Reading receipt…")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Emerald.text)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
        .padding(.horizontal, 22)
        .emeraldCard()
        .onAppear { sweeping = true }
    }

    private var fakeReceipt: some View {
        VStack(spacing: 6) {
            Text("BLUE TOKAI COFFEE")
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundStyle(Emerald.text)

            Text("Indiranagar · Jul 1, 2026")
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Emerald.text7)

            dashedDivider
                .padding(.vertical, 4)

            receiptRow("Cappuccino ×2", "360")
            receiptRow("Croissant", "120")
            receiptRow("Cold brew", "180")

            dashedDivider
                .padding(.vertical, 4)

            HStack {
                Text("TOTAL")
                Spacer()
                Text("₹693")
            }
            .font(.system(size: 11, weight: .bold, design: .monospaced))
            .foregroundStyle(Emerald.text)
        }
        .padding(16)
        .frame(width: 190)
        .background(Emerald.card)
        .shadow(color: Emerald.text.opacity(0.14), radius: 15, y: 10)
    }

    private func receiptRow(_ name: String, _ amount: String) -> some View {
        HStack {
            Text(name)
            Spacer()
            Text(amount)
        }
        .font(.system(size: 10, design: .monospaced))
        .foregroundStyle(Emerald.text2)
    }

    private var dashedDivider: some View {
        HorizontalLineShape()
            .stroke(Emerald.border, style: StrokeStyle(lineWidth: 1, dash: [4, 3]))
            .frame(height: 1)
    }
}

private struct HorizontalLineShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        return path
    }
}
