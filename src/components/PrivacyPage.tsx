import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  useEffect(() => {
    const root = document.getElementById('root')
    const html = document.documentElement
    const body = document.body
    html.style.overflow = 'auto'
    html.style.height = 'auto'
    body.style.overflow = 'auto'
    body.style.height = 'auto'
    if (root) { root.style.overflow = 'auto'; root.style.height = 'auto' }
    return () => {
      html.style.overflow = 'hidden'
      html.style.height = '100%'
      body.style.overflow = 'hidden'
      body.style.height = '100%'
      if (root) { root.style.overflow = 'hidden'; root.style.height = '100%' }
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#1C1A18', color: '#F5F2EF',
      padding: '60px 24px 80px',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link to="/" style={{
          fontFamily: 'system-ui, sans-serif', fontSize: 13,
          color: '#9E9589', textDecoration: 'none', marginBottom: 40, display: 'inline-block',
        }}>
          &larr; Back to COSMOS
        </Link>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#9E9589', marginBottom: 40 }}>
          Last updated: February 18, 2026
        </p>

        <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, lineHeight: 1.8, color: '#C8C1B8' }}>
          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>1. Overview</h2>
          <p>COSMOS is operated by Rae Jin, based in California, USA. This Privacy Policy describes how we collect, use, and protect your information when you use the COSMOS platform ("the Service"). We are committed to protecting your privacy and complying with the California Consumer Privacy Act (CCPA) and other applicable privacy laws.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>2. Information We Collect</h2>

          <h3 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 15, color: '#D4B872', marginTop: 24, marginBottom: 8 }}>2.1 Information You Provide</h3>
          <ul style={{ paddingLeft: 20 }}>
            <li>Posts, replies, and votes you submit to discussions</li>
            <li>Account information (if applicable)</li>
          </ul>

          <h3 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 15, color: '#D4B872', marginTop: 24, marginBottom: 8 }}>2.2 Automatically Collected Information</h3>
          <ul style={{ paddingLeft: 20 }}>
            <li>Basic usage data (pages visited, features used)</li>
            <li>Device and browser information</li>
            <li>IP address</li>
          </ul>

          <h3 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 15, color: '#D4B872', marginTop: 24, marginBottom: 8 }}>2.3 Camera and Head-Pose Data</h3>
          <p><strong style={{ color: '#F5F2EF' }}>This is important:</strong> When you enable gaze mode, your webcam is activated to track head movement. However:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong style={{ color: '#F5F2EF' }}>All video processing happens entirely on your device</strong> using Google MediaPipe</li>
            <li>No video frames, images, or facial data are ever sent to our servers</li>
            <li>No video is recorded or stored</li>
            <li>Only derived numerical values (yaw and pitch angles) are used, and these stay in your browser's memory</li>
            <li>The GazeLearner calibration data (click positions) is stored only in your browser session and is not transmitted</li>
            <li>Camera access requires your explicit consent and can be revoked at any time</li>
          </ul>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>3. How We Use Information</h2>
          <ul style={{ paddingLeft: 20 }}>
            <li>To provide and operate the Service</li>
            <li>To display your posts within the spatial discussion environment</li>
            <li>To process content through AI for spatial positioning and analysis</li>
            <li>To improve the Service</li>
          </ul>
          <p>We do not sell your personal information. We do not use your information for advertising.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>4. Third-Party Services</h2>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong style={{ color: '#F5F2EF' }}>Anthropic (Claude API):</strong> Post content is sent to Anthropic's API for AI analysis. Anthropic's privacy policy applies to this processing.</li>
            <li><strong style={{ color: '#F5F2EF' }}>Google MediaPipe:</strong> Face tracking model is loaded from Google's CDN. The model runs locally on your device. No data is sent to Google.</li>
            <li><strong style={{ color: '#F5F2EF' }}>Google Cloud / Firebase:</strong> The Service is hosted on Google Cloud Run and Firebase Hosting. Google's privacy policy applies to infrastructure services.</li>
            <li><strong style={{ color: '#F5F2EF' }}>MongoDB:</strong> User posts and votes are stored in MongoDB. MongoDB's privacy policy applies to data storage.</li>
          </ul>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>5. Your Rights Under CCPA</h2>
          <p>If you are a California resident, you have the right to:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong style={{ color: '#F5F2EF' }}>Know</strong> what personal information we collect and how it is used</li>
            <li><strong style={{ color: '#F5F2EF' }}>Delete</strong> your personal information</li>
            <li><strong style={{ color: '#F5F2EF' }}>Opt-out</strong> of the sale of personal information (we do not sell personal information)</li>
            <li><strong style={{ color: '#F5F2EF' }}>Non-discrimination</strong> for exercising your privacy rights</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="https://x.com/DalraeJin" target="_blank" rel="noopener noreferrer" style={{ color: '#D4B872' }}>@DalraeJin</a> on X.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>6. Data Retention</h2>
          <p>User posts and votes are retained for as long as the Service operates or until you request deletion. Session data (head-pose calibration, browsing state) is not persisted beyond your browser session.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>7. Security</h2>
          <p>We use industry-standard security measures including HTTPS encryption, secure cloud hosting, and access controls. However, no method of transmission over the internet is 100% secure.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>8. Children's Privacy</h2>
          <p>The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy at any time. We will notify users of material changes through the Service. Continued use after changes constitutes acceptance.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>10. Contact</h2>
          <p>For privacy-related questions or to exercise your rights:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>X: <a href="https://x.com/DalraeJin" target="_blank" rel="noopener noreferrer" style={{ color: '#D4B872' }}>@DalraeJin</a></li>
            <li>Web: <a href="https://raejin.web.app" target="_blank" rel="noopener noreferrer" style={{ color: '#D4B872' }}>raejin.web.app</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
