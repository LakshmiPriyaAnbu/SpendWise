import SwiftUI

/// Maps API category icon keys to SF Symbols and renders the tinted icon tile
/// used across lists (mirrors the web app's category icon tiles).
enum CategoryStyle {
    static func symbol(for icon: String) -> String {
        switch icon {
        case "food": return "fork.knife"
        case "rent": return "house"
        case "shopping": return "bag"
        case "travel": return "airplane"
        case "bills": return "bolt"
        case "subs": return "arrow.triangle.2.circlepath"
        case "health": return "heart"
        default: return "ellipsis"
        }
    }
}

struct CategoryIconTile: View {
    let category: Category?
    var size: CGFloat = 40

    var body: some View {
        let color = Color(hexString: category?.color ?? "#8A9691")
        let bg = Color(hexString: category?.bg ?? "#F2F5F3")
        Image(systemName: CategoryStyle.symbol(for: category?.icon ?? "other"))
            .font(.system(size: size * 0.42, weight: .medium))
            .foregroundStyle(color)
            .frame(width: size, height: size)
            .background(bg)
            .clipShape(.rect(cornerRadius: size * 0.3))
    }
}

/// Fallback category used when an id has no match (mirrors web fallback).
extension Category {
    static let other = Category(
        id: "", key: "other", name: "Other",
        color: "#8A9691", bg: "#F2F5F3", icon: "other", isCustom: false
    )
}
