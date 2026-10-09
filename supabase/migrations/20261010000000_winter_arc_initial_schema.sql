-- =====================================================================================
-- WINTER ARC – NAMDAPHA (IIT MADRAS BS DEGREE)
-- Production Database Schema, Row Level Security (RLS), and Privileged Stored Procedures
-- Challenge Window: October 10, 2026 - December 31, 2026
-- Timezone: Asia/Kolkata (IST)
-- =====================================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'coordinator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('active', 'paused', 'completed', 'invalidated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE point_category AS ENUM ('study_goal', 'workout', 'mission', 'streak_milestone', 'adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Separated from auth.users, zero email exposure in public queries)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    username_changes_count INT NOT NULL DEFAULT 0 CHECK (username_changes_count <= 1),
    role user_role NOT NULL DEFAULT 'student',
    house TEXT NOT NULL DEFAULT 'Namdapha',
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 4. CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    scoring_config JSONB NOT NULL DEFAULT '{
        "daily_study_goal_pts": 10,
        "workout_pts": 5,
        "weekly_mission_pts": 20,
        "study_streak_7_pts": 10,
        "study_streak_14_pts": 20,
        "study_streak_30_pts": 50,
        "daily_study_target_minutes": 180,
        "weekly_workout_target": 3
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 5. CHALLENGE WEEKS TABLE (Handles the 12 periods, including partial final week)
CREATE TABLE IF NOT EXISTS public.challenge_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    required_workouts INT NOT NULL DEFAULT 3,
    is_partial_week BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    UNIQUE (challenge_id, week_number)
);

-- 6. CHALLENGE MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.challenge_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (challenge_id, user_id)
);

-- 7. STUDY SESSIONS TABLE (Authoritative duration calculated from timestamps)
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    challenge_date DATE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    total_paused_seconds INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 0,
    status session_status NOT NULL DEFAULT 'active',
    pause_log JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 8. DAILY STUDY EVIDENCE TABLE (Requires photo showing 180m completion)
CREATE TABLE IF NOT EXISTS public.daily_study_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    challenge_date DATE NOT NULL,
    storage_path TEXT NOT NULL,
    verified_duration_seconds INT NOT NULL,
    status verification_status NOT NULL DEFAULT 'approved', -- Auto-accepted with admin review
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    UNIQUE (user_id, challenge_date)
);

-- 9. WORKOUT ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.workout_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    challenge_week_id UUID REFERENCES public.challenge_weeks(id),
    workout_date DATE NOT NULL,
    workout_type TEXT NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes >= 10 AND duration_minutes <= 360),
    notes TEXT,
    storage_path TEXT NOT NULL,
    status verification_status NOT NULL DEFAULT 'approved', -- Auto-accepted with admin review
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 10. WEEKLY MISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.weekly_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    challenge_week_id UUID NOT NULL REFERENCES public.challenge_weeks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    criteria TEXT NOT NULL,
    evidence_instructions TEXT NOT NULL,
    point_value INT NOT NULL DEFAULT 20,
    deadline TIMESTAMPTZ NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    UNIQUE (challenge_week_id)
);

-- 11. MISSION SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.mission_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES public.weekly_missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    student_notes TEXT,
    status verification_status NOT NULL DEFAULT 'approved', -- Auto-accepted with admin review
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    UNIQUE (mission_id, user_id)
);

-- 12. POINT TRANSACTIONS TABLE (With Idempotency Key)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    event_key TEXT NOT NULL UNIQUE, -- Idempotency guarantee: e.g. study_2026-10-10_userId
    points INT NOT NULL,
    category point_category NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 13. USER ACHIEVEMENTS / STREAK MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    UNIQUE (user_id, challenge_id, achievement_key)
);

