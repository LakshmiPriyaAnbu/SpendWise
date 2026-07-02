import SwiftUI

struct LoginView: View {
    @Environment(SessionStore.self) private var session

    @State private var email = "lakshmi@email.com"
    @State private var password = "spendwise123"
    @State private var name = ""
    @State private var isRegistering = false
    @State private var isBusy = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                logo
                    .padding(.top, 72)

                VStack(spacing: 14) {
                    if isRegistering {
                        field("Name", text: $name)
                            .textContentType(.name)
                    }
                    field("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Password", text: $password)
                        .textFieldStyle(.plain)
                        .padding(14)
                        .background(Emerald.background)
                        .clipShape(.rect(cornerRadius: 12))

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(Emerald.danger)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button {
                        submit()
                    } label: {
                        Text(isBusy ? (isRegistering ? "Creating account…" : "Signing in…")
                                    : (isRegistering ? "Create account" : "Sign in"))
                            .font(.subheadline.weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(Emerald.primary)
                            .foregroundStyle(.white)
                            .clipShape(.rect(cornerRadius: 13))
                    }
                    .disabled(isBusy)

                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            isRegistering.toggle()
                            errorMessage = nil
                        }
                    } label: {
                        Text(isRegistering ? "Have an account? **Sign in**" : "New here? **Create an account**")
                            .font(.footnote)
                            .foregroundStyle(Emerald.text3)
                    }
                    .padding(.top, 4)
                }
                .padding(20)
                .emeraldCard()
                .padding(.horizontal, 20)
            }
        }
        .scrollBounceBehavior(.basedOnSize)
        .background(Emerald.background)
    }

    private var logo: some View {
        VStack(spacing: 12) {
            Image(systemName: "banknote.fill")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 60, height: 60)
                .background(Emerald.heroGradient)
                .clipShape(.rect(cornerRadius: 17))
            (Text("Spend").foregroundStyle(Emerald.text) + Text("Wise").foregroundStyle(Emerald.primary))
                .font(.system(size: 28, weight: .bold, design: .rounded))
            Text("Personal finance, made simple")
                .font(.footnote)
                .foregroundStyle(Emerald.text5)
        }
    }

    private func field(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .textFieldStyle(.plain)
            .padding(14)
            .background(Emerald.background)
            .clipShape(.rect(cornerRadius: 12))
    }

    private func submit() {
        errorMessage = nil
        isBusy = true
        Task {
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
}
