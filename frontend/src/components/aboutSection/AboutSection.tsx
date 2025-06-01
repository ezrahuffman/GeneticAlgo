import React from 'react';
import styles from './AboutSection.module.css';
import flowchartImage from '../../assets/flowchart.png';

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
          <h4 className={styles.subsectionTitle}>The Basics</h4>
          <h5 className={styles.subsectionSubtitle}>Populations, Generations, and Cross-Over</h5>
          <p>
          To begin using a Genetic Algorithm (GA) we first need a population to operate on. This population is just a collection of states that represent “answers” to our problem. Generally  we want to represent these states as strings of characters. For instance, in the Traveling Salesperson problem, I chose to have the characters in the strings represent a city, so the string represents the order in which cities will be visited. Note that we don’t have to actually use strings to represent states, it could be an array, or any other sequential data structure (you could also use a non sequential data structure, but this is the “Basics” section). </p>

<p>To begin with, our population will be randomly generated. This set of states will be our first generation. To get to our next generation we need to evaluate how well each state meets our goal. This means we need some sort of evaluation function that takes our state as input and assigns a numeric value to it. For the TSP example I just used the total distance of the path (I actually made the distance negative so that larger distances were given a lower score).</p>

<p>Once we have a score for the states in our generation we are ready to create the next generation. In my implementation I chose to go from two parents to two children, some implementations go from two parents to one child. Either way, we chose the parents by randomly selecting two parents where each parent’s chance of being selected is weighted by their score that we assigned earlier with better performing individuals having a better chance of being chosen.</p>

<p>Once we have selected the two parents, we select a section of the string of “characters” (the length of which is determined by our crossover factor). Note: when I say characters I mean any element in an array, strings are just the data type I chose for this example. The same area is selected in both strings and then we swap the “characters” between the two parents. This crossover is analagous to gene crossover in biological evolution and the characters are representative of genes.</p>

<p>After performing the cross-over we are almost done. The last thing that is done in my implementation is to randomly mutate some part of the string, this could be no characters or all of them. The process for mutation is very simple, we just select random characters to replace the character(s) that we randomly selecteed. The mutation rate is another parameter that we tune by hand (at least in this case, there might be more advanced techniques to dynamically set this value). </p>

<p>That whole process is to create two children, we then just repeat the process as many times as we need to create the next generation and then repeat everything until we are satisfied with the result or we run out of time/patience.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;