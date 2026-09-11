--
-- PostgreSQL database dump
--

\restrict gkG1dOqGTwtHTAOq0dgAiLcfFphNn9zrFuUo3fgQbd5d5netmq03uZszf3ls1Yd

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_qr_codes DROP CONSTRAINT IF EXISTS user_qr_codes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_consent DROP CONSTRAINT IF EXISTS user_consent_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.team_qr_codes DROP CONSTRAINT IF EXISTS team_qr_codes_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_reward_id_fkey;
ALTER TABLE IF EXISTS ONLY public.points_bonus_qr_tokens DROP CONSTRAINT IF EXISTS points_bonus_qr_tokens_redeemed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.points_bonus_qr_tokens DROP CONSTRAINT IF EXISTS points_bonus_qr_tokens_generated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.forest_trees DROP CONSTRAINT IF EXISTS forest_trees_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.forest_trees DROP CONSTRAINT IF EXISTS forest_trees_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS fk_tasks_prerequisite_task_id;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS fk_tasks_location;
ALTER TABLE IF EXISTS ONLY public.rewards DROP CONSTRAINT IF EXISTS fk_rewards_location;
ALTER TABLE IF EXISTS ONLY public.daily_forest_visits DROP CONSTRAINT IF EXISTS daily_forest_visits_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contests DROP CONSTRAINT IF EXISTS contests_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.contest_qr_codes DROP CONSTRAINT IF EXISTS contest_qr_codes_contest_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contest_participants DROP CONSTRAINT IF EXISTS contest_participants_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contest_participants DROP CONSTRAINT IF EXISTS contest_participants_contest_id_fkey;
DROP INDEX IF EXISTS public.idx_users_sihot_guest_id;
DROP INDEX IF EXISTS public.idx_users_password_reset_token;
DROP INDEX IF EXISTS public.idx_users_oauth_email;
DROP INDEX IF EXISTS public.idx_users_oauth;
DROP INDEX IF EXISTS public.idx_users_login_code;
DROP INDEX IF EXISTS public.idx_users_email_verification_token;
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_deleted_at;
DROP INDEX IF EXISTS public.idx_users_active;
DROP INDEX IF EXISTS public.idx_user_tasks_user_id;
DROP INDEX IF EXISTS public.idx_user_tasks_task_id;
DROP INDEX IF EXISTS public.idx_user_qr_codes_user_id;
DROP INDEX IF EXISTS public.idx_user_qr_codes_qr_token;
DROP INDEX IF EXISTS public.idx_user_consent_user_id;
DROP INDEX IF EXISTS public.idx_teams_created_by;
DROP INDEX IF EXISTS public.idx_team_qr_codes_team_id;
DROP INDEX IF EXISTS public.idx_team_qr_codes_qr_token;
DROP INDEX IF EXISTS public.idx_team_members_user_id;
DROP INDEX IF EXISTS public.idx_team_members_team_id;
DROP INDEX IF EXISTS public.idx_tasks_zielgruppe;
DROP INDEX IF EXISTS public.idx_tasks_type;
DROP INDEX IF EXISTS public.idx_tasks_time_required;
DROP INDEX IF EXISTS public.idx_tasks_target_location;
DROP INDEX IF EXISTS public.idx_tasks_recurrence;
DROP INDEX IF EXISTS public.idx_tasks_prerequisite_task_id;
DROP INDEX IF EXISTS public.idx_tasks_location_tool;
DROP INDEX IF EXISTS public.idx_tasks_location_id;
DROP INDEX IF EXISTS public.idx_tasks_event_group;
DROP INDEX IF EXISTS public.idx_tasks_difficulty;
DROP INDEX IF EXISTS public.idx_tasks_category;
DROP INDEX IF EXISTS public.idx_tasks_active;
DROP INDEX IF EXISTS public.idx_task_parameters_weight;
DROP INDEX IF EXISTS public.idx_task_parameters_type;
DROP INDEX IF EXISTS public.idx_task_parameters_active;
DROP INDEX IF EXISTS public.idx_system_config_key;
DROP INDEX IF EXISTS public.idx_rewards_zielgruppe;
DROP INDEX IF EXISTS public.idx_rewards_reward_art;
DROP INDEX IF EXISTS public.idx_rewards_recurrence;
DROP INDEX IF EXISTS public.idx_rewards_moegliche_punkte;
DROP INDEX IF EXISTS public.idx_rewards_location_id;
DROP INDEX IF EXISTS public.idx_rewards_kategorie;
DROP INDEX IF EXISTS public.idx_rewards_event_group;
DROP INDEX IF EXISTS public.idx_reward_redemptions_user_id;
DROP INDEX IF EXISTS public.idx_reward_redemptions_qr_token;
DROP INDEX IF EXISTS public.idx_reward_parameters_weight;
DROP INDEX IF EXISTS public.idx_reward_parameters_type;
DROP INDEX IF EXISTS public.idx_reward_parameters_active;
DROP INDEX IF EXISTS public.idx_points_bonus_qr_tokens_status;
DROP INDEX IF EXISTS public.idx_points_bonus_qr_tokens_qr_token;
DROP INDEX IF EXISTS public.idx_points_bonus_qr_tokens_generated_by;
DROP INDEX IF EXISTS public.idx_points_bonus_qr_tokens_expires_at;
DROP INDEX IF EXISTS public.idx_locations_active;
DROP INDEX IF EXISTS public.idx_forest_trees_user_id;
DROP INDEX IF EXISTS public.idx_forest_trees_stage;
DROP INDEX IF EXISTS public.idx_forest_trees_growth_points;
DROP INDEX IF EXISTS public.idx_daily_forest_visits_user_date;
DROP INDEX IF EXISTS public.idx_contests_rewards_awarded;
DROP INDEX IF EXISTS public.idx_contests_end_date;
DROP INDEX IF EXISTS public.idx_contests_created_by;
DROP INDEX IF EXISTS public.idx_contests_active;
DROP INDEX IF EXISTS public.idx_contest_qr_codes_qr_token;
DROP INDEX IF EXISTS public.idx_contest_qr_codes_contest_id;
DROP INDEX IF EXISTS public.idx_contest_participants_user_id;
DROP INDEX IF EXISTS public.idx_contest_participants_contest_id;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_sihot_guest_id_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_user_id_task_id_key;
ALTER TABLE IF EXISTS ONLY public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.user_qr_codes DROP CONSTRAINT IF EXISTS user_qr_codes_user_id_key;
ALTER TABLE IF EXISTS ONLY public.user_qr_codes DROP CONSTRAINT IF EXISTS user_qr_codes_qr_token_key;
ALTER TABLE IF EXISTS ONLY public.user_qr_codes DROP CONSTRAINT IF EXISTS user_qr_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.user_consent DROP CONSTRAINT IF EXISTS user_consent_pkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_pkey;
ALTER TABLE IF EXISTS ONLY public.team_qr_codes DROP CONSTRAINT IF EXISTS team_qr_codes_qr_token_key;
ALTER TABLE IF EXISTS ONLY public.team_qr_codes DROP CONSTRAINT IF EXISTS team_qr_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_team_id_user_id_key;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_pkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.task_parameters DROP CONSTRAINT IF EXISTS task_parameters_pkey;
ALTER TABLE IF EXISTS ONLY public.task_parameters DROP CONSTRAINT IF EXISTS task_parameters_parameter_type_value_key;
ALTER TABLE IF EXISTS ONLY public.system_config DROP CONSTRAINT IF EXISTS system_config_pkey;
ALTER TABLE IF EXISTS ONLY public.system_config DROP CONSTRAINT IF EXISTS system_config_config_key_key;
ALTER TABLE IF EXISTS ONLY public.statistics DROP CONSTRAINT IF EXISTS statistics_pkey;
ALTER TABLE IF EXISTS ONLY public.statistics DROP CONSTRAINT IF EXISTS statistics_metric_name_key;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_migration_name_key;
ALTER TABLE IF EXISTS ONLY public.rewards DROP CONSTRAINT IF EXISTS rewards_pkey;
ALTER TABLE IF EXISTS ONLY public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_qr_token_key;
ALTER TABLE IF EXISTS ONLY public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_pkey;
ALTER TABLE IF EXISTS ONLY public.reward_parameters DROP CONSTRAINT IF EXISTS reward_parameters_pkey;
ALTER TABLE IF EXISTS ONLY public.reward_parameters DROP CONSTRAINT IF EXISTS reward_parameters_parameter_type_value_key;
ALTER TABLE IF EXISTS ONLY public.points_bonus_qr_tokens DROP CONSTRAINT IF EXISTS points_bonus_qr_tokens_qr_token_key;
ALTER TABLE IF EXISTS ONLY public.points_bonus_qr_tokens DROP CONSTRAINT IF EXISTS points_bonus_qr_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.locations DROP CONSTRAINT IF EXISTS locations_pkey;
ALTER TABLE IF EXISTS ONLY public.locations DROP CONSTRAINT IF EXISTS locations_name_key;
ALTER TABLE IF EXISTS ONLY public.forest_trees DROP CONSTRAINT IF EXISTS forest_trees_pkey;
ALTER TABLE IF EXISTS ONLY public.daily_forest_visits DROP CONSTRAINT IF EXISTS daily_forest_visits_user_id_visit_date_key;
ALTER TABLE IF EXISTS ONLY public.daily_forest_visits DROP CONSTRAINT IF EXISTS daily_forest_visits_pkey;
ALTER TABLE IF EXISTS ONLY public.contests DROP CONSTRAINT IF EXISTS contests_pkey;
ALTER TABLE IF EXISTS ONLY public.contest_qr_codes DROP CONSTRAINT IF EXISTS contest_qr_codes_qr_token_key;
ALTER TABLE IF EXISTS ONLY public.contest_qr_codes DROP CONSTRAINT IF EXISTS contest_qr_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.contest_participants DROP CONSTRAINT IF EXISTS contest_participants_pkey;
ALTER TABLE IF EXISTS ONLY public.contest_participants DROP CONSTRAINT IF EXISTS contest_participants_contest_id_user_id_key;
ALTER TABLE IF EXISTS public.schema_migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_tasks;
DROP TABLE IF EXISTS public.user_qr_codes;
DROP TABLE IF EXISTS public.user_consent;
DROP TABLE IF EXISTS public.teams;
DROP TABLE IF EXISTS public.team_qr_codes;
DROP TABLE IF EXISTS public.team_members;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.task_parameters;
DROP TABLE IF EXISTS public.system_config;
DROP TABLE IF EXISTS public.statistics;
DROP SEQUENCE IF EXISTS public.schema_migrations_id_seq;
DROP TABLE IF EXISTS public.schema_migrations;
DROP TABLE IF EXISTS public.rewards;
DROP TABLE IF EXISTS public.reward_redemptions;
DROP TABLE IF EXISTS public.reward_parameters;
DROP TABLE IF EXISTS public.points_bonus_qr_tokens;
DROP TABLE IF EXISTS public.locations;
DROP TABLE IF EXISTS public.forest_trees;
DROP TABLE IF EXISTS public.daily_forest_visits;
DROP TABLE IF EXISTS public.contests;
DROP TABLE IF EXISTS public.contest_qr_codes;
DROP TABLE IF EXISTS public.contest_participants;
DROP TYPE IF EXISTS public.user_type_enum;
DROP TYPE IF EXISTS public.user_role_enum;
DROP TYPE IF EXISTS public.task_zielgruppe_enum;
DROP TYPE IF EXISTS public.task_time_required_enum;
DROP TYPE IF EXISTS public.task_recurrence_enum;
DROP TYPE IF EXISTS public.task_location_tool_enum;
DROP TYPE IF EXISTS public.task_difficulty_enum;
DROP TYPE IF EXISTS public.task_category_enum;
DROP TYPE IF EXISTS public.reward_zielgruppe_enum;
DROP TYPE IF EXISTS public.reward_recurrence_enum;
DROP TYPE IF EXISTS public.reward_kosten_enum;
DROP TYPE IF EXISTS public.reward_kategorie_enum;
DROP TYPE IF EXISTS public.reward_art_enum;
DROP TYPE IF EXISTS public.hotel_id_enum;
--
-- Name: hotel_id_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hotel_id_enum AS ENUM (
    'ROI-BER',
    'ROI-VIE'
);


--
-- Name: reward_art_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reward_art_enum AS ENUM (
    'Rabatt',
    'Erlebnis',
    'Add-on',
    'physisches Geschenk'
);


--
-- Name: reward_kategorie_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reward_kategorie_enum AS ENUM (
    'Hotel',
    'nicht Hotel'
);


