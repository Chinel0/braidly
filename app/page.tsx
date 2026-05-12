"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "../firebase/firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { uploadToCloudinary } from "../lib/cloudinary";
async function sendEmail(payload: Record<string, string>) {
  await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function normalizeCityName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const heroImages = [
  { url: "/locs_pinned_up.jpg", alt: "Black woman with pinned up locs", label: "Pinned Up Locs" },
  { url: "/knotless_braid.jpg", alt: "Black woman with knotless braids", label: "Knotless Braids" },
  { url: "/wig.jpg", alt: "Black woman with wig style", label: "Wig Style" },
  { url: "/locs.jpg", alt: "Black woman with locs", label: "Goddess Locs" },
];

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const TIMES = ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];

interface PriceRow { style: string; price: string; }
interface AvailDay { enabled: boolean; from: string; to: string; }
interface Braider {
  id?: string;
  name: string;
  email: string;
  whatsapp?: string;
  city: string;
  transportStop?: string;
  bio?: string;
  homeService?: string;
  hasSalon?: string;
  salonAddress?: string;
  styles: string;
  price: string;
  available: string;
  photoUrl: string;
  videoUrl: string;
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "contact_messages"), {
        name, email, message,
        createdAt: Timestamp.now(),
      });
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ backgroundColor:"#F7F3EE", padding:"28px", border:"1px solid #D6CEC4" }}>
        <p className="font-body" style={{ fontSize:"15px", fontWeight:700, color:"#2C1A0E", marginBottom:"8px" }}>
          Message received.
        </p>
        <p className="font-body" style={{ fontSize:"13px", color:"#7A5C48", lineHeight:1.8 }}>
          Thank you for reaching out. We will get back to you at {email} within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
      {[
        { label:"Your Name", type:"text", val:name, set:setName, placeholder:"Your name" },
        { label:"Email Address", type:"email", val:email, set:setEmail, placeholder:"your@email.com" },
      ].map((f) => (
        <div key={f.label}>
          <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>
            {f.label}
          </label>
          <input
            className="input-field"
            type={f.type}
            value={f.val}
            onChange={(e) => f.set(e.target.value)}
            placeholder={f.placeholder}
            required
          />
        </div>
      ))}

      <div>
        <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>
          Message
        </label>
        <textarea
          className="input-field"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message here..."
          rows={5}
          required
          style={{ resize:"vertical", paddingTop:"8px" }}
        />
      </div>

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send Message"}
      </button>

      <p className="font-body" style={{ fontSize:"11px", color:"#A89080", lineHeight:1.6 }}>
        We respond to all messages within 48 hours.
      </p>
    </form>
  );
}
export default function Home() {
  // ── onboarding ──
  const [userType, setUserType] = useState<null | "client" | "braider" | "new">(null);
  const [nearbyBraidersCount, setNearbyBraidersCount] = useState(0);
  const [userCity, setUserCity] = useState<string | null>(null);

  // ── city search ──
  const [citySearch, setCitySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [allCities, setAllCities] = useState<string[]>([]);
  useEffect(() => {
    let active = true;

    async function loadCities() {
      try {
        const response = await fetch("/api/cities");
        if (!response.ok) throw new Error("Failed to load city list");

        const cities: string[] = await response.json();
        if (active) setAllCities(cities);
      } catch {
        if (active) setAllCities([]);
      }
    }

    loadCities();

    return () => {
      active = false;
    };
  }, []);
  const normalizedSearch = normalizeCityName(citySearch.trim());
  const filtered = normalizedSearch.length > 0
    ? allCities.filter((c) => normalizeCityName(c).startsWith(normalizedSearch))
    : [];

  // ── live braiders ──
  const [braiders, setBraiders] = useState<Braider[]>([]);
  const [braidersLoading, setBraidersLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "braiders"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setBraiders(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Braider[]);
      } catch (e) { console.error(e); }
      finally { setBraidersLoading(false); }
    }
    load();
  }, []);

  // ── geolocation for quick win ──
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || null;
          
          if (city) {
            setUserCity(city);
            const count = braiders.filter((b) => normalizeCityName(b.city) === normalizeCityName(city)).length;
            setNearbyBraidersCount(count);
          }
        } catch (e) {
          console.error("Geolocation error:", e);
        }
      },
      () => {
        // Geolocation denied or unavailable — use default
        console.log("Geolocation not available");
      }
    );
  }, [braiders]);

  // ── braider signup ──
  const [braiderStep, setBraiderStep] = useState(1);
  const [braiderSubmitted, setBraiderSubmitted] = useState(false);
  const [braiderLoading, setBraiderLoading] = useState(false);
  const [braiderError, setBraiderError] = useState("");
  const [bName, setBName] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bWhatsapp, setBWhatsapp] = useState("");
  const [bCity, setBCity] = useState("");
  const [bStop, setBStop] = useState("");
  const [bBio, setBBio] = useState("");
  const [bHomeService, setBHomeService] = useState("");
  const [bHasSalon, setBHasSalon] = useState("");
  const [bSalonAddress, setBSalonAddress] = useState("");
  const [priceRows, setPriceRows] = useState<PriceRow[]>([{ style: "", price: "" }, { style: "", price: "" }]);
  const [availability, setAvailability] = useState<Record<string, AvailDay>>(
    Object.fromEntries(DAYS.map((d) => [d, { enabled: false, from: "09:00", to: "18:00" }]))
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  function toggleDay(day: string) {
    setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  }
  function setDayTime(day: string, field: "from" | "to", val: string) {
    setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  }
  function addPriceRow() { setPriceRows((r) => [...r, { style: "", price: "" }]); }
  function updatePriceRow(i: number, field: "style" | "price", val: string) {
    setPriceRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  }
  function removePriceRow(i: number) { setPriceRows((r) => r.filter((_, idx) => idx !== i)); }

  async function handleBraiderSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBraiderLoading(true);
    setBraiderError("");
    try {
      console.log("Step 1: Starting submission");
      let photoUrl = "";
      let videoUrl = "";
      if (photoFile) {
        setUploadProgress("Uploading photo...");
        try {
          photoUrl = await uploadToCloudinary(photoFile, "image");
        } catch (uploadErr) {
          console.error("Photo upload failed:", uploadErr);
          photoUrl = "";
        }
      }
      console.log("Step 2: Photo result:", photoUrl);
      if (videoFile) {
        setUploadProgress("Uploading video...");
        try {
          videoUrl = await uploadToCloudinary(videoFile, "video");
        } catch (uploadErr) {
          console.error("Video upload failed:", uploadErr);
          videoUrl = "";
        }
      }
      console.log("Step 3: Video result:", videoUrl);
      setUploadProgress("");
      const priceText = priceRows.filter((r) => r.style && r.price).map((r) => `${r.style} — €${r.price}`).join(", ");
      const availText = DAYS.filter((d) => availability[d].enabled).map((d) => `${d} ${availability[d].from}–${availability[d].to}`).join(", ");
      console.log("Step 4: Saving to Firestore");
      const braiderRef = await addDoc(collection(db, "braiders"), {
        name: bName, email: bEmail, whatsapp: bWhatsapp,
        city: bCity, transportStop: bStop, bio: bBio,
        homeService: bHomeService, hasSalon: bHasSalon,
        salonAddress: bSalonAddress, styles: priceText,
        price: priceRows[0]?.price ? `From €${priceRows[0].price}` : "",
        available: availText, photoUrl, videoUrl,
        createdAt: Timestamp.now(),
      });
      console.log("Step 5: Firestore saved - showing success");
      setBraiderSubmitted(true);
      try {
        await fetch("/api/send-braider-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            braider_name: bName,
            braider_email: bEmail,
          }),
        });
      } catch (err) {
        console.error("Email send failed:", err);
      }
    } catch (err) {
      setBraiderError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setBraiderLoading(false);
    }
  }

  // ── client booking ──
  const [clientSubmitted, setClientSubmitted] = useState(false);
  const [selectedBraider, setSelectedBraider] = useState<Braider | null>(null);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cCity, setCCity] = useState("");
  const [cStyle, setCStyle] = useState("");
  const [cDate, setCDate] = useState("");
  const [cNote, setCNote] = useState("");

  async function handleClientSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addDoc(collection(db, "bookings"), {
        clientName: cName, clientEmail: cEmail,
        clientCity: cCity, style: cStyle,
        date: cDate, note: cNote,
        braiderName: selectedBraider?.name || "",
        braiderEmail: selectedBraider?.email || "",
        braiderCity: selectedBraider?.city || "",
        status: "pending", createdAt: Timestamp.now(),
      });

      try {
        await fetch("/api/send-client-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_name: cName,
            client_email: cEmail,
            braider_name: selectedBraider?.name || "your braider",
            style: cStyle,
            date: cDate,
          }),
        });
      } catch (err) {
        console.error("Email send failed:", err);
      }

      setClientSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  }

  // ── notify ──
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  // ── braid buddy card selection ──
  const [buddySelected, setBuddySelected] = useState(false);

  // ── braid buddy form ──
  const [buddySubmitted, setBuddySubmitted] = useState(false);
  const [buddyLoading, setBuddyLoading] = useState(false);
  const [buddyName, setBuddyName] = useState("");
  const [buddyEmail, setBuddyEmail] = useState("");
  const [buddyWhatsapp, setBuddyWhatsapp] = useState("");
  const [buddyCity, setBuddyCity] = useState("");
  const [buddyCanDo, setBuddyCanDo] = useState("");
  const [buddyWantDone, setBuddyWantDone] = useState("");
  const [buddyArrangement, setBuddyArrangement] = useState("");
  const [buddyBio, setBuddyBio] = useState("");

  // ── braid buddy list ──
  const [buddies, setBuddies] = useState<Record<string, string>[]>([]);
  useEffect(() => {
    async function loadBuddies() {
      try {
        const q = query(collection(db, "braid_buddies"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setBuddies(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, string>)));
      } catch (e) { console.error(e); }
    }
    loadBuddies();
  }, []);

  async function handleBuddySubmit(e: React.FormEvent) {
    e.preventDefault();
    setBuddyLoading(true);
    try {
      await addDoc(collection(db, "braid_buddies"), {
        name: buddyName, email: buddyEmail, whatsapp: buddyWhatsapp,
        city: buddyCity, canDo: buddyCanDo, wantDone: buddyWantDone,
        arrangement: buddyArrangement, bio: buddyBio,
        createdAt: Timestamp.now(),
      });
      setBuddySubmitted(true);
    } catch (err) { console.error(err); }
    finally { setBuddyLoading(false); }
  }

  return (
    <main style={{ fontFamily: "'Georgia','Times New Roman',serif", backgroundColor: "#F7F3EE", color: "#2C1A0E", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#F7F3EE;}
        .font-display{font-family:'Playfair Display',Georgia,serif;}
        .font-body{font-family:'Lato',sans-serif;}
        .btn-primary{background:#3D5212;color:#F7F3EE;padding:14px 36px;border:none;cursor:pointer;font-family:'Lato',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;transition:background .25s;}
        .btn-primary:hover{background:#2E3D0D;}
        .btn-primary:disabled{background:#C9BFB3;cursor:not-allowed;}
        .btn-outline{background:transparent;color:#2C1A0E;padding:14px 36px;border:1.5px solid #2C1A0E;cursor:pointer;font-family:'Lato',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;transition:all .25s;}
        .btn-outline:hover{background:#2C1A0E;color:#F7F3EE;}
        .btn-sm{background:#3D5212;color:#F7F3EE;padding:6px 14px;border:none;cursor:pointer;font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
        .btn-ghost{background:transparent;color:#9E8070;padding:6px 10px;border:1px solid #D6CEC4;cursor:pointer;font-family:'Lato',sans-serif;font-size:11px;}
        .card{background:#EDE7DF;border:1px solid #D6CEC4;overflow:hidden;}
        .video-frame{width:100%;aspect-ratio:9/16;background:#C9BFB3;position:relative;overflow:hidden;}
        .input-field{width:100%;background:transparent;border:none;border-bottom:1.5px solid #9E8070;padding:10px 4px;font-family:'Lato',sans-serif;font-size:14px;color:#2C1A0E;outline:none;transition:border-color .2s;}
        .input-field:focus{border-bottom-color:#3D5212;}
        .input-field::placeholder{color:#A89080;}
        .select-field{width:100%;background:transparent;border:none;border-bottom:1.5px solid #9E8070;padding:10px 4px;font-family:'Lato',sans-serif;font-size:14px;color:#2C1A0E;outline:none;appearance:none;cursor:pointer;}
        .tag{display:inline-block;background:#D6CEC4;color:#5C3A22;font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;}
        .divider{width:60px;height:2px;background:#3D5212;margin:20px 0;}
        .section-label{font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6B8F5E;margin-bottom:16px;}
        .city-item:hover{background:#EDE7DF;}
        .day-btn{padding:8px 12px;border:1.5px solid #D6CEC4;background:transparent;cursor:pointer;font-family:'Lato',sans-serif;font-size:12px;font-weight:700;color:#5C3A22;transition:all .2s;}
        .day-btn.active{background:#3D5212;border-color:#3D5212;color:#F7F3EE;}
        .service-card{flex:1;padding:14px 10px;border:1.5px solid #D6CEC4;background:transparent;cursor:pointer;font-family:'Lato',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5C3A22;text-align:center;transition:all .2s;}
        .service-card.active{background:#2C1A0E;border-color:#2C1A0E;color:#F7F3EE;}
        .step-indicator{display:flex;gap:8px;margin-bottom:32px;}
        .step-dot{width:28px;height:4px;background:#D6CEC4;transition:background .3s;}
        .step-dot.active{background:#3D5212;}
        .hero-img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.88);}
        .hero-img-card{overflow:hidden;position:relative;border-radius:2px;height:180px;}
        .hero-img-label{position:absolute;bottom:0;left:0;right:0;padding:24px 12px 10px;background:linear-gradient(to top,rgba(44,26,14,.72),transparent);font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F7F3EE;}
        .sage-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#7AAF6A;margin-right:8px;vertical-align:middle;}
        main > section{padding-top:44px !important;padding-bottom:44px !important;}
        .hero-section{padding:16px 48px 8px !important;min-height:auto !important;}
        @media(max-width:768px){
          main > section{padding:28px 20px !important;}
          .hero-section{padding:12px 20px 4px !important;}
          .grid-3{grid-template-columns:1fr!important;}
          .grid-2{grid-template-columns:1fr!important;}
          .hero-kicker{font-size:10px!important;letter-spacing:1.5px!important;white-space:nowrap;}
          .hero-title{font-size:30px!important;line-height:1.18!important;max-width:16ch!important;}
          .section-heading-sm{font-size:30px!important;line-height:1.15!important;}
          .compact-heading{font-size:28px!important;line-height:1.15!important;}
          .hero-img-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;}
          .hero-img-card{height:92px!important;}
          .hero-img-label{font-size:9px!important;letter-spacing:1px!important;padding:14px 8px 8px!important;}
          nav{padding:18px 24px!important;}
          .day-row{flex-direction:column!important;}
          .problem-headline{font-size:36px!important;line-height:1.2!important;}
        }
        @keyframes bounce-down{0%,100%{transform:translateY(0);}50%{transform:translateY(6px);}}
        .arrow-bounce{animation:bounce-down 1.2s ease-in-out infinite;}
        .problem-headline{font-size:52px;}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 48px", borderBottom:"1px solid #D6CEC4", backgroundColor:"#F7F3EE", position:"sticky", top:0, zIndex:100 }}>
        <span className="font-display" style={{ fontSize:"22px", fontWeight:600, letterSpacing:"-0.5px", color:"#2C1A0E" }}>Braidely</span>
        <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
          <a href="#braiders" style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#2C1A0E", textDecoration:"none" }}>Browse Braiders</a>
          <a href="#join"><button className="btn-primary" style={{ padding:"10px 24px" }}>Join Free</button></a>
        </div>
      </nav>

      {/* ── HOOK: Full screen, one powerful sentence, two buttons ── */}
      <section className="hero-section" style={{ minHeight:"auto", display:"flex", flexDirection:"column", justifyContent:"flex-start", alignItems:"center", padding:"28px 48px 24px", backgroundColor:"#F5F0E8", textAlign:"center" }}>
        <p className="section-label hero-kicker" style={{ marginBottom:"14px" }}>For Black women across Germany</p>
        <h2 className="font-display hero-title" style={{ fontSize:"clamp(30px, 7vw, 72px)", fontWeight:700, lineHeight:1.12, color:"#31260C", marginBottom:"28px", maxWidth:"820px" }}>
          Find your trusted braider in minutes, not weeks
        </h2>
        <div style={{ display:"flex", gap:"24px", justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn-primary" onClick={() => document.getElementById("braiders")?.scrollIntoView({ behavior:"smooth" })}>
            Browse Braiders
          </button>
          <button className="btn-outline" onClick={() => document.getElementById("join")?.scrollIntoView({ behavior:"smooth" })}>
            I am a braider
          </button>
        </div>
        {/* hero images under the hook */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", maxWidth:"900px", margin:"16px auto 0" }} className="hero-img-grid">
          {heroImages.map((img) => (
            <div key={img.label} className="hero-img-card">
              <img src={img.url} alt={img.alt} className="hero-img" />
              <div className="hero-img-label">{img.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PERSONALIZATION CARDS ── */}
      <section id="personalization" style={{ padding:"44px 48px", backgroundColor:"#F7F3EE", borderTop:"1px solid #D6CEC4" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto", textAlign:"center" }}>
          <h3 className="font-display section-heading-sm" style={{ fontSize:"clamp(28px, 4vw, 36px)", fontWeight:700, color:"#31260C", marginBottom:"12px", lineHeight:1.12 }}>What brings you here?</h3>
          <p className="font-body" style={{ fontSize:"16px", color:"#73673D", marginBottom:"48px" }}>Choose your path</p>
          
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"24px" }}>
            {/* Client Card */}
            <div 
              onClick={() => { setUserType("client"); document.getElementById("problem")?.scrollIntoView({ behavior:"smooth" }); }}
              style={{ 
                padding:"40px 24px", 
                backgroundColor:userType === "client" ? "#3D5212" : "#E8EDE0", 
                color:userType === "client" ? "#F5F0E8" : "#31260C",
                cursor:"pointer", 
                borderRadius:"4px", 
                transition:"all .3s",
                border:userType === "client" ? "2px solid #3D5212" : "2px solid transparent"
              }}
              onMouseEnter={(e) => { if(userType !== "client") e.currentTarget.style.backgroundColor = "#DDE3D6"; }}
              onMouseLeave={(e) => { if(userType !== "client") e.currentTarget.style.backgroundColor = "#E8EDE0"; }}
            >
              <p className="font-display" style={{ fontSize:"24px", fontWeight:700, marginBottom:"16px" }}>I need my hair done</p>
              <p className="font-body" style={{ fontSize:"14px", opacity:.8 }}>Find trusted braiders with real video proof of their work</p>
              {userType === "client" && (
                <div style={{ display:"flex", justifyContent:"center", marginTop:"24px" }}>
                  <svg className="arrow-bounce" width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              )}
            </div>

            {/* Braider Card */}
            <div 
              onClick={() => { setUserType("braider"); document.getElementById("problem")?.scrollIntoView({ behavior:"smooth" }); }}
              style={{ 
                padding:"40px 24px", 
                backgroundColor:userType === "braider" ? "#3D5212" : "#E8EDE0", 
                color:userType === "braider" ? "#F5F0E8" : "#31260C",
                cursor:"pointer", 
                borderRadius:"4px", 
                transition:"all .3s",
                border:userType === "braider" ? "2px solid #3D5212" : "2px solid transparent"
              }}
              onMouseEnter={(e) => { if(userType !== "braider") e.currentTarget.style.backgroundColor = "#DDE3D6"; }}
              onMouseLeave={(e) => { if(userType !== "braider") e.currentTarget.style.backgroundColor = "#E8EDE0"; }}
            >
              <p className="font-display" style={{ fontSize:"24px", fontWeight:700, marginBottom:"16px" }}>I am a braider</p>
              <p className="font-body" style={{ fontSize:"14px", opacity:.8 }}>Get visibility to clients actively looking for you</p>
              {userType === "braider" && (
                <div style={{ display:"flex", justifyContent:"center", marginTop:"24px" }}>
                  <svg className="arrow-bounce" width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              )}
            </div>

            {/* Braid Buddy Card */}
            <div
              onClick={() => { setBuddySelected(true); document.getElementById("braid-buddy")?.scrollIntoView({ behavior:"smooth" }); }}
              style={{
                padding:"40px 24px",
                backgroundColor:buddySelected ? "#3D5212" : "#E8EDE0",
                color:buddySelected ? "#F5F0E8" : "#31260C",
                cursor:"pointer",
                borderRadius:"4px",
                transition:"all .3s",
                border:buddySelected ? "2px solid #3D5212" : "2px solid transparent"
              }}
              onMouseEnter={(e) => { if(!buddySelected) e.currentTarget.style.backgroundColor = "#DDE3D6"; }}
              onMouseLeave={(e) => { if(!buddySelected) e.currentTarget.style.backgroundColor = "#E8EDE0"; }}
            >
              <p className="font-display" style={{ fontSize:"24px", fontWeight:700, marginBottom:"16px" }}>Find a Braid Buddy</p>
              <p className="font-body" style={{ fontSize:"14px", opacity:.8 }}>Swap skills. No money needed. Just community.</p>
              {buddySelected && (
                <div style={{ display:"flex", justifyContent:"center", marginTop:"24px" }}>
                  <svg className="arrow-bounce" width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION: Dual version based on userType ── */}
      {userType && (
        <section id="problem" style={{ padding:"80px 48px", backgroundColor:userType ? "#31260C" : "transparent", color:"#F5F0E8", borderTop:"1px solid #3D5212" }}>
          <div style={{ maxWidth:"700px", margin:"0 auto", textAlign:"center" }}>
            {userType === "client" && (
              <>
                <h2 className="font-display problem-headline" style={{ fontWeight:700, lineHeight:1.3, marginBottom:"24px" }}>
                  You've scrolled Instagram for hours
                </h2>
                <p className="font-body" style={{ fontSize:"16px", lineHeight:1.8, opacity:.9, marginBottom:"16px" }}>
                  Looking for a braider in your city. Nothing. You asked friends. You texted her cousin. You waited weeks.
                </p>
                <p className="font-body" style={{ fontSize:"16px", lineHeight:1.8, opacity:.9, marginBottom:"0" }}>
                  <strong>This is the way it has always been.</strong> Until now.
                </p>
                <div style={{ display:"flex", gap:"16px", justifyContent:"center", flexWrap:"wrap", marginTop:"32px" }}>
                  <button className="btn-primary" onClick={() => document.getElementById("braiders")?.scrollIntoView({ behavior:"smooth" })}>Find a Braider</button>
                </div>
              </>
            )}
            {userType === "braider" && (
              <>
                <h2 className="font-display problem-headline" style={{ fontWeight:700, lineHeight:1.3, marginBottom:"24px" }}>
                  You can braid beautifully
                </h2>
                <p className="font-body" style={{ fontSize:"16px", lineHeight:1.8, opacity:.9, marginBottom:"16px" }}>
                  But your clients only know you exist if they happen to know you. Your talent is invisible.
                </p>
                <p className="font-body" style={{ fontSize:"16px", lineHeight:1.8, opacity:.9, marginBottom:"0" }}>
                  Give yourself a chance to be discovered today.
                </p>
                <div style={{ display:"flex", gap:"16px", justifyContent:"center", flexWrap:"wrap", marginTop:"32px" }}>
                  <button className="btn-outline" style={{ color:"#F5F0E8", borderColor:"#F5F0E8" }} onClick={() => document.getElementById("braider-form")?.scrollIntoView({ behavior:"smooth" })}>Register as a Braider</button>
                </div>
              </>
            )}
            {userType === "new" && (
              <>
                <h2 className="font-display problem-headline" style={{ fontWeight:700, lineHeight:1.3, marginBottom:"24px" }}>
                  New city. No connections.
                </h2>
                <p className="font-body" style={{ fontSize:"16px", lineHeight:1.8, opacity:.9, marginBottom:"16px" }}>
                  You don't know anyone. You don't know where to find anything. The city feels big and lonely.
                </p>
                <p className="font-body" style={{ fontSize:"16px", lineHeight:1.8, opacity:.9, marginBottom:"0" }}>
                  <strong>How do you find your people?</strong> We help with that.
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── PAIN POINT ── */}
      <section style={{
        color:"#F7F3EE",
        padding:"72px 48px",
        position:"relative",
        backgroundImage:"url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80')",
        backgroundSize:"cover",
        backgroundPosition:"center",
        backgroundAttachment:"fixed",
      }}>
        <div style={{ position:"absolute", inset:0, backgroundColor:"rgba(21,58,11,0.88)" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <p className="section-label" style={{ color:"#A8C89A" }}>We understand the struggle</p>
          <h2 className="font-display" style={{ fontSize:"34px", fontWeight:600, lineHeight:1.4, marginBottom:"40px", maxWidth:"680px" }}>
            Finding a skilled, affordable braider in Europe as a Black woman should not be this hard.
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"40px" }} className="grid-3">
            {[
              { title:"No visibility", body:"Talented braiders work by word of mouth only. You have no way to see their work, pricing, or availability before committing." },
              { title:"No trust", body:"Going to a stranger's home or letting one into yours is a real concern. No platform exists to help you vet and verify braiders." },
              { title:"No affordability", body:"Salon prices in Europe are steep. Skilled home braiders exist at a fraction of the cost — but they remain invisible to those who need them." },
            ].map((item) => (
              <div key={item.title}>
                <div style={{ width:"40px", height:"2px", backgroundColor:"#7AAF6A", marginBottom:"16px" }} />
                <h3 className="font-display" style={{ fontSize:"20px", marginBottom:"12px", color:"#F7F3EE" }}>{item.title}</h3>
                <p className="font-body" style={{ fontSize:"14px", lineHeight:1.8, color:"#B09880" }}>{item.body}</p>
              </div>
            ))}
          </div>

          {/* unregistered braider note */}
          <div style={{ marginTop:"48px", padding:"20px 24px", border:"1px solid #3D2A1A", backgroundColor:"#1A0E07" }}>
            <p className="font-body" style={{ fontSize:"14px", color:"#C9A882", lineHeight:1.8 }}>
              <strong style={{ color:"#F7F3EE" }}>You do not need to be a registered business to join Braidely.</strong> Whether you are a student, a mother, an au pair, or a salon owner — if you can braid, you belong here.
            </p>
            <button
              onClick={() => document.getElementById("join")?.scrollIntoView({ behavior:"smooth" })}
              style={{ backgroundColor:"#3D5212", color:"white", padding:"12px 28px", border:"none", textTransform:"uppercase", letterSpacing:"2px", fontFamily:"'Lato',sans-serif", fontSize:"12px", fontWeight:700, cursor:"pointer", marginTop:"16px" }}
            >
              Join as a Braider — it is free
            </button>
          </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section style={{ padding:"56px 48px", backgroundColor:"#F5F0E8" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <p className="section-label">Our style is limitless</p>
          <h2 className="font-display" style={{ fontSize:"38px", fontWeight:600, marginBottom:"8px", color:"#31260C" }}>
            Every braid tells a story
          </h2>
          <p className="font-body" style={{ fontSize:"15px", color:"#73673D", marginBottom:"48px" }}>
            From knotless to goddess locs — find a braider who specialises in exactly what you want.
          </p>

          {/* Large grid — Knotless Braids spans rows 1–2 on the left */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gridTemplateRows:"auto auto", gap:"12px" }}>

            {/* Large featured image — spans both rows on left */}
            <div style={{ gridColumn:"1", gridRow:"1 / 3", backgroundColor:"#C5BDB0", borderRadius:"2px", minHeight:"420px", position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end" }}>
              <img src="/knotless_braid2.jpg" alt="Knotless braids" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(49,38,12,0.8), transparent)" }} />
              <div style={{ position:"relative", zIndex:1, padding:"20px", width:"100%" }}>
                <span className="tag" style={{ backgroundColor:"#3D5212", color:"#F5F0E8" }}>Knotless Braids</span>
              </div>
            </div>

            {/* Row 1, col 2 */}
            <div style={{ backgroundColor:"#B5A898", borderRadius:"2px", minHeight:"200px", position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end" }}>
              <img src="/clean_braid.jpg" alt="Box braids" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(49,38,12,0.8), transparent)" }} />
              <div style={{ position:"relative", zIndex:1, padding:"16px", width:"100%" }}>
                <span className="tag" style={{ backgroundColor:"#3D5212", color:"#F5F0E8" }}>Box Braids</span>
              </div>
            </div>

            {/* Row 1, col 3 */}
            <div style={{ backgroundColor:"#C9BFB3", borderRadius:"2px", minHeight:"200px", position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end" }}>
              <img src="/twist.jpg" alt="Twist style" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(49,38,12,0.8), transparent)" }} />
              <div style={{ position:"relative", zIndex:1, padding:"16px", width:"100%" }}>
                <span className="tag" style={{ backgroundColor:"#3D5212", color:"#F5F0E8" }}>Twist</span>
              </div>
            </div>

            {/* Row 2, col 2 — Goddess Locs */}
            <div style={{ backgroundColor:"#B0A890", borderRadius:"2px", minHeight:"200px", position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end" }}>
              <img src="/locs.jpg" alt="Goddess locs" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(49,38,12,0.8), transparent)" }} />
              <div style={{ position:"relative", zIndex:1, padding:"16px", width:"100%" }}>
                <span className="tag" style={{ backgroundColor:"#3D5212", color:"#F5F0E8" }}>Goddess Locs</span>
              </div>
            </div>

            {/* Row 2, col 3 */}
            <div style={{ backgroundColor:"#C2B8A8", borderRadius:"2px", minHeight:"200px", position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end" }}>
              <img src="/natural_hair.jpg" alt="Natural hair" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(49,38,12,0.8), transparent)" }} />
              <div style={{ position:"relative", zIndex:1, padding:"16px", width:"100%" }}>
                <span className="tag" style={{ backgroundColor:"#3D5212", color:"#F5F0E8" }}>Natural Hair</span>
              </div>
            </div>

          </div>

          {/* Bottom row — three equal */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:"12px", marginTop:"12px" }}>
            {[
              { label:"Wig",      src:"/wig.jpg" },
              { label:"Dreadlocs", src:"/dreadloc_twist.jpg" },
              { label:"Faux Locs", src:"/long_faux_locs.jpg" },
            ].map((item) => (
              <div key={item.label} style={{ backgroundColor:"#BDB5A5", borderRadius:"2px", minHeight:"160px", position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end" }}>
                <img src={item.src} alt={item.label} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(49,38,12,0.8), transparent)" }} />
                <div style={{ position:"relative", zIndex:1, padding:"14px", width:"100%" }}>
                  <span className="tag" style={{ backgroundColor:"#3D5212", color:"#F5F0E8" }}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── SHOW MAGIC ── */}
      <section id="braiders" style={{ padding:"80px 48px", maxWidth:"1200px", margin:"0 auto" }}>
        {/* section label intentionally removed to reduce redundancy */}
        <h2 className="font-display" style={{ fontSize:"38px", fontWeight:600, marginBottom:"8px" }}>Braider videos with real proof</h2>
        <p className="font-body" style={{ fontSize:"15px", color:"#7A5C48", marginBottom:"48px" }}>Watch their work. Choose your style. Book directly.</p>

        {/* City search */}
        <div style={{ position:"relative", maxWidth:"360px", marginBottom:"40px" }}>
          <input
            type="text"
            placeholder="Search your city in Germany..."
            value={citySearch}
            onChange={(e) => { setCitySearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            style={{ width:"100%", border:"1.5px solid #D6CEC4", padding:"12px 16px", fontSize:"14px", backgroundColor:"#EDE7DF", fontFamily:"'Lato',sans-serif", color:"#2C1A0E", outline:"none" }}
          />
          {showDropdown && filtered.length > 0 && (
            <div style={{ position:"absolute", top:"100%", left:0, right:0, backgroundColor:"#F7F3EE", border:"1.5px solid #D6CEC4", borderTop:"none", maxHeight:"220px", overflowY:"auto", zIndex:50 }}>
              {filtered.map((city) => (
                <div key={city} className="city-item font-body" onMouseDown={() => { setCitySearch(city); setShowDropdown(false); }} style={{ padding:"10px 16px", fontSize:"14px", color:"#2C1A0E", cursor:"pointer", borderBottom:"1px solid #EDE7DF" }}>
                  {city}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Braider cards */}
        {braidersLoading ? (
          <p className="font-body" style={{ color:"#9E8070", fontSize:"14px" }}>Loading braiders...</p>
        ) : braiders.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", backgroundColor:"#EDE7DF", border:"1px solid #D6CEC4" }}>
            <p className="font-display" style={{ fontSize:"22px", marginBottom:"12px", color:"#5C3A22" }}>Be the first braider in your city</p>
            <p className="font-body" style={{ fontSize:"14px", color:"#9E8070", marginBottom:"24px" }}>No braiders listed yet. Sign up below and start getting clients today.</p>
            <a href="#join"><button className="btn-primary">Join as a Braider</button></a>
          </div>
        ) : (
          <>
            {citySearch.trim() && braiders.filter((b) => normalizeCityName(b.city).includes(normalizeCityName(citySearch.trim()))).length === 0 && (
              <div style={{ textAlign:"center", padding:"48px 20px", backgroundColor:"#EDE7DF", border:"1px solid #D6CEC4", marginBottom:"28px" }}>
                <p className="font-display" style={{ fontSize:"20px", marginBottom:"8px", color:"#5C3A22" }}>No braiders found in {citySearch}</p>
                <p className="font-body" style={{ fontSize:"14px", color:"#9E8070" }}>Try a nearby city or clear the search to see all braiders.</p>
              </div>
            )}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"28px" }} className="grid-3">
            {braiders.filter((b) => !citySearch.trim() || normalizeCityName(b.city).includes(normalizeCityName(citySearch.trim()))).map((braider) => (
              <div key={braider.id} className="card" style={{ borderRadius:"2px" }}>
                <div className="video-frame">
                  {braider.videoUrl ? (
                    <video src={braider.videoUrl} controls style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <div style={{ width:"100%", height:"100%", backgroundColor:"#C9BFB3", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"12px" }}>
                      {braider.photoUrl
                        ? <img src={braider.photoUrl} alt={braider.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <>
                            <div style={{ width:"48px", height:"48px", borderRadius:"50%", backgroundColor:"#3D5212", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="#F7F3EE"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                            <span className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#5C3A22" }}>Video Portfolio</span>
                          </>
                      }
                    </div>
                  )}
                </div>
                <div style={{ padding:"24px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
                    <div>
                      <h3 className="font-display" style={{ fontSize:"20px", fontWeight:600, marginBottom:"4px" }}>{braider.name}</h3>
                      <span className="tag">{braider.city}</span>
                    </div>
                    <span className="font-body" style={{ fontSize:"15px", fontWeight:700, color:"#3D5212" }}>{braider.price}</span>
                  </div>
                  <p className="font-body" style={{ fontSize:"13px", color:"#7A5C48", marginBottom:"6px", lineHeight:1.6 }}>{braider.styles}</p>
                  {braider.transportStop && (
                    <p className="font-body" style={{ fontSize:"12px", color:"#9E8070", marginBottom:"6px" }}>Near: {braider.transportStop}</p>
                  )}
                  {braider.homeService && (
                    <p className="font-body" style={{ fontSize:"12px", color:"#6B8F5E", marginBottom:"6px", fontWeight:700 }}>{braider.homeService}</p>
                  )}
                  <p className="font-body" style={{ fontSize:"12px", color:"#9E8070", marginBottom:"20px", fontStyle:"italic" }}>{braider.available}</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    <button
                      className="btn-primary"
                      style={{ width:"100%" }}
                      onClick={() => {
                        setSelectedBraider(braider);
                        document.getElementById("join")?.scrollIntoView({ behavior:"smooth" });
                      }}
                    >
                      Book Appointment
                    </button>
                    <a
                      href={`/braiders/${braider.id}`}
                      style={{ display:"block", textAlign:"center", fontFamily:"'Lato',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#3D5212", textDecoration:"none", padding:"10px" }}
                    >
                      View Profile →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </section>

      {/* ── SOLUTION ── */}
      <section style={{ padding:"80px 48px", backgroundColor:"#F5F0E8", borderTop:"1px solid #D6CEC4" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <p className="section-label">Our Solution for You</p>
          <h2 className="font-display" style={{ fontSize:"38px", fontWeight:600, marginBottom:"36px" }}>What happens next</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px" }} className="grid-3">
            <div style={{ padding:"32px", backgroundColor:"#E8EDE0", border:"1px solid #D6CEC4", display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <div style={{ width:"40px", height:"2px", backgroundColor:"#3D5212", marginBottom:"16px" }} />
              <h3 className="font-display" style={{ fontSize:"22px", marginBottom:"12px", color:"#31260C" }}>For braiders</h3>
              <p className="font-body" style={{ fontSize:"16px", lineHeight:1.8, color:"#5C3A22" }}>
                Get discovered by clients who need your skills now — show short video clips that prove your technique and style, publish clear pricing and availability, and turn views into paid bookings you can rely on.
              </p>
              <p className="font-body" style={{ fontSize:"15px", lineHeight:1.8, color:"#5C3A22", marginTop:"12px" }}>
                Video-first profiles connect you with clients who desperately need someone they can trust with their hair — meaning better matches and fewer no-shows.
              </p>
            </div>
            {/* Client-focused column */}
            <div style={{ padding:"24px", backgroundColor:"#E8EDE0", border:"1px solid #D6CEC4", display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <div style={{ width:"40px", height:"2px", backgroundColor:"#3D5212", marginBottom:"16px" }} />
              <h3 className="font-display" style={{ fontSize:"22px", marginBottom:"12px", color:"#31260C" }}>For clients searching</h3>
              <p className="font-body" style={{ fontSize:"15px", lineHeight:1.8, color:"#5C3A22" }}>
                Find verified braiders near you with real video portfolios, transparent pricing, and clear availability — book in two taps and get the look you want.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK WIN: Geolocation + Braiders Count ── */}
      <section style={{ padding:"56px 48px", backgroundColor:"#3D5212", color:"#F5F0E8", textAlign:"center" }}>
        <div style={{ maxWidth:"700px", margin:"0 auto" }}>
          <h2 className="font-display compact-heading" style={{ fontSize:"clamp(28px, 5vw, 48px)", fontWeight:700, lineHeight:1.2, marginBottom:"24px" }}>
            There are {nearbyBraidersCount > 0 ? nearbyBraidersCount : "3+"} braiders near {userCity || "you"} ready this weekend
          </h2>
          <p className="font-body" style={{ fontSize:"16px", lineHeight:1.8, opacity:.9, marginBottom:"36px" }}>
            Real video portfolios, real prices, real availability. Everything you need to book with confidence.
          </p>
          <a href="#braiders">
            <button className="btn-primary" style={{ backgroundColor:"#F5F0E8", color:"#3D5212" }}>See them now</button>
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ backgroundColor:"#EDE7DF", padding:"56px 48px" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <p className="section-label">HOW IT WORKS</p>
          <h2 className="font-display compact-heading" style={{ fontSize:"clamp(28px, 4.5vw, 38px)", fontWeight:600, marginBottom:"36px" }}>The Braidely way</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"48px" }} className="grid-3">
            {[
              { step:"01", title:"Stop asking around", body:"Stop scrolling. Stop asking friends. Stop waiting weeks. See real braiders with real video proof, transparent pricing, and actual availability in your city." },
              { step:"02", title:"Claim your date", body:"Pick your style, choose the date that works for you, send one booking request. Your braider confirms instantly. You get all the details you need." },
              { step:"03", title:"Help the next woman", body:"After your appointment, share what it was like. Your honest review helps the next Black woman in your city find her braider without the guesswork." },
            ].map((item) => (
              <div key={item.step}>
                <span className="font-display" style={{ fontSize:"48px", fontWeight:700, color:"#3D5212", lineHeight:1 }}>{item.step}</span>
                <div className="divider" />
                <h3 className="font-display" style={{ fontSize:"22px", fontWeight:600, marginBottom:"12px" }}>{item.title}</h3>
                <p className="font-body" style={{ fontSize:"14px", lineHeight:1.8, color:"#5C3A22" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section style={{ backgroundColor:"#F7F3EE", padding:"48px 24px", borderTop:"1px solid #D6CEC4", borderBottom:"1px solid #D6CEC4" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <p className="section-label">Trusted by the community</p>
          <h2 className="font-display" style={{ fontSize:"38px", fontWeight:600, marginBottom:"40px" }}>What clients are saying</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"20px" }} className="grid-3">
            {[
              { name:"Zara M.", city:"Munich", review:"I found my braider in 10 minutes. She came to my home, did the most beautiful knotless braids and her price was so fair. Never going back to the salon.", style:"Knotless Braids", stars:5 },
              { name:"Emma L.", city:"Berlin", review:"I was so nervous going to a stranger's home but her profile had everything — price, location, video. I knew exactly what I was getting before I arrived.", style:"Box Braids", stars:5 },
              { name:"Yetunde A.", city:"Frankfurt", review:"As a braider, I got three new clients in my first week on Braidely. Women in my city finally know I exist.", style:"Braider — Senegalese Twists", stars:5 },
            ].map((review) => (
              <div key={review.name} style={{ backgroundColor:"#EDE7DF", padding:"20px", border:"1px solid #D6CEC4" }}>
                <div style={{ display:"flex", gap:"4px", marginBottom:"12px" }}>
                  {Array.from({ length:review.stars }).map((_,i) => <span key={i} style={{ color:"#3D5212", fontSize:"12px" }}>★</span>)}
                </div>
                <p className="font-body" style={{ fontSize:"13px", lineHeight:1.7, color:"#5C3A22", marginBottom:"16px", fontStyle:"italic" }}>"{review.review}"</p>
                <div style={{ borderTop:"1px solid #D6CEC4", paddingTop:"12px" }}>
                  <p className="font-body" style={{ fontSize:"12px", fontWeight:700, color:"#2C1A0E" }}>{review.name}</p>
                  <p className="font-body" style={{ fontSize:"10px", color:"#9E8070", letterSpacing:"0.5px", textTransform:"uppercase", marginTop:"2px" }}>{review.city} · {review.style}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN SECTION ── */}
      <section id="join" style={{ padding:"56px 48px", maxWidth:"1100px", margin:"0 auto" }}>
        <p className="section-label">Get started today</p>
        <h2 className="font-display" style={{ fontSize:"38px", fontWeight:600, marginBottom:"8px" }}>Join Braidely — it is completely free</h2>
        <p className="font-body" style={{ fontSize:"15px", color:"#7A5C48", marginBottom:"56px" }}>
          Whether you are a Black woman looking for a braider or a braider ready to grow your clientele, this is where you belong.
        </p>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"64px" }} className="grid-2">

          {/* ── CLIENT FORM ── */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"32px" }}>
              <div style={{ width:"3px", height:"40px", backgroundColor:"#3D5212" }} />
              <h3 className="font-display" style={{ fontSize:"24px", fontWeight:600 }}>I am looking for a braider</h3>
            </div>

            {clientSubmitted ? (
              <div style={{ backgroundColor:"#EDE7DF", padding:"28px", border:"1px solid #D6CEC4" }}>
                <p className="font-body" style={{ fontSize:"15px", color:"#2C1A0E", fontWeight:700, marginBottom:"12px" }}>Booking request sent.</p>
                <p className="font-body" style={{ fontSize:"13px", color:"#7A5C48", lineHeight:1.8 }}>
                  You will receive an email confirmation once the braider accepts. A reminder with their contact details will be sent to you the day before your appointment.
                </p>
              </div>
            ) : (
              <>
                {/* Braider selector */}
                <div style={{ marginBottom:"32px", padding:"16px 20px", backgroundColor:"#EDE7DF", border:"1px solid #D6CEC4" }}>
                  {selectedBraider ? (
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <p className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", marginBottom:"6px" }}>Booking with</p>
                        <p className="font-display" style={{ fontSize:"18px", fontWeight:600, color:"#2C1A0E" }}>{selectedBraider.name}</p>
                        <p className="font-body" style={{ fontSize:"12px", color:"#7A5C48", marginTop:"2px" }}>{selectedBraider.city} · {selectedBraider.price}</p>
                      </div>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setSelectedBraider(null)}
                        style={{ fontSize:"12px" }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"12px" }}>
                        Select a braider
                      </label>
                      {braiders.length === 0 ? (
                        <p className="font-body" style={{ fontSize:"13px", color:"#A89080" }}>No braiders listed yet. Check back soon.</p>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                          {braiders.map((b: Braider) => (
                            <button
                              key={b.id || "new"}
                              type="button"
                              onClick={() => setSelectedBraider(b)}
                              style={{
                                display:"flex",
                                justifyContent:"space-between",
                                alignItems:"center",
                                padding:"12px 16px",
                                backgroundColor: ((selectedBraider as Braider | null)?.id === b.id) ? "#2C1A0E" : "#F7F3EE",
                                color: ((selectedBraider as Braider | null)?.id === b.id) ? "#F7F3EE" : "#2C1A0E",
                                border:"1px solid #D6CEC4",
                                cursor:"pointer",
                                fontFamily:"'Lato',sans-serif",
                                fontSize:"13px",
                                textAlign:"left",
                              }}
                            >
                              <span style={{ fontWeight:700 }}>{b.name}</span>
                              <span style={{ opacity:0.7 }}>{b.city} · {b.price}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <form onSubmit={handleClientSubmit} style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
                  {[
                    { label:"Full Name", type:"text", val:cName, set:setCName, placeholder:"Your name" },
                  { label:"Email Address", type:"email", val:cEmail, set:setCEmail, placeholder:"your@email.com" },
                  { label:"Your City", type:"text", val:cCity, set:setCCity, placeholder:"e.g. München, Berlin, Hamburg" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>{f.label}</label>
                    <input className="input-field" type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} required />
                  </div>
                ))}

                <div>
                  <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>Hair Style You Want</label>
                  <input className="input-field" type="text" value={cStyle} onChange={(e) => setCStyle(e.target.value)} placeholder="e.g. Knotless Braids, Box Braids, Locs" required />
                </div>

                <div>
                  <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>Preferred Date</label>
                  <input className="input-field" type="date" value={cDate} onChange={(e) => setCDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
                </div>

                <div>
                  <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>
                    Anything your braider should know before you meet <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span>
                  </label>
                  <p className="font-body" style={{ fontSize:"12px", color:"#A89080", marginBottom:"8px" }}>e.g. hair length, allergies, style reference</p>
                  <textarea className="input-field" value={cNote} onChange={(e) => setCNote(e.target.value)} placeholder="Write any details here..." rows={3} style={{ resize:"vertical", paddingTop:"8px" }} />
                </div>

                <button className="btn-primary" type="submit">Send Booking Request</button>
                <p className="font-body" style={{ fontSize:"11px", color:"#A89080", lineHeight:1.6 }}>
                  Braider contact details are shared only after your booking is confirmed. A reminder email is sent the day before your appointment.
                </p>
                </form>
              </>
            )}
          </div>

          {/* ── BRAIDER SIGNUP FORM ── */}
          <div id="braider-form">
            <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"16px" }}>
              <div style={{ width:"3px", height:"40px", backgroundColor:"#2C1A0E" }} />
              <h3 className="font-display" style={{ fontSize:"24px", fontWeight:600 }}>I am a braider</h3>
            </div>

            {braiderSubmitted ? (
              <div style={{ backgroundColor:"#EDE7DF", padding:"28px", border:"1px solid #D6CEC4" }}>
                <p className="font-body" style={{ fontSize:"15px", color:"#2C1A0E", fontWeight:700, marginBottom:"12px" }}>Welcome to Braidely.</p>
                <p className="font-body" style={{ fontSize:"13px", color:"#7A5C48", lineHeight:1.8 }}>Your profile is live. Clients in your city can now find and book you directly.</p>
              </div>
            ) : (
              <>
                {/* Step indicator */}
                <div className="step-indicator">
                  {[1,2,3].map((s) => <div key={s} className={`step-dot${braiderStep >= s ? " active" : ""}`} />)}
                </div>
                <p className="font-body" style={{ fontSize:"11px", color:"#9E8070", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"28px" }}>
                  Step {braiderStep} of 3 — {braiderStep === 1 ? "Who you are" : braiderStep === 2 ? "What you offer" : "Your portfolio"}
                </p>

                {/* STEP 1 */}
                {braiderStep === 1 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
                    {/* Photo upload */}
                    <div>
                      <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>Profile Photo</label>
                      {photoPreview && <img src={photoPreview} alt="preview" style={{ width:"80px", height:"80px", objectFit:"cover", borderRadius:"50%", marginBottom:"10px", border:"2px solid #D6CEC4" }} />}
                      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }}} style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#5C3A22" }} />
                    </div>

                    {[
                      { label:"Full Name", val:bName, set:setBName, placeholder:"Your name", type:"text", req:true },
                      { label:"Email Address", val:bEmail, set:setBEmail, placeholder:"your@email.com", type:"email", req:true },
                      { label:"WhatsApp Number", val:bWhatsapp, set:setBWhatsapp, placeholder:"+49 176 XXXXXXXX", type:"tel", req:true },
                      { label:"Your City", val:bCity, set:setBCity, placeholder:"e.g. München, Berlin, Hamburg", type:"text", req:true },
                      { label:"Nearest Bus or U-Bahn Stop", val:bStop, set:setBStop, placeholder:"e.g. Marienplatz, Ostbahnhof", type:"text", req:false },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>{f.label}</label>
                        <input className="input-field" type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} required={f.req} />
                      </div>
                    ))}

                    <button className="btn-primary" type="button" onClick={() => { if(bName && bEmail && bWhatsapp && bCity) setBraiderStep(2); }}>
                      Continue
                    </button>
                  </div>
                )}

                {/* STEP 2 */}
                {braiderStep === 2 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"32px" }}>

                    {/* Price list */}
                    <div>
                      <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"12px" }}>Price List</label>
                      <div style={{ border:"1px solid #D6CEC4", overflow:"hidden" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 40px", backgroundColor:"#EDE7DF", padding:"8px 12px", gap:"8px" }}>
                          <span className="font-body" style={{ fontSize:"11px", fontWeight:700, color:"#9E8070", letterSpacing:"1px", textTransform:"uppercase" }}>Style</span>
                          <span className="font-body" style={{ fontSize:"11px", fontWeight:700, color:"#9E8070", letterSpacing:"1px", textTransform:"uppercase" }}>Price (€)</span>
                          <span />
                        </div>
                        {priceRows.map((row, i) => (
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 100px 40px", padding:"8px 12px", gap:"8px", borderTop:"1px solid #D6CEC4", alignItems:"center" }}>
                            <input className="input-field" value={row.style} onChange={(e) => updatePriceRow(i,"style",e.target.value)} placeholder="e.g. Knotless Braids" style={{ borderBottom:"1px solid #E0D8D0", padding:"6px 4px" }} />
                            <input className="input-field" value={row.price} onChange={(e) => updatePriceRow(i,"price",e.target.value)} placeholder="80" type="number" style={{ borderBottom:"1px solid #E0D8D0", padding:"6px 4px" }} />
                            <button className="btn-ghost" type="button" onClick={() => removePriceRow(i)} style={{ fontSize:"16px", padding:"4px 8px" }}>×</button>
                          </div>
                        ))}
                        <div style={{ padding:"8px 12px", borderTop:"1px solid #D6CEC4" }}>
                          <button className="btn-sm" type="button" onClick={addPriceRow}>+ Add style</button>
                        </div>
                      </div>
                    </div>

                    {/* Home service */}
                    <div>
                      <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"12px" }}>Do you offer home service?</label>
                      <div style={{ display:"flex", gap:"8px" }}>
                        {["I come to you","You come to me","Both"].map((opt) => (
                          <button key={opt} type="button" className={`service-card${bHomeService === opt ? " active" : ""}`} onClick={() => setBHomeService(opt)}>{opt}</button>
                        ))}
                      </div>
                    </div>

                    {/* Salon */}
                    <div>
                      <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"12px" }}>Do you own or work in a salon?</label>
                      <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
                        {["Yes","No"].map((opt) => (
                          <button key={opt} type="button" className={`service-card${bHasSalon === opt ? " active" : ""}`} onClick={() => setBHasSalon(opt)} style={{ flex:"0 0 auto", padding:"10px 24px" }}>{opt}</button>
                        ))}
                      </div>
                      {bHasSalon === "Yes" && (
                        <input className="input-field" value={bSalonAddress} onChange={(e) => setBSalonAddress(e.target.value)} placeholder="Salon name and full address" />
                      )}
                    </div>

                    {/* Availability */}
                    <div>
                      <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"12px" }}>Availability — tap a day to set hours</label>
                      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"16px" }}>
                        {DAYS.map((day) => (
                          <button key={day} type="button" className={`day-btn${availability[day].enabled ? " active" : ""}`} onClick={() => toggleDay(day)}>{day}</button>
                        ))}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                        {DAYS.filter((d) => availability[d].enabled).map((day) => (
                          <div key={day} className="day-row" style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                            <span className="font-body" style={{ fontSize:"13px", fontWeight:700, color:"#2C1A0E", width:"40px" }}>{day}</span>
                            <select className="select-field" value={availability[day].from} onChange={(e) => setDayTime(day,"from",e.target.value)} style={{ width:"100px" }}>
                              {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="font-body" style={{ fontSize:"13px", color:"#9E8070" }}>to</span>
                            <select className="select-field" value={availability[day].to} onChange={(e) => setDayTime(day,"to",e.target.value)} style={{ width:"100px" }}>
                              {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display:"flex", gap:"12px" }}>
                      <button className="btn-outline" type="button" onClick={() => setBraiderStep(1)}>Back</button>
                      <button className="btn-primary" type="button" onClick={() => setBraiderStep(3)}>Continue</button>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {braiderStep === 3 && (
                  <form onSubmit={handleBraiderSubmit} style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
                    <div>
                      <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>Portfolio Video</label>
                      <p className="font-body" style={{ fontSize:"12px", color:"#A89080", marginBottom:"8px" }}>Upload a short video of your braiding work. This is what clients will see first on your profile.</p>
                      <input type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) setVideoFile(f); }} style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#5C3A22" }} />
                      {videoFile && <p className="font-body" style={{ fontSize:"12px", color:"#6B8F5E", marginTop:"8px" }}>Video selected: {videoFile.name}</p>}
                    </div>

                    <div>
                      <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>
                        Short Bio <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span>
                      </label>
                      <textarea className="input-field" value={bBio} onChange={(e) => setBBio(e.target.value)} placeholder="Tell clients a little about yourself and your braiding experience..." rows={3} style={{ resize:"vertical", paddingTop:"8px" }} />
                    </div>

                    {uploadProgress && (
                      <p className="font-body" style={{ fontSize:"13px", color:"#6B8F5E", fontStyle:"italic" }}>{uploadProgress}</p>
                    )}
                    {braiderError && (
                      <p className="font-body" style={{ fontSize:"13px", color:"#C0392B" }}>{braiderError}</p>
                    )}

                    {/* Delete profile note */}
                    <p className="font-body" style={{ fontSize:"11px", color:"#A89080", lineHeight:1.7, borderTop:"1px solid #D6CEC4", paddingTop:"16px" }}>
                      You can delete your profile at any time by emailing us at hello@braidely.com. All your data will be permanently removed within 48 hours in accordance with GDPR.
                    </p>

                    <div style={{ display:"flex", gap:"12px" }}>
                      <button className="btn-outline" type="button" onClick={() => setBraiderStep(2)}>Back</button>
                      <button className="btn-primary" type="submit" disabled={braiderLoading}>
                        {braiderLoading ? "Saving..." : "List My Profile Free"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── BRAID BUDDY ── */}
      <section id="braid-buddy" style={{ backgroundColor:"#F0F4EC", padding:"80px 48px" }}>
        <div style={{ maxWidth:"960px", margin:"0 auto" }}>

          {/* Part A — Header */}
          <p className="section-label">Find your braid buddy</p>
          <div style={{ width:"100%", maxHeight:"480px", overflow:"hidden", borderRadius:"2px", margin:"20px 0 32px" }}>
            <img
              src="/braid_buddy_hero.jpg"
              alt="Two women braiding together"
              style={{ width:"100%", height:"480px", objectFit:"cover", objectPosition:"center top", display:"block" }}
            />
          </div>
          <h2 className="font-display" style={{ fontSize:"clamp(28px,4vw,42px)", fontWeight:700, color:"#31260C", marginBottom:"16px", lineHeight:1.2 }}>
            Two women. Two sets of hands. No invoice.
          </h2>
          <p className="font-body" style={{ fontSize:"16px", color:"#5C3A22", lineHeight:1.9, maxWidth:"580px", marginBottom:"0" }}>
            You know how to braid. She knows how to braid. You both need your hair done. This is where you find each other.
          </p>

          {/* Part B — New to city callout */}
          <div style={{ backgroundColor:"#1C2B1A", color:"white", padding:"32px 40px", margin:"40px 0", borderRadius:"2px" }}>
            <h3 className="font-display" style={{ fontSize:"28px", fontWeight:700, color:"white", lineHeight:1.2 }}>New city. No connections.</h3>
            <p className="font-body" style={{ fontSize:"15px", color:"#A0B898", lineHeight:1.9, marginTop:"16px", marginBottom:"32px" }}>
              You don&apos;t know anyone. You don&apos;t know where to find anything. The city feels big and lonely. Finding your people starts with finding someone who understands your hair.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              {[
                "Tell us what styles you can do and what styles you want done",
                "We show you women near you who are a good swap",
                "You agree on terms — free swap, pay each other, your choice",
              ].map((text, i) => (
                <div key={i} style={{ display:"flex", gap:"20px", alignItems:"flex-start", borderLeft:"3px solid #3D5212", paddingLeft:"20px" }}>
                  <span className="font-display" style={{ fontSize:"32px", fontWeight:700, color:"#B8AF53", lineHeight:1, minWidth:"32px" }}>{i + 1}</span>
                  <p className="font-body" style={{ fontSize:"14px", color:"#C8D6BF", lineHeight:1.8, paddingTop:"6px" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Part C — Signup form */}
          <div style={{ maxWidth:"600px" }}>
            <h3 className="font-display" style={{ fontSize:"24px", fontWeight:600, color:"#31260C", marginBottom:"32px" }}>
              Join as a Braid Buddy — it is free
            </h3>

            {buddySubmitted ? (
              <div style={{ backgroundColor:"#EDE7DF", padding:"28px", border:"1px solid #D6CEC4" }}>
                <p className="font-body" style={{ fontSize:"15px", color:"#2C1A0E", fontWeight:700, marginBottom:"8px" }}>You are on the list.</p>
                <p className="font-body" style={{ fontSize:"13px", color:"#7A5C48", lineHeight:1.8 }}>
                  We will notify you when we find your braid buddy in your city.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBuddySubmit} style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
                {[
                  { label:"Full Name", type:"text", val:buddyName, set:setBuddyName, placeholder:"Your name", req:true },
                  { label:"Email Address", type:"email", val:buddyEmail, set:setBuddyEmail, placeholder:"your@email.com", req:true },
                  { label:"WhatsApp Number", type:"tel", val:buddyWhatsapp, set:setBuddyWhatsapp, placeholder:"+49 176 XXXXXXXX", req:true },
                  { label:"Your City", type:"text", val:buddyCity, set:setBuddyCity, placeholder:"e.g. München, Berlin, Hamburg", req:true },
                  { label:"Styles I Can Do", type:"text", val:buddyCanDo, set:setBuddyCanDo, placeholder:"e.g. Knotless braids, Box braids, Locs", req:true },
                  { label:"Styles I Want Done", type:"text", val:buddyWantDone, set:setBuddyWantDone, placeholder:"e.g. Goddess locs, Twists, Cornrows", req:true },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>{f.label}</label>
                    <input className="input-field" type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} required={f.req} />
                  </div>
                ))}

                <div>
                  <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"12px" }}>Preferred Arrangement</label>
                  <div style={{ display:"flex", gap:"8px" }}>
                    {["Free swap", "Pay each other", "Flexible"].map((opt) => (
                      <button key={opt} type="button" className={`service-card${buddyArrangement === opt ? " active" : ""}`} onClick={() => setBuddyArrangement(opt)}>{opt}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-body" style={{ fontSize:"11px", letterSpacing:"2px", textTransform:"uppercase", color:"#9E8070", display:"block", marginBottom:"8px" }}>
                    About You <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span>
                  </label>
                  <textarea className="input-field" value={buddyBio} onChange={(e) => setBuddyBio(e.target.value)} placeholder="Tell potential braid buddies a little about yourself..." rows={3} style={{ resize:"vertical", paddingTop:"8px" }} />
                </div>

                <button className="btn-primary" type="submit" disabled={buddyLoading}>
                  {buddyLoading ? "Saving..." : "Find My Braid Buddy"}
                </button>

                {/* Part D — Trust note */}
                <p className="font-body" style={{ fontSize:"12px", color:"#9E8070", lineHeight:1.7, borderTop:"1px solid #D6CEC4", paddingTop:"16px" }}>
                  Always meet in a safe public space first. Tell someone where you are going. Your safety is your priority. Braidely connects you but your wellbeing comes first.
                </p>
              </form>
            )}
          </div>

          {/* Part E — Public buddy profiles */}
          <h3 className="font-display" style={{ fontSize:"28px", fontWeight:600, color:"#31260C", marginTop:"64px", marginBottom:"8px" }}>Braid Buddies near you</h3>
          <p className="font-body" style={{ fontSize:"14px", color:"#73673D", marginBottom:"40px" }}>
            Browse women looking for a braid swap in your city. Reach out directly on WhatsApp.
          </p>

          {buddies.length === 0 ? (
            <p className="font-body" style={{ fontSize:"14px", color:"#9E8070", fontStyle:"italic", padding:"40px", textAlign:"center" }}>
              No braid buddies in your city yet. Be the first to join.
            </p>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"24px" }} className="grid-3">
              {buddies.map((b, i) => (
                <div key={b.id ?? i} style={{ backgroundColor:"#EDE7DF", border:"1px solid #D6CEC4", padding:"24px", borderRadius:"2px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
                    <span className="font-display" style={{ fontSize:"18px", fontWeight:600, color:"#31260C" }}>{b.name}</span>
                  </div>
                  <span className="tag">{b.city}</span>

                  <p className="font-body" style={{ fontSize:"11px", color:"#9E8070", letterSpacing:"2px", textTransform:"uppercase", marginTop:"12px", marginBottom:"4px" }}>Can do</p>
                  <p className="font-body" style={{ fontSize:"13px", color:"#5A6E58", marginBottom:"0" }}>{b.canDo}</p>

                  <p className="font-body" style={{ fontSize:"11px", color:"#9E8070", letterSpacing:"2px", textTransform:"uppercase", marginTop:"10px", marginBottom:"4px" }}>Wants done</p>
                  <p className="font-body" style={{ fontSize:"13px", color:"#5A6E58" }}>{b.wantDone}</p>

                  {b.arrangement && (
                    <span style={{ display:"inline-block", backgroundColor:"#C8D6BF", color:"#2D5016", fontSize:"11px", fontWeight:700, letterSpacing:"1px", padding:"4px 10px", marginTop:"8px", fontFamily:"'Lato',sans-serif", textTransform:"uppercase" }}>
                      {b.arrangement}
                    </span>
                  )}

                  <a
                    href={`https://wa.me/${(b.whatsapp ?? "").replace(/\s+/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display:"block", width:"100%", marginTop:"16px", textAlign:"center", backgroundColor:"#3D5212", color:"#F7F3EE", padding:"14px 36px", fontFamily:"'Lato',sans-serif", fontSize:"13px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", textDecoration:"none" }}
                  >
                    WhatsApp
                  </a>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* CONTACT */}
      <section style={{ backgroundColor:"#EDE7DF", padding:"80px 48px", borderTop:"1px solid #D6CEC4" }}>
        <div style={{ maxWidth:"560px", margin:"0 auto" }}>
          <p className="section-label">Get in touch</p>
          <h2 className="font-display" style={{ fontSize:"36px", fontWeight:600, marginBottom:"12px" }}>
            Have a question?
          </h2>
          <p className="font-body" style={{ fontSize:"15px", color:"#7A5C48", marginBottom:"48px", lineHeight:1.8 }}>
            Whether you are a braider with questions about joining, a client who needs help, or someone who wants to partner with us — we would love to hear from you.
          </p>

          <ContactForm />
        </div>
      </section>

      {/* ── COMING SOON ── */}
      <section style={{ backgroundColor:"#2C1A0E", color:"#F7F3EE", padding:"100px 48px", textAlign:"center" }}>
        <p className="section-label" style={{ color:"#A8C89A" }}>Something is coming</p>
        <h2 className="font-display" style={{ fontSize:"40px", fontWeight:600, lineHeight:1.3, maxWidth:"640px", margin:"0 auto 24px" }}>
          The full Braidely platform is being built — and it starts with you.
        </h2>
        <p className="font-body" style={{ fontSize:"16px", color:"#B09880", maxWidth:"520px", margin:"0 auto 20px", lineHeight:1.9 }}>
          For too long, finding someone to do your hair as a Black woman in Europe has meant asking around for weeks, hoping a friend of a friend knows someone, and still showing up not knowing what to expect.
        </p>
        <p className="font-body" style={{ fontSize:"16px", color:"#B09880", maxWidth:"520px", margin:"0 auto 20px", lineHeight:1.9 }}>
          We are building a dedicated space where Black women can scroll real video portfolios, discover braiders in their city, and book with confidence — the same way you would find anything else in 2026.
        </p>
        <p className="font-body" style={{ fontSize:"16px", color:"#C9BFB3", maxWidth:"520px", margin:"0 auto 48px", lineHeight:1.9, fontStyle:"italic" }}>
          Your hair deserves care that understands it. Leave your email and be the first to know when we launch in your city.
        </p>
        {notifySubmitted ? (
          <p className="font-body" style={{ color:"#A8C89A", fontSize:"16px", fontStyle:"italic" }}>You are on the list. We will reach out when Braidely launches near you.</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setNotifySubmitted(true); }} style={{ display:"flex", justifyContent:"center", maxWidth:"460px", margin:"0 auto" }}>
            <input type="email" placeholder="Enter your email address" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} required style={{ flex:1, backgroundColor:"transparent", border:"1px solid #5C3A22", borderRight:"none", padding:"14px 20px", color:"#F7F3EE", fontFamily:"'Lato',sans-serif", fontSize:"14px", outline:"none" }} />
            <button type="submit" style={{ backgroundColor:"#3D5212", color:"#F7F3EE", border:"1px solid #3D5212", padding:"14px 28px", fontFamily:"'Lato',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap" }}>Notify Me</button>
          </form>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor:"#1A0E07", color:"#6B4F3A", padding:"32px 48px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
        <span className="font-display" style={{ fontSize:"18px", color:"#9E7A60" }}>Braidely</span>
        <span className="font-body" style={{ fontSize:"12px", letterSpacing:"1px" }}>© 2026 Braidely. Built for Black women across Europe.</span>
        <Link href="/privacy" className="font-body" style={{ fontSize:"12px", color:"#6B4F3A", textDecoration:"none", letterSpacing:"1px" }}>Privacy Policy</Link>
      </footer>
    </main>
  );
}