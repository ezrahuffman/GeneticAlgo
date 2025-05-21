import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';
import styles from './ExampleCard.module.css';

interface ExampleCardProps {
  title: string;
  description: string;
  tooltipContent: string;
  onEnter: () => void;
}

const ExampleCard: React.FC<ExampleCardProps> = ({ title, description, tooltipContent, onEnter }) => {
  return (
    <div className={styles.card}>
      <div className={styles.titleContainer}>
        <h3 className={styles.title}>{title}</h3>
        <Tooltip.Provider delayDuration={200}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className={styles.infoButton} aria-label={`More info about ${title}`}>
                <Info size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltipContent} sideOffset={5}>
                {tooltipContent}
                <Tooltip.Arrow className={styles.tooltipArrow} />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
      <p className={styles.description}>{description}</p>
      <button className={`button-base ${styles.enterButton}`} onClick={onEnter}>
        Enter
      </button>
    </div>
  );
};

export default ExampleCard;