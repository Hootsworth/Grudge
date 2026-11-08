-- Strata Seed Data
INSERT OR REPLACE INTO puzzles (id, date, plate, theme, spread_type, status, created_at, published_at)
     VALUES ('puzzle-2026-11-08', '2026-11-08', 'The Quantum Century', 'science', 'century', 'published', 1794143613417, 1794143613417);
INSERT OR REPLACE INTO events (id, puzzle_id, text, year, precision, source, true_order)
       VALUES ('puzzle-2026-11-08-e1', 'puzzle-2026-11-08', 'The first cloned mammal Dolly the sheep is born', 1996, 'exact', 'https://en.wikipedia.org/wiki/Dolly_(sheep)', 0);
INSERT OR REPLACE INTO events (id, puzzle_id, text, year, precision, source, true_order)
       VALUES ('puzzle-2026-11-08-e2', 'puzzle-2026-11-08', 'Cosmic microwave background radiation detected', 1964, 'exact', 'https://en.wikipedia.org/wiki/Cosmic_microwave_background', 1);
INSERT OR REPLACE INTO events (id, puzzle_id, text, year, precision, source, true_order)
       VALUES ('puzzle-2026-11-08-e3', 'puzzle-2026-11-08', 'Watson and Crick determine DNA double helix structure', 1953, 'exact', 'https://en.wikipedia.org/wiki/DNA', 2);
INSERT OR REPLACE INTO events (id, puzzle_id, text, year, precision, source, true_order)
       VALUES ('puzzle-2026-11-08-e4', 'puzzle-2026-11-08', 'Penicillin is discovered in Alexander Fleming’s lab', 1928, 'exact', 'https://en.wikipedia.org/wiki/Penicillin', 3);
INSERT OR REPLACE INTO events (id, puzzle_id, text, year, precision, source, true_order)
       VALUES ('puzzle-2026-11-08-e5', 'puzzle-2026-11-08', 'Hubble discovers galaxies beyond the Milky Way', 1924, 'exact', 'https://en.wikipedia.org/wiki/Edwin_Hubble', 4);
