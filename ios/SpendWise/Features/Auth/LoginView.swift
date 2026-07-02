import SwiftUI

struct LoginView: View {
    @Environment(SessionStore.self) private var session
    @State private var model = LoginViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                logo
                    .padding(.top, 72)

                VStack(spacing: 14) {
                    if model.isRegistering {
                        field(Strings.Auth.namePlaceholder, text: $model.name)
                            .textContentType(.name)
                    }
                    field(Strings.Auth.emailPlaceholder, text: $model.email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField(Strings.Auth.passwordPlaceholder, text: $model.password)
                        .textFieldStyle(.plain)
                        .padding(14)
                        .background(Emerald.background)
                        .clipShape(.rect(cornerRadius: 12))

                    if let errorMessage = model.errorMessage {
                        Text(errorMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(Emerald.danger)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button {
                        Task { await model.submit(session: session) }
                    } label: {
                        Text(submitLabel)
                            .font(.subheadline.weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(Emerald.primary)
                            .foregroundStyle(.white)
                            .clipShape(.rect(cornerRadius: 13))
                    }
                    .disabled(model.isBusy)

                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            model.toggleMode()
                        }
                    } label: {
                        Text(model.isRegistering ? Strings.Auth.switchToSignIn : Strings.Auth.switchToRegister)
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

    private var submitLabel: String {
        if model.isBusy {
            return model.isRegistering ? Strings.Auth.creatingAccount : Strings.Auth.signingIn
        }
        return model.isRegistering ? Strings.Auth.createAccount : Strings.Auth.signIn
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
            Text(Strings.Auth.tagline)
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
}
