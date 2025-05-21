import React from 'react';
import styles from './Hero.module.css';

const Hero: React.FC = () => {
  return (
    <section className={`${styles.hero} container`}>
      <h1 className={styles.title}>Genetic Optimization</h1>
      <p className={styles.subtitle}>A Visualization App by Ezra Huffman</p>
    </section>
  );
};

export default Hero;