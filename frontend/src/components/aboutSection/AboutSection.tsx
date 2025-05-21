import React from 'react';
import styles from './AboutSection.module.css';
import flowchartImage from '../../assets/flowchart.png'; // Adjust path if needed

const AboutSection: React.FC = () => {
  return (
    <section className={`${styles.aboutSection} container`}>
      <h2 className={styles.sectionTitle}>More About Genetic Algorithms</h2>
      <p className={styles.sectionSubtitle}>If you care</p>
      <div className={styles.contentWrapper}>
        <div className={styles.imageContainer}>
          <img src={flowchartImage} alt="Genetic Algorithm Flowchart" className={styles.flowchartImage} />
        </div>
        <div className={styles.textContainer}>
          <h4>The Basics</h4>
          <p>
            Genetic algorithms (GAs) are a fascinating area of computer science inspired by Charles Darwin's theory of natural selection. They are a type of evolutionary algorithm used for solving optimization and search problems. The core idea is to mimic the process of evolution – survival of the fittest – to find the best possible solution to a problem.
          </p>
          <h4>Population, Generation, and Gene Pool</h4>
          <p>
            In a GA, a 'population' consists of a set of potential solutions, often called 'individuals' or 'chromosomes.' Each individual is typically represented as a string of characters or numbers, which are analogous to 'genes.' The collection of all possible genes forms the 'gene pool.'
            A 'generation' refers to one iteration of the algorithm where the population is evaluated, and new individuals are created.
          </p>
          {/* Add more text sections as needed based on the image */}
          <p>
            This iterative process of evaluation, selection, crossover, and mutation continues for a number of generations, or until a satisfactory solution is found. The beauty of GAs lies in their ability to explore a vast search space efficiently and find solutions to complex problems that might be difficult to solve using traditional methods.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;