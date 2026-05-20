const brandImageModules = import.meta.glob('../assets/images/brand/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
});

const brandImages = Object.entries(brandImageModules).reduce((images, [path, imageUrl]) => {
  const fileName = path.split('/').pop();

  return {
    ...images,
    [fileName]: imageUrl,
  };
}, {});

export const getBrandImage = (fileName) => {
  if (!fileName) {
    return '';
  }

  return brandImages[fileName] || '';
};
