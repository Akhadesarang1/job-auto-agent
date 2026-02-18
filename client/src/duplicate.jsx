import emailjs from "@emailjs/browser";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import InteractiveText from "./Effects/InteractiveText";
import SplitText from "./Effects/SplitText";
import SpotlightCard from "./Effects/SpotlightCard";
import TiltedCard from "./Effects/TiltedCard";
import CustomCursor from "./Effects/CustomCursor";

gsap.registerPlugin(ScrollTrigger);

// --- COMPONENT: Intro Animation Loader ---
const TechStackLoader = ({ techStack, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("shuffle"); // 'shuffle' | 'logo-reveal'

  useEffect(() => {
    // Phase 1: Shuffle Icons
    if (currentIndex < techStack.length) {
      const timeout = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      // Shuffle done, show main logo
      setPhase("logo-reveal");

      // Keep main logo in center for 1.2s, then trigger the fly-to-nav
      const timeout = setTimeout(() => {
        onComplete();
      }, 1400);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, techStack.length, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      // We animate the background opacity out when the component unmounts
      exit={{ opacity: 0, transition: { duration: 0.30, ease: "easeInOut" } }}
    >
      {/* Container for the centered content */}
      <div className="relative flex flex-col items-center justify-center w-full h-full">

        <AnimatePresence mode="wait">
          {phase === "shuffle" ? (
            // --- Phase 1: Tech Stack Shuffle ---
            <motion.div
              key="shuffle"
              initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1.2, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)", transition:{duration: 0.5} }}
              className="flex flex-col items-center"
            >
              {techStack[currentIndex] && (
                <img
                  src={techStack[currentIndex].icon}
                  alt="Tech Icon"
                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                />
              )}
            </motion.div>
          ) : (
            // --- Phase 2: Main Logo & Text (Centered) ---
            // NOTICE: The layoutId props here match the ones in the Navbar
            <motion.div className="flex items-center gap-4 z-50">
                <motion.img
                  layoutId="main-logo-img"
                  src="/logo.webp"
                  alt="Rohith's Logo"
                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-full border-4 border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.5)]"
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                />
                <motion.h1
                  layoutId="main-logo-text"
                  className="text-3xl sm:text-5xl font-bold text-gray-100 whitespace-nowrap"
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                  Rohith's Portfolio
                </motion.h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// --- MAIN LANDING COMPONENT ---
const Landing = () => {
  const heroRef = useRef(null);
  const [isContactModalOpen, setContactModalOpen] = useState(false);
  const [mainMenuOpen, setMainMenuOpen] = useState(false);

  // isLoading controls whether we see the Loader or the actual Page
  const [isLoading, setIsLoading] = useState(true);

  const navItems = [
    { label: "Home", href: "#home" },
    { label: "About Me", href: "#about" },
    { label: "Tech Stack", href: "#tech-stack" },
    { label: "Projects", href: "#projects" },
    { label: "Experience", href: "#experience" },
    { label: "Certifications", href: "#certifications" },
  ];

  const techStack = [
    { name: "Deep Learning", icon: "/DeepLearning.webp" },
    { name: "Express.js", icon: "/express-js.webp" },
    { name: "Figma", icon: "/Figma-logo.webp" },
    { name: "MongoDB", icon: "/Mongodb.webp" },
    { name: "Node.js", icon: "/Node.js_logo.svg.webp" },
    { name: "Python", icon: "/Python.webp" },
    { name: "React", icon: "/React.webp" },
    { name: "Tailwind CSS", icon: "/Tailwind_CSS_Logo.webp" },
    {name : "Grafana", icon:  "/Grafana.webp"},
    {name : "HuggingFace", icon:  "/HuggingFace.webp"},
    {name : "gcp", icon:  "/gcp.webp"},
    {name : "Docker", icon:  "Docker.webp"},
  ];

  const sendEmail = (e) => {
    e.preventDefault();
    const form = e.target;
    emailjs.sendForm("service_sh057qd", "template_2vmky28", form, "CcFtpOjqJJUhsgyIK")
      .then(() => { alert("Message sent!"); setContactModalOpen(false); form.reset(); },
      (error) => { alert(`Failed: ${error.text}`); });
  };

  useEffect(() => {
    // Only initialize GSAP after loading is complete and layout is settled
    if (isLoading) return;

    const hero = heroRef.current;
    // Small delay to ensure the shared element transition finishes before scroll triggers attach
    const timer = setTimeout(() => {
        if (hero) {
          gsap.fromTo( hero, { opacity: 1 }, { opacity: 0.7, ease: "power2.out",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.5, },
          });

          const heroTextElements = hero.querySelectorAll(".hero-text-anim > div > span > span");
          if (heroTextElements.length > 0) {
            gsap.fromTo( heroTextElements,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, ease: "power3.out", stagger: 0.1, duration: 0.8,
                scrollTrigger: { trigger: hero, start: "top 70%", end: "top 40%", scrub: 1, },
              }
            );
          }
        }
    }, 1000);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [isLoading]);

  const toggleMainMenu = () => setMainMenuOpen((prev) => !prev);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMainMenuOpen(false);
  };

  return (
    <><div className="min-h-screen flex flex-col bg-black text-white relative selection:bg-indigo-500 selection:text-white antialiased overflow-x-hidden">
      <CustomCursor />

      {/* --- 1. THE LOADER --- */}
      {/* We use AnimatePresence to allow the loader's black background to fade out */}
      <AnimatePresence>
        {isLoading && (
          <TechStackLoader
            techStack={techStack}
            onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* --- 2. THE NAVBAR (Revealed immediately when loading stops) --- */}
      {/* By using layoutId, the Logo and Text will 'fly' from the Loader position to here */}
      {!isLoading && (
        <motion.header
          // Animate the background glass effect fading in, NOT the logo (it flies in)
          initial={{ backgroundColor: "rgba(0,0,0,0)", borderBottomColor: "rgba(0,0,0,0)" }}
          animate={{ backgroundColor: "rgba(0,0,0,0.75)", borderBottomColor: "rgba(38,38,38,0.6)" }}
          transition={{ duration: 1, delay: 0.5 }} // Background fades in slowly after logo arrives
          className="sticky top-0 z-[1000] backdrop-blur-lg shadow-2xl shadow-black/20 border-b border-neutral-800/60"
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center py-3.5 px-4 sm:px-6 lg:px-8">
            <motion.a
              href="#home"
              onClick={(e) => handleNavClick(e, "#home")}
              className="flex items-center space-x-3.5 cursor-pointer-interactive group"
            >
              {/* TARGET: The Logo lands here */}
              <motion.img
                layoutId="main-logo-img"
                src="/logo.webp"
                alt="Rohith's Logo"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-full border-2 border-indigo-500/60 group-hover:border-indigo-400"
                transition={{ type: "spring", stiffness: 200, damping: 25 }} />
              {/* TARGET: The Text lands here */}
              <motion.h1
                layoutId="main-logo-text"
                className="text-xl sm:text-2xl font-semibold text-gray-100 group-hover:text-white tracking-tight"
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              >
                Rohith's Portfolio
              </motion.h1>
            </motion.a>

            {/* Hamburger / Nav Links fade in separately */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <button
                onClick={toggleMainMenu}
                className="text-gray-300 hover:text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 cursor-pointer-interactive"
              >
                {mainMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
              </button>
            </motion.div>
          </div>

          <AnimatePresence>
            {mainMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-0 right-0 bg-black/90 backdrop-blur-md border-t border-b border-neutral-800/70 shadow-2xl md:rounded-b-lg md:mx-4 lg:mx-auto lg:max-w-md md:right-4 md:left-auto"
              >
                <nav className="px-4 py-4 space-y-2">
                  {navItems.map((item, index) => (
                    <motion.a
                      key={index} href={item.href} onClick={(e) => handleNavClick(e, item.href)}
                      className="block text-gray-200 hover:text-white px-4 py-2.5 rounded-lg hover:bg-indigo-600/40 transition-all duration-200"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.07 }}
                    >
                      {item.label}
                    </motion.a>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      )}

      {/* --- 3. MAIN PAGE CONTENT (Fades in after logo movement) --- */}
      <main className="flex-grow isolate">
        <section ref={heroRef} id="home" className="relative bg-black text-white py-28 md:py-36 min-h-[90vh] flex items-center bg-center bg-cover bg-fixed"
          style={{ backgroundImage: "url('/img_9.webp')" }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
            {/* Delay animations until after the logo has flown to the corner */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: isLoading ? 0 : 1.0, ease: "easeOut" }}
            >
              <div className="hero-text-anim">
                <SplitText text="Embark on a New Journey"
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white text-center !leading-tight"
                  delay={30} animationFrom={{ opacity: 0, transform: "translate3d(0,50px,0) rotateX(-20deg)", }}
                  animationTo={{ opacity: 1, transform: "translate3d(0,0,0) rotateX(0deg)" }}
                  easing="circOut" textAlign="center" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: isLoading ? 0 : 1.3, ease: "easeOut" }}
              className="mt-5 mb-3 h-12"
            >
              <InteractiveText className="cursor-pointer-interactive" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: isLoading ? 0 : 1.5, ease: "easeOut" }}
              className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-gray-200/90 leading-relaxed"
            >
              Crafting cutting-edge digital solutions that bring ideas to life.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: isLoading ? 0 : 1.7, type: "spring" }}
              className="mt-10 flex justify-center gap-4"
            >
              <a href="#projects" onClick={(e) => handleNavClick(e, "#projects")}
                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105">
                Explore My Work ✨
              </a>
            </motion.div>
          </div>
        </section>

        {/* About Me Section - KEPT AS IS */}
        <section id="about" className="py-20 md:py-24 bg-black relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} viewport={{ once: true, amount: 0.3 }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-10 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative group">
                About Me
                <span className="absolute bottom-0 left-1/2 w-36 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform -translate-x-1/2 translate-y-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full group-hover:w-40 ease-out"></span>
              </h2>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }} viewport={{ once: true, amount: 0.3 }}
              className="p-8 bg-neutral-900/70 backdrop-blur-sm rounded-xl border border-neutral-800/80 hover:border-indigo-500/50 transition-all duration-300 mb-12 shadow-xl hover:shadow-indigo-500/10">
              <p className="text-lg md:text-xl text-gray-200/95 leading-relaxed">
                I blend cutting-edge technology with creative thinking to build
                digital experiences that solve real problems. With deep
                expertise in <span className="font-semibold text-indigo-400">MERN stack</span>
                , <span className="font-semibold text-cyan-400">AI/ML solutions</span>, and{" "}
                <span className="font-semibold text-purple-400">UI/UX design</span>, I thrive
                on pushing the boundaries of what's possible. Passionate about
                technology’s ever-evolving landscape, I constantly explore new
                trends, frameworks, and innovations to stay ahead of the curve.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 150 }} viewport={{ once: true, amount: 0.5 }}>
              <a href="https://drive.google.com/file/d/1fNS3dupfxzsSNZhXiHlcX7WIHVcKmaGx/view?usp=sharing" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View My Resume
              </a>
            </motion.div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section id="tech-stack" className="relative py-20 md:py-28 bg-black overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-cyan-600/25 to-blue-600/25 rounded-full blur-3xl -top-32 -left-32 animate-pulse"></div>
            <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-purple-600/25 to-pink-600/25 rounded-full blur-3xl -bottom-32 -right-32 animate-pulse delay-700"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} viewport={{ once: true, amount: 0.3 }}>
              <div className="mb-16 md:mb-20">
                <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-5">
                  Powering Innovation
                </h2>
                <p className="text-gray-300/90 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                  Combining cutting-edge technologies with modern development
                  practices to create
                  <span className="text-cyan-400 font-semibold"> performant</span>
                  ,<span className="text-blue-400 font-semibold"> scalable</span>,
                  and
                  <span className="text-purple-400 font-semibold"> intuitive</span> solutions.
                </p>
              </div>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6 place-items-center">
              {techStack.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  className="group relative p-5 w-full h-52 md:h-56 rounded-xl bg-neutral-900/80 hover:bg-neutral-800/60 border border-neutral-800/70 hover:border-cyan-500/60 transition-all duration-300 ease-out flex flex-col items-center justify-center cursor-pointer-interactive shadow-lg hover:shadow-cyan-500/10"
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  whileHover={{ scale: 1.04, y: -4, transition: { type: "spring", stiffness: 300, damping: 10 } }}
                  transition={{ duration: 0.4, delay: index * 0.06, type: "spring", stiffness: 180, damping: 15 }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <motion.img src={tech.icon} alt={tech.name} className="h-12 w-12 sm:h-14 sm:w-14 object-contain mb-2.5 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.45)] transition-all duration-300" />
                  <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-300 transition-all duration-300">
                    {tech.name}
                  </h3>
                  <p className="text-gray-400/90 text-[11px] sm:text-xs mt-1.5 group-hover:text-gray-300 transition-colors font-medium text-center px-1">
                    {tech.description}
                  </p>
                </motion.div>
              ))}
            </div>
            <motion.div className="mt-20 md:mt-24 mx-auto w-2/5 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} transition={{ duration: 1.2, delay: 0.3, ease: "circOut" }} viewport={{ once: true }} />
            <motion.div className="mt-12 md:mt-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }} viewport={{ once: true }}>
              <p className="text-gray-300/90 text-lg max-w-3xl mx-auto leading-relaxed">
                Every tool in my arsenal is carefully selected for its
                performance, ecosystem, and maintainability. I specialize in
                creating full-stack solutions that leverage AI capabilities
                while maintaining{" "}
                <span className="text-cyan-400 font-semibold">peak performance</span>
                and <span className="text-blue-400 font-semibold">developer-friendly</span> architectures.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <a href="#projects" onClick={(e) => handleNavClick(e, "#projects")} className="px-7 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-semibold text-white hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30 focus:outline-none focus:ring-4 focus:ring-cyan-500/50">
                  See Projects
                </a>
                <button className="px-7 py-3 border-2 border-cyan-500/40 text-cyan-400 rounded-lg font-semibold hover:border-cyan-400/70 hover:bg-cyan-500/10 transition-all duration-300 hover:text-cyan-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50">
                  Tech Insights
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-20 md:py-24 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} viewport={{ once: true, amount: 0.3 }}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl text-center font-extrabold mb-12 md:mb-16 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative group">
                Projects
                <span className="absolute bottom-0 left-1/2 w-28 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform -translate-x-1/2 translate-y-3 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full group-hover:w-32 ease-out"></span>
              </h2>
            </motion.div>
            {/* --- Project Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-stretch">
              {/* Project 1: Plant Disease Detection */}
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }} viewport={{ once: true, amount: 0.2 }} className="h-full flex">
                <SpotlightCard className="p-6 flex flex-col justify-between h-full bg-neutral-900/80 hover:bg-neutral-800/70 border border-neutral-800/80 hover:border-indigo-500/60 rounded-xl shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 ease-in-out group cursor-pointer-interactive w-full">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-100 group-hover:text-indigo-300 transition-colors">Plant Disease Detection</h3>
                    </div>
                    <div className="mb-5 rounded-lg overflow-hidden border border-neutral-700/80 group-hover:border-indigo-500/50 transition-all duration-300 shadow-md aspect-video">
                      <video loading="lazy" autoPlay loop muted playsInline className="w-full h-full object-cover" preload="metadata"> <source src="/project-demo.webm" type="video/webm" /> Your browser does not support the video tag. </video>
                    </div>
                    <p className="text-gray-300/90 leading-relaxed mb-6 text-sm">AI-powered web application that identifies plant diseases from images using CNN models. Provides detailed analysis and preventive measures.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-700/60 pt-4 mt-auto">
                    <a href="https://github.com/rohith-2809/mern-test" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors duration-200 group/link">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1.5 transition-transform group-hover/link:scale-110"> <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.699-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /> </svg>
                      <span className="font-medium text-sm">Source Code</span>
                    </a>
                    <a href="https://mern-test-client.onrender.com/" target="_blank" rel="noopener noreferrer" className="flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/40">
                      <span className="mr-2">Live Demo</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /> </svg>
                    </a>
                  </div>
                </SpotlightCard>
              </motion.div>

              {/* Project 2: DocuAgent AI (New) */}
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }} viewport={{ once: true, amount: 0.2 }} className="h-full flex">
                <SpotlightCard className="p-6 flex flex-col justify-between h-full bg-neutral-900/80 hover:bg-neutral-800/70 border border-neutral-800/80 hover:border-emerald-500/60 rounded-xl shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 ease-in-out group cursor-pointer-interactive w-full">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3M5.636 5.636l-1.414-1.414M19.778 19.778l-1.414-1.414M18.364 5.636l1.414-1.414M4.222 19.778l1.414-1.414M12 12a3 3 0 100-6 3 3 0 000 6z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a6 6 0 01-6 6H4.5a2.25 2.25 0 01-2.25-2.25V15M12 12a6 6 0 006 6h1.5a2.25 2.25 0 002.25-2.25V15M12 12a6 6 0 01-6-6V4.5a2.25 2.25 0 012.25-2.25H9M12 12a6 6 0 006-6V4.5a2.25 2.25 0 00-2.25-2.25H15" /> </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-100 group-hover:text-emerald-300 transition-colors">DocuAgent AI</h3>
                    </div>
                    <div className="mb-5 rounded-lg overflow-hidden border border-neutral-700/80 group-hover:border-emerald-500/50 transition-all duration-300 shadow-md aspect-video">
                      <video loading="lazy" autoPlay loop muted playsInline className="w-full h-full object-cover" preload="metadata"> <source src="/DocuAgent-demo.webm" type="video/webm" /> Your browser does not support the video tag. </video>
                    </div>
                    <p className="text-gray-300/90 leading-relaxed mb-6 text-sm">An intelligent agent that automates software documentation by generating UML diagrams and code explanations directly from a given codebase.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-700/60 pt-4 mt-auto">
                    <a href="https://github.com/rohith-2809" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-400 hover:text-emerald-400 transition-colors duration-200 group/link">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1.5 transition-transform group-hover/link:scale-110"> <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.699-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /> </svg>
                      <span className="font-medium text-sm">Source Code</span>
                    </a>
                    <a href="https://docuagent-2vp4.onrender.com/" target="_blank" rel="noopener noreferrer" className="flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-md font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/40">
                      <span className="mr-2">Live Demo</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /> </svg>
                    </a>
                  </div>
                </SpotlightCard>
              </motion.div>

              {/* Project 3: AI Model Deployment */}
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }} viewport={{ once: true, amount: 0.2 }} className="h-full flex">
                <SpotlightCard className="p-6 flex flex-col justify-between h-full bg-neutral-900/80 hover:bg-neutral-800/70 border border-neutral-800/80 hover:border-teal-500/60 rounded-xl shadow-xl hover:shadow-teal-500/20 transition-all duration-300 ease-in-out group cursor-pointer-interactive w-full">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center border border-teal-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A7.962 7.962 0 0112 2c2.497 0 4.792.995 6.486 2.628C21.5 6.914 22 9.828 22 12c0 2.172-.5 5-2.343 6.657z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 00-6-6c0 1.931.786 3.673 2.056 4.944A6.005 6.005 0 0012 18z" /> </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-100 group-hover:text-teal-300 transition-colors">AI Model Deployment</h3>
                    </div>
                    <div className="mb-5 rounded-lg overflow-hidden border border-neutral-700/80 group-hover:border-teal-500/50 transition-all duration-300 shadow-md aspect-video">
                      <video loading="lazy" autoPlay loop muted playsInline className="w-full h-full object-cover" preload="metadata">
                        <source src="/ai-deployment-demo.webm" type="video/webm" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className="text-gray-300/90 leading-relaxed mb-6 text-sm">End-to-end MLOps solution deploying machine learning models via Hugging Face and Flask APIs. Demonstrates real-time predictions.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-700/60 pt-4 mt-auto">
                    <a href="https://github.com/rohith-2809" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-400 hover:text-teal-400 transition-colors duration-200 group/link">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1.5 transition-transform group-hover/link:scale-110"> <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.699-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /> </svg>
                      <span className="font-medium text-sm">Source Code</span>
                    </a>
                    <a href="https://huggingface.co/vittamraj" target="_blank" rel="noopener noreferrer" className="flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-md font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-teal-500/40">
                      <span className="mr-2">Explore Models</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /> </svg>
                    </a>
                  </div>
                </SpotlightCard>
              </motion.div>

              {/* Project 4: Employee Management */}
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }} viewport={{ once: true, amount: 0.2 }} className="h-full flex">
                <SpotlightCard className="p-6 flex flex-col justify-between h-full bg-neutral-900/80 hover:bg-neutral-800/70 border border-neutral-800/80 hover:border-purple-500/60 rounded-xl shadow-xl hover:shadow-purple-500/20 transition-all duration-300 ease-in-out group cursor-pointer-interactive w-full">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-100 group-hover:text-purple-300 transition-colors">Employee Management</h3>
                    </div>
                    <div className="mb-5 rounded-lg overflow-hidden border border-neutral-700/80 group-hover:border-purple-500/50 transition-all duration-300 shadow-md aspect-video">
                      <video loading="lazy" autoPlay loop muted playsInline className="w-full h-full object-cover" preload="metadata"> <source src="/EMS.webm" type="video/webm" /> Your browser does not support the video tag. </video>
                    </div>
                    <p className="text-gray-300/90 leading-relaxed mb-6 text-sm">A fast, responsive app built with React, Tailwind, and Vite to manage employee data using local storage — no backend needed.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-700/60 pt-4 mt-auto">
                    <a href="https://github.com/rohith-2809/Employee_management_system" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-400 hover:text-purple-400 transition-colors duration-200 group/link">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1.5 transition-transform group-hover/link:scale-110"> <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.699-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /> </svg>
                      <span className="font-medium text-sm">Source Code</span>
                    </a>
                    <a href="https://employee-management-system-jdxe.onrender.com" target="_blank" rel="noopener noreferrer" className="flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-md font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/40">
                      <span className="mr-2">Live Demo</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /> </svg>
                    </a>
                  </div>
                </SpotlightCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Experience Section */}
       // In the Experience section (around line 885), replace the entire section with:

