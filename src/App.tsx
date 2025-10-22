import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { PlusCircle, Search, Moon, Sun, Calendar, TrendingUp, Briefcase, GraduationCap, CheckCircle, Clock, FileText, Users, X, ChartBar } from 'lucide-react';
import { loadFromLocal, saveToLocal, initSupabase, syncToSupabase } from './lib/persistence';

interface Application {
  app_id: number;
  type: 'JOB' | 'SCHOLARSHIP';
  title: string;
  status: ApplicationStatus;
  applied_date: string | null;
  deadline: string | null;
  is_remote: boolean;
  country: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

type ApplicationStatus = 
  | 'Draft'
  | 'Applied'
  | 'Under Review'
  | 'Interviewing'
  | 'Technical Assessment'
  | 'Final Round'
  | 'Offer Received'
  | 'Awarded'
  | 'Rejected'
  | 'Withdrawn';

interface JobDetails {
  app_id: number;
  company_name: string;
  source: string;
  job_link: string;
  offer_salary: number | null;
  currency: string;
  contact_id: number | null;
  location: string;
}

interface ScholarshipDetails {
  app_id: number;
  institution_name: string;
  professor_name: string;
  funding_amount: number | null;
  currency: string;
  awarded: boolean;
  program_name: string;
}

interface Document {
  doc_id: number;
  app_id: number;
  document_name: string;
  status: 'Needed' | 'Drafting' | 'Finalized' | 'Submitted';
  path_url: string;
  required: boolean;
  notes: string;
}

interface Interaction {
  interaction_id: number;
  app_id: number;
  interaction_date: string;
  interaction_type: string;
  description: string;
  outcome: string;
}

interface FullApplication extends Application {
  job_details?: JobDetails;
  scholarship_details?: ScholarshipDetails;
  documents: Document[];
  interactions: Interaction[];
}

const DarkModeContext = createContext<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}>({
  darkMode: false,
  toggleDarkMode: () => {},
});

const mockApplications: FullApplication[] = [
  {
    app_id: 1,
    type: 'JOB',
    title: 'Senior Full Stack Developer',
    status: 'Applied',
    applied_date: '2025-10-01',
    deadline: '2025-11-15',
    is_remote: true,
    country: 'United States',
    notes: 'Found through LinkedIn',
    created_at: '2025-10-01',
    updated_at: '2025-10-01',
    job_details: {
      app_id: 1,
      company_name: 'TechCorp Inc',
      source: 'LinkedIn',
      job_link: 'https://linkedin.com/jobs/12345',
      offer_salary: 120000,
      currency: 'USD',
      contact_id: 1,
      location: 'Remote',
    },
    documents: [
      { doc_id: 1, app_id: 1, document_name: 'Resume', status: 'Submitted', path_url: '', required: true, notes: '' },
      { doc_id: 2, app_id: 1, document_name: 'Cover Letter', status: 'Submitted', path_url: '', required: true, notes: '' },
    ],
    interactions: [
      { interaction_id: 1, app_id: 1, interaction_date: '2025-10-01', interaction_type: 'Cold DM', description: 'Sent initial application', outcome: 'Application submitted' },
    ],
  },
  {
    app_id: 2,
    type: 'SCHOLARSHIP',
    title: 'PhD Research Fellowship',
    status: 'Under Review',
    applied_date: '2025-09-15',
    deadline: '2025-12-01',
    is_remote: false,
    country: 'Germany',
    notes: 'Recommended by advisor',
    created_at: '2025-09-15',
    updated_at: '2025-09-15',
    scholarship_details: {
      app_id: 2,
      institution_name: 'Technical University of Munich',
      professor_name: 'Dr. Robert Johnson',
      funding_amount: 50000,
      currency: 'EUR',
      awarded: false,
      program_name: 'Computer Science PhD',
    },
    documents: [
      { doc_id: 3, app_id: 2, document_name: 'Research Proposal', status: 'Finalized', path_url: '', required: true, notes: '' },
      { doc_id: 4, app_id: 2, document_name: 'Transcripts', status: 'Submitted', path_url: '', required: true, notes: '' },
    ],
    interactions: [],
  },
  {
    app_id: 3,
    type: 'JOB',
    title: 'Frontend Developer',
    status: 'Interviewing',
    applied_date: '2025-10-05',
    deadline: '2025-10-28',
    is_remote: true,
    country: 'Canada',
    notes: 'Referral from colleague',
    created_at: '2025-10-05',
    updated_at: '2025-10-08',
    job_details: {
      app_id: 3,
      company_name: 'StartupXYZ',
      source: 'Referral',
      job_link: 'https://startupxyz.com/careers',
      offer_salary: null,
      currency: 'CAD',
      contact_id: null,
      location: 'Toronto, ON',
    },
    documents: [
      { doc_id: 5, app_id: 3, document_name: 'Portfolio', status: 'Submitted', path_url: '', required: true, notes: '' },
    ],
    interactions: [
      { interaction_id: 2, app_id: 3, interaction_date: '2025-10-08', interaction_type: 'Initial Screening', description: 'Phone screen with HR', outcome: 'Moved to technical round' },
    ],
  },
];

