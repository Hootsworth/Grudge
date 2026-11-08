-- Kin Seed Data
BEGIN TRANSACTION;
INSERT OR REPLACE INTO puzzles (id, date, plate, status, created_at, published_at)
     VALUES ('kin-puzzle-2026-11-08', '2026-11-08', 'Deep Time Decoded #01', 'published', 1794144387102, 1794144387102);
INSERT OR REPLACE INTO rounds (id, puzzle_id, round_number, org_a, org_b, org_c, t1, t2, ci1_low, ci1_high, ci2_low, ci2_high, counterintuitive_score, fact)
       VALUES ('kin-puzzle-2026-11-08-r1', 'kin-puzzle-2026-11-08', 1, 'org_elephant', 'org_manatee', 'org_rhino', 65, 100, 58, 72, 94, 108, 4.5, 'Elephants and manatees are Afrotherians, while rhinos belong to the distantly related Perissodactyla.');
INSERT OR REPLACE INTO rounds (id, puzzle_id, round_number, org_a, org_b, org_c, t1, t2, ci1_low, ci1_high, ci2_low, ci2_high, counterintuitive_score, fact)
       VALUES ('kin-puzzle-2026-11-08-r2', 'kin-puzzle-2026-11-08', 2, 'org_crocodile', 'org_chicken', 'org_lizard', 240, 280, 232, 248, 272, 290, 4.8, 'Crocodiles are archosaurs, sharing closer ancestry with birds than with lizards.');
INSERT OR REPLACE INTO rounds (id, puzzle_id, round_number, org_a, org_b, org_c, t1, t2, ci1_low, ci1_high, ci2_low, ci2_high, counterintuitive_score, fact)
       VALUES ('kin-puzzle-2026-11-08-r3', 'kin-puzzle-2026-11-08', 3, 'org_hippo', 'org_blue_whale', 'org_cow', 55, 65, 52, 58, 62, 68, 4.9, 'Hippos and cetaceans form Whippomorpha, splitting after ruminants like cows branched off.');
INSERT OR REPLACE INTO rounds (id, puzzle_id, round_number, org_a, org_b, org_c, t1, t2, ci1_low, ci1_high, ci2_low, ci2_high, counterintuitive_score, fact)
       VALUES ('kin-puzzle-2026-11-08-r4', 'kin-puzzle-2026-11-08', 4, 'org_lungfish', 'org_cow', 'org_salmon', 415, 435, 405, 425, 428, 445, 4.7, 'Lobe-finned lungfish are more closely allied with land vertebrates than with ray-finned salmon.');
