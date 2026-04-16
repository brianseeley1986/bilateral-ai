export default function AboutPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#F5F5F0',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '680px',
        margin: '0 auto'
      }}>

        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '48px'
        }}>
          <a href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
          }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#C1121F', flexShrink: 0 }} />
            <span style={{
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#0A0A0A'
            }}>
              bilateral
            </span>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1B4FBE', flexShrink: 0 }} />
          </a>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a href="/debates" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
              Debates
            </a>
            <a href="/" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
              ← Home
            </a>
          </div>
        </header>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '8px',
          lineHeight: 1.2
        }}>
          The argument behind every headline.
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#6B6B6B',
          marginBottom: '40px',
          lineHeight: 1.6
        }}>
          What Bilateral is, how it works, and why we built it this way.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}>

          <section>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              marginBottom: '12px'
            }}>
              What this is
            </h2>
            <p style={{
              fontSize: '15px',
              lineHeight: 1.8,
              color: '#0A0A0A'
            }}>
              Bilateral is an AI-powered news analysis platform. Every story — breaking international news, state legislation, local community decisions — gets analyzed by two AI minds arguing from opposing first principles. One conservative. One liberal. Neither pulling punches. Neither allowed to win.
            </p>
            <p style={{
              fontSize: '15px',
              lineHeight: 1.8,
              color: '#0A0A0A',
              marginTop: '12px'
            }}>
              The result is not a summary. It is the actual argument — the strongest case each side can make, the evidence each side is standing on, and the questions neither side has answered.
            </p>
          </section>

          <div style={{ height: '0.5px', background: '#e0e0e0' }}/>

          <section>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              marginBottom: '12px'
            }}>
              How it works
            </h2>
            <p style={{
              fontSize: '15px',
              lineHeight: 1.8,
              color: '#0A0A0A',
              marginBottom: '20px'
            }}>
              Every debate runs through five AI agents in sequence.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {[
                {
                  number: '01',
                  label: 'Researcher',
                  description: 'Searches the web for current facts, builds a verified briefing, flags disputed claims, and constructs a historical timeline. Both sides receive the same briefing. Neither side gets to argue from different facts.'
                },
                {
                  number: '02',
                  label: 'Conservative analyst',
                  description: 'Makes the strongest possible conservative case grounded in first principles — limited government, individual liberty, free markets, rule of law, ordered liberty. Not talking points. Not partisan spin. The best argument conservatism has.'
                },
                {
                  number: '03',
                  label: 'Liberal analyst',
                  description: 'Makes the strongest possible liberal case grounded in first principles — social equity, collective responsibility, institutional reform, empirical governance, civil rights protection. Same standard. Same depth.'
                },
                {
                  number: '04',
                  label: 'Rebuttal round',
                  description: 'Each side responds directly to the other\'s strongest point. Not a prepared statement — a genuine reaction to what the other side actually argued.'
                },
                {
                  number: '05',
                  label: 'Arbiter',
                  description: 'Maps where both sides genuinely agree, where they genuinely conflict, and what neither side has answered. The arbiter never picks a winner. Its only job is intellectual honesty.'
                }
              ].map(agent => (
                <div key={agent.number} style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#9B9B9B',
                    minWidth: '24px',
                    paddingTop: '3px',
                    flexShrink: 0
                  }}>
                    {agent.number}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0A0A0A',
                      marginBottom: '4px'
                    }}>
                      {agent.label}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: '#444'
                    }}>
                      {agent.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: '0.5px', background: '#e0e0e0' }}/>

          <section>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              marginBottom: '12px'
            }}>
              The rule that matters most
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A' }}>
              Both analysts are required to identify the strongest evidence against their own argument before the debate ends.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A', marginTop: '12px' }}>
              Not a strawman. Not a minor concession. The actual vulnerability — the piece of evidence that most challenges their position and that they find genuinely difficult to dismiss.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A', marginTop: '12px' }}>
              No human pundit does this voluntarily. We built it into the architecture so neither side can avoid it.
            </p>
          </section>

          <div style={{ height: '0.5px', background: '#e0e0e0' }}/>

          <section>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              marginBottom: '12px'
            }}>
              Where stories come from
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A' }}>
              Bilateral automatically ingests stories from a deliberately cross-spectrum lineup of established outlets. Stories update every two hours.
            </p>
            <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#0A0A0A', marginTop: '16px' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Center / wire</div>
              <div style={{ color: '#444' }}>Reuters Top News · Reuters World News</div>
              <div style={{ fontWeight: 700, margin: '14px 0 6px' }}>Center-left to left</div>
              <div style={{ color: '#444' }}>NPR Politics · New York Times Politics · Politico · The Hill · BBC World · BBC UK Politics · Guardian World</div>
              <div style={{ fontWeight: 700, margin: '14px 0 6px' }}>Center-right to right</div>
              <div style={{ color: '#444' }}>Wall Street Journal Politics · Washington Examiner · National Review · RealClearPolitics</div>
              <div style={{ fontWeight: 700, margin: '14px 0 6px' }}>Independent journalism</div>
              <div style={{ color: '#444' }}>A curated registry of 25 independent journalists, including writers from ProPublica, Platformer, The Dispatch, Tangle News, Stateline, and Reason.</div>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A', marginTop: '12px' }}>
              Local content is sourced separately for each visitor based on their location. Someone in Lakeland sees Lakeland stories. Someone in Atlanta sees Atlanta stories.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A', marginTop: '12px' }}>
              You can also drop any headline or topic into the search bar and get a debate on demand.
            </p>
          </section>

          <div style={{ height: '0.5px', background: '#e0e0e0' }}/>

          <section>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              marginBottom: '12px'
            }}>
              What Bilateral is not
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A' }}>
              Bilateral does not tell you what to think. The arbiter never picks a winner. We do not have an editorial position. We do not have advertisers. We do not have a partisan agenda.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A', marginTop: '12px' }}>
              We have a philosophical one: that most news gives you conclusions and calls it coverage. We think you deserve the argument.
            </p>
          </section>

          <div style={{ height: '0.5px', background: '#e0e0e0' }}/>

          <section>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              marginBottom: '12px'
            }}>
              Quality scoring
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A' }}>
              Every debate is automatically scored across five dimensions before it publishes: argument specificity, evidence quality, genuine tension, intellectual honesty, and depth beyond headlines. Debates scoring below threshold are held for review. The current average published score is 8.65 out of 10.
            </p>
          </section>

          <div style={{ height: '0.5px', background: '#e0e0e0' }}/>

          <section>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              marginBottom: '12px'
            }}>
              The AI model
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A' }}>
              Bilateral is powered by Claude, built by Anthropic. All five agents run on Claude Sonnet. The researcher agent uses live web search to ground every debate in current facts rather than training data alone.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A', marginTop: '12px' }}>
              We are transparent about this because we think transparency is a feature, not a liability. Every outlet has a perspective baked into its architecture. Ours is visible. Theirs is not.
            </p>
          </section>

          <div style={{ height: '0.5px', background: '#e0e0e0' }}/>

          <section>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              marginBottom: '12px'
            }}>
              Why it was built
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A' }}>
              The country needs a place where serious people can encounter the strongest version of views they disagree with. Not a caricature. Not a strawman. The actual argument, made well, by someone who believes it.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A', marginTop: '12px' }}>
              That almost never happens in American media. Bilateral is an attempt to build the thing that should exist.
            </p>
          </section>

          <div style={{ height: '0.5px', background: '#e0e0e0' }}/>

          <section>
            <h2 style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              marginBottom: '12px'
            }}>
              Contact
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#0A0A0A' }}>
              For partnerships, press, institutional licensing, or feedback reach out at{' '}
              <a
                href="mailto:hello@bilateral.news"
                style={{ color: '#0A0A0A', textDecoration: 'underline' }}
              >
                hello@bilateral.news
              </a>
            </p>
          </section>

        </div>

        <div style={{
          borderTop: '0.5px solid #e0e0e0',
          marginTop: '48px',
          paddingTop: '24px',
          fontSize: '12px',
          color: '#9B9B9B',
          textAlign: 'center',
          lineHeight: 1.8
        }}>
          <a href="/" style={{ color: '#6B6B6B', textDecoration: 'none' }}>
            bilateral.news
          </a>
          {' · '}
          The argument behind every headline.
        </div>

      </div>
    </main>
  )
}
