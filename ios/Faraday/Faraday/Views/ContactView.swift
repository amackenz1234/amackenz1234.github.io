import SwiftUI

struct ContactView: View {
  @State private var appeared = false

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 28) {
          VStack(alignment: .leading, spacing: 12) {
            Text("FARADAY")
              .font(.system(.caption, design: .rounded).weight(.heavy))
              .tracking(2.2)
              .foregroundStyle(FaradayTheme.redBright)

            Text("Visit or call")
              .font(.system(size: 36, weight: .bold))
              .foregroundStyle(FaradayTheme.paper)

            Text("Ontario electric shop. Ask about e-bikes, scooters, mobility, and gear.")
              .font(.body)
              .foregroundStyle(FaradayTheme.muted)
          }
          .opacity(appeared ? 1 : 0)
          .offset(y: appeared ? 0 : 12)

          VStack(alignment: .leading, spacing: 18) {
            contactRow(title: "Phone", value: Catalog.phoneDisplay, systemImage: "phone.fill")
            contactRow(title: "Email", value: Catalog.email, systemImage: "envelope.fill")
            contactRow(title: "GST/HST", value: Catalog.gst, systemImage: "doc.text.fill")
            contactRow(title: "Currency", value: "CAD", systemImage: "dollarsign.circle.fill")
          }
          .padding(18)
          .frame(maxWidth: .infinity, alignment: .leading)
          .background(FaradayTheme.panel, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
          .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
              .stroke(FaradayTheme.line, lineWidth: 1)
          )
          .opacity(appeared ? 1 : 0)
          .offset(y: appeared ? 0 : 18)

          HStack(spacing: 10) {
            Link(destination: URL(string: "tel:\(Catalog.phone)")!) {
              Label("Call shop", systemImage: "phone.fill")
                .font(.subheadline.weight(.heavy))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(FaradayTheme.red, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }

            Link(destination: URL(string: "mailto:\(Catalog.email)")!) {
              Text("Email")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(FaradayTheme.paper)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .overlay(
                  RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(FaradayTheme.line, lineWidth: 1)
                )
            }
          }
        }
        .padding(20)
        .padding(.bottom, 40)
      }
      .background(
        LinearGradient(
          colors: [FaradayTheme.ink, Color(red: 0.08, green: 0.05, blue: 0.06), FaradayTheme.ink],
          startPoint: .top,
          endPoint: .bottom
        )
        .ignoresSafeArea()
      )
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .topBarLeading) {
          BrandMark()
        }
      }
      .toolbarBackground(FaradayTheme.ink.opacity(0.94), for: .navigationBar)
      .toolbarBackground(.visible, for: .navigationBar)
      .onAppear {
        withAnimation(.easeOut(duration: 0.45)) {
          appeared = true
        }
      }
    }
  }

  private func contactRow(title: String, value: String, systemImage: String) -> some View {
    HStack(alignment: .top, spacing: 12) {
      Image(systemName: systemImage)
        .foregroundStyle(FaradayTheme.redBright)
        .frame(width: 22)
      VStack(alignment: .leading, spacing: 2) {
        Text(title)
          .font(.caption.weight(.semibold))
          .tracking(0.6)
          .textCase(.uppercase)
          .foregroundStyle(FaradayTheme.muted)
        Text(value)
          .font(.body.weight(.semibold))
          .foregroundStyle(FaradayTheme.paper)
          .textSelection(.enabled)
      }
    }
  }
}