INSERT OR REPLACE INTO rounds (id, puzzle_id, round_number, org_a, org_b, org_c, t1, t2, ci1_low, ci1_high, ci2_low, ci2_high, counterintuitive_score, fact)
       VALUES ('kin-puzzle-2026-11-08-r5', 'kin-puzzle-2026-11-08', 5, 'org_human', 'org_mushroom', 'org_oak', 1350, 1550, 1250, 1420, 1480, 1630, 5, 'Animals and fungi unite under Opisthokonta, having diverged long after the plant lineage split.');
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-1-1', 'seed-session-001-b04fda84', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-1-2', 'seed-session-001-b04fda84', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-1-3', 'seed-session-001-b04fda84', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-1-4', 'seed-session-001-b04fda84', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-1-5', 'seed-session-001-b04fda84', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-001-b04fda84', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 880, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-2-1', 'seed-session-002-9b7a02fb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_manatee","org_rhino"]', 0, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-2-2', 'seed-session-002-9b7a02fb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_chicken","org_lizard"]', 0, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-2-3', 'seed-session-002-9b7a02fb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-2-4', 'seed-session-002-9b7a02fb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-2-5', 'seed-session-002-9b7a02fb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-002-9b7a02fb', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 500, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-3-1', 'seed-session-003-6cc1c254', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-3-2', 'seed-session-003-6cc1c254', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_lizard"]', 0, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-3-3', 'seed-session-003-6cc1c254', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_cow"]', 0, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-3-4', 'seed-session-003-6cc1c254', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_cow","org_salmon"]', 0, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-3-5', 'seed-session-003-6cc1c254', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-003-6cc1c254', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 100, 100, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-4-1', 'seed-session-004-94919f9a', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-4-2', 'seed-session-004-94919f9a', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-4-3', 'seed-session-004-94919f9a', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-4-4', 'seed-session-004-94919f9a', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-4-5', 'seed-session-004-94919f9a', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_mushroom"]', 1, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-004-94919f9a', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 2430, 1550, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-5-1', 'seed-session-005-638071ef', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-5-2', 'seed-session-005-638071ef', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-5-3', 'seed-session-005-638071ef', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_cow"]', 0, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-5-4', 'seed-session-005-638071ef', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-5-5', 'seed-session-005-638071ef', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-005-638071ef', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 815, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-6-1', 'seed-session-006-284b57f4', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-6-2', 'seed-session-006-284b57f4', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_lizard"]', 0, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-6-3', 'seed-session-006-284b57f4', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-6-4', 'seed-session-006-284b57f4', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-6-5', 'seed-session-006-284b57f4', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-006-284b57f4', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 600, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-7-1', 'seed-session-007-24c22570', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-7-2', 'seed-session-007-24c22570', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-7-3', 'seed-session-007-24c22570', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-7-4', 'seed-session-007-24c22570', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-7-5', 'seed-session-007-24c22570', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_mushroom"]', 1, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-007-24c22570', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 2430, 1550, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-8-1', 'seed-session-008-5d1789ec', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-8-2', 'seed-session-008-5d1789ec', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-8-3', 'seed-session-008-5d1789ec', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-8-4', 'seed-session-008-5d1789ec', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-8-5', 'seed-session-008-5d1789ec', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_mushroom"]', 1, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-008-5d1789ec', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 2430, 1550, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-9-1', 'seed-session-009-f84db7bb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-9-2', 'seed-session-009-f84db7bb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_chicken","org_lizard"]', 0, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-9-3', 'seed-session-009-f84db7bb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-9-4', 'seed-session-009-f84db7bb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-9-5', 'seed-session-009-f84db7bb', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-009-f84db7bb', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 600, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-10-1', 'seed-session-010-dfa81544', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-10-2', 'seed-session-010-dfa81544', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-10-3', 'seed-session-010-dfa81544', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_cow"]', 0, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-10-4', 'seed-session-010-dfa81544', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_salmon"]', 0, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-10-5', 'seed-session-010-dfa81544', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_mushroom"]', 1, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-010-dfa81544', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 1930, 1550, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-11-1', 'seed-session-011-56f18057', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-11-2', 'seed-session-011-56f18057', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-11-3', 'seed-session-011-56f18057', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-11-4', 'seed-session-011-56f18057', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-11-5', 'seed-session-011-56f18057', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-011-56f18057', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 880, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-12-1', 'seed-session-012-eb116ac0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-12-2', 'seed-session-012-eb116ac0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-12-3', 'seed-session-012-eb116ac0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_cow"]', 0, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-12-4', 'seed-session-012-eb116ac0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_cow","org_salmon"]', 0, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-12-5', 'seed-session-012-eb116ac0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-012-eb116ac0', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 380, 280, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-13-1', 'seed-session-013-ac14ccbc', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-13-2', 'seed-session-013-ac14ccbc', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-13-3', 'seed-session-013-ac14ccbc', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-13-4', 'seed-session-013-ac14ccbc', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_cow","org_salmon"]', 0, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-13-5', 'seed-session-013-ac14ccbc', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-013-ac14ccbc', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 445, 280, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-14-1', 'seed-session-014-16adc6d9', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-14-2', 'seed-session-014-16adc6d9', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-14-3', 'seed-session-014-16adc6d9', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-14-4', 'seed-session-014-16adc6d9', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-14-5', 'seed-session-014-16adc6d9', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-014-16adc6d9', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 880, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-15-1', 'seed-session-015-d38ad373', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-15-2', 'seed-session-015-d38ad373', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-15-3', 'seed-session-015-d38ad373', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-15-4', 'seed-session-015-d38ad373', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_cow","org_salmon"]', 0, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-15-5', 'seed-session-015-d38ad373', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-015-d38ad373', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 445, 280, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-16-1', 'seed-session-016-0f61f1c2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-16-2', 'seed-session-016-0f61f1c2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_lizard"]', 0, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-16-3', 'seed-session-016-0f61f1c2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-16-4', 'seed-session-016-0f61f1c2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-16-5', 'seed-session-016-0f61f1c2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-016-0f61f1c2', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 600, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-17-1', 'seed-session-017-3793c48b', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-17-2', 'seed-session-017-3793c48b', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-17-3', 'seed-session-017-3793c48b', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-17-4', 'seed-session-017-3793c48b', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-17-5', 'seed-session-017-3793c48b', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-017-3793c48b', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 880, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-18-1', 'seed-session-018-af499d9e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-18-2', 'seed-session-018-af499d9e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-18-3', 'seed-session-018-af499d9e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_blue_whale","org_cow"]', 0, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-18-4', 'seed-session-018-af499d9e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-18-5', 'seed-session-018-af499d9e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-018-af499d9e', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 815, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-19-1', 'seed-session-019-b2b4d112', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-19-2', 'seed-session-019-b2b4d112', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-19-3', 'seed-session-019-b2b4d112', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_blue_whale","org_cow"]', 0, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-19-4', 'seed-session-019-b2b4d112', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-19-5', 'seed-session-019-b2b4d112', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-019-b2b4d112', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 815, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-20-1', 'seed-session-020-9f823fd0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-20-2', 'seed-session-020-9f823fd0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-20-3', 'seed-session-020-9f823fd0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-20-4', 'seed-session-020-9f823fd0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-20-5', 'seed-session-020-9f823fd0', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-020-9f823fd0', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 880, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-21-1', 'seed-session-021-c5d9e63e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-21-2', 'seed-session-021-c5d9e63e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-21-3', 'seed-session-021-c5d9e63e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_blue_whale","org_cow"]', 0, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-21-4', 'seed-session-021-c5d9e63e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-21-5', 'seed-session-021-c5d9e63e', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-021-c5d9e63e', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 815, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-22-1', 'seed-session-022-638376f2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-22-2', 'seed-session-022-638376f2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-22-3', 'seed-session-022-638376f2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_cow"]', 0, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-22-4', 'seed-session-022-638376f2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-22-5', 'seed-session-022-638376f2', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-022-638376f2', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 815, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-23-1', 'seed-session-023-21596629', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_manatee","org_rhino"]', 0, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-23-2', 'seed-session-023-21596629', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_lizard"]', 0, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-23-3', 'seed-session-023-21596629', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-23-4', 'seed-session-023-21596629', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-23-5', 'seed-session-023-21596629', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-023-21596629', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 500, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-24-1', 'seed-session-024-fff99954', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-24-2', 'seed-session-024-fff99954', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-24-3', 'seed-session-024-fff99954', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-24-4', 'seed-session-024-fff99954', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_lungfish","org_cow"]', 1, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-24-5', 'seed-session-024-fff99954', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_human","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-024-fff99954', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 880, 435, 1);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-25-1', 'seed-session-025-44a701c3', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r1', 1, '["org_elephant","org_manatee"]', 1, 1794144387102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-25-2', 'seed-session-025-44a701c3', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r2', 2, '["org_crocodile","org_chicken"]', 1, 1794144392102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-25-3', 'seed-session-025-44a701c3', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r3', 3, '["org_hippo","org_blue_whale"]', 1, 1794144397102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-25-4', 'seed-session-025-44a701c3', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r4', 4, '["org_cow","org_salmon"]', 0, 1794144402102);
INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-25-5', 'seed-session-025-44a701c3', 'kin-puzzle-2026-11-08', 'kin-puzzle-2026-11-08-r5', 5, '["org_mushroom","org_oak"]', 0, 1794144407102);
INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('seed-session-025-44a701c3', 'kin-puzzle-2026-11-08', 1794144327102, 1794144387102, 6, 445, 280, 1);
INSERT OR REPLACE INTO daily_stats (date, puzzle_id, total_players, solve_rate_rounds_json, most_common_wrong_pair_json, updated_at)
     VALUES ('2026-11-08', 'kin-puzzle-2026-11-08', 25, '[0.92,0.76,0.68,0.76,0.16]', '{"roundIndex":5,"pairNames":["org_human","org_oak"],"count":11}', 1794144387102);
COMMIT;