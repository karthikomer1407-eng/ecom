import { Link } from "react-router-dom";

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" className="footer-wordmark">Hayati Elixirs</Link>
          <span className="footer-brand-rule" />
          <p>Fragrance with a story.<br />Made to linger.</p>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/#collection">The Collection</Link>
          <Link to="/cart">Your Cart</Link>
          <Link to="/orders">My Orders & Support</Link>
        </div>

        <div className="footer-column">
          <h3>The House</h3>
          <span>Thoughtfully chosen scents</span>
          <span>Composed for every occasion</span>
          <span>A signature, made personal</span>
        </div>

        <div className="footer-note">
          <span className="footer-overline">A LASTING IMPRESSION</span>
          <p>Discover a scent that feels<br />uniquely yours.</p>
          <Link to="/#collection" className="footer-discover">Discover the collection <span>↗</span></Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {CURRENT_YEAR} Hayati Elixirs</span>
        <span>Crafted for those who leave a trace.</span>
      </div>
    </footer>
  );
}

export default Footer;
