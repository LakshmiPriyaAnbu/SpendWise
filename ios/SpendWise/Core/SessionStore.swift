import Foundation
import Observation

/// App-wide auth session. Token persists in UserDefaults (demo-grade storage).
@Observable
final class SessionStore {
    private(set) var token: String?
    private(set) var user: User?

    var isLoggedIn: Bool { token != nil }

    var api: APIClient { APIClient(token: token) }

    init() {
        token = UserDefaults.standard.string(forKey: "sw_token")
        if let data = UserDefaults.standard.data(forKey: "sw_user") {
            user = try? JSONDecoder().decode(User.self, from: data)
        }
    }

    func login(email: String, password: String) async throws {
        store(try await APIClient(token: nil).login(email: email, password: password))
    }

    func register(name: String, email: String, password: String) async throws {
        store(try await APIClient(token: nil).register(name: name, email: email, password: password))
    }

    func logout() {
        token = nil
        user = nil
        UserDefaults.standard.removeObject(forKey: "sw_token")
        UserDefaults.standard.removeObject(forKey: "sw_user")
    }

    private func store(_ response: AuthResponse) {
        token = response.token
        user = response.user
        UserDefaults.standard.set(response.token, forKey: "sw_token")
        UserDefaults.standard.set(try? JSONEncoder().encode(response.user), forKey: "sw_user")
    }
}
