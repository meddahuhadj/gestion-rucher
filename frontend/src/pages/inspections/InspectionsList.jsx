import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Trash2 } from 'lucide-react';
import { inspectionApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Spinner, EmptyState, Badge, ConfirmDialog, Input } from '../../components/ui';
import { formatDate } from '../../utils/format';

const strengthColors = { VERY_STRONG: 'emerald', STRONG: 'green', MEDIUM: 'yellow', WEAK: 'red', VERY_WEAK: 'red' };

export const InspectionsList = () => {
  const { t } = useTranslation();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await inspectionApi.list();
        setInspections(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = search
    ? inspections.filter((i) => i.hive?.number === parseInt(search) || (i.observations || '').toLowerCase().includes(search.toLowerCase()))
    : inspections;

  const handleDelete = async () => {
    if (!deleting) return;
    await inspectionApi.remove(deleting.id);
    setDeleting(null);
    setInspections((prev) => prev.filter((i) => i.id !== deleting.id));
  };

  return (
    <div>
      <PageHeader title={t('inspections.title')} icon={Search} onAdd={() => undefined} />

      <Link to="/inspections/new" className="mb-5 inline-flex items-center gap-2 px-4 py-2.5 bg-honey-500 text-white text-sm font-medium rounded-lg hover:bg-honey-600 shadow-sm">
        <Plus className="h-4 w-4" /> {t('inspections.add')}
      </Link>

      <Card className="p-4 mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common.search')} />
        </div>
      </Card>

      {loading ? (
        <Spinner className="py-16" />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filtered.map((insp) => (
            <Card key={insp.id} className="p-4">
              <Link to={`/inspections/${insp.id}`} className="block">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-honey-100 flex items-center justify-center text-lg">🐝</div>
                    <div>
                      <p className="font-semibold text-stone-800">
                        {t('dashboard.hiveNumber')}{insp.hive?.number} {insp.hive?.name || ''}
                      </p>
                      <p className="text-xs text-stone-400">{formatDate(insp.date)} {insp.time || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={strengthColors[insp.strength]}>{t(`hiveStrength.${insp.strength}`)}</Badge>
                    <button
                      onClick={(e) => { e.preventDefault(); setDeleting(insp); }}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {insp.observations && <p className="text-sm text-stone-600 line-clamp-2">{insp.observations}</p>}
              </Link>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
      />
    </div>
  );
};
