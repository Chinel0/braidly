"use client";
import { useState } from "react";

const allCities = [
  "Aachen","Augsburg","Bergisch Gladbach","Berlin","Bielefeld",
  "Bochum","Bonn","Bottrop","Braunschweig","Bremen","Bremerhaven",
  "Chemnitz","Cottbus","Darmstadt","Dortmund","Dresden","Duisburg",
  "Düsseldorf","Erfurt","Erlangen","Essen","Frankfurt","Freiburg",
  "Fürth","Gelsenkirchen","Göttingen","Hagen","Halle","Hamburg",
  "Hamm","Hannover","Heidelberg","Heilbronn","Herne","Ingolstadt",
  "Jena","Karlsruhe","Kassel","Kiel","Koblenz","Köln","Krefeld",
  "Leipzig","Leverkusen","Lübeck","Ludwigshafen","Magdeburg","Mainz",
  "Mannheim","Moers","Mönchengladbach","Mülheim","München","Münster",
  "Neuss","Nürnberg","Oberhausen","Offenbach","Oldenburg","Osnabrück",
  "Paderborn","Pforzheim","Potsdam","Recklinghausen","Regensburg",
  "Remscheid","Rostock","Saarbrücken","Salzgitter","Siegen","Solingen",
  "Stuttgart","Ulm","Wiesbaden","Wolfsburg","Wuppertal","Würzburg"
];

const braiders = [
  {
    name: "Aminata D.",
    city: "Munich",
    styles: "Knotless Braids, Box Braids, Locs",
    price: "From €60",
    available: "Sat & Sun available",
  },
  {
    name: "Fatima K.",
    city: "Berlin",
    styles: "Goddess Braids, Fulani, Twists",
    price: "From €50",
    available: "Weekdays available",
  },
  {
    name: "Nkechi A.",
    city: "Frankfurt",
    styles: "Senegalese Twists, Crochet, Faux Locs",
    price: "From €55",
    available: "Flexible schedule",
  },
];