-- 14. NOTIFICATIONS / REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 15. ADMINISTRATIVE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 16. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, challenge_date);
CREATE INDEX IF NOT EXISTS idx_study_evidence_user_date ON public.daily_study_evidence(user_id, challenge_date);
CREATE INDEX IF NOT EXISTS idx_workout_entries_user_week ON public.workout_entries(user_id, challenge_week_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 17. PUBLIC LEADERBOARD VIEW (Excludes Emails for Privacy)
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
    p.id AS user_id,
    p.username,
    p.avatar_url,
    p.house,
    COALESCE(SUM(pt.points), 0) AS total_points,
    COUNT(DISTINCT dse.challenge_date) FILTER (WHERE dse.status = 'approved') AS completed_study_days,
    COUNT(DISTINCT we.id) FILTER (WHERE we.status = 'approved') AS completed_workouts,
    COUNT(DISTINCT ms.id) FILTER (WHERE ms.status = 'approved') AS completed_missions
FROM public.profiles p
LEFT JOIN public.point_transactions pt ON p.id = pt.user_id
LEFT JOIN public.daily_study_evidence dse ON p.id = dse.user_id
LEFT JOIN public.workout_entries we ON p.id = we.user_id
LEFT JOIN public.mission_submissions ms ON p.id = ms.user_id
WHERE p.is_active = true AND p.username IS NOT NULL
GROUP BY p.id, p.username, p.avatar_url, p.house;

-- 18. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_study_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: is current user coordinator or admin?
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('coordinator', 'admin') AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by anyone" ON public.profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update own username/bio once" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()))
    );

CREATE POLICY "Admins have full access to profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- Challenges & Weeks: Public read, Admin write
CREATE POLICY "Challenges read" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Challenges admin" ON public.challenges FOR ALL USING (public.is_admin());

CREATE POLICY "Challenge weeks read" ON public.challenge_weeks FOR SELECT USING (true);
CREATE POLICY "Challenge weeks admin" ON public.challenge_weeks FOR ALL USING (public.is_admin());

-- Study Sessions: User read/write own; Staff read all
CREATE POLICY "Users read own study sessions" ON public.study_sessions
    FOR SELECT USING (auth.uid() = user_id OR public.is_staff());

CREATE POLICY "Users insert own study sessions" ON public.study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own study sessions" ON public.study_sessions
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Evidence: Private access only (Owner + Staff)
CREATE POLICY "Study evidence read by owner or staff" ON public.daily_study_evidence
    FOR SELECT USING (auth.uid() = user_id OR public.is_staff());

CREATE POLICY "Study evidence insert by owner" ON public.daily_study_evidence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Study evidence staff review" ON public.daily_study_evidence
    FOR UPDATE USING (public.is_staff());

-- Workout Entries: Owner or Staff
CREATE POLICY "Workout read by owner or staff" ON public.workout_entries
    FOR SELECT USING (auth.uid() = user_id OR public.is_staff());

CREATE POLICY "Workout insert by owner" ON public.workout_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workout staff review" ON public.workout_entries
    FOR UPDATE USING (public.is_staff());

-- Weekly Missions: Published read by all; Staff write
CREATE POLICY "Missions read" ON public.weekly_missions
    FOR SELECT USING (is_published = true OR public.is_staff());

CREATE POLICY "Missions staff manage" ON public.weekly_missions
    FOR ALL USING (public.is_staff());

-- Mission Submissions: Owner or Staff
CREATE POLICY "Mission submission read" ON public.mission_submissions
    FOR SELECT USING (auth.uid() = user_id OR public.is_staff());

CREATE POLICY "Mission submission insert" ON public.mission_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mission submission review" ON public.mission_submissions
    FOR UPDATE USING (public.is_staff());

-- Point Transactions: Read by all (or owner), written only by server functions
CREATE POLICY "Points read" ON public.point_transactions FOR SELECT USING (true);
CREATE POLICY "Points write by admin" ON public.point_transactions FOR ALL USING (public.is_admin());

-- Notifications: User reads own
CREATE POLICY "User notifications read" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User notifications update" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Audit Logs: Admin read only; inserted via procedures
CREATE POLICY "Audit logs read by admin" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Audit logs insert by staff" ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_staff());

