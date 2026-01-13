import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export const metadata = {
  title: "Privacy Policy | LandlordComply",
  description: "Privacy Policy for LandlordComply - How we collect, use, and protect your data",
};

export default function PrivacyPage() {
  const lastUpdated = "January 2025";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo iconSize={32} showCheckmark={false} />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              LandlordComply ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our security
              deposit compliance software service ("Service"). Please read this policy carefully. By using the
              Service, you consent to the practices described in this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium mt-6 mb-3">2.1 Information You Provide</h3>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you voluntarily provide when using our Service, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
              <li><strong>Property Information:</strong> Property addresses, unit numbers, and jurisdiction details</li>
              <li><strong>Tenant Information:</strong> Tenant names, contact information, and forwarding addresses</li>
              <li><strong>Financial Information:</strong> Security deposit amounts, deduction details, and refund calculations</li>
              <li><strong>Documents and Attachments:</strong> Photos, receipts, invoices, and other files you upload</li>
              <li><strong>Communications:</strong> Messages you send to us for support or feedback</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you use our Service, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li><strong>Usage Data:</strong> Pages visited, features used, actions taken, and time spent on the Service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> IP addresses, access times, and referring URLs</li>
              <li><strong>Cookies:</strong> Small data files stored on your device (see Section 6)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process your transactions and manage your account</li>
              <li>Generate compliance documents and calculations</li>
              <li>Send deadline reminders and important notifications</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Improve and personalize the Service</li>
              <li>Analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues or fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. How We Share Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li><strong>Service Providers:</strong> With third-party vendors who assist us in operating the Service (e.g., hosting, payment processing, email delivery)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property, or that of our users or others</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you have given us explicit permission to share your information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your information,
              including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure cloud infrastructure with industry-standard protections</li>
              <li>Access controls and authentication requirements</li>
              <li>Regular security assessments and monitoring</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Your data is stored on secure servers in the United States. While we strive to protect your information,
              no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences</li>
              <li>Understand how you use our Service</li>
              <li>Improve user experience</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookies through your browser settings. Disabling cookies may affect certain features
              of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:privacy@landlordcomply.com" className="text-primary hover:underline">
                privacy@landlordcomply.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide the Service.
              We may also retain certain information as required by law or for legitimate business purposes, such as:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li>Resolving disputes</li>
              <li>Enforcing our agreements</li>
              <li>Complying with legal obligations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You may request deletion of your account and associated data at any time. Some information may be
              retained in backups for a limited period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. California Privacy Rights (CCPA)</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act
              (CCPA), including the right to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li>Know what personal information we collect, use, and disclose</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of the sale of your personal information (we do not sell personal information)</li>
              <li>Non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is not intended for children under 18 years of age. We do not knowingly collect personal
              information from children. If we learn that we have collected information from a child under 18,
              we will delete that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service may contain links to third-party websites or integrate with third-party services.
              We are not responsible for the privacy practices of these third parties. We encourage you to
              review their privacy policies before providing any information.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Vercel:</strong> Hosting and deployment</li>
              <li><strong>Google AI (Gemini):</strong> AI-powered text generation (optional feature)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the "Last updated" date. Your continued use
              of the Service after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-foreground">
                <strong>Email:</strong>{" "}
                <a href="mailto:privacy@landlordcomply.com" className="text-primary hover:underline">
                  privacy@landlordcomply.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-primary hover:underline text-sm">
            &larr; Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