--
-- Name: reward_kosten_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reward_kosten_enum AS ENUM (
    'niedrig',
    'mittel',
    'hoch'
);


--
-- Name: reward_recurrence_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reward_recurrence_enum AS ENUM (
    'once',
    'daily',
    'weekly',
    'monthly'
);


--
-- Name: reward_zielgruppe_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reward_zielgruppe_enum AS ENUM (
    'Mitarbeitende',
    'Gäste',
    'Stakeholder'
);


--
-- Name: task_category_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_category_enum AS ENUM (
    'Kommunikation & Netzwerke',
    'Mensch & soziales Umfeld',
    'Natur & Umweltschutz',
    'Ressourcenverbrauch & Materialeinsatz'
);


--
-- Name: task_difficulty_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_difficulty_enum AS ENUM (
    'sehr einfach',
    'einfach',
    'mittel',
    'schwer',
    'sehr schwer'
);


--
-- Name: task_location_tool_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_location_tool_enum AS ENUM (
    'Umgebung',
    'Hotel',
    'egal',
    'Smartphone/PC'
);


--
-- Name: task_recurrence_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_recurrence_enum AS ENUM (
    'once',
    'daily',
    'weekly',
    'monthly'
);


--
-- Name: task_time_required_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_time_required_enum AS ENUM (
    '1-3 Min',
    '3-10 Min',
    '10-30 Min',
    '30-60 Min',
    '60+ Min'
);


--
-- Name: task_zielgruppe_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_zielgruppe_enum AS ENUM (
    'Mitarbeitende',
    'Gäste',
    'Stakeholder'
);


--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_enum AS ENUM (
    'guest',
    'employee',
    'stakeholder',
    'administrator'
);


--
-- Name: user_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_type_enum AS ENUM (
    'explorer',
    'guest_in_house',
    'observer',
    'advocate'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contest_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contest_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contest_id uuid NOT NULL,
    user_id uuid NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contest_qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contest_qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contest_id uuid NOT NULL,
    qr_token character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255),
    created_by uuid NOT NULL,
    end_date timestamp without time zone NOT NULL,
    reward_first_place integer,
    reward_second_place integer,
    reward_third_place integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true NOT NULL,
    start_date timestamp without time zone NOT NULL,
    rewards_awarded boolean DEFAULT false NOT NULL
);


--
-- Name: daily_forest_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_forest_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    visit_date date DEFAULT CURRENT_DATE NOT NULL,
    visited_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: forest_trees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forest_trees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tree_type character varying(50) DEFAULT 'default'::character varying,
    position_x numeric(10,2) NOT NULL,
    position_y numeric(10,2) NOT NULL,
    position_z numeric(10,2) NOT NULL,
    planted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    task_id uuid,
    growth_points integer DEFAULT 1,
    stage character varying(20) DEFAULT 'sapling'::character varying,
    size numeric(5,3) DEFAULT 0.035
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_online boolean DEFAULT false NOT NULL,
    address text,
    latitude numeric(10,6),
    longitude numeric(10,6),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true NOT NULL,
    category character varying(50),
    category_description text,
    CONSTRAINT locations_check CHECK ((((is_online = true) AND (address IS NULL) AND (latitude IS NULL) AND (longitude IS NULL)) OR ((is_online = false) AND (address IS NOT NULL) AND (latitude IS NOT NULL) AND (longitude IS NOT NULL))))
);


--
-- Name: points_bonus_qr_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.points_bonus_qr_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    qr_token character varying(255) NOT NULL,
    points_amount integer NOT NULL,
    generated_by uuid NOT NULL,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    redeemed_by uuid,
    redeemed_at timestamp without time zone,
    status character varying(50) DEFAULT 'pending'::character varying,
    expires_at timestamp without time zone NOT NULL,
    CONSTRAINT points_bonus_qr_tokens_points_amount_check CHECK ((points_amount > 0)),
    CONSTRAINT points_bonus_qr_tokens_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('redeemed'::character varying)::text, ('expired'::character varying)::text])))
);


--
-- Name: reward_parameters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_parameters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parameter_type character varying(50) NOT NULL,
    value character varying(255) NOT NULL,
    display_order integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    weight numeric(10,2) DEFAULT 0
);


--
-- Name: TABLE reward_parameters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.reward_parameters IS 'Dynamic parameter values for reward dropdowns';


--
-- Name: COLUMN reward_parameters.parameter_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reward_parameters.parameter_type IS 'Type of parameter: reward_art, kategorie, kosten';


--
-- Name: COLUMN reward_parameters.weight; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reward_parameters.weight IS 'Weight for calculations and sorting (separate from display_order). Used for kosten parameters.';


--
-- Name: reward_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    redeemed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    voucher_code character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    qr_token character varying(255),
    metadata jsonb
);


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    points_cost integer NOT NULL,
    reward_type character varying(50) NOT NULL,
    voucher_code character varying(255),
    external_api_id character varying(255),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location_id uuid NOT NULL,
    recurrence public.reward_recurrence_enum DEFAULT 'once'::public.reward_recurrence_enum,
    last_generated_at timestamp without time zone,
    reward_art public.reward_art_enum,
    kategorie public.reward_kategorie_enum,
    event_group character varying(255),
    moegliche_punkte integer,
    zielgruppe public.reward_zielgruppe_enum[]
);


--
-- Name: COLUMN rewards.recurrence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.recurrence IS 'How often the reward should be automatically regenerated: once (default), daily, weekly, monthly';


--
-- Name: COLUMN rewards.last_generated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.last_generated_at IS 'Timestamp when this recurring reward was last automatically generated';


--
-- Name: COLUMN rewards.reward_art; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.reward_art IS 'Art der Belohnung: Rabatt, Erlebnis, Add-on, physisches Geschenk';


--
-- Name: COLUMN rewards.kategorie; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.kategorie IS 'Kategorie der Belohnung: Hotel oder nicht Hotel';


--
-- Name: COLUMN rewards.event_group; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.event_group IS 'Optional: Event oder Gruppe zuordnen';


--
-- Name: COLUMN rewards.moegliche_punkte; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.moegliche_punkte IS 'Punkte, die dem Benutzer beim Einlösen der Belohnung gutgeschrieben werden.';


--
-- Name: COLUMN rewards.zielgruppe; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.zielgruppe IS 'Zielgruppe der Belohnung als Array: Mitarbeitende, Gäste, Stakeholder. NULL oder leeres Array bedeutet für alle zugänglich.';


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    migration_name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: statistics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.statistics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_name character varying(255) NOT NULL,
    metric_value numeric(15,2) NOT NULL,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE system_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.system_config IS 'System-wide configuration values';


--
-- Name: COLUMN system_config.config_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.system_config.config_key IS 'Unique configuration key';


--
-- Name: COLUMN system_config.config_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.system_config.config_value IS 'Configuration value as text';


--
-- Name: COLUMN system_config.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.system_config.description IS 'Human-readable description of this configuration';


--
-- Name: task_parameters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_parameters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parameter_type character varying(50) NOT NULL,
    value character varying(255) NOT NULL,
    display_order integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    weight numeric(10,2) DEFAULT 0
);


--
-- Name: TABLE task_parameters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.task_parameters IS 'Dynamic parameter values for task dropdowns';


--
-- Name: COLUMN task_parameters.parameter_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_parameters.parameter_type IS 'Type of parameter: type, category, difficulty, time_required, location_tool';


--
-- Name: COLUMN task_parameters.weight; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_parameters.weight IS 'Weight for calculations and sorting (separate from display_order). Used for difficulty and time_required parameters.';


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    video_url text,
    quiz_questions jsonb,
    qr_code character varying(255),
    photo_required boolean DEFAULT false,
    co2_savings_kg numeric(10,2) DEFAULT 0,
    external_id character varying(255),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location_id uuid NOT NULL,
    recurrence public.task_recurrence_enum DEFAULT 'once'::public.task_recurrence_enum,
    last_generated_at timestamp without time zone,
    category public.task_category_enum,
    difficulty public.task_difficulty_enum,
    time_required public.task_time_required_enum,
    location_tool public.task_location_tool_enum,
    event_group character varying(255),
    target_latitude numeric(10,8),
    target_longitude numeric(11,8),
    article_url text,
    article_content text,
    survey_questions jsonb,
    survey_type character varying(50),
    prerequisite_task_id uuid,
    prerequisite_task_count integer,
    prerequisite_task_ids uuid[],
    zielgruppe public.task_zielgruppe_enum[]
);


--
-- Name: COLUMN tasks.recurrence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.recurrence IS 'How often the task should be automatically regenerated: once (default), daily, weekly, monthly';


--
-- Name: COLUMN tasks.last_generated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.last_generated_at IS 'Timestamp when this recurring task was last automatically generated';


--
-- Name: COLUMN tasks.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.category IS 'Task category: Kommunikation & Netzwerke, Mensch & soziales Umfeld, Natur & Umweltschutz, Ressourcenverbrauch & Materialeinsatz';


--
-- Name: COLUMN tasks.difficulty; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.difficulty IS 'Task difficulty level: sehr einfach, einfach, mittel, schwer, sehr schwer';


--
-- Name: COLUMN tasks.time_required; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.time_required IS 'Estimated time required: 1-3 Min, 3-10 Min, 10-30 Min, 30-60 Min, 60+ Min';


--
-- Name: COLUMN tasks.location_tool; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.location_tool IS 'Required location or tool: Umgebung, Hotel, egal, Smartphone/PC';


--
-- Name: COLUMN tasks.event_group; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.event_group IS 'Optional event or group assignment (can be NULL)';


--
-- Name: COLUMN tasks.article_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.article_url IS 'URL to external article for article_quiz tasks';


--
-- Name: COLUMN tasks.article_content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.article_content IS 'Article content text for article_quiz tasks (alternative to article_url)';


--
-- Name: COLUMN tasks.survey_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.survey_questions IS 'Survey questions array for survey tasks (JSONB)';


--
-- Name: COLUMN tasks.survey_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.survey_type IS 'Survey type: single_choice, multiple_choice, text, rating, or mixed';


--
-- Name: COLUMN tasks.prerequisite_task_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.prerequisite_task_id IS 'Specific task that must be completed before this task becomes available (Type 1 prerequisite)';


--
-- Name: COLUMN tasks.prerequisite_task_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.prerequisite_task_count IS 'Minimum number of tasks from prerequisite_task_ids that must be completed (Type 2 prerequisite)';


--
-- Name: COLUMN tasks.prerequisite_task_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.prerequisite_task_ids IS 'Array of task IDs from which prerequisite_task_count must be completed (Type 2 prerequisite)';


--
-- Name: COLUMN tasks.zielgruppe; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.zielgruppe IS 'Zielgruppe der Aufgabe als Array: Mitarbeitende, Gäste, Stakeholder. NULL oder leeres Array bedeutet für alle zugänglich.';


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    points_contributed integer DEFAULT 0 NOT NULL
);


--
-- Name: team_qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    qr_token character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255),
    created_by uuid NOT NULL,
    points_pool integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: user_consent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_consent (
    user_id uuid NOT NULL,
    consent_data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    qr_token character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone
);


--
-- Name: user_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task_id uuid NOT NULL,
    completed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    photo_url text,
    quiz_answers jsonb,
    points_earned integer DEFAULT 0,
    survey_responses jsonb
);


