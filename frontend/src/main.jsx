import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  GraduationCap,
  Heart,
  Laptop,
  Linkedin,
  Lock,
  LogIn,
  Menu,
  Moon,
  Play,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Sun,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';
import './styles.css';

const navItems = [
  ['Home', 'home'],
  ['Programs', 'programs'],
  ['Categories', 'paths'],
  ['AI Learning', 'ai-learning'],
  ['Internships', 'internships'],
  ['Placements', 'placements'],
  ['Mentors', 'mentors'],
  ['Resources', 'resources'],
  ['Pricing', 'pricing'],
  ['About', 'why'],
  ['Contact', 'counselling'],
];

const stats = [
  ['10,000+', 'Students'],
  ['100+', 'Courses'],
  ['50+', 'Industry Mentors'],
  ['500+', 'Hiring Partners'],
  ['95%', 'Student Satisfaction'],
];

const companies = [
  { name: 'Google', logo: 'G', className: 'google' },
  { name: 'Microsoft', logo: 'ms', className: 'microsoft' },
  { name: 'Amazon', logo: 'a', className: 'amazon' },
  { name: 'Infosys', logo: 'I', className: 'infosys' },
  { name: 'TCS', logo: 'tcs', className: 'tcs' },
  { name: 'Meta', logo: '∞', className: 'meta' },
  { name: 'Zoho', logo: 'Z', className: 'zoho' },
  { name: 'IBM', logo: 'IBM', className: 'ibm' },
  { name: 'Oracle', logo: 'O', className: 'oracle' },
  { name: 'Adobe', logo: 'A', className: 'adobe' },
];
const paths = ['AI', 'Software Development', 'Full Stack', 'React', 'Flutter', 'Python', 'Java', 'Data Science', 'Cloud', 'Cyber Security', 'Marketing', 'Business', 'Finance', 'Sales', 'Leadership', 'UI UX'];

const features = [
  ['Live Classes', 'Join expert-led cohorts with weekend and weekday tracks.', BookOpen],
  ['AI Tutor', 'Get instant help, practice prompts, and guided revision loops.', Bot],
  ['Industry Experts', 'Learn from mentors building products at top companies.', Users],
  ['Internships', 'Ship portfolio-ready work with guided business briefs.', BriefcaseBusiness],
  ['Real Projects', 'Build dashboards, apps, campaigns, automations, and case studies.', Laptop],
  ['Placement', 'Interview preparation, hiring drives, and partner introductions.', Target],
  ['Lifetime Access', 'Keep lessons, recordings, templates, and future upgrades.', Lock],
  ['Certification', 'Earn verified credentials for your LinkedIn and resume.', Award],
];

const courses = [
  { id: 'ai-growth', title: 'AI Growth & Automation Mastery', category: 'AI', instructor: 'Aarav Mehta', duration: '12 weeks', projects: 9, price: '₹14,999', discount: '40%', tag: 'Internship + Placement', level: 'Advanced cohort', outcome: 'Launch AI workflows, dashboards, and client-ready automations.', accent: '#5B5FEF' },
  { id: 'full-stack', title: 'Full Stack Product Engineering', category: 'Software Development', instructor: 'Nisha Rao', duration: '20 weeks', projects: 14, price: '₹24,999', discount: '35%', tag: 'Live capstone', level: 'Career track', outcome: 'Build production-grade web apps with APIs, auth, and deployment.', accent: '#00D4FF' },
  { id: 'marketing', title: 'Performance Marketing Lab', category: 'Marketing', instructor: 'Kabir Sethi', duration: '10 weeks', projects: 8, price: '₹11,999', discount: '30%', tag: 'Ad account practice', level: 'Professional sprint', outcome: 'Plan campaigns, read analytics, and optimize paid acquisition funnels.', accent: '#10B981' },
  { id: 'data-science', title: 'Data Science Career Track', category: 'Data Science', instructor: 'Maya Iyer', duration: '18 weeks', projects: 11, price: '₹21,999', discount: '32%', tag: 'Analytics internship', level: 'Career track', outcome: 'Turn raw data into models, dashboards, and business recommendations.', accent: '#7C3AED' },
  { id: 'ui-ux', title: 'UI UX Design Systems Studio', category: 'UI UX', instructor: 'Rhea Thomas', duration: '14 weeks', projects: 10, price: '₹16,999', discount: '28%', tag: 'Portfolio review', level: 'Studio cohort', outcome: 'Design premium products with research, systems, prototypes, and case studies.', accent: '#F59E0B' },
  { id: 'sales', title: 'B2B Sales & Leadership Sprint', category: 'Sales', instructor: 'Dev Khanna', duration: '8 weeks', projects: 6, price: '₹9,999', discount: '25%', tag: 'Roleplay clinic', level: 'Executive sprint', outcome: 'Master discovery calls, CRM discipline, negotiation, and enterprise follow-up.', accent: '#EF4444' },
];

