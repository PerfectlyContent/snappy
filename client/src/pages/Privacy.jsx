import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Privacy.css';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="privacy">
      <button className="privacy__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h1 className="privacy__title">Privacy Policy</h1>
      <p className="privacy__updated">Last updated: March 5, 2026</p>

      <div className="privacy__content">
        <section>
          <h2>What Snappy Does</h2>
          <p>
            Snappy is an AI-powered filing assistant. You take a photo or speak a voice memo,
            and Snappy classifies it and helps you save it to Google Calendar, Google Drive,
            Google Contacts, or your personal reminders.
          </p>
        </section>

        <section>
          <h2>Data We Access</h2>
          <p>When you connect your Google account, Snappy requests access to:</p>
          <ul>
            <li><strong>Google Calendar</strong> — to create events from photos or voice memos you classify as events</li>
            <li><strong>Google Drive</strong> — to save documents and files you choose to store</li>
            <li><strong>Google Contacts</strong> — to save contact information from business cards or voice memos</li>
            <li><strong>Your name and email</strong> — to display your profile in the app</li>
          </ul>
        </section>

        <section>
          <h2>How We Use Your Data</h2>
          <p>
            Your photos and voice memos are sent to Google Gemini AI for classification only.
            We do not store your images or audio on our servers — they are processed in memory
            and discarded immediately.
          </p>
          <p>
            We only write to your Google account when you explicitly tap "Save."
            Snappy never modifies or deletes your existing Google data.
          </p>
        </section>

        <section>
          <h2>Data Storage</h2>
          <p>
            Your reminders and activity history are stored locally on your device using browser
            storage. They are not uploaded to any server.
          </p>
          <p>
            Your Google authentication session is stored as a secure, encrypted cookie
            that expires after 7 days.
          </p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <ul>
            <li><strong>Google APIs</strong> — for Calendar, Drive, Contacts, and authentication</li>
            <li><strong>Google Gemini AI</strong> — for classifying your photos and voice memos</li>
          </ul>
          <p>We do not share your data with any other third parties.</p>
        </section>

        <section>
          <h2>Data Deletion</h2>
          <p>
            You can disconnect your Google account from the Settings page at any time.
            This removes your session and stops all access to your Google data.
          </p>
          <p>
            To clear your local reminders and activity, clear your browser data for this site.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            If you have questions about this privacy policy, please reach out via the
            project's GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