--
-- Name: COLUMN user_tasks.survey_responses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_tasks.survey_responses IS 'Survey responses for survey tasks (JSONB)';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255),
    password_hash character varying(255),
    name character varying(255) NOT NULL,
    role public.user_role_enum DEFAULT 'stakeholder'::public.user_role_enum NOT NULL,
    user_type public.user_type_enum DEFAULT 'explorer'::public.user_type_enum NOT NULL,
    points integer DEFAULT 0,
    avatar_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    oauth_provider character varying(50),
    oauth_id character varying(255),
    oauth_email character varying(255),
    sihot_guest_id character varying(255),
    sihot_guest_data jsonb,
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    email_verification_expires timestamp without time zone,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    email_notifications_enabled boolean DEFAULT true,
    login_code character varying(10),
    login_code_expires timestamp without time zone,
    active boolean DEFAULT true NOT NULL,
    deleted_at timestamp without time zone,
    CONSTRAINT check_auth_method CHECK (((password_hash IS NOT NULL) OR ((oauth_provider IS NOT NULL) AND (oauth_id IS NOT NULL)) OR ((email IS NOT NULL) AND (password_hash IS NULL) AND ((oauth_provider IS NULL) OR (oauth_id IS NULL)))))
);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Data for Name: contest_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contest_participants (id, contest_id, user_id, points, joined_at) FROM stdin;
e1df604c-7840-4247-8980-41ce7a2c4f91	94e98eef-1136-4be5-89f1-95f79e865e3f	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-01-08 12:31:16.649077
341c9bb0-5692-4f2a-ac00-da9e349e3e7d	94e98eef-1136-4be5-89f1-95f79e865e3f	695f618d-cc93-489d-9879-7984d52c70c9	0	2026-01-08 12:31:29.09419
853e5f76-0985-497f-9f04-bcd721a89c1d	5d88e1b6-c789-43f6-986f-2b4deb03854b	8af2afba-1be0-4951-b066-790a31718076	0	2026-01-08 12:46:35.38593
39291491-ba12-43fa-ab21-8ddc698f4e96	5d88e1b6-c789-43f6-986f-2b4deb03854b	695f618d-cc93-489d-9879-7984d52c70c9	0	2026-01-08 12:47:02.532015
8597b189-4b5c-44ab-9096-bce5532009ea	61eadcb8-0559-4627-8ad0-17e7a3230daa	8af2afba-1be0-4951-b066-790a31718076	0	2026-01-08 14:46:05.447771
2c48717d-7109-456e-9c48-070e3a40b696	61eadcb8-0559-4627-8ad0-17e7a3230daa	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-01-08 14:46:05.450463
1c26635d-91c6-4bb3-97a4-f979d0e2e7d0	61eadcb8-0559-4627-8ad0-17e7a3230daa	695f618d-cc93-489d-9879-7984d52c70c9	50	2026-01-08 14:46:05.449373
\.


--
-- Data for Name: contest_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contest_qr_codes (id, contest_id, qr_token, created_at) FROM stdin;
f7bb7ace-884b-4208-8bbf-b66d505f3e1e	94e98eef-1136-4be5-89f1-95f79e865e3f	cce1e3f391721b64474c11fd7ebdbfbcb55710dc6b0e95fb3147ad78a9366f27	2026-01-08 12:31:16.655891
83aae6bb-34d9-4cb0-8092-1aa835dc4990	5d88e1b6-c789-43f6-986f-2b4deb03854b	f9aacbf3d3b4829e2720f1de4b77a779f78f692a437ab4ed9adebb9e47dc5926	2026-01-08 12:46:35.393461
490f7c6d-e694-4dab-ab5b-c5be801ab1af	61eadcb8-0559-4627-8ad0-17e7a3230daa	d801df762c85921774ce688adc1ce13cefb8b98ffd7e32d8d7cd10711d1e2440	2026-01-08 14:46:05.453886
\.


--
-- Data for Name: contests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contests (id, name, created_by, end_date, reward_first_place, reward_second_place, reward_third_place, created_at, updated_at, active, start_date, rewards_awarded) FROM stdin;
94e98eef-1136-4be5-89f1-95f79e865e3f	Wettlauf	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-09 00:00:00	\N	\N	\N	2026-01-08 12:31:16.644393	2026-01-08 12:54:31.871853	f	2026-01-08 12:31:16.644393	f
5d88e1b6-c789-43f6-986f-2b4deb03854b	Hotel-Rallye	8af2afba-1be0-4951-b066-790a31718076	2026-01-09 00:00:00	25	15	10	2026-01-08 12:46:35.380897	2026-01-08 12:55:15.917587	f	2026-01-08 12:46:35.380897	f
61eadcb8-0559-4627-8ad0-17e7a3230daa	Hotelrallye	8af2afba-1be0-4951-b066-790a31718076	2026-01-08 15:30:00	50	25	10	2026-01-08 14:46:05.444996	2026-01-08 14:46:05.444996	t	2026-01-08 15:00:00	t
\.


--
-- Data for Name: daily_forest_visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_forest_visits (id, user_id, visit_date, visited_at) FROM stdin;
8bfff0a8-ca11-42cb-8ff4-1550a4bc52be	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2025-12-12	2025-12-12 13:35:44.098435
202508db-96eb-4146-b983-aaa271fbd0e5	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2025-12-15	2025-12-15 09:01:41.559694
9dfb1bc2-d797-462c-990c-914c61a53d88	8af2afba-1be0-4951-b066-790a31718076	2025-12-15	2025-12-15 09:02:51.271522
149b484f-def8-4fee-b5a9-19e9c68e047d	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2025-12-16	2025-12-16 08:38:06.467304
5c7dafdc-c402-4e36-a487-663f23603e2b	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2025-12-18	2025-12-18 15:04:26.551274
094de492-67d2-4505-b93c-66a6f6529c43	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2025-12-19	2025-12-19 10:37:40.66043
1fa18dd6-c0ea-4c1a-a930-7f9b974ad8c0	8af2afba-1be0-4951-b066-790a31718076	2025-12-19	2025-12-19 13:36:21.671079
4ca26656-5054-46b1-b212-cf78da0d53bb	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-05	2026-01-05 18:17:13.236993
80174db2-c224-405a-8d3f-21c3808f01d2	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-06	2026-01-06 19:10:38.851696
1f01eef5-1e78-4b54-b7c7-3462f38acdc1	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-07	2026-01-07 22:05:40.386896
c4aac17a-f767-4cb3-920d-864c4ef15178	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-08	2026-01-08 07:43:29.870356
2e7a3d47-6ca7-4634-9e21-b12f2fd66247	695f618d-cc93-489d-9879-7984d52c70c9	2026-01-08	2026-01-08 10:45:05.296079
e5aaca36-e52f-4a83-bbbb-4ab5fb6e3202	8af2afba-1be0-4951-b066-790a31718076	2026-01-08	2026-01-08 11:09:55.662056
a301afa9-25b8-4b1f-a340-09e80460f3a0	ffe30495-7455-4198-a15d-56b44c289976	2026-01-09	2026-01-09 09:35:31.358984
300960f1-0225-4559-ac51-a5e4152569c8	6b075e4d-3fb6-4984-b5de-704c596187db	2026-01-10	2026-01-10 18:11:42.972632
bdddd453-c7cb-488a-a190-aa3ccd7b233f	695f618d-cc93-489d-9879-7984d52c70c9	2026-01-10	2026-01-10 18:14:21.95043
48201800-8e2e-42af-bef7-dfac5e2424d3	695f618d-cc93-489d-9879-7984d52c70c9	2026-01-12	2026-01-12 14:01:52.541184
c7975fba-43aa-450e-9460-4b19896f2584	ffe30495-7455-4198-a15d-56b44c289976	2026-01-12	2026-01-12 14:18:51.096284
83a0619c-33d2-4913-a08b-5b646534a5c2	695f618d-cc93-489d-9879-7984d52c70c9	2026-01-13	2026-01-13 10:45:25.611738
e4e722fb-c6b2-49bf-9d46-3c09346deb03	ffe30495-7455-4198-a15d-56b44c289976	2026-01-13	2026-01-13 13:09:23.45201
a687f763-af43-49ae-9ad4-f37d475f157f	ffe30495-7455-4198-a15d-56b44c289976	2026-01-14	2026-01-14 08:39:04.33991
5f94f239-24e9-4efb-8aee-61b6ca898b97	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	2026-01-14	2026-01-14 20:04:16.425004
b351719c-8a78-4f5b-84e6-7d93804cdaae	96955d2b-06aa-46e9-ba97-7f5f3376a0b0	2026-01-14	2026-01-14 21:57:18.042303
d9d5bea9-0e55-4959-b8d0-4e63361428dc	695f618d-cc93-489d-9879-7984d52c70c9	2026-01-15	2026-01-15 10:58:42.983283
\.


--
-- Data for Name: forest_trees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.forest_trees (id, user_id, tree_type, position_x, position_y, position_z, planted_at, task_id, growth_points, stage, size) FROM stdin;
f61c40b2-868b-4b43-bb1f-2380b641d7d1	ffe30495-7455-4198-a15d-56b44c289976	default	27.22	0.00	20.26	2026-01-13 15:30:04.064335	0b1a16a9-c712-4195-ad7d-e37abffa1074	10	sapling	0.036
64fa7ebf-8ff0-4352-8418-eccb0bc825fd	ffe30495-7455-4198-a15d-56b44c289976	default	31.72	0.00	18.53	2026-01-13 15:30:51.923435	49a47427-e93f-439c-ac10-bf089760aa79	10	sapling	0.039
f2b3d4f4-9684-420f-a7e6-04ea3f7334f7	8af2afba-1be0-4951-b066-790a31718076	default	4.68	0.00	8.51	2025-12-05 08:51:19.622625	49a47427-e93f-439c-ac10-bf089760aa79	11	sapling	0.035
38c0c701-6e1f-4f81-b49e-5c3b445d4667	ffe30495-7455-4198-a15d-56b44c289976	default	27.70	0.00	14.84	2026-01-09 09:39:03.755515	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	44	young	0.133
06c18b04-6aef-4f8d-b0f7-abbbe9c14a16	ffe30495-7455-4198-a15d-56b44c289976	default	30.37	0.00	21.09	2026-01-12 14:21:44.351558	6da2f0d2-d40d-4222-b308-6c2efc4cbb02	20	sapling	0.030
dc30d4aa-46d3-4ad3-9d8f-6b85e63bf17c	ffe30495-7455-4198-a15d-56b44c289976	default	31.74	0.00	20.11	2026-01-14 18:11:47.371098	feeab851-92a6-4209-ba8b-eecc2bb9cc06	1	sapling	0.043
354c97c1-fa44-4733-841b-ffd541104072	ffe30495-7455-4198-a15d-56b44c289976	default	29.91	0.00	18.84	2026-01-14 08:40:03.484154	5073320b-3b03-41d8-84df-a5aa48ffbc01	10	sapling	0.047
862c0a79-3762-40d8-a9b4-469ac2db46e4	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	15.49	0.00	29.15	2026-01-14 21:16:40.710155	0b1a16a9-c712-4195-ad7d-e37abffa1074	4	sapling	0.048
db309092-bbd5-4194-8cc3-cb8900346e39	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	2.90	0.00	20.94	2026-01-08 12:37:55.273572	49a47427-e93f-439c-ac10-bf089760aa79	7	sapling	0.050
33855ae8-b532-454b-b92a-624754e51a14	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	7.06	0.00	16.11	2026-01-08 12:37:55.273572	f212470c-195f-4d65-a9a8-d9015cce8bf3	7	sapling	0.043
67246d3c-7b69-4113-bbe0-d465899494c3	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	9.53	0.00	21.70	2026-01-08 12:37:55.273572	0b1a16a9-c712-4195-ad7d-e37abffa1074	7	sapling	0.035
b3c1a301-afb0-4aeb-b735-ac319e2ce018	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	4.11	0.00	17.39	2026-01-08 12:37:55.273572	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	7	sapling	0.042
e86b1eeb-8b75-48bc-b1b5-eedea6382cb3	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	5.74	0.00	17.02	2026-01-08 12:37:55.273572	456c1be6-40da-4f3d-9810-ea8e87e72afc	7	sapling	0.021
a283489b-736d-4e31-b2ad-a9f9f62ab206	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	9.97	0.00	14.37	2026-01-08 12:37:55.273572	7e613eb6-ce9d-48ee-94f9-c3418383ccba	7	sapling	0.040
9cdf6193-04eb-47d5-856c-00a25ae3d1ed	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	9.69	0.00	20.14	2026-01-08 12:37:55.273572	feeab851-92a6-4209-ba8b-eecc2bb9cc06	7	sapling	0.031
692577a3-0df4-4079-a7d6-eb84cf322b58	695f618d-cc93-489d-9879-7984d52c70c9	default	21.00	0.00	17.93	2026-01-08 16:34:46.737961	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	24	young	0.123
b0765559-b272-4d1c-8819-b9cc7398bdfb	695f618d-cc93-489d-9879-7984d52c70c9	default	17.46	0.00	17.17	2026-01-08 16:33:33.277783	feeab851-92a6-4209-ba8b-eecc2bb9cc06	57	mature	0.272
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (id, name, description, is_online, address, latitude, longitude, created_at, updated_at, active, category, category_description) FROM stdin;
4176d288-0a11-4c63-ae49-8c52e24fb036	tortuuga - Fashion. Upcycling	Tortuuga hat eine großartige Auswahl von Schuhen, Schmuck über Accessoires bis zu Klamotten. „Die Idee von tortuuga kam aus der Vision eine bessere Welt für unsere Kinder zu hinterlassen in Kombination mit meiner Leidenschaft für Mode.“ – Inhaberin Carmen Padilla	f	8, Obere Karlstraße, Innenstadt, Erlangen, Bayern, 91054, Deutschland	49.596734	11.008540	2026-01-13 16:00:34.49063	2026-01-13 16:00:34.49063	t	external	\N
1f3f610a-bbe3-4bf4-82a2-d948a48fb78a	Salz und Pfeffer - Slow Food Restaurant	Seit Jahren arbeitet Bonifacio Vincenzi, auch als Ivan bekannt, als kreativer Koch für das Salz + Pfeffer. Seit 2011 ist er der erste Slow Food Förderer Erlangens.	f	19, Hartmannstraße, Röthelheimpark, Erlangen, Bayern, 91052, Deutschland	49.593522	11.021946	2026-01-13 16:02:51.622738	2026-01-13 16:02:51.622738	t	external	\N
e24f97e1-81fb-496e-a48f-9ce29a6be570	Die Luise - Gut schlafen können.	Hotel Luise	f	10, Sophienstraße, Innenstadt, Erlangen, Bayern, 91052, Deutschland	49.589614	11.014692	2026-01-05 18:23:04.097437	2026-01-13 16:03:24.984391	t	hotel_reception	\N
50cfe2f2-a82e-43cb-8366-aaa7235d58e1	Online	Default online location	t	\N	\N	\N	2025-12-04 11:07:52.058089	2025-12-04 11:07:52.058089	t	online	\N
3de02628-9fd7-4fab-8bd2-8bb782bd1005	Berlin Lobby	Main lobby area for in-person challenges and rewards pick-up.	f	Alexanderplatz 5, 10178 Berlin, Germany	52.521900	13.413200	2025-12-04 11:14:44.227931	2026-01-16 12:16:38.016859	f	physical	\N
d054fccb-c378-4f71-b3d5-d336ea13d489	Vienna Rooftop Garden	Open-air collaboration space on level 8 with city views.	f	Mariahilfer Straße 15, 1060 Wien, Austria	48.198600	16.349400	2025-12-04 11:14:44.227931	2026-01-16 12:16:38.016859	f	physical	\N
\.


