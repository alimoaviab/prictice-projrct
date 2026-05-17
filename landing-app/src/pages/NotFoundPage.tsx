import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './not-found.css';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <nav className="shelf" aria-label="Helpful links">
        <Link className="book home-page" to="/">
          Dashboard
        </Link>
        <Link className="book about-us" to="/about">
          Plexa
        </Link>
        <button
          type="button"
          className="book contact"
          onClick={() => navigate(0)}
        >
          Reload
        </button>
        <Link className="book faq" to="/careers">
          Class
        </Link>
        <Link className="book timetable" to="/timetable">
          Timetable
        </Link>
        <Link className="book exams" to="/exams">
          Exams
        </Link>
        <Link className="book results" to="/results">
          Results
        </Link>
        <Link className="book behavior" to="/behavior">
          Behavior
        </Link>
        <Link className="book leave" to="/leave">
          Leave
        </Link>
        <Link className="book events" to="/events">
          Events
        </Link>

        <span className="book not-found" aria-hidden="true" />

        <span className="door left" aria-hidden="true" />
        <span className="door right" aria-hidden="true" />
      </nav>

      <h1 id="not-found-title">Error 404</h1>
      <p>The page you&apos;re looking for can&apos;t be found.</p>
    </main>
  );
};
