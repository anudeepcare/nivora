"use client";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Search,
  Check,
  ArrowDown,
  ShieldCheck,
  Bell,
  Wallet,
  Globe,
  Lock,
  Sun,
  ChevronRight,
} from "lucide-react";
import {
  companies,
  filteredCompanies,
  stageLabel,
} from "@/lib/presentation/preview";
import {
  Button,
  Brand,
  Title,
  Metric,
  Section,
  Chart,
  Pace,
  DataTable,
  Note,
  LinkAction,
} from "./Primitives";
import s from "./Preview.module.css";
type Props = {
  page: string;
  go: (page: string) => void;
  open: (symbol: string) => void;
  notify: (message: string) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
};
export default function WorkspaceViews({
  page,
  go,
  open,
  notify,
  dark,
  setDark,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Company");
  const [settings, setSettings] = useState("Appearance");
  const [text, setText] = useState("Standard");
  const [motion, setMotion] = useState(false);
  const [alerts, setAlerts] = useState([
    "NOVA · Pace changes",
    "ARC · Price below $70",
  ]);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [annual, setAnnual] = useState(false);
  const list = filteredCompanies(companies, query)
    .filter(
      (c) =>
        filter === "All" ||
        (filter === "Accumulation" ? c.pace >= 2 : c.pace < 2),
    )
    .sort((a, b) =>
      sort === "Pace"
        ? b.pace - a.pace
        : sort === "Price"
          ? b.price - a.price
          : a.name.localeCompare(b.name),
    );
  const companyTable = (portfolio = false) => (
    <DataTable
      headers={
        portfolio
          ? ["Company", "Price", "Weight", "Pace", "Research"]
          : ["Company", "Price", "Session", "AURYN Pace", "Research"]
      }
      rows={list.map((c) => [
        <button
          className={s.companyCell}
          onClick={() => open(c.symbol)}
          key={c.symbol}
        >
          <span className={s.miniLogo}>{c.symbol[0]}</span>
          <span>
            <strong>{c.name}</strong>
            <small>
              {c.symbol} · {c.sector}
            </small>
          </span>
        </button>,
        `$${c.price.toFixed(2)}`,
        portfolio ? (
          `${c.weight}%`
        ) : (
          <span className={c.change > 0 ? s.positive : s.negative}>
            {c.change > 0 ? "+" : ""}
            {c.change}%
          </span>
        ),
        <span className={s.paceBadge}>
          P{c.pace}
          <span>{stageLabel(c.pace)}</span>
        </span>,
        <button
          className={s.iconButton}
          aria-label={`Research ${c.name}`}
          onClick={() => open(c.symbol)}
        >
          <ArrowUpRight size={17} />
        </button>,
      ])}
    />
  );
  if (page === "Public website")
    return (
      <>
        <div className={s.publicNav}>
          <Brand />
          <nav>
            <button onClick={() => go("Learn")}>How Pace works</button>
            <button onClick={() => go("Plans")}>Plans</button>
            <button onClick={() => go("Sign in")}>Sign in</button>
            <Button onClick={() => go("Sign in")}>
              Get started <ArrowRight size={16} />
            </Button>
          </nav>
        </div>
        <div className={s.publicHero}>
          <div className={s.publicIntro}>
            <span className={s.eyebrow}>INVEST AT YOUR OWN PACE</span>
            <h1>
              A clearer signal.
              <br />A considered
              <br />
              <em>next move.</em>
            </h1>
            <p>
              Know the business. Understand the price.
              <br />
              Give every contribution a reason.
            </p>
            <Button onClick={() => go("Research")}>
              Explore AURYN <ArrowRight size={16} />
            </Button>
            <small>Research with evidence. Decisions stay yours.</small>
          </div>
          <Pace hero onEvidence={() => go("Learn")} />
        </div>
        <div className={s.publicProof}>
          {[
            ["01", "Understand", "The business behind the price."],
            ["02", "Evaluate", "The assumptions behind the value."],
            ["03", "Choose your pace", "The context behind your next step."],
          ].map(([n, h, t]) => (
            <div key={n}>
              <span>{n}</span>
              <h2>{h}</h2>
              <p>{t}</p>
            </div>
          ))}
        </div>
        <Section
          title="Depth when you need it. Clarity when you don’t."
          detail="Business, valuation, technicals and ownership in one connected research workspace."
          action={
            <LinkAction onClick={() => open("NOVA")}>
              Explore the workspace
            </LinkAction>
          }
        >
          <Chart compact />
        </Section>
        <Note>
          Design preview. All companies and market values are illustrative.
          Investing involves risk; Pace is not a prediction of returns.
        </Note>
      </>
    );
  if (page === "Sign in")
    return (
      <div className={s.auth}>
        <div>
          <Brand />
          <h1>
            Your next chapter,
            <br />
            <em>in perspective.</em>
          </h1>
          <Pace onEvidence={() => go("Learn")} />
        </div>
        <section>
          <button className={s.link} onClick={() => go("Public website")}>
            ← Back to AURYN
          </button>
          <span className={s.eyebrow}>YOUR WORKSPACE AWAITS</span>
          <h2>Welcome back.</h2>
          <p>Continue your research, at your pace.</p>
          <Button
            secondary
            onClick={() =>
              notify("Provider sign-in is disabled in this design preview.")
            }
          >
            Continue with Google
          </Button>
          <div className={s.divider}>or continue with email</div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <label>
              Email address
              <input
                type="email"
                value={email}
                required
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </label>
            <button type="submit" className={s.primary}>
              Sign in <ArrowRight size={16} />
            </button>
          </form>
          {submitted && (
            <Note>
              Preview only. No credentials were sent or stored. Live
              authentication will use the existing account service.
            </Note>
          )}
          <button
            className={s.link}
            onClick={() =>
              notify(
                "Account recovery flow is listed for the next prototype pass.",
              )
            }
          >
            Forgot password?
          </button>
        </section>
      </div>
    );
  if (page === "Settings")
    return (
      <>
        <Title
          eyebrow="YOUR WORKSPACE"
          title="Make it yours."
          description="A few thoughtful preferences. A workspace that feels right."
        />
        <div className={s.settingsGrid}>
          <aside className={s.settingsNav}>
            <div className={s.profile}>
              <span>A</span>
              <strong>Anudeep Paleru</strong>
              <small>Design workspace · Pro preview</small>
            </div>
            {[
              "Account",
              "Appearance",
              "Research",
              "Notifications",
              "Security",
              "Billing",
            ].map((v) => (
              <button
                key={v}
                aria-current={settings === v ? "page" : undefined}
                onClick={() => setSettings(v)}
              >
                {v}
                <ChevronRight size={15} />
              </button>
            ))}
          </aside>
          <Section
            title={settings}
            detail={
              settings === "Appearance"
                ? "Comfortable to read. Consistent wherever you work."
                : "Your preferences, clearly organized."
            }
          >
            {settings === "Appearance" ? (
              <>
                <div className={s.themeCards}>
                  {["Light", "Dark"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setDark(v === "Dark")}
                      aria-pressed={dark === (v === "Dark")}
                    >
                      <div
                        className={v === "Dark" ? s.themeDark : s.themeLight}
                      >
                        <i />
                        <span>
                          <i />
                          <i />
                          <i />
                        </span>
                      </div>
                      <span>
                        {v} {dark === (v === "Dark") && <Check size={16} />}
                      </span>
                    </button>
                  ))}
                </div>
                <div className={s.settingRow}>
                  <div>
                    <strong>Text size</strong>
                    <p>Adjust the reading size in this preview.</p>
                  </div>
                  <div className={s.segment}>
                    {["Standard", "Larger"].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setText(v);
                          document
                            .getElementById("auryn-redesign")
                            ?.setAttribute("data-text", v);
                        }}
                        aria-pressed={text === v}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.settingRow}>
                  <div>
                    <strong>Reduce motion</strong>
                    <p>Keep transitions still and predictable.</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={motion}
                    aria-label="Reduce motion"
                    className={s.toggle}
                    onClick={() => {
                      setMotion(!motion);
                      document
                        .getElementById("auryn-redesign")
                        ?.setAttribute("data-motion", String(!motion));
                    }}
                  >
                    <span />
                  </button>
                </div>
                <div className={s.settingRow}>
                  <div>
                    <strong>Brand accent</strong>
                    <p>AURYN blue. Financial colors keep their meaning.</p>
                  </div>
                  <span className={s.colorDot} />
                </div>
                <Note>
                  These preview preferences last for this visit. Account
                  synchronization is not connected.
                </Note>
              </>
            ) : settings === "Notifications" ? (
              <>
                <div className={s.settingRow}>
                  <div>
                    <strong>Pace changes</strong>
                    <p>See confirmed transitions for followed companies.</p>
                  </div>
                  <input
                    aria-label="Pace change notifications"
                    type="checkbox"
                    defaultChecked
                  />
                </div>
                <Button
                  onClick={() =>
                    notify(
                      "Notification preference preview updated for this visit.",
                    )
                  }
                >
                  Save preferences
                </Button>
              </>
            ) : settings === "Billing" ? (
              <>
                <div className={s.planSummary}>
                  <span className={s.badge}>PRO PREVIEW</span>
                  <h3>Your research, with more depth.</h3>
                  <p>No payment account is connected to this prototype.</p>
                  <Button onClick={() => go("Plans")}>
                    Compare plans <ArrowRight size={16} />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className={s.settingRow}>
                  <div>
                    <strong>
                      {settings === "Account"
                        ? "Profile"
                        : settings === "Security"
                          ? "Sign-in & sessions"
                          : "Research detail"}
                    </strong>
                    <p>
                      {settings === "Account"
                        ? "Manage your name and account details."
                        : settings === "Security"
                          ? "Review your account sign-in methods."
                          : "Full evidence remains accessible in every research section."}
                    </p>
                  </div>
                  <Button
                    secondary
                    onClick={() =>
                      notify(
                        "This account action is a prototype placeholder; no live account was changed.",
                      )
                    }
                  >
                    Manage
                  </Button>
                </div>
                <Note>
                  This section is a visual layout preview. Live account actions
                  are not connected.
                </Note>
              </>
            )}
          </Section>
        </div>
      </>
    );
  if (page === "Plans")
    return (
      <>
        <Title
          eyebrow="AURYN MEMBERSHIP"
          title="Go deeper, at your pace."
          description="Choose the research depth that fits your workflow."
          action={
            <div className={s.segment}>
              {["Monthly", "Annual"].map((v) => (
                <button
                  key={v}
                  aria-pressed={annual === (v === "Annual")}
                  onClick={() => setAnnual(v === "Annual")}
                >
                  {v}
                </button>
              ))}
            </div>
          }
        />
        <div className={s.twoCol}>
          {["Free", "Pro"].map((v, i) => (
            <Section
              key={v}
              title={v}
              detail={
                i ? "A complete research workspace." : "A clear place to begin."
              }
            >
              <h2>{i ? "Pricing to be confirmed" : "Free"}</h2>
              <p>{annual ? "Annual" : "Monthly"} plan preview · no checkout</p>
              {(i
                ? [
                    "All research sections",
                    "Advanced technical evidence",
                    "Options research tools",
                    "Portfolio context and alerts",
                  ]
                : ["Company overview", "Pace introduction", "Watchlist basics"]
              ).map((t) => (
                <p className={s.checkLine} key={t}>
                  <Check size={16} />
                  {t}
                </p>
              ))}
              <Button
                secondary={!i}
                onClick={() =>
                  notify(
                    "Plan selection preview only. No subscription was created.",
                  )
                }
              >
                {i ? "Explore Pro" : "Start with Free"}
              </Button>
            </Section>
          ))}
        </div>
        <Note>
          Feature lists are proposed design copy; final entitlements and pricing
          must match the existing access policy before release.
        </Note>
      </>
    );
  if (page === "Alerts")
    return (
      <>
        <Title
          eyebrow="STAY CONNECTED"
          title="The changes you asked for."
          description="Conditions, transitions and clear next steps."
          action={
            <Button
              onClick={() =>
                setAlerts([...alerts, "WAVE · Confirmed Pace transition"])
              }
            >
              <Plus size={16} /> Add sample alert
            </Button>
          }
        />
        <Section
          title="Your alerts"
          detail="Local preview · no notifications sent"
        >
          {alerts.map((a, i) => (
            <div className={s.alertRow} key={`${a}${i}`}>
              <span className={s.alertIcon}>
                <Bell size={18} />
              </span>
              <div>
                <strong>{a}</strong>
                <p>
                  {i === 0
                    ? "Triggered · P2 → P3 · Nov 4, 09:30"
                    : "Watching · condition not reached"}
                </p>
              </div>
              <button
                className={s.link}
                onClick={() => setAlerts(alerts.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          ))}
          {!alerts.length && (
            <Note>
              No alerts in this preview. Add a sample alert to explore the
              layout.
            </Note>
          )}
        </Section>
      </>
    );
  if (page === "Learn")
    return (
      <>
        <Title
          eyebrow="UNDERSTAND AURYN"
          title="A reason behind every step."
          description="Pace connects price conditions with your research and your limits."
        />
        <Pace
          hero
          onEvidence={() =>
            notify(
              "P0 Pause · P1 Watch · P2 Start small · P3 Add gradually · P4 Deep accumulation within limits.",
            )
          }
        />
        <Section title="Start with the essentials">
          {[
            "How confirmed and forming readings differ",
            "Why business qualification comes first",
            "How position limits shape a contribution",
            "Reading technicals without mistaking them for predictions",
          ].map((v, i) => (
            <details className={s.learnRow} key={v}>
              <summary>
                <span>0{i + 1}</span>
                {v}
              </summary>
              <p>
                {i === 0
                  ? "A confirmed reading uses a completed period. A forming reading can change before that period ends."
                  : i === 1
                    ? "Price conditions alone do not establish business quality. Inspect the supporting financial evidence."
                    : i === 2
                      ? "Your available cash and concentration limits constrain contributions even when a price zone qualifies."
                      : "Technical studies describe observed history. They do not guarantee a future move."}
              </p>
            </details>
          ))}
        </Section>
      </>
    );
  return (
    <>
      {page === "Home" ? (
        <>
          <Title
            eyebrow="WEDNESDAY, NOVEMBER 4"
            title="A little clarity for your day."
            description="The changes worth your attention. The rest can wait."
            action={<span className={s.badge}>Illustrative workspace</span>}
          />
          <div className={s.homeSummary}>
            <Metric
              label="Portfolio value"
              value="$184,620"
              detail="Sample portfolio · includes cash"
            />
            <Metric
              label="Total return"
              value="+$18,420"
              detail="+11.1% illustrative return"
              positive
            />
            <Metric
              label="Available cash"
              value="$24,000"
              detail="13.0% of portfolio"
            />
            <LinkAction onClick={() => go("Portfolio")}>
              Open portfolio
            </LinkAction>
          </div>
          <div className={s.homeGrid}>
            <Section
              title="Your Pace, in motion"
              detail="Confirmed changes across companies you follow."
              action={
                <LinkAction onClick={() => go("Watchlist")}>
                  Watchlist
                </LinkAction>
              }
            >
              <div className={s.transition}>
                <div className={s.miniLogo}>N</div>
                <div>
                  <strong>Nova Systems</strong>
                  <small>NOVA · Business checks supported</small>
                </div>
                <div className={s.transitionStages}>
                  <span>P2</span>
                  <ArrowRight size={17} />
                  <strong>P3</strong>
                </div>
              </div>
              <p className={s.transitionCopy}>
                A measured step forward.
                <br />
                <strong>Add gradually.</strong>
              </p>
              <div className={s.miniPace}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className={i === 3 ? s.miniPaceActive : ""}>
                    P{i}
                  </span>
                ))}
              </div>
              <LinkAction onClick={() => open("NOVA")}>
                Explore the evidence
              </LinkAction>
            </Section>
            <Section
              title="On your horizon"
              detail="Upcoming company checkpoints"
            >
              <div className={s.event}>
                <div className={s.dateTile}>
                  NOV<strong>12</strong>
                </div>
                <div>
                  <strong>Nova Systems earnings</strong>
                  <p>Revenue durability · cash conversion</p>
                </div>
              </div>
              <div className={s.event}>
                <div className={s.dateTile}>
                  NOV<strong>14</strong>
                </div>
                <div>
                  <strong>Arc Energy update</strong>
                  <p>Capital spending · debt position</p>
                </div>
              </div>
              <LinkAction onClick={() => go("Alerts")}>
                Review your alerts
              </LinkAction>
            </Section>
          </div>
          <Section
            title="The companies on your radar"
            action={
              <LinkAction onClick={() => go("Research")}>
                All research
              </LinkAction>
            }
          >
            {companyTable()}
          </Section>
        </>
      ) : page === "Portfolio" ? (
        <>
          <Title
            eyebrow="YOUR CAPITAL, IN CONTEXT"
            title="See the whole picture."
            description="Performance, positions and the room for your next move."
            action={
              <Button
                secondary
                onClick={() =>
                  notify("Import flow is not connected in this visual preview.")
                }
              >
                <Plus size={16} /> Add holdings
              </Button>
            }
          />
          <div className={s.metricStrip}>
            <Metric
              label="Net portfolio value"
              value="$184,620"
              detail="Sample holdings + cash"
            />
            <Metric
              label="Total return"
              value="+11.1%"
              detail="Illustrative cost basis"
              positive
            />
            <Metric label="Cash" value="$24,000" detail="13.0% available" />
            <Metric
              label="Largest position"
              value="18.5%"
              detail="NOVA · review concentration"
            />
          </div>
          <div className={s.researchGrid}>
            <Section
              title="Portfolio trajectory"
              detail="Illustrative indexed path, not actual account performance"
            >
              <Chart compact />
            </Section>
            <Section title="Your allocation">
              <div className={s.donut}>
                <span>
                  6<strong>positions</strong>
                </span>
              </div>
              <p className={s.legend}>
                <i />
                Technology 34% <i />
                Energy 22% <i />
                Other 44%
              </p>
              <Note>Review concentration before increasing a position.</Note>
            </Section>
          </div>
          <Section title="Holdings">{companyTable(true)}</Section>
        </>
      ) : (
        <>
          <Title
            eyebrow={
              page === "Discover"
                ? "RESEARCH WITH INTENT"
                : "YOUR RESEARCH UNIVERSE"
            }
            title={
              page === "Watchlist"
                ? "Keep your next decision close."
                : page === "Discover"
                  ? "Find your next question."
                  : "Good research starts here."
            }
            description={
              page === "Discover"
                ? "Screen the evidence. Understand why a company appears."
                : "Compare the business, the price and the Pace."
            }
          />
          <Section
            title={
              page === "Watchlist"
                ? "Following"
                : page === "Discover"
                  ? "Explore companies"
                  : "Your companies"
            }
            action={
              <span className={s.badge}>{list.length} sample companies</span>
            }
          >
            <div className={s.listToolbar}>
              <div className={s.segment}>
                {["All", "Accumulation", "Watching"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilter(v)}
                    aria-pressed={filter === v}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <label className={s.inlineSearch}>
                <Search size={16} />
                <input
                  aria-label="Filter companies"
                  placeholder="Filter this list"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <select
                aria-label="Sort companies"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {["Company", "Pace", "Price"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            {companyTable()}
            {list.length === 0 && (
              <Note>
                No sample companies match. Try a different name or clear the
                filters.
              </Note>
            )}
          </Section>
        </>
      )}
    </>
  );
}
