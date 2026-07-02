import SwiftUI

/// A centered message + Retry button, used by every screen's full-page
/// error state (Home, Insights, Activity, Budgets) so the styling and copy
/// stay consistent across the app.
struct ErrorStateView: View {
    let message: String
    let retry: () -> Void
    var style: Style = .link

    /// `.link` matches Home/Insights (text-only retry); `.button` matches
    /// Activity/Budgets (filled pill retry).
    enum Style {
        case link
        case button
    }

    var body: some View {
        VStack(spacing: 12) {
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Emerald.text3)
                .multilineTextAlignment(.center)

            switch style {
            case .link:
                Button(Strings.Common.retry, action: retry)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Emerald.primary)
            case .button:
                Button(action: retry) {
                    Text(Strings.Common.retry)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 22)
                        .padding(.vertical, 10)
                        .background(Emerald.primary)
                        .clipShape(.rect(cornerRadius: 12))
                }
            }
        }
        .padding(24)
    }
}
