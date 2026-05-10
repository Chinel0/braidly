"use client";
import { use, useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

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

export default function BraiderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [braider, setBraider] = useState<Braider | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "braiders", id));
        if (snap.exists()) {
          setBraider({ id: snap.id, ...snap.data() } as Braider);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const styleRows = braider?.styles
    ? braider.styles.split(", ").map((s) => {
        const [style, price] = s.split(" — ");
        return { style, price };
      })
    : [];

  const availDays = braider?.available
    ? braider.available.split(", ")
    : [];

  return (
    <main style={{ fontFamily: "'Georgia','Times New Roman',serif", backgroundColor: "#F7F3EE", color: "#2C1A0E", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .font-display{font-family:'Playfair Display',Georgia,serif;}
        .font-body{font-family:'Lato',sans-serif;}
        .tag{display:inline-block;background:#D6CEC4;color:#5C3A22;font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;}
        .btn-primary{display:inline-block;background:#3D5212;color:#F7F3EE;padding:16px 40px;border:none;cursor:pointer;font-family:'Lato',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;transition:background .25s;}
        .btn-primary:hover{background:#2E3D0D;}
        .divider{width:48px;height:2px;background:#3D5212;margin:20px 0;}
        @media(max-width:768px){
          .profile-grid{grid-template-columns:1fr!important;}
          .hero-video{min-height:300px!important;}
        }
      `}</style>

      {/* Nav */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 40px", borderBottom:"1px solid #D6CEC4", backgroundColor:"#F7F3EE", position:"sticky", top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:"20px", fontWeight:600, color:"#2C1A0E", textDecoration:"none" }}>Braidely</Link>
        <Link href="/#braiders" style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#2C1A0E", textDecoration:"none" }}>Browse Braiders</Link>
      </nav>

      {loading && (
        <div style={{ textAlign:"center", padding:"120px 40px" }}>
          <p className="font-body" style={{ fontSize:"14px", color:"#9E8070", letterSpacing:"2px", textTransform:"uppercase" }}>Loading profile...</p>
        </div>
      )}

      {notFound && (
        <div style={{ textAlign:"center", padding:"120px 40px" }}>
          <p className="font-display" style={{ fontSize:"28px", color:"#5C3A22", marginBottom:"16px" }}>Braider not found</p>
          <Link href="/" className="btn-primary">Back to Braidely</Link>
        </div>
      )}

      {braider && (
        <>
          {/* Hero — video or photo */}
          <div className="hero-video" style={{ width:"100%", maxHeight:"520px", minHeight:"380px", position:"relative", overflow:"hidden", backgroundColor:"#C9BFB3" }}>
            {braider.videoUrl ? (
              <video
                src={braider.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }}
              />
            ) : braider.photoUrl ? (
              <img src={braider.photoUrl} alt={braider.name} style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", minHeight:"380px" }}>
                <p className="font-body" style={{ color:"#9E8070", letterSpacing:"2px", textTransform:"uppercase", fontSize:"12px" }}>No portfolio yet</p>
              </div>
            )}
            {/* Gradient overlay at bottom */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"180px", background:"linear-gradient(to top, rgba(44,26,14,0.85), transparent)" }} />
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"32px 40px" }}>
              <p className="font-body" style={{ fontSize:"11px", letterSpacing:"3px", textTransform:"uppercase", color:"#A8C89A", marginBottom:"8px" }}>Braider in {braider.city}</p>
              <h1 className="font-display" style={{ fontSize:"clamp(32px, 6vw, 52px)", fontWeight:700, color:"#F7F3EE", lineHeight:1.1 }}>{braider.name}</h1>
            </div>
          </div>

          {/* Profile body */}
          <div style={{ maxWidth:"960px", margin:"0 auto", padding:"56px 40px" }}>
            <div className="profile-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"64px", alignItems:"start" }}>

              {/* Left col — info */}
              <div>
                {/* Price + city */}
                <div style={{ display:"flex", gap:"12px", alignItems:"center", flexWrap:"wrap", marginBottom:"32px" }}>
                  <span className="tag">{braider.city}</span>
                  {braider.price && (
                    <span className="font-body" style={{ fontSize:"18px", fontWeight:700, color:"#3D5212" }}>{braider.price}</span>
                  )}
                </div>

                {/* Bio */}
                {braider.bio && (
                  <>
                    <div className="divider" />
                    <p className="font-body" style={{ fontSize:"15px", lineHeight:1.9, color:"#5C3A22", marginBottom:"40px" }}>{braider.bio}</p>
                  </>
                )}

                {/* Styles & pricing */}
                {styleRows.length > 0 && (
                  <>
                    <div className="divider" />
                    <p className="font-body" style={{ fontSize:"11px", fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:"#6B8F5E", marginBottom:"16px" }}>Styles & Pricing</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"40px" }}>
                      {styleRows.map((row, i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:"10px", borderBottom:"1px solid #E8E0D6" }}>
                          <span className="font-body" style={{ fontSize:"14px", color:"#2C1A0E" }}>{row.style}</span>
                          <span className="font-body" style={{ fontSize:"14px", fontWeight:700, color:"#3D5212" }}>{row.price}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Home service */}
                {braider.homeService && (
                  <p className="font-body" style={{ fontSize:"13px", color:"#6B8F5E", fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"8px" }}>
                    {braider.homeService === "I come to you" ? "Comes to your home" : braider.homeService === "You come to me" ? "You visit the braider" : "Home service available"}
                  </p>
                )}

                {/* Transport stop */}
                {braider.transportStop && (
                  <p className="font-body" style={{ fontSize:"13px", color:"#9E8070", marginBottom:"8px" }}>Nearest stop: {braider.transportStop}</p>
                )}

                {/* Salon */}
                {braider.hasSalon === "Yes" && braider.salonAddress && (
                  <p className="font-body" style={{ fontSize:"13px", color:"#9E8070", marginBottom:"8px" }}>Salon: {braider.salonAddress}</p>
                )}
              </div>

              {/* Right col — availability + CTA */}
              <div>
                {/* Availability */}
                {availDays.length > 0 && (
                  <>
                    <div className="divider" />
                    <p className="font-body" style={{ fontSize:"11px", fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:"#6B8F5E", marginBottom:"16px" }}>Availability</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"40px" }}>
                      {availDays.map((day, i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", backgroundColor:"#EDE7DF", borderRadius:"2px" }}>
                          <span className="font-body" style={{ fontSize:"13px", fontWeight:700, color:"#2C1A0E" }}>{day.split(" ")[0]}</span>
                          <span className="font-body" style={{ fontSize:"13px", color:"#7A5C48" }}>{day.split(" ").slice(1).join(" ")}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* CTA */}
                <div style={{ backgroundColor:"#31260C", padding:"32px", borderRadius:"2px" }}>
                  <p className="font-display" style={{ fontSize:"22px", fontWeight:600, color:"#F7F3EE", marginBottom:"12px", lineHeight:1.3 }}>Book {braider.name.split(" ")[0]}</p>
                  <p className="font-body" style={{ fontSize:"13px", color:"#B09880", lineHeight:1.7, marginBottom:"24px" }}>
                    Send a booking request through Braidely. You will receive confirmation and contact details within 24 hours.
                  </p>
                  <Link href={`/#join`} className="btn-primary" style={{ display:"block", textAlign:"center" }}>
                    Request a Booking
                  </Link>
                  {braider.whatsapp && (
                    <a
                      href={`https://wa.me/${braider.whatsapp.replace(/\s+/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display:"block", textAlign:"center", marginTop:"12px", fontFamily:"'Lato',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#A8C89A", textDecoration:"none" }}
                    >
                      WhatsApp {braider.name.split(" ")[0]}
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <footer style={{ borderTop:"1px solid #D6CEC4", padding:"24px 40px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <Link href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:"16px", color:"#9E7A60", textDecoration:"none" }}>Braidely</Link>
            <span className="font-body" style={{ fontSize:"12px", color:"#9E8070" }}>Find braiders across Germany</span>
          </footer>
        </>
      )}
    </main>
  );
}
