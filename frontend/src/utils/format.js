export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${formatDate(date)} ${time}`;
};

export const toInputDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};

export const formatMoney = (amount, currency = 'DZD') => {
  if (amount === null || amount === undefined) return '—';
  const val = Number(amount).toLocaleString('en-US');
  return `${val} ${currency}`;
};
