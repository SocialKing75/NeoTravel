"use client";

import { useState } from "react";

type Screen = "landing" | "chat" | "devis" | "dashboard" | "demandes" | "agent";

type Message = {
  role: "agent" | "user";
  text: string;
  loading?: boolean;
};

const conversation: Message[] = [
  {
    role: "agent",
    text: "Bonjour ! Je suis l’agent Neotravel. Décrivez votre besoin de transport : départ, destination, date et nombre de passagers.",
  },
  {
    role: "user",
    text: "Paris → Lyon, 15 passagers, le 15 juillet 2026",
  },
  {
    role: "agent",
    text: "Parfait. Paris → Lyon pour 15 personnes le 15 juillet. Est-ce urgent ?",
  },
  {
    role: "user",
    text: "Oui, assez urgent.",
  },
  {
    role: "agent",
    text: "Très bien. Souhaitez-vous ajouter des options : guide, nuit chauffeur ou péages inclus ?",
  },
  {
    role: "user",
    text: "Péages inclus.",
  },
  {
    role: "agent",
    text: "Toutes les informations sont collectées. J’appelle maintenant calculer_devis().",
    loading: true,
  },
];

const demandes = [
  {
    prospect: "Jean Dupont",
    email: "jean.dupont@email.fr",
    trajet: "Paris → Lyon",
    date: "24 juin",
    passagers: 15,
    statut: "Devis envoyé",
    badge: "lime",
  },
  {
    prospect: "Mairie de Rennes",
    email: "transport@rennes.fr",
    trajet: "Rennes → Nantes",
    date: "24 juin",
    passagers: 40,
    statut: "En relance",
    badge: "warning",
  },
  {
    prospect: "Asso. Rando Alsace",
    email: "contact@rando67.fr",
    trajet: "Strasbourg → Colmar",
    date: "23 juin",
    passagers: 22,
    statut: "Qualifié",
    badge: "blue",
  },
  {
    prospect: "TechCorp SA",
    email: "rh@techcorp.fr",
    trajet: "Lyon → Paris CDG",
    date: "23 juin",
    passagers: 53,
    statut: "Nouveau",
    badge: "blue",
  },
  {
    prospect: "Collège Jean Moulin",
    email: "sortie@cjm.fr",
    trajet: "Bordeaux → Dordogne",
    date: "22 juin",
    passagers: 38,
    statut: "Accepté",
    badge: "lime",
  },
  {
    prospect: "Club Football Caen",
    email: "bus@fbcaen.fr",
    trajet: "Caen → Paris",
    date: "21 juin",
    passagers: 28,
    statut: "Refusé",
    badge: "danger",
  },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [step, setStep] = useState(0);

  const goToChat = () => {
    setStep(0);
    setScreen("chat");
  };

  const nextMessage = () => {
    if (step < conversation.length - 1) {
      const next = step + 1;
      setStep(next);

      if (conversation[next]?.loading) {
        setTimeout(() => {
          setScreen("devis");
        }, 1800);
      }
    }
  };

  if (screen === "landing") {
    return <Landing goToChat={goToChat} setScreen={setScreen} />;
  }

  if (screen === "chat") {
    return (
      <Chat
        messages={conversation.slice(0, step + 1)}
        nextMessage={nextMessage}
        setScreen={setScreen}
      />
    );
  }

  if (screen === "devis") {
    return <Devis setScreen={setScreen} />;
  }

  return (
    <div className="operator-layout">
      <Sidebar screen={screen} setScreen={setScreen} />

      <main className="operator-main">
        <Topbar screen={screen} />

        {screen === "dashboard" && <Dashboard setScreen={setScreen} />}
        {screen === "demandes" && <Demandes setScreen={setScreen} />}
        {screen === "agent" && <AgentIA />}
      </main>
    </div>
  );
}

