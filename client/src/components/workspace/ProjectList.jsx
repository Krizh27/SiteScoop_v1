import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../../services/workspaceApi';
import { FolderGit2, ArrowRight, Calendar, FileText, Sparkles } from 'lucide-react';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-ink-muted">
        Loading existing workspaces...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-ink-muted">
        No recovered projects found yet. Enter a website URL above or launch the demo site.
      </div>
    );
  }

  return (
    <div className="mt-10 text-left space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
          Recovered Workspaces ({projects.length})
        </h3>
        <span className="text-xs text-ink-muted">Saved in local workspace</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {projects.map((p) => {
          const isDemo = p.projectId === 'demo-site';
          return (
            <div
              key={p.projectId}
              className="group p-4 bg-white border border-border rounded-xl shadow-clean hover:border-zinc-300 hover:shadow-clean-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-xs text-ink truncate" title={p.sourceUrl || p.projectId}>
                    {p.sourceUrl || p.projectId}
                  </h4>
                  {isDemo && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      <Sparkles size={10} /> Seeded Demo
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-mono text-ink-muted mt-1 truncate">
                  ID: {p.projectId}
                </p>

                <div className="flex items-center gap-3 mt-3 text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {p.fileCount} files
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Link 
                to={`/project/${p.projectId}`} 
                className="mt-4 flex items-center justify-center gap-1.5 w-full bg-subtle hover:bg-zinc-200 text-ink text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
              >
                <span>Open in Workspace</span>
                <ArrowRight size={13} className="text-ink-muted group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectList;
