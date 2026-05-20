const menuImageModules = import.meta.glob('../assets/images/menu/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
});

const menuImages = Object.fromEntries(
  Object.entries(menuImageModules).map(([path, url]) => {
    const fileName = path.split('/').pop();
    return [fileName, url];
  })
);

export const getMenuImage = (fileName) => {
  if (!fileName) return '';

  const imageUrl = menuImages[fileName];
  
  if (!imageUrl) {
    console.warn(`[MenuImages] Immagine non trovata: ${fileName}`);
    return '';
  }

  return imageUrl;
};