INSERT OR REPLACE INTO events (id, puzzle_id, text, year, precision, source, true_order)
       VALUES ('puzzle-2026-11-08-e6', 'puzzle-2026-11-08', 'Planck introduces quantum theory of black-body radiation', 1900, 'exact', 'https://en.wikipedia.org/wiki/Max_Planck', 5);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-1-1', 'seed-session-001-53535395', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e2","puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[false,false,true,true,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-1-2', 'seed-session-001-53535395', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-001-53535395', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-2-1', 'seed-session-002-d8ae3051', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4"]', '[true,true,true,false,true,false]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-2-2', 'seed-session-002-d8ae3051', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-002-d8ae3051', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-3-1', 'seed-session-003-5639d401', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e2","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,false,false,false,false,false]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-3-2', 'seed-session-003-5639d401', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,true,false,false,false,false]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-3-3', 'seed-session-003-5639d401', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143619417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-003-5639d401', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-4-1', 'seed-session-004-d6de7cce', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', '[true,true,true,false,false,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-4-2', 'seed-session-004-d6de7cce', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-004-d6de7cce', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-5-1', 'seed-session-005-875eca06', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e3","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[false,false,false,true,false,false]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-5-2', 'seed-session-005-875eca06', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,false,false,true,false,false]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-5-3', 'seed-session-005-875eca06', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,true,true,true,false,false]', 1794143619417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-5-4', 'seed-session-005-875eca06', 'puzzle-2026-11-08', 4, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,true,true,true,false,false]', 1794143621417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-005-875eca06', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 4, '["puzzle-2026-11-08-e4","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3"]', 0, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-6-1', 'seed-session-006-4c8142c9', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e2","puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[false,false,true,true,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-6-2', 'seed-session-006-4c8142c9', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-006-4c8142c9', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-7-1', 'seed-session-007-67fe72e3', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e2","puzzle-2026-11-08-e1","puzzle-2026-11-08-e4","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[false,false,false,false,false,false]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-7-2', 'seed-session-007-67fe72e3', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,true,false,false,false,false]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-7-3', 'seed-session-007-67fe72e3', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,true,true,true,false,false]', 1794143619417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-7-4', 'seed-session-007-67fe72e3', 'puzzle-2026-11-08', 4, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,true,true,true,false,false]', 1794143621417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-007-67fe72e3', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 4, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4"]', 0, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-8-1', 'seed-session-008-b90b7a61', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e2","puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[false,false,true,true,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-8-2', 'seed-session-008-b90b7a61', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e2","puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[false,false,true,true,true,true]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-8-3', 'seed-session-008-b90b7a61', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143619417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-008-b90b7a61', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 3, '["puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-9-1', 'seed-session-009-7174cbdc', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', '[true,true,true,false,false,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-9-2', 'seed-session-009-7174cbdc', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-009-7174cbdc', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-10-1', 'seed-session-010-97ef984c', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143615417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-010-97ef984c', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-11-1', 'seed-session-011-4e6f1d17', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,false,false,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-11-2', 'seed-session-011-4e6f1d17', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,false,false,true,true]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-11-3', 'seed-session-011-4e6f1d17', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143619417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-011-4e6f1d17', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-12-1', 'seed-session-012-dfd498af', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4"]', '[true,true,true,false,true,false]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-12-2', 'seed-session-012-dfd498af', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4"]', '[true,true,true,false,true,false]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-12-3', 'seed-session-012-dfd498af', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143619417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-012-dfd498af', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-13-1', 'seed-session-013-95b56bab', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e3","puzzle-2026-11-08-e1","puzzle-2026-11-08-e4","puzzle-2026-11-08-e2","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[false,false,false,false,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-13-2', 'seed-session-013-95b56bab', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-013-95b56bab', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-14-1', 'seed-session-014-113ab915', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,false,false,true,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-14-2', 'seed-session-014-113ab915', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,false,false,true,true,true]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-14-3', 'seed-session-014-113ab915', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143619417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-014-113ab915', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-15-1', 'seed-session-015-055b858c', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e4","puzzle-2026-11-08-e2","puzzle-2026-11-08-e5","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6"]', '[true,false,false,false,false,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-15-2', 'seed-session-015-055b858c', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6"]', '[true,true,false,false,false,true]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-15-3', 'seed-session-015-055b858c', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6"]', '[true,true,false,false,false,true]', 1794143619417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-15-4', 'seed-session-015-055b858c', 'puzzle-2026-11-08', 4, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6"]', '[true,true,false,true,false,true]', 1794143621417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-015-055b858c', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 4, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e6","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4"]', 0, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-16-1', 'seed-session-016-3df2d5cb', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e3","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', '[false,false,false,false,false,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-16-2', 'seed-session-016-3df2d5cb', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e2","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', '[true,false,false,false,false,true]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-16-3', 'seed-session-016-3df2d5cb', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e2","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', '[true,false,false,false,false,true]', 1794143619417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-16-4', 'seed-session-016-3df2d5cb', 'puzzle-2026-11-08', 4, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', '[true,true,true,false,false,true]', 1794143621417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-016-3df2d5cb', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 4, '["puzzle-2026-11-08-e6","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3"]', 0, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-17-1', 'seed-session-017-bb551362', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,false,false,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-17-2', 'seed-session-017-bb551362', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,false,false,true,true]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-17-3', 'seed-session-017-bb551362', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143619417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-017-bb551362', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-18-1', 'seed-session-018-2209e24a', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e3","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', '[false,false,false,false,false,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-18-2', 'seed-session-018-2209e24a', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-018-2209e24a', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e6","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-19-1', 'seed-session-019-ba1cb74d', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5"]', '[true,true,false,false,false,false]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-19-2', 'seed-session-019-ba1cb74d', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5"]', '[true,true,true,false,false,false]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-19-3', 'seed-session-019-ba1cb74d', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,true,true,true,false,false]', 1794143619417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-19-4', 'seed-session-019-ba1cb74d', 'puzzle-2026-11-08', 4, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143621417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-019-ba1cb74d', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 4, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-20-1', 'seed-session-020-fbe3a370', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,false,false,true,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-20-2', 'seed-session-020-fbe3a370', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,false,false,true,true,true]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-20-3', 'seed-session-020-fbe3a370', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143619417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-020-fbe3a370', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-21-1', 'seed-session-021-5684581f', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,false,false,true,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-21-2', 'seed-session-021-5684581f', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-021-5684581f', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-22-1', 'seed-session-022-8386ef5d', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e2","puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5"]', '[false,false,true,false,false,false]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-22-2', 'seed-session-022-8386ef5d', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5"]', '[true,true,true,false,false,false]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-22-3', 'seed-session-022-8386ef5d', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143619417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-022-8386ef5d', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 3, '["puzzle-2026-11-08-e3","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-23-1', 'seed-session-023-4c66c5b0', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e5","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6"]', '[true,true,true,false,false,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-23-2', 'seed-session-023-4c66c5b0', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-023-4c66c5b0', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e6","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-24-1', 'seed-session-024-895e20f1', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e6","puzzle-2026-11-08-e5"]', '[true,true,true,true,false,false]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-24-2', 'seed-session-024-895e20f1', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143617417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-024-895e20f1', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 2, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', 1, 1);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-25-1', 'seed-session-025-9d725501', 'puzzle-2026-11-08', 1, '["puzzle-2026-11-08-e2","puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[false,false,true,true,true,true]', 1794143615417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-25-2', 'seed-session-025-9d725501', 'puzzle-2026-11-08', 2, '["puzzle-2026-11-08-e2","puzzle-2026-11-08-e1","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[false,false,true,true,true,true]', 1794143617417);
INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('seed-guess-25-3', 'seed-session-025-9d725501', 'puzzle-2026-11-08', 3, '["puzzle-2026-11-08-e1","puzzle-2026-11-08-e2","puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6"]', '[true,true,true,true,true,true]', 1794143619417);
INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('seed-session-025-9d725501', 'puzzle-2026-11-08', 1794143583417, 1794143613417, 3, '["puzzle-2026-11-08-e3","puzzle-2026-11-08-e4","puzzle-2026-11-08-e5","puzzle-2026-11-08-e6","puzzle-2026-11-08-e1","puzzle-2026-11-08-e2"]', 1, 1);
INSERT OR REPLACE INTO daily_stats (date, puzzle_id, total_players, total_solves, avg_attempts, solve_rate, hardest_pair_json, updated_at)
     VALUES ('2026-11-08', 'puzzle-2026-11-08', 25, 21, 2.48, 0.84, '{"eventA":"Hubble discovers galaxies beyond the Milky Way","eventB":"Planck introduces quantum theory of black-body radiation","swaps":19}', 1794143613417);