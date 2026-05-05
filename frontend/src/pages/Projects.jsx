import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, CheckSquare, Trash2, Archive, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#3b82f6','#06b6d4'];

const ProjectCard = ({ project, onDelete, isAdmin }) => {
  const pct = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
  return (
    <Link to={`/projects/${project._id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Color accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: project.color || '#6366f1', borderRadius: '16px 16px 0 0' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.title}</h3>
            {project.description && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.description}</p>
            )}
          </div>
          {isAdmin && (
            <button className="btn-danger" style={{ padding: '5px 8px', marginLeft: '0.5rem', flexShrink: 0 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(project._id); }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <CheckSquare size={13} />{project.taskCount} tasks
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Users size={13} />{project.members?.length || 0} members
          </span>
          {project.deadline && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Calendar size={13} />{format(new Date(project.deadline), 'MMM d')}
            </span>
          )}
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Progress</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%`, background: project.color || '#6366f1' }} />
          </div>
        </div>

        {/* Members avatars */}
        {project.members?.length > 0 && (
          <div style={{ display: 'flex', marginTop: '0.75rem', alignItems: 'center' }}>
            {project.members.slice(0, 4).map((m, i) => (
              <div key={m._id} title={m.name} style={{
                width: 26, height: 26, borderRadius: '50%',
                background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 2) % COLORS.length]})`,
                border: '2px solid var(--bg-card)', marginLeft: i > 0 ? -8 : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontWeight: 700, color: 'white', zIndex: project.members.length - i
              }}>
                {m.name?.[0]?.toUpperCase()}
              </div>
            ))}
            {project.members.length > 4 && (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-card-hover)', border: '2px solid var(--bg-card)', marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                +{project.members.length - 4}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', color: COLORS[0], members: [] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users/all'),
      ]);
      setProjects(projRes.data.projects);
      setAllUsers(usersRes.data.users);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ title: '', description: '', deadline: '', color: COLORS[0], members: [] });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      setProjects((p) => p.filter((x) => x._id !== id));
    } catch { toast.error('Failed to delete project'); }
  };

  const filtered = projects.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div style={{ padding: '2rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.2rem' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: '2.25rem', width: 220, padding: '0.55rem 1rem 0.55rem 2.25rem' }}
              placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <FolderKanban size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No projects found</p>
          {isAdmin && <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}><Plus size={15} />Create First Project</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((p) => <ProjectCard key={p._id} project={p} onDelete={handleDelete} isAdmin={isAdmin} />)}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Project Title *</label>
            <input className="input-field" placeholder="e.g. Website Redesign" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={3} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea className="input-field" style={{ resize: 'vertical', minHeight: 80 }} placeholder="What is this project about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Deadline</label>
              <input type="date" className="input-field" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Add Members</label>
            <select className="input-field" multiple style={{ height: 120 }}
              value={form.members} onChange={(e) => setForm({ ...form, members: Array.from(e.target.selectedOptions, o => o.value) })}>
              {allUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Ctrl+Click to select multiple</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
