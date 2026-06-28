"use client";

import { useState, useRef, useEffect } from "react";

type Screen = "landing" | "dashboard" | "demandes";

type ChatMessage = { role: "agent" | "user"; text: string; sentAt: Date };

type DemandeStatus = "Nouveau" | "En cours" | "Devis envoyé" | "En attente";

type Demande = {
  id: string;
  prospect: string;
  email: string;
  tel: string;
  depart: string;
  destination: string;
  passagers: number;
  tripDate: string;
  vehicule: string;
  statut: DemandeStatus;
  tarifMin: number;
  tarifMax: number;
  createdAt: Date;
  messages: ChatMessage[];
};

type TripInfo = { depart?: string; destination?: string; passagers?: string; date?: string };

/* ─── TIME / FORMAT HELPERS ───────────────────────────────────────────────── */

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(d: Date, now: Date) {
  const dayDiff = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000);
  if (dayDiff <= 0) return `Auj. ${formatTime(d)}`;
  if (dayDiff === 1) return `Hier ${formatTime(d)}`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function statusBadgeClass(statut: DemandeStatus) {
  if (statut === "En cours") return "blue";
  if (statut === "En attente") return "warning";
  return "lime";
}

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function parseTripQuery(query: string): TripInfo {
  const arrowMatch = query.match(/([A-Za-zÀ-ÖØ-öø-ÿ' -]{2,30}?)\s*(?:→|->)\s*([A-Za-zÀ-ÖØ-öø-ÿ' -]{2,30})/);
  const paxMatch = query.match(/(\d+)\s*(?:personnes?|passagers?|pers\.?)/i);
  const dateMatch = query.match(/\b(\d{1,2}\s+(?:janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)(?:\s+\d{4})?)/i);
  return {
    depart: arrowMatch?.[1]?.trim(),
    destination: arrowMatch?.[2]?.trim().split(",")[0]?.trim(),
    passagers: paxMatch?.[1],
    date: dateMatch?.[1]?.trim(),
  };
}

/* ─── MOCK DEMANDES (timestamps anchored to the real current date) ──────────── */

function buildInitialDemandes(): Demande[] {
  const now = new Date();
  const today = new Date(now); today.setHours(9, 14, 0, 0);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(14, 32, 0, 0);
  const threeDaysAgo = new Date(now); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); threeDaysAgo.setHours(11, 5, 0, 0);
  const fiveDaysAgo = new Date(now); fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5); fiveDaysAgo.setHours(16, 40, 0, 0);

  return [
    {
      id: "NT-2026-0041",
      prospect: "Camille Roux",
      email: "c.roux@acme.fr",
      tel: "06 12 34 56 78",
      depart: "Paris",
      destination: "Lyon",
      passagers: 45,
      tripDate: "15 juillet 2026",
      vehicule: "Autocar grand tourisme",
      statut: "Nouveau",
      tarifMin: 1830,
      tarifMax: 2416,
      createdAt: today,
      messages: [
        { role: "user", text: "Bonjour, je cherche un autocar pour 45 personnes, départ Paris le 15 juillet direction Lyon pour un séminaire d'entreprise.", sentAt: today },
        { role: "agent", text: "Bonjour ! J'ai bien noté votre demande — laissez-moi quelques secondes pour analyser votre trajet.", sentAt: new Date(today.getTime() + 30 * 1000) },
        { role: "agent", text: "Parfait ! Paris → Lyon, 45 passagers, 15 juillet. Tarif indicatif : 1 830 € – 2 416 € TTC, chauffeur et carburant inclus. Souhaitez-vous un devis par email ?", sentAt: new Date(today.getTime() + 70 * 1000) },
        { role: "user", text: "Oui, envoyez-le à c.roux@acme.fr. Est-ce que vous avez des horaires avec retour le soir ?", sentAt: new Date(today.getTime() + 130 * 1000) },
      ],
    },
    {
      id: "NT-2026-0040",
      prospect: "Thomas Mercier",
      email: "t.mercier@rh-corp.fr",
      tel: "06 22 33 44 55",
      depart: "Bordeaux",
      destination: "Paris CDG",
      passagers: 8,
      tripDate: "2 juillet 2026",
      vehicule: "Minibus & van",
      statut: "En cours",
      tarifMin: 980,
      tarifMax: 1280,
      createdAt: yesterday,
      messages: [
        { role: "user", text: "Navette aéroport pour notre équipe RH, 8 personnes, départ Bordeaux vers Paris CDG.", sentAt: yesterday },
        { role: "agent", text: "Bonjour ! Je note votre besoin de navette. Avez-vous une date et une heure de vol précises ?", sentAt: new Date(yesterday.getTime() + 60 * 1000) },
      ],
    },
    {
      id: "NT-2026-0039",
      prospect: "Sophie Laurent",
      email: "s.laurent@ecole-jules.fr",
      tel: "06 33 44 55 66",
      depart: "Lyon",
      destination: "Grenoble",
      passagers: 38,
      tripDate: "18 juin 2026",
      vehicule: "Autocar grand tourisme",
      statut: "Devis envoyé",
      tarifMin: 1420,
      tarifMax: 1890,
      createdAt: threeDaysAgo,
      messages: [
        { role: "user", text: "Sortie scolaire terminée, avis très positif ! Merci pour le service.", sentAt: threeDaysAgo },
      ],
    },
    {
      id: "NT-2026-0038",
      prospect: "Marc Duval",
      email: "marc.duval@vignerons-reims.fr",
      tel: "06 44 55 66 77",
      depart: "Paris",
      destination: "Reims",
      passagers: 28,
      tripDate: "30 juin 2026",
      vehicule: "Autocar grand tourisme",
      statut: "En attente",
      tarifMin: 1100,
      tarifMax: 1450,
      createdAt: fiveDaysAgo,
      messages: [
        { role: "user", text: "Événement viticole, aller-retour dans la journée, êtes-vous disponibles ?", sentAt: fiveDaysAgo },
      ],
    },
  ];
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [demandes, setDemandes] = useState<Demande[]>(buildInitialDemandes);
  const [agentNotifications, setAgentNotifications] = useState(0);
  const demandeCounter = useRef(42);
  const now = useNow();

  const goScreen = (target: Screen) => {
    if (target === "demandes") setAgentNotifications(0);
    setScreen(target);
  };

  const addDemande = (info: TripInfo) => {
    const createdAt = new Date();
    const id = `NT-2026-${String(demandeCounter.current++).padStart(4, "0")}`;
    setDemandes(list => [
      {
        id,
        prospect: "Nouveau prospect",
        email: "",
        tel: "",
        depart: info.depart || "—",
        destination: info.destination || "—",
        passagers: info.passagers ? parseInt(info.passagers, 10) : 0,
        tripDate: info.date || "Date à confirmer",
        vehicule: "À déterminer",
        statut: "Nouveau",
        tarifMin: 0,
        tarifMax: 0,
        createdAt,
        messages: [],
      },
      ...list,
    ]);
    setAgentNotifications(n => n + 1);
    return id;
  };

  const appendMessage = (id: string, message: ChatMessage) => {
    setDemandes(list => list.map(d => (d.id === id ? { ...d, messages: [...d.messages, message] } : d)));
  };

  const updateDemandeTarif = (id: string, min: number, max: number) => {
    setDemandes(list => list.map(d => (d.id === id ? { ...d, tarifMin: min, tarifMax: max } : d)));
  };

  if (screen === "landing") {
    return (
      <Landing
        setScreen={goScreen}
        addDemande={addDemande}
        appendMessage={appendMessage}
        updateDemandeTarif={updateDemandeTarif}
      />
    );
  }

  return (
    <div className="operator-layout">
      <Sidebar screen={screen} setScreen={goScreen} demandesCount={demandes.length} />
      <main className="operator-main">
        <Topbar screen={screen} notifications={agentNotifications} now={now} />
        {screen === "dashboard" && <Dashboard setScreen={goScreen} demandes={demandes} now={now} />}
        {screen === "demandes" && <Demandes demandes={demandes} now={now} />}
      </main>
    </div>
  );
}

