import { redirect } from "next/navigation";

export default function EnglishTutorAIPrivacyPolicy() {
  redirect("/");
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-4 text-4xl font-bold">
        English Tutor AI Privacy Policy
      </h1>

      <p className="mb-8 text-gray-600">
        Last updated: July 5, 2026
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-2xl font-semibold">1. Introduction</h2>
          <p>
            English Tutor AI is an AI-powered language learning application
            designed to help users practice English through live voice
            conversations with an AI tutor. This Privacy Policy explains how
            information is handled when you use the app.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            2. Microphone and Voice Data
          </h2>
          <p>
            The app requests access to your device microphone so you can speak
            with the AI tutor. Your voice input may be transmitted securely to
            third-party AI service providers for speech recognition and to
            generate a response. Microphone access is used only when you start
            a voice conversation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            3. Information We Process
          </h2>
          <p>
            The app may process voice audio, speech transcriptions, selected
            tutor preferences, learning goals, and technical information
            necessary to provide the service. We do not sell personal
            information.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            4. How Information Is Used
          </h2>
          <p>
            Information is used to provide AI tutoring conversations, recognize
            spoken language, generate tutor responses, maintain app
            functionality, and improve the reliability and safety of the
            service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            5. Third-Party Services
          </h2>
          <p>
            English Tutor AI may use third-party service providers to process
            voice input and generate AI responses. These providers may process
            data according to their own privacy policies and applicable data
            protection requirements.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            6. Data Retention
          </h2>
          <p>
            We do not intentionally store microphone recordings as permanent
            user recordings. Information processed by third-party service
            providers may be retained according to their service terms,
            security requirements, and applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            7. Children&apos;s Privacy
          </h2>
          <p>
            English Tutor AI is not specifically directed to children under 13.
            We do not knowingly collect personal information from children
            under 13 without appropriate authorization.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            8. Security
          </h2>
          <p>
            Reasonable technical measures are used to protect information
            transmitted through the app. However, no internet-based service can
            guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            9. Changes to This Privacy Policy
          </h2>
          <p>
            This Privacy Policy may be updated when the app, its features, or
            legal requirements change. The latest version will be posted on
            this page.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us through
            KAL Accounting & Tax.
          </p>
        </section>
      </div>
    </main>
  );
}