const aiTools = ['AI Tutor', 'AI Career Counselor', 'AI Resume Builder', 'AI Mock Interview', 'AI Coding Mentor', 'AI Assignment Evaluator', 'AI Learning Roadmap', 'AI Skill Gap Analysis'];
const journey = ['Enroll', 'Learn', 'Assignments', 'Projects', 'Internship', 'Certification', 'Placement', 'Career Growth'];
const internships = ['AI', 'Developer', 'Marketing', 'Sales', 'HR', 'Graphic Design'];
const placementSteps = ['Resume Review', 'LinkedIn', 'Mock Interview', 'Technical Interview', 'HR Interview', 'Offer Letter'];
const resources = ['Blogs', 'Prompt Library', 'Roadmaps', 'Templates', 'Interview Questions', 'Cheat Sheets'];

const mentors = [
  ['Ananya Sen', '12 yrs', 'Google', 'AI Product Systems'],
  ['Rohan Kapoor', '15 yrs', 'Microsoft', 'Cloud Engineering'],
  ['Priya Menon', '10 yrs', 'Adobe', 'Design Leadership'],
  ['Ishaan Verma', '11 yrs', 'Amazon', 'Growth & Analytics'],
];

const pricing = [
  ['Basic', '₹4,999', ['Recorded courses', 'Community access', 'Certificates']],
  ['Pro', '₹11,999', ['Live classes', 'AI tutor', 'Projects and reviews']],
  ['Premium', '₹19,999', ['Internship track', 'Placement support', '1:1 mentor calls']],
  ['Enterprise', 'Custom', ['Team dashboard', 'Private cohorts', 'Hiring analytics']],
];

