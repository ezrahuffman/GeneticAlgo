import React from 'react';
import ExampleCard from './ExampleCard';
import styles from './CurrentExamples.module.css';

const examplesData = [
  {
    id: 'tsp',
    title: 'Traveling Salesperson',
    description: 'Classic optimization problem to find the shortest possible route that visits each city exactly once and returns to the origin city.',
    tooltipContent: 'Explores various heuristic algorithms.',
    onEnter: () => console.log('Entering Traveling Salesperson'),
  },
  {
    id: 'platformer',
    title: 'Platformer Game',
    description: 'Genetic algorithms can evolve AI behaviors for characters or generate interesting and challenging level designs very short lorem.',
    tooltipContent: 'AI agents learn to navigate levels.',
    onEnter: () => console.log('Entering Platformer Game'),
  },
];

const CurrentExamples: React.FC = () => {
  return (
    <section className={`${styles.currentExamplesSection} container`}>
      <h2 className={styles.sectionTitle}>Current Examples</h2>
      <p className={styles.sectionSubtitle}>Explore some visualizations</p>
      <div className={styles.examplesGrid}>
        {examplesData.map((example) => (
          <ExampleCard
            key={example.id}
            title={example.title}
            description={example.description}
            tooltipContent={example.tooltipContent}
            onEnter={example.onEnter}
          />
        ))}
      </div>
    </section>
  );
};

export default CurrentExamples;