import Foundation

enum APIError: LocalizedError {
    case server(String)
    case unauthorized
    case transport(Error)

    var errorDescription: String? {
        switch self {
        case .server(let message): return message
        case .unauthorized: return "Session expired — please sign in again"
        case .transport: return "Could not reach the SpendWise server"
        }
    }
}

/// Thin async URLSession client for the SpendWise API (api-conventions skill).
/// The simulator reaches the dev server on the host via localhost.
struct APIClient {
    static let baseURL = URL(string: "http://localhost:3000")!

    var token: String?

    // MARK: auth
    func login(email: String, password: String) async throws -> AuthResponse {
        try await post("/api/auth/login", body: ["email": email, "password": password])
    }

    func register(name: String, email: String, password: String) async throws -> AuthResponse {
        try await post("/api/auth/register", body: ["name": name, "email": email, "password": password])
    }

    // MARK: domain
    func summary(month: String) async throws -> AnalyticsSummary {
        try await get("/api/analytics/summary", query: ["month": month])
    }

    func categories() async throws -> [Category] {
        try await get("/api/categories")
    }

    func transactions(month: String? = nil, type: String? = nil, q: String? = nil) async throws -> [Transaction] {
        var query: [String: String] = [:]
        if let month { query["month"] = month }
        if let type, type != "all" { query["type"] = type }
        if let q, !q.isEmpty { query["q"] = q }
        return try await get("/api/transactions", query: query)
    }

    func createTransaction(_ body: CreateTxRequest) async throws -> Transaction {
        try await post("/api/transactions", body: body)
    }

    func createCategory(name: String) async throws -> Category {
        try await post("/api/categories", body: ["name": name])
    }

    func scanReceipt() async throws -> ScanResult {
        // Mock-OCR endpoint accepts an empty multipart body.
        let boundary = UUID().uuidString
        var request = makeRequest(path: "/api/receipts/scan", method: "POST")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = "--\(boundary)--\r\n".data(using: .utf8)
        return try await send(request)
    }

    // MARK: plumbing
    private func makeRequest(path: String, method: String, query: [String: String] = [:]) -> URLRequest {
        var components = URLComponents(url: Self.baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        var request = URLRequest(url: components.url!)
        request.httpMethod = method
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func get<T: Decodable>(_ path: String, query: [String: String] = [:]) async throws -> T {
        try await send(makeRequest(path: path, method: "GET", query: query))
    }

    private func post<T: Decodable>(_ path: String, body: some Encodable) async throws -> T {
        var request = makeRequest(path: path, method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        return try await send(request)
    }

    private func send<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.transport(error)
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            if status == 401 { throw APIError.unauthorized }
            if let envelope = try? JSONDecoder().decode(APIErrorEnvelope.self, from: data) {
                throw APIError.server(envelope.error.message)
            }
            throw APIError.server("Request failed (\(status))")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
