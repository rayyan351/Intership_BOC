import Image from "next/image";
import { DISPLAY_PHONE, FEEDBACK_EMAIL, ORDER_PHONE } from "@/lib/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className="bg-red" id="locations">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image alt="Burger O'Clock" height={90} src="/images/brand/BurgerO'clock logo.webp" width={230} />
          <p>Premium burgers, bold flavours and direct online ordering across Karachi and Lahore.</p>
        </div>
        <div><h2>Information</h2><a href="#menu">Menu</a><a href="#super-savor-deals">Deals</a><a href="/admin">Admin UI</a><a href="#seo-heading">About</a></div>
        <div><h2>Contact us</h2><a href={`tel:${ORDER_PHONE}`}>{DISPLAY_PHONE}</a><a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a><span>Karachi · Lahore</span></div>
        <div className={styles.appVisual}><Image alt="Burger O'Clock ordering app placeholder" fill sizes="260px" src="/images/footer/promo.webp" /></div>
      </div>
      <div className={styles.bottom}><span>© 2026 Burger O'Clock. Frontend internship redevelopment.</span><div><a href="#">FAQs</a><a href="#">Privacy Policy</a></div></div>
    </footer>
  );
}
