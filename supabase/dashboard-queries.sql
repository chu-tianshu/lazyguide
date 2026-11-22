-- Paste each query into the Supabase SQL Editor, run it, then use the "Chart" tab in the results
-- (pick the x and y axes), and "Save" the snippet. Run supabase/analytics.sql first.

-- 1. Daily active users (line chart: x = day, y = active_users)
select day, active_users from analytics_daily order by day;

-- 2. Plays vs replays per day (line/bar: x = day, y = plays, replays)
select day, plays, replays from analytics_daily order by day;

-- 3. Most viewed places (bar: x = place, y = views)
select coalesce(w.title, a.work_id) as place, a.views
from analytics_works a
left join public.works w on w.museum_id = a.museum_id and w.id = a.work_id and w.language = 'en'
order by a.views desc limit 10;

-- 4. Replay count per work (bar: x = place, y = replays)
select coalesce(w.title, a.work_id) as place, a.replays
from analytics_works a
left join public.works w on w.museum_id = a.museum_id and w.id = a.work_id and w.language = 'en'
where a.replays > 0
order by a.replays desc limit 10;

-- 5. Audio minutes generated per day (bar: x = day, y = audio_minutes)
select day, round(audio_minutes::numeric, 1) as audio_minutes from analytics_usage_daily order by day;

-- 6. Guides generated and questions answered per day (bar: x = day, y = guide_generations, questions)
select day, guide_generations, questions from analytics_usage_daily order by day;