--
-- Data for Name: points_bonus_qr_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.points_bonus_qr_tokens (id, qr_token, points_amount, generated_by, generated_at, redeemed_by, redeemed_at, status, expires_at) FROM stdin;
cc9725f7-145d-446c-a619-78212110d857	f41b93ce2d07e9c11b652141a004ef7144d1f8ecf21193a8416f12a786960bd3	50	8af2afba-1be0-4951-b066-790a31718076	2026-01-06 19:12:13.58544	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-06 19:13:58.332724	redeemed	2026-01-07 19:12:13.585
98206dbe-d1c1-4731-96d1-637f90030a31	0c596f35640e0a0cfb8cbe080207a72428b16f1c3947e39a44f030f48fefe8dd	10	8af2afba-1be0-4951-b066-790a31718076	2026-01-06 19:14:20.654931	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-06 19:14:24.766096	redeemed	2026-01-07 19:14:20.654
\.


--
-- Data for Name: reward_parameters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reward_parameters (id, parameter_type, value, display_order, active, created_at, updated_at, weight) FROM stdin;
cee1cb94-8920-4e13-b7fe-de8e5dfa9753	reward_art	Rabatt	1	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
8f1eff52-97b3-4505-994c-e4ff7c4de61f	reward_art	Erlebnis	2	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
8eac3b7b-11fd-40b2-80ff-0b40242cacee	reward_art	Add-on	3	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
df0e279a-dabc-469c-8dc2-c4ba6e407373	reward_art	physisches Geschenk	4	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
0785e1db-d43d-4e5d-9f50-902ca7369a12	kategorie	Hotel	1	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
097ae8a8-383b-4824-87a7-9493c63d5bb9	kategorie	nicht Hotel	2	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
bd34d17d-1d5d-4791-93b8-848dd4f00562	kategorie	Online	3	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
54877af5-f15b-4565-b8b8-748d541c60d9	kosten	niedrig	1	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	1.00
387315a4-633b-4a25-bfa5-2aac1029e5e8	kosten	mittel	2	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	2.00
f4409855-8a38-4cb3-a4e1-b3ec6722293e	kosten	hoch	3	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	3.00
\.


--
-- Data for Name: reward_redemptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reward_redemptions (id, user_id, reward_id, redeemed_at, voucher_code, status, qr_token, metadata) FROM stdin;
08c5b6e4-6b22-4f5c-996c-24c78cfc1008	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2025-12-04 12:04:29.686746	COFFEE-ON-US	pending	\N	\N
985791cd-54cb-4167-a84c-7ecbed0d481a	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	a119fd67-72ba-4093-9863-9876ae403dd3	2026-01-06 22:34:02.386729	\N	pending	54b3824140e06d26480654e71ca8932f3efd4a2ab86cc3d7770796a6922abc9e	\N
5493d589-07c4-47f1-aa63-9d77ccec4f48	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	04919452-8903-4eb3-b395-f494b7dc56e2	2026-01-06 22:34:07.535749	\N	pending	5212ef993469179f5951e232fe7378fa0238a32bd1c42e440b309964d3a94654	\N
c140ac92-c26e-49df-af43-1e58291b3e23	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	e3d0d0cb-97bd-4e33-9000-53775168a095	2026-01-06 22:34:27.706675	FOOD-10OFF	pending	fd2a7d06a29d5dfa150c071c92af3b6ac9260d184d836bf678833ee019f4cd68	\N
aa34c1d2-d344-4695-a910-26ff42296251	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:35:06.528658	COFFEE-ON-US	used	a04e1298903dda5c35a1d3fa9ee1ed3938934d889d8557ca5bc2ecfc2babc630	\N
6e32cc55-0822-4be6-b389-1c338a254cfa	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:38:47.465092	COFFEE-ON-US	used	76829d0711ef57572a3fac26343de89b1ab25795df58a5787915baddfb168032	\N
7746c8d6-4ab3-4557-8827-c22af685ca4e	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:49:21.884474	COFFEE-ON-US	used	da6682e805a4fc644a24324c045f61f5d4e63494d0d5aefae3a51de418febb12	\N
a548db0b-cfcb-41a9-a3c6-ee0fc0d94acd	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:58:22.019392	COFFEE-ON-US	used	34d80e052ebed03c0f6ca1a1670d2615c20adc9dafe8b2c240e8e83bba01ae86	\N
b0e0a398-b2eb-487c-a5a2-3de2035d77c1	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:59:23.707057	COFFEE-ON-US	pending	d10d1e88fc01dad225a2e4bb0f4b987e01ee5a95afa7821ec49e30a00a0f87ef	\N
7f11f673-d256-4cd4-afbc-15dde0b5f2e4	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-07 22:07:00.210214	COFFEE-ON-US	pending	660e99a1e93fccef88c05e4d00943bf6dcb0d91d4e71a28645a59c52e85b87d1	\N
68810565-9637-4185-bae6-f6e89a82c5f9	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	04919452-8903-4eb3-b395-f494b7dc56e2	2026-01-08 07:53:27.02752	\N	pending	7417f4062c622ce848e22e8f58416aadd7fc4e1280f2c7a3c27bd9899a06cb9f	\N
c81904c6-86d5-476b-8264-f629f06448b0	695f618d-cc93-489d-9879-7984d52c70c9	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 11:52:54.052146	\N	pending	43dc0ea06a74cc68e04bfa6e0411a33a25072d7040a7bd824dd733e4b0fe097e	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}
670d9760-cf99-40c5-8e29-7fd1801284c2	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 11:53:55.749943	\N	pending	ce9929f58e2367940e4934507617d8f89caadb32334ad57c2b5a7ef71e1229db	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}
9e2849d1-fd54-4237-a145-b839f6196582	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 11:53:57.627234	\N	pending	81272329b11ea50b7239f222bd25346ca0de1ac7d789b3894acbf7fea72d7aab	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}
83e154ea-6dc1-4684-b4d9-16a7c0a3160f	695f618d-cc93-489d-9879-7984d52c70c9	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 11:55:06.730653	\N	used	b20bde1cb5c4d2eb450cb86340a23dfa50e5cae85223f028d4b90268e6b7dfbd	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}
673b8298-513b-4829-bd57-e1b60e12502a	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 12:06:11.152863	\N	pending	8049410d5995de8525d7d55c9564e0abc4152d8c6cf3d86435ecf21bff7049c1	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}
41e77eaf-a76c-43e7-b7de-c1060cf299e0	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 12:06:13.483383	\N	pending	bab5c526ab3b3452dea325c741da5dcc56c31c0a124372b4e9cadefcc8c3f16a	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}
9a87d640-61a4-481c-88cc-eec745be8e9a	695f618d-cc93-489d-9879-7984d52c70c9	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 12:26:03.362585	\N	used	361a8f509761371c7e0ac9905696a7d78dd612b0b0e323ce906cdf93d8cb3bf0	{"teamId": "ae04ca7b-0a57-4bfc-8510-3280c4215085", "useTeamPoints": true}
02ecd791-7076-4337-b5fa-ebbd4ebabce0	695f618d-cc93-489d-9879-7984d52c70c9	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 16:35:48.80804	\N	pending	d9f54e2d7642ade3f7851f4278c3217e7b79570a291e428272d9fe871247b49b	\N
1c2b97c5-0f07-4957-ac26-a7d0e7a8b4f6	ffe30495-7455-4198-a15d-56b44c289976	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-12 14:41:05.500813	COFFEE-ON-US	pending	42c9ac07361f22e50114fe2251bf4efac29eae84f61e8a0c05d394b5f0eb0d9c	\N
59fc873a-caea-49e6-873d-dd15bebc41ae	ffe30495-7455-4198-a15d-56b44c289976	43585904-c504-4b47-8d97-5afc769eddfa	2026-01-12 15:12:37.545364	\N	pending	fe8c4392d05dc47528df616a05003f85b9d7c0323f5bd3d50ce4321636114761	\N
0b45ca1c-5c29-4901-abbc-b9e35594fd1b	ffe30495-7455-4198-a15d-56b44c289976	43585904-c504-4b47-8d97-5afc769eddfa	2026-01-14 08:41:45.832386	\N	pending	4d20043c78a9739aaa329049bc6bee47166b450829f9013bd7836b697e659262	\N
db8d525b-d635-4d5a-91d4-44c9db6b48cf	ffe30495-7455-4198-a15d-56b44c289976	e3d0d0cb-97bd-4e33-9000-53775168a095	2026-01-14 08:42:24.18087	FOOD-10OFF	pending	2fdc0fef90c7f0f345a8243cc1a53f5581cb65674dd973e199f0cfe5f658e9e3	\N
\.


