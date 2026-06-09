export const INVENTORY_CATEGORIES = [
  'Cereali e pasta',
  'Pasta fresca',
  'Latticini',
  'Carni',
  'Pesce',
  'Verdure',
  'Spezie',
  'Dolci',
  'Vini',
];

export const INVENTORY_UNITS = ['kg', 'g', 'l', 'ml', 'pz', 'bottiglie', 'vasetti'];

export const stockStatusLabels = {
  ok: 'Ok',
  monitorare: 'In esaurimento',
  comprare: 'Da comprare',
};

export const stockFilterOptions = ['Tutti', ...Object.values(stockStatusLabels)];

export const formatQuantity = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '0';
  }

  return numericValue.toLocaleString('it-IT', {
    maximumFractionDigits: 2,
    minimumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
  });
};

export const getStockStatus = (item) => {
  const quantity = Number(item.quantity);
  const totalQuantity = Number(item.total_quantity);
  const warningLimit = (totalQuantity * 2) / 3;

  if (!Number.isFinite(totalQuantity) || totalQuantity <= 0) {
    return 'comprare';
  }

  if (quantity <= totalQuantity / 3) {
    return 'comprare';
  }

  if (quantity <= warningLimit) {
    return 'monitorare';
  }

  return 'ok';
};

export const getInventoryStats = (items) => {
  const stockCounts = items.reduce(
    (counts, item) => {
      const status = getStockStatus(item);
      counts[status] += 1;

      return counts;
    },
    { ok: 0, monitorare: 0, comprare: 0 }
  );

  return [
    { label: 'Ingredienti', value: items.length, tone: 'neutral' },
    { label: 'Ok', value: stockCounts.ok, tone: 'ok' },
    {
      label: 'In esaurimento',
      value: stockCounts.monitorare,
      tone: stockCounts.monitorare > 0 ? 'warning' : 'ok',
    },
    {
      label: 'Da comprare',
      value: stockCounts.comprare,
      tone: stockCounts.comprare > 0 ? 'danger' : 'ok',
    },
  ];
};

export const getInventoryCategories = (items) => {
  const itemCategories = items.map((item) => item.category).filter(Boolean);

  return ['Tutti', ...new Set([...INVENTORY_CATEGORIES, ...itemCategories])];
};

export const filterInventoryItems = ({
  activeCategory,
  activeStockFilter,
  items,
  searchTerm,
}) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const selectedStatus = Object.entries(stockStatusLabels).find(([, label]) => {
    return label === activeStockFilter;
  })?.[0];

  return items.filter((item) => {
    const matchesCategory = activeCategory === 'Tutti' || item.category === activeCategory;
    const matchesStatus = activeStockFilter === 'Tutti' || getStockStatus(item) === selectedStatus;
    const matchesSearch =
      !normalizedSearch ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.category.toLowerCase().includes(normalizedSearch) ||
      (item.notes || '').toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesStatus && matchesSearch;
  });
};