function Landing({
  goToChat,
  setScreen,
}: {
  goToChat: () => void;
  setScreen: (screen: Screen) => void;
}) {
  return (
    <main className="landing-page">
      <header className="public-navbar">
        <img src="/assets/logo-neotravel.png" alt="Neotravel" className="public-logo" />

        <nav>
          <a>Accueil</a>
          <a>Qui sommes-nous</a>
          <a>Services & Garanties</a>
          <a>Flotte</a>
          <a>Avis clients</a>
          <a>Blog</a>
        </nav>

        <div className="public-actions">
          <a className="phone">09 80 40 04 84</a>
          <button onClick={goToChat}>Devis gratuit</button>
        </div>
      </header>

      <section className="hero-premium">
        <div className="hero-left">
          <div className="premium-pill">
            <span></span>
            Transport premium avec chauffeur
          </div>

          <h1>
            Location <br />
            d’autocar, <br />
            minibus <br />
            et bus privé
          </h1>

          <p>
            Neotravel vous accompagne dans vos déplacements de groupe grâce à un
            réseau de partenaires autocaristes qualifiés et un assistant IA capable
            de générer un devis en quelques minutes.
          </p>

          <div className="hero-buttons">
            <button onClick={goToChat}>Demander un devis</button>
            <button className="ghost" onClick={() => setScreen("dashboard")}>
              Espace opérateur
            </button>
          </div>
        </div>

        <div className="quote-card">
          <h2>Votre devis en quelques minutes :</h2>

          <div className="progress-lines">
            <span className="active"></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h3>Votre déplacement</h3>

          <label>Ville de départ</label>
          <input placeholder="Ex: Paris, Bruxelles, Genève..." />

          <label>Destination</label>
          <input placeholder="Ex: Lyon, Nice, Marseille..." />

          <label>Nombre de passagers</label>
          <input placeholder="Ex: 45 personnes" />

          <button onClick={goToChat}>Continuer avec l’agent IA</button>
        </div>
      </section>
    </main>
  );
}