/* ─── LANDING ─────────────────────────────────────────────────────────────── */

function Landing({
  setScreen,
  addDemande,
  appendMessage,
  updateDemandeTarif,
}: {
  setScreen: (s: Screen) => void;
  addDemande: (info: TripInfo) => string;
  appendMessage: (id: string, message: ChatMessage) => void;
  updateDemandeTarif: (id: string, min: number, max: number) => void;
}) {
  const [chatActive, setChatActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [heroQuery, setHeroQuery] = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const [agentStage, setAgentStage] = useState(0);
  const [honeypot, setHoneypot] = useState("");
  const formTs = useRef<number>(Date.now());
  const formRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDemandeId = useRef<string | null>(null);
  const tripInfo = useRef<TripInfo>({});
  const sessionId = useRef<string>(`web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    const stored = localStorage.getItem("nt_session_id");
    if (stored) {
      sessionId.current = stored;
    } else {
      localStorage.setItem("nt_session_id", sessionId.current);
    }
  }, []);

  const scrollToForm = () => {
    if (formRef.current) {
      const y = formRef.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const addMsg = (role: "agent" | "user", text: string) => {
    const msg: ChatMessage = { role, text, sentAt: new Date() };
    setMessages(m => [...m, msg]);
    if (activeDemandeId.current) appendMessage(activeDemandeId.current, msg);
  };

  const callAgent = async (message: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId: sessionId.current, honeypot, formTs: formTs.current }),
      });
      const data = await res.json();
      if (res.ok && data.reply && String(data.reply).trim()) return String(data.reply);
      return null;
    } catch {
      return null;
    }
  };

  const priceMsg = () => {
    const pax = parseInt(tripInfo.current.passagers ?? "", 10) || 30;
    const low = 1200 + pax * 14;
    const high = Math.round(low * 1.32);
    const fmt = (n: number) => n.toLocaleString("fr-FR");
    if (activeDemandeId.current) updateDemandeTarif(activeDemandeId.current, low, high);
    return `D'après les éléments fournis, le tarif indicatif se situe entre ${fmt(low)} € et ${fmt(high)} € TTC, chauffeur et carburant inclus. Tarif indicatif — la distance exacte sera confirmée avant l'envoi du devis définitif.`;
  };

  const pushAgent = (text: string) => {
    setAgentTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      addMsg("agent", text);
      setAgentTyping(false);
    }, 1000);
  };

  const openChat = async () => {
    const query = heroQuery.trim();
    setChatActive(true);
    setAgentStage(0);
    setAgentTyping(true);
    if (timer.current) clearTimeout(timer.current);

    const parsed = parseTripQuery(query);
    tripInfo.current = parsed;
    activeDemandeId.current = addDemande(parsed);

    if (query) {
      addMsg("user", query);
      setHeroQuery("");
    } else {
      setMessages([]);
    }

    const trip = parsed.depart && parsed.destination ? `${parsed.depart} → ${parsed.destination}` : "votre trajet";
    const pax = parsed.passagers ? `${parsed.passagers} passagers` : "votre groupe";
    const apiReply = await callAgent(query || `Nouvelle demande. Trajet : ${trip}. ${pax}.`);
    if (apiReply) {
      addMsg("agent", apiReply);
      setAgentTyping(false);
    } else {
      timer.current = setTimeout(() => {
        addMsg("agent", `Bonjour, je suis l'agent Neotravel. J'ai bien noté votre trajet ${trip} pour ${pax}. Pour affiner le devis, souhaitez-vous un aller simple ou un aller-retour ?`);
        setAgentTyping(false);
      }, 850);
    }
  };

  const respond = async (userText: string) => {
    setAgentTyping(true);
    const apiReply = await callAgent(userText);
    if (apiReply) {
      addMsg("agent", apiReply);
      setAgentTyping(false);
      setAgentStage(s => s + 1);
      return;
    }
    const t = userText.toLowerCase();
    let reply: string;
    if (/(prix|tarif|co[uû]t|combien|budget|devis)/.test(t)) {
      reply = priceMsg();
    } else if (/(conseiller|humain|appel|rappel|t[ée]l[ée]phone|parler)/.test(t)) {
      reply = "Bien sûr. Un chargé d'affaires Neotravel peut vous rappeler sous 24 h ouvrées.";
    } else if (agentStage === 0) {
      reply = `Parfait. Pour ${tripInfo.current.depart || "votre départ"} → ${tripInfo.current.destination || "votre destination"}, j'estime la distance et le temps de conduite. Avez-vous une date précise, ou êtes-vous flexible ?`;
    } else if (agentStage === 1) {
      reply = priceMsg();
    } else if (agentStage === 2) {
      reply = "Très bien. Je peux vous envoyer ce devis par email et programmer un rappel. Souhaitez-vous que je le fasse ?";
    } else {
      reply = "C'est noté, votre demande est transmise à notre équipe. Avez-vous une exigence particulière à ajouter ?";
    }
    setAgentStage(s => s + 1);
    pushAgent(reply);
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    addMsg("user", text);
    setChatInput("");
    respond(text);
  };

  const chatTags = [
    "Paris → Lyon, 45 pers.",
    "Devis pour un séminaire",
    "Navette aéroport",
    "Voyage scolaire",
  ];

  const insertTag = (tag: string) => {
    setChatInput(prev => prev ? `${prev} ${tag}` : tag);
  };

  const onQuick = (text: string) => {
    addMsg("user", text);
    respond(text);
  };

  return (
    <div className="nt-page">

      {/* HEADER */}
      <header className="nt-header">
        <div className="nt-header-inner">
          <img src="/assets/Neotravel-logo.svg" alt="Neotravel" className="nt-logo" />
          <nav className="nt-nav">
            <a className="active" href="#">Accueil</a>
            <a href="#">Qui sommes-nous</a>
            <a href="#services">Services &amp; garanties</a>
            <a href="#flotte">Flotte</a>
            <a href="#avis">Avis clients</a>
            <a href="#">Blog</a>
          </nav>
          <div className="nt-header-actions">
            <button className="nt-btn-outline nt-header-agent" onClick={() => setScreen("dashboard")}>Espace agent</button>
            <a className="nt-phone-btn" href="tel:0980400484">09 80 40 04 84</a>
          </div>
        </div>
      </header>

      <section className="nt-hero nt-hero-home">
        <div className="nt-hero-photo" />
        <div className="nt-hero-overlay-1" />
        <div className="nt-hero-overlay-2" />
        <div className="nt-hero-inner hero-home-inner">
          <div className="nt-hero-text">
            <div className="nt-eyebrow nt-eyebrow-home">
              <span className="nt-eyebrow-dot" />
              <span>TRANSPORT PREMIUM AVEC CHAUFFEUR</span>
            </div>
            <h1 className="nt-h1 nt-h1-home">
              Organisez votre transport de groupe<br />en toute simplicité
            </h1>
            {!chatActive ? (
              <p className="nt-hero-desc nt-hero-desc-home">
                Décrivez votre besoin, échangez avec notre assistant IA et recevez un devis personnalisé en quelques minutes grâce à notre réseau d'autocaristes partenaires partout en France.
              </p>
            ) : (
              <div className="nt-chat-panel">
                <div className="nt-chat-header">
                  <div>
                    <strong>Conversation avec l'agent Neotravel</strong>
                    <p>Votre assistant de devis est prêt à répondre à vos questions.</p>
                  </div>
                  <button type="button" className="nt-chat-close" onClick={() => setChatActive(false)}>
                    Fermer
                  </button>
                </div>
                <div className="nt-chat-messages">
                  {messages.map((m, i) => (
                    <div key={i} className={`nt-chat-message ${m.role}`}>
                      <p>{m.text}</p>
                      <span className="nt-chat-timestamp">{formatTime(m.sentAt)}</span>
                    </div>
                  ))}
                  {agentTyping && (
                    <div className="nt-chat-message agent">
                      <div className="nt-typing">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                </div>
                <div className="nt-chat-quicks">
                  {[
                    "Aller-retour",
                    "Quel est le tarif ?",
                    "Je suis flexible sur les dates",
                    "Parler à un conseiller",
                  ].map(q => (
                    <button key={q} type="button" className="nt-quick" onClick={() => onQuick(q)}>{q}</button>
                  ))}
                </div>
                <div className="nt-chat-tags">
                  {chatTags.map(tag => (
                    <button key={tag} type="button" className="nt-chat-tag" onClick={() => insertTag(tag)}>{tag}</button>
                  ))}
                </div>
                <div className="nt-chat-input">
                  <div className="nt-chat-icons">
                    <button type="button" className="nt-chat-icon-btn" aria-label="Joindre un fichier">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05 12.95 19.5a5.5 5.5 0 0 1-7.78 0 5.5 5.5 0 0 1 0-7.78l7.07-7.07a3.5 3.5 0 1 1 4.95 4.95L11.5 18.5" />
                        <path d="M18 6.5 19.5 5" />
                      </svg>
                    </button>
                    <button type="button" className="nt-chat-icon-btn" aria-label="Activer la voix">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1.5a3.5 3.5 0 0 1 3.5 3.5v5a3.5 3.5 0 0 1-7 0v-5A3.5 3.5 0 0 1 12 1.5Z" />
                        <path d="M8.5 12a3.5 3.5 0 0 0 7 0" />
                        <path d="M12 19.5v3" />
                        <path d="M8 22.5h8" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    placeholder="Décrivez votre trajet... ex : Paris → Lyon, 45 personnes, 15 juillet"
                  />
                  <button className="nt-send-btn" onClick={sendChat} aria-label="Envoyer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E1C2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {!chatActive && (
              <div className="nt-search-card">
                <input
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{ display: "none", position: "absolute", left: "-9999px" }}
                  value={honeypot}
                  onChange={e => setHoneypot(e.target.value)}
                  autoComplete="off"
                  name="website"
                />
                <div className="nt-search-input">
                  <input
                    value={heroQuery}
                    onChange={e => setHeroQuery(e.target.value)}
                    placeholder="Décrivez votre trajet... ex : Paris → Lyon, 45 personnes, 15 juillet"
                  />
                  <button className="nt-search-attach" aria-label="Joindre un fichier">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05 12.95 19.5a5.5 5.5 0 0 1-7.78 0 5.5 5.5 0 0 1 0-7.78l7.07-7.07a3.5 3.5 0 1 1 4.95 4.95L11.5 18.5" />
                      <path d="M18 6.5 19.5 5" />
                    </svg>
                  </button>
                  <button className="nt-search-voice" aria-label="Activer la voix">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1.5a3.5 3.5 0 0 1 3.5 3.5v5a3.5 3.5 0 0 1-7 0v-5A3.5 3.5 0 0 1 12 1.5Z" />
                      <path d="M8.5 12a3.5 3.5 0 0 0 7 0" />
                      <path d="M12 19.5v3" />
                      <path d="M8 22.5h8" />
                    </svg>
                  </button>
                  <button className="nt-search-go" onClick={openChat} aria-label="Lancer l'agent IA">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0E1C2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </button>
                </div>
                <div className="nt-search-tags">
                  {['Paris → Lyon, 45 pers.', 'Devis pour un séminaire', 'Navette aéroport', 'Voyage scolaire'].map(tag => (
                    <button key={tag} type="button" onClick={() => setHeroQuery(tag)}>{tag}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

        {/* Trust strip */}
        <div className="nt-trust">
          <div className="nt-trust-inner">
            {[
              { svg: <IcoShield />, title: "Sécurité", desc: "Autocaristes certifiés & assurés" },
              { svg: <IcoUsers />, title: "Confort", desc: "Véhicules récents tout équipés" },
              { svg: <IcoClock />, title: "Ponctualité", desc: "Suivi en temps réel de votre trajet" },
            ].map(({ svg, title, desc }) => (
              <div key={title} className="nt-trust-item">
                <div className="nt-trust-icon">{svg}</div>
                <div>
                  <div className="nt-trust-title">{title}</div>
                  <div className="nt-trust-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* SERVICES */}
      <section id="services" className="nt-section nt-section-light">
        <div className="nt-section-inner">
          <div className="nt-section-head center">
            <div className="nt-label">NOS SERVICES</div>
            <h2 className="nt-h2">Un transport adapté à chaque occasion</h2>
            <p className="nt-section-desc">Mariages, séminaires, sorties scolaires, transferts aéroport ou événements sportifs — nous mobilisons le véhicule et le chauffeur qu'il vous faut.</p>
          </div>
          <div className="nt-4grid">
            {[
              { icon: <IcoBus />, title: "Autocar grand tourisme", desc: "Jusqu'à 63 places, idéal pour les longs trajets, voyages scolaires et excursions de groupe." },
              { icon: <IcoMinibus />, title: "Minibus & van", desc: "De 8 à 22 places avec chauffeur, parfait pour les petits groupes et transferts professionnels." },
              { icon: <IcoEvent />, title: "Événementiel & séminaires", desc: "Coordination de flottes pour congrès, mariages et déplacements d'entreprise sur mesure." },
              { icon: <IcoPlane />, title: "Navette aéroport", desc: "Transferts ponctuels vers et depuis les aéroports et gares, avec suivi des horaires de vol." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="nt-service-card">
                <div className="nt-service-icon">{icon}</div>
                <h3 className="nt-service-title">{title}</h3>
                <p className="nt-service-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="nt-section nt-section-white">
        <div className="nt-section-inner">
          <div className="nt-section-head center">
            <div className="nt-label">COMMENT ÇA MARCHE</div>
            <h2 className="nt-h2">Votre devis en 3 étapes</h2>
            <p className="nt-section-desc">Un assistant IA qualifie votre demande, un moteur déterministe calcule le tarif, un conseiller valide avant l'envoi.</p>
          </div>
          <div className="nt-3grid">
            <div className="nt-step-card">
              <div className="nt-step-num">ÉTAPE 01</div>
              <h3 className="nt-step-title">Décrivez votre trajet</h3>
              <p className="nt-step-desc">Départ, destination, dates et nombre de passagers. Quelques secondes suffisent.</p>
            </div>
            <div className="nt-step-card">
              <div className="nt-step-num">ÉTAPE 02</div>
              <h3 className="nt-step-title">L'agent IA estime</h3>
              <p className="nt-step-desc">L'assistant pose les bonnes questions et calcule un tarif indicatif, traçable et sans surprise.</p>
            </div>
            <div className="nt-step-card">
              <div className="nt-step-num">ÉTAPE 03</div>
              <h3 className="nt-step-title">Recevez votre devis</h3>
              <p className="nt-step-desc">Un conseiller confirme la distance et vous envoie le devis définitif sous 24 h.</p>
              <button className="nt-step-cta" onClick={openChat}>Démarrer avec l'agent IA</button>
            </div>
          </div>
        </div>
      </section>

      {/* FLOTTE */}
      <section id="flotte" className="nt-section nt-section-dark">
        <div className="nt-fleet-glow" />
        <div className="nt-section-inner">
          <div className="nt-fleet-grid">
            <div>
              <div className="nt-label lime">NOTRE FLOTTE</div>
              <h2 className="nt-h2 white">Des véhicules récents, entretenus et équipés</h2>
              <p className="nt-fleet-desc">Autocars, minibus, vans et navettes : un parc partenaire varié pour répondre à tous vos besoins de mobilité de groupe, partout en Europe.</p>
              <ul className="nt-fleet-list">
                {["Autocars grand tourisme 50 à 63 places", "Minibus & vans 8 à 22 places", "Bus privé & VIP haut de gamme", "Wi-Fi, climatisation, prises USB & soute"].map(item => (
                  <li key={item}>
                    <span className="nt-fleet-dot" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="nt-btn-lime" onClick={scrollToForm}>
                Demander un devis
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <div className="nt-fleet-img">
              <img src="/assets/fleet.png" alt="Flotte Neotravel" />
            </div>
          </div>
        </div>
      </section>

      {/* AVIS */}
      <section id="avis" className="nt-section nt-section-light">
        <div className="nt-section-inner">
          <div className="nt-section-head center">
            <div className="nt-label">AVIS CLIENTS</div>
            <h2 className="nt-h2">Ils nous font confiance</h2>
          </div>
          <div className="nt-3grid">
            {[
              { initials: "CR", name: "Camille Roux", role: "Responsable événementiel", text: "« Devis reçu en quelques minutes et chauffeur impeccable pour notre séminaire de 48 personnes. On recommande sans hésiter. »" },
              { initials: "TM", name: "Thomas Mercier", role: "Office manager", text: "« Transfert aéroport pour notre équipe : ponctuel, confortable et un suivi en temps réel très rassurant. »" },
              { initials: "SL", name: "Sophie Laurent", role: "Directrice d'école", text: "« Sortie scolaire de 2 cars : organisation simple, tarif clair dès le départ et chauffeurs très professionnels. »" },
            ].map(({ initials, name, role, text }) => (
              <div key={name} className="nt-review-card">
                <Stars />
                <p className="nt-review-text">{text}</p>
                <div className="nt-reviewer">
                  <div className="nt-reviewer-avatar">{initials}</div>
                  <div>
                    <div className="nt-reviewer-name">{name}</div>
                    <div className="nt-reviewer-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="nt-cta-band">
        <div className="nt-cta-band-inner">
          <div>
            <h2 className="nt-cta-band-title">Prêt à réserver votre prochain trajet ?</h2>
            <p className="nt-cta-band-desc">Obtenez un devis indicatif en quelques minutes, sans engagement.</p>
          </div>
          <div className="nt-cta-band-actions">
            <button className="nt-btn-dark-outline" onClick={openChat}>Parler à l'agent IA</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="nt-footer">
        <div className="nt-footer-inner">
          <div>
            <img src="/assets/Neotravel-logo.svg" alt="Neotravel" className="nt-footer-logo" />
            <p className="nt-footer-desc">Location d'autocar, minibus et bus privé avec chauffeur. Votre trajet, notre priorité.</p>
            <div className="nt-footer-phone">09 80 40 04 84</div>
          </div>
          <div>
            <div className="nt-footer-col-title">Société</div>
            <div className="nt-footer-links">
              {["Qui sommes-nous", "Services & garanties", "Notre flotte", "Avis clients", "Blog"].map(l => (
                <a key={l} href="#">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="nt-footer-col-title">Contact</div>
            <div className="nt-footer-links">
              <a href="tel:0980400484">09 80 40 04 84</a>
              <a href="mailto:contact@neotravel.fr">contact@neotravel.fr</a>
              <span>Du lundi au samedi, 8h–20h</span>
            </div>
            <button className="nt-btn-lime-sm" onClick={scrollToForm}>Devis gratuit</button>
          </div>
        </div>
        <div className="nt-footer-bottom">
          <span>© 2026 Neotravel — Tous droits réservés</span>
          <div className="nt-footer-legal">
            {["Mentions légales", "CGV", "Confidentialité"].map(l => <a key={l} href="#">{l}</a>)}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── STARS ───────────────────────────────────────────────────────────────── */

function Stars() {
  return (
    <div className="nt-stars">
      {[0,1,2,3,4].map(i => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#C2E812">
          <path d="m12 2 3 6.9 7.5.6-5.7 4.9 1.8 7.3L12 17.8 5.4 21.7l1.8-7.3L1.5 9.5 9 8.9z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── INLINE SVG ICONS ────────────────────────────────────────────────────── */

const S = ({ children }: { children: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C2E812" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const IcoShield = () => <S><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></S>;
const IcoUsers = () => <S><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></S>;
const IcoClock = () => <S><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></S>;
const IcoBus = () => <S><path d="M8 6v6M16 6v6M2 12h20" /><rect x="3" y="4" width="18" height="12" rx="2" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></S>;
const IcoMinibus = () => <S><path d="M3 9h18v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9zM3 9l2-5h14l2 5" /><path d="M7 13h.01M15 13h2" /></S>;
const IcoEvent = () => <S><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></S>;
const IcoPlane = () => <S><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></S>;

/* ─── OPERATOR ICONS ──────────────────────────────────────────────────────── */

function OpIcon({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const IcoGrid = () => <OpIcon><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></OpIcon>;
const IcoDocList = () => <OpIcon><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M9 12h6M9 16h6M9 8h3" /></OpIcon>;
const IcoHome = () => <OpIcon><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" /></OpIcon>;
const IcoBell = () => <OpIcon size={20}><path d="M6 9a6 6 0 1 1 12 0c0 3 1 5 1.5 6H4.5C5 14 6 12 6 9Z" /><path d="M10 19a2 2 0 0 0 4 0" /></OpIcon>;
const IcoPlus = () => <OpIcon size={16}><path d="M12 5v14M5 12h14" /></OpIcon>;
const IcoLogout = () => <OpIcon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></OpIcon>;
const IcoRefresh = () => <OpIcon size={16}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 4v4h-4" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 20v-4h4" /></OpIcon>;
const IcoFile = () => <OpIcon size={16}><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M9 13h6M9 17h4" /></OpIcon>;
const IcoExport = () => <OpIcon size={16}><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></OpIcon>;
const IcoChatBubble = () => <OpIcon><path d="M21 11.5a8.5 8.5 0 1 1-4.07 7.13L3 20l1.4-3.93A8.5 8.5 0 0 1 21 11.5Z" /></OpIcon>;
const IcoSend2 = () => <OpIcon><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></OpIcon>;
const IcoCheckCircle2 = () => <OpIcon><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5.5" /></OpIcon>;
const IcoCoins = () => <OpIcon><circle cx="9" cy="9" r="5.5" /><path d="M14.5 9c2.5 0 4.5 2 4.5 4.5S17 18 14.5 18 10 16 10 13.5" /></OpIcon>;

/* ─── OPERATOR ────────────────────────────────────────────────────────────── */

function Sidebar({ screen, setScreen, demandesCount }: { screen: Screen; setScreen: (s: Screen) => void; demandesCount: number }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/assets/Neotravel-logo.svg" alt="Neotravel" />
      </div>
      <p className="side-title">Espace commercial</p>
      <nav className="sidebar-nav">
        <button className={screen === "dashboard" ? "active" : ""} onClick={() => setScreen("dashboard")}>
          <IcoGrid />
          <span className="nav-label">Tableau de bord</span>
        </button>
        <button className={screen === "demandes" ? "active" : ""} onClick={() => setScreen("demandes")}>
          <IcoDocList />
          <span className="nav-label">Demandes</span>
          <span className="nav-badge">{demandesCount}</span>
        </button>
      </nav>
      <div className="sidebar-divider" />
      <button type="button" className="sidebar-secondary" onClick={() => setScreen("landing")}>
        <IcoHome />
        <span className="nav-label">Voir le site client</span>
      </button>
      <div className="sidebar-user">
        <div>AG</div>
        <section>
          <strong>Agent Commercial</strong>
          <span>agent@neotravel.fr</span>
        </section>
        <button type="button" className="sidebar-logout" aria-label="Se déconnecter">
          <IcoLogout />
        </button>
      </div>
    </aside>
  );
}

function Topbar({ screen, notifications, now }: { screen: Screen; notifications: number; now: Date }) {
  const titles: Record<Screen, string> = {
    dashboard: "Tableau de bord",
    demandes: "Demandes",
    landing: "",
  };
  const subs: Partial<Record<Screen, string>> = {
    dashboard: "Vue d'ensemble de l'activité commerciale",
    demandes: "Toutes les demandes de devis reçues via le chatbot",
  };
  const today = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <header className="topbar topbar-operator">
      <div>
        {titles[screen] && <h1>{titles[screen]}</h1>}
        <p>{subs[screen]}</p>
      </div>
      <div className="topbar-actions topbar-operator-actions">
        <button type="button" className="icon-btn topbar-bell" aria-label="Notifications">
          <IcoBell />
          {notifications > 0 && <span className="topbar-bell-dot" />}
        </button>
        <span className="topbar-date">{today}</span>
        <button type="button" className="topbar-new-btn"><IcoPlus />Nouvelle demande</button>
      </div>
    </header>
  );
}

function Dashboard({ setScreen, demandes, now }: { setScreen: (s: Screen) => void; demandes: Demande[]; now: Date }) {
  const devisEnvoyesCount = demandes.filter(d => d.statut === "Devis envoyé").length;
  const convRate = demandes.length ? Math.round((devisEnvoyesCount / demandes.length) * 100) : 0;
  const priced = demandes.filter(d => d.tarifMax > 0);
  const tarifMoyen = priced.length
    ? Math.round(priced.reduce((sum, d) => sum + (d.tarifMin + d.tarifMax) / 2, 0) / priced.length)
    : 0;
  const tarifMin = priced.length ? Math.min(...priced.map(d => d.tarifMin)) : 0;
  const tarifMax = priced.length ? Math.max(...priced.map(d => d.tarifMax)) : 0;

  const stats = [
    { label: "Demandes reçues", value: String(demandes.length), caption: "+2 vs sem. passée", icon: <IcoChatBubble />, tone: "blue" },
    { label: "Devis envoyés", value: String(devisEnvoyesCount), caption: "+1 ce mois", icon: <IcoSend2 />, tone: "indigo" },
    { label: "Taux de conversion", value: `${convRate} %`, caption: "Stable", icon: <IcoCheckCircle2 />, tone: "green" },
    { label: "Tarif moyen / demande", value: `${tarifMoyen.toLocaleString("fr-FR")} €`, caption: "+14 % vs mois dernier", icon: <IcoCoins />, tone: "orange" },
  ];

  const activities = [...demandes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4);

  const pipelineColors: Record<DemandeStatus, string> = {
    "Nouveau": "#dbeafe",
    "En cours": "#bfdbfe",
    "Devis envoyé": "#ddf4ff",
    "En attente": "#fef3c7",
  };
  const pipeline = (["Nouveau", "En cours", "Devis envoyé", "En attente"] as DemandeStatus[]).map(label => ({
    label,
    value: demandes.filter(d => d.statut === label).length,
    color: pipelineColors[label],
  }));

  const followups = demandes.filter(d => d.statut === "Nouveau" || d.statut === "En attente").slice(0, 2);

  return (
    <section className="operator-content dashboard-page">
      <div className="dashboard-summary-cards">
        {stats.map(stat => (
          <div key={stat.label} className="dashboard-summary-card">
            <div className={`dashboard-summary-icon ${stat.tone}`}>{stat.icon}</div>
            <div>
              <span className="dashboard-summary-label">{stat.label}</span>
              <strong>{stat.value}</strong>
              <p>{stat.caption}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-head">
            <div>
              <h2>Activité récente</h2>
              <p>Demandes clients récentes à traiter</p>
            </div>
            <button className="table-btn" onClick={() => setScreen("demandes")}>Voir toutes</button>
          </div>
          <div className="activity-list">
            {activities.map(item => (
              <button key={item.id} type="button" className="activity-item">
                <div className="activity-avatar">{initials(item.prospect)}</div>
                <div className="activity-info">
                  <div className="activity-top">
                    <strong>{item.prospect}</strong>
                    <span>{formatDayLabel(item.createdAt, now)}</span>
                  </div>
                  <p>{item.id}</p>
                  <p className="activity-route">{item.depart} → {item.destination}</p>
                  <p className="activity-preview">{item.messages[0]?.text ?? "Aucun message pour le moment."}</p>
                </div>
                <span className={`badge ${statusBadgeClass(item.statut)}`}>{item.statut}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="dashboard-right-panel">
          <section className="panel pipeline-panel">
            <div className="panel-head">
              <div>
                <h2>Pipeline</h2>
                <p>Vue d'ensemble des statuts</p>
              </div>
            </div>
            <div className="pipeline-list">
              {pipeline.map(item => (
                <div key={item.label} className="pipeline-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <div className="pipeline-bar" style={{ background: item.color, width: `${item.value * 16 || 4}px` }} />
                </div>
              ))}
            </div>
          </section>

          <section className="panel tariff-card">
            <div className="tariff-card-content">
              <span>TARIF MOYEN</span>
              <strong>{tarifMoyen.toLocaleString("fr-FR")} €</strong>
              <p>par demande · ce mois</p>
              <div className="tariff-meta">
                <span>Min {tarifMin.toLocaleString("fr-FR")} €</span>
                <span>Max {tarifMax.toLocaleString("fr-FR")} €</span>
                <span>Conv. {convRate} %</span>
              </div>
            </div>
          </section>

          <section className="panel followups-panel">
            <div className="panel-head">
              <div>
                <h2>Relances à faire</h2>
                <p>Clients à recontacter</p>
              </div>
            </div>
            <div className="followups-list">
              {followups.map(item => (
                <button key={item.id} type="button" className="followup-item">
                  <div>
                    <strong>{item.prospect}</strong>
                    <span>{item.depart} → {item.destination} · {formatDayLabel(item.createdAt, now)}</span>
                  </div>
                  <button className="table-btn lime">Relancer</button>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

type TabKey = "all" | DemandeStatus;

function Demandes({ demandes, now }: { demandes: Demande[]; now: Date }) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "Toutes", count: demandes.length },
    { key: "Nouveau", label: "Nouvelles", count: demandes.filter(d => d.statut === "Nouveau").length },
    { key: "En cours", label: "En cours", count: demandes.filter(d => d.statut === "En cours").length },
    { key: "Devis envoyé", label: "Devis envoyé", count: demandes.filter(d => d.statut === "Devis envoyé").length },
    { key: "En attente", label: "En attente", count: demandes.filter(d => d.statut === "En attente").length },
  ];

  const filtered = demandes.filter(item => {
    const matchesTab = activeTab === "all" || item.statut === activeTab;
    const q = search.toLowerCase();
    const matchesSearch = !q || item.prospect.toLowerCase().includes(q) || `${item.depart} ${item.destination}`.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const selected = filtered.find(item => item.id === selectedId) ?? filtered[0] ?? demandes[0];

  if (!selected) {
    return (
      <section className="operator-content demandes-page">
        <p>Aucune demande pour le moment.</p>
      </section>
    );
  }

  return (
    <section className="operator-content demandes-page">
      <div className="demandes-grid">
        <aside className="demandes-sidebar">
          <div className="demandes-header">
            <div>
              <h2>Demandes</h2>
              <p>Toutes les demandes de devis reçues via le chatbot</p>
            </div>
            <span className="badge lime">{demandes.length}</span>
          </div>

          <div className="tabs demandes-tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                className={activeTab === t.key ? "active" : ""}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label} <span>{t.count}</span>
              </button>
            ))}
          </div>

          <div className="demandes-search">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
            />
          </div>

          <div className="demandes-list">
            {filtered.map(item => (
              <button
                key={item.id}
                type="button"
                className={`demande-item ${item.id === selected.id ? "active" : ""}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="demande-avatar">{initials(item.prospect)}</div>
                <div>
                  <div className="demande-meta">
                    <strong>{item.prospect}</strong>
                    <span>{formatDayLabel(item.createdAt, now)}</span>
                  </div>
                  <p className="demande-subtitle">{item.depart} → {item.destination}</p>
                  <p className="demande-preview">{item.messages[0]?.text ?? "Aucun message pour le moment."}</p>
                </div>
                <span className={`badge ${statusBadgeClass(item.statut)}`}>{item.statut}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="demandes-detail">
          <section className="detail-panel">
            <div className="detail-top-row">
              <div>
                <span className="detail-ref">{selected.id}</span>
                <span className={`badge ${statusBadgeClass(selected.statut)}`}>{selected.statut}</span>
              </div>
              <div className="detail-actions">
                <button className="table-btn dark"><IcoRefresh />Relancer</button>
                <button className="table-btn lime"><IcoFile />Générer le devis</button>
                <button className="table-btn"><IcoExport />Exporter</button>
              </div>
            </div>
            <h2>{selected.prospect}</h2>
            <p className="detail-route">{selected.depart} → {selected.destination}</p>

            <div className="detail-grid">
              <section className="panel client-info-panel">
                <h3>Informations client</h3>
                <div className="client-info-row"><span>Email</span><strong>{selected.email || "—"}</strong></div>
                <div className="client-info-row"><span>Tél.</span><strong>{selected.tel || "—"}</strong></div>
                <div className="client-info-row"><span>Passagers</span><strong>{selected.passagers ? `${selected.passagers} personnes` : "—"}</strong></div>
                <div className="client-info-row"><span>Date</span><strong>{selected.tripDate}</strong></div>
                <div className="client-info-row"><span>Véhicule</span><strong>{selected.vehicule}</strong></div>
              </section>

              <section className="panel tariff-panel">
                <span className="detail-label">Tarif indicatif</span>
                {selected.tarifMax > 0 ? (
                  <>
                    <strong>{selected.tarifMin.toLocaleString("fr-FR")} €</strong>
                    <p>à {selected.tarifMax.toLocaleString("fr-FR")} € TTC</p>
                  </>
                ) : (
                  <strong>À calculer</strong>
                )}
                <small>Tarif indicatif — distance à confirmer avant envoi.</small>
              </section>
            </div>
          </section>

          <section className="panel conversation-panel">
            <div className="panel-head">
              <div>
                <h2>Conversation agent IA</h2>
                <p>{selected.messages.length} messages · {formatDayLabel(selected.createdAt, now)}</p>
              </div>
            </div>
            <div className="agent-conversation demandes-conversation">
              {selected.messages.map((m, i) => (
                <div key={i} className={`message-row ${m.role}`}>
                  {m.role === "agent" && <div className="agent-avatar">Nt</div>}
                  <div className={`message-bubble ${m.role}`}>
                    <p>{m.text}</p>
                    <small className="message-meta">{formatTime(m.sentAt)}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="note-input">
              <textarea placeholder="Ajouter une note..." rows={3} />
            </div>
          </section>
        </main>
      </div>
    </section>
  );
}
