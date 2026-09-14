import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import styles from './home.module.css'

export function NotFoundPage() {
  return (
    <section className="container" aria-labelledby="notfound-title">
      <div className={styles.notFound}>
        <p className={`${styles.eyebrow} v-mono`}>404</p>
        <h1 id="notfound-title" className={styles.heroTitle}>
          This shelf is empty.
        </h1>
        <p className={styles.heroSub}>
          The page you&rsquo;re looking for doesn&rsquo;t exist — or never did.
        </p>
        <Link to="/" className={styles.homeLink}>
          Back to Vellum
          <Icon aria-hidden="true" name="arrow-right" size={14} />
        </Link>
      </div>
    </section>
  )
}