export default function ApexTrack() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('apex-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    setDarkMode((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('apex-dark-mode', JSON.stringify(newValue));
      return newValue;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <AppContent />
        </div>
      </div>
    </DarkModeContext.Provider>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'create' | 'analytics'>('dashboard');

  // initialize applications from localStorage if present, else fallback to mock data
  const [applications, setApplications] = useState<FullApplication[]>(() => {
    const stored = loadFromLocal<FullApplication[]>();
    return stored ?? mockApplications;
  });

  // initialize optional Supabase client if env vars are present
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (url && key) initSupabase(url, key);
  }, []);

  // persist to localStorage whenever applications change
  useEffect(() => {
    saveToLocal(applications);
  }, [applications]);

  return (
    <>
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <Dashboard applications={applications} setCurrentView={setCurrentView} />}
        {currentView === 'list' && <ListView applications={applications} />}
        {currentView === 'create' && <CreateForm setCurrentView={setCurrentView} applications={applications} setApplications={setApplications} />}
        {currentView === 'analytics' && <Analytics applications={applications} />}
      </main>
    </>
  );
}

function Header({ currentView, setCurrentView }: any) {
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
  <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {
              (() => {
                const base = import.meta.env.BASE_URL || '/';
                const href = base;
                return (
                  <a href={href} onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }} className="flex items-center cursor-pointer" aria-label="Home">
                    <img src={`${base}Apex-Tracker-Logo.png`} alt="Apex Track" className="h-8 sm:h-10 object-contain" />
                  </a>
                );
              })()
            }
            <nav className="hidden md:flex space-x-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                { id: 'list', label: 'Applications', icon: FileText },
                { id: 'analytics', label: 'Analytics', icon: ChartBar },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    currentView === id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView('create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">New Application</span>
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Dashboard({ applications, setCurrentView }: any) {
  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter((a: Application) => ['Applied', 'Under Review'].includes(a.status)).length;
    const interviewing = applications.filter((a: Application) => ['Interviewing', 'Technical Assessment', 'Final Round'].includes(a.status)).length;
    const offers = applications.filter((a: Application) => ['Offer Received', 'Awarded'].includes(a.status)).length;
    return { total, applied, interviewing, offers };
  }, [applications]);

  const urgentDeadlines = useMemo(() => {
    const today = new Date();
    return applications
      .filter((a: Application) => a.deadline)
      .map((a: Application) => ({
        ...a,
        daysUntil: Math.ceil((new Date(a.deadline!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .filter((a: any) => a.daysUntil >= 0)
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [applications]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Applications" value={stats.total} icon={FileText} color="blue" />
        <StatCard title="Applied" value={stats.applied} icon={Clock} color="yellow" />
        <StatCard title="Interviewing" value={stats.interviewing} icon={Users} color="purple" />
        <StatCard title="Offers/Awards" value={stats.offers} icon={CheckCircle} color="green" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Calendar size={24} className="text-red-500" />
            <span>Urgent Deadlines</span>
          </h2>
        </div>
        <div className="space-y-3">
          {urgentDeadlines.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines</p>
          ) : (
            urgentDeadlines.map((app: any) => (
              <div
                key={app.app_id}
                className={`p-4 rounded-lg border-l-4 ${
                  app.daysUntil <= 1
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : app.daysUntil <= 3
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{app.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {app.type === 'JOB' ? app.job_details?.company_name : app.scholarship_details?.institution_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {app.daysUntil === 0 ? 'Today!' : app.daysUntil === 1 ? 'Tomorrow' : `${app.daysUntil} days`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{app.deadline}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity applications={applications} />
        <QuickActions setCurrentView={setCurrentView} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses: any = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ applications }: any) {
  const recent = applications.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Applications</h2>
      <div className="space-y-3">
        {recent.map((app: FullApplication) => (
          <div key={app.app_id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              {app.type === 'JOB' ? (
                <Briefcase size={20} className="text-blue-500" />
              ) : (
                <GraduationCap size={20} className="text-purple-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{app.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {app.type === 'JOB' ? app.job_details?.company_name : app.scholarship_details?.institution_name}
                </p>
              </div>
            </div>
            <StatusBadge status={app.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions({ setCurrentView }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'New Job', icon: Briefcase, action: () => setCurrentView('create') },
          { label: 'New Scholarship', icon: GraduationCap, action: () => setCurrentView('create') },
          { label: 'View All', icon: FileText, action: () => setCurrentView('list') },
          { label: 'Analytics', icon: TrendingUp, action: () => setCurrentView('analytics') },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <item.icon size={24} className="text-gray-600 dark:text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const statusColors: any = {
    'Draft': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'Applied': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Under Review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Interviewing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Technical Assessment': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Final Round': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Offer Received': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Awarded': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Withdrawn': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
      {status}
    </span>
  );
}

function ListView({ applications }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'JOB' | 'SCHOLARSHIP'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredApps = useMemo(() => {
    return applications.filter((app: FullApplication) => {
      const matchesSearch = !searchQuery || 
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.job_details?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.scholarship_details?.institution_name?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = filterType === 'ALL' || app.type === filterType;
      const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [applications, searchQuery, filterType, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="JOB">Jobs</option>
            <option value="SCHOLARSHIP">Scholarships</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Offer Received">Offer Received</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredApps.map((app: FullApplication) => (
                <tr key={app.app_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {app.type === 'JOB' ? (
                      <Briefcase size={20} className="text-blue-500" />
                    ) : (
                      <GraduationCap size={20} className="text-purple-500" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{app.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{app.country}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900 dark:text-white">
                      {app.type === 'JOB' ? app.job_details?.company_name : app.scholarship_details?.institution_name}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {app.deadline || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredApps.length} of {applications.length} applications
      </p>
    </div>
  );
}

function CreateForm({ setCurrentView, applications, setApplications }: any) {
  const [appType, setAppType] = useState<'JOB' | 'SCHOLARSHIP'>('JOB');
  const [formData, setFormData] = useState<any>({
    title: '',
    status: 'Draft',
    applied_date: '',
    deadline: '',
    is_remote: false,
    country: '',
    notes: '',
    company_name: '',
    source: '',
    job_link: '',
    institution_name: '',
    professor_name: '',
    program_name: '',
  });

  const [documents, setDocuments] = useState<any[]>([
    { document_name: 'Resume', status: 'Needed', required: true },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: FullApplication = {
      app_id: applications.length + 1,
      type: appType,
      title: formData.title,
      status: formData.status,
      applied_date: formData.applied_date || null,
      deadline: formData.deadline || null,
      is_remote: formData.is_remote,
      country: formData.country,
      notes: formData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      documents: documents.map((d, i) => ({
        doc_id: i + 1,
        app_id: applications.length + 1,
        document_name: d.document_name,
        status: d.status,
        path_url: '',
        required: d.required,
        notes: ''
      })),
      interactions: [],
    };

    if (appType === 'JOB') {
      newApp.job_details = {
        app_id: applications.length + 1,
        company_name: formData.company_name,
        source: formData.source,
        job_link: formData.job_link,
        offer_salary: null,
        currency: 'USD',
        contact_id: null,
        location: formData.country,
      };
    } else {
      newApp.scholarship_details = {
        app_id: applications.length + 1,
        institution_name: formData.institution_name,
        professor_name: formData.professor_name,
        funding_amount: null,
        currency: 'USD',
        awarded: false,
        program_name: formData.program_name,
      };
    }

    const next = [...applications, newApp];
    setApplications(next);
    // immediate local save (redundant with effect but keeps behavior predictable)
    try {
      saveToLocal(next);
    } catch (e) {
      /* ignore */
    }

    // optionally sync to Supabase if configured (non-blocking)
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // best-effort sync, table name 'applications' expected on the remote DB
      syncToSupabase('applications', next.slice());
    }

    setCurrentView('list');
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Application</h2>
          <button onClick={() => setCurrentView('dashboard')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Type</label>
            <div className="flex space-x-4">
              <button type="button" onClick={() => setAppType('JOB')} className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center space-x-2 transition-all ${appType === 'JOB' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
                <Briefcase size={20} />
                <span>Job</span>
              </button>
              <button type="button" onClick={() => setAppType('SCHOLARSHIP')} className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center space-x-2 transition-all ${appType === 'SCHOLARSHIP' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
                <GraduationCap size={20} />
                <span>Scholarship</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            {appType === 'JOB' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                  <input type="text" required value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source</label>
                  <input type="text" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Link</label>
                  <input type="url" value={formData.job_link} onChange={(e) => setFormData({ ...formData, job_link: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Institution</label>
                  <input type="text" required value={formData.institution_name} onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Professor</label>
                  <input type="text" value={formData.professor_name} onChange={(e) => setFormData({ ...formData, professor_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Program</label>
                  <input type="text" value={formData.program_name} onChange={(e) => setFormData({ ...formData, program_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="Draft">Draft</option>
                <option value="Applied">Applied</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
              <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Applied Date</label>
              <input type="date" value={formData.applied_date} onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline</label>
              <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={formData.is_remote} onChange={(e) => setFormData({ ...formData, is_remote: e.target.checked })} className="rounded" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Remote</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documents</h3>
            <div className="space-y-3">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <input type="text" value={doc.document_name} onChange={(e) => {
                    const newDocs = [...documents];
                    newDocs[idx].document_name = e.target.value;
                    setDocuments(newDocs);
                  }} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Document name" />
                  <select value={doc.status} onChange={(e) => {
                    const newDocs = [...documents];
                    newDocs[idx].status = e.target.value;
                    setDocuments(newDocs);
                  }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="Needed">Needed</option>
                    <option value="Drafting">Drafting</option>
                    <option value="Finalized">Finalized</option>
                    <option value="Submitted">Submitted</option>
                  </select>
                  <button type="button" onClick={() => setDocuments(documents.filter((_, i) => i !== idx))} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setDocuments([...documents, { document_name: '', status: 'Needed', required: true }])} className="text-blue-600 text-sm font-medium flex items-center space-x-1">
                <PlusCircle size={16} />
                <span>Add Document</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setCurrentView('dashboard')} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Analytics({ applications }: any) {
  const conversionData = useMemo(() => {
    const applied = applications.filter((a: Application) => ['Applied', 'Under Review', 'Interviewing', 'Technical Assessment', 'Final Round', 'Offer Received', 'Awarded'].includes(a.status)).length;
    const interviewing = applications.filter((a: Application) => ['Interviewing', 'Technical Assessment', 'Final Round', 'Offer Received', 'Awarded'].includes(a.status)).length;
    const offers = applications.filter((a: Application) => ['Offer Received', 'Awarded'].includes(a.status)).length;

    return [
      { stage: 'Applied', count: applied, percentage: 100 },
      { stage: 'Interviewing', count: interviewing, percentage: applied > 0 ? Math.round((interviewing / applied) * 100) : 0 },
      { stage: 'Offers', count: offers, percentage: applied > 0 ? Math.round((offers / applied) * 100) : 0 },
    ];
  }, [applications]);

  const sourceData = useMemo(() => {
    const sources: any = {};
    applications.forEach((app: FullApplication) => {
      if (app.type === 'JOB' && app.job_details?.source) {
        const source = app.job_details.source;
        if (!sources[source]) {
          sources[source] = { total: 0, offers: 0 };
        }
        sources[source].total++;
        if (['Offer Received', 'Awarded'].includes(app.status)) {
          sources[source].offers++;
        }
      }
    });

    return Object.entries(sources).map(([name, data]: any) => ({
      name,
      total: data.total,
      offers: data.offers,
      successRate: Math.round((data.offers / data.total) * 100),
    }));
  }, [applications]);

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Conversion Funnel</h2>
        <div className="space-y-4">
          {conversionData.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.stage}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                <div className={`h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-purple-600' : 'bg-green-600'}`} style={{ width: `${item.percentage}%` }}>
                  {item.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Source Analysis</h2>
        <div className="space-y-4">
          {sourceData.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No source data available</p>
          ) : (
            sourceData.map((source, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{source.name}</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {source.offers} / {source.total} ({source.successRate}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="h-2 rounded-full bg-green-600" style={{ width: `${source.successRate}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}