const faqs = [
  ['Are the programs live or recorded?', 'Most tracks combine live cohorts, recorded lessons, assignments, and AI-guided practice.'],
  ['Do I get internship support?', 'Yes. Eligible learners can join guided internship briefs in development, AI, marketing, sales, HR, and design.'],
  ['Will Grow Biz Academy help with placements?', 'The placement track includes resume reviews, mock interviews, LinkedIn optimization, and hiring partner opportunities.'],
  ['Can beginners join?', 'Yes. Each path includes foundations, practice labs, and mentor support before advanced projects.'],
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function App() {
  const [theme, setTheme] = useState('dark');
  const [query, setQuery] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', course: '', experience: '', date: '', time: '' });
  const [formMessage, setFormMessage] = useState('');
  const [wishlist, setWishlist] = useState(new Set());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('revealed')),
      { threshold: 0.14 },
    );
    document.querySelectorAll('.reveal').forEach((node) => reveal.observe(node));
    return () => reveal.disconnect();
  }, []);

  const filteredCourses = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return courses;
    return courses.filter((course) => [course.title, course.category, course.instructor].join(' ').toLowerCase().includes(text));
  }, [query]);

  function submitCounselling(event) {
    event.preventDefault();
    const required = ['name', 'phone', 'email', 'course', 'date', 'time'];
    const missing = required.find((key) => !form[key].trim());
    const emailInvalid = !/^\S+@\S+\.\S+$/.test(form.email);
    const phoneInvalid = form.phone.replace(/\D/g, '').length < 10;
    if (missing) return setFormMessage('Please complete all required fields.');
    if (emailInvalid) return setFormMessage('Please enter a valid email address.');
    if (phoneInvalid) return setFormMessage('Please enter a valid phone number.');
    setFormMessage('Your free counselling session is booked. Our advisor will confirm shortly.');
  }

  function downloadBrochure() {
    const blob = new Blob([
      'Grow Biz Academy Brochure\n\nAI, Technology, Marketing, Business, Sales and Future Skills programs with internships, certifications and placement assistance.\n\nVisit the website to explore programs and book free counselling.',
    ], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'grow-biz-academy-brochure.pdf';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <LoadingScreen />
      <Navbar theme={theme} setTheme={setTheme} setActiveModal={setActiveModal} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        <Hero setActiveModal={setActiveModal} downloadBrochure={downloadBrochure} />
        <LogoMarquee />
        <LearningPaths />
        <Why />
        <Courses query={query} setQuery={setQuery} filteredCourses={filteredCourses} setActiveCourse={setActiveCourse} wishlist={wishlist} setWishlist={setWishlist} />
        <AILearning />
        <Journey />
        <StudentDashboard />
        <Internships />
        <Placements />
        <SuccessStories />
        <Mentors />
        <HiringGrid />
        <Webinars setActiveModal={setActiveModal} />
        <Community />
        <Resources />
        <MobileApp />
        <Pricing yearly={yearly} setYearly={setYearly} setActiveModal={setActiveModal} />
        <FAQ openFaq={openFaq} setOpenFaq={setOpenFaq} />
        <Counselling form={form} setForm={setForm} formMessage={formMessage} submitCounselling={submitCounselling} />
      </main>
      <Footer />
      {activeModal && <Modal type={activeModal} setActiveModal={setActiveModal} form={form} setForm={setForm} submitCounselling={submitCounselling} formMessage={formMessage} />}
      {activeCourse && <CourseModal course={activeCourse} setActiveCourse={setActiveCourse} setActiveModal={setActiveModal} />}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-mark"><Sparkles /></div>
      <span>Grow Biz Academy</span>
    </div>
  );
}

function Navbar({ theme, setTheme, setActiveModal, menuOpen, setMenuOpen }) {
  return (
    <header className="navbar">
      <button className="brand-link" onClick={() => scrollToId('home')} aria-label="Grow Biz Academy home">
        <span className="logo">GB</span>
        <span>Grow Biz Academy</span>
      </button>
      <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
        {navItems.map(([label, id]) => (
          <button key={id} onClick={() => { scrollToId(id); setMenuOpen(false); }}>{label}</button>
        ))}
      </nav>
      <div className="nav-actions">
        <button className="icon-button" aria-label="Toggle dark mode" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="ghost-button" onClick={() => setActiveModal('login')}><LogIn size={16} />Login</button>
        <button className="primary-button" onClick={() => setActiveModal('signup')}>Signup</button>
        <button className="icon-button menu-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button>
      </div>
    </header>
  );
}

