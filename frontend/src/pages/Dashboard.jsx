import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import { CheckCircle2, Clock, ListTodo, AlertTriangle, TrendingUp, FolderOpen } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, glow }) => (
  <div className="stat-card" style={{ '--glow': glow }}>
    <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.15, filter: 'blur(20px)' }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ width: 42, height: 42, background: color + '22', border: `1px solid ${color}44`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '0.3rem' }}>{value}</div>
    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</div>
  </div>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, projRes] = await Promise.all([
          api.get('/tasks/dashboard'),
          api.get('/projects'),
        ]);
        setStats(dashRes.data.stats);
        setRecentTasks(dashRes.data.recentTasks);
        setProjects(projRes.data.projects.slice(0, 4));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div style={{ padding: '2rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.3rem' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={ListTodo}      label="Total Tasks"    value={stats.total}      color="#6366f1" />
        <StatCard icon={Clock}         label="In Progress"    value={stats.inProgress} color="#3b82f6" />
        <StatCard icon={CheckCircle2}  label="Completed"      value={stats.done}       color="#10b981" />
        <StatCard icon={AlertTriangle} label="Overdue"        value={stats.overdue}    color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Recent tasks */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Tasks</h2>
            <Link to="/tasks" style={{ fontSize: '0.8rem', color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <ListTodo size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No tasks yet</p>
              {isAdmin && <Link to="/projects" style={{ display: 'inline-block', marginTop: '1rem' }} className="btn-primary">Create a project first</Link>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {recentTasks.map((t) => <TaskCard key={t._id} task={t} />)}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Completion card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--accent-light)' }} />
              <span style={{ fontWeight: 600 }}>Overall Progress</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800 }} className="gradient-text">{completionPct}%</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${completionPct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.done} done</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.total - stats.done} remaining</span>
            </div>
          </div>

          {/* Quick projects */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderOpen size={17} style={{ color: 'var(--accent-light)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Projects</span>
              </div>
              <Link to="/projects" style={{ fontSize: '0.76rem', color: 'var(--accent-light)', textDecoration: 'none' }}>All →</Link>
            </div>
            {projects.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No projects yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {projects.map((p) => (
                  <Link key={p._id} to={`/projects/${p._id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)', transition: 'all 0.2s' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || '#6366f1', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{p.taskCount} tasks</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
