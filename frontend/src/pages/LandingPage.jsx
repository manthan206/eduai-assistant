import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Cpu, 
  Terminal, 
  ShieldCheck, 
  Compass, 
  ArrowRight, 
  Sun, 
  Moon, 
  Github, 
  Linkedin,
  Sparkles
} from 'lucide-react';

export default function LandingPage({ darkMode, setDarkMode }) {
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  const features = [
    {
      icon: <Terminal className="w-6 h-6 text-blue-500" />,
      title: "Interactive Coding",
      description: "Get real-time feedback and explanation on code logic, syntax errors, and algorithm optimizations."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      title: "Cybersecurity Training",
      description: "Learn safe coding practices, identify vulnerabilities, and grasp essential defensive tactics."
    },
    {
      icon: <Compass className="w-6 h-6 text-purple-500" />,
      title: "Career Guidance",
      description: "Receive resume building recommendations, cover letter drafts, and mock interview preparations."
    },
    {
      icon: <BookOpen className="w-6 h-6 text-amber-500" />,
      title: "General Knowledge",
      description: "Explore complex concepts in science, math, and history with broken-down, beginner-friendly instructions."
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Background Animated Gradient Mesh */}
      <div className="gradient-bg-mesh">
        <div className="gradient-sphere-1"></div>
        <div className="gradient-sphere-2"></div>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 flex justify-between items-center border-b border-gray-200/40 dark:border-dark-800/40 bg-white/60 dark:bg-dark-900/60 backdrop-blur-xl">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-500 to-purple-600 bg-clip-text text-transparent">
            EduAI Assistant
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl border border-gray-200/50 dark:border-dark-800/50 hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-gray-400 transition-all duration-200"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>

          {user ? (
            <Link 
              to="/dashboard" 
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 flex items-center gap-2"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center space-x-3">
              <Link 
                to="/login" 
                className="px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 font-medium text-sm transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-brand-500/10 hover:shadow-brand-500/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 lg:py-24 flex flex-col items-center justify-center relative z-10">
        
        <motion.div 
          className="text-center max-w-3xl"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            variants={itemVariants} 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/5 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" /> Empowering Lifelong Learners
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight md:leading-none mb-6"
          >
            Your Intelligent AI <br className="hidden md:inline"/>
            <span className="bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Learning Companion
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            EduAI Assistant is built to accelerate your learning journey. Ask coding prompts, dissect cybersecurity concepts, outline resumes, and master complex subjects in real time.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              to={user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold text-base transition-all duration-200 shadow-xl shadow-brand-500/25 flex justify-center items-center gap-2 group"
            >
              Get Started Free 
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <a 
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-gray-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 hover:bg-white/70 dark:hover:bg-dark-850/70 font-semibold text-base transition-all duration-200 text-gray-700 dark:text-gray-300 flex justify-center items-center"
            >
              Learn More
            </a>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid Section */}
        <section id="features" className="w-full mt-24 lg:mt-32 pt-12 border-t border-gray-250/20 dark:border-dark-800/30">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Designed for Accelerated Learning
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
              Everything you need to study, write code, and prepare for interviews in one modern workspace.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="p-6 rounded-2xl border border-gray-200/50 dark:border-dark-800/50 bg-white/40 dark:bg-dark-900/40 backdrop-blur-md shadow-glass-light dark:shadow-glass-dark hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-dark-850/80 transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-gray-150/50 dark:bg-dark-800/50 w-fit mb-5">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-8 border-t border-gray-200/45 dark:border-dark-800/45 relative z-10 bg-white/40 dark:bg-dark-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Cpu className="w-4 h-4 text-brand-500" />
            <span>&copy; {new Date().getFullYear()} EduAI Assistant. MIT License.</span>
          </div>

          <div className="flex items-center space-x-6">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
              aria-label="GitHub Profile"
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
              aria-label="LinkedIn Profile"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