--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rewards (id, title, description, points_cost, reward_type, voucher_code, external_api_id, active, created_at, updated_at, location_id, recurrence, last_generated_at, reward_art, kategorie, event_group, moegliche_punkte, zielgruppe) FROM stdin;
b6e79a8a-2369-41ee-810b-4daadfbe3b21	Aromabad	Genieße unser Aromabad im PrivateSpa	120	benefit	\N	\N	t	2026-01-04 14:26:59.825148	2026-01-04 14:26:59.825148	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	nicht Hotel	Event 4	\N	{Gäste}
c8aad02a-d1d9-466d-be45-fd3b0512fe8d	Free Coffee	Enjoy one free coffee at the hotel bar.	15	voucher	COFFEE-ON-US	\N	t	2025-12-04 11:14:44.314907	2025-12-04 11:14:44.314907	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	Hotel	\N	\N	{Gäste}
e3d0d0cb-97bd-4e33-9000-53775168a095	10% Restaurant Discount	Get 10% off at the hotel restaurant.	40	discount	FOOD-10OFF	\N	t	2025-12-04 11:14:44.33435	2025-12-04 11:14:44.33435	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Erlebnis	Hotel	Event 1	\N	{Gäste}
04919452-8903-4eb3-b395-f494b7dc56e2	Late Checkout	Enjoy late checkout until 2 PM.	60	benefit	\N	\N	t	2025-12-04 11:14:44.338973	2025-12-04 11:14:44.338973	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Erlebnis	Hotel	\N	\N	{Gäste}
69506b05-c7ea-464b-8bf7-94abb7f72343	Shoppingrabatt	Hotelshop 5%	70	discount	\N	\N	t	2026-01-04 14:26:59.824135	2026-01-06 19:08:21.315026	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	Hotel	Event 5	\N	{Gäste,Mitarbeitende}
52a5b7cb-a091-4027-99d7-5274ad067eaa	Roll the Dice	Würfel. Bei einer 6 ist dein Aufenthalt/Eine Nacht umsonst (Nur Übernachtung, nicht Frühstück etc.)	200	discount	\N	\N	t	2026-01-04 14:26:59.814703	2026-01-04 14:26:59.814703	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Rabatt	nicht Hotel	\N	\N	{Gäste}
0f396d91-7561-472c-8cff-27d9719e98cd	Zimmerupgrade	Ein Zimmerupgrade bei der nächsten Übernachtung oder sofort (wenn bei Anreise eingelöst wird)	150	benefit	\N	\N	t	2026-01-04 14:26:59.817366	2026-01-04 14:26:59.817366	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	Hotel	\N	\N	{Gäste}
a56ba711-3277-497e-aeaf-3701d359c5fe	Freigetränk	Ein Freigetränk (Bier, Glas Wein, Limo)	50	benefit	\N	\N	t	2026-01-04 14:26:59.818462	2026-01-04 14:26:59.818462	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	nicht Hotel	\N	\N	{Gäste}
054e63a8-b769-4608-a209-b6cf44dc521c	Freigetränk	Flasche Wein/Sekt	100	benefit	\N	\N	t	2026-01-04 14:26:59.819595	2026-01-04 14:26:59.819595	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Rabatt	nicht Hotel	\N	\N	{Gäste}
c6306434-7d67-4031-9acb-86b868266a94	Team Coffee Break	Organized team coffee break for your department.	120	team_event	\N	\N	t	2025-12-04 11:14:44.339994	2026-01-06 19:09:05.702339	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	nicht Hotel	\N	\N	{Mitarbeitende}
1e691d8c-bdcf-4b77-9bdc-11ce4f0abbd7	Garagenplatz	Parkplatz in der Garage umsonst	80	benefit	\N	\N	t	2026-01-04 14:26:59.820641	2026-01-04 14:26:59.820641	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	nicht Hotel	\N	\N	{Gäste}
a119fd67-72ba-4093-9863-9876ae403dd3	Fahrrad	Fahrrad für einen Tag umsonst	60	benefit	\N	\N	t	2026-01-04 14:26:59.821669	2026-01-04 14:26:59.821669	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Rabatt	Hotel	\N	\N	{Gäste}
43585904-c504-4b47-8d97-5afc769eddfa	Snackbox	Snacks (Chips & Popcorn)	40	benefit	\N	\N	t	2026-01-04 14:26:59.822646	2026-01-04 14:26:59.822646	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Rabatt	Hotel	Event 5	\N	{Gäste}
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schema_migrations (id, migration_name, executed_at) FROM stdin;
1	001_initial_schema	2025-12-04 11:07:51.850706
2	002_gdpr_consent	2025-12-04 11:07:51.860689
3	003_oauth_support	2025-12-04 11:07:51.870538
4	004_sihot_integration	2025-12-04 11:07:51.87811
5	005_user_default_role	2025-12-04 11:07:51.882866
6	006_user_type	2025-12-04 11:07:51.885859
7	007_tasks_rewards_audience	2025-12-04 11:07:51.889262
8	008_task_reward_templates	2025-12-04 11:07:51.902663
9	009_drop_task_templates	2025-12-04 11:07:51.905059
10	010_enum_user_fields	2025-12-04 11:07:52.02745
11	011_drop_reward_templates	2025-12-04 11:07:52.033665
12	012_email_verification_password_reset	2025-12-04 11:07:52.045441
13	013_passwordless_login	2025-12-04 11:07:52.05178
14	014_allow_passwordless_accounts	2025-12-04 11:07:52.05658
15	015_locations	2025-12-04 11:07:52.083161
16	016_locations_active	2025-12-04 11:07:52.088374
17	017_reward_qr_tokens	2025-12-05 19:17:41.211577
18	018_tree_growth_stages	2025-12-12 13:24:19.405262
19	019_reward_recurrence	2025-12-12 13:24:19.418246
20	020_task_recurrence	2025-12-12 13:24:19.425612
21	045_contest_start_date	2026-01-08 14:45:39.549494
\.


--
-- Data for Name: statistics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.statistics (id, metric_name, metric_value, last_updated) FROM stdin;
fc5f290c-a6b1-4e84-9010-595f5ab2086b	total_co2_saved	0.65	2026-01-12 08:40:36.026181
c5bdef18-e08d-422d-8bcf-50d0a0d96d6f	total_trees	11.00	2026-01-12 08:40:36.027844
d0e70e13-749f-4e53-bc03-85d5e7fda041	active_users	3.00	2026-01-12 08:40:36.028715
ebebc694-3471-40fc-8296-8493196afc32	tasks_completed	11.00	2026-01-12 08:40:36.029726
39e439bd-0f24-472a-ae0b-53acc120b228	avg_points_per_user	162.75	2026-01-12 08:40:36.030641
b18ab227-0feb-41b1-ae28-2343dc058693	co2_saved_per_task	0.06	2026-01-12 08:40:36.031541
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_config (id, config_key, config_value, description, created_at, updated_at) FROM stdin;
99b0d8fa-0115-4092-92b7-c23350619e8e	reward_cost_calculation_factor	1.0	Factor for calculating reward costs: kosten_weight * factor	2026-01-04 14:26:46.676345	2026-01-04 14:26:46.676345
655d1246-813b-4ef3-a96e-324da5b48707	points_calculation_factor	2	Factor for calculating task points: (difficulty_weight * time_required_weight) * factor	2026-01-04 14:26:46.582898	2026-01-06 19:07:34.745197
\.


