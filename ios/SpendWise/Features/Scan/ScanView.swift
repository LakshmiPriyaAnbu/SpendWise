import SwiftUI

/// Receipt scanning flow per the mScan mobile spec:
/// idle (viewfinder) → processing (fake receipt + laser) → review (editable fields).
struct ScanView: View {
    enum ScanStep {
        case idle
        case processing
        case review
    }

    @Environment(SessionStore.self) private var session

    @State private var step: ScanStep = .idle
    @State private var result: ScanResult?
    @State private var categories: [Category] = []

    // Editable review fields
    @State private var merchant = ""
    @State private var dateString = ""
    @State private var totalRupees = ""
    @State private var selectedCategoryId = ""

    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showError = false
    @State private var showSavedToast = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    switch step {
                    case .idle:
                        idleSection
                    case .processing:
                        ScanProcessingCard()
                    case .review:
                        if let result {
                            ScanReviewView(
                                result: result,
                                categories: categories,
                                merchant: $merchant,
                                dateString: $dateString,
                                totalRupees: $totalRupees,
                                selectedCategoryId: $selectedCategoryId,
                                isSaving: isSaving,
                                onConfirm: save,
                                onScanAgain: reset
                            )
                        }
                    }
                }
                .padding(16)
            }
            .scrollBounceBehavior(.basedOnSize)
            .background(Emerald.background)
            .navigationTitle("Scan Receipt")
            .animation(.easeInOut(duration: 0.3), value: step)
            .overlay(alignment: .bottom) {
                if showSavedToast {
                    savedToast
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .animation(.spring(duration: 0.3), value: showSavedToast)
            .alert("Something went wrong", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "Please try again.")
            }
        }
    }

    // MARK: - Idle

    private var idleSection: some View {
        VStack(spacing: 12) {
            viewfinderCard

            Button {
                start()
            } label: {
                Label("Take Photo", systemImage: "camera.fill")
                    .font(.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Emerald.primary)
                    .foregroundStyle(.white)
                    .clipShape(.rect(cornerRadius: 14))
            }

            Button {
                start()
            } label: {
                Text("Upload from Files")
                    .font(.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Emerald.card)
                    .foregroundStyle(Emerald.primary)
                    .clipShape(.rect(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Emerald.border, lineWidth: 1)
                    )
            }
        }
    }

    private var viewfinderCard: some View {
        VStack(spacing: 14) {
            Image(systemName: "camera.viewfinder")
                .font(.system(size: 30, weight: .medium))
                .foregroundStyle(Emerald.mint)
                .frame(width: 68, height: 68)
                .background(Emerald.mint.opacity(0.16))
                .clipShape(.rect(cornerRadius: 20))

            Text("Position receipt in frame")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.8))

            Text("We'll auto-detect the merchant, date and total for you")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.55))
                .multilineTextAlignment(.center)
                .frame(maxWidth: 220)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 380)
        .background(Emerald.sidebar)
        .overlay(alignment: .topLeading) { cornerBracket(rotation: 0) }
        .overlay(alignment: .topTrailing) { cornerBracket(rotation: 90) }
        .overlay(alignment: .bottomTrailing) { cornerBracket(rotation: 180) }
        .overlay(alignment: .bottomLeading) { cornerBracket(rotation: 270) }
        .clipShape(.rect(cornerRadius: 20))
    }

    private func cornerBracket(rotation: Double) -> some View {
        CornerBracketShape()
            .stroke(.white.opacity(0.6), style: StrokeStyle(lineWidth: 3, lineCap: .round))
            .frame(width: 34, height: 34)
            .rotationEffect(.degrees(rotation))
            .padding(18)
    }

    // MARK: - Flow

    private func start() {
        errorMessage = nil
        step = .processing
        Task {
            do {
                async let scanned = session.api.scanReceipt()
                async let loadedCategories = session.api.categories()
                // Keep the scan animation on screen long enough to read.
                try? await Task.sleep(nanoseconds: 1_900_000_000)

                let scan = try await scanned
                categories = try await loadedCategories

                result = scan
                merchant = scan.merchant
                dateString = scan.date
                let rupees = Double(scan.total) / 100
                totalRupees = rupees.truncatingRemainder(dividingBy: 1) == 0
                    ? String(Int(rupees))
                    : String(format: "%.2f", rupees)
                selectedCategoryId = scan.suggestedCategoryId

                withAnimation(.easeInOut(duration: 0.3)) {
                    step = .review
                }
            } catch {
                errorMessage = error.localizedDescription
                showError = true
                withAnimation { step = .idle }
            }
        }
    }

    private func save() {
        guard let result, !isSaving else { return }
        let rupees = Double(totalRupees) ?? Double(result.total) / 100
        let paise = -abs(Int((rupees * 100).rounded()))
        isSaving = true
        Task {
            defer { isSaving = false }
            do {
                _ = try await session.api.createTransaction(CreateTxRequest(
                    merchant: merchant,
                    categoryId: selectedCategoryId,
                    date: result.date,
                    paymentMethod: "Receipt scan",
                    amount: paise,
                    lineItems: result.lineItems
                ))
                reset()
                showSavedToast = true
                Task {
                    try? await Task.sleep(nanoseconds: 2_200_000_000)
                    showSavedToast = false
                }
            } catch {
                errorMessage = error.localizedDescription
                showError = true
                reset()
            }
        }
    }

    private func reset() {
        withAnimation(.easeInOut(duration: 0.25)) {
            step = .idle
        }
        result = nil
        merchant = ""
        dateString = ""
        totalRupees = ""
        selectedCategoryId = ""
    }

    // MARK: - Toast

    private var savedToast: some View {
        HStack(spacing: 9) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(Emerald.mint)
            Text("Saved to transactions")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 13)
        .background(Emerald.sidebar)
        .clipShape(Capsule())
        .shadow(color: Emerald.sidebar.opacity(0.4), radius: 14, y: 8)
        .padding(.bottom, 16)
    }
}

/// One "L" corner bracket with a rounded elbow; rotate for the other corners.
private struct CornerBracketShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let radius: CGFloat = 8
        path.move(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + radius))
        path.addQuadCurve(
            to: CGPoint(x: rect.minX + radius, y: rect.minY),
            control: CGPoint(x: rect.minX, y: rect.minY)
        )
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        return path
    }
}
