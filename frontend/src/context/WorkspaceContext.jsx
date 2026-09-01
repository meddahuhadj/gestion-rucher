import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { workspaceApi } from '../api';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeId, setActiveId] = useState(() => localStorage.getItem('workspaceId') || null);
  const [loading, setLoading] = useState(true);

  const active = workspaces.find((w) => w.id === activeId) || workspaces[0] || null;
  const members = active?.members || [];
  const myRole = active?.role || null;

  const refresh = useCallback(async () => {
    try {
      const data = await workspaceApi.current();
      setWorkspaces(data.workspaces);
      const id = data.activeId || (data.workspaces[0] && data.workspaces[0].id) || null;
      setActiveId(id);
      if (id) localStorage.setItem('workspaceId', id);
      else localStorage.removeItem('workspaceId');
    } catch (e) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [refresh]);

  const setActive = useCallback(async (workspaceId) => {
    setActiveId(workspaceId);
    localStorage.setItem('workspaceId', workspaceId);
    try {
      await workspaceApi.setActive(workspaceId);
    } catch (e) {}
  }, []);

  const createWorkspace = useCallback(async (name) => {
    const ws = await workspaceApi.create({ name });
    setWorkspaces((prev) => [...prev, ws]);
    setActiveId(ws.id);
    localStorage.setItem('workspaceId', ws.id);
    return ws;
  }, []);

  const joinWorkspace = useCallback(async (code) => {
    const ws = await workspaceApi.join({ code });
    setWorkspaces((prev) => {
      if (prev.some((w) => w.id === ws.id)) return prev;
      return [...prev, ws];
    });
    setActiveId(ws.id);
    localStorage.setItem('workspaceId', ws.id);
    return ws;
  }, []);

  const removeMember = useCallback(async (workspaceId, userId) => {
    await workspaceApi.removeMember(workspaceId, userId);
    await refresh();
  }, [refresh]);

  const leaveWorkspace = useCallback(async (workspaceId) => {
    await workspaceApi.leave(workspaceId);
    localStorage.removeItem('workspaceId');
    await refresh();
  }, [refresh]);

  const transferOwner = useCallback(async (workspaceId, userId) => {
    await workspaceApi.transferOwner(workspaceId, userId);
    await refresh();
  }, [refresh]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        active,
        members,
        myRole,
        activeId,
        loading,
        refresh,
        setActive,
        createWorkspace,
        joinWorkspace,
        removeMember,
        leaveWorkspace,
        transferOwner,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