--
-- Data for Name: task_parameters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_parameters (id, parameter_type, value, display_order, active, created_at, updated_at, weight) FROM stdin;
c5e808d2-ee25-48fe-9e2f-138aa49b2c7a	type	video	1	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
f5611af8-f724-4aff-8f5d-50f623c58b4d	type	quiz	2	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
de9c89bf-dcf2-4ce1-b514-23f78d379071	type	article_quiz	3	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
68deb7e6-626d-48e3-930a-78109a93ee2b	type	survey	4	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
213baa26-e7d5-438c-b424-19da7eacea40	type	qr	5	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
191fb82b-e4d2-4581-926d-3bdd71f11454	type	photo	6	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
2aac6c95-16df-4f91-93d2-483141b88363	type	visit_location	7	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
3d7f1bdd-6cac-414c-80de-61801c4080c4	category	Kommunikation & Netzwerke	1	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
c4f59ce4-2c9b-4824-93e6-0cbb5c6d3dc8	category	Mensch & soziales Umfeld	2	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
835b41e1-c270-4f78-a66b-f36f5918886d	category	Natur & Umweltschutz	3	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
14709367-d701-499e-b731-d2673f847122	category	Ressourcenverbrauch & Materialeinsatz	4	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
8e81b500-a4da-4459-8ca5-b2ce7c3f4ac4	location_tool	Umgebung	1	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
c2c309ee-3887-4202-979b-b5a1a77193ae	location_tool	Hotel	2	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
424efea1-5bbd-401f-a4a5-27885e573d41	location_tool	egal	3	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
07db5b50-a921-4a65-b126-d422eb7959a7	location_tool	Smartphone/PC	4	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
9a681ed7-9879-4a5c-8981-e28d9f3cc6c1	difficulty	sehr einfach	1	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	1.00
4cff0610-e65e-4062-818d-df6963a6612c	difficulty	einfach	2	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	2.00
562ebe04-5a84-44ca-af7c-32c6e14b5de8	difficulty	mittel	3	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	3.00
360c1acd-c88a-4a2b-accb-6f029083caa2	difficulty	schwer	4	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	4.00
5c2920fe-a115-4166-ae97-2af58447268e	difficulty	sehr schwer	5	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	5.00
54e1a182-4ae6-476b-974c-c8b7ff64dfff	time_required	1-3 Min	1	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	1.00
3b6b0f66-fbbc-458a-85cf-3ec0102ed3d8	time_required	3-10 Min	2	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	2.00
baf70939-f9ce-4bbc-ac48-2fc5bc39780f	time_required	10-30 Min	3	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	3.00
13189ce9-eecd-40f5-8119-b21a3495bfc2	time_required	30-60 Min	4	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	4.00
a164d597-9ca4-4fa4-95aa-bf2b1c76931c	time_required	60+ Min	5	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	5.00
9d210f45-88ef-457d-a453-1f7414ea8b66	zielgruppe	Gäste	1	t	2026-01-06 19:07:05.083652	2026-01-06 19:07:05.083652	1.00
746e7cf9-c9a0-4188-81ce-5453b1ef9e56	zielgruppe	Mitarbeitende	2	t	2026-01-06 19:07:14.118728	2026-01-06 19:07:14.118728	2.00
a40e3445-cdff-4541-95c0-c1d77a157d6d	zielgruppe	Stakeholder	3	t	2026-01-06 19:07:23.132308	2026-01-06 19:07:23.132308	3.00
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, description, type, points, video_url, quiz_questions, qr_code, photo_required, co2_savings_kg, external_id, active, created_at, updated_at, location_id, recurrence, last_generated_at, category, difficulty, time_required, location_tool, event_group, target_latitude, target_longitude, article_url, article_content, survey_questions, survey_type, prerequisite_task_id, prerequisite_task_count, prerequisite_task_ids, zielgruppe) FROM stdin;
49a47427-e93f-439c-ac10-bf089760aa79	Sustainability Basics	Watch the 1-minute intro video and answer two quick questions.	video	12	https://www.w3schools.com/html/mov_bbb.mp4	[{"options": ["Blue", "Green", "Red"], "question": "Which bin is for paper?", "correctAnswer": "Blue"}, {"options": ["Leave on", "Switch off"], "question": "What should you do with lights when leaving a room?", "correctAnswer": "Switch off"}]	\N	f	0.20	\N	t	2025-12-04 11:14:44.275197	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	einfach	10-30 Min	egal	Team Challenge	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
f212470c-195f-4d65-a9a8-d9015cce8bf3	Recycling Station Photo	Find the hotel recycling station and upload a photo as proof.	photo	6	\N	\N	\N	t	0.25	\N	t	2025-12-04 11:14:44.293906	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Natur & Umweltschutz	sehr einfach	10-30 Min	Smartphone/PC	Umweltschutz Initiative	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
b145ef6a-52a8-4b14-95d6-3cdbac6f9e11	Besuche "Hundsgemütlich"	Geschäft für Heimtierbedarf	visit_location	4	\N	\N	\N	f	0.00	\N	t	2026-01-07 15:46:50.337422	2026-01-09 09:38:43.32347	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	3-10 Min	Umgebung	\N	49.59880000	11.00381000	\N	\N	\N	\N	\N	\N	\N	{Gäste}
7b097c73-5180-4538-b41e-6d115bfffbe1	Unsere Tische	Unsere Tische im Frühstücksraum und in der Lounge sind aus einem ganz ungewöhnlichen Material!	video	2	https://www.youtube.com/watch?v=hXUdgJbDz6I	[{"options": ["Schweden", "Deutschland", "Ukraine", "Türkei"], "question": "In welchem Land wurden die Tischplatten hergestellt?", "correctAnswer": "Ukraine"}]	\N	f	0.00	\N	t	2026-01-13 15:51:03.728794	2026-01-13 15:51:03.728794	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Mitarbeitende,Gäste}
821ce0c1-3caf-4b3f-8194-a51e402e3ff9	Instagram	Folge uns auf Instagram und gebe den Code hier ein, der auf unserem Profil steht (noch zu definieren)	qr	2	\N	\N	INSTAGRAM-CODE-001	f	0.00	\N	t	2026-01-04 14:27:01.957856	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Mensch & soziales Umfeld	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste,Mitarbeitende}
456c1be6-40da-4f3d-9810-ea8e87e72afc	Fehlerfinden	Hast du einen Fehler in unserer App gefunden? Dann schreibe ihn uns hier hinein oder lade einen Screenshot hoch.	photo	32	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.964919	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Natur & Umweltschutz	schwer	30-60 Min	Umgebung	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
d3237f56-375d-400f-a9df-abbb5b145c8d	Anreise	Wie bist du zu uns gekommen? Trage die Entfernung in KM, Ort und Verkehrmittel ein.	survey	8	\N	\N	\N	f	0.00	\N	t	2026-01-04 14:27:01.966088	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	30-60 Min	Umgebung	\N	\N	\N	\N	\N	[{"type": "text", "question": "Entfernung in KM", "required": true}, {"type": "text", "question": "Ort", "required": true}, {"type": "single_choice", "options": ["Auto", "Zug", "Bus", "Fahrrad", "Zu Fuß", "Anderes"], "question": "Verkehrsmittel", "required": true}]	mixed	\N	\N	\N	{Gäste}
a92d629c-e2a4-47ef-a3b4-825f69d8de54	Male uns ein Bild	Male ein Bild von einem Ort im Hotel, der dir besonders gut gefällt.	photo	20	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.971636	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Natur & Umweltschutz	einfach	60+ Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
1bab2d7d-d2ac-4887-b379-bd9fb6d8793b	Bring your reusable bottle	Fill your bottle at the lobby water station and scan the QR code.	qr	8	\N	\N	QR-LOBBY-WATER-001	f	0.15	\N	t	2026-01-04 14:26:50.031387	2026-01-09 09:38:43.32347	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Natur & Umweltschutz	einfach	3-10 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
bc73bf39-0c3b-4e6b-8bba-372f4fbe59d4	LinkedIn	Folge uns auf LinkedIn und gebe den Code hier ein, der auf unserem Profil steht (noch zu definieren)	qr	6	\N	\N	LINKEDIN-CODE-001	f	0.00	\N	t	2026-01-04 14:27:01.961302	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Natur & Umweltschutz	mittel	1-3 Min	Hotel	Sommeraktion 2024	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
aa9e3701-fb93-48f8-a475-52de830e3b4b	Facebook	Folge uns auf Facebook und gebe den Code hier ein, der auf unserem Profil steht (noch zu definieren)	qr	16	\N	\N	FACEBOOK-CODE-001	f	0.00	\N	t	2026-01-04 14:27:01.9625	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Natur & Umweltschutz	einfach	30-60 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
6da2f0d2-d40d-4222-b308-6c2efc4cbb02	Margalädla	Kaufe etwas in unserem Hotelshop und du erhältst den Einkaufswert als Punkte	survey	12	\N	\N	\N	f	0.00	\N	t	2026-01-04 14:27:01.963685	2026-01-12 10:46:16.758223	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	mittel	3-10 Min	Hotel	\N	\N	\N	\N	\N	[{"type": "text", "question": "Wie hoch war der Einkaufswert?", "required": true}]	mixed	\N	\N	\N	{Gäste,Mitarbeitende,Stakeholder}
b01d3854-960a-4c5e-a92b-ae0b8118c654	Müllsammeln	Sammle Müll bei einem Spaziergang. An der Rezeption erzählst du von uns eine Mülltüte und Karte. Gib den Müllbeutel bei uns ab, wenn du wieder zurück bist.	photo	18	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.967371	2026-01-12 10:47:08.285798	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Natur & Umweltschutz	mittel	10-30 Min	egal	Gastgruppen Programm	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste,Mitarbeitende,Stakeholder}
bdfd714f-988e-47ba-9f92-181d2dd608d0	Unser Hotelname	Woher kommt eigentlich der Hotelname? 	video	2	https://www.youtube.com/shorts/sfdtSU7oBt0	[{"options": ["Hannelore", "Georg", "Lisa", "Benjamin"], "question": "Welchen Namen hätte das Hotel fast bekommen?", "correctAnswer": "Georg"}]	\N	f	0.00	\N	t	2026-01-13 15:56:56.789389	2026-01-13 15:56:56.789389	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Mitarbeitende,Gäste,Stakeholder}
0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	Was sind die IDGs?	Kurzvideo über die IDGs mit Fragen am Ende	video	32	https://www.youtube.com/watch?v=KJhOw98S45U	[{"options": ["Option 1", "Option 2", "Option 3"], "question": "Was sind die IDGs?", "correctAnswer": "Option 1"}]	\N	f	0.00	\N	t	2026-01-04 14:27:01.977881	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	schwer	30-60 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste,Mitarbeitende,Stakeholder}
7efe0342-bf73-4bba-9c80-f0acba5019d2	Pflanze einen Baum	Hast du die Möglichkeit einen Baum zu Pflanzen? Dann schicke uns davon ein Bild mit einem Schild auf dem steht "XYZ noch zu definieren" und lade es hoch	photo	16	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.970157	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	schwer	3-10 Min	egal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
7e613eb6-ce9d-48ee-94f9-c3418383ccba	TripAdvisor	Bewerte uns auf TripAdvisor und schicke uns einen Screenshot	photo	18	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.973072	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	mittel	10-30 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
a9a29dc6-7c51-4be2-87c9-c3e7cc145b33	Google	Bewerte uns auf Google und schicke uns einen Screenshot	photo	30	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.974627	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Natur & Umweltschutz	mittel	60+ Min	Hotel	Umweltschutz Initiative	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
0b1a16a9-c712-4195-ad7d-e37abffa1074	Fair Fashion	Trägst du ein Fair Fashion Kleidungstück? Schicke uns ein Bild von deinem Look und der Marke!	photo	2	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.976274	2026-01-09 09:38:43.32347	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
12999df0-1c40-4d9a-af5c-c7ceb082bc2b	Support your local shops	Wir haben bei einigen Shops QR-Codes hinterlegt. Besuche Sie und du bekommst dafür von uns Punkte :)\nBeende die Shopping-Tour in der Hotel-Lobby.	visit_location	24	\N	\N	\N	f	0.00	\N	t	2026-01-04 14:27:01.968812	2026-01-09 09:38:43.32347	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Kommunikation & Netzwerke	mittel	30-60 Min	Umgebung	Sommeraktion 2024	49.58961400	11.01469200	\N	\N	\N	\N	\N	1	{b145ef6a-52a8-4b14-95d6-3cdbac6f9e11}	{Gäste}
5073320b-3b03-41d8-84df-a5aa48ffbc01	Kondensstreifen sind ein Problem	Könnte das Fliegen auf einen Schlag viel klimafreundlicher sein? 	video	4	https://www.youtube.com/shorts/CaGXe1D9Lhc	[{"options": ["Airlines müssen eine Checkbox anklicken", "Mit guter Laune fliegen", "Nur bei warmen Wetter fliegen", "Aktuell gibt es keine Lösung"], "question": "Wie könnte man einen großen Teil des CO2-Ausstoßes durch Kondensstreifen vermeiden?", "correctAnswer": "Airlines müssen eine Checkbox anklicken"}]	\N	f	0.00	\N	t	2026-01-13 16:25:07.207792	2026-01-13 16:25:07.207792	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Natur & Umweltschutz	einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Mitarbeitende,Gäste,Stakeholder}
feeab851-92a6-4209-ba8b-eecc2bb9cc06	Duschen wie ein Astronaut?	Eine Handvoll unserer Zimmer haben eine Astronautendusche.\nIn dieser kannst du ewig Duschen ohne mehr Energie & Wasser zu brauchen als ein paar Minuten in der Dusche zuhause!	video	4	http://localhost:5001/uploads/task-video-1768414263568-736294327.mp4	[{"options": ["NASA", "Orbital Systems", "Orbima Istmen", "Starshower"], "question": "Wie heißt der Hersteller der Dusche?", "correctAnswer": "Orbital Systems"}]	\N	f	0.00	\N	t	2026-01-04 14:27:01.979504	2026-01-14 18:11:07.642246	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	einfach	1-3 Min	egal	Team Challenge	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste}
696007ff-a71b-432e-b82e-24a397cd54ce	Bring your reusable bottle	Fill your bottle at the lobby water station and scan the QR code.	qr	20	\N	\N	QR-LOBBY-WATER-001	f	0.15	\N	t	2026-01-16 12:06:18.281843	2026-01-16 12:06:18.281843	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
dc358dd0-335c-4af2-bcf8-2a732f21badb	Bring your reusable bottle	Fill your bottle at the lobby water station and scan the QR code.	qr	20	\N	\N	QR-LOBBY-WATER-001	f	0.15	\N	t	2026-01-16 12:07:23.864594	2026-01-16 12:07:23.864594	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b3ca340e-f3e8-4f01-b282-7d5c3f7cb63c	Bring your reusable bottle	Fill your bottle at the lobby water station and scan the QR code.	qr	20	\N	\N	QR-LOBBY-WATER-001	f	0.15	\N	t	2026-01-16 12:12:18.317581	2026-01-16 12:12:18.317581	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
168aba79-fd4d-43d1-a0ea-59348f648213	Bring your reusable bottle	Fill your bottle at the lobby water station and scan the QR code.	qr	20	\N	\N	QR-LOBBY-WATER-001	f	0.15	\N	t	2026-01-16 12:13:20.783743	2026-01-16 12:13:20.783743	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bf9da40f-0e5e-4717-bc6b-637962e6c95e	Bring your reusable bottle	Fill your bottle at the lobby water station and scan the QR code.	qr	20	\N	\N	QR-LOBBY-WATER-001	f	0.15	\N	t	2026-01-16 12:14:13.580157	2026-01-16 12:14:13.580157	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7823b11e-25c7-4b72-8cf3-bb6cc4778d31	Bring your reusable bottle	Fill your bottle at the lobby water station and scan the QR code.	qr	20	\N	\N	QR-LOBBY-WATER-001	f	0.15	\N	t	2026-01-16 12:15:17.692579	2026-01-16 12:15:17.692579	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ae282f33-9660-4164-bdad-92629cf83f74	Bring your reusable bottle	Fill your bottle at the lobby water station and scan the QR code.	qr	20	\N	\N	QR-LOBBY-WATER-001	f	0.15	\N	t	2026-01-16 12:16:38.032612	2026-01-16 12:16:38.032612	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_members (id, team_id, user_id, joined_at, points_contributed) FROM stdin;
268a334e-5b7b-4eaa-a35f-a64ae3dc7391	fc1ff568-dd8e-4cdf-b7a2-3ce55c616f69	695f618d-cc93-489d-9879-7984d52c70c9	2026-01-08 10:38:49.895658	0
2ce33767-2803-4085-b272-41bb454614c6	fc1ff568-dd8e-4cdf-b7a2-3ce55c616f69	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-08 10:38:49.898938	0
f510ab44-f3e6-4462-a480-7d61d12abcdb	14a81c27-fa71-449d-93d8-81e18435fc9a	695f618d-cc93-489d-9879-7984d52c70c9	2026-01-08 10:38:49.910799	0
3e24a9e4-dac7-4688-b24c-878d3f295025	14a81c27-fa71-449d-93d8-81e18435fc9a	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-08 10:38:49.912564	0
\.


--
-- Data for Name: team_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_qr_codes (id, team_id, qr_token, created_at) FROM stdin;
b15c4a87-ffe3-45ff-aad9-8b8a72b49816	fc1ff568-dd8e-4cdf-b7a2-3ce55c616f69	4313d6103800222b9ad765915b1c8c8ee800152d441678620e525e420a63cf76	2026-01-08 10:38:49.902516
afc018f6-4464-40db-84c1-93c9c540d564	14a81c27-fa71-449d-93d8-81e18435fc9a	6fbaec6c7c4fa4575fb09c3b3587e989e911553ec0ab61f0858c3873e8f500af	2026-01-08 10:38:49.914307
c75aa006-f862-4463-89e6-0a551b1aaed7	f8d11e8d-823d-43fb-86ad-d4069e0f051e	0a391c58ad8aca418ea7fb4e5b566048d1a5b03cce0093341d54aba899984049	2026-01-08 11:00:03.442873
61868e9d-2540-45fc-a5b9-b7eb3f2b71f7	ae04ca7b-0a57-4bfc-8510-3280c4215085	1182f464b553a71cebb92b97e07ced109a9abbfce705fc3f6e6cc33f92bb20c2	2026-01-08 12:21:09.383651
d17a6862-72e6-4d4d-98e2-54fa0649b029	97fe7586-b58e-4423-9860-38dae9781aa1	83bb17cb565441859f08a9e6b8c79eab7d50b5c96c11cf753fbf660a8f6967e5	2026-01-08 12:52:46.545614
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name, created_by, points_pool, created_at, updated_at, active) FROM stdin;
14a81c27-fa71-449d-93d8-81e18435fc9a	Team Thomas & Test User	695f618d-cc93-489d-9879-7984d52c70c9	0	2026-01-08 10:38:49.90891	2026-01-08 10:44:52.686322	f
fc1ff568-dd8e-4cdf-b7a2-3ce55c616f69	Team Thomas & Test User	695f618d-cc93-489d-9879-7984d52c70c9	0	2026-01-08 10:38:49.892246	2026-01-08 10:59:46.552576	f
f8d11e8d-823d-43fb-86ad-d4069e0f051e	Familie	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-01-08 11:00:03.43675	2026-01-08 12:18:01.051011	f
ae04ca7b-0a57-4bfc-8510-3280c4215085	Testteam	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-01-08 12:21:09.372869	2026-01-08 12:27:59.90582	f
97fe7586-b58e-4423-9860-38dae9781aa1	Familie	8af2afba-1be0-4951-b066-790a31718076	0	2026-01-08 12:52:46.535834	2026-01-08 12:53:03.966562	f
\.


