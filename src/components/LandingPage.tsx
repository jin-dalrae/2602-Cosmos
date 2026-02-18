import { useRef, useEffect, lazy, Suspense } from 'react'
import { motion, useInView } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'

const LandingSphere = lazy(() => import('./LandingSphere'))

/* ── colors — light-on-dark palette so sphere shows through ── */
const C = {
  text: '#F5F2EF',
  textMuted: '#C8C1B8',
  textFaint: '#9E9589',
  cardBg: 'rgba(30, 26, 24, 0.6)',
  border: 'rgba(245, 242, 239, 0.1)',
  gold: '#D4B872',
  goldBg: 'rgba(212, 184, 114, 0.12)',
  goldBorder: 'rgba(212, 184, 114, 0.25)',
  sage: '#8FB8A0',
  coral: '#E8836B',
  lavender: '#9B8FB8',
  olive: '#A3A07E',
}

/* ── tiny helpers ── */
function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function Divider() {
  return <div style={{ width: 48, height: 1, backgroundColor: 'rgba(245, 242, 239, 0.15)', margin: '0 auto' }} />
}

/* ── main ── */
export default function LandingPage() {
  const navigate = useNavigate()

  // Override the global overflow:hidden on html/body/#root so we can scroll
  useEffect(() => {
    const root = document.getElementById('root')
    const html = document.documentElement
    const body = document.body

    html.style.overflow = 'auto'
    html.style.height = 'auto'
    body.style.overflow = 'auto'
    body.style.height = 'auto'
    if (root) {
      root.style.overflow = 'auto'
      root.style.height = 'auto'
    }

    return () => {
      html.style.overflow = 'hidden'
      html.style.height = '100%'
      body.style.overflow = 'hidden'
      body.style.height = '100%'
      if (root) {
        root.style.overflow = 'hidden'
        root.style.height = '100%'
      }
    }
  }, [])

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      color: C.text,
      overflowX: 'hidden',
    }}>
      {/* 3D Sphere background — fixed so it stays while scrolling */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        opacity: 0.85,
      }}>
        <Suspense fallback={null}>
          <LandingSphere />
        </Suspense>
      </div>

      {/* scrollable content */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ━━━ HERO ━━━ */}
        <div style={{
          minHeight: '100vh',
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px 60px',
          textAlign: 'center',
        }}>
          {/* Text overlay */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div style={{
                fontSize: 13, fontFamily: 'system-ui, sans-serif',
                color: '#FDFBF8', letterSpacing: 3, textTransform: 'uppercase',
                marginBottom: 24,
                textShadow: '0 1px 8px rgba(0,0,0,0.3)',
              }}>
                COSMOS
              </div>
              <h1 style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(36px, 6vw, 72px)',
                fontWeight: 400,
                lineHeight: 1.15,
                color: '#FDFBF8',
                margin: '0 auto 28px',
                maxWidth: 700,
                textShadow: '0 2px 20px rgba(0,0,0,0.25)',
              }}>
                A Planetarium<br />for Discourse
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(16px, 2.2vw, 21px)',
                lineHeight: 1.7,
                color: '#FDFBF8CC',
                maxWidth: 520,
                margin: '0 auto 48px',
                textShadow: '0 1px 10px rgba(0,0,0,0.2)',
              }}
            >
              Feeds are linear. Conversations are not.<br />
              What if you could stand inside a discussion<br />
              and just look around?
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              onClick={() => navigate('/web')}
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 15, fontWeight: 500,
                padding: '14px 40px',
                borderRadius: 12,
                border: '1px solid rgba(253, 251, 248, 0.3)',
                backgroundColor: 'rgba(253, 251, 248, 0.12)',
                backdropFilter: 'blur(8px)',
                color: '#FDFBF8',
                cursor: 'pointer',
                transition: 'all 0.25s',
                letterSpacing: 0.5,
              }}
              whileHover={{ backgroundColor: 'rgba(253, 251, 248, 0.2)', scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Enter COSMOS
            </motion.button>
          </div>

          {/* scroll hint */}
          <motion.div
            style={{ position: 'absolute', bottom: 40, zIndex: 1 }}
            animate={{ opacity: [0.3, 0.6, 0.3], y: [0, 6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FDFBF8" strokeWidth={1.5}>
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </div>

        {/* ━━━ Content — no opaque bg, sphere visible behind ━━━ */}
        <div style={{
          position: 'relative',
          marginTop: -32,
          paddingTop: 32,
        }}>

          {/* ━━━ THE PROBLEM ━━━ */}
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '100px 24px' }}>
            <Section>
              <div style={{
                fontSize: 11, fontFamily: 'system-ui, sans-serif',
                color: C.coral, letterSpacing: 2.5, textTransform: 'uppercase',
                marginBottom: 20,
              }}>
                The problem
              </div>
              <h2 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 400, lineHeight: 1.3,
                color: C.text,
                marginBottom: 24,
              }}>
                Feeds flatten everything<br />into a single stream
              </h2>
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: 17, lineHeight: 1.8,
                color: C.textMuted,
                marginBottom: 32,
              }}>
                Every major platform — Reddit, Twitter, Hacker News — reduces conversation
                to one post after another. Scroll down. Scroll more. An algorithm decides what's next.
              </p>
            </Section>

            <Section delay={0.15}>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 16,
                marginBottom: 32,
              }}>
                {[
                  { label: 'Linearity makes you passive', desc: 'You don\'t explore — you receive. The feed moves, you absorb. There\'s no agency in scrolling.' },
                  { label: 'The landscape is hidden', desc: 'A 500-comment thread has clusters of agreement, pockets of dissent, bridges between worldviews. Feeds flatten all of it.' },
                ].map((item) => (
                  <div key={item.label} style={{
                    padding: '20px 24px', borderRadius: 12,
                    backgroundColor: C.cardBg,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${C.border}`,
                  }}>
                    <div style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 14, fontWeight: 600,
                      color: C.text, marginBottom: 6,
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 15, lineHeight: 1.7,
                      color: C.textMuted,
                    }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section delay={0.1}>
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: 17, lineHeight: 1.8,
                color: C.textMuted,
              }}>
                You finish reading a thread and have no idea what the conversation
                actually looked like. You saw a slice. The feed chose which slice.
              </p>
            </Section>
          </div>

          <Divider />

          {/* ━━━ THE ANSWER ━━━ */}
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '100px 24px' }}>
            <Section>
              <div style={{
                fontSize: 11, fontFamily: 'system-ui, sans-serif',
                color: C.sage, letterSpacing: 2.5, textTransform: 'uppercase',
                marginBottom: 20,
              }}>
                The answer
              </div>
              <h2 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 400, lineHeight: 1.3,
                color: C.text,
                marginBottom: 24,
              }}>
                Stand inside the conversation
              </h2>
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: 17, lineHeight: 1.8,
                color: C.textMuted,
                marginBottom: 40,
              }}>
                COSMOS places you at the center of a sphere. Every post is a card on its inner surface.
                You look outward. You drag to turn. Whatever your gaze lands on appears beside you.
              </p>
            </Section>

            {/* three pillars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {[
                {
                  accent: C.gold,
                  title: 'There is no "next"',
                  body: 'A feed has one direction: down. A sphere has every direction. Two readers starting from the same point will browse completely different paths. Your curiosity determines the sequence.',
                },
                {
                  accent: C.sage,
                  title: 'Topics become places',
                  body: 'Neighborhood gardening on one side of the sphere. AI startups on another. Drag slowly between them and you pass through bridge posts — ideas that connect both worlds. The topology of conversation becomes something you navigate.',
                },
                {
                  accent: C.coral,
                  title: 'Friction disappears',
                  body: 'Every click is a micro-decision: "Is this worth my attention?" Browse mode removes that question. You look, and content is there. You don\'t select articles — you wander through them.',
                },
              ].map((pillar, i) => (
                <Section key={pillar.title} delay={i * 0.1}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{
                      width: 3, borderRadius: 2, flexShrink: 0,
                      backgroundColor: pillar.accent,
                      opacity: 0.4,
                    }} />
                    <div>
                      <h3 style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: 20, fontWeight: 400,
                        color: C.text,
                        marginBottom: 8,
                      }}>
                        {pillar.title}
                      </h3>
                      <p style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: 15, lineHeight: 1.8,
                        color: C.textMuted,
                        margin: 0,
                      }}>
                        {pillar.body}
                      </p>
                    </div>
                  </div>
                </Section>
              ))}
            </div>
          </div>

          <Divider />

          {/* ━━━ PHILOSOPHY ━━━ */}
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '100px 24px' }}>
            <Section>
              <div style={{
                fontSize: 11, fontFamily: 'system-ui, sans-serif',
                color: C.lavender, letterSpacing: 2.5, textTransform: 'uppercase',
                marginBottom: 20,
              }}>
                Design philosophy
              </div>
            </Section>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
              <Section>
                <h3 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 22, fontWeight: 400,
                  color: C.text,
                  lineHeight: 1.3, marginBottom: 12,
                }}>
                  Why inside a sphere?
                </h3>
                <p style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 16, lineHeight: 1.8,
                  color: C.textMuted, margin: 0,
                }}>
                  A sphere has no edges, no top, no bottom. Content doesn't have a rank — it has
                  a location. Being inside makes it feel like an environment, not a list. You're surrounded
                  by voices, like standing in a room full of conversations you can tune into
                  by turning your head.
                </p>
              </Section>

              <Section>
                <h3 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 22, fontWeight: 400,
                  color: C.text,
                  lineHeight: 1.3, marginBottom: 12,
                }}>
                  Why no clicks?
                </h3>
                <p style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 16, lineHeight: 1.8,
                  color: C.textMuted, margin: 0,
                }}>
                  Clicking forces a binary decision at every moment: engage or keep scrolling. That
                  decision fatigue is what makes feeds exhausting. By making gaze the only interaction,
                  the reader stays in a state of continuous awareness — drifting through information,
                  letting things catch attention naturally.
                </p>
              </Section>

              <Section>
                <h3 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 22, fontWeight: 400,
                  color: C.text,
                  lineHeight: 1.3, marginBottom: 12,
                }}>
                  Accidental drift
                </h3>
                <p style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 16, lineHeight: 1.8,
                  color: C.textMuted, margin: 0,
                }}>
                  The most valuable discovery happens when you didn't plan to find something.
                  You came to read about community gardening, but your gaze drifted 90 degrees
                  and landed on a post about AI changing local businesses. That unplanned connection
                  is what feeds can never produce — because feeds only show what they think you want.
                </p>
              </Section>

              <Section>
                <div style={{
                  padding: '28px 32px',
                  borderRadius: 16,
                  backgroundColor: C.cardBg,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${C.border}`,
                }}>
                  <p style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 18, lineHeight: 1.7,
                    color: C.text,
                    margin: 0,
                    fontStyle: 'italic',
                  }}>
                    The goal isn't productivity or entertainment. It's awareness.
                  </p>
                  <p style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 15, lineHeight: 1.7,
                    color: C.textMuted,
                    margin: '12px 0 0',
                  }}>
                    A feed reader finishes a thread knowing what was popular. A COSMOS reader
                    finishes a session knowing the shape of the conversation — where the clusters are,
                    where the gaps are, how ideas relate across the full landscape.
                    They saw the whole room, not just the loudest voice in it.
                  </p>
                </div>
              </Section>
            </div>
          </div>

          <Divider />

          {/* ━━━ HOW IT WORKS ━━━ */}
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '100px 24px' }}>
            <Section>
              <div style={{
                fontSize: 11, fontFamily: 'system-ui, sans-serif',
                color: C.gold, letterSpacing: 2.5, textTransform: 'uppercase',
                marginBottom: 20,
              }}>
                Under the hood
              </div>
              <h2 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 400, lineHeight: 1.3,
                color: C.text,
                marginBottom: 24,
              }}>
                AI reads the room so you don't have to
              </h2>
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: 17, lineHeight: 1.8,
                color: C.textMuted,
                marginBottom: 40,
              }}>
                Claude analyzes every post for stance, emotion, hidden assumptions, and logical
                relationships — then places it on the sphere where position carries meaning.
              </p>
            </Section>

            <Section delay={0.1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
                {[
                  { step: '01', label: 'Generate', desc: '150+ voices across 10 subtopics — diverse stances, emotions, post types', color: C.gold },
                  { step: '02', label: 'Enrich', desc: 'Each post analyzed: core claim, assumptions, logical chain, relationships', color: C.sage },
                  { step: '03', label: 'Position', desc: 'Subtopic clusters on the sphere — opinion axis, abstraction level, novelty', color: C.coral },
                  { step: '04', label: 'Render', desc: 'Cards stream in as they\'re analyzed. The constellation builds itself live.', color: C.lavender },
                ].map((s) => (
                  <div key={s.step} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                    padding: '16px 20px', borderRadius: 12,
                    backgroundColor: C.cardBg,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${C.border}`,
                  }}>
                    <span style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 12, fontWeight: 700,
                      color: s.color, minWidth: 24,
                    }}>
                      {s.step}
                    </span>
                    <div>
                      <div style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: 14, fontWeight: 600,
                        color: C.text, marginBottom: 3,
                      }}>
                        {s.label}
                      </div>
                      <div style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: 14, lineHeight: 1.6,
                        color: C.textMuted,
                      }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section delay={0.15}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
              }}>
                {[
                  { label: 'React 19', sub: 'Frontend' },
                  { label: 'Three.js', sub: '3D Engine' },
                  { label: 'Claude API', sub: 'AI Analysis' },
                  { label: 'Framer Motion', sub: 'Animation' },
                ].map((t) => (
                  <div key={t.label} style={{
                    padding: '14px 16px', borderRadius: 10,
                    backgroundColor: C.cardBg,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${C.border}`,
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 14, fontWeight: 600,
                      color: C.text,
                    }}>
                      {t.label}
                    </div>
                    <div style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 11, color: C.textFaint,
                      marginTop: 2,
                    }}>
                      {t.sub}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <Divider />

          {/* ━━━ WHERE THIS GOES ━━━ */}
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '100px 24px' }}>
            <Section>
              <div style={{
                fontSize: 11, fontFamily: 'system-ui, sans-serif',
                color: C.olive, letterSpacing: 2.5, textTransform: 'uppercase',
                marginBottom: 20,
              }}>
                Vision
              </div>
              <h2 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 400, lineHeight: 1.3,
                color: C.text,
                marginBottom: 24,
              }}>
                The sphere works for any conversation
              </h2>
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: 17, lineHeight: 1.8,
                color: C.textMuted,
                marginBottom: 32,
              }}>
                Research papers cluster by methodology. News articles arrange by ideology.
                Public comments on a city proposal reveal the actual fault lines of disagreement.
                Classroom discussions show students the structure of their own reasoning.
              </p>
            </Section>

            <Section delay={0.1}>
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: 20, lineHeight: 1.6,
                color: C.text,
                textAlign: 'center',
                margin: '0 auto',
                maxWidth: 480,
              }}>
                Stop reading feeds.<br />
                Start standing inside conversations.
              </p>
            </Section>
          </div>

          {/* ━━━ FINAL CTA ━━━ */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px 60px',
            textAlign: 'center',
          }}>
            <Section>
              <motion.button
                onClick={() => navigate('/web')}
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 16, fontWeight: 500,
                  padding: '16px 48px',
                  borderRadius: 12,
                  border: `1px solid ${C.goldBorder}`,
                  backgroundColor: C.goldBg,
                  color: C.gold,
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  letterSpacing: 0.5,
                  marginBottom: 32,
                }}
                whileHover={{ backgroundColor: 'rgba(212, 184, 114, 0.22)', scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Enter COSMOS
              </motion.button>
            </Section>
          </div>

          {/* ━━━ FOOTER ━━━ */}
          <footer style={{
            padding: '40px 24px 48px',
            borderTop: '1px solid rgba(245, 242, 239, 0.08)',
          }}>
            <div style={{
              maxWidth: 640, margin: '0 auto',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 20,
              textAlign: 'center',
            }}>
              {/* Links */}
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <a
                  href="https://x.com/DalraeJin"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 13, color: C.textFaint,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.textFaint)}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', verticalAlign: -2, marginRight: 5 }}>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @DalraeJin
                </a>
                <span style={{ color: 'rgba(245, 242, 239, 0.15)' }}>&middot;</span>
                <a
                  href="https://raejin.web.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 13, color: C.textFaint,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.textFaint)}
                >
                  Rae Jin
                </a>
              </div>

              {/* Legal links */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <Link
                  to="/terms"
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 12, color: `${C.textFaint}99`,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.textFaint)}
                  onMouseLeave={e => (e.currentTarget.style.color = `${C.textFaint}99`)}
                >
                  Terms of Service
                </Link>
                <span style={{ color: 'rgba(245, 242, 239, 0.1)' }}>&middot;</span>
                <Link
                  to="/privacy"
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 12, color: `${C.textFaint}99`,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.textFaint)}
                  onMouseLeave={e => (e.currentTarget.style.color = `${C.textFaint}99`)}
                >
                  Privacy Policy
                </Link>
              </div>

              {/* Copyright */}
              <p style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 11, color: `${C.textFaint}66`,
                margin: 0,
              }}>
                &copy; {new Date().getFullYear()} Rae Jin. All rights reserved.
              </p>
            </div>
          </footer>

        </div>{/* end content wrapper */}
      </div>
    </div>
  )
}
