import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Pixel Punch AI",
  description: "Privacy policy for Pixel Punch AI assessment tools",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm">
            Last updated: {new Date().toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Welcome to Pixel Punch AI ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, including any 
              other media form, media channel, mobile website, or mobile application related or connected thereto (collectively, the "Site").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We may collect information about you in a variety of ways through the Site. The information we may collect include:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2">
              <li><strong>Personal Data:</strong> Information such as your name, email address, and contact details that you voluntarily provide to us.</li>
              <li><strong>Usage Data:</strong> Information about your interactions with the Site, including IP address, browser type, pages viewed, and time spent.</li>
              <li><strong>Audit Data:</strong> Information you provide through our AI assessment tools, including responses to questions and analysis results.</li>
              <li><strong>Cookies and Tracking Technologies:</strong> We may use cookies and similar tracking technologies to enhance your experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We use the information we collect in the following ways:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2">
              <li>To provide, maintain, and improve our AI assessment tools and services</li>
              <li>To process your audit submissions and generate results</li>
              <li>To communicate with you regarding your audit results and related services</li>
              <li>To understand how users interact with our Site and improve user experience</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note 
              that no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We will retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including for 
              the purposes of satisfying any legal, accounting, or reporting requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2">
              <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Objection:</strong> Object to our processing of your personal information</li>
              <li><strong>Data Portability:</strong> Request transfer of your personal information to another party</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Third-Party Services</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Our Site may contain links to third-party websites or services. We are not responsible for the privacy practices of such third parties 
              and encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes to our practices or for other operational, legal, or regulatory 
              reasons. We will notify you of any material changes by posting the new policy on the Site with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Contact Us</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-300">
                Email: privacy@pixelpunch.ai
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Pixel Punch AI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}