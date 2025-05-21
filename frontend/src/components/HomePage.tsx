import AboutSection from "./aboutSection/AboutSection";
import CurrentExamples from "./currentExamples/CurrentExamples";
import Footer from "./footer/Footer";
import Header from "./header/Header";
import Hero from "./hero/Hero";

const HomePage = () => {
    return (
        <>
      <Header />
      <main>
        <Hero />
        <CurrentExamples />
        <AboutSection />
      </main>
      <Footer />
    </>
    );
};

export default HomePage;