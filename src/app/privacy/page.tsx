import Link from "next/link";

const BG = "#F5F2EC";
const TEXT_PRIMARY = "#0B0B0D";
const TEXT_SECONDARY = "#5E5E63";
const TEXT_MUTED = "#9A9AA0";
const GOLD = "#D4B06A";
const BORDER = "rgba(0,0,0,0.08)";

export const metadata = {
  title: "Privacy Policy — Bloom",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: TEXT_PRIMARY,
          marginBottom: 10,
          fontFamily: 'Georgia,"Palatino Linotype",serif',
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "0 24px 60px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ paddingTop: 40, paddingBottom: 8 }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: TEXT_MUTED,
              textDecoration: "none",
            }}
          >
            ← Back to Bloom
          </Link>
        </div>

        <h1
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: TEXT_PRIMARY,
            letterSpacing: "-0.02em",
            marginBottom: 8,
            fontFamily: 'Georgia,"Palatino Linotype",serif',
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 36 }}>
          Last updated: August 2026
        </p>

        <Section title="Overview">
          <p>
            Bloom ("we", "us", "our") provides AI-personalized fertility, pregnancy, and
            postpartum guidance. This policy explains what information we collect when you use
            the Bloom app or website, how we use it, and the choices you have. By creating an
            account, you agree to the practices described here.
          </p>
        </Section>

        <Section title="Information We Collect">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: TEXT_PRIMARY }}>Account information.</strong> Your email
            address and authentication credentials, handled by Firebase Authentication (Google
            LLC). If you sign in with Google, we receive your name and email from your Google
            account.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: TEXT_PRIMARY }}>Profile and health-related information.</strong>{" "}
            Information you provide during onboarding and while using the app — including age,
            height, weight, journey stage (trying to conceive, pregnant, or postpartum), current
            week, location, occupation, activity level, diet, partner information, and related
            lifestyle details. We use this information to generate your personalized protocol,
            nutrition plans, movement guidance, and journey content.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: TEXT_PRIMARY }}>Community content.</strong> Posts, comments,
            messages, and images you choose to share in community features are visible to other
            users and stored on our servers.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: TEXT_PRIMARY }}>Payment information.</strong> If you
            subscribe, payment is processed by Stripe. We do not store your full card details —
            Stripe handles that directly, and we retain only subscription status and billing
            metadata (such as your subscription ID and renewal date).
          </p>
          <p>
            <strong style={{ color: TEXT_PRIMARY }}>Usage data.</strong> Basic technical
            information such as device type and app interactions, used to maintain and improve
            the service.
          </p>
        </Section>

        <Section title="How We Use Your Information">
          <p style={{ marginBottom: 12 }}>We use your information to:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>
              Generate your personalized daily protocol, nutrition, movement, and journey content
              using an AI model (OpenAI). The profile details relevant to a given request are
              sent to OpenAI to generate that content; OpenAI processes this data to return a
              response and does not use it to train their models under our account settings.
            </li>
            <li style={{ marginBottom: 6 }}>Provide, maintain, and improve the app.</li>
            <li style={{ marginBottom: 6 }}>Process subscription payments and manage billing.</li>
            <li style={{ marginBottom: 6 }}>
              Communicate with you about your account, including transactional emails (password
              resets, billing receipts).
            </li>
            <li>Maintain the security and integrity of the service.</li>
          </ul>
        </Section>

        <Section title="Third-Party Services">
          <p style={{ marginBottom: 12 }}>
            We rely on the following third-party services to operate Bloom. Each processes data
            under its own privacy policy:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>
              <strong style={{ color: TEXT_PRIMARY }}>Firebase</strong> (Google) — authentication
              and database storage.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong style={{ color: TEXT_PRIMARY }}>OpenAI</strong> — generates your
              personalized content from the profile details relevant to each request.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong style={{ color: TEXT_PRIMARY }}>Stripe</strong> — payment processing for
              subscriptions.
            </li>
            <li>
              <strong style={{ color: TEXT_PRIMARY }}>Cloudinary</strong> — image hosting for
              community post uploads.
            </li>
          </ul>
        </Section>

        <Section title="Data Retention">
          <p>
            We retain your information for as long as your account is active. If you delete your
            account, we delete your profile and associated personal data within a reasonable
            period, except where we are required to retain certain records (such as billing
            history) for legal or accounting purposes.
          </p>
        </Section>

        <Section title="Your Rights and Choices">
          <p style={{ marginBottom: 12 }}>Depending on where you live, you may have the right to:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>Access the personal information we hold about you.</li>
            <li style={{ marginBottom: 6 }}>Request correction of inaccurate information.</li>
            <li style={{ marginBottom: 6 }}>Request deletion of your account and associated data.</li>
            <li>Cancel your subscription at any time via your account's billing portal.</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            To exercise any of these rights, contact us at the email below.
          </p>
        </Section>

        <Section title="Data Security">
          <p>
            We use industry-standard measures — including encryption in transit and
            access-controlled cloud infrastructure — to protect your information. No method of
            transmission or storage is perfectly secure, and we cannot guarantee absolute
            security.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            Bloom is not intended for use by anyone under 18. We do not knowingly collect
            information from children.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this policy from time to time. If we make material changes, we will
            notify you through the app or by email before the changes take effect.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            Questions about this policy or your data? Contact us at{" "}
            <a href="mailto:empatechpower@gmail.com" style={{ color: GOLD }}>
              empatechpower@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
