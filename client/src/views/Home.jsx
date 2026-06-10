import HomeHero from '../components/home/HomeHero';
import HomeFeatures from '../components/home/HomeFeatures';
import HomeSpecialties from '../components/home/HomeSpecialties';
import HomeFinalCta from '../components/home/HomeFinalCta';
import homeData from '../data/homeData.json';
import { getHomeSpecialties } from '../utils/homeSpecialties';
import './Home.css';

const Home = ({ onNavigate }) => {
  const specialita = getHomeSpecialties();

  return (
    <div className="home-page">
      <HomeHero hero={homeData.hero} onNavigate={onNavigate} />
      <HomeFeatures features={homeData.features} />
      <HomeSpecialties specialita={specialita} onNavigate={onNavigate} />
      <HomeFinalCta onNavigate={onNavigate} />
    </div>
  );
};

export default Home;