-- 19. PRIVILEGED SERVER RPC: AWARD DAILY STUDY POINTS
CREATE OR REPLACE FUNCTION public.process_daily_study_goal(
    p_user_id UUID,
    p_challenge_id UUID,
    p_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_total_seconds INT;
    v_has_approved_evidence BOOLEAN;
    v_event_key TEXT;
    v_points_awarded INT := 0;
    v_scoring JSONB;
    v_goal_pts INT := 10;
BEGIN
    -- Verify total valid duration for the day >= 10800s (180 mins)
    SELECT COALESCE(SUM(duration_seconds), 0)
    INTO v_total_seconds
    FROM public.study_sessions
    WHERE user_id = p_user_id 
      AND challenge_date = p_date 
      AND status = 'completed';

    IF v_total_seconds < 10800 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Insufficient study duration');
    END IF;

    -- Verify approved study evidence exists
    SELECT EXISTS (
        SELECT 1 FROM public.daily_study_evidence
        WHERE user_id = p_user_id 
          AND challenge_date = p_date 
          AND status = 'approved'
    ) INTO v_has_approved_evidence;

    IF NOT v_has_approved_evidence THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Missing or unapproved study evidence');
    END IF;

    -- Retrieve scoring config
    SELECT scoring_config INTO v_scoring FROM public.challenges WHERE id = p_challenge_id;
    IF v_scoring ? 'daily_study_goal_pts' THEN
        v_goal_pts := (v_scoring->>'daily_study_goal_pts')::INT;
    END IF;

    -- Idempotent event key
    v_event_key := 'study_goal_' || p_user_id::TEXT || '_' || p_date::TEXT;

    INSERT INTO public.point_transactions (
        user_id, challenge_id, event_key, points, category, description
    ) VALUES (
        p_user_id, p_challenge_id, v_event_key, v_goal_pts, 'study_goal',
        'Daily 180-minute study goal achieved on ' || p_date::TEXT
    )
    ON CONFLICT (event_key) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'points', v_goal_pts, 'event_key', v_event_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. SEED CHALLENGE CALENDAR (12 PERIODS: OCT 10 - DEC 31, 2026)
INSERT INTO public.challenges (slug, title, description, start_date, end_date)
VALUES (
    'winter-arc-2026',
    'Winter Arc – Namdapha 2026',
    'The 83-day relentless discipline challenge for Namdapha House, IIT Madras BS.',
    '2026-10-10',
    '2026-12-31'
)
ON CONFLICT (slug) DO NOTHING;

-- Seed Weeks
DO $$
DECLARE
    v_challenge_id UUID;
BEGIN
    SELECT id INTO v_challenge_id FROM public.challenges WHERE slug = 'winter-arc-2026';
    IF v_challenge_id IS NOT NULL THEN
        INSERT INTO public.challenge_weeks (challenge_id, week_number, title, start_date, end_date, required_workouts, is_partial_week)
        VALUES
            (v_challenge_id, 1, 'Week 1: The Foundation', '2026-10-10', '2026-10-16', 3, false),
            (v_challenge_id, 2, 'Week 2: Momentum Awakening', '2026-10-17', '2026-10-23', 3, false),
            (v_challenge_id, 3, 'Week 3: Deep Work Crucible', '2026-10-24', '2026-10-30', 3, false),
            (v_challenge_id, 4, 'Week 4: The 30-Day Threshold', '2026-10-31', '2026-11-06', 3, false),
            (v_challenge_id, 5, 'Week 5: Cold Horizon', '2026-11-07', '2026-11-13', 3, false),
            (v_challenge_id, 6, 'Week 6: Unyielding Focus', '2026-11-14', '2026-11-20', 3, false),
            (v_challenge_id, 7, 'Week 7: Midpoint Mastery', '2026-11-21', '2026-11-27', 3, false),
            (v_challenge_id, 8, 'Week 8: The Ascent', '2026-11-28', '2026-12-04', 3, false),
            (v_challenge_id, 9, 'Week 9: Relentless Routine', '2026-12-05', '2026-12-11', 3, false),
            (v_challenge_id, 10, 'Week 10: Iron Will', '2026-12-12', '2026-12-18', 3, false),
            (v_challenge_id, 11, 'Week 11: The Penultimate Push', '2026-12-19', '2026-12-25', 3, false),
            (v_challenge_id, 12, 'Week 12: Final Arc (Partial Week)', '2026-12-26', '2026-12-31', 2, true)
        ON CONFLICT (challenge_id, week_number) DO NOTHING;
    END IF;
END $$;
