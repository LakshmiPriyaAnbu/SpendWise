import SwiftUI

/// Bottom tab bar per the mobile design spec: Home / Activity / Scan / Budgets / Insights.
struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
            ActivityView()
                .tabItem { Label("Activity", systemImage: "list.bullet") }
            ScanView()
                .tabItem { Label("Scan", systemImage: "viewfinder") }
            BudgetsView()
                .tabItem { Label("Budgets", systemImage: "chart.pie.fill") }
            InsightsView()
                .tabItem { Label("Insights", systemImage: "chart.bar.fill") }
        }
    }
}
