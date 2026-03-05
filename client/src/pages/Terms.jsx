import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Privacy.css';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="privacy">
      <button className="privacy__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h1 className="privacy__title">Terms of Service</h1>
      <p className="privacy__updated">Last updated: March 5, 2026</p>

      <div className="privacy__content">
        <section>
          <h2>About Snappy</h2>
          <p>
            Snappy is an AI-powered filing assistant that helps you classify photos and
            voice memos and save them to Google Calendar, Google Drive, Google Contacts,
            or personal notes.
          </p>
        </section>

        <section>
          <h2>Using Snappy</h2>
          <p>
            By using Snappy, you agree to these terms. You must have a Google account
            to use features that connect to Google services.
          </p>
          <p>
            You are responsible for the content you capture and save through Snappy.
            Do not use Snappy for any unlawful purpose.
          </p>
        </section>

        <section>
          <h2>AI Classification</h2>
          <p>
            Snappy uses Google Gemini AI to classify your photos and voice memos.
            AI classifications are suggestions — always review before saving.
            We do not guarantee the accuracy of AI-generated content.
          </p>
        </section>

        <section>
          <h2>Your Google Account</h2>
          <p>
            Snappy accesses your Google Calendar, Drive, and Contacts only when you
            explicitly choose to save something. You can disconnect your Google account
            at any time from the Settings page.
          </p>
        </section>

        <section>
          <h2>Data and Privacy</h2>
          <p>
            Your photos and voice memos are processed in memory and not stored on our
            servers. Notes and activity history are stored locally on your device.
            See our <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a> for
            full details.
          </p>
        </section>

        <section>
          <h2>Service Availability</h2>
          <p>
            Snappy is provided as-is. We may update, modify, or discontinue the service
            at any time. We are not liable for any loss of data or interruption of service.
          </p>
        </section>

        <section>
          <h2>Changes to These Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of Snappy after
            changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            If you have questions about these terms, please reach out via the
            project's GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
