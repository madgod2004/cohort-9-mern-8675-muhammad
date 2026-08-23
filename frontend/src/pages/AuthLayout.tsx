import type { ReactNode } from 'react';

import { APP_NAME } from '../config';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  heading: string;
  subheading: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ heading, subheading, children, footer }: AuthLayoutProps) {
  return (
    <main className={styles.page}>
      <p className={styles.wordmark}>{APP_NAME}</p>

      <div className={`panel ${styles.card}`}>
        <div className={styles.intro}>
          <h1 className={styles.heading}>{heading}</h1>
          <p className={styles.subheading}>{subheading}</p>
        </div>
        {children}
      </div>

      <p className={styles.footer}>{footer}</p>
    </main>
  );
}
