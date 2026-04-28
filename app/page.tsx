"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { uploadToCloudinary } from "../lib/cloudinary";

function normalizeCityName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const heroImages = [
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
  city: string;
  styles: string;
  price: string;
  available: string;
  photoUrl: string;
  videoUrl: string;
  homeService: string;
  transportStop: string;
}

export default function Home() {
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
      let photoUrl = "";
      let videoUrl = "";
      if (photoFile) {
        setUploadProgress("Uploading photo...");
        photoUrl = await uploadToCloudinary(photoFile, "image");
      }
      if (videoFile) {
        setUploadProgress("Uploading video...");
        videoUrl = await uploadToCloudinary(videoFile, "video");
      }
      setUploadProgress("");
      const priceText = priceRows.filter((r) => r.style && r.price).map((r) => `${r.style} — €${r.price}`).join(", ");
      const availText = DAYS.filter((d) => availability[d].enabled).map((d) => `${d} ${availability[d].from}–${availability[d].to}`).join(", ");
      await addDoc(collection(db, "braiders"), {
        name: bName, email: bEmail, whatsapp: bWhatsapp,
        city: bCity, transportStop: bStop, bio: bBio,
        homeService: bHomeService, hasSalon: bHasSalon,
        salonAddress: bSalonAddress, styles: priceText,
        price: priceRows[0]?.price ? `From €${priceRows[0].price}` : "",
        available: availText, photoUrl, videoUrl,
        createdAt: Timestamp.now(),
      });
      setBraiderSubmitted(true);
    } catch (err) {
      setBraiderError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setBraiderLoading(false);
    }
  }

  // ── client booking ──
  const [clientSubmitted, setClientSubmitted] = useState(false);
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
        status: "pending", createdAt: Timestamp.now(),
      });
      setClientSubmitted(true);
    } catch (err) { console.error(err); }
  }

  // ── notify ──
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  return (
    <main style={{ fontFamily: "'Georgia','Times New Roman',serif", backgroundColor: "#F7F3EE", color: "#2C1A0E", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#F7F3EE;}
        .font-display{font-family:'Playfair Display',Georgia,serif;}
        .font-body{font-family:'Lato',sans-serif;}
        .btn-primary{background:#7A3B1E;color:#F7F3EE;padding:14px 36px;border:none;cursor:pointer;font-family:'Lato',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;transition:background .25s;}
        .btn-primary:hover{background:#5C2A12;}
        .btn-primary:disabled{background:#C9BFB3;cursor:not-allowed;}
        .btn-outline{background:transparent;color:#2C1A0E;padding:14px 36px;border:1.5px solid #2C1A0E;cursor:pointer;font-family:'Lato',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;transition:all .25s;}
        .btn-outline:hover{background:#2C1A0E;color:#F7F3EE;}
        .btn-sm{background:#7A3B1E;color:#F7F3EE;padding:6px 14px;border:none;cursor:pointer;font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
        .btn-ghost{background:transparent;color:#9E8070;padding:6px 10px;border:1px solid #D6CEC4;cursor:pointer;font-family:'Lato',sans-serif;font-size:11px;}
        .card{background:#EDE7DF;border:1px solid #D6CEC4;overflow:hidden;}
        .video-frame{width:100%;aspect-ratio:9/16;background:#C9BFB3;position:relative;overflow:hidden;}
        .input-field{width:100%;background:transparent;border:none;border-bottom:1.5px solid #9E8070;padding:10px 4px;font-family:'Lato',sans-serif;font-size:14px;color:#2C1A0E;outline:none;transition:border-color .2s;}
        .input-field:focus{border-bottom-color:#7A3B1E;}
        .input-field::placeholder{color:#A89080;}
        .select-field{width:100%;background:transparent;border:none;border-bottom:1.5px solid #9E8070;padding:10px 4px;font-family:'Lato',sans-serif;font-size:14px;color:#2C1A0E;outline:none;appearance:none;cursor:pointer;}
        .tag{display:inline-block;background:#D6CEC4;color:#5C3A22;font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;}
        .divider{width:60px;height:2px;background:#7A3B1E;margin:20px 0;}
        .section-label{font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6B8F5E;margin-bottom:16px;}
        .city-item:hover{background:#EDE7DF;}
        .day-btn{padding:8px 12px;border:1.5px solid #D6CEC4;background:transparent;cursor:pointer;font-family:'Lato',sans-serif;font-size:12px;font-weight:700;color:#5C3A22;transition:all .2s;}
        .day-btn.active{background:#7A3B1E;border-color:#7A3B1E;color:#F7F3EE;}
        .service-card{flex:1;padding:14px 10px;border:1.5px solid #D6CEC4;background:transparent;cursor:pointer;font-family:'Lato',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5C3A22;text-align:center;transition:all .2s;}
        .service-card.active{background:#2C1A0E;border-color:#2C1A0E;color:#F7F3EE;}
        .step-indicator{display:flex;gap:8px;margin-bottom:32px;}
        .step-dot{width:28px;height:4px;background:#D6CEC4;transition:background .3s;}
        .step-dot.active{background:#7A3B1E;}
        .hero-img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.88);}
        .hero-img-card{overflow:hidden;position:relative;border-radius:2px;height:180px;}
        .hero-img-label{position:absolute;bottom:0;left:0;right:0;padding:24px 12px 10px;background:linear-gradient(to top,rgba(44,26,14,.72),transparent);font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F7F3EE;}
        .sage-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#7AAF6A;margin-right:8px;vertical-align:middle;}
        @media(max-width:768px){
          .grid-3{grid-template-columns:1fr!important;}
          .grid-2{grid-template-columns:1fr!important;}
          .hero-title{font-size:36px!important;}
          .hero-img-grid{grid-template-columns:1fr!important;}
          .hero-img-card{height:140px!important;}
          nav{padding:18px 24px!important;}
          .day-row{flex-direction:column!important;}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 48px", borderBottom:"1px solid #D6CEC4", backgroundColor:"#F7F3EE", position:"sticky", top:0, zIndex:100 }}>
        <span className="font-display" style={{ fontSize:"22px", fontWeight:600, letterSpacing:"-0.5px", color:"#2C1A0E" }}>Braidely</span>
        <div style={{ display:"flex", gap:"24px", alignItems:"center" }}>
          <a href="#braiders" style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#2C1A0E", textDecoration:"none" }}>Browse Braiders</a>
          <a href="#join"><button className="btn-primary" style={{ padding:"10px 24px" }}>Join Free</button></a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding:"80px 48px 60px", maxWidth:"1100px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"48px" }}>
          <p className="section-label">For Black women across Germany</p>
          <h1 className="font-display hero-title" style={{ fontSize:"54px", fontWeight:700, lineHeight:1.15, color:"#2C1A0E", marginBottom:"16px" }}>
            Find a trusted braider near you<br />
            <em style={{ fontWeight:400, color:"#7A3B1E" }}>in minutes, not weeks</em>
          </h1>
          <p className="font-body" style={{ fontSize:"14px", color:"#2C1A0E", opacity:.45, marginBottom:"4px", letterSpacing:".5px" }}>
            Your next favourite braider is closer than you think
          </p>
          <p className="font-body" style={{ fontSize:"16px", lineHeight:1.8, color:"#5C3A22", maxWidth:"540px", margin:"16px auto 36px" }}>
            Browse real video portfolios from skilled Black hair braiders in your city. See their work, check availability, and book — all in one place.
          </p>
          <p className="font-body" style={{ fontSize:"13px", color:"#6B8F5E", maxWidth:"480px", margin:"0 auto 36px", padding:"12px 16px", backgroundColor:"#EDE7DF", borderLeft:"3px solid #6B8F5E", textAlign:"left", lineHeight:1.7 }}>
            Find. Book. Show up. No questions needed — every braider profile tells you exactly what to expect before you arrive.
          </p>
          <div style={{ display:"flex", gap:"16px", justifyContent:"center", flexWrap:"wrap" }}>
            <a href="#braiders"><button className="btn-primary">Browse Braiders</button></a>
            <a href="#join"><button className="btn-outline">I am a Braider</button></a>
          </div>
        </div>

        {/* Hero images */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", maxWidth:"720px", margin:"0 auto" }} className="hero-img-grid">
          {heroImages.map((img) => (
            <div key={img.label} className="hero-img-card">
              <img src={img.url} alt={img.alt} className="hero-img" />
              <div className="hero-img-label">{img.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", justifyContent:"center", gap:"32px", marginTop:"28px", flexWrap:"wrap" }}>
          {["Knotless Braids","Box Braids","Locs","Twists","Crochet","Fulani"].map((s) => (
            <span key={s} className="font-body" style={{ fontSize:"12px", color:"#6B8F5E", letterSpacing:"1px" }}>
              <span className="sage-dot" />{s}
            </span>
          ))}
        </div>
      </section>

      {/* ── PAIN POINT ── */}
      <section style={{ backgroundColor:"#2C1A0E", color:"#F7F3EE", padding:"72px 48px" }}>
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
          </div>
        </div>
      </section>

      {/* ── EXPLORE BRAIDERS ── */}
      <section id="braiders" style={{ padding:"80px 48px", maxWidth:"1200px", margin:"0 auto" }}>
        <p className="section-label">Browse portfolios</p>
        <h2 className="font-display" style={{ fontSize:"38px", fontWeight:600, marginBottom:"8px" }}>Explore Braiders</h2>
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
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"28px" }} className="grid-3">
            {braiders.map((braider) => (
              <div key={braider.id} className="card" style={{ borderRadius:"2px" }}>
                <div className="video-frame">
                  {braider.videoUrl ? (
                    <video src={braider.videoUrl} controls style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <div style={{ width:"100%", height:"100%", backgroundColor:"#C9BFB3", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"12px" }}>
                      {braider.photoUrl
                        ? <img src={braider.photoUrl} alt={braider.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <>
                            <div style={{ width:"48px", height:"48px", borderRadius:"50%", backgroundColor:"#7A3B1E", display:"flex", alignItems:"center", justifyContent:"center" }}>
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
                    <span className="font-body" style={{ fontSize:"15px", fontWeight:700, color:"#7A3B1E" }}>{braider.price}</span>
                  </div>
                  <p className="font-body" style={{ fontSize:"13px", color:"#7A5C48", marginBottom:"6px", lineHeight:1.6 }}>{braider.styles}</p>
                  {braider.transportStop && (
                    <p className="font-body" style={{ fontSize:"12px", color:"#9E8070", marginBottom:"6px" }}>Near: {braider.transportStop}</p>
                  )}
                  {braider.homeService && (
                    <p className="font-body" style={{ fontSize:"12px", color:"#6B8F5E", marginBottom:"6px", fontWeight:700 }}>{braider.homeService}</p>
                  )}
                  <p className="font-body" style={{ fontSize:"12px", color:"#9E8070", marginBottom:"20px", fontStyle:"italic" }}>{braider.available}</p>
                  <a href="#join"><button className="btn-primary" style={{ width:"100%" }}>Book Appointment</button></a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── REVIEWS ── */}
      <section style={{ backgroundColor:"#F7F3EE", padding:"80px 48px", borderTop:"1px solid #D6CEC4", borderBottom:"1px solid #D6CEC4" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <p className="section-label">Trusted by the community</p>
          <h2 className="font-display" style={{ fontSize:"38px", fontWeight:600, marginBottom:"48px" }}>What clients are saying</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"28px" }} className="grid-3">
            {[
              { name:"Adaeze O.", city:"Munich", review:"I found my braider in 10 minutes. She came to my home, did the most beautiful knotless braids and her price was so fair. Never going back to the salon.", style:"Knotless Braids", stars:5 },
              { name:"Blessing N.", city:"Berlin", review:"I was so nervous going to a stranger's home but her profile had everything — price, location, video. I knew exactly what I was getting before I arrived.", style:"Box Braids", stars:5 },
              { name:"Yetunde A.", city:"Frankfurt", review:"As a braider, I got three new clients in my first week on Braidely. Women in my city finally know I exist.", style:"Braider — Senegalese Twists", stars:5 },
            ].map((review) => (
              <div key={review.name} style={{ backgroundColor:"#EDE7DF", padding:"28px", border:"1px solid #D6CEC4" }}>
                <div style={{ display:"flex", gap:"4px", marginBottom:"16px" }}>
                  {Array.from({ length:review.stars }).map((_,i) => <span key={i} style={{ color:"#7A3B1E", fontSize:"14px" }}>★</span>)}
                </div>
                <p className="font-body" style={{ fontSize:"14px", lineHeight:1.8, color:"#5C3A22", marginBottom:"20px", fontStyle:"italic" }}>"{review.review}"</p>
                <div style={{ borderTop:"1px solid #D6CEC4", paddingTop:"16px" }}>
                  <p className="font-body" style={{ fontSize:"13px", fontWeight:700, color:"#2C1A0E" }}>{review.name}</p>
                  <p className="font-body" style={{ fontSize:"11px", color:"#9E8070", letterSpacing:"1px", textTransform:"uppercase", marginTop:"2px" }}>{review.city} · {review.style}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ backgroundColor:"#EDE7DF", padding:"80px 48px" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <p className="section-label">Simple by design</p>
          <h2 className="font-display" style={{ fontSize:"38px", fontWeight:600, marginBottom:"56px" }}>How Braidely works</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"48px" }} className="grid-3">
            {[
              { step:"01", title:"Discover", body:"Browse real video portfolios from Black hair braiders near you. See their price list, location, and availability before you decide." },
              { step:"02", title:"Book", body:"Choose your style, pick a date, and send one booking request. Your braider confirms and you get a confirmation email." },
              { step:"03", title:"Review", body:"After your appointment, share a short review. Help other Black women in the community find great braiders." },
            ].map((item) => (
              <div key={item.step}>
                <span className="font-display" style={{ fontSize:"48px", fontWeight:700, color:"#D6CEC4", lineHeight:1 }}>{item.step}</span>
                <div className="divider" />
                <h3 className="font-display" style={{ fontSize:"22px", fontWeight:600, marginBottom:"12px" }}>{item.title}</h3>
                <p className="font-body" style={{ fontSize:"14px", lineHeight:1.8, color:"#5C3A22" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN SECTION ── */}
      <section id="join" style={{ padding:"80px 48px", maxWidth:"1100px", margin:"0 auto" }}>
        <p className="section-label">Get started today</p>
        <h2 className="font-display" style={{ fontSize:"38px", fontWeight:600, marginBottom:"8px" }}>Join Braidely — it is completely free</h2>
        <p className="font-body" style={{ fontSize:"15px", color:"#7A5C48", marginBottom:"56px" }}>
          Whether you are a Black woman looking for a braider or a braider ready to grow your clientele, this is where you belong.
        </p>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"64px" }} className="grid-2">

          {/* ── CLIENT FORM ── */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"32px" }}>
              <div style={{ width:"3px", height:"40px", backgroundColor:"#7A3B1E" }} />
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
            )}
          </div>

          {/* ── BRAIDER SIGNUP FORM ── */}
          <div>
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
            <button type="submit" style={{ backgroundColor:"#7A3B1E", color:"#F7F3EE", border:"1px solid #7A3B1E", padding:"14px 28px", fontFamily:"'Lato',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap" }}>Notify Me</button>
          </form>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor:"#1A0E07", color:"#6B4F3A", padding:"32px 48px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
        <span className="font-display" style={{ fontSize:"18px", color:"#9E7A60" }}>Braidely</span>
        <span className="font-body" style={{ fontSize:"12px", letterSpacing:"1px" }}>© 2026 Braidely. Built for Black women across Europe.</span>
        <a href="#" className="font-body" style={{ fontSize:"12px", color:"#6B4F3A", textDecoration:"none", letterSpacing:"1px" }}>Privacy Policy</a>
      </footer>
    </main>
  );
}