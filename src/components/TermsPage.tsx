import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#9E9589', marginBottom: 40 }}>
          Last updated: February 18, 2026
        </p>

        <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, lineHeight: 1.8, color: '#C8C1B8' }}>
          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>1. Acceptance of Terms</h2>
          <p>By accessing or using COSMOS ("the Service"), operated by Rae Jin ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>2. Description of Service</h2>
          <p>COSMOS is a spatial discussion visualization platform that uses AI to analyze and present conversations in a 3D environment. The Service includes web-based access, AI-powered content analysis, and optional head-pose navigation via webcam.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>3. User Accounts</h2>
          <p>You may be required to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>4. User Content</h2>
          <p>You retain ownership of content you post on COSMOS. By posting, you grant us a non-exclusive, worldwide license to display, distribute, and process your content within the Service. You agree not to post content that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>5. AI-Generated Content</h2>
          <p>COSMOS uses AI (Claude by Anthropic) to generate discussion content and analysis. AI-generated content is provided for informational and exploratory purposes. We do not guarantee its accuracy, completeness, or suitability for any purpose.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>6. Camera and Head-Pose Features</h2>
          <p>COSMOS offers optional head-pose navigation via your device's webcam. This feature requires explicit consent before activation. All video processing occurs entirely on your device using MediaPipe. No video data is transmitted to our servers. You may disable this feature at any time.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>7. Intellectual Property</h2>
          <p>The Service, including its design, code, AI pipeline, spatial visualization methods, and branding, is the intellectual property of Rae Jin. You may not copy, modify, distribute, or reverse-engineer any part of the Service without written permission.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>8. Prohibited Uses</h2>
          <p>You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain unauthorized access to the Service; (c) interfere with the operation of the Service; (d) scrape, data-mine, or extract data from the Service without permission; (e) use the Service to harass, abuse, or harm others.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>9. Disclaimers</h2>
          <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>10. Limitation of Liability</h2>
          <p>To the fullest extent permitted by California law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>11. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of California, without regard to conflict of law principles. Any disputes arising from these Terms shall be resolved in the courts of California.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>12. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms. We will notify users of material changes through the Service.</p>

          <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: '#F5F2EF', marginTop: 32, marginBottom: 12 }}>13. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="https://x.com/DalraeJin" target="_blank" rel="noopener noreferrer" style={{ color: '#D4B872' }}>@DalraeJin</a> on X.</p>
        </div>
      </div>
    </div>
  )
}
