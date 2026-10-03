import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../../services/workspaceApi';

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

  if (loading) return <div className="text-gray-500 py-4">Loading projects...</div>;

  if (projects.length === 0) return <div className="text-gray-500 py-4">No recovered projects found.</div>;

  return (
    <div className="mt-8 text-left space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Recovered Projects</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div key={p.projectId} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <h4 className="font-semibold text-blue-700 truncate" title={p.sourceUrl}>{p.sourceUrl}</h4>
              <p className="text-xs text-gray-500 font-mono mt-1">{p.projectId}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span>Files: {p.fileCount}</span>
                <span>Created: {new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <Link 
              to={`/project/${p.projectId}`} 
              className="mt-4 inline-block text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
            >
              Open Project
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;
