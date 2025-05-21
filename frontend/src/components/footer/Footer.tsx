import React from 'react';
import { Twitter, Github, Linkedin } from 'lucide-react'; // Using Twitter for X
import styles from './Footer.module.css';

const socialLinks = [
  { id: 'x', href: 'https://x.com', Icon: Twitter },
  { id: 'github', href: 'https://github.com', Icon: Github },
  { id: 'linkedin', href: 'https://linkedin.com', Icon: Linkedin },
];

const Footer: React.FC = () => {
  return (
    <footer className={`${styles.footer} container`}>
      <div className={styles.socialIcons}>
        {socialLinks.map(({ id, href, Icon }) => (
          <a key={id} href={href} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label={`Visit ${id} profile`}>
            <Icon size={20} />
          </a>
        ))}
      </div>
      <span className={styles.resourcesText}>RESOURCES</span>
    </footer>
  );
};

export default Footer;