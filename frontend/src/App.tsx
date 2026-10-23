import {NavLink, Route, Routes} from "react-router-dom";
import BookPage from "./pages/BookPage.tsx";
import HostPage from "./pages/HostPage.tsx";

export default function App() {
  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div>
            <h1 className="logo">BookCourt</h1>
            <p className="tagline">Book the hall for your team.</p>
          </div>
          <nav className="nav">
            <NavLink to="/" end>Book</NavLink>
            <NavLink to="/host">Host</NavLink>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<BookPage />} />
          <Route path="/host" element={<HostPage />} />
        </Routes>
      </main>

    </>
  );
}