{/* Experience Section */}
<section id="experience" className="py-20 md:py-24 bg-black text-white relative overflow-hidden">
  {/* Background gradient elements */}
  <div className="absolute inset-0 opacity-10">
    <motion.div
      className="absolute w-[600px] h-[600px] bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl -top-48 -left-48"
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      viewport={{ once: true }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-600/15 to-pink-600/15 rounded-full blur-3xl -bottom-40 -right-40"
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
      viewport={{ once: true }}
    />
  </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
    <motion.h2
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease:"easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
      className="text-4xl md:text-5xl font-bold mb-10 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative inline-block"
    >
      Professional Journey
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
        viewport={{ once: true }}
      />
    </motion.h2>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease:"easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
      className="mb-16"
    >
      <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-neutral-900/50 to-black/70 backdrop-blur-sm rounded-2xl border border-neutral-800/60 hover:border-indigo-500/40 transition-all duration-500 shadow-2xl hover:shadow-indigo-500/10">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </motion.div>

          <div className="text-left">
            <motion.h3
              className="text-2xl font-bold text-white mb-2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              BuildFlow Technologies Pvt. Ltd.
            </motion.h3>
            <motion.p
              className="text-lg text-cyan-400 font-medium mb-1"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
            >
              Full Stack Developer Intern • June 2024 - Aug 2024
            </motion.p>
            <motion.p
              className="text-gray-400"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
            >
              Remote • Full-time Internship
            </motion.p>
          </div>
        </div>

        <motion.div
          className="space-y-4 text-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Enhanced user experience across multiple web applications",
              "Built high-quality, responsive web applications using MERN stack",
              "Implemented seamless end-to-end connections between frontend and backend",
              "Collaborated with teams to deliver scalable solutions"
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="flex items-start gap-3 group"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ x: 5 }}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-300/90 group-hover:text-white transition-colors duration-200">
                  {item}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>

    <motion.div
      className="mt-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
      viewport={{ once: true }}
    >
      <h3 className="text-2xl font-bold text-white mb-6">Internship Certificate</h3>

      <motion.div
        className="relative inline-block"
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
        viewport={{ once: true }}
      >
        <a
          href="https://drive.google.com/file/d/1G8Xkw0S_TF99Bz3gbyvjwFU70QEIsE0g/view"
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <TiltedCard
            imageSrc="/Intern.webp"
            altText="Internship Certificate from BuildFlow Technologies Pvt. Ltd."
            captionText="View Certificate"
            containerHeight="380px"
            containerWidth="300px"
            imageHeight="380px"
            imageWidth="300px"
            scaleOnHover={1.04}
            rotateAmplitude={7}
            showMobileWarning={true}
            showTooltip={true}
            tooltipText="Click to view full certificate"
            className="shadow-2xl shadow-indigo-900/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/40 transition-all duration-300 cursor-pointer-interactive"
          />

          <motion.div
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm font-semibold text-white group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click to verify
            </span>
          </motion.div>
        </a>
      </motion.div>
    </motion.div>
  </div>
