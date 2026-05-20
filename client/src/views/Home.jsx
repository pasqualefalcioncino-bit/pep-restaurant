import HomeHero from '../components/home/HomeHero';
import HomeFeatures from '../components/home/HomeFeatures';
import HomeSpecialties from '../components/home/HomeSpecialties';
import HomeReviews from '../components/home/HomeReviews';
import HomeFinalCta from '../components/home/HomeFinalCta';
import homeData from '../data/homeData.json';
import './Home.css';

const Home = ({ onNavigate }) => {
  return (
    <div className="home-page">
      <HomeHero hero={homeData.hero} onNavigate={onNavigate} />
      <HomeFeatures features={homeData.features} />
      <HomeSpecialties specialita={homeData.specialita} onNavigate={onNavigate} />
      <HomeReviews recensioni={homeData.recensioni} />
      <HomeFinalCta onNavigate={onNavigate} />
    </div>
  );
};

export default Home;
