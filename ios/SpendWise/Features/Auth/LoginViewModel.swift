import Foundation
import Observation

/// Holds the sign-in / create-account form state and talks to `SessionStore`
/// so `LoginView` stays presentation-only.
@Observable
@MainActor
final class LoginViewModel {
    var email = "lakshmi@email.com"
    var password = "spendwise123"
    var name = ""
    var isRegistering = false
    private(set) var isBusy = false
    private(set) var errorMessage: String?

    func toggleMode() {
        isRegistering.toggle()
        errorMessage = nil
    }

    func submit(session: SessionStore) async {
        errorMessage = nil
        isBusy = true
        defer { isBusy = false }
        do {
            if isRegistering {
                try await session.register(name: name, email: email, password: password)
            } else {
                try await session.login(email: email, password: password)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
