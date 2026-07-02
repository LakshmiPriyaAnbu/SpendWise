import SwiftUI

/// Receipt scanning flow per the mScan mobile spec:
/// idle (viewfinder) → processing (fake receipt + laser) → review (editable fields).
struct ScanView: View {
    @Environment(SessionStore.self) private var session
    @Bindable private var model = ScanViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    switch model.step {
                    case .idle:
                        idleSection
                    case .processing:
                        ScanProcessingCard()
                    case .review:
                        if let result = model.result {
                            ScanReviewView(
                                result: result,
                                categories: model.categories,
                                merchant: $model.merchant,
                                dateString: $model.dateString,
                                totalRupees: $model.totalRupees,
                                selectedCategoryId: $model.selectedCategoryId,
                                isSaving: model.isSaving,
                                onConfirm: { Task { await model.save(api: session.api) } },
                                onScanAgain: model.reset
                            )
                        }
                    }
                }
                .padding(16)
            }
            .scrollBounceBehavior(.basedOnSize)
            .background(Emerald.background)
            .navigationTitle(Strings.Scan.title)
            .animation(.easeInOut(duration: 0.3), value: model.step)
            .overlay(alignment: .bottom) {
                if model.showSavedToast {
                    savedToast
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .animation(.spring(duration: 0.3), value: model.showSavedToast)
            .alert(Strings.Common.somethingWentWrong, isPresented: $model.showError) {
                Button(Strings.Common.ok, role: .cancel) {}
            } message: {
                Text(model.errorMessage ?? Strings.Common.pleaseTryAgain)
            }
        }
    }

    // MARK: - Idle

    private var idleSection: some View {
        VStack(spacing: 12) {
            viewfinderCard

            Button {
                Task { await model.start(api: session.api) }
            } label: {
                Label(Strings.Scan.takePhoto, systemImage: "camera.fill")
                    .font(.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Emerald.primary)
                    .foregroundStyle(.white)
                    .clipShape(.rect(cornerRadius: 14))
            }

            Button {
                Task { await model.start(api: session.api) }
            } label: {
                Text(Strings.Scan.uploadFromFiles)
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

            Text(Strings.Scan.positionReceipt)
                .font(.headline)
                .foregroundStyle(.white.opacity(0.8))

            Text(Strings.Scan.autoDetectHint)
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

    // MARK: - Toast

    private var savedToast: some View {
        HStack(spacing: 9) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(Emerald.mint)
            Text(Strings.Scan.savedToast)
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
