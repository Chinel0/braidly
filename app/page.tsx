export default function Home() {
  return (
    <main className="min-h-screen bg-[#1A0A2E] text-white">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5">
        <h1 className="text-2xl font-bold text-[#E8A838]">Braidly</h1>
        <button className="bg-[#6B2D8B] text-white px-5 py-2 rounded-full text-sm font-semibold">
          Join as Braider
        </button>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24">
        <h2 className="text-5xl font-bold leading-tight max-w-2xl">
          Find a trusted African hair braider near you in Europe
        </h2>
        <p className="mt-6 text-lg text-purple-300 max-w-xl">
          Browse braiders in your city, see their work, and book instantly.
        </p>
        <div className="mt-10 flex gap-4">
          <button className="bg-[#E8A838] text-[#1A0A2E] px-8 py-3 rounded-full font-bold text-lg">
            Find a Braider
          </button>
          <button className="border border-purple-400 text-purple-300 px-8 py-3 rounded-full font-semibold text-lg">
            I am a Braider
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#2A1A3E] px-8 py-16">
        <h3 className="text-center text-3xl font-bold mb-12">How Braidly Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-4xl mb-4">🔍</div>
            <h4 className="text-xl font-bold text-[#E8A838]">Browse</h4>
            <p className="text-purple-300 mt-2">Find braiders in your city and scroll their video portfolios</p>
          </div>
          <div>
            <div className="text-4xl mb-4">📅</div>
            <h4 className="text-xl font-bold text-[#E8A838]">Book</h4>
            <p className="text-purple-300 mt-2">Pick your style and available date and send a booking request</p>
          </div>
          <div>
            <div className="text-4xl mb-4">✨</div>
            <h4 className="text-xl font-bold text-[#E8A838]">Get Braided</h4>
            <p className="text-purple-300 mt-2">Show up and get your hair done by a trusted braider near you</p>
          </div>
        </div>
      </section>

      {/* Email capture */}
      <section className="flex flex-col items-center text-center px-6 py-20">
        <h3 className="text-3xl font-bold">Launching soon in your city</h3>
        <p className="text-purple-300 mt-3">Be the first to know when Braidly arrives near you</p>
        <div className="mt-8 flex gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-5 py-3 rounded-full text-black w-72 focus:outline-none"
          />
          <button className="bg-[#E8A838] text-[#1A0A2E] px-6 py-3 rounded-full font-bold">
            Notify Me
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-purple-400 text-sm py-8 border-t border-purple-900">
        © 2025 Braidly · Find your braider anywhere in Europe
      </footer>

    </main>
  )
}