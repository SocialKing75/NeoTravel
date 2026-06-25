"use client";

import { useState, useRef } from "react";

type Screen = "landing" | "devis" | "dashboard" | "demandes" | "agent";

type Message = { role: "agent" | "user"; text: string };

type FormData = {
  depart: string;
  destination: string;
  passagers: string;
  allerRetour: boolean;
  dateAller: string;
  dateRetour: string;
  heure: string;
  vehicule: string;
  bagages: boolean;
  assurance: boolean;
  pmr: boolean;
  nom: string;
  email: string;
  tel: string;
};

const INITIAL_FORM: FormData = {
  depart: "", destination: "", passagers: "",
  allerRetour: true, dateAller: "", dateRetour: "", heure: "",
  vehicule: "", bagages: false, assurance: false, pmr: false,
  nom: "", email: "", tel: "",
};

const demandes = [
  { prospect: "Jean Dupont", email: "jean.dupont@email.fr", trajet: "Paris → Lyon", date: "24 juin", passagers: 15, statut: "Devis envoyé", badge: "lime" },
  { prospect: "Mairie de Rennes", email: "transport@rennes.fr", trajet: "Rennes → Nantes", date: "24 juin", passagers: 40, statut: "En relance", badge: "warning" },
  { prospect: "Asso. Rando Alsace", email: "contact@rando67.fr", trajet: "Strasbourg → Colmar", date: "23 juin", passagers: 22, statut: "Qualifié", badge: "blue" },
  { prospect: "TechCorp SA", email: "rh@techcorp.fr", trajet: "Lyon → Paris CDG", date: "23 juin", passagers: 53, statut: "Nouveau", badge: "blue" },
  { prospect: "Collège Jean Moulin", email: "sortie@cjm.fr", trajet: "Bordeaux → Dordogne", date: "22 juin", passagers: 38, statut: "Accepté", badge: "lime" },
  { prospect: "Club Football Caen", email: "bus@fbcaen.fr", trajet: "Caen → Paris", date: "21 juin", passagers: 28, statut: "Refusé", badge: "danger" },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");

  if (screen === "landing") return <Landing setScreen={setScreen} />;
  if (screen === "devis") return <Devis setScreen={setScreen} />;

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

/* ─── LANDING ─────────────────────────────────────────────────────────────── */

function Landing({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [step, setStep] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const [agentStage, setAgentStage] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const formRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const scrollToForm = () => {
    if (formRef.current) {
      const y = formRef.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const nextStep = () => {
    if (step >= 3) { openChat(); return; }
    setStep(s => s + 1);
  };

  const priceMsg = () => {
    const pax = parseInt(form.passagers, 10) || 30;
    const low = 1200 + pax * 14;
    const high = Math.round(low * 1.32);
    const fmt = (n: number) => n.toLocaleString("fr-FR");
    return `D'après les éléments fournis, le tarif indicatif se situe entre ${fmt(low)} € et ${fmt(high)} € TTC, chauffeur et carburant inclus. Tarif indicatif — la distance exacte sera confirmée avant l'envoi du devis définitif.`;
  };

  const pushAgent = (text: string) => {
    setAgentTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMessages(m => [...m, { role: "agent", text }]);
      setAgentTyping(false);
    }, 1000);
  };

  const openChat = () => {
    setChatOpen(true);
    setMessages([]);
    setAgentStage(0);
    setAgentTyping(true);
    if (timer.current) clearTimeout(timer.current);
    const trip = `${form.depart || "—"} → ${form.destination || "—"}`;
    const pax = form.passagers ? `${form.passagers} passagers` : "votre groupe";
    timer.current = setTimeout(() => {
      setMessages([{ role: "agent", text: `Bonjour, je suis l'agent Neotravel. J'ai bien noté votre trajet ${trip} pour ${pax}. Pour affiner le devis, souhaitez-vous un aller simple ou un aller-retour ?` }]);
      setAgentTyping(false);
    }, 850);
  };

  const respond = (userText: string) => {
    const t = userText.toLowerCase();
    let reply: string;
    if (/(prix|tarif|co[uû]t|combien|budget|devis)/.test(t)) {
      reply = priceMsg();
    } else if (/(conseiller|humain|appel|rappel|t[ée]l[ée]phone|parler)/.test(t)) {
      reply = `Bien sûr. Un chargé d'affaires Neotravel peut vous rappeler${form.tel ? ` au ${form.tel}` : ""} sous 24 h ouvrées.`;
    } else if (agentStage === 0) {
      reply = `Parfait. Pour ${form.depart || "votre départ"} → ${form.destination || "votre destination"}, j'estime la distance et le temps de conduite. Avez-vous une date précise, ou êtes-vous flexible ?`;
    } else if (agentStage === 1) {
      reply = priceMsg();
    } else if (agentStage === 2) {
      reply = `Très bien. Je peux vous envoyer ce devis par email${form.email ? ` à ${form.email}` : ""} et programmer un rappel. Souhaitez-vous que je le fasse ?`;
    } else {
      reply = "C'est noté, votre demande est transmise à notre équipe. Avez-vous une exigence particulière à ajouter ?";
    }
    setAgentStage(s => s + 1);
    pushAgent(reply);
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setMessages(m => [...m, { role: "user", text }]);
    setChatInput("");
    respond(text);
  };

  const onQuick = (text: string) => {
    setMessages(m => [...m, { role: "user", text }]);
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
            <button className="nt-cta-header" onClick={scrollToForm}>Devis gratuit</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="nt-hero">
        <div className="nt-hero-photo" />
        <div className="nt-hero-overlay-1" />
        <div className="nt-hero-overlay-2" />
        <div className="nt-hero-glow" />
        <div className="nt-hero-inner">

          {/* Text */}
          <div className="nt-hero-text">
            <h1 className="nt-h1">
              Location d'autocar,<br />minibus<br />et bus privé
            </h1>
            <p className="nt-hero-desc">
              Neotravel vous accompagne dans vos déplacements de groupe grâce à un réseau de partenaires autocaristes qualifiés et un assistant IA capable de générer un devis en quelques minutes.
            </p>
            <div className="nt-hero-ctas">
              <button className="nt-btn-lime" onClick={scrollToForm}>
                Demander un devis
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <button className="nt-btn-outline" onClick={() => setScreen("dashboard")}>
                Espace opérateur
              </button>
            </div>
          </div>

          {/* Form card */}
          <div className="nt-form-wrap" ref={formRef}>
            <div className="nt-form-card">
              <h3 className="nt-form-title">Votre devis en quelques minutes :</h3>
              <div className="nt-segs">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`nt-seg${step > i ? " on" : ""}`} />
                ))}
              </div>

              <div className="nt-form-body">
                {step === 0 && (
                  <div className="nt-fields">
                    <p className="nt-field-group">Votre déplacement</p>
                    <NtField label="Ville de départ">
                      <input placeholder="Ex : Paris, Bruxelles, Genève…" value={form.depart} onChange={e => set("depart", e.target.value)} />
                    </NtField>
                    <NtField label="Destination">
                      <input placeholder="Ex : Lyon, Nice, Marseille…" value={form.destination} onChange={e => set("destination", e.target.value)} />
                    </NtField>
                    <NtField label="Nombre de passagers">
                      <input type="number" placeholder="Ex : 45 personnes" value={form.passagers} onChange={e => set("passagers", e.target.value)} />
                    </NtField>
                  </div>
                )}
                {step === 1 && (
                  <div className="nt-fields">
                    <p className="nt-field-group">Dates &amp; horaires</p>
                    <label className="nt-switch-row">
                      <span>Aller-retour</span>
                      <button
                        type="button"
                        className={`nt-toggle${form.allerRetour ? " on" : ""}`}
                        onClick={() => set("allerRetour", !form.allerRetour)}
                      >
                        <span />
                      </button>
                    </label>
                    <NtField label="Date de départ">
                      <input type="date" value={form.dateAller} onChange={e => set("dateAller", e.target.value)} />
                    </NtField>
                    {form.allerRetour && (
                      <NtField label="Date de retour">
                        <input type="date" value={form.dateRetour} onChange={e => set("dateRetour", e.target.value)} />
                      </NtField>
                    )}
                    <NtField label="Heure de prise en charge">
                      <input type="time" value={form.heure} onChange={e => set("heure", e.target.value)} />
                    </NtField>
                  </div>
                )}
                {step === 2 && (
                  <div className="nt-fields">
                    <p className="nt-field-group">Véhicule &amp; options</p>
                    <NtField label="Type de véhicule">
                      <select value={form.vehicule} onChange={e => set("vehicule", e.target.value)}>
                        <option value="">Choisir un véhicule…</option>
                        <option>Autocar grand tourisme (50-63 pl.)</option>
                        <option>Minibus (8-22 pl.)</option>
                        <option>Bus privé / VIP</option>
                        <option>Van avec chauffeur (jusqu&apos;à 8 pl.)</option>
                      </select>
                    </NtField>
                    <div className="nt-checks">
                      {([
                        ["bagages", "Bagages volumineux (soute)"],
                        ["assurance", "Assurance annulation"],
                        ["pmr", "Accès PMR / véhicule adapté"],
                      ] as const).map(([k, label]) => (
                        <label key={k} className="nt-check-row">
                          <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="nt-fields">
                    <p className="nt-field-group">Vos coordonnées</p>
                    <NtField label="Nom complet">
                      <input placeholder="Ex : Camille Roux" value={form.nom} onChange={e => set("nom", e.target.value)} />
                    </NtField>
                    <NtField label="Email">
                      <input type="email" placeholder="vous@entreprise.fr" value={form.email} onChange={e => set("email", e.target.value)} />
                    </NtField>
                    <NtField label="Téléphone">
                      <input type="tel" placeholder="06 12 34 56 78" value={form.tel} onChange={e => set("tel", e.target.value)} />
                    </NtField>
                  </div>
                )}
              </div>

              <div className="nt-form-nav">
                {step > 0 && (
                  <button type="button" className="nt-back-btn" onClick={() => setStep(s => Math.max(0, s - 1))}>
                    Retour
                  </button>
                )}
                <button type="button" className="nt-next-btn" onClick={nextStep}>
                  {step < 3 ? "Continuer" : "Continuer avec l'agent IA"}
                </button>
              </div>
            </div>
          </div>
        </div>

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
      </section>

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
            <button className="nt-btn-dark" onClick={scrollToForm}>Demander un devis</button>
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

      {/* CHAT DRAWER */}
      {chatOpen && (
        <>
          <div className="nt-overlay" onClick={() => setChatOpen(false)} />
          <div className="nt-drawer">
            <div className="nt-drawer-header">
              <div className="nt-drawer-avatar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0E1C2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 18V6l8 12V6" />
                </svg>
              </div>
              <div className="nt-drawer-info">
                <div className="nt-drawer-name">Agent Neotravel</div>
                <div className="nt-drawer-status">
                  <span className="nt-status-dot" />
                  En ligne · répond en quelques secondes
                </div>
              </div>
              <button className="nt-drawer-close" onClick={() => setChatOpen(false)} aria-label="Fermer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="nt-drawer-recap">
              <span className="nt-recap-label">DEMANDE</span>
              <span className="nt-recap-trip">{form.depart || "Départ"} → {form.destination || "Destination"}</span>
              {form.passagers && <span className="nt-recap-pax">{form.passagers} pers.</span>}
            </div>

            <div className="nt-drawer-messages">
              {messages.map((m, i) => (
                <div key={i} className={`nt-msg-row ${m.role}`}>
                  <div className={`nt-bubble ${m.role}`}>{m.text}</div>
                </div>
              ))}
              {agentTyping && (
                <div className="nt-msg-row agent">
                  <div className="nt-bubble agent">
                    <div className="nt-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="nt-drawer-quicks">
              {["Aller-retour", "Quel est le tarif ?", "Je suis flexible sur les dates", "Parler à un conseiller"].map(q => (
                <button key={q} className="nt-quick" onClick={() => onQuick(q)}>{q}</button>
              ))}
            </div>

            <div className="nt-drawer-input">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                rows={1}
                placeholder="Écrivez votre message…"
              />
              <button className="nt-send-btn" onClick={sendChat} aria-label="Envoyer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E1C2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── FORM FIELD WRAPPER ──────────────────────────────────────────────────── */

function NtField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="nt-field">
      <span>{label}</span>
      {children}
    </label>
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

/* ─── DEVIS ───────────────────────────────────────────────────────────────── */

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
          <span>Paris → Lyon</span><span>15 passagers</span>
          <span>15 juillet 2026</span><span>Urgent</span><span>Péages inclus</span>
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
          <div><span>Montant TTC</span><small>TVA 10 % incluse</small></div>
          <strong>1 549 €</strong>
        </div>
        <footer className="devis-footer">
          <button>Télécharger le PDF</button>
          <button className="ghost" onClick={() => setScreen("landing")}>Modifier ma demande</button>
          <button className="ghost" onClick={() => setScreen("dashboard")}>Espace opérateur</button>
        </footer>
      </section>
    </main>
  );
}

/* ─── OPERATOR ────────────────────────────────────────────────────────────── */

function Sidebar({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/assets/Neotravel-logo.svg" alt="Neotravel" />
      </div>
      <p className="side-title">Principal</p>
      <button className={screen === "dashboard" ? "active" : ""} onClick={() => setScreen("dashboard")}>Tableau de bord</button>
      <button className={screen === "demandes" ? "active" : ""} onClick={() => setScreen("demandes")}>Demandes <span>12</span></button>
      <button onClick={() => setScreen("devis")}>Devis</button>
      <button className={screen === "agent" ? "active" : ""} onClick={() => setScreen("agent")}>Agent IA</button>
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
  const titles: Record<string, string> = { dashboard: "", demandes: "Demandes", agent: "Agent IA" };
  const subs: Record<string, string> = { dashboard: "Bonjour, Sophie — mardi 24 juin 2026", demandes: "Gestion & qualification", agent: "Orchestration & outil log" };
  return (
    <header className="topbar">
      <div>{titles[screen] && <h1>{titles[screen]}</h1>}<p>{subs[screen]}</p></div>
      <div className="topbar-actions">
        <div className="top-user">SM</div>
      </div>
    </header>
  );
}

function Dashboard({ setScreen }: { setScreen: (s: Screen) => void }) {
  return (
    <section className="operator-content">
      <div className="kpis">
        <Kpi title="Leads traités" value="42" sub="sur 58 entrants" note="+8 % vs hier" />
        <Kpi title="Délai devis" value="2 h 10" sub="demande → devis" note="−18 min vs sem. préc." />
        <Kpi title="Taux de conversion" value="34 %" sub="post-devis" note="+4 pts / 7 jours" />
        <Kpi title="Coût par réponse IA" value="0,08 €" sub="par interaction chatbot" note="−0,02 € vs sem. préc." />
        <Kpi title="Abandon chatbot" value="23 %" sub="des conversations" note="−5 pts amélioration" />
      </div>
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="pipeline-head">
          <div>
            <h2 style={{ margin: 0 }}>Pipeline commercial</h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>Semaine en cours</p>
          </div>
          <div className="pipeline-conv-total">Conversion globale <strong>12 %</strong></div>
        </div>
        <div className="pipeline-v2">
          {([
            { label: "Captation",  value: 58, pct: 100, color: "#334155" },
            { label: "Qualifiées", value: 34, pct: 59,  color: "#1e40af" },
            { label: "Devis",      value: 21, pct: 36,  color: "#0369a1" },
            { label: "Relance",    value: 9,  pct: 16,  color: "#d97706" },
            { label: "Signées",    value: 7,  pct: 12,  color: "#16a34a" },
          ] as { label: string; value: number; pct: number; color: string }[]).map((s, i, arr) => (
            <div key={s.label} className="pipe-v2">
              <div className="pipe-v2-bar-wrap">
                <div className="pipe-v2-bar" style={{ height: `${s.pct}%`, background: s.color }} />
              </div>
              <div className="pipe-v2-value" style={{ color: s.color }}>{s.value}</div>
              <div className="pipe-v2-label">{s.label}</div>
              {i < arr.length - 1 && (
                <div className="pipe-v2-conv">{Math.round((arr[i + 1].value / s.value) * 100)} %</div>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <div><h2>Demandes récentes</h2><p>Dernières 24 h</p></div>
          <button onClick={() => setScreen("demandes")}>Voir toutes →</button>
        </div>
        <DemandesTable small />
      </section>
    </section>
  );
}

type TabKey = "all" | "Nouveau" | "Qualifié" | "Devis envoyé" | "En relance";

function Demandes({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all",          label: "Toutes",       count: 58 },
    { key: "Nouveau",      label: "Nouvelles",    count: 12 },
    { key: "Qualifié",     label: "Qualifiées",   count: 18 },
    { key: "Devis envoyé", label: "Devis envoyés", count: 15 },
    { key: "En relance",   label: "En relance",   count: 9  },
  ];

  return (
    <section className="operator-content demandes-page">
      <div className="tabs">
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
      <section className="panel">
        <DemandesTable filter={activeTab === "all" ? undefined : activeTab} />
      </section>
      <button className="floating-action" onClick={() => setScreen("agent")}>Qualifier avec l'agent IA</button>
    </section>
  );
}

function AgentIA() {
  const agentConvo: Message[] = [
    { role: "agent", text: "Bonjour ! Je suis l'agent Neotravel. Décrivez votre besoin de transport : départ, destination, date et nombre de passagers." },
    { role: "user", text: "Paris → Lyon, 15 passagers, le 15 juillet 2026" },
    { role: "agent", text: "Parfait. Paris → Lyon pour 15 personnes le 15 juillet. Est-ce urgent ?" },
    { role: "user", text: "Oui, assez urgent." },
    { role: "agent", text: "Très bien. Souhaitez-vous ajouter des options : guide, nuit chauffeur ou péages inclus ?" },
    { role: "user", text: "Péages inclus." },
  ];
  return (
    <section className="operator-content">
      <div className="principle">
        <strong>L'IA décide — les outils exécutent.</strong>
        <span>L'agent orchestre la conversation et appelle des outils déterministes. Il ne fait jamais d'arithmétique lui-même.</span>
      </div>
      <div className="agent-layout">
        <section className="panel conversation-panel">
          <h2>Conversation prospect — DEV-2048</h2>
          <div className="agent-conversation">
            {agentConvo.map((m, i) => (
              <div key={i} className={`message-row ${m.role}`}>
                {m.role === "agent" && <div className="agent-avatar">Nt</div>}
                <div className={`message-bubble ${m.role}`}>{m.text}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel tools-panel">
          <h2>Appels d'outils</h2>
          <Tool name="calculer_devis()" lines={["trajet: Paris → Lyon", "km: 472", "passagers: 15", "statut: success"]} />
          <Tool name="generer_pdf()" lines={["ref: DEV-2048", "prospect: Jean Dupont"]} />
          <Tool name="envoyer_email()" lines={["to: jean.dupont@email.fr", "devis: DEV-2048"]} />
          <Tool name="crm_update()" lines={["id: D-2048", "statut: Devis envoyé"]} />
        </section>
      </div>
    </section>
  );
}

/* ─── SMALL COMPONENTS ────────────────────────────────────────────────────── */

function Kpi({ title, value, sub, note }: { title: string; value: string; sub?: string; note: string }) {
  const color = note.includes('+') ? '#16a34a' : note.startsWith('−') || note.startsWith('-') ? '#dc2626' : '#7c8999';
  return (
    <section className="kpi-card">
      <span className="kpi-title">{title}</span>
      <strong className="kpi-value">{value}</strong>
      {sub && <span className="kpi-sub">{sub}</span>}
      <p className="kpi-note" style={{ color }}>{note}</p>
    </section>
  );
}

function Pipe({ label, value, lime }: { label: string; value: string; lime?: boolean }) {
  return (
    <div className="pipe">
      <div className={lime ? "lime" : ""} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function DemandesTable({ small, filter }: { small?: boolean; filter?: string }) {
  const filtered = filter ? demandes.filter(d => d.statut === filter) : demandes;
  const list = small ? filtered.slice(0, 4) : filtered;
  return (
    <table className="demandes-table">
      <thead>
        <tr>
          <th>Prospect</th><th>Trajet</th><th>Date</th><th>Pass.</th><th>Statut</th>
          {!small && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {list.map(item => (
          <tr key={item.email}>
            <td><strong>{item.prospect}</strong><span>{item.email}</span></td>
            <td className="mono">{item.trajet}</td>
            <td>{item.date}</td>
            <td>{item.passagers}</td>
            <td><span className={`badge ${item.badge}`}>{item.statut}</span></td>
            {!small && <td><button className="table-btn">Ouvrir</button><button className="table-btn lime">Devis</button></td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CalcLine({ label, value, lime, bold, muted }: { label: string; value: string; lime?: boolean; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`calc-line ${bold ? "bold" : ""}`}>
      <span>{label}</span>
      <strong className={`${lime ? "lime" : ""} ${muted ? "muted" : ""}`}>{value}</strong>
    </div>
  );
}

function Tool({ name, lines }: { name: string; lines: string[] }) {
  return (
    <div className="tool-card">
      <div><strong>{name}</strong><span>✓ succès</span></div>
      {lines.map(l => <p key={l}>{l}</p>)}
    </div>
  );
}
