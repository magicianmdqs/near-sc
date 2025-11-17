import styles from '@/styles/app.module.css'
import { Link } from 'react-router'

export const Cards = () => {
  return (
    <div className={styles.grid}>
      <Link to="/hello-near" className={styles.card} rel="noopener noreferrer">
        <h2>
          Interact<span>-&gt;</span>
        </h2>
        <p>Call and view contract methods.</p>
      </Link>
    </div>
  )
}