--
-- Data for Name: user_consent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_consent (user_id, consent_data, created_at, updated_at) FROM stdin;
695f618d-cc93-489d-9879-7984d52c70c9	{"analytics": true, "marketing": true, "dataProcessing": true}	2026-01-13 20:14:53.963869	2026-01-13 20:14:53.963869
\.


--
-- Data for Name: user_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_qr_codes (id, user_id, qr_token, created_at, expires_at) FROM stdin;
d303a29b-4043-463d-b6bf-8ad30245e366	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	384bc9210f2deafe8933e0e98e25a9dcfdfc3b3a20b887d7a63b42a9aa4f6175	2026-01-08 10:33:29.232464	\N
5bded50f-c9e3-4085-8b45-bf908f69775c	695f618d-cc93-489d-9879-7984d52c70c9	fe2df6dc945426b51a9f746bb0b34b4d6e1bf0929e8346cb5cd0093fc9317bd6	2026-01-08 10:38:38.036571	\N
\.


--
-- Data for Name: user_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_tasks (id, user_id, task_id, completed_at, photo_url, quiz_answers, points_earned, survey_responses) FROM stdin;
eac8aafe-5ea7-4ae6-9337-483d6c1d8c1f	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	49a47427-e93f-439c-ac10-bf089760aa79	2025-12-04 12:03:52.229802	\N	[{"answer": "Blue", "questionIndex": 0}, {"answer": "Switch off", "questionIndex": 1}]	25	\N
5b4db523-e3b8-4e7d-80d1-4fa429cde98f	8af2afba-1be0-4951-b066-790a31718076	49a47427-e93f-439c-ac10-bf089760aa79	2025-12-05 08:51:19.618158	\N	[{"answer": "Blue", "questionIndex": 0}, {"answer": "Switch off", "questionIndex": 1}]	25	\N
39d4627a-91ad-4b29-aee5-4233986fefcd	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	f212470c-195f-4d65-a9a8-d9015cce8bf3	2025-12-05 09:59:59.859122	http://localhost:5000/uploads/task-photo-1764928799820-243641514.png	\N	30	\N
135712b7-5eee-4578-8831-36b8bd2723d4	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0b1a16a9-c712-4195-ad7d-e37abffa1074	2026-01-06 21:48:11.441271	http://localhost:5001/uploads/task-photo-1767736090962-763878775.png	\N	2	\N
06dcce84-3ba8-41c2-93e8-0c6e41b75d05	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	2026-01-06 21:48:26.103332	\N	[{"answer": "Option 1", "questionIndex": 0}]	32	\N
b4247232-036c-42cc-9b73-e7529d4ec21f	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	456c1be6-40da-4f3d-9810-ea8e87e72afc	2026-01-06 21:48:42.597645	http://localhost:5001/uploads/task-photo-1767736122567-687115207.png	\N	32	\N
4b620d13-2e3e-4c7f-9819-83628d3a904e	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	7e613eb6-ce9d-48ee-94f9-c3418383ccba	2026-01-06 21:50:37.503053	http://localhost:5001/uploads/task-photo-1767736236934-426904224.png	\N	18	\N
010a865f-951d-48a0-ad89-22bb1910d1a9	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2026-01-06 21:50:53.968372	\N	[{"answer": "Option 1", "questionIndex": 0}]	4	\N
4f5d7f6c-c9d3-497d-9fc3-5a30ae134b15	ffe30495-7455-4198-a15d-56b44c289976	0b1a16a9-c712-4195-ad7d-e37abffa1074	2026-01-13 15:30:04.045327	http://localhost:5001/uploads/task-photo-1768318202972-716445406.jpg	\N	2	\N
b07ceeb2-a28b-48c7-9c04-95d89efc8886	ffe30495-7455-4198-a15d-56b44c289976	49a47427-e93f-439c-ac10-bf089760aa79	2026-01-13 15:30:51.910777	\N	[{"answer": "Blue", "questionIndex": 0}, {"answer": "Switch off", "questionIndex": 1}]	12	\N
d666ab91-716f-4fe8-8305-822b79bbe06a	695f618d-cc93-489d-9879-7984d52c70c9	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2026-01-08 16:33:33.266471	\N	[{"answer": "Option 1", "questionIndex": 0}]	4	\N
3b34d855-4017-4b3b-9283-697e5f0cf998	ffe30495-7455-4198-a15d-56b44c289976	5073320b-3b03-41d8-84df-a5aa48ffbc01	2026-01-14 08:40:03.470239	\N	[{"answer": "Airlines müssen eine Checkbox anklicken", "questionIndex": 0}]	4	\N
51e6f825-6b23-48b7-b099-020185e575c0	695f618d-cc93-489d-9879-7984d52c70c9	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	2026-01-08 16:34:46.725721	\N	[{"answer": "Option 1", "questionIndex": 0}]	32	\N
cfbb01e7-9a79-485e-b691-e5cfe3acf9d3	ffe30495-7455-4198-a15d-56b44c289976	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2026-01-14 18:11:47.359207	\N	[{"answer": "Orbital Systems", "questionIndex": 0}]	4	\N
54616a4a-a19c-4446-8b4c-31558cc4c4bd	ffe30495-7455-4198-a15d-56b44c289976	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	2026-01-09 09:39:03.743751	\N	[{"answer": "Option 1", "questionIndex": 0}]	32	\N
c08c4fbd-963d-4e9c-ad40-6e9502c8ad25	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	0b1a16a9-c712-4195-ad7d-e37abffa1074	2026-01-14 21:16:40.698363	http://localhost:5001/uploads/task-photo-1768425399735-639674741.jpg	\N	2	\N
3b91583a-d36d-4a25-8b14-c3ea61c96089	ffe30495-7455-4198-a15d-56b44c289976	6da2f0d2-d40d-4222-b308-6c2efc4cbb02	2026-01-12 14:21:44.334374	\N	\N	12	[{"answer": "43,59", "questionId": "undefined"}]
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, name, role, user_type, points, avatar_url, created_at, updated_at, oauth_provider, oauth_id, oauth_email, sihot_guest_id, sihot_guest_data, email_verified, email_verification_token, email_verification_expires, password_reset_token, password_reset_expires, email_notifications_enabled, login_code, login_code_expires, active, deleted_at) FROM stdin;
9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	b.wersdoerfer@hotmail.de	$2a$10$Jrk0YvGAKhazzn5zRWwycOevw/ApL.C/WsjqqmVBhh60gkWKUJn1W	Benedikt  Wersdörfer 	guest	explorer	2	\N	2026-01-14 19:29:37.284647	2026-01-14 21:16:40.702087	\N	\N	\N	\N	\N	f	5bea5a53f81616014eedcda215f230e9ff22168cb8ce83431cdce170736e74a8	2026-01-15 19:29:37.287	\N	\N	t	\N	\N	t	\N
6b075e4d-3fb6-4984-b5de-704c596187db	caminim@gmail.com	$2a$10$5TXybWnjAWpIDtz5aI.qx.q7t6y.jHpYXUey.RukUHRuwRhOpTpIy	caminim	guest	explorer	0	\N	2026-01-10 14:42:28.704734	2026-01-10 18:11:31.335303	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N
695f618d-cc93-489d-9879-7984d52c70c9	thomas@rossner.tk	$2a$10$wAZCZP3asifu/VqOQAGZUevBqpZsemGuLKSG78UscsxqoWSQmEA2S	Thomas	guest	explorer	326	\N	2025-12-04 12:25:50.256816	2026-01-08 16:34:46.7297	\N	\N	\N	\N	\N	t	362fc385b1bf90b8b0ff76915d3a874fe7e7171c9d1d5eafab230caa5096377f	2025-12-05 12:25:50.259	d5eb3477d224f8a5edf3f70c1bf608281f1a24ed38521fc85c98a1da01270a10	2026-01-06 20:13:02.41	t	\N	\N	t	\N
cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	bf@hotel-luise.de	$2a$10$SVoIQWtrK0SNxWIilZ1HauGrFIHcXoLdL69NdTmkNa7OZT45EeCsu	Ben Admin	administrator	explorer	0	\N	2026-01-12 14:07:42.419221	2026-01-12 14:14:24.176167	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N
ffe30495-7455-4198-a15d-56b44c289976	ben@haive.de	$2a$10$r/RYpVbrRAZVyfKGBePV5.jK0cTKVJQUpQ3BRsmHYR7e1SXj6zB8K	Ben	guest	explorer	66	\N	2026-01-09 09:33:33.406007	2026-01-14 18:11:47.36274	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N
96955d2b-06aa-46e9-ba97-7f5f3376a0b0	info@hotel-luise.de	$2a$10$dIc6OLmawohlUIujE34KQuj6riOd8eIJx4atGmIHA93/c14jBqveC	Rezeption Hotel Luise	guest	explorer	0	\N	2026-01-14 19:26:18.610012	2026-01-14 19:26:18.610012	\N	\N	\N	\N	\N	f	058575a58127c24ce59ffeff701504ea74072ee7a7b849a33570c213548f70b3	2026-01-15 19:26:18.614	\N	\N	t	\N	\N	t	\N
b03443d3-fa3e-407d-9dcf-ad0e1b246b04	test@example.com	$2a$10$xoD0hRUkZeviz7OoGxX33O/SAnFNuFn2S0h4vu6tup3XcedWJm0CW	Test User	guest	explorer	243	\N	2025-12-04 11:14:44.357971	2026-01-16 12:16:38.114602	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N
8af2afba-1be0-4951-b066-790a31718076	employee@example.com	$2a$10$xoD0hRUkZeviz7OoGxX33O/SAnFNuFn2S0h4vu6tup3XcedWJm0CW	Test Employee	employee	explorer	50	\N	2025-12-04 11:14:44.357971	2026-01-16 12:16:38.114602	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N
64b927ec-1d37-421e-be21-93e08af2e5a8	stakeholder@example.com	$2a$10$xoD0hRUkZeviz7OoGxX33O/SAnFNuFn2S0h4vu6tup3XcedWJm0CW	Test Stakeholder	stakeholder	explorer	0	\N	2025-12-04 11:14:44.357971	2026-01-16 12:16:38.114602	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N
53772231-8597-43ae-8e77-d36b6f23ab2c	admin@example.com	$2a$10$xoD0hRUkZeviz7OoGxX33O/SAnFNuFn2S0h4vu6tup3XcedWJm0CW	Admin User	administrator	explorer	0	\N	2025-12-04 11:14:44.357971	2026-01-16 12:16:38.114602	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N
\.


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.schema_migrations_id_seq', 21, true);


--
-- Name: contest_participants contest_participants_contest_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_participants
    ADD CONSTRAINT contest_participants_contest_id_user_id_key UNIQUE (contest_id, user_id);


--
-- Name: contest_participants contest_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_participants
    ADD CONSTRAINT contest_participants_pkey PRIMARY KEY (id);


--
-- Name: contest_qr_codes contest_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_qr_codes
    ADD CONSTRAINT contest_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: contest_qr_codes contest_qr_codes_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_qr_codes
    ADD CONSTRAINT contest_qr_codes_qr_token_key UNIQUE (qr_token);


--
-- Name: contests contests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_pkey PRIMARY KEY (id);


--
-- Name: daily_forest_visits daily_forest_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_forest_visits
    ADD CONSTRAINT daily_forest_visits_pkey PRIMARY KEY (id);


--
-- Name: daily_forest_visits daily_forest_visits_user_id_visit_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_forest_visits
    ADD CONSTRAINT daily_forest_visits_user_id_visit_date_key UNIQUE (user_id, visit_date);


--
-- Name: forest_trees forest_trees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_trees
    ADD CONSTRAINT forest_trees_pkey PRIMARY KEY (id);


--
-- Name: locations locations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_name_key UNIQUE (name);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: points_bonus_qr_tokens points_bonus_qr_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_bonus_qr_tokens
    ADD CONSTRAINT points_bonus_qr_tokens_pkey PRIMARY KEY (id);


