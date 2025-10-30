-- Example video task seed
-- Task: Watch "Sustainability Basics" and answer quiz

INSERT INTO tasks (
  title,
  description,
  type,
  points,
  video_url,
  quiz_questions,
  co2_savings_kg,
  active
) SELECT
  'Sustainability Basics',
  'Watch the 1-minute intro video and answer two quick questions.',
  'video',
  25,
  'https://www.w3schools.com/html/mov_bbb.mp4',
  '[
    {"question":"Which bin is for paper?","options":["Blue","Green","Red"],"correctAnswer":"Blue"},
    {"question":"What should you do with lights when leaving a room?","options":["Leave on","Switch off"],"correctAnswer":"Switch off"}
  ]'::jsonb,
  0.20,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Sustainability Basics'
);


