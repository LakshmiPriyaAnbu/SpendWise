import SwiftUI

/// Bottom tab bar per the mobile design spec: Home / Activity / Scan / Budgets / Insights.
struct MainTabView: View {
    // SW_TAB env var selects the initial tab (headless UI-verification hook).
    @State private var selection = Int(ProcessInfo.processInfo.environment["SW_TAB"] ?? "") ?? 0

    var body: some View {
        TabView(selection: $selection) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)
            ActivityView()
                .tabItem { Label("Activity", systemImage: "list.bullet") }
                .tag(1)
            ScanView()
                .tabItem { Label("Scan", systemImage: "viewfinder") }
                .tag(2)
            BudgetsView()
                .tabItem { Label("Budgets", systemImage: "chart.pie.fill") }
                .tag(3)
            InsightsView()
                .tabItem { Label("Insights", systemImage: "chart.bar.fill") }
                .tag(4)
        }
    }
}