--
-- Name: points_bonus_qr_tokens points_bonus_qr_tokens_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_bonus_qr_tokens
    ADD CONSTRAINT points_bonus_qr_tokens_qr_token_key UNIQUE (qr_token);


--
-- Name: reward_parameters reward_parameters_parameter_type_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_parameters
    ADD CONSTRAINT reward_parameters_parameter_type_value_key UNIQUE (parameter_type, value);


--
-- Name: reward_parameters reward_parameters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_parameters
    ADD CONSTRAINT reward_parameters_pkey PRIMARY KEY (id);


--
-- Name: reward_redemptions reward_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_pkey PRIMARY KEY (id);


--
-- Name: reward_redemptions reward_redemptions_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_qr_token_key UNIQUE (qr_token);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_migration_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_migration_name_key UNIQUE (migration_name);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: statistics statistics_metric_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statistics
    ADD CONSTRAINT statistics_metric_name_key UNIQUE (metric_name);


--
-- Name: statistics statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statistics
    ADD CONSTRAINT statistics_pkey PRIMARY KEY (id);


--
-- Name: system_config system_config_config_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_config_key_key UNIQUE (config_key);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (id);


--
-- Name: task_parameters task_parameters_parameter_type_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_parameters
    ADD CONSTRAINT task_parameters_parameter_type_value_key UNIQUE (parameter_type, value);


--
-- Name: task_parameters task_parameters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_parameters
    ADD CONSTRAINT task_parameters_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- Name: team_qr_codes team_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_qr_codes
    ADD CONSTRAINT team_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: team_qr_codes team_qr_codes_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_qr_codes
    ADD CONSTRAINT team_qr_codes_qr_token_key UNIQUE (qr_token);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: user_consent user_consent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT user_consent_pkey PRIMARY KEY (user_id);


--
-- Name: user_qr_codes user_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_qr_codes
    ADD CONSTRAINT user_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: user_qr_codes user_qr_codes_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_qr_codes
    ADD CONSTRAINT user_qr_codes_qr_token_key UNIQUE (qr_token);


--
-- Name: user_qr_codes user_qr_codes_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_qr_codes
    ADD CONSTRAINT user_qr_codes_user_id_key UNIQUE (user_id);


--
-- Name: user_tasks user_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tasks
    ADD CONSTRAINT user_tasks_pkey PRIMARY KEY (id);


--
-- Name: user_tasks user_tasks_user_id_task_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tasks
    ADD CONSTRAINT user_tasks_user_id_task_id_key UNIQUE (user_id, task_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_sihot_guest_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_sihot_guest_id_key UNIQUE (sihot_guest_id);


--
-- Name: idx_contest_participants_contest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contest_participants_contest_id ON public.contest_participants USING btree (contest_id);


--
-- Name: idx_contest_participants_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contest_participants_user_id ON public.contest_participants USING btree (user_id);


--
-- Name: idx_contest_qr_codes_contest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contest_qr_codes_contest_id ON public.contest_qr_codes USING btree (contest_id);


--
-- Name: idx_contest_qr_codes_qr_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contest_qr_codes_qr_token ON public.contest_qr_codes USING btree (qr_token);


--
-- Name: idx_contests_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contests_active ON public.contests USING btree (active);


--
-- Name: idx_contests_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contests_created_by ON public.contests USING btree (created_by);


--
-- Name: idx_contests_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contests_end_date ON public.contests USING btree (end_date);


--
-- Name: idx_contests_rewards_awarded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contests_rewards_awarded ON public.contests USING btree (rewards_awarded);


--
-- Name: idx_daily_forest_visits_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_forest_visits_user_date ON public.daily_forest_visits USING btree (user_id, visit_date);


--
-- Name: idx_forest_trees_growth_points; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_trees_growth_points ON public.forest_trees USING btree (growth_points);


--
-- Name: idx_forest_trees_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_trees_stage ON public.forest_trees USING btree (stage);


--
-- Name: idx_forest_trees_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_trees_user_id ON public.forest_trees USING btree (user_id);


--
-- Name: idx_locations_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_active ON public.locations USING btree (active);


--
-- Name: idx_points_bonus_qr_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_points_bonus_qr_tokens_expires_at ON public.points_bonus_qr_tokens USING btree (expires_at);


--
-- Name: idx_points_bonus_qr_tokens_generated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_points_bonus_qr_tokens_generated_by ON public.points_bonus_qr_tokens USING btree (generated_by);


--
-- Name: idx_points_bonus_qr_tokens_qr_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_points_bonus_qr_tokens_qr_token ON public.points_bonus_qr_tokens USING btree (qr_token);


--
-- Name: idx_points_bonus_qr_tokens_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_points_bonus_qr_tokens_status ON public.points_bonus_qr_tokens USING btree (status);


--
-- Name: idx_reward_parameters_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reward_parameters_active ON public.reward_parameters USING btree (active) WHERE (active = true);


--
-- Name: idx_reward_parameters_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reward_parameters_type ON public.reward_parameters USING btree (parameter_type);


--
-- Name: idx_reward_parameters_weight; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reward_parameters_weight ON public.reward_parameters USING btree (parameter_type, weight) WHERE ((parameter_type)::text = 'kosten'::text);


--
-- Name: idx_reward_redemptions_qr_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reward_redemptions_qr_token ON public.reward_redemptions USING btree (qr_token);


--
-- Name: idx_reward_redemptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reward_redemptions_user_id ON public.reward_redemptions USING btree (user_id);


--
-- Name: idx_rewards_event_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_event_group ON public.rewards USING btree (event_group) WHERE (event_group IS NOT NULL);


--
-- Name: idx_rewards_kategorie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_kategorie ON public.rewards USING btree (kategorie) WHERE (kategorie IS NOT NULL);


--
-- Name: idx_rewards_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_location_id ON public.rewards USING btree (location_id);


--
-- Name: idx_rewards_moegliche_punkte; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_moegliche_punkte ON public.rewards USING btree (moegliche_punkte) WHERE (moegliche_punkte IS NOT NULL);


--
-- Name: idx_rewards_recurrence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_recurrence ON public.rewards USING btree (recurrence) WHERE (recurrence <> 'once'::public.reward_recurrence_enum);


--
-- Name: idx_rewards_reward_art; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_reward_art ON public.rewards USING btree (reward_art) WHERE (reward_art IS NOT NULL);


--
-- Name: idx_rewards_zielgruppe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_zielgruppe ON public.rewards USING gin (zielgruppe) WHERE (zielgruppe IS NOT NULL);


--
-- Name: idx_system_config_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_config_key ON public.system_config USING btree (config_key);


--
-- Name: idx_task_parameters_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_parameters_active ON public.task_parameters USING btree (active) WHERE (active = true);


--
-- Name: idx_task_parameters_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_parameters_type ON public.task_parameters USING btree (parameter_type);


--
-- Name: idx_task_parameters_weight; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_parameters_weight ON public.task_parameters USING btree (parameter_type, weight) WHERE ((parameter_type)::text = ANY (ARRAY[('difficulty'::character varying)::text, ('time_required'::character varying)::text]));


--
-- Name: idx_tasks_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_active ON public.tasks USING btree (active);


--
-- Name: idx_tasks_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_category ON public.tasks USING btree (category) WHERE (category IS NOT NULL);


--
-- Name: idx_tasks_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_difficulty ON public.tasks USING btree (difficulty) WHERE (difficulty IS NOT NULL);


--
-- Name: idx_tasks_event_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_event_group ON public.tasks USING btree (event_group) WHERE (event_group IS NOT NULL);


--
-- Name: idx_tasks_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_location_id ON public.tasks USING btree (location_id);


--
-- Name: idx_tasks_location_tool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_location_tool ON public.tasks USING btree (location_tool) WHERE (location_tool IS NOT NULL);


--
-- Name: idx_tasks_prerequisite_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_prerequisite_task_id ON public.tasks USING btree (prerequisite_task_id) WHERE (prerequisite_task_id IS NOT NULL);


--
-- Name: idx_tasks_recurrence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_recurrence ON public.tasks USING btree (recurrence) WHERE (recurrence <> 'once'::public.task_recurrence_enum);


--
-- Name: idx_tasks_target_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_target_location ON public.tasks USING btree (target_latitude, target_longitude) WHERE ((target_latitude IS NOT NULL) AND (target_longitude IS NOT NULL));


--
-- Name: idx_tasks_time_required; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_time_required ON public.tasks USING btree (time_required) WHERE (time_required IS NOT NULL);


--
-- Name: idx_tasks_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_type ON public.tasks USING btree (type);


--
-- Name: idx_tasks_zielgruppe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_zielgruppe ON public.tasks USING gin (zielgruppe) WHERE (zielgruppe IS NOT NULL);


--
-- Name: idx_team_members_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_team_id ON public.team_members USING btree (team_id);


--
-- Name: idx_team_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);


--
-- Name: idx_team_qr_codes_qr_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_qr_codes_qr_token ON public.team_qr_codes USING btree (qr_token);


--
-- Name: idx_team_qr_codes_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_qr_codes_team_id ON public.team_qr_codes USING btree (team_id);


--
-- Name: idx_teams_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_created_by ON public.teams USING btree (created_by);


--
-- Name: idx_user_consent_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consent_user_id ON public.user_consent USING btree (user_id);


--
-- Name: idx_user_qr_codes_qr_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_qr_codes_qr_token ON public.user_qr_codes USING btree (qr_token);


--
-- Name: idx_user_qr_codes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_qr_codes_user_id ON public.user_qr_codes USING btree (user_id);


--
-- Name: idx_user_tasks_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tasks_task_id ON public.user_tasks USING btree (task_id);


--
-- Name: idx_user_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tasks_user_id ON public.user_tasks USING btree (user_id);


--
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_active ON public.users USING btree (active) WHERE (active = true);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_email_verification_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email_verification_token ON public.users USING btree (email_verification_token) WHERE (email_verification_token IS NOT NULL);


--
-- Name: idx_users_login_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_login_code ON public.users USING btree (login_code) WHERE (login_code IS NOT NULL);


--
-- Name: idx_users_oauth; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_oauth ON public.users USING btree (oauth_provider, oauth_id) WHERE ((oauth_provider IS NOT NULL) AND (oauth_id IS NOT NULL));


--
-- Name: idx_users_oauth_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_oauth_email ON public.users USING btree (oauth_email);


--
-- Name: idx_users_password_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_password_reset_token ON public.users USING btree (password_reset_token) WHERE (password_reset_token IS NOT NULL);


--
-- Name: idx_users_sihot_guest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_sihot_guest_id ON public.users USING btree (sihot_guest_id);


--
-- Name: contest_participants contest_participants_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_participants
    ADD CONSTRAINT contest_participants_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON DELETE CASCADE;


--
-- Name: contest_participants contest_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_participants
    ADD CONSTRAINT contest_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contest_qr_codes contest_qr_codes_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_qr_codes
    ADD CONSTRAINT contest_qr_codes_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON DELETE CASCADE;


--
-- Name: contests contests_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: daily_forest_visits daily_forest_visits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_forest_visits
    ADD CONSTRAINT daily_forest_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rewards fk_rewards_location; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT fk_rewards_location FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;


--
-- Name: tasks fk_tasks_location; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_location FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;


--
-- Name: tasks fk_tasks_prerequisite_task_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_prerequisite_task_id FOREIGN KEY (prerequisite_task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;


--
-- Name: forest_trees forest_trees_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_trees
    ADD CONSTRAINT forest_trees_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: forest_trees forest_trees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_trees
    ADD CONSTRAINT forest_trees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: points_bonus_qr_tokens points_bonus_qr_tokens_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_bonus_qr_tokens
    ADD CONSTRAINT points_bonus_qr_tokens_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id);


--
-- Name: points_bonus_qr_tokens points_bonus_qr_tokens_redeemed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_bonus_qr_tokens
    ADD CONSTRAINT points_bonus_qr_tokens_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES public.users(id);


--
-- Name: reward_redemptions reward_redemptions_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE;


--
-- Name: reward_redemptions reward_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: team_qr_codes team_qr_codes_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_qr_codes
    ADD CONSTRAINT team_qr_codes_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: teams teams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_consent user_consent_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT user_consent_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_qr_codes user_qr_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_qr_codes
    ADD CONSTRAINT user_qr_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_tasks user_tasks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tasks
    ADD CONSTRAINT user_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: user_tasks user_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tasks
    ADD CONSTRAINT user_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict gkG1dOqGTwtHTAOq0dgAiLcfFphNn9zrFuUo3fgQbd5d5netmq03uZszf3ls1Yd