function Chat({
  messages,
  nextMessage,
  setScreen,
}: {
  messages: Message[];
  nextMessage: () => void;
  setScreen: (screen: Screen) => void;
}) {
  const filled = Math.min(messages.length, 6);

  return (
    <main className="chat-page">
      <header className="chat-header">
        <img src="/assets/logo-neotravel.png" alt="Neotravel" />
        <div className="chat-progress">
          <div className="chat-progress-top">
            <span>Informations collectées</span>
            <span>{filled} / 6</span>
          </div>
          <div className="chat-track">
            <div style={{ width: `${(filled / 6) * 100}%` }}></div>
          </div>
        </div>
      </header>

      <div className="slots">
        <span className="done">Paris</span>
        <span className="done">Lyon</span>
        <span className={filled >= 3 ? "done" : ""}>15 juillet</span>
        <span className={filled >= 4 ? "done" : ""}>15 passagers</span>
        <span className={filled >= 5 ? "done" : ""}>Urgent</span>
        <span className={filled >= 6 ? "done" : ""}>Péages</span>
      </div>

      <section className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message-row ${message.role}`}>
            {message.role === "agent" && <div className="agent-avatar">Nt</div>}

            <div className={`message-bubble ${message.role}`}>
              {message.loading ? (
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                message.text
              )}
            </div>
          </div>
        ))}
      </section>

      <footer className="chat-input-area">
        <input placeholder="Votre réponse..." />
        <button onClick={nextMessage}>Envoyer</button>
        <button className="ghost-dark" onClick={() => setScreen("landing")}>
          Retour
        </button>
      </footer>
    </main>
  );
}

function Devis({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <main className="devis-page">
      <section className="devis-card">
        <header className="devis-header">
          <div>
            <p>Devis transport de groupe</p>
            <h1>Paris → Lyon</h1>
            <span>DEV-2048 · Valable 15 jours</span>
          </div>

          <div className="devis-status">
            <span>Calculé automatiquement</span>
            <small>15 juillet 2026</small>
          </div>
        </header>

        <div className="client-summary">
          <div className="client-avatar">JD</div>
          <div>
            <strong>Jean Dupont</strong>
            <span>jean.dupont@email.fr</span>
          </div>
        </div>

        <div className="trip-tags">
          <span>Paris → Lyon</span>
          <span>15 passagers</span>
          <span>15 juillet 2026</span>
          <span>Urgent</span>
          <span>Péages inclus</span>
        </div>

        <div className="calculation">
          <CalcLine label="472 km × 2,12 €/km" value="1 000 €" />
          <CalcLine label="Coeff. saisonnalité — Juillet (+10 %)" value="+100 €" lime />
          <CalcLine label="Coeff. urgence — DD_URGENT (+5 %)" value="+55 €" lime />
          <CalcLine label="Option — Péages inclus" value="+80 €" lime />
          <CalcLine label="Marge commerciale (+15 %)" value="+173 €" lime />
          <CalcLine label="Montant HT" value="1 408 €" bold />
          <CalcLine label="TVA 10 %" value="+141 €" muted />
        </div>

        <div className="total">
          <div>
            <span>Montant TTC</span>
            <small>TVA 10 % incluse</small>
          </div>
          <strong>1 549 €</strong>
        </div>

        <footer className="devis-footer">
          <button>Télécharger le PDF</button>
          <button className="ghost" onClick={() => setScreen("landing")}>
            Modifier ma demande
          </button>
          <button className="ghost" onClick={() => setScreen("dashboard")}>
            Espace opérateur
          </button>
        </footer>
      </section>
    </main>
  );
}

function Sidebar({
  screen,
  setScreen,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/assets/logo-neotravel.png" alt="Neotravel" />
      </div>

      <p className="side-title">Principal</p>

      <button
        className={screen === "dashboard" ? "active" : ""}
        onClick={() => setScreen("dashboard")}
      >
        Tableau de bord
      </button>

      <button
        className={screen === "demandes" ? "active" : ""}
        onClick={() => setScreen("demandes")}
      >
        Demandes <span>12</span>
      </button>

      <button onClick={() => setScreen("devis")}>Devis</button>

      <button
        className={screen === "agent" ? "active" : ""}
        onClick={() => setScreen("agent")}
      >
        Agent IA
      </button>

      <p className="side-title">Config.</p>
      <button>Réglages</button>

      <div className="sidebar-user">
        <div>SM</div>
        <section>
          <strong>Sophie Martin</strong>
          <span>Responsable commercial</span>
        </section>
      </div>
    </aside>
  );
}

function Topbar({ screen }: { screen: Screen }) {
  const titles: Record<string, string> = {
    dashboard: "Tableau de bord",
    demandes: "Demandes",
    agent: "Agent IA",
  };

  const subtitles: Record<string, string> = {
    dashboard: "Bonjour, Sophie — mardi 24 juin 2026",
    demandes: "Gestion & qualification",
    agent: "Orchestration & outil log",
  };

  return (
    <header className="topbar">
      <div>
        <h1>{titles[screen]}</h1>
        <p>{subtitles[screen]}</p>
      </div>

      <div className="topbar-actions">
        <input placeholder="Rechercher..." />
        <button>🔔</button>
        <div className="top-user">SM</div>
        <div>
          <strong>Sophie M.</strong>
          <span>Responsable</span>
        </div>
      </div>
    </header>
  );
}

function Dashboard({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <section className="operator-content">
      <div className="kpis">
        <Kpi title="Leads entrants vs traités" value="58 → 42" note="72 % traités · +8 % vs hier" />
        <Kpi title="Délai demande → devis" value="2 h 10" note="−18 min vs sem. préc." />
        <Kpi title="Taux conversion post-devis" value="34 %" note="+4 pts / 7 jours" />
        <Kpi title="Coût / réponse chatbot" value="0,08 €" note="−0,02 € vs sem. préc." />
        <Kpi title="Taux d’abandon chatbot" value="23 %" note="−5 pts amélioration" />
      </div>

      <div className="operator-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Demandes récentes</h2>
              <p>Dernières 24 h</p>
            </div>
            <button onClick={() => setScreen("demandes")}>Voir toutes →</button>
          </div>

          <DemandesTable small />
        </section>

        <section className="panel">
          <h2>Pipeline commercial</h2>

          <div className="pipeline">
            <Pipe label="Captation" value="58" />
            <Pipe label="Qualifiées" value="34" />
            <Pipe label="Devis" value="21" />
            <Pipe label="Relance" value="9" />
            <Pipe label="Signées" value="7" lime />
          </div>
        </section>
      </div>
    </section>
  );
}

function Demandes({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <section className="operator-content demandes-page">
      <div className="tabs">
        <button className="active">Toutes <span>58</span></button>
        <button>Nouvelles <span>12</span></button>
        <button>Qualifiées <span>18</span></button>
        <button>Devis envoyés <span>15</span></button>
        <button>En relance <span>9</span></button>
      </div>

      <section className="panel">
        <DemandesTable />
      </section>

      <button className="floating-action" onClick={() => setScreen("agent")}>
        Qualifier avec l’agent IA
      </button>
    </section>
  );
}

function AgentIA() {
  return (
    <section className="operator-content">
      <div className="principle">
        <strong>L’IA décide — les outils exécutent.</strong>
        <span>
          L’agent orchestre la conversation et appelle des outils déterministes.
          Il ne fait jamais d’arithmétique lui-même.
        </span>
      </div>

      <div className="agent-layout">
        <section className="panel conversation-panel">
          <h2>Conversation prospect — DEV-2048</h2>

          <div className="agent-conversation">
            {conversation.slice(0, 6).map((message, index) => (
              <div key={index} className={`message-row ${message.role}`}>
                {message.role === "agent" && <div className="agent-avatar">Nt</div>}
                <div className={`message-bubble ${message.role}`}>{message.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel tools-panel">
          <h2>Appels d’outils</h2>

          <Tool name="calculer_devis()" lines={["trajet: Paris → Lyon", "km: 472", "passagers: 15", "statut: success"]} />
          <Tool name="generer_pdf()" lines={["ref: DEV-2048", "prospect: Jean Dupont"]} />
          <Tool name="envoyer_email()" lines={["to: jean.dupont@email.fr", "devis: DEV-2048"]} />
          <Tool name="crm_update()" lines={["id: D-2048", "statut: Devis envoyé"]} />
        </section>
      </div>
    </section>
  );
}

function Kpi({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <section className="kpi-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </section>
  );
}

function Pipe({ label, value, lime }: { label: string; value: string; lime?: boolean }) {
  return (
    <div className="pipe">
      <div className={lime ? "lime" : ""}></div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function DemandesTable({ small }: { small?: boolean }) {
  const list = small ? demandes.slice(0, 4) : demandes;

  return (
    <table className="demandes-table">
      <thead>
        <tr>
          <th>Prospect</th>
          <th>Trajet</th>
          <th>Date</th>
          <th>Pass.</th>
          <th>Statut</th>
          {!small && <th>Actions</th>}
        </tr>
      </thead>

      <tbody>
        {list.map((item) => (
          <tr key={item.email}>
            <td>
              <strong>{item.prospect}</strong>
              <span>{item.email}</span>
            </td>
            <td className="mono">{item.trajet}</td>
            <td>{item.date}</td>
            <td>{item.passagers}</td>
            <td>
              <span className={`badge ${item.badge}`}>{item.statut}</span>
            </td>
            {!small && (
              <td>
                <button className="table-btn">Ouvrir</button>
                <button className="table-btn lime">Devis</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CalcLine({
  label,
  value,
  lime,
  bold,
  muted,
}: {
  label: string;
  value: string;
  lime?: boolean;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`calc-line ${bold ? "bold" : ""}`}>
      <span>{label}</span>
      <strong className={`${lime ? "lime" : ""} ${muted ? "muted" : ""}`}>
        {value}
      </strong>
    </div>
  );
}

function Tool({ name, lines }: { name: string; lines: string[] }) {
  return (
    <div className="tool-card">
      <div>
        <strong>{name}</strong>
        <span>✓ succès</span>
      </div>

      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}