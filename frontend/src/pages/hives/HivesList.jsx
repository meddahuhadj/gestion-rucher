import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hexagon, Plus, Search, Trash2, Filter } from 'lucide-react';
import { hiveApi, apiaryApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { HiveCard } from '../../components/common/HiveCard';
import { Card, Spinner, EmptyState, Input, Select, ConfirmDialog } from '../../components/ui';

export const HivesList = () => {
  const { t } = useTranslation();
  const [hives, setHives] = useState([]);
  const [apiaries, setApiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [strengthFilter, setStrengthFilter] = useState('');
  const [apiaryFilter, setApiaryFilter] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (strengthFilter) params.strength = strengthFilter;
      if (apiaryFilter) params.apiaryId = apiaryFilter;
      const data = await hiveApi.list(params);
      setHives(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, strengthFilter, apiaryFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiaryApi.list().then(setApiaries).catch(() => {});
  }, []);

  const filtered = search
    ? hives.filter(
        (h) =>
          (h.name && h.name.toLowerCase().includes(search.toLowerCase())) ||
          String(h.number).includes(search)
      )
    : hives;

  const handleDelete = async () => {
    if (!deleting) return;
    await hiveApi.remove(deleting.id);
    setDeleting(null);
    load();
  };

  const hasFilters = statusFilter || strengthFilter || apiaryFilter;

  return (
    <div>
      <PageHeader title={t('hives.title')} icon={Hexagon} onAdd={() => undefined} addLabel="" />

      <Link
        to="/hives/new"
        className="mb-5 inline-flex items-center gap-2 px-4 py-2.5 bg-honey-500 text-white text-sm font-medium rounded-lg hover:bg-honey-600 shadow-sm"
      >
        <Plus className="h-4 w-4" /> {t('hives.add')}
      </Link>

      <Card className="p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
            <Input
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('common.all')} — {t('hives.status')}</option>
            {['ACTIVE', 'WEAK', 'DEAD', 'SOLD', 'MERGED', 'ARCHIVED'].map((s) => (
              <option key={s} value={s}>{t(`hiveStatus.${s}`)}</option>
            ))}
          </Select>
          <Select value={strengthFilter} onChange={(e) => setStrengthFilter(e.target.value)}>
            <option value="">{t('common.all')} — {t('hives.strength')}</option>
            {['VERY_STRONG', 'STRONG', 'MEDIUM', 'WEAK', 'VERY_WEAK'].map((s) => (
              <option key={s} value={s}>{t(`hiveStrength.${s}`)}</option>
            ))}
          </Select>
          <Select value={apiaryFilter} onChange={(e) => setApiaryFilter(e.target.value)}>
            <option value="">{t('common.all')} — {t('hives.apiary')}</option>
            {apiaries.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
        {hasFilters && (
          <button className="mt-3 text-sm text-honey-600 hover:underline inline-flex items-center gap-1 dark:text-honey-400" onClick={() => { setStatusFilter(''); setStrengthFilter(''); setApiaryFilter(''); }}>
            <Filter className="h-3.5 w-3.5" /> {t('common.filter')}
          </button>
        )}
      </Card>

      {loading ? (
        <Spinner className="py-16" />
      ) : filtered.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((hive) => (
            <HiveCard
              key={hive.id}
              hive={hive}
              onDelete={(h) => setDeleting(h)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={`${t('common.confirmDelete')} ${deleting ? t('dashboard.hiveNumber') + deleting.number : ''}`}
      />
    </div>
  );
};
