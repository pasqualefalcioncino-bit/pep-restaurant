import { getMenuImage } from './menuImages';

const featuredSpecialties = [
  {
    id: 1,
    categoria: 'Primi',
    nome: 'Risotto allo Zafferano',
    descrizione: "Carnaroli mantecato con zafferano puro di Navelli e foglia d'oro 23k.",
    prezzo: 24,
    rating: 4.9,
    immagine: 'risotto-allo-zafferano.webp',
  },
  {
    id: 2,
    categoria: 'Secondi',
    nome: 'Ossobuco alla Milanese',
    descrizione: 'Stinco di vitello brasato 6 ore, gremolada di limone e prezzemolo.',
    prezzo: 32,
    rating: 4.8,
    immagine: 'ossobuco-alla-milanese.jpg',
  },
  {
    id: 3,
    categoria: 'Dolci',
    nome: "Tiramisù d'Autore",
    descrizione: 'Mascarpone montato a mano, savoiardi al caffè espresso e cacao Valrhona.',
    prezzo: 12,
    rating: 4.9,
    immagine: 'tiramisu-d-autore.jpg',
  },
];

export const getHomeSpecialties = () => {
  return featuredSpecialties.map((specialty) => ({
    ...specialty,
    categoria: specialty.categoria.toUpperCase(),
    immagine: getMenuImage(specialty.immagine),
  }));
};