function Section({ id, eyebrow, title, children, className = '' }) {
  return (
    <section id={id} className={`section reveal ${className}`}>
      <div className="section-heading">
        <span className="eyebrow"><Sparkles size={16} />{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Hero({ setActiveModal, downloadBrochure }) {
  return (
    <section id="home" className="hero section">
      <div className="hero-copy reveal revealed">
        <span className="eyebrow"><Zap size={16} />AI-powered career acceleration</span>
        <h1>Learn Today.<br />Build Tomorrow.<br />Lead the Future.</h1>
        <p>Master AI, Technology, Marketing, Business, Sales and future skills through industry-led programs, internships, certifications and AI-powered learning.</p>
        <div className="button-row">
          <button className="primary-button large" onClick={() => scrollToId('programs')}>Explore Programs</button>
          <button className="secondary-button large" onClick={() => setActiveModal('counselling')}>Book Free Counselling</button>
          <button className="ghost-button large" onClick={downloadBrochure}><Download size={18} />Download Brochure</button>
        </div>
        <div className="stat-row">
          {stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      </div>
      <div className="hero-visual reveal revealed">
        <div className="dashboard-card main-dashboard">
          <div className="dashboard-top"><span>AI Learning OS</span><span className="live-dot">Live</span></div>
          <div className="progress-ring">87%</div>
          <div className="analytics-bars">{[54, 72, 46, 88, 64, 92, 78].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
          <div className="dashboard-grid">
            <MiniTile icon={Bot} title="AI Tutor" value="24/7" />
            <MiniTile icon={Award} title="Certificates" value="6 earned" />
            <MiniTile icon={Target} title="Achievements" value="Top 4%" />
            <MiniTile icon={BarChart3} title="Analytics" value="+31%" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniTile({ icon: Icon, title, value }) {
  return <div className="mini-tile"><Icon size={18} /><span>{title}</span><strong>{value}</strong></div>;
}

function LogoMarquee() {
  return (
    <Section id="trusted" eyebrow="Trusted ecosystem" title="Learners prepare for roles at modern product companies." className="compact">
      <div className="marquee">
        <div>
          {[...companies, ...companies].map((company, index) => (
            <CompanyLogo company={company} key={`${company.name}-${index}`} />
          ))}
        </div>
      </div>
    </Section>
  );
}

function LearningPaths() {
  return (
    <Section id="paths" eyebrow="Explore learning paths" title="Choose a high-growth track and move with clarity.">
      <div className="path-grid">
        {paths.map((path, index) => <button key={path} onClick={() => scrollToId('programs')} style={{ '--delay': `${index * 30}ms` }}>{path}</button>)}
      </div>
    </Section>
  );
}

function Why() {
  return (
    <Section id="why" eyebrow="Why Grow Biz Academy" title="A premium learning engine for ambitious students and working professionals.">
      <div className="feature-grid">
        {features.map(([title, copy, Icon]) => <article className="feature-card" key={title}><Icon /><h3>{title}</h3><p>{copy}</p></article>)}
      </div>
    </Section>
  );
}

function Courses({ query, setQuery, filteredCourses, setActiveCourse, wishlist, setWishlist }) {
  function toggleWishlist(id) {
    setWishlist((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  return (
    <Section id="programs" eyebrow="Featured courses" title="Cohort-grade programs with projects, internships, and career proof." className="premium-band">
      <div className="programs-toolbar">
        <div className="search-panel">
          <Search size={20} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search AI, React, marketing, data, design..." />
        </div>
        <div className="course-proof">
          <span><BadgeCheck size={16} /> Mentor reviewed</span>
          <span><BriefcaseBusiness size={16} /> Internship mapped</span>
          <span><Target size={16} /> Placement ready</span>
        </div>
      </div>
      <div className="course-grid">
        {filteredCourses.map((course) => (
          <article className="course-card" key={course.id}>
            <div className="course-art" style={{ '--accent': course.accent }}>
              <div>
                <span className="course-category">{course.category}</span>
                <strong>{course.level}</strong>
              </div>
              <GraduationCap />
            </div>
            <div className="course-body">
              <span className="course-tag">{course.tag}</span>
              <h3>{course.title}</h3>
              <p>{course.outcome}</p>
              <div className="course-meta">
                <span><Users size={15} />{course.instructor}</span>
                <span><CalendarDays size={15} />{course.duration}</span>
                <span><Laptop size={15} />{course.projects} projects</span>
              </div>
              <div className="price-line"><strong>{course.price}</strong><span>{course.discount} off</span></div>
              <div className="card-actions">
                <button className="primary-button" onClick={() => setActiveCourse(course)}>Enroll</button>
                <button className="icon-button" onClick={() => toggleWishlist(course.id)} aria-label={`Wishlist ${course.title}`}><Heart fill={wishlist.has(course.id) ? 'currentColor' : 'none'} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function AILearning() {
  return (
    <Section id="ai-learning" eyebrow="AI learning experience" title="Your personal AI team for every stage of learning.">
      <div className="ai-console">
        <div className="ai-sidebar">{aiTools.map((tool, index) => <button className={index === 0 ? 'active' : ''} key={tool}><Bot size={16} />{tool}</button>)}</div>
        <div className="ai-chat">
          <div className="chat-bubble user">Build me a 30-day plan to become job-ready in AI automation.</div>
          <div className="chat-bubble ai">Plan created: 4 weekly sprints, 7 portfolio tasks, 2 mock interviews, and a skill-gap review every Friday.</div>
          <div className="roadmap-lines">{['Prompt systems', 'No-code automations', 'API workflows', 'Client dashboard'].map((item) => <span key={item}><Check size={16} />{item}</span>)}</div>
        </div>
      </div>
    </Section>
  );
}

function Journey() {
  return (
    <Section id="journey" eyebrow="Learning journey" title="From enrollment to career growth, every milestone is visible.">
      <div className="timeline">{journey.map((step, index) => <div key={step}><span>{index + 1}</span><strong>{step}</strong></div>)}</div>
    </Section>
  );
}

function StudentDashboard() {
  return (
    <Section id="dashboard" eyebrow="Student dashboard" title="A focused cockpit for progress, assignments, certificates, and community.">
      <div className="laptop-mockup">
        <div className="mockup-top" />
        <div className="dashboard-layout">
          <aside><strong>Today</strong>{['Live class', 'Assignment', 'Mentor call'].map((item) => <span key={item}>{item}</span>)}</aside>
          <main>
            <div className="wide-widget"><BarChart3 /> Progress analytics</div>
            <div className="widget-grid">{['Assignments', 'Certificates', 'Leaderboard', 'Community', 'Calendar'].map((item) => <div key={item}>{item}</div>)}</div>
          </main>
        </div>
      </div>
    </Section>
  );
}

function Internships() {
  return (
    <Section id="internships" eyebrow="Internships" title="Practice inside business briefs that feel like real work.">
      <div className="internship-grid">{internships.map((item) => <article key={item}><BriefcaseBusiness /><h3>{item}</h3><p>Weekly deliverables, mentor reviews, and completion proof for your portfolio.</p></article>)}</div>
    </Section>
  );
}

function Placements() {
  return (
    <Section id="placements" eyebrow="Placement assistance" title="Interview readiness from resume story to offer letter.">
      <div className="placement-board">{placementSteps.map((step, index) => <div key={step}><span>{index + 1}</span><strong>{step}</strong><p>Guided checklist, templates, and mentor review.</p></div>)}</div>
    </Section>
  );
}

function SuccessStories() {
  return (
    <Section id="success" eyebrow="Success stories" title="Learners turn effort into visible career momentum.">
      <div className="story-grid">{['₹3.2L to ₹8.5L', 'Intern to Product Analyst', 'Freelancer to AI Consultant'].map((story) => <article key={story}><button><Play /></button><h3>{story}</h3><p>Before vs after journey, portfolio wins, and mentor notes.</p></article>)}</div>
    </Section>
  );
}

function Mentors() {
  return (
    <Section id="mentors" eyebrow="Mentors" title="Learn from operators who have shipped at scale.">
      <div className="mentor-grid">{mentors.map(([name, exp, company, course]) => <article key={name}><div className="avatar">{name.split(' ').map((n) => n[0]).join('')}</div><h3>{name}</h3><p>{exp} · {company}</p><span>{course}</span><button className="ghost-button"><Linkedin size={16} />LinkedIn</button></article>)}</div>
    </Section>
  );
}

function HiringGrid() {
  return (
    <Section id="hiring" eyebrow="Hiring companies" title="A growing partner network across technology, business, and creative roles.">
      <div className="logo-grid">
        {companies.concat([
          { name: 'Accenture', logo: '>', className: 'accenture' },
          { name: 'Deloitte', logo: 'D', className: 'deloitte' },
          { name: 'Wipro', logo: 'W', className: 'wipro' },
          { name: 'HCL', logo: 'HCL', className: 'hcl' },
        ]).map((company) => <CompanyLogo company={company} key={company.name} />)}
      </div>
    </Section>
  );
}

function CompanyLogo({ company }) {
  return (
    <span className="company-logo-tile">
      <i className={`company-mark ${company.className}`}>{company.logo}</i>
      <strong>{company.name}</strong>
    </span>
  );
}

function Webinars({ setActiveModal }) {
  return (
    <Section id="webinars" eyebrow="Live webinars" title="Join live sessions before you choose a track.">
      <div className="webinar-card">
        <div><CalendarDays /><h3>AI Careers in 2026: Build a portfolio recruiters can trust</h3><p>Starts in 04 days · 18 hours · 25 minutes</p></div>
        <button className="primary-button large" onClick={() => setActiveModal('webinar')}>Register</button>
      </div>
    </Section>
  );
}

function Community() {
  return (
    <Section id="community" eyebrow="Community" title="Stay accountable with peers, mentors, events, and hackathons.">
      <div className="community-grid">{['Discord', 'Telegram', 'WhatsApp', 'Forum', 'Hackathons'].map((item) => <button key={item}><Users />{item}</button>)}</div>
    </Section>
  );
}

function Resources() {
  return (
    <Section id="resources" eyebrow="Resources" title="Practical assets for learning faster and interviewing better.">
      <div className="resource-grid">{resources.map((item) => <article key={item}><FileIcon /><h3>{item}</h3><p>Curated, updated, and organized by skill level.</p></article>)}</div>
    </Section>
  );
}

function FileIcon() {
  return <BookOpen size={26} />;
}

function MobileApp() {
  return (
    <Section id="mobile" eyebrow="Mobile app" title="Learn on Android and iOS with offline lessons and AI nudges.">
      <div className="mobile-wrap">
        <div className="phone"><Smartphone /><strong>AI Tutor</strong><span>Offline lessons · notifications · streaks</span></div>
        <div className="phone secondary"><Bell /><strong>Daily Sprint</strong><span>3 tasks ready for your next milestone</span></div>
      </div>
    </Section>
  );
}

function Pricing({ yearly, setYearly, setActiveModal }) {
  return (
    <Section id="pricing" eyebrow="Pricing" title="Pick the level of support your ambition needs.">
      <div className="pricing-toggle"><span>Monthly</span><button className={yearly ? 'active' : ''} onClick={() => setYearly(!yearly)}><i /></button><span>Yearly</span></div>
      <div className="pricing-grid">{pricing.map(([name, price, points], index) => <article className={index === 2 ? 'popular' : ''} key={name}><h3>{name}</h3><strong>{price === 'Custom' ? price : yearly ? price.replace('₹', '₹') + '/yr' : price}</strong>{points.map((point) => <p key={point}><Check size={16} />{point}</p>)}<button className="primary-button" onClick={() => setActiveModal('checkout')}>Go to checkout</button></article>)}</div>
    </Section>
  );
}

function FAQ({ openFaq, setOpenFaq }) {
  return (
    <Section id="faq" eyebrow="FAQ" title="Clear answers before you start.">
      <div className="faq-list">{faqs.map(([question, answer], index) => <button key={question} className="faq-item" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}<ChevronDown /></span>{openFaq === index && <p>{answer}</p>}</button>)}</div>
    </Section>
  );
}

function Counselling({ form, setForm, formMessage, submitCounselling }) {
  return (
    <Section id="counselling" eyebrow="Career counselling" title="Book a free session and map your next career move.">
      <CounsellingForm form={form} setForm={setForm} formMessage={formMessage} submitCounselling={submitCounselling} />
    </Section>
  );
}

function CounsellingForm({ form, setForm, formMessage, submitCounselling }) {
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  return (
    <form className="counselling-form" onSubmit={submitCounselling}>
      <input placeholder="Name" value={form.name} onChange={update('name')} />
      <input placeholder="Phone" value={form.phone} onChange={update('phone')} />
      <input placeholder="Email" value={form.email} onChange={update('email')} />
      <select value={form.course} onChange={update('course')}><option value="">Preferred Course</option>{paths.slice(0, 10).map((path) => <option key={path}>{path}</option>)}</select>
      <input placeholder="Experience" value={form.experience} onChange={update('experience')} />
      <input type="date" value={form.date} onChange={update('date')} />
      <input type="time" value={form.time} onChange={update('time')} />
      <button className="primary-button large" type="submit"><Send size={18} />Submit</button>
      {formMessage && <p className="form-message">{formMessage}</p>}
    </form>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div><span className="logo">GB</span><strong>Grow Biz Academy</strong><p>AI-powered learning for career builders.</p></div>
      {['Quick Links', 'Courses', 'Community', 'Support', 'Policies'].map((group) => <div key={group}><h4>{group}</h4><button onClick={() => scrollToId('programs')}>Programs</button><button onClick={() => scrollToId('pricing')}>Pricing</button><button onClick={() => scrollToId('counselling')}>Contact</button></div>)}
      <form onSubmit={(event) => event.preventDefault()}><h4>Newsletter</h4><input placeholder="Email address" /><button className="secondary-button">Subscribe</button></form>
    </footer>
  );
}

function Modal({ type, setActiveModal, form, setForm, submitCounselling, formMessage }) {
  const titles = { login: 'Welcome back', signup: 'Create your learning account', counselling: 'Book free counselling', webinar: 'Register for webinar', checkout: 'Checkout' };
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <button className="icon-button close" onClick={() => setActiveModal(null)} aria-label="Close"><X /></button>
        <h2>{titles[type]}</h2>
        {type === 'counselling' ? <CounsellingForm form={form} setForm={setForm} submitCounselling={submitCounselling} formMessage={formMessage} /> : <AuthLikeForm type={type} setActiveModal={setActiveModal} />}
      </div>
    </div>
  );
}

function AuthLikeForm({ type, setActiveModal }) {
  const [message, setMessage] = useState('');
  return (
    <form className="auth-form" onSubmit={(event) => { event.preventDefault(); setMessage(type === 'checkout' ? 'Checkout request created. Our team will send the secure payment link.' : 'Success. You can continue exploring programs.'); }}>
      {type !== 'login' && <input placeholder="Full name" required />}
      <input type="email" placeholder="Email" required />
      {(type === 'login' || type === 'signup') && <input type="password" placeholder="Password" required />}
      {type === 'webinar' && <input placeholder="Phone number" required />}
      {type === 'checkout' && <select required><option value="">Choose plan</option>{pricing.map(([name]) => <option key={name}>{name}</option>)}</select>}
      <button className="primary-button large" type="submit">{type === 'checkout' ? 'Continue to checkout' : 'Continue'}</button>
      {message && <p className="form-message">{message}</p>}
      {type !== 'checkout' && <button type="button" className="ghost-button" onClick={() => setActiveModal(type === 'login' ? 'signup' : 'login')}>{type === 'login' ? 'Create account' : 'I already have an account'}</button>}
    </form>
  );
}

function CourseModal({ course, setActiveCourse, setActiveModal }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal course-detail">
        <button className="icon-button close" onClick={() => setActiveCourse(null)} aria-label="Close"><X /></button>
        <span className="course-tag">{course.category}</span>
        <h2>{course.title}</h2>
        <p>Live classes, mentor-reviewed projects, internship preparation, placement workflows, and a verified certificate.</p>
        <div className="detail-grid"><MiniTile icon={CalendarDays} title="Duration" value={course.duration} /><MiniTile icon={BadgeCheck} title="Projects" value={`${course.projects}`} /><MiniTile icon={Users} title="Mentor" value={course.instructor} /></div>
        <button className="primary-button large" onClick={() => { setActiveCourse(null); setActiveModal('checkout'); }}>Enroll now</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
