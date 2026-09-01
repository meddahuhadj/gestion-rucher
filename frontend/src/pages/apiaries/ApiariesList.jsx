import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Warehouse, MapPin, Hexagon, Plus, Pencil, Trash2 } from 'lucide-react';
import { apiaryApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Spinner, EmptyState, Button, ConfirmDialog, Modal, Input, TextArea } from '../../components/ui';

const ApiaryForm = ({ initial, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return setError(t('apiaries.name') + ' ' + t('common.noData'));
    onSubmit({ name, location, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label={t('apiaries.name')} value={name} onChange={(e) => setName(e.target.value)} error={error} />
      <Input label={t('apiaries.location')} value={location} onChange={(e) => setLocation(e.target.value)} />
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
                  <div className="h-11 w-11 rounded-xl bg-honey-100 flex items-center justify-center">
                    <Warehouse className="h-6 w-6 text-honey-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800">{apiary.name}</p>
                    {apiary.location && (
                      <p className="text-sm text-stone-500 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {apiary.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(apiary); setFormOpen(true); }}
                    className="p-1.5 text-stone-400 hover:text-honey-600 hover:bg-stone-100 rounded-lg"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleting(apiary); }}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
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