export default function Home() {
  const [braiderSubmitted, setBraiderSubmitted] = useState(false);
  const [clientSubmitted, setClientSubmitted] = useState(false);
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = citySearch.length > 0
    ? allCities.filter((c) => c.toLowerCase().startsWith(citySearch.toLowerCase()))
    : [];

  return (
    <main style={{ fontFamily: "'Georgia', 'Times New Roman', serif", backgroundColor: "#F7F3EE", color: "#2C1A0E", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #F7F3EE; }
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body { font-family: 'Lato', sans-serif; }
        .btn-primary { background-color: #7A3B1E; color: #F7F3EE; padding: 14px 36px; border: none; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; transition: background 0.25s; }
        .btn-primary:hover { background-color: #5C2A12; }
        .btn-outline { background-color: transparent; color: #2C1A0E; padding: 14px 36px; border: 1.5px solid #2C1A0E; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; transition: all 0.25s; }
        .btn-outline:hover { background-color: #2C1A0E; color: #F7F3EE; }
        .card { background-color: #EDE7DF; border: 1px solid #D6CEC4; overflow: hidden; }
        .video-frame { width: 100%; aspect-ratio: 9/16; background-color: #C9BFB3; position: relative; overflow: hidden; }
        .input-field { width: 100%; background-color: transparent; border: none; border-bottom: 1.5px solid #9E8070; padding: 10px 4px; font-family: 'Lato', sans-serif; font-size: 14px; color: #2C1A0E; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-bottom-color: #7A3B1E; }
        .input-field::placeholder { color: #A89080; }
        .tag { display: inline-block; background-color: #D6CEC4; color: #5C3A22; font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 12px; }
        .divider { width: 60px; height: 2px; background-color: #7A3B1E; margin: 20px 0; }
        .section-label { font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #7A3B1E; margin-bottom: 16px; }
        .city-item:hover { background-color: #EDE7DF; }
        @media (max-width: 768px) {
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 38px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px", borderBottom: "1px solid #D6CEC4", backgroundColor: "#F7F3EE", position: "sticky", top: 0, zIndex: 100 }}>
        <span className="font-display" style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-0.5px", color: "#2C1A0E" }}>Braidly</span>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <a href="#braiders" style={{ fontFamily: "'Lato', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#2C1A0E", textDecoration: "none" }}>Browse Braiders</a>
          <a href="#join"><button className="btn-primary" style={{ padding: "10px 24px" }}>Join Free</button></a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "100px 48px 80px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <p className="section-label">Find your braider across Germany</p>
        <h1 className="font-display hero-title" style={{ fontSize: "58px", fontWeight: 700, lineHeight: 1.15, color: "#2C1A0E", marginBottom: "28px" }}>
          Your next favourite braider<br />
          <em style={{ fontWeight: 400, color: "#7A3B1E" }}>is closer than you think</em>
        </h1>
        <p className="font-body" style={{ fontSize: "17px", lineHeight: 1.8, color: "#5C3A22", maxWidth: "560px", margin: "0 auto 40px" }}>
          Browse real video portfolios from braiders in your city. See their work, check their availability, and book — all in one place.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#braiders"><button className="btn-primary">Browse Braiders</button></a>
          <a href="#join"><button className="btn-outline">I am a Braider</button></a>
        </div>
      </section>

      {/* PAIN POINT */}
      <section style={{ backgroundColor: "#2C1A0E", color: "#F7F3EE", padding: "64px 48px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p className="section-label" style={{ color: "#C9A882" }}>We understand the struggle</p>
          <h2 className="font-display" style={{ fontSize: "36px", fontWeight: 600, lineHeight: 1.4, marginBottom: "40px", maxWidth: "700px" }}>
            Finding a skilled, affordable braider in Europe should not be this hard.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }} className="grid-3">
            {[
              { title: "No visibility", body: "Talented braiders work by word of mouth only. You have no way to see their work before committing." },
              { title: "No trust", body: "Going to a stranger's home or letting one into yours requires trust that no current platform helps you build." },
              { title: "No affordability", body: "Salon prices in Europe are steep. Many skilled home braiders exist at a fraction of the cost — but they are invisible." },
            ].map((item) => (
              <div key={item.title}>
                <div style={{ width: "40px", height: "2px", backgroundColor: "#C9A882", marginBottom: "16px" }} />
                <h3 className="font-display" style={{ fontSize: "20px", marginBottom: "12px", color: "#F7F3EE" }}>{item.title}</h3>
                <p className="font-body" style={{ fontSize: "14px", lineHeight: 1.8, color: "#B09880" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE BRAIDERS */}
      <section id="braiders" style={{ padding: "80px 48px", maxWidth: "1200px", margin: "0 auto" }}>
        <p className="section-label">Browse portfolios</p>
        <h2 className="font-display" style={{ fontSize: "38px", fontWeight: 600, marginBottom: "8px" }}>Explore Braiders</h2>
        <p className="font-body" style={{ fontSize: "15px", color: "#7A5C48", marginBottom: "48px" }}>Watch their work. Choose your style. Book directly.</p>

        {/* City Search */}
        <div style={{ position: "relative", maxWidth: "360px", marginBottom: "40px" }}>
          <input
            type="text"
            placeholder="Search your city in Germany..."
            value={citySearch}
            onChange={(e) => { setCitySearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            style={{ width: "100%", border: "1.5px solid #D6CEC4", padding: "12px 16px", fontSize: "14px", backgroundColor: "#EDE7DF", fontFamily: "'Lato', sans-serif", color: "#2C1A0E", outline: "none" }}
          />
          {showDropdown && filtered.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#F7F3EE", border: "1.5px solid #D6CEC4", borderTop: "none", maxHeight: "220px", overflowY: "auto", zIndex: 50 }}>
              {filtered.map((city) => (
                <div
                  key={city}
                  className="city-item font-body"
                  onMouseDown={() => { setCitySearch(city); setShowDropdown(false); }}
                  style={{ padding: "10px 16px", fontSize: "14px", color: "#2C1A0E", cursor: "pointer", borderBottom: "1px solid #EDE7DF" }}
                >
                  {city}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px" }} className="grid-3">
          {braiders.map((braider) => (
            <div key={braider.name} className="card" style={{ borderRadius: "2px" }}>
              <div className="video-frame">
                <div style={{ width: "100%", height: "100%", backgroundColor: "#C9BFB3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#7A3B1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#F7F3EE"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <span className="font-body" style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#5C3A22" }}>Video Portfolio</span>
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <h3 className="font-display" style={{ fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>{braider.name}</h3>
                    <span className="tag">{braider.city}</span>
                  </div>
                  <span className="font-body" style={{ fontSize: "15px", fontWeight: 700, color: "#7A3B1E" }}>{braider.price}</span>
                </div>
                <p className="font-body" style={{ fontSize: "13px", color: "#7A5C48", marginBottom: "8px", lineHeight: 1.6 }}>{braider.styles}</p>
                <p className="font-body" style={{ fontSize: "12px", color: "#9E8070", marginBottom: "20px", fontStyle: "italic" }}>{braider.available}</p>
                <a href="#join"><button className="btn-primary" style={{ width: "100%" }}>Book Appointment</button></a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ backgroundColor: "#EDE7DF", padding: "80px 48px", borderTop: "1px solid #D6CEC4", borderBottom: "1px solid #D6CEC4" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p className="section-label">Simple by design</p>
          <h2 className="font-display" style={{ fontSize: "38px", fontWeight: 600, marginBottom: "56px" }}>How Braidly works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "48px" }} className="grid-3">
            {[
              { step: "01", title: "Discover", body: "Browse real video portfolios from braiders near you. Filter by city, style, and price range." },
              { step: "02", title: "Book", body: "Choose an available date and send a booking request. Your braider confirms directly via WhatsApp." },
              { step: "03", title: "Review", body: "After your appointment, share a short video review. Help other women in the community find great braiders." },
            ].map((item) => (
              <div key={item.step}>
                <span className="font-display" style={{ fontSize: "48px", fontWeight: 700, color: "#D6CEC4", lineHeight: 1 }}>{item.step}</span>
                <div className="divider" />
                <h3 className="font-display" style={{ fontSize: "22px", fontWeight: 600, marginBottom: "12px" }}>{item.title}</h3>
                <p className="font-body" style={{ fontSize: "14px", lineHeight: 1.8, color: "#5C3A22" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN FORM */}
      <section id="join" style={{ padding: "80px 48px", maxWidth: "900px", margin: "0 auto" }}>
        <p className="section-label">Get started today</p>
        <h2 className="font-display" style={{ fontSize: "38px", fontWeight: 600, marginBottom: "8px" }}>Join Braidly — it is completely free</h2>
        <p className="font-body" style={{ fontSize: "15px", color: "#7A5C48", marginBottom: "56px" }}>Whether you are looking for a braider or you are one, this is where you belong.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }} className="grid-2">

          {/* Client Form */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
              <div style={{ width: "3px", height: "40px", backgroundColor: "#7A3B1E" }} />
              <h3 className="font-display" style={{ fontSize: "24px", fontWeight: 600 }}>I am looking for a braider</h3>
            </div>
            {clientSubmitted ? (
              <p className="font-body" style={{ color: "#7A3B1E", fontSize: "15px", fontStyle: "italic" }}>Thank you. We will match you with braiders in your city shortly.</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setClientSubmitted(true); }} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {[
                  { label: "Full Name", type: "text", placeholder: "Your name" },
                  { label: "Email Address", type: "email", placeholder: "your@email.com" },
                  { label: "Your City", type: "text", placeholder: "e.g. München, Berlin, Hamburg" },
                  { label: "Hair Style You Want", type: "text", placeholder: "e.g. Knotless braids, Locs, Twists" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="font-body" style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#9E8070", display: "block", marginBottom: "8px" }}>{field.label}</label>
                    <input className="input-field" type={field.type} placeholder={field.placeholder} required />
                  </div>
                ))}
                <button className="btn-primary" type="submit">Find My Braider</button>
              </form>
            )}
          </div>

          {/* Braider Form */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
              <div style={{ width: "3px", height: "40px", backgroundColor: "#2C1A0E" }} />
              <h3 className="font-display" style={{ fontSize: "24px", fontWeight: 600 }}>I am a braider</h3>
            </div>
            {braiderSubmitted ? (
              <p className="font-body" style={{ color: "#7A3B1E", fontSize: "15px", fontStyle: "italic" }}>Welcome to Braidly. We will be in touch to set up your profile.</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setBraiderSubmitted(true); }} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {[
                  { label: "Full Name", type: "text", placeholder: "Your name" },
                  { label: "WhatsApp Number", type: "tel", placeholder: "+49 176 XXXXXXXX" },
                  { label: "Your City", type: "text", placeholder: "e.g. München, Berlin, Hamburg" },
                  { label: "Styles You Offer", type: "text", placeholder: "e.g. Knotless, Box braids, Locs" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="font-body" style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#9E8070", display: "block", marginBottom: "8px" }}>{field.label}</label>
                    <input className="input-field" type={field.type} placeholder={field.placeholder} required />
                  </div>
                ))}
                <button className="btn-primary" type="submit">List My Profile Free</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* COMING SOON */}
      <section style={{ backgroundColor: "#2C1A0E", color: "#F7F3EE", padding: "100px 48px", textAlign: "center" }}>
        <p className="section-label" style={{ color: "#C9A882" }}>Coming soon</p>
        <h2 className="font-display" style={{ fontSize: "42px", fontWeight: 600, lineHeight: 1.3, maxWidth: "600px", margin: "0 auto 20px" }}>
          The Braidly Hair Shop is on its way
        </h2>
        <p className="font-body" style={{ fontSize: "16px", color: "#B09880", maxWidth: "480px", margin: "0 auto 48px", lineHeight: 1.8 }}>
          We are sourcing premium braiding hair directly from manufacturers to bring you quality products at honest prices — delivered to your door across Europe.
        </p>
        {notifySubmitted ? (
          <p className="font-body" style={{ color: "#C9A882", fontSize: "16px", fontStyle: "italic" }}>You are on the list. We will notify you when the shop launches.</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setNotifySubmitted(true); }} style={{ display: "flex", justifyContent: "center", maxWidth: "460px", margin: "0 auto" }}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              required
              style={{ flex: 1, backgroundColor: "transparent", border: "1px solid #5C3A22", borderRight: "none", padding: "14px 20px", color: "#F7F3EE", fontFamily: "'Lato', sans-serif", fontSize: "14px", outline: "none" }}
            />
            <button type="submit" style={{ backgroundColor: "#7A3B1E", color: "#F7F3EE", border: "1px solid #7A3B1E", padding: "14px 28px", fontFamily: "'Lato', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}>
              Notify Me
            </button>
          </form>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#1A0E07", color: "#6B4F3A", padding: "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <span className="font-display" style={{ fontSize: "18px", color: "#9E7A60" }}>Braidly</span>
        <span className="font-body" style={{ fontSize: "12px", letterSpacing: "1px" }}>© 2026 Braidly. Connecting the diaspora across Europe.</span>
        <a href="#" className="font-body" style={{ fontSize: "12px", color: "#6B4F3A", textDecoration: "none", letterSpacing: "1px" }}>Privacy Policy</a>
      </footer>
    </main>
  );
}