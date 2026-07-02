import SwiftUI

@main
struct SpendWiseApp: App {
    @State private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .tint(Emerald.primary)
        }
    }
}

struct RootView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        if session.isLoggedIn {
            MainTabView()
        } else {
            LoginView()
        }
    }
}
