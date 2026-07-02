import SwiftUI

/// Emerald design system tokens (spendwise-design skill).
enum Emerald {
    static let primary = Color(hex: 0x0E7C66)
    static let primaryDark = Color(hex: 0x0A5F4E)
    static let primaryBright = Color(hex: 0x18B184)
    static let sidebar = Color(hex: 0x0C2A22)
    static let mint = Color(hex: 0x4FD1A8)

    static let background = Color(hex: 0xF2F2F7) // iOS grouped bg per spec
    static let card = Color.white
    static let border = Color(hex: 0xE9EFEC)
    static let track = Color(hex: 0xEEF2F0)

    static let text = Color(hex: 0x182420)
    static let text2 = Color(hex: 0x3F524B)
    static let text3 = Color(hex: 0x5A6B65)
    static let text5 = Color(hex: 0x7D8D87)
    static let text7 = Color(hex: 0x9AA8A2)

    static let success = Color(hex: 0x16A06A)
    static let successBg = Color(hex: 0xE7F4EE)
    static let successPanel = Color(hex: 0xEEFAF5)
    static let successDark = Color(hex: 0x0A5F4E)
    static let warn = Color(hex: 0xD9822B)
    static let warnBg = Color(hex: 0xFEF4E7)
    static let warnText = Color(hex: 0x8A5A12)
    static let danger = Color(hex: 0xD9503F)
    static let dangerBg = Color(hex: 0xFDF1EF)

    static let heroGradient = LinearGradient(
        colors: [Color(hex: 0x18B184), Color(hex: 0x0E7C66)],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    static let avatarGradient = LinearGradient(
        colors: [Color(hex: 0xF0B6D3), Color(hex: 0xC77DAE)],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }

    /// Parse "#RRGGBB" strings coming from the API (category colors).
    init(hexString: String) {
        let cleaned = hexString.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        self.init(hex: UInt32(cleaned, radix: 16) ?? 0x8A9691)
    }
}

/// White rounded card matching the web `.sw-card`.
struct EmeraldCard: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Emerald.card)
            .clipShape(.rect(cornerRadius: 18))
    }
}

extension View {
    func emeraldCard() -> some View { modifier(EmeraldCard()) }
}
