import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Warehouse, MapPin, Hexagon, Plus, Pencil, Trash2, LocateFixed, ExternalLink } from 'lucide-react';
import { apiaryApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Spinner, EmptyState, Button, ConfirmDialog, Modal, Input, TextArea } from '../../components/ui';
import { requestGeo, formatCoords, parseCoords, mapUrl } from '../../utils/geo';

const ApiaryForm = ({ initial, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError] = useState('');
  const [geoStatus, setGeoStatus] = useState('idle');

  const useMyLocation = async () => {
    setGeoStatus('loading');
    try {
      const g = await requestGeo();
      setLocation(formatCoords(g.lat, g.lng));
      setGeoStatus('idle');
    } catch {
      setGeoStatus('error');
    }
  };

  const coords = parseCoords(location);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return setError(t('apiaries.name') + ' ' + t('common.noData'));
    onSubmit({ name, location, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label={t('apiaries.name')} value={name} onChange={(e) => setName(e.target.value)} error={error} />
      <div>
        <Input label={t('apiaries.location')} value={location} onChange={(e) => setLocation(e.target.value)} />
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoStatus === 'loading'}
            className="inline-flex items-center gap-1 font-medium text-honey-600 hover:text-honey-700 disabled:opacity-50 dark:text-honey-400"
          >
            <LocateFixed className={`h-3.5 w-3.5 ${geoStatus === 'loading' ? 'animate-spin' : ''}`} />
            {t('geo.useMyLocation')}
          </button>
          {coords && (
            <a
              href={mapUrl(coords.lat, coords.lng)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-stone-500 hover:text-honey-600 dark:text-stone-400"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {t('geo.openMap')}
            </a>
          )}
          {geoStatus === 'error' && <span className="text-red-500">{t('geo.error')}</span>}
        </div>
      </div>
      <TextArea label={t('common.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  );
};

export const ApiariesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [apiaries, setApiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiaryApi.list();
      setApiaries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editing) await apiaryApi.update(editing.id, data);
    else await apiaryApi.create(data);
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await apiaryApi.remove(deleting.id);
    setDeleting(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title={t('apiaries.title')}
        subtitle={t('apiaries.subtitle')}
        icon={Warehouse}
        onAdd={() => { setEditing(null); setFormOpen(true); }}
        addLabel={t('apiaries.add')}
      />

      {loading ? (
        <Spinner className="py-16" />
      ) : apiaries.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apiaries.map((apiary) => (
            <Card
              key={apiary.id}
              className="p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/apiaries/${apiary.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-honey-100 flex items-center justify-center dark:bg-honey-900/40">
                    <Warehouse className="h-6 w-6 text-honey-600 dark:text-honey-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 dark:text-stone-100">{apiary.name}</p>
                    {apiary.location && (() => {
                      const c = parseCoords(apiary.location);
                      return c ? (
                        <a
                          href={mapUrl(c.lat, c.lng)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-honey-600 flex items-center gap-1 hover:underline dark:text-honey-400"
                        >
                          <MapPin className="h-3.5 w-3.5" /> {formatCoords(c.lat, c.lng)}
                        </a>
                      ) : (
                        <p className="text-sm text-stone-500 flex items-center gap-1 dark:text-stone-400">
                          <MapPin className="h-3.5 w-3.5" /> {apiary.location}
                        </p>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(apiary); setFormOpen(true); }}
                    className="p-1.5 text-stone-400 hover:text-honey-600 hover:bg-stone-100 rounded-lg dark:hover:bg-stone-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleting(apiary); }}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <Hexagon className="h-4 w-4" />
                {apiary._count?.hives || 0} {t('apiaries.hiveCount')}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t('apiaries.edit') : t('apiaries.add')}>
        <ApiaryForm
          initial={editing}
          onSubmit={handleSave}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
      />
    </div>
  );
};