</section>

      {/* Certifications Section */}
      {/* Certifications Section */}
      <section id="certifications" className="py-20 md:py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            className="mb-12 md:mb-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative group">
              Certifications & Expertise
              <span className="absolute bottom-0 left-1/2 w-44 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform -translate-x-1/2 translate-y-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full group-hover:w-48 ease-out"></span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            className="max-w-3xl mx-auto mb-12 md:mb-16 text-center"
          >
            <p className="text-lg text-gray-300/90 leading-relaxed">
              Earned through Google's rigorous professional certification programs on
              Coursera, these credentials validate expertise in cutting-edge
              technologies. Each represents 100+ hours of coursework, hands-on
              projects, and industry-aligned assessments.
            </p>
            <motion.div
              className="mt-8 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-600 w-36 mx-auto rounded-full"
              initial={{ scaleX: 0, originX: 0.5 }}
              whileInView={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "circOut" }}
              viewport={{ once: true }} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {[
              {
                text: "Google Machine Learning",
                link: "https://coursera.org/share/27665abf668c0479e649f09c01ce75b9",
                image: "/MachineLearningPreview.webp",
                description: "Mastering predictive algorithms and data-driven model development",
              },
              {
                text: "Google AI Essentials",
                link: "https://coursera.org/share/e76522223bd36da3f4a8feeb93d2d2f7",
                image: "/AiPreview.webp",
                description: "Foundational knowledge in neural networks and AI system implementation",
              },
              {
                text: "Google User Experience Design",
                link: "https://coursera.org/share/c617189e47b33926082172340be87f71",
                image: "/PreviewUX.webp",
                description: "User-centered design principles and interaction research methodologies",
              },
              {
                text: "Google Advanced Data Analytics",
                link: "https://coursera.org/share/09e30d48b4d38a664c30b12795d8b144",
                image: "/Google Advanced Data Analytics Capstone.webp",
                description: "Examine data to identify patterns and trends, build models using machine learning techniques, and create data visualizations.",
              },
              {
                text: "Automate Cybersecurity Tasks with Python",
                link: "https://coursera.org/share/b00ad7de4b6962060b8d47800927b352",
                image: "/Google Python.webp",
                description: "Enhancing cybersecurity workflows through Python scripting and automated threat detection.",
              },
              {
                text: "Connect and Protect: Networks and Network Security",
                link: "https://coursera.org/share/9bd3492f4984a22b035647ca0e151226",
                image: "/Google networking.webp",
                description: "Mastering network architecture, intrusion prevention, and system hardening for secure digital environments.",
              },
            ].map((cert, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                whileInView={{ scale: 1, opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 130,
                  damping: 18,
                  delay: idx * 0.1 + 0.2,
                }}
                whileHover={{
                  scale: 1.03,
                  y: -6,
                  transition: { type: "spring", stiffness: 300, damping: 10 },
                }}
                viewport={{ once: true, amount: 0.2 }}
                className="relative group h-full flex"
              >
                <a
                  href={cert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col w-full bg-gradient-to-br from-neutral-900/90 to-black/95 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-400 h-full border border-neutral-800/70 hover:border-indigo-500/60 cursor-pointer-interactive"
                >
                  <div className="relative overflow-hidden aspect-video">
                    <img
                      src={cert.image}
                      alt={`${cert.text} Certification`}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-400 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-6 space-y-3 flex-grow flex flex-col">
                    <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 group-hover:from-blue-300 group-hover:to-pink-300 transition-all duration-300 leading-tight">
                      {cert.text}
                    </h3>
                    <p className="text-sm text-gray-400/90 group-hover:text-gray-300/95 transition-colors duration-300 flex-grow leading-relaxed">
                      {cert.description}
                    </p>
                    <div className="mt-auto pt-3">
                      <span className="inline-flex items-center px-4 py-2 bg-indigo-600 group-hover:bg-indigo-500 rounded-md text-sm font-semibold text-white transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                        <span>View Credential</span>
                        <svg
                          className="w-4 h-4 ml-2 transform group-hover:translate-x-0.5 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-xl" />
                </a>
                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden rounded-tr-xl">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-700 opacity-10 group-hover:opacity-15 rotate-45 transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Get Quote Section */}
      <section id="get-quote" className="relative py-20 md:py-28 bg-black text-white text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
          <motion.div className="absolute -top-40 -left-40 w-96 h-96 md:w-[550px] md:h-[550px] bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl" initial={{ scale: 0.7, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 2.5, ease: "circOut" }} viewport={{ once: true, amount: 0.1 }} />
          <motion.div className="absolute -bottom-40 -right-40 w-96 h-96 md:w-[550px] md:h-[550px] bg-gradient-to-l from-purple-600/20 to-pink-600/20 rounded-full blur-3xl" initial={{ scale: 0.7, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 2.5, ease: "circOut", delay: 0.3 }} viewport={{ once: true, amount: 0.1 }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <motion.h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} viewport={{ once: true, amount: 0.5 }}>
            Ready to Start Your Project?
          </motion.h2>
          <motion.p className="text-lg text-gray-300/90 mb-10 leading-relaxed" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }} viewport={{ once: true, amount: 0.5 }}>
            Let's collaborate to create something extraordinary. Reach out today!
          </motion.p>
          <motion.button
            onClick={() => setContactModalOpen(true)}
            className="relative group inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-lg font-semibold text-white transition-all duration-300 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-indigo-500/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/60"
            whileHover={{ scale: 1.05, y: -2, transition: { type: "spring", stiffness: 300, damping: 10 } }} whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10">Get Quote   <span className="inline-block group-hover:animate-bounce">💡</span></span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-150 blur-md group-hover:scale-100 group-hover:blur-none ease-out" />
          </motion.button>
          <AnimatePresence>
            {isContactModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && setContactModalOpen(false)}>
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 15, transition: { duration: 0.2, ease: "easeIn" } }} transition={{ duration: 0.3, ease: "easeOut" }} className="bg-gradient-to-br from-neutral-900 via-black to-neutral-900 rounded-xl p-6 sm:p-8 w-full max-w-md relative border border-neutral-700/60 shadow-2xl shadow-indigo-500/20">
                  <button onClick={() => setContactModalOpen(false)} className="absolute top-3.5 right-3.5 p-2 rounded-full text-gray-400 hover:bg-neutral-700/50 hover:text-white transition-colors z-10" aria-label="Close">
                    <FaTimes size={18} />
                  </button>
                  <div className="space-y-6">
                    <div className="text-center pt-2">
                      <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Let's Connect</h3>
                      <p className="mt-1.5 text-gray-400/90 text-sm">Tell me about your idea, I'll respond within 24 hours.</p>
                    </div>
                    <form className="space-y-5" onSubmit={sendEmail}>
                      {[{ name: "name", type: "text", placeholder: "Your Full Name", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> }, { name: "email", type: "email", placeholder: "your.email@example.com", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25-2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /> },].map(field => (
                        <div key={field.name}>
                          <label htmlFor={field.name} className="block text-sm font-medium text-gray-300/90 mb-1.5 text-left">{field.name.charAt(0).toUpperCase() + field.name.slice(1)}</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"> <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">{field.icon}</svg> </div>
                            <input type={field.type} name={field.name} id={field.name} required className="w-full pl-10 pr-3 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500/90 text-gray-100 transition-all duration-200 text-sm focus:bg-neutral-800" placeholder={field.placeholder} />
                          </div>
                        </div>
                      ))}
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300/90 mb-1.5 text-left">Message</label>
                        <textarea id="message" rows="4" name="message" required className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500/90 text-gray-100 transition-all duration-200 text-sm focus:bg-neutral-800" placeholder="Tell me about your project or inquiry..." />
                      </div>
                      <button type="submit" className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold text-white hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 relative overflow-hidden group focus:outline-none focus:ring-4 focus:ring-indigo-500/60 transform hover:scale-[1.02]">
                        <span className="relative z-10">Send Message</span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main><footer className="bg-black border-t border-neutral-800/60">
        <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }} viewport={{ once: true }} className="text-sm text-gray-400/90 hover:text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-300">
              © {new Date().getFullYear()} Rohith Vittamraj. All rights reserved.
            </motion.p>
            <motion.div initial="hidden" whileInView="visible" transition={{ staggerChildren: 0.1, delayChildren: 0.2 }} viewport={{ once: true }} className="flex space-x-4 sm:space-x-5">
              {[{ href: "https://x.com/rohithofficial5?s=21&t=cVo-4UEJaqOqaL-meqeikQ", label: "Twitter", icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />, hoverClasses: "hover:bg-sky-500/90 hover:shadow-sky-500/30" }, { href: "https://www.instagram.com/_rohtzz_", label: "Instagram", icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />, hoverClasses: "hover:bg-pink-500/90 hover:shadow-pink-500/30" }, { href: "https://www.linkedin.com/in/rohith-vittamraj-0ab76a313", label: "LinkedIn", icon: <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />, hoverClasses: "hover:bg-blue-600/90 hover:shadow-blue-600/30" }, { href: "https://github.com/rohith-2809", label: "GitHub", icon: <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.699-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />, hoverClasses: "hover:bg-neutral-700/90 hover:shadow-white/10" },].map(social => (
                <motion.a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`${social.label} profile`}
                  className={`group p-2.5 rounded-full bg-neutral-800/80 text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-md hover:shadow-lg ${social.hoverClasses}`}
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">{social.icon}</svg>
                </motion.a>
              ))}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }} viewport={{ once: true }} className="mt-8 text-center">
            <p className="text-sm text-gray-500/80">
              "🚀 Let’s build something amazing together! Drop me a message! 💬"
            </p>
          </motion.div>
        </div>
      </footer></>
    </div>
  );
};

export default Landing;
