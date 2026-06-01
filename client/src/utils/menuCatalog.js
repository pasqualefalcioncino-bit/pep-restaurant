export const menuCategories = ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Vini'];

export const categoryLabels = {
  Antipasti: 'Antipasti',
  Primi: 'Pasta',
  Secondi: 'Secondi',
  Dolci: 'Dolci',
  Vini: 'Vini',
};

export const orderStatuses = [
  { value: 'in_attesa', label: 'In attesa' },
  { value: 'in_preparazione', label: 'In preparazione' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'servito', label: 'Servito' },
  { value: 'annullato', label: 'Annullato' },
];

export const orderStatusLabels = Object.fromEntries(
  orderStatuses.map((status) => [status.value, status.label])
);

const categoryOrder = Object.fromEntries(
  menuCategories.map((category, index) => [category, index + 1])
);

export const compareMenuCategory = (currentCategory, nextCategory) => {
  return (categoryOrder[currentCategory] || 99) - (categoryOrder[nextCategory] || 99);
};

export const sortByMenuCategory = (currentItem, nextItem) => {
  const categoryComparison = compareMenuCategory(currentItem.category, nextItem.category);

  if (categoryComparison !== 0) {
    return categoryComparison;
  }

  const currentName = currentItem.name || currentItem.item_name || '';
  const nextName = nextItem.name || nextItem.item_name || '';

  return currentName.localeCompare(nextName, 'it');
};

export const getOrderStatusLabel = (status) => orderStatusLabels[status] || status;
