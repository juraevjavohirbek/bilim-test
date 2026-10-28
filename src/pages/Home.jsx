//import pages
import HeroSection from "../components/HeroSection"
import SubjectCard from "../components/SubjectCard"
import LearningBackdrop from "../components/LearningBackdrop";

//import icons
import bookIcon from "../assets/book.svg";
import calculatorIcon from "../assets/calculator.svg";
import historyIcon from "../assets/history.svg";
import globeIcon from "../assets/globe.svg";
import flaskIcon from "../assets/flask.svg";
import monitorIcon from "../assets/monitor.svg";

function Home() {
  return (
    <div className="main-container home-page">
        <LearningBackdrop />
        <HeroSection/>

        <section className="subject-section container">
        <h2 className="section-heading">Fanlar</h2>

        <div className="subject-grid">
          <SubjectCard icon={bookIcon} title="Ona tili"/>
          <SubjectCard icon={calculatorIcon} title="Matematika"/>
          <SubjectCard icon={historyIcon} title="Tarix"/>
          <SubjectCard icon={globeIcon} title="Geografiya"/>
          <SubjectCard icon={flaskIcon} title="Tabiiy fanlar"/>
          <SubjectCard icon={monitorIcon} title="Informatika"/>
        </div>
      </section>
    </div>
  )
}

export default Home
