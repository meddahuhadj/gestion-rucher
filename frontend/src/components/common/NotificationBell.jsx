import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationApi } from '../../api';

export const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await notificationApi.list({ read: 'false' });
        setCount(Array.isArray(data) ? data.length : 0);
      } catch {
        setCount(0);
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative p-2 text-stone-500 hover:text-honey-600 hover:bg-stone-100 rounded-lg"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -end-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};
