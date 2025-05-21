import React from 'react';
import Logo from './Logo';
import styles from './Header.module.css';

const Header: React.FC = () => {
  return (
    <header className={`${styles.header} container`}>
      <Logo />
      <nav className={styles.nav}>
        <a href="#contact" className={styles.navLink}>Contact</a>
        <a href="#link" className={styles.navLink}>Link</a>
      </nav>
    </header>
  );
};

export default Header;