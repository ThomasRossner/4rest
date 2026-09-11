--
-- PostgreSQL database dump
--

\restrict RHRT7ixyldHIn9w1QHh3vWgZD0jnNT2aYZocOprO2wS4gCIZbdoygyhzgMBT0GV

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

ALTER TABLE IF EXISTS ONLY public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_verified_by_fkey;
ALTER TABLE IF EXISTS ONLY public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_qr_codes DROP CONSTRAINT IF EXISTS user_qr_codes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_consent DROP CONSTRAINT IF EXISTS user_consent_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.team_registration_qr_codes DROP CONSTRAINT IF EXISTS team_registration_qr_codes_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.team_qr_codes DROP CONSTRAINT IF EXISTS team_qr_codes_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rewards DROP CONSTRAINT IF EXISTS rewards_generated_from_reward_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_reward_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_question_locks DROP CONSTRAINT IF EXISTS quiz_question_locks_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_question_locks DROP CONSTRAINT IF EXISTS quiz_question_locks_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.points_bonus_qr_tokens DROP CONSTRAINT IF EXISTS points_bonus_qr_tokens_redeemed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.points_bonus_qr_tokens DROP CONSTRAINT IF EXISTS points_bonus_qr_tokens_generated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.guest_task_completions DROP CONSTRAINT IF EXISTS guest_task_completions_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.guest_task_completions DROP CONSTRAINT IF EXISTS guest_task_completions_merged_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gallery_images DROP CONSTRAINT IF EXISTS gallery_images_user_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gallery_images DROP CONSTRAINT IF EXISTS gallery_images_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gallery_images DROP CONSTRAINT IF EXISTS gallery_images_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gallery_images DROP CONSTRAINT IF EXISTS gallery_images_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.forest_trees DROP CONSTRAINT IF EXISTS forest_trees_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.forest_trees DROP CONSTRAINT IF EXISTS forest_trees_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS fk_tasks_prerequisite_task_id;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS fk_tasks_location;
ALTER TABLE IF EXISTS ONLY public.rewards DROP CONSTRAINT IF EXISTS fk_rewards_location;
ALTER TABLE IF EXISTS ONLY public.daily_login_points DROP CONSTRAINT IF EXISTS daily_login_points_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.daily_forest_visits DROP CONSTRAINT IF EXISTS daily_forest_visits_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contests DROP CONSTRAINT IF EXISTS contests_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.contest_registration_qr_codes DROP CONSTRAINT IF EXISTS contest_registration_qr_codes_contest_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contest_qr_codes DROP CONSTRAINT IF EXISTS contest_qr_codes_contest_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contest_participants DROP CONSTRAINT IF EXISTS contest_participants_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contest_participants DROP CONSTRAINT IF EXISTS contest_participants_contest_id_fkey;
DROP TRIGGER IF EXISTS trigger_deactivate_tasks_on_team_delete ON public.teams;
DROP TRIGGER IF EXISTS trigger_deactivate_tasks_on_contest_end ON public.contests;
DROP TRIGGER IF EXISTS trigger_deactivate_tasks_on_contest_delete ON public.contests;
DROP TRIGGER IF EXISTS trigger_deactivate_rewards_on_team_delete ON public.teams;
DROP TRIGGER IF EXISTS trigger_deactivate_rewards_on_contest_end ON public.contests;
DROP TRIGGER IF EXISTS trigger_deactivate_rewards_on_contest_delete ON public.contests;
DROP INDEX IF EXISTS public.idx_users_sihot_guest_id;
DROP INDEX IF EXISTS public.idx_users_password_reset_token;
DROP INDEX IF EXISTS public.idx_users_oauth_email;
DROP INDEX IF EXISTS public.idx_users_oauth;
DROP INDEX IF EXISTS public.idx_users_login_code;
DROP INDEX IF EXISTS public.idx_users_email_verification_token;
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_deleted_at;
DROP INDEX IF EXISTS public.idx_users_active;
DROP INDEX IF EXISTS public.idx_user_tasks_verification_status;
DROP INDEX IF EXISTS public.idx_user_tasks_user_id;
DROP INDEX IF EXISTS public.idx_user_tasks_task_id;
DROP INDEX IF EXISTS public.idx_user_tasks_photo_url;
DROP INDEX IF EXISTS public.idx_user_qr_codes_user_id;
DROP INDEX IF EXISTS public.idx_user_qr_codes_qr_token;
DROP INDEX IF EXISTS public.idx_user_consent_user_id;
DROP INDEX IF EXISTS public.idx_teams_created_by;
DROP INDEX IF EXISTS public.idx_team_registration_qr_codes_team_id;
DROP INDEX IF EXISTS public.idx_team_registration_qr_codes_qr_token;
DROP INDEX IF EXISTS public.idx_team_registration_qr_codes_enabled;
DROP INDEX IF EXISTS public.idx_team_qr_codes_team_id;
DROP INDEX IF EXISTS public.idx_team_qr_codes_qr_token;
DROP INDEX IF EXISTS public.idx_team_members_user_id;
DROP INDEX IF EXISTS public.idx_team_members_team_id;
DROP INDEX IF EXISTS public.idx_tasks_zielgruppe;
DROP INDEX IF EXISTS public.idx_tasks_type;
DROP INDEX IF EXISTS public.idx_tasks_time_required;
DROP INDEX IF EXISTS public.idx_tasks_target_location;
DROP INDEX IF EXISTS public.idx_tasks_recurrence;
DROP INDEX IF EXISTS public.idx_tasks_qr_code_unique;
DROP INDEX IF EXISTS public.idx_tasks_prerequisite_task_id;
DROP INDEX IF EXISTS public.idx_tasks_location_tool;
DROP INDEX IF EXISTS public.idx_tasks_location_id;
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
DROP INDEX IF EXISTS public.idx_rewards_generated_from_reward_id;
DROP INDEX IF EXISTS public.idx_reward_redemptions_user_id;
DROP INDEX IF EXISTS public.idx_reward_redemptions_qr_token;
DROP INDEX IF EXISTS public.idx_reward_parameters_weight;
DROP INDEX IF EXISTS public.idx_reward_parameters_type;
DROP INDEX IF EXISTS public.idx_reward_parameters_active;
DROP INDEX IF EXISTS public.idx_quiz_question_locks_locked_until;
DROP INDEX IF EXISTS public.idx_points_bonus_qr_tokens_status;
DROP INDEX IF EXISTS public.idx_points_bonus_qr_tokens_qr_token;
DROP INDEX IF EXISTS public.idx_points_bonus_qr_tokens_generated_by;
DROP INDEX IF EXISTS public.idx_points_bonus_qr_tokens_expires_at;
DROP INDEX IF EXISTS public.idx_messages_user_read;
DROP INDEX IF EXISTS public.idx_messages_user_id;
DROP INDEX IF EXISTS public.idx_messages_type;
DROP INDEX IF EXISTS public.idx_messages_read;
DROP INDEX IF EXISTS public.idx_messages_created_at;
DROP INDEX IF EXISTS public.idx_locations_active;
DROP INDEX IF EXISTS public.idx_guest_task_completions_session;
DROP INDEX IF EXISTS public.idx_guest_task_completions_merged;
DROP INDEX IF EXISTS public.idx_gallery_images_user_task_id;
DROP INDEX IF EXISTS public.idx_gallery_images_user_id;
DROP INDEX IF EXISTS public.idx_gallery_images_task_id;
DROP INDEX IF EXISTS public.idx_forest_trees_user_id;
DROP INDEX IF EXISTS public.idx_forest_trees_stage;
DROP INDEX IF EXISTS public.idx_forest_trees_growth_points;
DROP INDEX IF EXISTS public.idx_email_suppressions_expires_at;
DROP INDEX IF EXISTS public.idx_email_delivery_log_type_status;
DROP INDEX IF EXISTS public.idx_email_delivery_log_email_created;
DROP INDEX IF EXISTS public.idx_daily_login_points_user_date;
DROP INDEX IF EXISTS public.idx_daily_forest_visits_user_date;
DROP INDEX IF EXISTS public.idx_contests_rewards_awarded;
DROP INDEX IF EXISTS public.idx_contests_end_date;
DROP INDEX IF EXISTS public.idx_contests_created_by;
DROP INDEX IF EXISTS public.idx_contests_active;
DROP INDEX IF EXISTS public.idx_contest_registration_qr_codes_qr_token;
DROP INDEX IF EXISTS public.idx_contest_registration_qr_codes_enabled;
DROP INDEX IF EXISTS public.idx_contest_registration_qr_codes_contest_id;
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
ALTER TABLE IF EXISTS ONLY public.team_registration_qr_codes DROP CONSTRAINT IF EXISTS team_registration_qr_codes_team_id_key;
ALTER TABLE IF EXISTS ONLY public.team_registration_qr_codes DROP CONSTRAINT IF EXISTS team_registration_qr_codes_qr_token_key;
ALTER TABLE IF EXISTS ONLY public.team_registration_qr_codes DROP CONSTRAINT IF EXISTS team_registration_qr_codes_pkey;
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
ALTER TABLE IF EXISTS ONLY public.quiz_question_locks DROP CONSTRAINT IF EXISTS quiz_question_locks_pkey;
ALTER TABLE IF EXISTS ONLY public.points_bonus_qr_tokens DROP CONSTRAINT IF EXISTS points_bonus_qr_tokens_qr_token_key;
ALTER TABLE IF EXISTS ONLY public.points_bonus_qr_tokens DROP CONSTRAINT IF EXISTS points_bonus_qr_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.locations DROP CONSTRAINT IF EXISTS locations_pkey;
ALTER TABLE IF EXISTS ONLY public.locations DROP CONSTRAINT IF EXISTS locations_name_key;
ALTER TABLE IF EXISTS ONLY public.guest_task_completions DROP CONSTRAINT IF EXISTS guest_task_completions_unique_session_task;
ALTER TABLE IF EXISTS ONLY public.guest_task_completions DROP CONSTRAINT IF EXISTS guest_task_completions_pkey;
ALTER TABLE IF EXISTS ONLY public.gallery_images DROP CONSTRAINT IF EXISTS gallery_images_pkey;
ALTER TABLE IF EXISTS ONLY public.forest_trees DROP CONSTRAINT IF EXISTS forest_trees_pkey;
ALTER TABLE IF EXISTS ONLY public.email_suppressions DROP CONSTRAINT IF EXISTS email_suppressions_pkey;
ALTER TABLE IF EXISTS ONLY public.email_delivery_log DROP CONSTRAINT IF EXISTS email_delivery_log_pkey;
ALTER TABLE IF EXISTS ONLY public.daily_login_points DROP CONSTRAINT IF EXISTS daily_login_points_user_id_login_date_key;
ALTER TABLE IF EXISTS ONLY public.daily_login_points DROP CONSTRAINT IF EXISTS daily_login_points_pkey;
ALTER TABLE IF EXISTS ONLY public.daily_forest_visits DROP CONSTRAINT IF EXISTS daily_forest_visits_user_id_visit_date_key;
ALTER TABLE IF EXISTS ONLY public.daily_forest_visits DROP CONSTRAINT IF EXISTS daily_forest_visits_pkey;
ALTER TABLE IF EXISTS ONLY public.contests DROP CONSTRAINT IF EXISTS contests_pkey;
ALTER TABLE IF EXISTS ONLY public.contest_registration_qr_codes DROP CONSTRAINT IF EXISTS contest_registration_qr_codes_qr_token_key;
ALTER TABLE IF EXISTS ONLY public.contest_registration_qr_codes DROP CONSTRAINT IF EXISTS contest_registration_qr_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.contest_registration_qr_codes DROP CONSTRAINT IF EXISTS contest_registration_qr_codes_contest_id_key;
ALTER TABLE IF EXISTS ONLY public.contest_qr_codes DROP CONSTRAINT IF EXISTS contest_qr_codes_qr_token_key;
ALTER TABLE IF EXISTS ONLY public.contest_qr_codes DROP CONSTRAINT IF EXISTS contest_qr_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.contest_participants DROP CONSTRAINT IF EXISTS contest_participants_pkey;
ALTER TABLE IF EXISTS ONLY public.contest_participants DROP CONSTRAINT IF EXISTS contest_participants_contest_id_user_id_key;
ALTER TABLE IF EXISTS public.schema_migrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.email_delivery_log ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_tasks;
DROP TABLE IF EXISTS public.user_qr_codes;
DROP TABLE IF EXISTS public.user_consent;
DROP TABLE IF EXISTS public.teams;
DROP TABLE IF EXISTS public.team_registration_qr_codes;
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
DROP TABLE IF EXISTS public.quiz_question_locks;
DROP TABLE IF EXISTS public.points_bonus_qr_tokens;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.locations;
DROP TABLE IF EXISTS public.guest_task_completions;
DROP TABLE IF EXISTS public.gallery_images;
DROP TABLE IF EXISTS public.forest_trees;
DROP TABLE IF EXISTS public.email_suppressions;
DROP SEQUENCE IF EXISTS public.email_delivery_log_id_seq;
DROP TABLE IF EXISTS public.email_delivery_log;
DROP TABLE IF EXISTS public.daily_login_points;
DROP TABLE IF EXISTS public.daily_forest_visits;
DROP TABLE IF EXISTS public.contests;
DROP TABLE IF EXISTS public.contest_registration_qr_codes;
DROP TABLE IF EXISTS public.contest_qr_codes;
DROP TABLE IF EXISTS public.contest_participants;
DROP FUNCTION IF EXISTS public.deactivate_tasks_for_ended_contest();
DROP FUNCTION IF EXISTS public.deactivate_tasks_for_deleted_team();
DROP FUNCTION IF EXISTS public.deactivate_tasks_for_deleted_contest();
DROP FUNCTION IF EXISTS public.deactivate_rewards_for_ended_contest();
DROP FUNCTION IF EXISTS public.deactivate_rewards_for_deleted_team();
DROP FUNCTION IF EXISTS public.deactivate_rewards_for_deleted_contest();
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
    'Stakeholder',
    'Front Office'
);


--
-- Name: TYPE reward_zielgruppe_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.reward_zielgruppe_enum IS 'Zielgruppe der Belohnung: Front Office, Gäste';


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
    'Stakeholder',
    'Front Office'
);


--
-- Name: TYPE task_zielgruppe_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.task_zielgruppe_enum IS 'Zielgruppe der Aufgabe: Front Office, Gäste';


--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_enum AS ENUM (
    'guest',
    'rezeption',
    'redaktion',
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


--
-- Name: deactivate_rewards_for_deleted_contest(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deactivate_rewards_for_deleted_contest() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    -- Deactivate rewards that only had this contest assigned
    UPDATE rewards
    SET active = FALSE
    WHERE OLD.id = ANY(allowed_contests)
      AND (
        array_length(allowed_contests, 1) = 1
        OR
        (allowed_teams IS NULL OR array_length(allowed_teams, 1) IS NULL OR array_length(allowed_teams, 1) = 0)
      );
    
    -- Remove the deleted contest from allowed_contests arrays
    UPDATE rewards
    SET allowed_contests = array_remove(allowed_contests, OLD.id)
    WHERE OLD.id = ANY(allowed_contests);
    
    RETURN OLD;
  END;
  $$;


--
-- Name: deactivate_rewards_for_deleted_team(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deactivate_rewards_for_deleted_team() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    -- Deactivate rewards that only had this team assigned
    UPDATE rewards
    SET active = FALSE
    WHERE OLD.id = ANY(allowed_teams)
      AND (
        array_length(allowed_teams, 1) = 1
        OR
        (allowed_contests IS NULL OR array_length(allowed_contests, 1) IS NULL OR array_length(allowed_contests, 1) = 0)
      );
    
    -- Remove the deleted team from allowed_teams arrays
    UPDATE rewards
    SET allowed_teams = array_remove(allowed_teams, OLD.id)
    WHERE OLD.id = ANY(allowed_teams);
    
    RETURN OLD;
  END;
  $$;


--
-- Name: deactivate_rewards_for_ended_contest(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deactivate_rewards_for_ended_contest() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    -- If contest end_date is set and in the past, deactivate related rewards
    IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
      UPDATE rewards
      SET active = FALSE
      WHERE NEW.id = ANY(allowed_contests)
        AND (
          array_length(allowed_contests, 1) = 1
          OR
          (allowed_teams IS NULL OR array_length(allowed_teams, 1) IS NULL OR array_length(allowed_teams, 1) = 0)
        );
    END IF;
    
    RETURN NEW;
  END;
  $$;


--
-- Name: deactivate_tasks_for_deleted_contest(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deactivate_tasks_for_deleted_contest() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    -- Deactivate tasks that only had this contest assigned
    UPDATE tasks
    SET active = FALSE
    WHERE OLD.id = ANY(allowed_contests)
      AND (
        array_length(allowed_contests, 1) = 1
        OR
        (allowed_teams IS NULL OR array_length(allowed_teams, 1) IS NULL OR array_length(allowed_teams, 1) = 0)
      );
    
    -- Remove the deleted contest from allowed_contests arrays
    UPDATE tasks
    SET allowed_contests = array_remove(allowed_contests, OLD.id)
    WHERE OLD.id = ANY(allowed_contests);
    
    RETURN OLD;
  END;
  $$;


--
-- Name: deactivate_tasks_for_deleted_team(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deactivate_tasks_for_deleted_team() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    -- Deactivate tasks that only had this team assigned
    UPDATE tasks
    SET active = FALSE
    WHERE OLD.id = ANY(allowed_teams)
      AND (
        -- Only this team was assigned
        array_length(allowed_teams, 1) = 1
        OR
        -- No contests assigned either
        (allowed_contests IS NULL OR array_length(allowed_contests, 1) IS NULL OR array_length(allowed_contests, 1) = 0)
      );
    
    -- Remove the deleted team from allowed_teams arrays
    UPDATE tasks
    SET allowed_teams = array_remove(allowed_teams, OLD.id)
    WHERE OLD.id = ANY(allowed_teams);
    
    RETURN OLD;
  END;
  $$;


--
-- Name: deactivate_tasks_for_ended_contest(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deactivate_tasks_for_ended_contest() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    -- If contest end_date is set and in the past, deactivate related tasks
    IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
      UPDATE tasks
      SET active = FALSE
      WHERE NEW.id = ANY(allowed_contests)
        AND (
          array_length(allowed_contests, 1) = 1
          OR
          (allowed_teams IS NULL OR array_length(allowed_teams, 1) IS NULL OR array_length(allowed_teams, 1) = 0)
        );
    END IF;
    
    RETURN NEW;
  END;
  $$;


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
-- Name: contest_registration_qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contest_registration_qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contest_id uuid NOT NULL,
    qr_token character varying(255) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE contest_registration_qr_codes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contest_registration_qr_codes IS 'QR codes for new user registration that automatically assigns users to contests';


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
    rewards_awarded boolean DEFAULT false NOT NULL,
    name_i18n jsonb DEFAULT '{}'::jsonb
);


--
-- Name: COLUMN contests.name_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contests.name_i18n IS 'Contest name per language: { "de": "...", "en": "..." }';


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
-- Name: daily_login_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_login_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    login_date date DEFAULT CURRENT_DATE NOT NULL,
    points_awarded integer DEFAULT 2 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: email_delivery_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_delivery_log (
    id bigint NOT NULL,
    recipient_email character varying(320) NOT NULL,
    message_type character varying(80) NOT NULL,
    template_key character varying(120),
    subject text,
    provider character varying(50) DEFAULT 'smtp'::character varying,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    attempt_count integer DEFAULT 1 NOT NULL,
    smtp_response text,
    error_code character varying(120),
    error_message text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_attempt_at timestamp without time zone
);


--
-- Name: email_delivery_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_delivery_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_delivery_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_delivery_log_id_seq OWNED BY public.email_delivery_log.id;


--
-- Name: email_suppressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_suppressions (
    recipient_email character varying(320) NOT NULL,
    reason character varying(80) NOT NULL,
    source character varying(80) DEFAULT 'manual'::character varying NOT NULL,
    expires_at timestamp without time zone,
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: gallery_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    task_id uuid NOT NULL,
    photo_url text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_by uuid
);


--
-- Name: guest_task_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_task_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guest_session_id uuid NOT NULL,
    task_id uuid NOT NULL,
    completion_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    merged_user_id uuid,
    merged_at timestamp with time zone
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
    name_i18n jsonb DEFAULT '{}'::jsonb,
    description_i18n jsonb DEFAULT '{}'::jsonb,
    address_i18n jsonb DEFAULT '{}'::jsonb,
    category_description_i18n jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT locations_check CHECK ((((is_online = true) AND (address IS NULL) AND (latitude IS NULL) AND (longitude IS NULL)) OR ((is_online = false) AND (address IS NOT NULL) AND (latitude IS NOT NULL) AND (longitude IS NOT NULL))))
);


--
-- Name: COLUMN locations.name_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.name_i18n IS 'Name per language: { "de": "...", "en": "..." }';


--
-- Name: COLUMN locations.description_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.description_i18n IS 'Description per language (legacy column remains).';


--
-- Name: COLUMN locations.address_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.address_i18n IS 'Address per language: { "de": "...", "en": "..." }';


--
-- Name: COLUMN locations.category_description_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.category_description_i18n IS 'Category description per language: { "de": "...", "en": "..." }';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    metadata jsonb,
    read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone
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
    forest_category character varying(32),
    CONSTRAINT points_bonus_qr_tokens_points_amount_check CHECK ((points_amount > 0)),
    CONSTRAINT points_bonus_qr_tokens_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('redeemed'::character varying)::text, ('expired'::character varying)::text])))
);


--
-- Name: quiz_question_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_question_locks (
    user_id uuid NOT NULL,
    task_id uuid NOT NULL,
    question_index integer NOT NULL,
    locked_until timestamp with time zone NOT NULL,
    CONSTRAINT quiz_question_locks_question_index_check CHECK ((question_index >= 0))
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
    metadata jsonb,
    verified_at timestamp with time zone
);


--
-- Name: COLUMN reward_redemptions.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reward_redemptions.metadata IS 'Metadata for redemption (e.g., useTeamPoints, teamId)';


--
-- Name: COLUMN reward_redemptions.verified_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reward_redemptions.verified_at IS 'Wann die Belohnung an der Rezeption als eingelöst verbucht wurde; steuert die Sperrfrist (Recurrence) pro Nutzer.';


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
    allowed_teams uuid[] DEFAULT ARRAY[]::uuid[],
    allowed_contests uuid[] DEFAULT ARRAY[]::uuid[],
    thumbnail_url text,
    moegliche_punkte integer,
    zielgruppe public.reward_zielgruppe_enum[],
    title_i18n jsonb DEFAULT '{}'::jsonb,
    description_i18n jsonb DEFAULT '{}'::jsonb,
    generated_from_reward_id uuid
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
-- Name: COLUMN rewards.moegliche_punkte; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.moegliche_punkte IS 'Punkte, die dem Benutzer beim Einlösen der Belohnung gutgeschrieben werden.';


--
-- Name: COLUMN rewards.zielgruppe; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.zielgruppe IS 'Zielgruppe der Belohnung als Array: Mitarbeitende, Gäste, Stakeholder. NULL oder leeres Array bedeutet für alle zugänglich.';


--
-- Name: COLUMN rewards.title_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.title_i18n IS 'Title per language: { "de": "...", "en": "..." }';


--
-- Name: COLUMN rewards.description_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.description_i18n IS 'Description per language: { "de": "...", "en": "..." }';


--
-- Name: COLUMN rewards.generated_from_reward_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rewards.generated_from_reward_id IS 'If set, this reward was auto-generated from a recurring template reward (rewards.id).';


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
    target_latitude numeric(10,8),
    target_longitude numeric(11,8),
    article_url text,
    article_content text,
    survey_questions jsonb,
    survey_type character varying(50),
    prerequisite_task_id uuid,
    prerequisite_task_count integer,
    prerequisite_task_ids uuid[],
    allowed_teams uuid[] DEFAULT ARRAY[]::uuid[],
    allowed_contests uuid[] DEFAULT ARRAY[]::uuid[],
    thumbnail_url text,
    zielgruppe public.task_zielgruppe_enum[],
    title_i18n jsonb DEFAULT '{}'::jsonb,
    description_i18n jsonb DEFAULT '{}'::jsonb,
    article_content_i18n jsonb DEFAULT '{}'::jsonb,
    allow_public_completion boolean DEFAULT false NOT NULL,
    teaser text,
    teaser_i18n jsonb,
    video_subtitles_i18n jsonb
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
-- Name: COLUMN tasks.title_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.title_i18n IS 'Title per language: { "de": "...", "en": "..." }';


--
-- Name: COLUMN tasks.description_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.description_i18n IS 'Description per language: { "de": "...", "en": "..." }';


--
-- Name: COLUMN tasks.article_content_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.article_content_i18n IS 'Article content (article_quiz) per language: { "de": "...", "en": "..." }';


--
-- Name: COLUMN tasks.allow_public_completion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.allow_public_completion IS 'Wenn TRUE: Task über GET/POST /tasks/public/:id ohne JWT erreichbar (nur article_quiz/survey).';


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
-- Name: team_registration_qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_registration_qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    qr_token character varying(255) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE team_registration_qr_codes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.team_registration_qr_codes IS 'QR codes for new user registration that automatically assigns users to teams';


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
    active boolean DEFAULT true NOT NULL,
    name_i18n jsonb DEFAULT '{}'::jsonb
);


--
-- Name: COLUMN teams.name_i18n; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.teams.name_i18n IS 'Team name per language: { "de": "...", "en": "..." }';


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
    survey_responses jsonb,
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    rejection_reason text,
    verified_at timestamp without time zone,
    verified_by uuid,
    task_category character varying(32)
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
    role public.user_role_enum DEFAULT 'guest'::public.user_role_enum NOT NULL,
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
    preferred_language character varying(5) DEFAULT 'de'::character varying,
    forest_points_kommunikation integer DEFAULT 0 NOT NULL,
    forest_points_mensch integer DEFAULT 0 NOT NULL,
    forest_points_natur integer DEFAULT 0 NOT NULL,
    forest_points_ressourcen integer DEFAULT 0 NOT NULL,
    player_profile_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    dyad_scale_1 smallint,
    dyad_scale_2 smallint,
    dyad_scale_3 smallint,
    dyad_scale_4 smallint,
    dominant_dyad smallint,
    profile_display_name character varying(128),
    player_profile_completed_at timestamp with time zone,
    dyad_scale_values jsonb,
    player_profile_answers jsonb,
    CONSTRAINT check_auth_method CHECK (((password_hash IS NOT NULL) OR ((oauth_provider IS NOT NULL) AND (oauth_id IS NOT NULL)) OR ((email IS NOT NULL) AND (password_hash IS NULL) AND ((oauth_provider IS NULL) OR (oauth_id IS NULL))))),
    CONSTRAINT users_dominant_dyad_check CHECK (((dominant_dyad IS NULL) OR ((dominant_dyad >= 1) AND (dominant_dyad <= 64)))),
    CONSTRAINT users_dyad_scale_1_check CHECK (((dyad_scale_1 IS NULL) OR ((dyad_scale_1 >= 0) AND (dyad_scale_1 <= 4)))),
    CONSTRAINT users_dyad_scale_2_check CHECK (((dyad_scale_2 IS NULL) OR ((dyad_scale_2 >= 0) AND (dyad_scale_2 <= 4)))),
    CONSTRAINT users_dyad_scale_3_check CHECK (((dyad_scale_3 IS NULL) OR ((dyad_scale_3 >= 0) AND (dyad_scale_3 <= 4)))),
    CONSTRAINT users_dyad_scale_4_check CHECK (((dyad_scale_4 IS NULL) OR ((dyad_scale_4 >= 0) AND (dyad_scale_4 <= 4)))),
    CONSTRAINT users_player_profile_status_check CHECK (((player_profile_status)::text = ANY ((ARRAY['pending'::character varying, 'skipped'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: COLUMN users.preferred_language; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.preferred_language IS 'User UI language: de, en';


--
-- Name: COLUMN users.dyad_scale_values; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.dyad_scale_values IS 'Aggregierte Skalenwerte 0–4 pro Dyade (JSON array)';


--
-- Name: COLUMN users.player_profile_answers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.player_profile_answers IS 'Rohantworten 0–4 pro Frage in Reihenfolge (JSON array)';


--
-- Name: email_delivery_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_delivery_log ALTER COLUMN id SET DEFAULT nextval('public.email_delivery_log_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Data for Name: contest_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contest_participants (id, contest_id, user_id, points, joined_at) FROM stdin;
e1df604c-7840-4247-8980-41ce7a2c4f91	94e98eef-1136-4be5-89f1-95f79e865e3f	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-01-08 12:31:16.649077
853e5f76-0985-497f-9f04-bcd721a89c1d	5d88e1b6-c789-43f6-986f-2b4deb03854b	8af2afba-1be0-4951-b066-790a31718076	0	2026-01-08 12:46:35.38593
cf49d75e-99b3-4340-a976-9dd3fb9fadc1	37aae118-ff19-4657-ae12-ef4b7f05aa5c	0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	10	2026-01-20 15:37:55.663972
d51edac5-d0e6-487b-be82-9d62ceec06f9	37aae118-ff19-4657-ae12-ef4b7f05aa5c	040878d8-f0e3-48bc-919c-89c7814b8641	25	2026-01-20 15:40:08.120761
e01e08c4-0400-4a2d-aee1-3cd5d149c71c	37aae118-ff19-4657-ae12-ef4b7f05aa5c	969815d1-4be3-4634-a93e-ac7f4deb8706	37	2026-01-20 15:38:50.357938
087ac8d4-8748-4414-8f91-8e80846a79a1	37aae118-ff19-4657-ae12-ef4b7f05aa5c	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	0	2026-01-19 13:03:19.892688
101089a9-2f3d-4589-9b29-4eb6f23d85b7	37aae118-ff19-4657-ae12-ef4b7f05aa5c	174f733f-81e5-40e4-8cbc-79393d695328	40	2026-01-20 15:37:12.979325
a737e4b6-9127-4967-a677-ec636ae87f3d	37aae118-ff19-4657-ae12-ef4b7f05aa5c	4763666e-100e-4e28-a0e5-31f0f0fe6b31	59	2026-01-20 13:16:28.523384
3baabdbd-8fde-4711-94e1-902672093020	37aae118-ff19-4657-ae12-ef4b7f05aa5c	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	20	2026-01-20 15:41:15.281099
771529d8-f112-4776-a8f3-5a80f9ecec10	34d6ba95-b6cd-4092-b293-f73d0ec6f70b	874490b4-c9c0-4f89-a460-b0d460a9387e	4	2026-03-19 14:03:02.367086
fc6f144a-8d05-4a47-addf-d6719b54a0b0	5a8cc172-1d77-4f97-97a1-2f4d1ee33320	874490b4-c9c0-4f89-a460-b0d460a9387e	4	2026-03-19 10:25:53.04402
00932356-df2f-4565-b725-e777d647eabf	d57eabd9-43cf-48fc-8b9f-19e76324a52f	108873fe-b2e0-43a8-be0c-36f567e480cb	6	2026-03-20 09:06:35.482998
a0d71d51-9548-4fb3-a9d1-7f1e2b93a35c	8102c3d4-7881-4506-9540-ff88c17e7377	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-03-24 12:41:20.583909
64ca9b30-655c-4f72-b7b4-39f0d9fc296b	37aae118-ff19-4657-ae12-ef4b7f05aa5c	ffe30495-7455-4198-a15d-56b44c289976	2	2026-01-20 11:34:40.362041
2a24226f-7a38-47ef-bfff-dcfc8ad0eb1a	87cabc4f-886f-4642-abec-46530611a364	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-03-25 08:13:05.289599
9b1f060c-c4d3-49e9-80c6-da36e3d618ac	badb8064-6519-46d3-ba2a-22e8b909f8bc	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-03-25 10:34:49.832026
129393dd-9ce9-4378-a586-66d3c1fc1106	4a46cd43-71e1-461a-8f3f-7df6cb4181c9	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-03-25 11:52:43.29035
fc459ad0-f42d-4a27-be8b-6c9662a344d2	5e715d1e-06bf-4120-bb2d-188bea280f14	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-03-25 11:52:55.393755
295a022d-db6c-4d02-8173-26662eb4a285	21eeabef-5f64-40d5-9ed9-aefa83a8e420	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-03-25 11:53:06.00352
197cbf13-e9bd-41c0-8f8e-be4c7775dbe0	75dfb1cd-0ae8-4b9a-a194-18520f8ecc12	874490b4-c9c0-4f89-a460-b0d460a9387e	0	2026-03-30 08:15:24.221369
25893f91-e186-451e-b67e-04e42c05db77	abc07d96-3bb5-48f6-bff8-ad0bb71e5d86	de6756c2-06f2-412b-bbdc-d498a406d0b8	15	2026-04-03 16:30:45.723497
737daa5e-429f-402d-8c4b-f2971c5c7674	abc07d96-3bb5-48f6-bff8-ad0bb71e5d86	ffe30495-7455-4198-a15d-56b44c289976	0	2026-04-03 16:40:20.375653
0dd70bd0-e08d-4684-9cad-c4a89eb150b8	abc07d96-3bb5-48f6-bff8-ad0bb71e5d86	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	45	2026-04-03 16:31:21.347124
e391dfc5-1eb4-485d-a1c1-9be59503891e	abc07d96-3bb5-48f6-bff8-ad0bb71e5d86	25b3474d-3d76-4f58-8494-c169d3160e7f	15	2026-04-03 16:34:25.044887
53f15e2f-e9e2-40fe-8856-d2b261334ad8	ebaad53f-1ef8-428a-a551-32e4f3a5dc4f	108873fe-b2e0-43a8-be0c-36f567e480cb	0	2026-04-14 13:30:00.063369
\.


--
-- Data for Name: contest_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contest_qr_codes (id, contest_id, qr_token, created_at) FROM stdin;
f7bb7ace-884b-4208-8bbf-b66d505f3e1e	94e98eef-1136-4be5-89f1-95f79e865e3f	cce1e3f391721b64474c11fd7ebdbfbcb55710dc6b0e95fb3147ad78a9366f27	2026-01-08 12:31:16.655891
83aae6bb-34d9-4cb0-8092-1aa835dc4990	5d88e1b6-c789-43f6-986f-2b4deb03854b	f9aacbf3d3b4829e2720f1de4b77a779f78f692a437ab4ed9adebb9e47dc5926	2026-01-08 12:46:35.393461
2d3f42ac-355a-4d74-8552-6ea38faebddc	37aae118-ff19-4657-ae12-ef4b7f05aa5c	023827d06e471b16ea4e2ae2e06c204bc44d78d3558712dd8e2888c0148b23c6	2026-01-19 13:03:19.89467
0f2a8772-9352-4835-a3ac-eb1dafb9db67	5a8cc172-1d77-4f97-97a1-2f4d1ee33320	47d581129d4bfbbf548d226bb4c5e3048874901c214b43faa135ad084b8bdcba	2026-03-19 10:25:53.047204
3de46b24-a94a-408f-b99f-5bb3de1dc20f	34d6ba95-b6cd-4092-b293-f73d0ec6f70b	c71c8eaf7871787af543bf8ec7f80f0f8bae07851f2d12572a9e2cf50c05b79c	2026-03-19 14:03:02.368747
456f2e6f-9705-493c-a47e-ba04a645eebf	d57eabd9-43cf-48fc-8b9f-19e76324a52f	95ab6f955b8e2306978001cc4e802d172f2676fccdb1494e389b627a5f04d021	2026-03-20 09:06:35.485856
8acd201f-9c77-4dc7-8cb8-4d123c098487	8102c3d4-7881-4506-9540-ff88c17e7377	46ba2bae57e4b06390d4e1130efc5092a361d48e4164973d4091c6d9b1dac48c	2026-03-24 12:41:20.585846
d6b065a3-c315-4128-a094-22e4a1ead05e	87cabc4f-886f-4642-abec-46530611a364	24ac968434466ca28bbcb742931eb60445704d29ee59e477ba0fa1d0c0c173f4	2026-03-25 08:13:05.291675
4cd99d3a-561f-473e-aa19-4be5bb3b9aa2	badb8064-6519-46d3-ba2a-22e8b909f8bc	56e9ba3eee247e6e3c876c1db97159ead890d09fc0b7de227f4432a60b8d72b9	2026-03-25 10:34:49.834068
35346494-faef-4230-9427-916a9c0323ed	4a46cd43-71e1-461a-8f3f-7df6cb4181c9	f8804875e34c312790d6bb37a6079b8082cbd87dc6f783af95aebd8b45780607	2026-03-25 11:52:43.291738
d5128471-77c6-4d3e-a21c-84f5c1902d3f	5e715d1e-06bf-4120-bb2d-188bea280f14	e6fb12a8680721c6cdf1be934cb1eda72a176726a558ef908ad33291581a662e	2026-03-25 11:52:55.394565
64dc631f-a7b1-436f-b4cd-11ebc5195e1d	21eeabef-5f64-40d5-9ed9-aefa83a8e420	a19cb3b368c00bc44d0891835bcb9d0dfdd92bb0496115a501252f251737d04e	2026-03-25 11:53:06.004442
5fcc7b25-8fef-4ea1-9e68-7ced95574728	75dfb1cd-0ae8-4b9a-a194-18520f8ecc12	bb6fe45f0d98c9396a1026aaa4b5123e2e041ef4622a4872740aa488c7693a76	2026-03-30 08:15:24.224113
52494ba7-b9f2-4fdf-a3ff-3a6f6b5235da	abc07d96-3bb5-48f6-bff8-ad0bb71e5d86	d7c3cca7217d4a4c34a6da221434a2ef66d0bf12722c5d7409d4d670a50dc16e	2026-04-03 16:30:45.727661
9a8759f7-6140-4ef2-b5ca-e1ce501cf96f	ebaad53f-1ef8-428a-a551-32e4f3a5dc4f	a61a16069e24bb3b31d561e9be5de042b62326697c24b9277239f860f2531c20	2026-04-14 13:30:00.066318
\.


--
-- Data for Name: contest_registration_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contest_registration_qr_codes (id, contest_id, qr_token, enabled, created_at) FROM stdin;
16b6b209-4ed8-4677-9879-1a21a749c135	37aae118-ff19-4657-ae12-ef4b7f05aa5c	3e0f645c5326f43a623336453f56f7a91301ece790accfbc2d269c185726c624	t	2026-01-19 13:03:28.486351
74c8c8d7-28ad-4eed-a42b-f94518be89e3	87cabc4f-886f-4642-abec-46530611a364	d667696432d6c99879953ac245ac44ddc39fa50fbb378a3334686688c282462d	t	2026-03-25 10:54:29.335591
2e3da768-c284-4046-8950-5d237770aeb1	5a8cc172-1d77-4f97-97a1-2f4d1ee33320	0114f7cf6359a448254ea74f13c5eb14b6c5840601feaaeae2ed6600a69503a6	t	2026-03-25 12:38:32.837226
\.


--
-- Data for Name: contests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contests (id, name, created_by, end_date, reward_first_place, reward_second_place, reward_third_place, created_at, updated_at, active, start_date, rewards_awarded, name_i18n) FROM stdin;
5a8cc172-1d77-4f97-97a1-2f4d1ee33320	Contest Thow	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-03-27 22:59:00	\N	\N	\N	2026-03-19 10:25:53.042147	2026-03-25 12:38:11.660905	t	2026-03-19 23:00:00	t	{"de": "Contest Thowe", "en": "Contest Thowe"}
94e98eef-1136-4be5-89f1-95f79e865e3f	Wettlauf	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-09 00:00:00	\N	\N	\N	2026-01-08 12:31:16.644393	2026-01-08 12:54:31.871853	f	2026-01-08 12:31:16.644393	f	{"de": "Wettlauf", "en": "race"}
5d88e1b6-c789-43f6-986f-2b4deb03854b	Hotel-Rallye	8af2afba-1be0-4951-b066-790a31718076	2026-01-09 00:00:00	25	15	10	2026-01-08 12:46:35.380897	2026-01-08 12:55:15.917587	f	2026-01-08 12:46:35.380897	f	{"de": "Hotel-Rallye", "en": "Hotel rally"}
37aae118-ff19-4657-ae12-ef4b7f05aa5c	Cross-Re-Tour	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	2026-01-24 22:59:00	30	20	10	2026-01-19 13:03:19.890788	2026-01-19 13:03:19.890788	t	2026-01-19 23:00:00	t	{"de": "Cross-Re-Tour", "en": "Cross-re-tour"}
d57eabd9-43cf-48fc-8b9f-19e76324a52f	Contest Jason	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-20 22:59:00	\N	\N	\N	2026-03-20 09:06:35.481576	2026-03-20 09:06:35.481576	t	2026-03-19 23:00:00	t	{"de": "Contest Jason", "en": "Contest Jason"}
34d6ba95-b6cd-4092-b293-f73d0ec6f70b	Testcon	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-03-28 22:59:00	\N	\N	\N	2026-03-19 14:03:02.3655	2026-03-19 14:03:02.3655	t	2026-03-19 23:00:00	t	{"de": "Testcon", "en": "Testcon"}
87cabc4f-886f-4642-abec-46530611a364	Test	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 22:59:00	\N	\N	\N	2026-03-25 08:13:05.287376	2026-03-25 11:50:48.010104	f	2026-03-24 23:00:00	f	{"de": "Test", "en": "Test"}
badb8064-6519-46d3-ba2a-22e8b909f8bc	Contest Test User	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 22:59:00	\N	200	100	2026-03-25 10:34:49.830614	2026-03-25 11:50:55.367753	f	2026-03-24 23:00:00	f	{"de": "Contest Test User", "en": "Contest Test User"}
8102c3d4-7881-4506-9540-ff88c17e7377	Contest Test User	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-24 22:59:00	\N	\N	\N	2026-03-24 12:41:20.581897	2026-03-25 11:51:08.495546	f	2026-03-23 23:00:00	t	{"de": "Contest Test User", "en": "Contest Test User"}
4a46cd43-71e1-461a-8f3f-7df6cb4181c9	test1	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 22:59:00	\N	\N	\N	2026-03-25 11:52:43.289032	2026-03-25 11:53:22.363959	f	2026-03-24 23:00:00	f	{"de": "test1", "en": "test1"}
5e715d1e-06bf-4120-bb2d-188bea280f14	test2	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 22:59:00	\N	\N	\N	2026-03-25 11:52:55.392811	2026-03-25 12:36:12.481143	f	2026-03-24 23:00:00	f	{"de": "test2", "en": "test2"}
75dfb1cd-0ae8-4b9a-a194-18520f8ecc12	Aprilscherz	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-04-01 21:59:00	\N	\N	\N	2026-03-30 08:15:24.219355	2026-03-30 08:15:24.219355	t	2026-03-31 22:00:00	t	{"de": "Aprilscherz", "en": "Aprilscherz"}
abc07d96-3bb5-48f6-bff8-ad0bb71e5d86	Game	de6756c2-06f2-412b-bbdc-d498a406d0b8	2026-04-10 21:59:00	\N	\N	\N	2026-04-03 16:30:45.721304	2026-04-03 16:30:45.721304	t	2026-04-02 22:00:00	t	{"de": "Game", "en": "Game"}
ebaad53f-1ef8-428a-a551-32e4f3a5dc4f	Blabla	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-04-14 21:59:00	\N	\N	\N	2026-04-14 13:30:00.061134	2026-04-14 13:30:00.061134	t	2026-04-13 22:00:00	t	{"de": "Blabla", "en": "Blabla"}
21eeabef-5f64-40d5-9ed9-aefa83a8e420	test	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 22:59:00	\N	\N	\N	2026-03-25 11:53:06.002386	2026-03-25 12:38:15.679833	t	2026-03-24 23:00:00	t	{"de": "test3", "en": "test3"}
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
e5aaca36-e52f-4a83-bbbb-4ab5fb6e3202	8af2afba-1be0-4951-b066-790a31718076	2026-01-08	2026-01-08 11:09:55.662056
a301afa9-25b8-4b1f-a340-09e80460f3a0	ffe30495-7455-4198-a15d-56b44c289976	2026-01-09	2026-01-09 09:35:31.358984
c7975fba-43aa-450e-9460-4b19896f2584	ffe30495-7455-4198-a15d-56b44c289976	2026-01-12	2026-01-12 14:18:51.096284
e4e722fb-c6b2-49bf-9d46-3c09346deb03	ffe30495-7455-4198-a15d-56b44c289976	2026-01-13	2026-01-13 13:09:23.45201
a687f763-af43-49ae-9ad4-f37d475f157f	ffe30495-7455-4198-a15d-56b44c289976	2026-01-14	2026-01-14 08:39:04.33991
5f94f239-24e9-4efb-8aee-61b6ca898b97	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	2026-01-14	2026-01-14 20:04:16.425004
ee192589-393a-44a6-91aa-ebf7c100f8c6	f28e1527-f696-4a20-b952-ea567e5fc67d	2026-01-16	2026-01-16 16:23:52.359406
43521aa3-6ffb-40ff-bc9b-a7c643f4d943	ffe30495-7455-4198-a15d-56b44c289976	2026-01-16	2026-01-16 16:26:38.687886
286ed0bf-0df5-4c80-ba92-90d709622401	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-01-17	2026-01-17 11:42:43.451774
5265731f-6788-4344-a2cc-d582b3f3f4bb	ffe30495-7455-4198-a15d-56b44c289976	2026-01-17	2026-01-17 16:56:10.549957
f26c8719-35d5-492f-99a5-ac1899e7fd3e	ffe30495-7455-4198-a15d-56b44c289976	2026-01-19	2026-01-19 07:18:21.186883
c312d909-7ac1-4949-a40d-605f5213647a	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-01-19	2026-01-19 16:35:57.59285
2f5f64f5-2583-46cd-a7b1-dd7826c420af	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-01-20	2026-01-20 06:43:32.668078
29d516fe-47db-49e9-8d2c-cdb713f129ee	ffe30495-7455-4198-a15d-56b44c289976	2026-01-20	2026-01-20 13:08:55.975741
caeefb40-3b45-4485-8a0c-243f12c315a2	4763666e-100e-4e28-a0e5-31f0f0fe6b31	2026-01-20	2026-01-20 13:16:14.523708
39101037-0ce5-41d1-9610-798fe3653555	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	2026-01-20	2026-01-20 14:11:01.151935
37214487-13ec-446c-9b82-898c3e42b852	174f733f-81e5-40e4-8cbc-79393d695328	2026-01-20	2026-01-20 15:33:13.502953
c76143f4-69c6-48a2-abf1-821a904aeae9	969815d1-4be3-4634-a93e-ac7f4deb8706	2026-01-20	2026-01-20 15:33:42.423025
6a573de1-546e-439f-bd75-c1ee4935b3eb	040878d8-f0e3-48bc-919c-89c7814b8641	2026-01-20	2026-01-20 15:36:10.360595
e6c2dcae-73a2-4526-a67d-7f66658af9bd	0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	2026-01-20	2026-01-20 15:36:24.020634
432f6408-ee2f-40a1-b78d-30f9f3b5d17e	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	2026-01-20	2026-01-20 16:15:36.282145
39734bfe-e15c-42ae-8078-3a3102fa7f5e	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-01-20	2026-01-20 21:11:03.252592
f8575be3-1c37-46e1-bcde-19cffdd2c889	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-01-21	2026-01-21 04:01:32.447644
0390af61-b244-44b1-8781-2509521c8909	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	2026-01-21	2026-01-21 12:28:02.57439
3220ef45-9719-43bc-8d2b-ae12098cb9d6	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-01-22	2026-01-22 11:14:20.091501
8bb0f090-f9f3-4d73-a9a4-7ca51967cd05	969815d1-4be3-4634-a93e-ac7f4deb8706	2026-01-22	2026-01-22 20:35:53.909902
674a8b97-a15d-429b-ac61-7bf2e0ca287c	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-01-23	2026-01-23 10:22:59.331329
20fbf2f5-cd4c-4da3-9503-4b8c1f6524d1	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	2026-01-27	2026-01-27 03:57:38.524696
4ce4bc59-0711-4023-9fd7-7f821049104b	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-01-27	2026-01-27 17:44:32.991121
968f3d51-0a24-4644-8f92-25c22bc8c862	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-01-28	2026-01-28 18:21:17.233868
b0136dbf-6a32-4e8e-94bb-d40065a1d4a5	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-01-29	2026-01-29 14:42:27.344719
345c802b-cf86-470b-8efa-c4b5aa716a5c	34297ec6-7aaa-4ef2-b1bb-7b52f1f8abe1	2026-01-30	2026-01-30 11:46:26.394027
32d30a3a-6fad-4e7a-b8d3-1b5fe2390a8c	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-02-01	2026-02-01 11:26:06.896879
90915fa0-2ad1-44ad-a8f9-675f60237ce5	ffe30495-7455-4198-a15d-56b44c289976	2026-02-06	2026-02-06 08:15:25.911188
daad2c80-a1fa-4333-91cd-e84650c0a0a7	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-02-06	2026-02-06 14:13:47.454088
c4552931-da5f-43d8-a193-5e59514f1470	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-02-09	2026-02-09 06:27:56.395461
ffae50be-7eed-4791-a43d-4b55f9a69823	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-02-16	2026-02-16 18:31:19.435413
4bad0d08-5ea1-4e33-a411-7944199e42d6	ffe30495-7455-4198-a15d-56b44c289976	2026-02-18	2026-02-18 09:31:51.274717
1f2ff822-68d0-488e-a995-708aa889aa3d	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-02-18	2026-02-18 09:34:43.968306
916d40f5-d0e4-4220-8dfd-e7a1fb4fc771	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-02-24	2026-02-24 09:37:46.885851
95411e4b-a778-4123-b2dc-a6332f0fe6d1	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-03	2026-03-03 09:31:16.676654
b90a5c10-120d-41c2-8978-3ddaae6fdce8	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-06	2026-03-06 04:05:15.840339
31a5488c-aad8-41ba-8811-77775a851f03	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	2026-03-13	2026-03-13 11:58:41.745363
0bd9cca3-7e3d-4a1c-a7fe-7be0ebf4394e	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-13	2026-03-13 12:38:46.16689
cf47aaf5-9fcb-4bac-ba73-d1eecc37f926	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-14	2026-03-14 10:21:56.890148
5ba7522c-67db-4ad5-86e4-fd565ba770a7	ffe30495-7455-4198-a15d-56b44c289976	2026-03-15	2026-03-15 08:21:10.625328
c07aa29c-06c0-4493-8127-595126a2ceb0	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-17	2026-03-17 13:41:35.205252
ab0c8153-924a-4c90-83bd-46429f66beae	ffe30495-7455-4198-a15d-56b44c289976	2026-03-17	2026-03-17 17:34:12.692637
9c616450-bd93-4494-8901-1dd1044fb64e	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-18	2026-03-18 13:07:06.618692
0f593164-98f1-4571-8ebe-89e802ad0c4f	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-03-18	2026-03-18 13:18:17.184714
929a5aaf-b2cf-471e-a212-47f5aa1aad2b	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-03-18	2026-03-18 13:33:37.467349
6229e10a-c7b0-411c-87ea-d27b835d49ce	ffe30495-7455-4198-a15d-56b44c289976	2026-03-18	2026-03-18 14:51:53.839317
57c3e3f5-b97b-4309-883e-4eab2bae4942	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	2026-03-18	2026-03-18 16:09:00.606362
225b0851-1015-4e1c-992c-15a547043a29	ffe30495-7455-4198-a15d-56b44c289976	2026-03-19	2026-03-19 07:56:06.376075
ae80a495-2b7e-4ee3-adfe-e51e266fbcbd	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-03-19	2026-03-19 09:10:20.475217
29de6f12-74c4-4258-a656-77e36d237200	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-19	2026-03-19 09:20:49.715238
6f808925-2e88-4b33-bdcd-dc55785a21c0	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-19	2026-03-19 21:29:56.737601
ba394311-6829-4608-8117-2ae93f9c69bc	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-20	2026-03-20 08:16:18.618254
f8d5273c-2f8f-4d1a-8420-eace4c788086	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-03-20	2026-03-20 08:59:18.318402
5aa9d4ed-3cfb-45fc-99c9-14838a2c2f1b	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-03-20	2026-03-20 19:29:04.860066
487fd3ae-ea7b-4519-b60c-02aa02e4dd6c	ffe30495-7455-4198-a15d-56b44c289976	2026-03-23	2026-03-23 07:02:14.322975
1dd4aff0-4835-49f2-a954-9745e8e37660	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-03-23	2026-03-23 08:51:57.877514
0688bab6-5357-4e3c-a086-353f6b82aaeb	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-24	2026-03-24 07:13:51.941071
5b938dfd-9d06-4c69-9ab6-a6eebd045a14	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-24	2026-03-24 12:37:04.925432
bf7d9f3d-b91a-4dbd-ac07-e2ae67ce0edf	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-03-24	2026-03-24 12:37:23.163791
c53edfa5-a85c-43b3-921d-da79265b5f00	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-03-25	2026-03-25 05:48:20.713311
80ac4bcc-03e3-453b-9685-68aaeac65b97	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-25	2026-03-25 07:01:21.753349
7230bdd7-d92d-4a0a-b02c-f6fa3a81320f	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-03-25	2026-03-25 09:00:44.309252
79383b29-e05a-44d7-b651-8d856ecb96f2	ffe30495-7455-4198-a15d-56b44c289976	2026-03-25	2026-03-25 16:02:06.990209
5d1b7ed2-ec18-4cdd-91e5-15582a0df67e	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-23	2026-03-26 12:31:33.908303
8fa9d257-487d-471f-9700-cbaed20dcc0f	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-22	2026-03-26 12:31:33.908303
cfa398f7-271d-40f8-86ae-4b8224c85b83	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-21	2026-03-26 12:31:33.908303
d70fa241-8d69-48f4-8c05-2423236b2a98	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-18	2026-03-26 12:31:33.908303
ac465ca8-dfd2-42ff-970c-37bc01ca3f88	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-17	2026-03-26 12:31:33.908303
e06a2880-5d5d-4328-becb-6a7b3ff35111	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-16	2026-03-26 12:31:33.908303
bd89e151-93e1-4664-9c94-683aebfad57d	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-15	2026-03-26 12:31:33.908303
7e999f0a-57c9-4529-9581-518a48e35a6d	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-14	2026-03-26 12:31:33.908303
ab589ae7-8c1e-4590-8662-05b3262e10d1	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-13	2026-03-26 12:31:33.908303
a9232b5e-f7d4-43ed-9d68-60197431c207	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-12	2026-03-26 12:31:33.908303
cfec19fe-3034-4261-a2c1-4a5b6c95ce8a	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-11	2026-03-26 12:31:33.908303
7615c5da-276f-4de0-8795-a348b41db944	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-10	2026-03-26 12:31:33.908303
7936e418-8fab-492a-bdd1-6129a52e19e0	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-09	2026-03-26 12:31:33.908303
49728e0e-2341-4fd5-bbba-bf487887ebf0	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-08	2026-03-26 12:31:33.908303
5da051c5-3d36-4312-8e5d-d37eae82169d	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-07	2026-03-26 12:31:33.908303
e7288a6f-613e-44d2-949a-9a16deeacffd	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-06	2026-03-26 12:31:33.908303
637107c9-3db3-4d14-b057-2a6732b8d167	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-05	2026-03-26 12:31:33.908303
c6675738-7dbd-41ad-8ef4-d7ef74c01812	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-04	2026-03-26 12:31:33.908303
b1ec166e-f810-40c9-9f2f-b177bda482cf	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-03	2026-03-26 12:31:33.908303
ee34a8d2-0898-4665-b911-09b5a91f979d	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-02	2026-03-26 12:31:33.908303
cf96ae49-d1cd-4748-81c4-408d1b9d955c	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-01	2026-03-26 12:31:33.908303
bb3c1ea4-bc3f-4f8f-b3fb-e909a4a37f27	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-28	2026-03-26 12:31:33.908303
8cb911f7-7748-4588-b6c8-b7a0112c9457	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-27	2026-03-26 12:31:33.908303
54422a55-52ae-48e9-be20-7128cfcb7f04	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-26	2026-03-26 12:31:33.908303
f7e7eefc-dae5-4c41-a79f-3f3ca101846c	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-25	2026-03-26 12:31:33.908303
7b80e2b4-b2e2-4c19-965c-4218501e268b	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-24	2026-03-26 12:31:33.908303
e6fe20a0-ed3f-4d47-a8bd-862338977c84	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-23	2026-03-26 12:31:33.908303
35a76047-4ccf-4cbe-bbff-4478975591a1	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-22	2026-03-26 12:31:33.908303
b6e13657-8f4b-4204-9f6a-44d4208d4f5b	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-21	2026-03-26 12:31:33.908303
540c86ce-f5d6-42b5-97e5-679b76ddcfa3	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-20	2026-03-26 12:31:33.908303
6fbd6165-9c2b-47a1-a4ca-795fc90d9b60	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-19	2026-03-26 12:31:33.908303
ebe03733-2491-4c53-a70d-1491d41efd33	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-18	2026-03-26 12:31:33.908303
46e2d1b3-d908-4c24-be27-906945fa7225	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-17	2026-03-26 12:31:33.908303
c48e726d-2ca2-4a99-965a-0ecd5e6ee1d2	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-16	2026-03-26 12:31:33.908303
6d2be108-00a4-4586-a776-68c97287b4c0	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-15	2026-03-26 12:31:33.908303
87348276-620f-49a0-8c13-4e5e92187493	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-14	2026-03-26 12:31:33.908303
4d4a5fed-4256-475e-b822-5bde50fbf6e9	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-13	2026-03-26 12:31:33.908303
0c664d2e-f78c-41b7-bc66-ea87381d3224	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-12	2026-03-26 12:31:33.908303
df603ef8-76fa-4d11-b97a-d2c2e26990c3	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-11	2026-03-26 12:31:33.908303
fb4fa359-aef9-4ead-af5a-0814acc709a1	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-10	2026-03-26 12:31:33.908303
2d0aab0c-ccc0-4a53-a928-aadd45cff44a	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-09	2026-03-26 12:31:33.908303
517a604d-00ee-4ccc-86d7-d64e39c584e0	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-08	2026-03-26 12:31:33.908303
c5988b4c-9738-4aa2-a4fe-8f705f496778	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-07	2026-03-26 12:31:33.908303
bdb8851b-c72d-4fd5-a180-bcd383a2d625	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-06	2026-03-26 12:31:33.908303
a3f5fe42-d550-484e-936c-234139de10d5	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-05	2026-03-26 12:31:33.908303
f2565633-6636-4af4-bc56-0889edf3fb8e	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-04	2026-03-26 12:31:33.908303
23388fac-acf2-440e-b945-8c02757b372d	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-03	2026-03-26 12:31:33.908303
5c3a63eb-2b6d-46b9-a37e-2d0544cd6ec7	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-02	2026-03-26 12:31:33.908303
45b0b343-724a-44e3-bf36-999e9a6c8574	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-02-01	2026-03-26 12:31:33.908303
ce25e9af-3051-4a95-8733-2174a3de0da5	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-31	2026-03-26 12:31:33.908303
7ef7161d-6882-4f9d-946b-32d5f2f2af29	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-30	2026-03-26 12:31:33.908303
47fa5746-85a9-442f-bd6c-6e30edd15ee3	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-29	2026-03-26 12:31:33.908303
979e5fff-9c9d-4a9a-97e2-0beb34036dd1	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-28	2026-03-26 12:31:33.908303
46e9a608-2c63-4515-b22f-63dd420e209f	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-27	2026-03-26 12:31:33.908303
d0ac8985-ff8f-4080-9e20-2d80334b8dc7	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-26	2026-03-26 12:31:33.908303
d9ca4c36-9ff1-4a28-b7ae-01feda1407c9	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-25	2026-03-26 12:31:33.908303
9f159c6c-450f-4353-98cb-3135124908e5	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-24	2026-03-26 12:31:33.908303
fe516b4a-f467-4a67-87d5-e6665c6b6387	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-23	2026-03-26 12:31:33.908303
45a85649-5d64-4b59-8d5e-d7b5d8f742e3	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-22	2026-03-26 12:31:33.908303
4195973d-6ead-40c0-ad45-b84bcd9f3fd5	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-21	2026-03-26 12:31:33.908303
c466ba80-96e7-4a43-ab4c-e195ef117895	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-20	2026-03-26 12:31:33.908303
e727e361-9135-4551-8c06-21a2b5fac2e2	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-19	2026-03-26 12:31:33.908303
92331247-da7f-44fa-ba54-ef65af472054	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-18	2026-03-26 12:31:33.908303
d8bb879f-86cd-47e7-aa09-45f6980967e0	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-17	2026-03-26 12:31:33.908303
3cac658b-12b6-4b61-a71e-b29d324027df	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-16	2026-03-26 12:31:33.908303
c190d6b6-87bc-4c28-b7b3-f042549af63b	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-15	2026-03-26 12:31:33.908303
a899b498-6245-442d-acff-bcdf15ccdbef	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-14	2026-03-26 12:31:33.908303
88fa8fd3-8a06-4860-86e4-bf8a233ebc70	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-13	2026-03-26 12:31:33.908303
96a8a05d-5d5e-4a48-af13-b0acf35a995a	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-12	2026-03-26 12:31:33.908303
a78f39f6-35c8-47f0-9b60-85b0b60de9e7	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-11	2026-03-26 12:31:33.908303
5fc03e58-e218-44bd-9a4f-bdafcf049961	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-10	2026-03-26 12:31:33.908303
2370b8e3-297a-4339-accf-edadb012739e	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-09	2026-03-26 12:31:33.908303
2f219ce6-00fa-4c61-8aa1-a9bbf966abf7	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-08	2026-03-26 12:31:33.908303
a9ffd4ab-10bf-46b4-909e-f114cbac81e3	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-07	2026-03-26 12:31:33.908303
ef7198a5-aa1a-4d96-8be2-a591f17a47c9	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-06	2026-03-26 12:31:33.908303
ced2950e-447e-4517-be49-357ae218a81c	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-05	2026-03-26 12:31:33.908303
1dd70128-d5ce-4b6e-be87-e4b31effd4bd	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-04	2026-03-26 12:31:33.908303
d2dd33d9-c90d-4647-be2f-aea872a86abc	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-03	2026-03-26 12:31:33.908303
64cd0777-8871-4191-9d76-93a50611393a	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-02	2026-03-26 12:31:33.908303
082dd736-8de9-4e2b-bed1-802864eee480	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-01-01	2026-03-26 12:31:33.908303
af32bbf2-5a1f-4b87-a7a6-2d0643ba8051	108873fe-b2e0-43a8-be0c-36f567e480cb	2025-12-31	2026-03-26 12:31:33.908303
79832abb-7ad2-4ece-84a1-542f3b9a31d8	108873fe-b2e0-43a8-be0c-36f567e480cb	2025-12-30	2026-03-26 12:31:33.908303
43e47fb0-4c0d-4a05-9284-850e65de0545	108873fe-b2e0-43a8-be0c-36f567e480cb	2025-12-29	2026-03-26 12:31:33.908303
63dd7f14-c5e8-470b-b902-a6e6b8402343	108873fe-b2e0-43a8-be0c-36f567e480cb	2025-12-28	2026-03-26 12:31:33.908303
9fcce40a-0438-464f-9c59-4e6bbd46ff86	108873fe-b2e0-43a8-be0c-36f567e480cb	2025-12-27	2026-03-26 12:31:33.908303
e16cad31-fc9f-49a3-a1a3-244b9b413c95	108873fe-b2e0-43a8-be0c-36f567e480cb	2025-12-26	2026-03-26 12:31:33.908303
13a5024e-5747-48af-83a0-546ab4a309c7	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-26	2026-03-26 12:31:46.561637
d12ac0e8-c8b8-4226-9958-b9efaf4881a1	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-27	2026-03-27 22:22:02.349386
97034c47-fdd2-4334-8590-9daca987a61c	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-03-28	2026-03-28 06:09:28.938354
ef225716-cedb-4ba3-84eb-4a54ef385e76	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-28	2026-03-28 06:38:06.563765
b8c99f19-d22f-450c-b3a8-e270f64b986f	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-29	2026-03-29 01:03:57.059118
f6d01254-a774-436e-ab72-4303c4841c38	ffe30495-7455-4198-a15d-56b44c289976	2026-03-30	2026-03-30 06:22:45.607984
16015529-6214-4e23-9fce-55183b1137ac	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-03-30	2026-03-30 07:56:30.835501
63a8a976-6a35-4ef5-9205-4578665b3322	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-30	2026-03-30 08:12:38.910226
7cdfbf0b-b9df-411f-994d-fe94943cd61d	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-03-31	2026-03-31 08:43:58.724297
4ffd5657-f959-4607-bfb3-17ae750ac5df	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-03-31	2026-03-31 09:22:48.041295
56a99ae1-fdb2-4cc8-8b91-d79908bdb865	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-01	2026-04-01 10:14:17.958686
17790196-aed9-4f0c-86b2-f4440f0f91c0	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-04-01	2026-04-01 10:17:53.410984
e4605190-dc34-44a7-9d92-d1ee9f97dd02	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	2026-04-01	2026-04-01 17:54:27.904692
5bec839d-4863-439d-b2a3-bf351a27e7a0	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-02	2026-04-02 05:35:47.825238
3354eb0d-8c46-446d-b8d0-657920fc3c51	ffe30495-7455-4198-a15d-56b44c289976	2026-04-02	2026-04-02 06:58:14.823405
1f46e75d-73d4-490a-858a-7c08b7cc418a	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-04-02	2026-04-02 07:26:18.946738
31f95026-3170-4d0e-8393-a361259d51d3	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-04-02	2026-04-02 07:30:07.080613
8b68fb1f-a342-4555-8dac-129003eab907	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	2026-04-02	2026-04-02 10:00:55.643144
066adda9-3f9a-46aa-a761-ac83ff981081	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-03	2026-04-03 04:59:19.214637
63768c95-37c1-4888-920b-e3d14dd05a0a	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-04-03	2026-04-03 13:24:34.335924
d13294f5-0754-4c7e-9b92-b6e03977d5be	de6756c2-06f2-412b-bbdc-d498a406d0b8	2026-04-03	2026-04-03 16:25:29.309028
6c1f96b3-e136-40fc-9e04-168470d2a41b	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	2026-04-03	2026-04-03 16:27:46.011169
6ddb564f-eaf9-4369-b5d9-77e0f8b73568	25b3474d-3d76-4f58-8494-c169d3160e7f	2026-04-03	2026-04-03 16:29:37.474866
2fad9373-4682-4726-883d-5b605fccf1a2	ffe30495-7455-4198-a15d-56b44c289976	2026-04-03	2026-04-03 16:37:21.044221
2616471b-752a-4511-afd4-8a856d3b17f3	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-04	2026-04-04 05:22:06.113775
e2ab8209-0d01-4343-95f0-cf227294e18c	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-05	2026-04-05 06:47:16.948287
1c838b18-d14f-4e96-b49d-cd4f1079ab49	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	2026-04-05	2026-04-05 21:21:20.199611
9789acb7-003e-4c60-9e03-c4d06b68309e	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-06	2026-04-06 07:29:02.679462
4033105f-df0f-44eb-9b32-3ee3044cf728	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	2026-04-06	2026-04-06 07:48:28.553016
53a67518-6f51-49dc-9eed-b266876f65f4	ffe30495-7455-4198-a15d-56b44c289976	2026-04-07	2026-04-07 07:09:45.790435
b512fd18-095c-4f0d-a658-2a490b2d453e	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	2026-04-07	2026-04-07 10:18:56.993705
7402b449-3c18-40fe-9ca4-2354bd650695	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-07	2026-04-07 10:35:04.721546
4bb542d5-f384-4627-9520-4d8c64cb0381	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	2026-04-07	2026-04-07 18:53:11.654971
342f0ebc-cd4f-4803-ac50-8eb49433fa11	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-08	2026-04-08 03:54:22.536643
b899b76b-e53d-4776-bc6f-66a1add4b316	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-09	2026-04-09 14:38:50.941552
cc489662-5e25-403f-b004-35fff5d81c74	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-04-10	2026-04-10 08:42:53.549239
5d23eae9-1ed9-48a0-bb83-47a0a6b5fdf3	ffe30495-7455-4198-a15d-56b44c289976	2026-04-10	2026-04-10 09:51:38.360919
3334e9e9-d681-4d08-9493-a982fc3f37e1	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-10	2026-04-10 14:02:47.009899
c8370758-d72f-4546-b46c-7b467ea1f7b9	ffe30495-7455-4198-a15d-56b44c289976	2026-04-11	2026-04-11 14:58:56.878019
9ee5c435-4123-4da8-a10a-14b889840db9	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-12	2026-04-12 13:31:33.778351
56b7a6dc-4c5a-456f-a031-447083d7c257	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-04-12	2026-04-12 15:07:14.494576
c50a913b-fc51-4080-84ba-d1cf054c8586	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-13	2026-04-13 05:08:49.228254
66dad804-7db0-4652-abea-8abfac2ee84a	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-04-13	2026-04-13 06:28:15.460497
5b5721cb-96f2-4421-ad7e-22c51d1d0317	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-04-13	2026-04-13 07:41:39.708211
0bee6b16-d44c-4792-8e49-640045a7d26b	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-04-13	2026-04-13 08:19:12.788138
512097d5-415c-4e8c-9252-81c8f76b9510	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	2026-04-13	2026-04-13 11:07:18.500295
d9edc385-1d3c-4779-a573-203086b713c0	276ab066-e6de-4957-ae0c-ccea7b590ac9	2026-04-13	2026-04-13 11:37:16.174811
81961574-09ac-4b50-8eb1-afe817c70e4b	ffe30495-7455-4198-a15d-56b44c289976	2026-04-13	2026-04-13 19:04:00.610695
447c60c1-acb7-4b81-95cb-44a269890782	de6756c2-06f2-412b-bbdc-d498a406d0b8	2026-04-13	2026-04-13 19:05:08.566805
68f6ecbd-4b2c-488e-a28a-d1c8543aff16	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-14	2026-04-14 05:07:19.460868
6f85bf3a-b627-487c-b304-2a159c9c9268	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-04-14	2026-04-14 06:37:23.676154
9af98095-c932-4872-8a38-ba0ef0ed4854	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-04-14	2026-04-14 07:48:43.188027
0e47d9dd-61c9-4e17-8b61-c650a9ea1572	ffe30495-7455-4198-a15d-56b44c289976	2026-04-14	2026-04-14 09:54:19.280544
2219fc34-46d1-4123-9330-ff1bb380a596	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-04-14	2026-04-14 10:33:25.948316
441f16e2-b1fe-4f79-bb7e-0ead7061dfae	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-15	2026-04-15 04:15:29.548135
59551119-6a97-4b3c-8e8a-af19172bf95d	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-04-15	2026-04-15 04:16:14.556617
242e6991-9563-4001-a50c-db7430f270b2	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-04-15	2026-04-15 05:42:48.298318
d9681ecb-d7cf-4c11-9c2f-3f71d83cba2f	ffe30495-7455-4198-a15d-56b44c289976	2026-04-15	2026-04-15 08:40:54.849568
\.


--
-- Data for Name: daily_login_points; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_login_points (id, user_id, login_date, points_awarded, created_at) FROM stdin;
5633a9f5-b845-46f5-9b21-9ddd5b63a956	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-04-14	2	2026-04-14 10:33:20.299158
9862ff43-d2e0-4d95-9112-8b2a74f4fe42	53772231-8597-43ae-8e77-d36b6f23ab2c	2026-04-14	2	2026-04-14 11:30:09.765302
dd96900c-e48f-456c-b74c-e2227e9541d2	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-14	2	2026-04-14 11:46:46.383118
edcea488-f058-4e86-9fa5-c90fb841804c	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-04-14	2	2026-04-14 12:56:46.451889
ee8faa58-24ee-4f5d-84cf-08131951cce0	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-04-15	2	2026-04-15 04:16:10.506355
d98de06f-746b-4223-bbae-094993223c4a	015fb208-a385-40d0-a289-c073acec8e0b	2026-04-15	2	2026-04-15 04:17:51.572733
4b428639-a6ba-480f-b26d-4b0c636a15de	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	2026-04-15	2	2026-04-15 04:19:22.602915
d66dc189-6d40-490a-9fe6-a19d2acdb10b	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-04-15	2	2026-04-15 05:39:52.257831
17ae6099-2f42-444b-8313-fa7679adc6e6	53772231-8597-43ae-8e77-d36b6f23ab2c	2026-04-15	2	2026-04-15 06:06:24.944669
f02082f6-6533-4fc6-b2b1-3618adaac0fa	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	2026-04-15	2	2026-04-15 08:42:41.239973
6dc74557-0bd7-4334-8854-6fd26e103178	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-04-15	2	2026-04-15 08:48:06.396028
\.


--
-- Data for Name: email_delivery_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_delivery_log (id, recipient_email, message_type, template_key, subject, provider, status, attempt_count, smtp_response, error_code, error_message, metadata, created_at, updated_at, last_attempt_at) FROM stdin;
1	thomas.rossner@imbus.de	email_verification	email_verification	Verify Your Email Address - 4rest	smtp	sent	1	250 2.0.0 Ok: queued as 50E8DE0953	\N	\N	{"userId": "91ffab1b-17e2-462e-99d1-561d3e2613b4", "messageId": "<9a35502a-4b89-1cbf-0c89-214adda6a9a5@luise.eco>"}	2026-04-13 09:54:08.707605	2026-04-13 09:54:10.76968	2026-04-13 09:54:10.76968
2	thomas.rossner@imbus.de	email_verification	email_verification	Verify Your Email Address - 4rest	smtp	sent	1	250 2.0.0 Ok: queued as E5B32E015E	\N	\N	{"userId": "91ffab1b-17e2-462e-99d1-561d3e2613b4", "messageId": "<391ea20f-ee3b-ef70-2b4e-a64666ac82e4@luise.eco>"}	2026-04-13 09:57:01.186418	2026-04-13 09:57:04.395333	2026-04-13 09:57:04.395333
3	thomas.rossner@imbus.de	email_verification	email_verification	Verify Your Email Address - 4rest	smtp	sent	1	250 2.0.0 Ok: queued as 95A3DE00E3	\N	\N	{"userId": "276ab066-e6de-4957-ae0c-ccea7b590ac9", "messageId": "<c5f6f06d-0851-ff38-e41a-2717f628df0f@luise.eco>"}	2026-04-13 11:36:52.192177	2026-04-13 11:36:52.984746	2026-04-13 11:36:52.984746
\.


--
-- Data for Name: email_suppressions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_suppressions (recipient_email, reason, source, expires_at, details, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: forest_trees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.forest_trees (id, user_id, tree_type, position_x, position_y, position_z, planted_at, task_id, growth_points, stage, size) FROM stdin;
f2b3d4f4-9684-420f-a7e6-04ea3f7334f7	8af2afba-1be0-4951-b066-790a31718076	default	27.66	0.00	9.82	2025-12-05 08:51:19.622625	49a47427-e93f-439c-ac10-bf089760aa79	11	sapling	0.035
db309092-bbd5-4194-8cc3-cb8900346e39	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	39.61	0.00	8.65	2026-01-08 12:37:55.273572	49a47427-e93f-439c-ac10-bf089760aa79	7	sapling	0.050
33855ae8-b532-454b-b92a-624754e51a14	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	41.72	0.00	9.80	2026-01-08 12:37:55.273572	f212470c-195f-4d65-a9a8-d9015cce8bf3	7	sapling	0.043
67246d3c-7b69-4113-bbe0-d465899494c3	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	40.89	0.00	6.16	2026-01-08 12:37:55.273572	0b1a16a9-c712-4195-ad7d-e37abffa1074	7	sapling	0.035
7e5011a3-4bda-4c60-9ac4-0b61b4a26e73	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	default	38.96	0.00	62.86	2026-04-07 10:23:16.147255	218ebb52-1322-4f7f-9e84-6a92b6cb525e	28	young	0.121
b3c1a301-afb0-4aeb-b735-ac319e2ce018	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	42.51	0.00	7.87	2026-01-08 12:37:55.273572	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	7	sapling	0.042
e86b1eeb-8b75-48bc-b1b5-eedea6382cb3	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	45.99	0.00	5.38	2026-01-08 12:37:55.273572	456c1be6-40da-4f3d-9810-ea8e87e72afc	7	sapling	0.021
a283489b-736d-4e31-b2ad-a9f9f62ab206	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	41.88	0.00	2.36	2026-01-08 12:37:55.273572	7e613eb6-ce9d-48ee-94f9-c3418383ccba	7	sapling	0.040
9cdf6193-04eb-47d5-856c-00a25ae3d1ed	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	default	39.05	0.00	6.71	2026-01-08 12:37:55.273572	feeab851-92a6-4209-ba8b-eecc2bb9cc06	7	sapling	0.031
d4f5324f-4c68-44e4-abc7-a21573829be8	e503c22a-ac49-4154-b7d3-648f0f08ccc7	default	50.36	0.00	67.37	2026-04-10 10:06:23.998141	d23b70e4-ab37-4c2a-a8fa-717869ff7338	1	sapling	0.037
cdabb758-68e9-41a1-908b-6319e19f3dd7	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	33.48	0.00	8.23	2026-01-03 18:53:57.073214	7efe0342-bf73-4bba-9c80-f0acba5019d2	73	mature	0.250
cada6fda-59db-42f3-8e2e-c9c21111489d	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	33.66	0.00	6.18	2026-01-05 16:42:32.474075	feeab851-92a6-4209-ba8b-eecc2bb9cc06	84	mature	0.268
d339c943-adad-48da-a2b8-c5d84e1b74fd	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	19.28	0.00	20.29	2026-04-15 09:08:42.629989	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	5	sapling	0.040
1dc6ea09-a7ae-4086-ae4d-4de996b32e76	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	21.90	0.00	8.64	2025-12-26 19:47:08.795377	5073320b-3b03-41d8-84df-a5aa48ffbc01	61	mature	0.226
61713db1-b66a-43f7-96e4-7ee4b11a97ca	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	4.10	0.00	7.70	2026-03-18 16:07:34.219652	b22e00c6-b363-4f85-839c-1a7002bc8c3b	5	sapling	0.048
567579e2-ce71-4d12-9d40-4d6410f43705	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	28.99	0.00	5.11	2026-01-07 01:15:03.838538	b01d3854-960a-4c5e-a92b-ae0b8118c654	55	mature	0.255
21095691-43c0-4a23-8404-2e514b399f65	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	default	63.76	0.00	39.61	2026-04-01 18:00:08.182396	53966428-2831-47fb-b171-e7a405044c83	18	sapling	0.021
862c0a79-3762-40d8-a9b4-469ac2db46e4	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-5.55	0.00	9.39	2026-01-14 21:16:40.710155	0b1a16a9-c712-4195-ad7d-e37abffa1074	36	young	0.106
424e8502-2d51-4c0d-9cf2-5087e4f3d669	f28e1527-f696-4a20-b952-ea567e5fc67d	default	20.73	0.00	21.34	2026-01-16 16:24:56.348378	49a47427-e93f-439c-ac10-bf089760aa79	3	sapling	0.028
10e76c60-0c04-4f1f-a3c3-582e64d354e6	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	7.19	0.00	3.15	2026-03-17 17:40:03.279167	456c1be6-40da-4f3d-9810-ea8e87e72afc	5	sapling	0.022
13a3b58a-856d-4539-8ff3-0c47c2b62d2f	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	default	19.99	0.00	65.38	2026-04-03 16:39:46.336982	42296565-9379-4c71-9050-ad241a982245	9	sapling	0.037
44214a57-fefd-4a2c-b30c-aac0cfcacdf1	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	4.27	0.00	5.45	2026-03-18 18:08:23.318538	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	2	sapling	0.047
49a5fdc4-ee64-4df5-a3e6-898f6e6e7a9b	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	9.73	0.00	7.35	2026-01-21 12:24:17.564818	5073320b-3b03-41d8-84df-a5aa48ffbc01	9	sapling	0.039
4ad39d83-f807-419b-9243-79b3482c4062	de6756c2-06f2-412b-bbdc-d498a406d0b8	default	8.66	0.00	67.58	2026-04-03 16:28:45.267851	218ebb52-1322-4f7f-9e84-6a92b6cb525e	12	sapling	0.031
0f54dd0f-bb9c-485b-be27-585a20df4308	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	8.55	0.00	18.70	2026-01-20 14:06:24.137477	015c7128-73e4-4e0f-a34a-2d7b35ce1e89	14	sapling	0.028
1f4b66b3-eee0-49ff-8783-6c6c308407f5	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	4.39	0.00	21.97	2026-01-20 15:40:32.976294	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	14	sapling	0.046
481f4c0a-1cb3-48e4-9662-472d3f04c231	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	6.53	0.00	16.74	2026-01-20 15:43:10.856382	ce748baa-f09a-451b-8c04-7f1bd5ce8738	6	sapling	0.028
0225162d-f2f5-4869-bc8a-9fdac5789c6e	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	6.58	0.00	19.49	2026-01-20 15:46:35.424597	218ebb52-1322-4f7f-9e84-6a92b6cb525e	4	sapling	0.038
ee4ed1e4-0bc3-4f60-b8ae-ebae24a62f6e	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	8.72	0.00	14.99	2026-01-20 16:00:51.06071	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	1	sapling	0.027
dfa98b0d-d074-496c-a51d-d79a1565fff1	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	20.99	0.00	21.62	2026-01-20 16:17:09.298982	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	1	sapling	0.047
80a2ac44-971c-4da4-aee4-8fde8472214d	174f733f-81e5-40e4-8cbc-79393d695328	default	50.13	0.00	19.34	2026-01-20 15:43:18.050035	ce748baa-f09a-451b-8c04-7f1bd5ce8738	12	sapling	0.032
086a3308-f804-4c5d-9bd8-32488454e952	174f733f-81e5-40e4-8cbc-79393d695328	default	52.34	0.00	21.13	2026-01-20 15:47:16.61401	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	18	sapling	0.039
0f041ded-e177-4a37-8856-e3a864accae7	174f733f-81e5-40e4-8cbc-79393d695328	default	57.05	0.00	17.51	2026-01-20 15:59:52.333399	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	13	sapling	0.033
71506218-cc02-49ac-87ae-8a8fa7693e1e	174f733f-81e5-40e4-8cbc-79393d695328	default	53.76	0.00	20.11	2026-01-20 22:38:02.113106	9278c916-8a13-4013-ab69-5f0697395202	1	sapling	0.031
33b5900c-22f8-4308-9b17-bc7750a1b952	174f733f-81e5-40e4-8cbc-79393d695328	default	67.48	0.00	19.97	2026-01-21 16:34:10.263561	8987fd0c-2c2f-49fe-83e3-bc6985fd1985	1	sapling	0.043
c083ee4f-ca83-4605-a28f-1fe7697414cc	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-6.44	0.00	32.99	2026-01-20 15:47:08.546717	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	17	sapling	0.031
1adc4d68-293b-47f4-80c3-4d42820e2391	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-2.20	0.00	29.58	2026-01-20 15:51:23.17228	49154be8-0d8b-410d-a200-e0b7794271ef	11	sapling	0.041
17dd0471-4b61-435d-a447-24786b9432fe	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-9.92	0.00	27.27	2026-01-20 16:00:10.227533	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	9	sapling	0.040
c2de9020-d0ed-412d-a6d3-20f13fc947b0	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-8.60	0.00	28.54	2026-01-20 16:17:45.525871	b22e00c6-b363-4f85-839c-1a7002bc8c3b	9	sapling	0.035
bde2a583-7f13-4971-bce6-c40fbb03b69f	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-3.88	0.00	27.86	2026-01-20 16:21:09.479096	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	9	sapling	0.024
3f560548-e0ed-4314-ac38-0b2bf8e6369a	040878d8-f0e3-48bc-919c-89c7814b8641	default	20.87	0.00	43.97	2026-01-20 15:43:56.078161	ce748baa-f09a-451b-8c04-7f1bd5ce8738	15	sapling	0.034
cd2f759f-c603-4bdf-aece-de09cc413e10	040878d8-f0e3-48bc-919c-89c7814b8641	default	18.40	0.00	41.52	2026-01-20 15:46:08.442657	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2	sapling	0.033
9364d88c-d1de-4f97-85ef-dcb57ab84adf	040878d8-f0e3-48bc-919c-89c7814b8641	default	17.10	0.00	42.22	2026-01-20 16:13:03.824482	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	1	sapling	0.032
21fe08ea-d9ea-4ddb-b5e9-436a7db365f8	0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	default	33.49	0.00	44.92	2026-01-20 15:43:25.649548	ce748baa-f09a-451b-8c04-7f1bd5ce8738	6	sapling	0.027
9253e6f1-122c-4f31-b9af-8806d8125e92	0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	default	33.36	0.00	42.50	2026-01-20 16:00:14.717988	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	8	sapling	0.043
a4db94be-e71d-4ed2-a6ae-b536f8e3a98a	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	default	43.55	0.00	44.34	2026-01-20 15:43:58.529739	ce748baa-f09a-451b-8c04-7f1bd5ce8738	4	sapling	0.042
ae03a5bf-b744-4530-9c58-3c9377fbbaa8	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	default	43.75	0.00	43.10	2026-01-20 15:47:39.423821	42296565-9379-4c71-9050-ad241a982245	8	sapling	0.032
49e91372-c21d-4437-84f6-649c54b12316	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	default	42.02	0.00	45.08	2026-01-20 16:14:19.870173	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	12	sapling	0.044
af27ba66-fec6-4d3a-b638-430bd819ad4e	ffe30495-7455-4198-a15d-56b44c289976	default	42.55	0.00	-4.75	2026-03-18 14:53:52.707525	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	38	young	0.131
dc30d4aa-46d3-4ad3-9d8f-6b85e63bf17c	ffe30495-7455-4198-a15d-56b44c289976	default	50.03	0.00	-5.20	2026-01-14 18:11:47.371098	feeab851-92a6-4209-ba8b-eecc2bb9cc06	102	mature	0.296
c20dc34c-1506-4e8c-8a89-09ece0e27af9	874490b4-c9c0-4f89-a460-b0d460a9387e	default	17.58	0.00	55.34	2026-03-19 06:45:00.019188	ee640e48-bad4-43b3-aa1c-e3881ccd93e7	33	young	0.122
eaad5429-4550-410b-bcca-24573f8dd673	ffe30495-7455-4198-a15d-56b44c289976	default	57.36	0.00	-5.62	2026-01-19 12:09:53.014304	42296565-9379-4c71-9050-ad241a982245	76	mature	0.281
760b9554-1093-456c-b56e-bb01c89b086f	ffe30495-7455-4198-a15d-56b44c289976	default	44.00	0.00	-4.27	2026-03-18 14:54:22.396768	7b097c73-5180-4538-b41e-6d115bfffbe1	43	young	0.112
9d490f27-2a78-4a4d-989d-ef54dcc42b7f	276ab066-e6de-4957-ae0c-ccea7b590ac9	default	68.40	0.00	64.82	2026-04-13 11:37:51.353075	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	10	sapling	0.022
8a7b5f4b-a24b-4e3f-b798-cab284c4e44f	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	default	40.03	0.00	65.96	2026-04-07 10:25:47.446183	b22e00c6-b363-4f85-839c-1a7002bc8c3b	12	sapling	0.049
08686f4b-d600-4781-9a23-0ff845b09848	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	default	44.99	0.00	69.60	2026-04-07 10:25:09.119323	31dd768d-262c-4545-9bd7-37451bd97469	32	young	0.149
4f88c621-1a07-4806-b588-67d80269653c	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	21.17	0.00	19.21	2026-01-17 08:46:18.964289	12999df0-1c40-4d9a-af5c-c7ceb082bc2b	63	mature	0.225
2c4a2b29-51c8-4b7d-8669-a1784922c876	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-9.00	0.00	2.82	2026-01-20 14:10:56.087714	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	24	young	0.142
0a02f50b-3c50-46a2-9de9-55964560bea2	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-2.70	0.00	2.23	2026-01-20 14:23:27.659438	80097d7b-8e1d-414e-96ed-f24ccbd10edd	18	sapling	0.046
d0bb96f2-8a69-4298-9970-4e6a9a35bba6	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-8.49	0.00	7.60	2026-01-20 15:55:56.653815	bdfd714f-988e-47ba-9f92-181d2dd608d0	12	sapling	0.022
fd681cde-f515-44a8-be06-6800039ebf5f	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-5.78	0.00	8.15	2026-01-20 15:56:20.984622	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	10	sapling	0.036
4ca3db50-9b49-47ec-a8f1-acad9bf4bdf5	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-2.10	0.00	7.98	2026-01-20 20:11:43.488708	7b097c73-5180-4538-b41e-6d115bfffbe1	8	sapling	0.030
3c5bcfd9-cb36-4b8f-8226-3aa6da26e6ac	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-6.75	0.00	6.67	2026-01-20 20:12:33.259136	53966428-2831-47fb-b171-e7a405044c83	16	sapling	0.031
7ac80287-9f57-4801-a579-ba1250b4573b	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	6.44	0.00	8.91	2026-01-20 20:16:46.407253	31dd768d-262c-4545-9bd7-37451bd97469	8	sapling	0.039
9e4cee63-586f-456d-9591-8ac4d5576a5b	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	9.86	0.00	9.50	2026-01-20 20:17:12.958137	218ebb52-1322-4f7f-9e84-6a92b6cb525e	8	sapling	0.041
0d387edf-62a8-4fe1-861a-a407f2fecab1	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	5.21	0.00	2.51	2026-01-21 12:20:06.943767	42296565-9379-4c71-9050-ad241a982245	13	sapling	0.039
3391c2ad-6703-44b9-96fb-f5a57412fdf5	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-2.83	0.00	14.39	2026-01-21 12:21:26.618925	49154be8-0d8b-410d-a200-e0b7794271ef	7	sapling	0.034
2b2641af-4370-472d-9c97-7a5fb43897e4	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-6.73	0.00	18.14	2026-01-21 12:22:08.641898	36e8f64d-341c-4c0b-86fa-531a28d5e98b	7	sapling	0.032
4aee7898-f7a6-46ad-b625-2464a8e5c0c9	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	default	14.23	0.00	69.24	2026-04-03 16:41:56.389334	456c1be6-40da-4f3d-9810-ea8e87e72afc	8	sapling	0.046
c2ab3708-97ae-43aa-8cbf-a79b0ae3e631	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	8.65	0.00	21.59	2026-01-20 15:46:51.391507	42296565-9379-4c71-9050-ad241a982245	2	sapling	0.035
1bd5fb5b-252c-4f2a-a804-255fd3729ea5	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	3.91	0.00	18.09	2026-01-20 15:47:11.401222	49154be8-0d8b-410d-a200-e0b7794271ef	10	sapling	0.039
f1cdecfd-e54c-4b1a-95b7-7ae9939868c6	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	2.18	0.00	18.55	2026-01-20 15:47:36.239489	36e8f64d-341c-4c0b-86fa-531a28d5e98b	2	sapling	0.041
b4c35f06-09e1-4354-b034-e4ddff5a4da8	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	8.69	0.00	16.71	2026-01-20 15:48:00.177126	5073320b-3b03-41d8-84df-a5aa48ffbc01	2	sapling	0.028
ed852d70-52c1-4523-a755-4e6c847ffb11	174f733f-81e5-40e4-8cbc-79393d695328	default	57.63	0.00	14.01	2026-01-20 15:51:08.791965	bdfd714f-988e-47ba-9f92-181d2dd608d0	12	sapling	0.036
609c242d-a799-4e49-ae5b-45c5d480ac8e	174f733f-81e5-40e4-8cbc-79393d695328	default	55.08	0.00	20.96	2026-01-20 16:11:40.878093	b22e00c6-b363-4f85-839c-1a7002bc8c3b	15	sapling	0.029
6631a307-62c3-4768-8918-083220b6a8a5	174f733f-81e5-40e4-8cbc-79393d695328	default	55.14	0.00	18.28	2026-01-20 16:13:45.361046	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	5	sapling	0.049
d2d87fc1-0442-481a-9d6b-eb1936ba3cc8	174f733f-81e5-40e4-8cbc-79393d695328	default	52.56	0.00	14.44	2026-01-20 16:17:37.471201	feeab851-92a6-4209-ba8b-eecc2bb9cc06	5	sapling	0.049
9017fca0-10ed-4db3-8e34-4baa56800773	174f733f-81e5-40e4-8cbc-79393d695328	default	54.27	0.00	14.23	2026-01-20 16:19:27.693906	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	5	sapling	0.030
9420fbb3-808e-4303-b51f-549f5fb8f104	174f733f-81e5-40e4-8cbc-79393d695328	default	51.02	0.00	18.06	2026-01-20 16:38:33.655118	aa9e3701-fb93-48f8-a475-52de830e3b4b	5	sapling	0.021
8b9c4826-fd0b-4831-ba2e-ba24d8ee0580	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-5.20	0.00	31.18	2026-01-20 15:40:38.617141	42296565-9379-4c71-9050-ad241a982245	19	sapling	0.026
455e340b-816b-43c0-b1ca-fcfb6bce4444	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-7.76	0.00	26.57	2026-01-20 15:43:43.740599	ce748baa-f09a-451b-8c04-7f1bd5ce8738	31	young	0.134
c84225a8-0c44-4a0a-b575-cbbf4e6f2e8e	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-6.97	0.00	30.63	2026-01-20 15:48:07.145454	31dd768d-262c-4545-9bd7-37451bd97469	25	young	0.136
d9319bd2-6a61-4883-bccd-374b40f06873	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-3.28	0.00	26.59	2026-01-20 16:12:46.266851	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	15	sapling	0.020
c14bd6dd-6b4a-48b6-9ae1-24cff33027db	969815d1-4be3-4634-a93e-ac7f4deb8706	default	-2.05	0.00	26.59	2026-01-20 16:17:30.930982	feeab851-92a6-4209-ba8b-eecc2bb9cc06	9	sapling	0.040
66ac7611-3848-4cf0-9712-7c1ba006b565	969815d1-4be3-4634-a93e-ac7f4deb8706	default	4.08	0.00	31.04	2026-01-20 16:23:26.073837	8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	9	sapling	0.049
9da377e5-5a5d-4be3-a2f0-9603c781e476	040878d8-f0e3-48bc-919c-89c7814b8641	default	15.28	0.00	39.06	2026-01-20 15:45:47.257441	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	8	sapling	0.046
94ff39db-6383-4527-bef5-142af16fdb55	040878d8-f0e3-48bc-919c-89c7814b8641	default	17.86	0.00	38.91	2026-01-20 15:46:47.617661	29bcad8b-4816-46ed-9b55-68ecb72eed73	8	sapling	0.034
b3a92065-707a-41b4-b31e-8b2d96cb6a70	040878d8-f0e3-48bc-919c-89c7814b8641	default	14.65	0.00	44.53	2026-01-20 15:47:24.617451	31dd768d-262c-4545-9bd7-37451bd97469	2	sapling	0.021
467246c8-8979-4756-aeb5-ac94fe8d1fa3	040878d8-f0e3-48bc-919c-89c7814b8641	default	21.85	0.00	38.24	2026-01-20 16:00:06.175902	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	1	sapling	0.033
5ea75232-31bb-4511-8540-b3b72c723948	040878d8-f0e3-48bc-919c-89c7814b8641	default	20.96	0.00	45.32	2026-01-20 16:22:55.858701	feeab851-92a6-4209-ba8b-eecc2bb9cc06	1	sapling	0.032
22f2b3bf-fcf9-4f8b-9f81-2fff5bdee551	0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	default	33.12	0.00	39.20	2026-01-20 16:15:15.766903	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2	sapling	0.027
28087659-9b6b-4526-a250-689237766d8b	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	default	39.87	0.00	38.75	2026-01-20 16:17:11.030026	49154be8-0d8b-410d-a200-e0b7794271ef	1	sapling	0.020
f9a65b3b-53d5-4382-87af-01c8c01c9064	874490b4-c9c0-4f89-a460-b0d460a9387e	default	14.63	0.00	51.49	2026-03-20 09:17:34.215576	29bcad8b-4816-46ed-9b55-68ecb72eed73	20	sapling	0.033
f2a70efd-e2f9-4b3c-be7c-d68377a5bb1e	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	default	64.36	0.00	43.09	2026-04-05 21:25:06.682808	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	17	sapling	0.027
4ea648d5-7fd4-4998-9781-a67860a65a54	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	default	68.66	0.00	45.53	2026-04-05 21:26:44.684323	31dd768d-262c-4545-9bd7-37451bd97469	11	sapling	0.032
49ff5c0a-2928-472f-8157-28802a71c90b	de6756c2-06f2-412b-bbdc-d498a406d0b8	default	9.77	0.00	69.31	2026-04-03 16:30:17.960914	7b097c73-5180-4538-b41e-6d115bfffbe1	15	sapling	0.022
6760fbd1-f390-4820-a6bc-b75cf8322230	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	7.67	0.00	4.69	2026-01-21 12:24:55.454061	6cc95dc7-b514-460f-aa99-66d5efece4e7	7	sapling	0.050
f323b3c4-1008-4790-8bd0-ce03a6a6ec03	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	2.14	0.00	4.23	2026-03-18 16:15:29.427071	9278c916-8a13-4013-ab69-5f0697395202	4	sapling	0.042
78cfdf28-5dc7-4120-9c6d-3a146b9957da	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	default	65.98	0.00	4.96	2026-04-15 08:42:41.269154	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	1	sapling	0.023
d964d11d-e60f-4b3d-8a65-ac9a754fe315	ffe30495-7455-4198-a15d-56b44c289976	default	43.09	0.00	-6.78	2026-03-18 14:54:14.351785	31dd768d-262c-4545-9bd7-37451bd97469	38	young	0.119
f6130aea-87dd-43fd-9df1-6f78de6ccd92	ffe30495-7455-4198-a15d-56b44c289976	default	53.63	0.00	-3.76	2026-01-19 15:43:37.038631	29bcad8b-4816-46ed-9b55-68ecb72eed73	68	mature	0.299
d12f7f1f-f5d7-4c03-9826-4d5bbea71d39	ffe30495-7455-4198-a15d-56b44c289976	default	52.17	0.00	-2.42	2026-01-19 12:10:17.200756	36e8f64d-341c-4c0b-86fa-531a28d5e98b	77	mature	0.288
3e98fa81-8e16-4aea-93ee-4600e7eb01d0	ffe30495-7455-4198-a15d-56b44c289976	default	50.42	0.00	-3.33	2026-01-19 15:26:02.517441	b22e00c6-b363-4f85-839c-1a7002bc8c3b	69	mature	0.240
6d847f33-c581-40dd-8f77-021e30316810	ffe30495-7455-4198-a15d-56b44c289976	default	45.36	0.00	5.99	2026-01-20 10:08:38.65468	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	66	mature	0.281
becbe4b3-7e23-43c6-86d0-780f0023d10c	ffe30495-7455-4198-a15d-56b44c289976	default	43.60	0.00	-2.35	2026-03-18 14:54:30.811797	80097d7b-8e1d-414e-96ed-f24ccbd10edd	38	young	0.103
e819cc15-fe73-4173-b0a2-7d14b095a8bf	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	default	43.20	0.00	63.63	2026-04-07 10:29:00.772158	6cc95dc7-b514-460f-aa99-66d5efece4e7	11	sapling	0.032
3049478a-99e8-4088-bb6d-886d071eb7e3	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	default	39.78	0.00	64.14	2026-04-07 10:27:30.011013	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	21	young	0.112
2a35ebc8-7dd7-4dd0-be8d-04c61282a059	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	20.83	0.00	21.24	2026-04-15 09:10:34.101965	42296565-9379-4c71-9050-ad241a982245	5	sapling	0.049
7fd08c7b-fee0-40c7-bb7e-e2feddb8d728	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	30.36	0.00	4.89	2025-12-29 23:46:25.73343	0b1a16a9-c712-4195-ad7d-e37abffa1074	81	mature	0.272
4aa396b0-682a-4e60-a72a-d193ef4a7137	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	28.46	0.00	6.58	2026-01-13 22:46:59.30409	f212470c-195f-4d65-a9a8-d9015cce8bf3	71	mature	0.289
d068bbbb-f8f6-4a58-8b95-debc70a46daf	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	31.34	0.00	2.99	2026-01-01 04:46:40.509022	bdfd714f-988e-47ba-9f92-181d2dd608d0	69	mature	0.270
4b7c865d-455f-4bf6-8014-1fe793239537	25b3474d-3d76-4f58-8494-c169d3160e7f	default	28.29	0.00	64.08	2026-04-03 16:43:32.491544	0b1a16a9-c712-4195-ad7d-e37abffa1074	3	sapling	0.041
728267f3-8ddb-46d1-bc8d-5ad768ae724b	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	26.05	0.00	9.98	2026-01-02 07:36:44.962783	7b097c73-5180-4538-b41e-6d115bfffbe1	75	mature	0.209
84b32e9a-9d70-48f7-847b-fb66854cfdc9	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	16.36	0.00	21.47	2026-01-17 07:17:03.163506	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	67	mature	0.256
26b03d01-1aef-40e1-ab52-358b3f22d465	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	default	62.02	0.00	42.48	2026-03-07 16:20:03.121169	218ebb52-1322-4f7f-9e84-6a92b6cb525e	38	young	0.137
d3c12e15-dd25-48e4-b160-9020b9e8d001	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-9.24	0.00	8.84	2026-01-20 14:22:29.398044	29bcad8b-4816-46ed-9b55-68ecb72eed73	24	young	0.144
2946b39d-c0aa-4229-bc22-8d4f5dca0dfe	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-3.58	0.00	7.54	2026-01-20 14:26:03.809971	8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	14	sapling	0.023
76be3ee1-db9b-4741-80b1-d7a724052fe5	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	21.54	0.00	3.49	2025-12-26 22:06:06.215409	1bab2d7d-d2ac-4887-b379-bd9fb6d8793b	93	mature	0.208
b959a6ea-2e2b-4be3-9a6a-fe7b5bc96e61	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	18.57	0.00	9.73	2025-12-27 16:10:28.41358	d3237f56-375d-400f-a9df-abbb5b145c8d	140	mature	0.270
49e85520-f529-4960-be79-ebfe4be274e1	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	15.82	0.00	8.44	2025-12-27 22:11:31.187536	49a47427-e93f-439c-ac10-bf089760aa79	135	mature	0.260
1f8201aa-b834-46f4-ac2b-240cfe1c7acc	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	28.42	0.00	9.47	2025-12-31 10:56:52.682759	bc73bf39-0c3b-4e6b-8bba-372f4fbe59d4	110	mature	0.210
34c9f37b-4315-450c-a073-6390786d098f	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	30.24	0.00	6.37	2026-01-11 23:36:25.900578	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	115	mature	0.220
b89ca92f-3d69-4cb4-baa2-f35d1233e0ee	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	4.12	0.00	9.72	2026-03-18 16:20:33.738763	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	4	sapling	0.032
634806e1-96d0-4b36-95a7-4a718f57f148	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	13.54	0.00	2.41	2025-12-29 05:12:22.192782	6da2f0d2-d40d-4222-b308-6c2efc4cbb02	105	mature	0.200
e67500f2-dce5-4488-8083-eb95151660a0	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	14.39	0.00	3.77	2025-12-25 09:42:51.331337	aa9e3701-fb93-48f8-a475-52de830e3b4b	130	mature	0.250
287fb69c-7ebc-4082-a62f-f6f49f378b9d	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	19.01	0.00	7.90	2025-12-18 16:41:25.633734	a9a29dc6-7c51-4be2-87c9-c3e7cc145b33	99	mature	0.246
30ea1796-7b7b-4edc-9d19-60b7e3dd92c4	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	17.52	0.00	8.17	2025-12-20 06:55:13.709589	7e613eb6-ce9d-48ee-94f9-c3418383ccba	90	mature	0.203
228da6de-ad8c-4f24-9d85-38aa1fd266f7	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	default	-2.80	0.00	3.88	2026-01-20 20:15:22.399798	feeab851-92a6-4209-ba8b-eecc2bb9cc06	10	sapling	0.035
108b92c8-d1b2-42b2-971a-5ba2036d65ed	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	18.52	0.00	3.68	2025-12-23 11:21:54.372716	b145ef6a-52a8-4b14-95d6-3cdbac6f9e11	120	mature	0.230
d522278d-f2c8-4d1f-9848-665b417af79f	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	14.09	0.00	8.45	2025-12-29 18:17:18.771081	a92d629c-e2a4-47ef-a3b4-825f69d8de54	92	mature	0.205
332bf4da-016f-42dc-b5a9-d991a0861d5a	de6756c2-06f2-412b-bbdc-d498a406d0b8	default	6.55	0.00	67.12	2026-04-03 16:35:05.443881	53966428-2831-47fb-b171-e7a405044c83	9	sapling	0.037
89e33f0e-754f-4418-b6c6-0e84f4ecbc31	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	6.01	0.00	14.71	2026-01-20 15:38:16.599805	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	14	sapling	0.047
ed433e23-7648-4cd2-8084-024c43be9322	4763666e-100e-4e28-a0e5-31f0f0fe6b31	default	14.24	0.00	14.90	2026-01-21 16:34:14.631263	0b1a16a9-c712-4195-ad7d-e37abffa1074	1	sapling	0.026
c6f411fb-6b4d-412f-af40-33e043ae57dd	ef4bfe44-a53e-4acf-8412-6a1a913da692	default	31.94	0.00	5.13	2026-01-03 17:22:13.250068	456c1be6-40da-4f3d-9810-ea8e87e72afc	155	mature	0.290
5c82f069-6b0d-4813-b7da-692e71bc141d	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	default	39.42	0.00	41.44	2026-01-21 16:34:19.580108	0b1a16a9-c712-4195-ad7d-e37abffa1074	1	sapling	0.027
06c18b04-6aef-4f8d-b0f7-abbbe9c14a16	ffe30495-7455-4198-a15d-56b44c289976	default	44.94	0.00	-9.49	2026-01-12 14:21:44.351558	6da2f0d2-d40d-4222-b308-6c2efc4cbb02	108	mature	0.299
f61c40b2-868b-4b43-bb1f-2380b641d7d1	ffe30495-7455-4198-a15d-56b44c289976	default	42.26	0.00	-8.74	2026-01-13 15:30:04.064335	0b1a16a9-c712-4195-ad7d-e37abffa1074	116	mature	0.201
64fa7ebf-8ff0-4352-8418-eccb0bc825fd	ffe30495-7455-4198-a15d-56b44c289976	default	45.60	0.00	-7.20	2026-01-13 15:30:51.923435	49a47427-e93f-439c-ac10-bf089760aa79	102	mature	0.279
354c97c1-fa44-4733-841b-ffd541104072	ffe30495-7455-4198-a15d-56b44c289976	default	45.98	0.00	-2.83	2026-01-14 08:40:03.484154	5073320b-3b03-41d8-84df-a5aa48ffbc01	95	mature	0.211
afa0c109-9b12-4ac0-b516-9eeec66520d3	ffe30495-7455-4198-a15d-56b44c289976	default	57.23	0.00	-4.13	2026-01-19 11:39:16.623644	a92d629c-e2a4-47ef-a3b4-825f69d8de54	87	mature	0.233
4f9e6cb4-b00d-41e7-9a79-18047decb822	ffe30495-7455-4198-a15d-56b44c289976	default	54.00	0.00	-8.23	2026-01-19 12:10:09.780746	49154be8-0d8b-410d-a200-e0b7794271ef	77	mature	0.251
8be5c334-5200-43b0-a310-a4ea30ac800c	ffe30495-7455-4198-a15d-56b44c289976	default	52.61	0.00	-5.11	2026-01-19 12:27:18.440045	6cc95dc7-b514-460f-aa99-66d5efece4e7	74	mature	0.213
47092425-abe4-45a8-b249-677fdeb1c2fb	ffe30495-7455-4198-a15d-56b44c289976	default	51.90	0.00	-7.93	2026-01-19 15:04:57.753709	456c1be6-40da-4f3d-9810-ea8e87e72afc	76	mature	0.205
5da90acb-2197-4af6-a7d1-b7403e9db072	ffe30495-7455-4198-a15d-56b44c289976	default	39.05	0.00	-8.83	2026-01-20 15:43:41.490992	ce748baa-f09a-451b-8c04-7f1bd5ce8738	60	mature	0.262
38c0c701-6e1f-4f81-b49e-5c3b445d4667	ffe30495-7455-4198-a15d-56b44c289976	default	38.81	0.00	-6.42	2026-01-09 09:39:03.755515	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	129	mature	0.269
efbfd9be-67b7-4692-a6d5-8490ac1609d2	ffe30495-7455-4198-a15d-56b44c289976	default	38.94	0.00	8.25	2026-04-02 10:53:39.664313	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	24	young	0.148
7bb54d3a-8820-470d-9360-02fb7d8f63d4	ffe30495-7455-4198-a15d-56b44c289976	default	40.04	0.00	4.34	2026-04-15 08:44:25.155201	8987fd0c-2c2f-49fe-83e3-bc6985fd1985	2	sapling	0.042
57c8d1bb-4343-47d8-aa38-e668209eb5a1	ffe30495-7455-4198-a15d-56b44c289976	default	54.86	0.00	-4.75	2026-01-19 10:32:43.07283	218ebb52-1322-4f7f-9e84-6a92b6cb525e	95	mature	0.244
129a682b-0e36-4415-b9e6-54b035a6b8d6	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	default	41.63	0.00	65.70	2026-04-07 10:39:15.031489	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	7	sapling	0.046
9a4379fc-b2e7-416a-800d-471037f2860e	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	default	62.58	0.00	20.63	2026-04-15 15:40:02.610174	42296565-9379-4c71-9050-ad241a982245	1	sapling	0.037
9d0ec588-f9e1-498b-8fe5-10db6ff0e497	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	default	65.25	0.00	15.27	2026-04-15 15:36:33.370531	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	6	sapling	0.030
1af48f9f-2eba-4e3d-9db0-3fbbabb2f847	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	default	17.14	0.00	66.12	2026-04-03 16:35:26.302191	bdfd714f-988e-47ba-9f92-181d2dd608d0	36	young	0.139
a502253b-6f11-4d6a-8a0a-5a6033c2563d	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	default	41.69	0.00	69.04	2026-04-07 10:42:23.118262	42296565-9379-4c71-9050-ad241a982245	12	sapling	0.036
afa14537-4c6a-4df8-8b26-1c735e9d5d7c	de6756c2-06f2-412b-bbdc-d498a406d0b8	default	5.29	0.00	62.12	2026-04-03 16:35:38.656233	31dd768d-262c-4545-9bd7-37451bd97469	4	sapling	0.034
db88545c-eb8a-42ef-b29e-07fa1265f237	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	default	38.20	0.00	66.80	2026-04-07 10:42:52.102654	49154be8-0d8b-410d-a200-e0b7794271ef	7	sapling	0.048
cd3cac53-f212-4920-a6db-630bd3fc96f4	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	default	15.16	0.00	63.68	2026-04-03 16:36:29.313724	218ebb52-1322-4f7f-9e84-6a92b6cb525e	15	sapling	0.043
ef7dce54-ba57-42d8-be0f-4eb3f3605d4b	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	default	14.48	0.00	67.94	2026-04-03 16:37:07.554428	53966428-2831-47fb-b171-e7a405044c83	15	sapling	0.030
3e415d54-8019-45e3-bde7-62689c5c9f45	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	default	14.44	0.00	65.68	2026-04-03 16:38:51.977894	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	9	sapling	0.040
180fa32c-46f3-49e4-beb0-08fe83833c09	108873fe-b2e0-43a8-be0c-36f567e480cb	default	62.21	0.00	52.70	2026-03-19 10:24:25.304835	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	201	mature	0.270
bf9d3faf-cee6-4893-81f4-b44f2be251c9	108873fe-b2e0-43a8-be0c-36f567e480cb	default	69.25	0.00	53.05	2026-03-19 10:49:49.694708	8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	172	mature	0.210
b1e7eca2-c081-4fde-8ea9-f7ebbe6bc3c3	108873fe-b2e0-43a8-be0c-36f567e480cb	default	68.71	0.00	57.58	2026-03-19 10:52:27.800415	218ebb52-1322-4f7f-9e84-6a92b6cb525e	170	mature	0.267
9499cd13-6a0c-47fe-90c9-34172f109e2a	108873fe-b2e0-43a8-be0c-36f567e480cb	default	69.70	0.00	55.18	2026-03-19 10:49:28.171905	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	171	mature	0.250
2ec672e7-0553-4488-831d-f02c951bc038	108873fe-b2e0-43a8-be0c-36f567e480cb	default	65.51	0.00	52.04	2026-03-19 10:51:55.86015	5073320b-3b03-41d8-84df-a5aa48ffbc01	172	mature	0.254
4154c87f-bc4d-4dc1-83af-07331ffd42ed	108873fe-b2e0-43a8-be0c-36f567e480cb	default	62.28	0.00	57.80	2026-03-20 09:16:14.514875	80097d7b-8e1d-414e-96ed-f24ccbd10edd	134	mature	0.223
0cbabd8d-fb0e-43eb-a81f-750b87d7dfc2	108873fe-b2e0-43a8-be0c-36f567e480cb	default	62.54	0.00	50.68	2026-03-19 14:12:48.034484	31dd768d-262c-4545-9bd7-37451bd97469	149	mature	0.213
a6466ee2-f347-46c1-a7fb-062e1b111c17	108873fe-b2e0-43a8-be0c-36f567e480cb	default	67.37	0.00	53.53	2026-03-19 10:50:34.08449	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	182	mature	0.260
df1a9cbf-89e0-4748-895b-a9ecb12fd42b	108873fe-b2e0-43a8-be0c-36f567e480cb	default	69.97	0.00	50.48	2026-03-20 09:18:45.402524	42296565-9379-4c71-9050-ad241a982245	134	mature	0.255
6579fff6-52b3-4700-a96e-115ee3d82072	108873fe-b2e0-43a8-be0c-36f567e480cb	default	64.85	0.00	55.17	2026-03-19 10:30:13.699653	29bcad8b-4816-46ed-9b55-68ecb72eed73	185	mature	0.263
\.


--
-- Data for Name: gallery_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gallery_images (id, user_task_id, user_id, task_id, photo_url, uploaded_at, approved_at, approved_by) FROM stdin;
c2a99ee6-b64c-4f9e-a09e-286dcc4abb47	8c8e2537-512a-4d69-93da-0c913566bc73	ffe30495-7455-4198-a15d-56b44c289976	a92d629c-e2a4-47ef-a3b4-825f69d8de54	https://luise.bio/uploads/task-photo-1768822723888-276511100.jpg	2026-01-19 11:38:44.83	2026-01-19 11:39:16.616682	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b
d4644442-1f7a-44c4-b63e-6c7a56755392	e4f331f6-3f9a-4347-975c-c65a099b646c	ffe30495-7455-4198-a15d-56b44c289976	456c1be6-40da-4f3d-9810-ea8e87e72afc	https://luise.bio/uploads/task-photo-1768835059798-967506220.png	2026-01-19 15:04:20.153	2026-01-19 15:04:57.746349	b03443d3-fa3e-407d-9dcf-ad0e1b246b04
fce10112-7efe-4f67-ae18-00282886fb35	6e370ed6-3ead-4499-b6a0-0e161dbd03e7	174f733f-81e5-40e4-8cbc-79393d695328	8987fd0c-2c2f-49fe-83e3-bc6985fd1985	https://luise.bio/uploads/task-photo-1768924209402-86981607.jpg	2026-01-20 15:50:09.768	2026-01-21 16:34:10.256675	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b
2d4117bf-e1fe-4e75-9615-6f90bb089c72	1cb714b5-73a2-443e-af1f-8f6855378df4	4763666e-100e-4e28-a0e5-31f0f0fe6b31	0b1a16a9-c712-4195-ad7d-e37abffa1074	https://luise.bio/uploads/task-photo-1768923966561-165480125.jpeg	2026-01-20 15:46:07.324	2026-01-21 16:34:14.628631	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b
ee6cc4e0-3795-4a00-b875-eb4b8a46c4f2	1f019af9-2ae0-47fd-9084-c88278b91f3b	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	0b1a16a9-c712-4195-ad7d-e37abffa1074	https://luise.bio/uploads/task-photo-1768923907334-293958618.jpeg	2026-01-20 15:45:07.83	2026-01-21 16:34:19.577745	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b
2c705638-570e-4700-ac72-468688680c43	eb3a282f-5e05-4c10-a0e7-266c0484f721	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	456c1be6-40da-4f3d-9810-ea8e87e72afc	https://luise.bio/uploads/task-photo-1768998452421-973110856.jpg	2026-01-21 12:27:32.873	2026-03-17 17:40:03.269761	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b
73498b15-b924-4494-86b1-9ce6cc8f0059	ba0f8fed-75ff-4655-b84d-ee20aa2e3adb	874490b4-c9c0-4f89-a460-b0d460a9387e	ee640e48-bad4-43b3-aa1c-e3881ccd93e7	https://luise.bio/uploads/task-photo-1773841280576-520684489.webp	2026-03-18 13:41:20.803	2026-03-19 06:45:00.011103	b03443d3-fa3e-407d-9dcf-ad0e1b246b04
cf122184-6545-4078-8f65-258cf7326958	e3eaf184-8e82-4a90-8cd7-5d4f73c17e82	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	456c1be6-40da-4f3d-9810-ea8e87e72afc	https://luise.bio/uploads/task-photo-1775233800768-881350761.png	2026-04-03 16:30:01.986	2026-04-03 16:41:56.382003	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b
e0cf4221-4791-4015-ae16-43f6103cdf7d	18d29fe6-2793-48c1-9b80-1b58a1eae40e	25b3474d-3d76-4f58-8494-c169d3160e7f	0b1a16a9-c712-4195-ad7d-e37abffa1074	https://luise.bio/uploads/task-photo-1775234561563-638456829.jpg	2026-04-03 16:42:44.012	2026-04-03 16:43:32.483097	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b
7d9e0cc7-d841-4a6f-b66a-455e1f10d7e8	8152f973-07db-4222-9974-27bc3e7986fb	e503c22a-ac49-4154-b7d3-648f0f08ccc7	d23b70e4-ab37-4c2a-a8fa-717869ff7338	https://luise.bio/uploads/task-photo-1775588874098-127947399.jpg	2026-04-07 19:07:54.973	2026-04-10 10:06:23.988418	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b
b764cc18-9bb7-4df7-a01d-2d640ea59a79	e5dc48d4-1da0-41b8-b7ef-c381c5802d9e	ffe30495-7455-4198-a15d-56b44c289976	8987fd0c-2c2f-49fe-83e3-bc6985fd1985	https://luise.bio/uploads/task-photo-1776242493861-387851231.jpeg	2026-04-15 08:41:35.589	2026-04-15 08:44:25.146917	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b
\.


--
-- Data for Name: guest_task_completions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guest_task_completions (id, guest_session_id, task_id, completion_data, created_at, merged_user_id, merged_at) FROM stdin;
3ca5b343-6ed9-4cee-b579-72c800663e49	af0b727b-df07-49bd-adb6-f71ba43dfba7	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	{}	2026-04-13 09:52:13.683071+00	\N	2026-04-13 09:54:08.735473+00
416efc88-df63-4ea1-8622-c0c3587e4c1a	a8eeaa0b-9f62-4f5e-880f-46ab5ae21fc2	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	{}	2026-04-08 12:46:03.274897+00	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	2026-04-15 08:42:41.27188+00
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (id, name, description, is_online, address, latitude, longitude, created_at, updated_at, active, category, category_description, name_i18n, description_i18n, address_i18n, category_description_i18n) FROM stdin;
4176d288-0a11-4c63-ae49-8c52e24fb036	tortuuga - Fashion. Upcycling	Tortuuga hat eine großartige Auswahl von Schuhen, Schmuck über Accessoires bis zu Klamotten. „Die Idee von tortuuga kam aus der Vision eine bessere Welt für unsere Kinder zu hinterlassen in Kombination mit meiner Leidenschaft für Mode.“ – Inhaberin Carmen Padilla	f	8, Obere Karlstraße, Innenstadt, Erlangen, Bayern, 91054, Deutschland	49.596734	11.008540	2026-01-13 16:00:34.49063	2026-01-13 16:00:34.49063	t	external	\N	{"de": "tortuuga - Fashion. Upcycling", "en": "tortuuga - Fashion. Upcycling"}	{"de": "Tortuuga hat eine großartige Auswahl von Schuhen, Schmuck über Accessoires bis zu Klamotten. „Die Idee von tortuuga kam aus der Vision eine bessere Welt für unsere Kinder zu hinterlassen in Kombination mit meiner Leidenschaft für Mode.“ – Inhaberin Carmen Padilla", "en": "Tortuuga has a great selection from shoes, jewelry to accessories and clothes. “The idea of ​​tortuuga came from the vision of leaving a better world for our children combined with my passion for fashion.” – Owner Carmen Padilla"}	{"de": "8, Obere Karlstraße, Innenstadt, Erlangen, Bayern, 91054, Deutschland", "en": "8, Obere Karlstrasse, Downtown, Erlangen, Bavaria, 91054, Germany"}	{}
e24f97e1-81fb-496e-a48f-9ce29a6be570	Die Luise - Gut schlafen können.	Hotel Luise	f	10, Sophienstraße, Innenstadt, Erlangen, Bayern, 91052, Deutschland	49.589614	11.014692	2026-01-05 18:23:04.097437	2026-01-13 16:03:24.984391	t	hotel_reception	\N	{"de": "Die Luise - Gut schlafen können.", "en": "Luise - being able to sleep well."}	{"de": "Hotel Luise", "en": "Hotel Luise"}	{"de": "10, Sophienstraße, Innenstadt, Erlangen, Bayern, 91052, Deutschland", "en": "10, Sophienstrasse, Downtown, Erlangen, Bavaria, 91052, Germany"}	{}
50cfe2f2-a82e-43cb-8366-aaa7235d58e1	Online	Default online location	t	\N	\N	\N	2025-12-04 11:07:52.058089	2025-12-04 11:07:52.058089	t	online	\N	{"de": "Online", "en": "On-line"}	{"de": "Default online location", "en": "Default online location"}	{}	{}
3de02628-9fd7-4fab-8bd2-8bb782bd1005	Berlin Lobby	Main lobby area for in-person challenges and rewards pick-up.	f	Alexanderplatz 5, 10178 Berlin, Germany	52.521900	13.413200	2025-12-04 11:14:44.227931	2026-04-15 16:08:35.849962	f	physical	\N	{"de": "Berlin Lobby", "en": "Berlin lobby"}	{"de": "Main lobby area for in-person challenges and rewards pick-up.", "en": "Main lobby area for in-person challenges and rewards pick-up."}	{"de": "Alexanderplatz 5, 10178 Berlin, Germany", "en": "Alexanderplatz 5, 10178 Berlin, Germany"}	{}
1f3f610a-bbe3-4bf4-82a2-d948a48fb78a	Salz und Pfeffer - Slow Food Restaurant	Seit Jahren arbeitet Bonifacio Vincenzi, auch als Ivan bekannt, als kreativer Koch für das Salz + Pfeffer. Seit 2011 ist er der erste Slow Food Förderer Erlangens.	f	19, Hartmannstraße, Röthelheimpark, Erlangen, Bayern, 91052, Deutschland	49.593522	11.021946	2026-01-13 16:02:51.622738	2026-01-13 16:02:51.622738	t	external	\N	{"de": "Salz und Pfeffer - Slow Food Restaurant", "en": "Salt and Pepper - Slow Food Restaurant"}	{"de": "Seit Jahren arbeitet Bonifacio Vincenzi, auch als Ivan bekannt, als kreativer Koch für das Salz + Pfeffer. Seit 2011 ist er der erste Slow Food Förderer Erlangens.", "en": "Bonifacio Vincenzi, also known as Ivan, has been working as a creative chef for Salt + Pepper for years. He has been Erlangen's first Slow Food sponsor since 2011."}	{"de": "19, Hartmannstraße, Röthelheimpark, Erlangen, Bayern, 91052, Deutschland", "en": "19, Hartmannstrasse, Röthelheimpark, Erlangen, Bavaria, 91052, Germany"}	{}
cf24c5e1-e427-46a2-a265-8ffa29ebb843	Hundsgemütlich	Im Hundsgemütlich findest du alles, was das Hundebesitzer-Herz begehrt. \nVon ausgewählten Artikeln verschiedenster Anbieter bis hin zu eigenen, einzigartigen und individuellen Kollektionen.\nWir legen im Einkauf Wert auf Qualität und Regionalität und im Versand auf eine nachhaltige Verpackung.	f	41, Hauptstraße, Innenstadt, Erlangen, Bayern, 91054, Deutschland	49.598607	11.003262	2026-01-19 11:46:51.066025	2026-01-19 11:46:51.066025	t	physical	\N	{"de": "Hundsgemütlich", "en": "Cozy as a dog"}	{"de": "Im Hundsgemütlich findest du alles, was das Hundebesitzer-Herz begehrt. \\nVon ausgewählten Artikeln verschiedenster Anbieter bis hin zu eigenen, einzigartigen und individuellen Kollektionen.\\nWir legen im Einkauf Wert auf Qualität und Regionalität und im Versand auf eine nachhaltige Verpackung.", "en": "At Hundsgemütlich you will find everything a dog owner's heart desires. \\nFrom selected items from various suppliers to our own, unique and individual collections.\\nWe value quality and regionality when purchasing and sustainable packaging when shipping."}	{"de": "41, Hauptstraße, Innenstadt, Erlangen, Bayern, 91054, Deutschland", "en": "41, Hauptstrasse, Downtown, Erlangen, Bavaria, 91054, Germany"}	{}
4f2e6075-ab6f-4f37-9882-e31f01cabfe5	Hempels Burger	Hier bekommst du nicht nur hervorragende Fair-Fleisch Burger, sondern es gibt auch eine tolle Auswahl an veggie und veganen Burgern. Alles handgemacht. Unser Tipp: die Pommes sind fabelhaft!	f	18, Marquardsenstraße, Innenstadt, Erlangen, Bayern, 91054, Deutschland	49.597475	11.015115	2026-03-17 17:46:02.748127	2026-03-17 17:46:02.748127	t	physical	\N	{"de": "Hempels Burger", "en": "Hempel's burger"}	{"de": "Hier bekommst du nicht nur hervorragende Fair-Fleisch Burger, sondern es gibt auch eine tolle Auswahl an veggie und veganen Burgern. Alles handgemacht. Unser Tipp: die Pommes sind fabelhaft! ", "en": "Here you not only get excellent fair meat burgers, but there is also a great selection of veggie and vegan burgers. Everything handmade. Our tip: the fries are fabulous!"}	{"de": "Marquardsenstraße 18\\nInnenstadt\\n91054 Erlangen\\nGermany", "en": "Marquardsenstrasse 18\\nDowntown\\n91054 Erlangen\\nGermany"}	{"de": "", "en": ""}
d054fccb-c378-4f71-b3d5-d336ea13d489	Vienna Rooftop Garden	Open-air collaboration space on level 8 with city views.	f	Mariahilfer Straße 15, 1060 Wien, Austria	48.198600	16.349400	2025-12-04 11:14:44.227931	2026-04-15 16:08:35.849962	f	physical	\N	{"de": "Vienna Rooftop Garden", "en": "Vienna Rooftop Garden"}	{"de": "Open-air collaboration space on level 8 with city views.", "en": "Open-air collaboration space on level 8 with city views."}	{"de": "Mariahilfer Straße 15, 1060 Wien, Austria", "en": "Mariahilfer Straße 15, 1060 Vienna, Austria"}	{}
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, user_id, type, title, content, metadata, read, created_at, read_at) FROM stdin;
5245206d-9fa0-4dda-b90a-04da765e6370	f28e1527-f696-4a20-b952-ea567e5fc67d	contest_started	Wettbewerb "Minze" gestartet	Der Wettbewerb "Minze" hat begonnen!\n\nStart: 14.01.2026, 23:00\nEnde: 20.06.2026, 21:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-06-20T21:59:00.000Z", "contest_id": "b7daf6b2-2bee-4a43-b63f-9cf102107ad9", "start_date": "2026-01-14T23:00:00.000Z", "contest_name": "Minze"}	f	2026-01-19 15:37:37.152415	\N
3f6e8252-21ba-4b96-ac8d-ae17418c2c96	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	contest_started	Wettbewerb "Cross-Re-Tour" gestartet	Der Wettbewerb "Cross-Re-Tour" hat begonnen!\n\nStart: 19.01.2026, 23:00\nEnde: 24.01.2026, 22:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-01-24T22:59:00.000Z", "contest_id": "37aae118-ff19-4657-ae12-ef4b7f05aa5c", "start_date": "2026-01-19T23:00:00.000Z", "contest_name": "Cross-Re-Tour"}	f	2026-01-19 23:03:31.094907	\N
4943446d-3acb-406f-83e1-ec216234a0d7	4763666e-100e-4e28-a0e5-31f0f0fe6b31	contest_added	Du wurdest zum Wettbewerb "Cross-Re-Tour" hinzugefügt	Du wurdest von einem Administrator zum Wettbewerb "Cross-Re-Tour" hinzugefügt. Sammle Punkte, um zu gewinnen!	{"contest_id": "37aae118-ff19-4657-ae12-ef4b7f05aa5c", "contest_name": "Cross-Re-Tour"}	t	2026-01-20 13:16:28.524782	2026-01-20 15:36:53.847508
12f7ccf6-25bd-49d8-9759-84a353fccf08	174f733f-81e5-40e4-8cbc-79393d695328	photo_approval	Foto-Aufgabe freigegeben: Finde den Ben	Ihr Foto für die Aufgabe "Finde den Ben" wurde freigegeben! Sie haben 4 Punkte erhalten.	{"task_id": "8987fd0c-2c2f-49fe-83e3-bc6985fd1985", "user_task_id": "6e370ed6-3ead-4499-b6a0-0e161dbd03e7", "points_earned": 4}	f	2026-01-21 16:34:10.267983	\N
d4728232-38e4-4ccb-879d-fefa71ce44a3	4763666e-100e-4e28-a0e5-31f0f0fe6b31	photo_approval	Foto-Aufgabe freigegeben: Fair Fashion	Ihr Foto für die Aufgabe "Fair Fashion" wurde freigegeben! Sie haben 8 Punkte erhalten.	{"task_id": "0b1a16a9-c712-4195-ad7d-e37abffa1074", "user_task_id": "1cb714b5-73a2-443e-af1f-8f6855378df4", "points_earned": 8}	f	2026-01-21 16:34:14.63372	\N
f1cb82b3-38e5-44a6-a84d-e66fddb5a438	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	photo_approval	Foto-Aufgabe freigegeben: Fair Fashion	Ihr Foto für die Aufgabe "Fair Fashion" wurde freigegeben! Sie haben 8 Punkte erhalten.	{"task_id": "0b1a16a9-c712-4195-ad7d-e37abffa1074", "user_task_id": "1f019af9-2ae0-47fd-9084-c88278b91f3b", "points_earned": 8}	f	2026-01-21 16:34:19.582811	\N
389eacac-2649-4717-9a23-26eed3f3f250	0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	contest_ended	Wettbewerb "Cross-Re-Tour" beendet	Der Wettbewerb "Cross-Re-Tour" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Boris mit 59 Punkten (+30 Punkte)\n🥈 Platz 2: Berit mit 40 Punkten (+20 Punkte)\n🥉 Platz 3: Ulf mit 37 Punkten (+10 Punkte)\n\nDein Rang: Platz 6 mit 10 Punkten	{"ranking": [{"rank": 1, "points": 59, "user_name": "Boris"}, {"rank": 2, "points": 40, "user_name": "Berit"}, {"rank": 3, "points": 37, "user_name": "Ulf"}], "own_rank": 6, "contest_id": "37aae118-ff19-4657-ae12-ef4b7f05aa5c", "own_points": 10, "contest_name": "Cross-Re-Tour"}	f	2026-01-24 23:03:34.597903	\N
8a131b0b-d1a7-401a-b170-a1fec19bcc96	040878d8-f0e3-48bc-919c-89c7814b8641	contest_ended	Wettbewerb "Cross-Re-Tour" beendet	Der Wettbewerb "Cross-Re-Tour" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Boris mit 59 Punkten (+30 Punkte)\n🥈 Platz 2: Berit mit 40 Punkten (+20 Punkte)\n🥉 Platz 3: Ulf mit 37 Punkten (+10 Punkte)\n\nDein Rang: Platz 4 mit 25 Punkten	{"ranking": [{"rank": 1, "points": 59, "user_name": "Boris"}, {"rank": 2, "points": 40, "user_name": "Berit"}, {"rank": 3, "points": 37, "user_name": "Ulf"}], "own_rank": 4, "contest_id": "37aae118-ff19-4657-ae12-ef4b7f05aa5c", "own_points": 25, "contest_name": "Cross-Re-Tour"}	f	2026-01-24 23:03:34.599352	\N
d2c7d302-6081-4fa6-8e5f-a4e4670bf129	969815d1-4be3-4634-a93e-ac7f4deb8706	contest_ended	Wettbewerb "Cross-Re-Tour" beendet	Der Wettbewerb "Cross-Re-Tour" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Boris mit 59 Punkten (+30 Punkte)\n🥈 Platz 2: Berit mit 40 Punkten (+20 Punkte)\n🥉 Platz 3: Ulf mit 37 Punkten (+10 Punkte)\n\nDein Rang: Platz 3 mit 37 Punkten	{"ranking": [{"rank": 1, "points": 59, "user_name": "Boris"}, {"rank": 2, "points": 40, "user_name": "Berit"}, {"rank": 3, "points": 37, "user_name": "Ulf"}], "own_rank": 3, "contest_id": "37aae118-ff19-4657-ae12-ef4b7f05aa5c", "own_points": 37, "contest_name": "Cross-Re-Tour"}	f	2026-01-24 23:03:34.599892	\N
9fd20436-6d52-4430-9b13-0bdb1ed98a1c	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	contest_ended	Wettbewerb "Cross-Re-Tour" beendet	Der Wettbewerb "Cross-Re-Tour" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Boris mit 59 Punkten (+30 Punkte)\n🥈 Platz 2: Berit mit 40 Punkten (+20 Punkte)\n🥉 Platz 3: Ulf mit 37 Punkten (+10 Punkte)\n\nDein Rang: Platz 8 mit 0 Punkten	{"ranking": [{"rank": 1, "points": 59, "user_name": "Boris"}, {"rank": 2, "points": 40, "user_name": "Berit"}, {"rank": 3, "points": 37, "user_name": "Ulf"}], "own_rank": 8, "contest_id": "37aae118-ff19-4657-ae12-ef4b7f05aa5c", "own_points": 0, "contest_name": "Cross-Re-Tour"}	f	2026-01-24 23:03:34.600392	\N
7e9db70c-5f59-498d-9411-015c5771681b	174f733f-81e5-40e4-8cbc-79393d695328	contest_ended	Wettbewerb "Cross-Re-Tour" beendet	Der Wettbewerb "Cross-Re-Tour" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Boris mit 59 Punkten (+30 Punkte)\n🥈 Platz 2: Berit mit 40 Punkten (+20 Punkte)\n🥉 Platz 3: Ulf mit 37 Punkten (+10 Punkte)\n\nDein Rang: Platz 2 mit 40 Punkten	{"ranking": [{"rank": 1, "points": 59, "user_name": "Boris"}, {"rank": 2, "points": 40, "user_name": "Berit"}, {"rank": 3, "points": 37, "user_name": "Ulf"}], "own_rank": 2, "contest_id": "37aae118-ff19-4657-ae12-ef4b7f05aa5c", "own_points": 40, "contest_name": "Cross-Re-Tour"}	f	2026-01-24 23:03:34.601454	\N
b4f74b07-e1dd-4e8e-890d-dac6a1b95c44	4763666e-100e-4e28-a0e5-31f0f0fe6b31	contest_ended	Wettbewerb "Cross-Re-Tour" beendet	Der Wettbewerb "Cross-Re-Tour" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Boris mit 59 Punkten (+30 Punkte)\n🥈 Platz 2: Berit mit 40 Punkten (+20 Punkte)\n🥉 Platz 3: Ulf mit 37 Punkten (+10 Punkte)\n\nDein Rang: Platz 1 mit 59 Punkten	{"ranking": [{"rank": 1, "points": 59, "user_name": "Boris"}, {"rank": 2, "points": 40, "user_name": "Berit"}, {"rank": 3, "points": 37, "user_name": "Ulf"}], "own_rank": 1, "contest_id": "37aae118-ff19-4657-ae12-ef4b7f05aa5c", "own_points": 59, "contest_name": "Cross-Re-Tour"}	f	2026-01-24 23:03:34.601969	\N
5f09cb91-cce8-47a6-89da-603a21418da7	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	contest_ended	Wettbewerb "Cross-Re-Tour" beendet	Der Wettbewerb "Cross-Re-Tour" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Boris mit 59 Punkten (+30 Punkte)\n🥈 Platz 2: Berit mit 40 Punkten (+20 Punkte)\n🥉 Platz 3: Ulf mit 37 Punkten (+10 Punkte)\n\nDein Rang: Platz 5 mit 20 Punkten	{"ranking": [{"rank": 1, "points": 59, "user_name": "Boris"}, {"rank": 2, "points": 40, "user_name": "Berit"}, {"rank": 3, "points": 37, "user_name": "Ulf"}], "own_rank": 5, "contest_id": "37aae118-ff19-4657-ae12-ef4b7f05aa5c", "own_points": 20, "contest_name": "Cross-Re-Tour"}	f	2026-01-24 23:03:34.602611	\N
6f597c0b-af1b-4d4d-aa7b-6b114d68b5e0	230d6d19-eba9-4fc9-bc43-7ffa3d4425f6	team_removed	Du wurdest aus dem Team "Thowe's Team" entfernt	Du wurdest von einem Administrator aus dem Team "Thowe's Team" entfernt. Deine persönlichen Punkte bleiben erhalten.	{"team_id": "b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85", "team_name": "Thowe's Team"}	f	2026-03-30 08:34:56.040033	\N
78c7e887-3a45-4357-865b-926b389724f7	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	photo_approval	Foto-Aufgabe freigegeben: Fehlerfinden	Ihr Foto für die Aufgabe "Fehlerfinden" wurde freigegeben! Sie haben 6 Punkte erhalten.	{"task_id": "456c1be6-40da-4f3d-9810-ea8e87e72afc", "user_task_id": "eb3a282f-5e05-4c10-a0e7-266c0484f721", "points_earned": 6}	t	2026-03-17 17:40:03.282838	2026-03-18 16:06:01.153076
2d466757-fd94-4ef3-9478-c81e3dec9091	874490b4-c9c0-4f89-a460-b0d460a9387e	photo_approval	Foto-Aufgabe freigegeben: Pasta Fantastica	Ihr Foto für die Aufgabe "Pasta Fantastica" wurde freigegeben! Sie haben 6 Punkte erhalten.	{"task_id": "ee640e48-bad4-43b3-aa1c-e3881ccd93e7", "user_task_id": "ba0f8fed-75ff-4655-b84d-ee20aa2e3adb", "points_earned": 6}	t	2026-03-19 06:45:00.022819	2026-03-19 14:38:33.867706
0eb0810a-8840-4b04-bf46-e9865799330a	108873fe-b2e0-43a8-be0c-36f567e480cb	contest_started	Wettbewerb "Contest Jason" gestartet	Der Wettbewerb "Contest Jason" hat begonnen!\n\nStart: 19.03.2026, 23:00\nEnde: 20.03.2026, 22:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-03-20T22:59:00.000Z", "contest_id": "d57eabd9-43cf-48fc-8b9f-19e76324a52f", "start_date": "2026-03-19T23:00:00.000Z", "contest_name": "Contest Jason"}	f	2026-03-20 09:15:57.785714	\N
7164e816-c5df-4a77-9ad6-a16540261235	874490b4-c9c0-4f89-a460-b0d460a9387e	contest_started	Wettbewerb "Testcon" gestartet	Der Wettbewerb "Testcon" hat begonnen!\n\nStart: 19.03.2026, 23:00\nEnde: 28.03.2026, 22:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-03-28T22:59:00.000Z", "contest_id": "34d6ba95-b6cd-4092-b293-f73d0ec6f70b", "start_date": "2026-03-19T23:00:00.000Z", "contest_name": "Testcon"}	t	2026-03-19 23:00:57.60941	2026-03-20 09:22:40.173849
dfb906fb-e774-4f9b-a161-50ce188e3a68	874490b4-c9c0-4f89-a460-b0d460a9387e	contest_started	Wettbewerb "Contest Thowe" gestartet	Der Wettbewerb "Contest Thowe" hat begonnen!\n\nStart: 19.03.2026, 23:00\nEnde: 27.03.2026, 22:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-03-27T22:59:00.000Z", "contest_id": "5a8cc172-1d77-4f97-97a1-2f4d1ee33320", "start_date": "2026-03-19T23:00:00.000Z", "contest_name": "Contest Thowe"}	t	2026-03-19 23:00:57.613712	2026-03-20 09:22:47.224665
89be1f05-1fc4-4aa6-92a9-eb34d8c65600	108873fe-b2e0-43a8-be0c-36f567e480cb	contest_ended	Wettbewerb "Contest Jason" beendet	Der Wettbewerb "Contest Jason" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Jason mit 6 Punkten\n\nDein Rang: Platz 1 mit 6 Punkten	{"ranking": [{"rank": 1, "points": 6, "user_name": "Jason"}], "own_rank": 1, "contest_id": "d57eabd9-43cf-48fc-8b9f-19e76324a52f", "own_points": 6, "contest_name": "Contest Jason"}	f	2026-03-20 23:00:58.144696	\N
540e32bf-c90c-48c7-8d47-e055bd56fb0d	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	contest_started	Wettbewerb "Contest Test User" gestartet	Der Wettbewerb "Contest Test User" hat begonnen!\n\nStart: 23.03.2026, 23:00\nEnde: 24.03.2026, 22:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-03-24T22:59:00.000Z", "contest_id": "8102c3d4-7881-4506-9540-ff88c17e7377", "start_date": "2026-03-23T23:00:00.000Z", "contest_name": "Contest Test User"}	f	2026-03-24 12:46:00.581728	\N
dea03d28-51e0-4580-a05e-bd25323fec89	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	contest_ended	Wettbewerb "Contest Test User" beendet	Der Wettbewerb "Contest Test User" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Test User mit 0 Punkten\n\nDein Rang: Platz 1 mit 0 Punkten	{"ranking": [{"rank": 1, "points": 0, "user_name": "Test User"}], "own_rank": 1, "contest_id": "8102c3d4-7881-4506-9540-ff88c17e7377", "own_points": 0, "contest_name": "Contest Test User"}	f	2026-03-24 23:01:00.994586	\N
2b2d4023-2e56-4e18-baba-fff892686a59	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	contest_started	Wettbewerb "Test" gestartet	Der Wettbewerb "Test" hat begonnen!\n\nStart: 24.03.2026, 23:00\nEnde: 25.03.2026, 22:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-03-25T22:59:00.000Z", "contest_id": "87cabc4f-886f-4642-abec-46530611a364", "start_date": "2026-03-24T23:00:00.000Z", "contest_name": "Test"}	f	2026-03-25 08:16:01.152465	\N
2e114672-e0a0-4b71-83ec-95ecdbcd7b94	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	contest_started	Wettbewerb "Contest Test User" gestartet	Der Wettbewerb "Contest Test User" hat begonnen!\n\nStart: 24.03.2026, 23:00\nEnde: 25.03.2026, 22:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-03-25T22:59:00.000Z", "contest_id": "badb8064-6519-46d3-ba2a-22e8b909f8bc", "start_date": "2026-03-24T23:00:00.000Z", "contest_name": "Contest Test User"}	f	2026-03-25 10:46:01.186864	\N
59645019-7ef9-40d6-9b25-7a08e2755d30	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	contest_started	Wettbewerb "test2" gestartet	Der Wettbewerb "test2" hat begonnen!\n\nStart: 24.03.2026, 23:00\nEnde: 25.03.2026, 22:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-03-25T22:59:00.000Z", "contest_id": "5e715d1e-06bf-4120-bb2d-188bea280f14", "start_date": "2026-03-24T23:00:00.000Z", "contest_name": "test2"}	f	2026-03-25 12:01:01.163344	\N
c37d12bd-346e-451c-b0e9-584bed3f77a0	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	contest_started	Wettbewerb "test3" gestartet	Der Wettbewerb "test3" hat begonnen!\n\nStart: 24.03.2026, 23:00\nEnde: 25.03.2026, 22:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-03-25T22:59:00.000Z", "contest_id": "21eeabef-5f64-40d5-9ed9-aefa83a8e420", "start_date": "2026-03-24T23:00:00.000Z", "contest_name": "test3"}	f	2026-03-25 12:01:01.165724	\N
9d053eca-dd50-47de-a8c4-de110f83e949	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	contest_ended	Wettbewerb "test" beendet	Der Wettbewerb "test" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Test User mit 0 Punkten\n\nDein Rang: Platz 1 mit 0 Punkten	{"ranking": [{"rank": 1, "points": 0, "user_name": "Test User"}], "own_rank": 1, "contest_id": "21eeabef-5f64-40d5-9ed9-aefa83a8e420", "own_points": 0, "contest_name": "test"}	f	2026-03-25 23:01:01.607336	\N
78560a9f-44c0-4870-bea6-9455000d67a0	874490b4-c9c0-4f89-a460-b0d460a9387e	contest_ended	Wettbewerb "Contest Thow" beendet	Der Wettbewerb "Contest Thow" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Thowe mit 4 Punkten\n\nDein Rang: Platz 1 mit 4 Punkten	{"ranking": [{"rank": 1, "points": 4, "user_name": "Thowe"}], "own_rank": 1, "contest_id": "5a8cc172-1d77-4f97-97a1-2f4d1ee33320", "own_points": 4, "contest_name": "Contest Thow"}	t	2026-03-27 23:09:54.677071	2026-03-30 07:41:36.220544
e2601703-1d89-4d71-b01b-7ea34a1bde0d	874490b4-c9c0-4f89-a460-b0d460a9387e	contest_ended	Wettbewerb "Testcon" beendet	Der Wettbewerb "Testcon" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Thowe mit 4 Punkten\n\nDein Rang: Platz 1 mit 4 Punkten	{"ranking": [{"rank": 1, "points": 4, "user_name": "Thowe"}], "own_rank": 1, "contest_id": "34d6ba95-b6cd-4092-b293-f73d0ec6f70b", "own_points": 4, "contest_name": "Testcon"}	t	2026-03-28 23:09:55.72502	2026-03-30 07:41:42.056127
beb2475a-a2e2-434d-ad98-f85886700158	230d6d19-eba9-4fc9-bc43-7ffa3d4425f6	team_added	Du wurdest zum Team "Thowe's Team" hinzugefügt	Du wurdest von einem Administrator zum Team "Thowe's Team" hinzugefügt. Du kannst jetzt gemeinsam mit deinem Team Punkte sammeln!	{"team_id": "b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85", "team_name": "Thowe's Team"}	f	2026-03-30 08:27:48.872588	\N
dead962c-179e-4f0a-ad58-0bd745a38482	230d6d19-eba9-4fc9-bc43-7ffa3d4425f6	team_removed	Du wurdest aus dem Team "Thowe's Team" entfernt	Du wurdest von einem Administrator aus dem Team "Thowe's Team" entfernt. Deine persönlichen Punkte bleiben erhalten.	{"team_id": "b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85", "team_name": "Thowe's Team"}	f	2026-03-30 08:29:22.569569	\N
ca4f3ed0-a26e-49d2-a73d-77e06ef8d38b	230d6d19-eba9-4fc9-bc43-7ffa3d4425f6	team_added	Du wurdest zum Team "Thowe's Team" hinzugefügt	Du wurdest von einem Administrator zum Team "Thowe's Team" hinzugefügt. Du kannst jetzt gemeinsam mit deinem Team Punkte sammeln!	{"team_id": "b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85", "team_name": "Thowe's Team"}	f	2026-03-30 08:30:04.616072	\N
aa4d4603-67c6-4f22-b38c-eecdbd9df5c6	874490b4-c9c0-4f89-a460-b0d460a9387e	contest_started	Wettbewerb "Aprilscherz" gestartet	Der Wettbewerb "Aprilscherz" hat begonnen!\n\nStart: 31.03.2026, 22:00\nEnde: 01.04.2026, 21:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-04-01T21:59:00.000Z", "contest_id": "75dfb1cd-0ae8-4b9a-a194-18520f8ecc12", "start_date": "2026-03-31T22:00:00.000Z", "contest_name": "Aprilscherz"}	f	2026-03-31 22:02:49.746185	\N
72bbd510-b92e-4066-968e-05732735bd1f	874490b4-c9c0-4f89-a460-b0d460a9387e	contest_ended	Wettbewerb "Aprilscherz" beendet	Der Wettbewerb "Aprilscherz" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Thowe mit 0 Punkten\n\nDein Rang: Platz 1 mit 0 Punkten	{"ranking": [{"rank": 1, "points": 0, "user_name": "Thowe"}], "own_rank": 1, "contest_id": "75dfb1cd-0ae8-4b9a-a194-18520f8ecc12", "own_points": 0, "contest_name": "Aprilscherz"}	f	2026-04-01 22:10:24.035244	\N
ed699c15-2afc-468f-94cc-8187154ed6f0	230d6d19-eba9-4fc9-bc43-7ffa3d4425f6	team_added	Du wurdest zum Team "Thowe's Team" hinzugefügt	Du wurdest von einem Administrator zum Team "Thowe's Team" hinzugefügt. Du kannst jetzt gemeinsam mit deinem Team Punkte sammeln!	{"team_id": "b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85", "team_name": "Thowe's Team"}	f	2026-04-02 07:50:38.196626	\N
bde3a3cb-d7f0-4f8e-82c0-6c66ffc04df7	230d6d19-eba9-4fc9-bc43-7ffa3d4425f6	team_removed	Du wurdest aus dem Team "Thowe's Team" entfernt	Du wurdest von einem Administrator aus dem Team "Thowe's Team" entfernt. Deine persönlichen Punkte bleiben erhalten.	{"team_id": "b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85", "team_name": "Thowe's Team"}	f	2026-04-02 07:51:15.429435	\N
eb013430-ed93-4313-9409-0f97a2cea4cf	230d6d19-eba9-4fc9-bc43-7ffa3d4425f6	team_added	Du wurdest zum Team "Thowe's Team" hinzugefügt	Du wurdest von einem Administrator zum Team "Thowe's Team" hinzugefügt. Du kannst jetzt gemeinsam mit deinem Team Punkte sammeln!	{"team_id": "b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85", "team_name": "Thowe's Team"}	f	2026-04-02 07:56:43.724297	\N
c80bb267-f220-450b-9da6-18b52d0f9315	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	team_added	Du wurdest zum Team "Team Jason" hinzugefügt	Du wurdest von einem Administrator zum Team "Team Jason" hinzugefügt. Du kannst jetzt gemeinsam mit deinem Team Punkte sammeln!	{"team_id": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "team_name": "Team Jason"}	f	2026-04-02 11:30:13.415888	\N
7f1ef9ad-d53d-4269-9ab1-de9468233a4a	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	contest_started	Wettbewerb "Game" gestartet	Der Wettbewerb "Game" hat begonnen!\n\nStart: 02.04.2026, 22:00\nEnde: 10.04.2026, 21:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-04-10T21:59:00.000Z", "contest_id": "abc07d96-3bb5-48f6-bff8-ad0bb71e5d86", "start_date": "2026-04-02T22:00:00.000Z", "contest_name": "Game"}	t	2026-04-03 16:31:34.266712	2026-04-03 16:32:12.809235
9f577488-232d-4402-83b0-646bde637c09	de6756c2-06f2-412b-bbdc-d498a406d0b8	contest_started	Wettbewerb "Game" gestartet	Der Wettbewerb "Game" hat begonnen!\n\nStart: 02.04.2026, 22:00\nEnde: 10.04.2026, 21:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-04-10T21:59:00.000Z", "contest_id": "abc07d96-3bb5-48f6-bff8-ad0bb71e5d86", "start_date": "2026-04-02T22:00:00.000Z", "contest_name": "Game"}	t	2026-04-03 16:31:34.265151	2026-04-03 16:36:30.370485
39907437-d18e-4c9e-b28f-b569e3e5a4b4	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	photo_approval	Foto-Aufgabe freigegeben: Fehlerfinden	Ihr Foto für die Aufgabe "Fehlerfinden" wurde freigegeben! Sie haben 10 Punkte erhalten.	{"task_id": "456c1be6-40da-4f3d-9810-ea8e87e72afc", "user_task_id": "e3eaf184-8e82-4a90-8cd7-5d4f73c17e82", "points_earned": 10}	t	2026-04-03 16:41:56.392992	2026-04-03 16:42:16.183831
76f451d9-cdaa-4e61-ad68-bc8293813ab6	25b3474d-3d76-4f58-8494-c169d3160e7f	photo_approval	Foto-Aufgabe freigegeben: Fair Fashion	Ihr Foto für die Aufgabe "Fair Fashion" wurde freigegeben! Sie haben 15 Punkte erhalten.	{"task_id": "0b1a16a9-c712-4195-ad7d-e37abffa1074", "user_task_id": "18d29fe6-2793-48c1-9b80-1b58a1eae40e", "points_earned": 15}	t	2026-04-03 16:43:32.498121	2026-04-03 16:43:45.619276
dffc871f-124c-458c-90ed-40abd8962e99	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	photo_rejection	Foto-Aufgabe abgelehnt: Vegetarisches Frühstück	Ihr Foto für die Aufgabe "Vegetarisches Frühstück" wurde abgelehnt. Bitte versuchen Sie es erneut mit einem neuen Foto.	{"task_id": "58c15636-8828-4ac8-b5ce-ac33c0b900ef", "user_task_id": "d3bc2f6c-a715-4f48-8b95-7137ffad2e64", "rejection_reason": "Nö du"}	t	2026-04-07 10:35:59.126195	2026-04-07 10:36:10.871818
e3d3782e-1934-48fe-84ca-7c15d8933885	e503c22a-ac49-4154-b7d3-648f0f08ccc7	photo_approval	Foto-Aufgabe freigegeben: Burgerinitiative	Ihr Foto für die Aufgabe "Burgerinitiative" wurde freigegeben! Sie haben 15 Punkte erhalten.	{"task_id": "d23b70e4-ab37-4c2a-a8fa-717869ff7338", "user_task_id": "8152f973-07db-4222-9974-27bc3e7986fb", "points_earned": 15}	f	2026-04-10 10:06:24.001637	\N
f92fffc0-7902-4fbc-954f-810becfa1dd2	de6756c2-06f2-412b-bbdc-d498a406d0b8	contest_ended	Wettbewerb "Game" beendet	Der Wettbewerb "Game" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Felix Seyer mit 45 Punkten\n🥈 Platz 2: Daniel mit 15 Punkten\n🥉 Platz 3: Paul  mit 15 Punkten\n\nDein Rang: Platz 2 mit 15 Punkten	{"ranking": [{"rank": 1, "points": 45, "user_name": "Felix Seyer"}, {"rank": 2, "points": 15, "user_name": "Daniel"}, {"rank": 3, "points": 15, "user_name": "Paul "}], "own_rank": 2, "contest_id": "abc07d96-3bb5-48f6-bff8-ad0bb71e5d86", "own_points": 15, "contest_name": "Game"}	f	2026-04-10 22:13:16.546625	\N
9beedc90-17ef-40b3-a744-cbdf1690b469	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	contest_ended	Wettbewerb "Game" beendet	Der Wettbewerb "Game" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Felix Seyer mit 45 Punkten\n🥈 Platz 2: Daniel mit 15 Punkten\n🥉 Platz 3: Paul  mit 15 Punkten\n\nDein Rang: Platz 1 mit 45 Punkten	{"ranking": [{"rank": 1, "points": 45, "user_name": "Felix Seyer"}, {"rank": 2, "points": 15, "user_name": "Daniel"}, {"rank": 3, "points": 15, "user_name": "Paul "}], "own_rank": 1, "contest_id": "abc07d96-3bb5-48f6-bff8-ad0bb71e5d86", "own_points": 45, "contest_name": "Game"}	f	2026-04-10 22:13:16.548977	\N
a812c753-b4f6-4541-9c98-54b13dcbc011	25b3474d-3d76-4f58-8494-c169d3160e7f	contest_ended	Wettbewerb "Game" beendet	Der Wettbewerb "Game" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Felix Seyer mit 45 Punkten\n🥈 Platz 2: Daniel mit 15 Punkten\n🥉 Platz 3: Paul  mit 15 Punkten\n\nDein Rang: Platz 3 mit 15 Punkten	{"ranking": [{"rank": 1, "points": 45, "user_name": "Felix Seyer"}, {"rank": 2, "points": 15, "user_name": "Daniel"}, {"rank": 3, "points": 15, "user_name": "Paul "}], "own_rank": 3, "contest_id": "abc07d96-3bb5-48f6-bff8-ad0bb71e5d86", "own_points": 15, "contest_name": "Game"}	f	2026-04-10 22:13:16.549598	\N
16a5a40e-bb99-4fca-8b8a-3f9fa6d758b7	ffe30495-7455-4198-a15d-56b44c289976	contest_ended	Wettbewerb "Game" beendet	Der Wettbewerb "Game" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Felix Seyer mit 45 Punkten\n🥈 Platz 2: Daniel mit 15 Punkten\n🥉 Platz 3: Paul  mit 15 Punkten\n\nDein Rang: Platz 4 mit 0 Punkten	{"ranking": [{"rank": 1, "points": 45, "user_name": "Felix Seyer"}, {"rank": 2, "points": 15, "user_name": "Daniel"}, {"rank": 3, "points": 15, "user_name": "Paul "}], "own_rank": 4, "contest_id": "abc07d96-3bb5-48f6-bff8-ad0bb71e5d86", "own_points": 0, "contest_name": "Game"}	t	2026-04-10 22:13:16.548175	2026-04-11 14:58:45.281605
773f9e19-92a8-4b80-8151-8d72ba6c30c1	108873fe-b2e0-43a8-be0c-36f567e480cb	contest_started	Wettbewerb "Blabla" gestartet	Der Wettbewerb "Blabla" hat begonnen!\n\nStart: 13.04.2026, 22:00\nEnde: 14.04.2026, 21:59\n\nSammle jetzt Punkte, um zu gewinnen!	{"end_date": "2026-04-14T21:59:00.000Z", "contest_id": "ebaad53f-1ef8-428a-a551-32e4f3a5dc4f", "start_date": "2026-04-13T22:00:00.000Z", "contest_name": "Blabla"}	f	2026-04-14 13:39:35.959345	\N
07226771-0f3c-43e6-a66c-98bf9dee1326	108873fe-b2e0-43a8-be0c-36f567e480cb	contest_ended	Wettbewerb "Blabla" beendet	Der Wettbewerb "Blabla" ist abgelaufen.\n\n🏆 Die Top 3:\n\n🥇 Platz 1: Jason mit 0 Punkten\n\nDein Rang: Platz 1 mit 0 Punkten	{"ranking": [{"rank": 1, "points": 0, "user_name": "Jason"}], "own_rank": 1, "contest_id": "ebaad53f-1ef8-428a-a551-32e4f3a5dc4f", "own_points": 0, "contest_name": "Blabla"}	f	2026-04-14 22:09:36.376517	\N
\.


--
-- Data for Name: points_bonus_qr_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.points_bonus_qr_tokens (id, qr_token, points_amount, generated_by, generated_at, redeemed_by, redeemed_at, status, expires_at, forest_category) FROM stdin;
cc9725f7-145d-446c-a619-78212110d857	f41b93ce2d07e9c11b652141a004ef7144d1f8ecf21193a8416f12a786960bd3	50	8af2afba-1be0-4951-b066-790a31718076	2026-01-06 19:12:13.58544	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-06 19:13:58.332724	redeemed	2026-01-07 19:12:13.585	\N
98206dbe-d1c1-4731-96d1-637f90030a31	0c596f35640e0a0cfb8cbe080207a72428b16f1c3947e39a44f030f48fefe8dd	10	8af2afba-1be0-4951-b066-790a31718076	2026-01-06 19:14:20.654931	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-06 19:14:24.766096	redeemed	2026-01-07 19:14:20.654	\N
5d02bbb0-6954-4e31-a5bb-4e68db688b8d	92033c561beda9e2e1ad33100186a9c5a90d5b4d38f2ef3a8a8a38ac67d78a03	30	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-19 14:46:09.535848	ffe30495-7455-4198-a15d-56b44c289976	2026-01-19 14:46:24.949365	redeemed	2026-01-20 14:46:09.535	\N
8d934bea-0e8e-482a-9941-4404917864f4	17cf80b0ff213238665128cc508a9f7dfe8218f100c1aa1aaa42fc8eded5d91f	35	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-19 15:05:34.618697	ffe30495-7455-4198-a15d-56b44c289976	2026-01-19 15:05:47.700077	redeemed	2026-01-20 15:05:34.618	\N
ce780dab-6944-43ec-aa11-b64aed3658a8	a94feb74a910f532394e9d77bc98b69aed1e5ad10c794f94ecdcaf129be33d28	8	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-01-20 14:13:20.491334	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	2026-01-20 14:13:30.75958	redeemed	2026-01-21 14:13:20.491	\N
54934f0a-076a-4c7f-ac5a-dde626849b0b	3eddc8080b66cedd98beed0d1acc2287b5642f2faa8b3e37532eb9a611f77e50	15	53772231-8597-43ae-8e77-d36b6f23ab2c	2026-01-21 06:52:02.656928	\N	\N	pending	2026-01-22 06:52:02.656	\N
1a060493-ce64-4eb0-a36a-7f372f3e7708	59017063f79b8d71b02a2fcb289d5c1d1e4977c8adfe62bf8cb746629e931b79	23	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	2026-03-17 17:49:34.952912	\N	\N	pending	2026-03-18 17:49:34.952	\N
fbdcfcae-77d5-4290-911b-fd8c1d61a657	4ed7f7bcddc3fa133a699226c64578bf5fbb03f365bea284cd51264885b5db1d	100	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-18 13:56:03.454706	\N	\N	pending	2026-03-19 13:56:03.454	\N
4fd1a3f3-0b9b-44f8-85d0-311a007012fd	cd72fa9ab9fe09fb0b4ed2c9b0157c941950cbab9d290337330c29a388a32b9e	11111111	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-19 06:28:37.896716	\N	\N	pending	2026-03-20 06:28:37.896	\N
0f2c9f90-2870-44c1-b486-3f25a28fdfaa	fbb1b541942a1f5f15b9430c83fbd9d3627810cd526c8701c86621ca2934f71c	100000155	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-19 06:53:30.05922	\N	\N	pending	2026-03-20 06:53:30.059	\N
32879511-710d-4dc8-ba60-4de9c9447061	7c7123c121cb08205ec8181482b6f962ef0ac2c89e9b0bcc1b7ccf17aa189e8f	10	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-19 07:34:56.851936	\N	\N	pending	2026-03-20 07:34:56.851	\N
d163edfe-3f68-4029-a79e-b1981cf8b9e2	7043bc86979ebbe2958457f85569b5263405400e628e704dd36b505139789bf9	37	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-23 08:46:34.829907	\N	\N	pending	2026-03-24 08:46:34.829	\N
2d6762fa-4b38-4481-a0a3-e4936d547050	070380e20a82e880a3817c53d0b19072dbb4aea3a5009e9609cf8d7010b0915c	11	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-23 08:53:22.517359	\N	\N	pending	2026-03-24 08:53:22.517	\N
f50133e3-3db6-4342-ab3f-898b2e9755d3	076302252e8051a6d389c7d0771dc2fd640a95f3998fd84479a1b42e50bd6dfb	37	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-23 09:17:12.393831	\N	\N	pending	2026-03-24 09:17:12.393	\N
4309a266-5931-47bd-83c0-5763ae3e1140	5921740cde70d8e45dcf9b6ca79f29ed3f96f02c7a1a815bec962b4720daf8a0	10	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-23 09:17:27.314514	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-23 09:17:31.617818	redeemed	2026-03-24 09:17:27.314	\N
f2e1ddff-4ed6-48a6-933d-862d562bff4d	951e266aa769695b1b29b3ea2af4cfdaef8d98aa78e7409103d3b9d4b2c4d0f6	1000000000	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-23 09:19:00.610865	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-23 09:19:09.094953	redeemed	2026-03-24 09:19:00.61	\N
c64c1484-38ff-4ce4-aa8b-90b4003d86b4	ee42aeeeae02ede198ca8a73fdf3a9c36e033436348f6924d5b12d288c59b95f	27	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 12:19:15.300945	\N	\N	pending	2026-03-26 12:19:15.3	\N
e089b2da-78b8-464a-9a20-86251f45bc1d	395658535eed8c8c99e2f7f71431bd593e5d088c65d34c6c5b891a71fc92a44b	37	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 13:03:57.401639	\N	\N	pending	2026-03-26 13:03:57.401	\N
76582df4-013b-4e1d-9eac-c1ff0dbe06e0	7ff67368ebd9745b2c3479ae041f3b8465b7b1d6c8f57e5915970de659d33ee6	6	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 13:04:44.095191	\N	\N	pending	2026-03-26 13:04:44.094	\N
a3f12032-2c92-44de-aa87-d4e5ad47c3b2	651759d4e1115af174a74a251100ad610d4439570c0bcd172387ce943876416d	123	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 13:21:25.845668	\N	\N	pending	2026-03-26 13:21:25.845	\N
3a0a6b04-58e3-4752-8e06-e895b9f65d30	7defd71a72bf5291fdff5cc2bb691931910a169b12b0bb9a0ae85400916d540a	12345	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 13:21:38.294837	\N	\N	pending	2026-03-26 13:21:38.294	\N
a03d6c7d-7923-45dc-93a6-38e091a064de	5a2c22d1d29f730a14c733f26283dbb84cad618c471cea1dec8274cb0fd64283	200	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-25 13:22:38.632451	\N	\N	pending	2026-03-26 13:22:38.632	\N
f285e4ba-e927-43e4-b98a-d494504d7c0f	707eb25a3a45fc1ba57de759253d58d9488e8a844118e31464b0af00920d992e	58	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-03-30 08:17:39.81438	\N	\N	pending	2026-03-31 08:17:39.814	natur
80247cca-cdd6-47c1-a5df-1c6eae335479	8593ec2ba15acb847717d520bf682f6708dbf470f08ba9ae80842c577b0c9d51	10000	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	2026-04-03 16:44:30.951712	25b3474d-3d76-4f58-8494-c169d3160e7f	2026-04-03 16:45:11.267416	redeemed	2026-04-04 16:44:30.951	natur
7becd0c5-0736-4979-92a1-753bf1b17da0	f106e0f6c83ce513d971cd5904fd5480b5516516f5200a9c21b9eae96d9d5561	5000	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	2026-04-03 16:47:30.798736	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	2026-04-03 16:47:41.973461	redeemed	2026-04-04 16:47:30.798	mensch
406823e0-f150-426d-bae4-be5779a88ac8	67808201a0fb4914169bd94949bdfa8d85f419ff3d9c22bea74443478256f0ee	35	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	2026-04-07 10:31:55.300551	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	2026-04-07 10:32:03.973781	redeemed	2026-04-08 10:31:55.3	mensch
aa3d6403-7c6c-4d2a-9eff-5a18a535fc23	b100880e1b0a7b4045111a1c62452e9a86ee268a4f43fbc5103c8b697d2b545f	100	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-04-14 12:57:05.42615	\N	\N	pending	2026-04-15 12:57:05.425	natur
8e12ce41-98fe-407c-a348-97864a093b0b	fbf4c3f63764e364171e15d393f14acc6b52ab9ce5deea9b47f4f98ddc4919b4	123	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-04-15 08:48:17.592384	\N	\N	pending	2026-04-16 08:48:17.592	natur
\.


--
-- Data for Name: quiz_question_locks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_question_locks (user_id, task_id, question_index, locked_until) FROM stdin;
276ab066-e6de-4957-ae0c-ccea7b590ac9	29bcad8b-4816-46ed-9b55-68ecb72eed73	0	2026-04-13 11:45:48.695+00
276ab066-e6de-4957-ae0c-ccea7b590ac9	8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	0	2026-04-13 11:46:38.058+00
ffe30495-7455-4198-a15d-56b44c289976	8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	0	2026-04-13 19:13:57.76+00
108873fe-b2e0-43a8-be0c-36f567e480cb	53966428-2831-47fb-b171-e7a405044c83	0	2026-04-15 05:45:57.54+00
ffe30495-7455-4198-a15d-56b44c289976	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	0	2026-04-15 08:47:07.44+00
ef4bfe44-a53e-4acf-8412-6a1a913da692	8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	0	2026-04-15 12:43:21.569+00
\.


--
-- Data for Name: reward_parameters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reward_parameters (id, parameter_type, value, display_order, active, created_at, updated_at, weight) FROM stdin;
cee1cb94-8920-4e13-b7fe-de8e5dfa9753	reward_art	Rabatt	1	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
8eac3b7b-11fd-40b2-80ff-0b40242cacee	reward_art	Add-on	3	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
df0e279a-dabc-469c-8dc2-c4ba6e407373	reward_art	physisches Geschenk	4	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
0785e1db-d43d-4e5d-9f50-902ca7369a12	kategorie	Hotel	1	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
097ae8a8-383b-4824-87a7-9493c63d5bb9	kategorie	nicht Hotel	2	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	0.00
54877af5-f15b-4565-b8b8-748d541c60d9	kosten	niedrig	1	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	1.00
387315a4-633b-4a25-bfa5-2aac1029e5e8	kosten	mittel	2	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	2.00
f4409855-8a38-4cb3-a4e1-b3ec6722293e	kosten	hoch	3	t	2026-01-04 14:26:46.383229	2026-01-04 14:26:46.383229	3.00
bd34d17d-1d5d-4791-93b8-848dd4f00562	kategorie	Online	3	t	2026-01-04 14:26:46.383229	2026-03-27 13:03:50.03144	0.00
80c7bc3d-c8c8-411e-b632-eaef08540509	kategorie	Test	445540	t	2026-03-27 13:03:57.06301	2026-03-27 13:03:57.06301	445540.00
8f1eff52-97b3-4505-994c-e4ff7c4de61f	reward_art	Erlebnis	25	t	2026-01-04 14:26:46.383229	2026-04-02 11:13:14.226847	0.00
\.


--
-- Data for Name: reward_redemptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reward_redemptions (id, user_id, reward_id, redeemed_at, voucher_code, status, qr_token, metadata, verified_at) FROM stdin;
08c5b6e4-6b22-4f5c-996c-24c78cfc1008	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2025-12-04 12:04:29.686746	COFFEE-ON-US	pending	\N	\N	\N
985791cd-54cb-4167-a84c-7ecbed0d481a	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	a119fd67-72ba-4093-9863-9876ae403dd3	2026-01-06 22:34:02.386729	\N	pending	54b3824140e06d26480654e71ca8932f3efd4a2ab86cc3d7770796a6922abc9e	\N	\N
5493d589-07c4-47f1-aa63-9d77ccec4f48	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	04919452-8903-4eb3-b395-f494b7dc56e2	2026-01-06 22:34:07.535749	\N	pending	5212ef993469179f5951e232fe7378fa0238a32bd1c42e440b309964d3a94654	\N	\N
c140ac92-c26e-49df-af43-1e58291b3e23	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	e3d0d0cb-97bd-4e33-9000-53775168a095	2026-01-06 22:34:27.706675	FOOD-10OFF	pending	fd2a7d06a29d5dfa150c071c92af3b6ac9260d184d836bf678833ee019f4cd68	\N	\N
b0e0a398-b2eb-487c-a5a2-3de2035d77c1	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:59:23.707057	COFFEE-ON-US	pending	d10d1e88fc01dad225a2e4bb0f4b987e01ee5a95afa7821ec49e30a00a0f87ef	\N	\N
7f11f673-d256-4cd4-afbc-15dde0b5f2e4	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-07 22:07:00.210214	COFFEE-ON-US	pending	660e99a1e93fccef88c05e4d00943bf6dcb0d91d4e71a28645a59c52e85b87d1	\N	\N
68810565-9637-4185-bae6-f6e89a82c5f9	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	04919452-8903-4eb3-b395-f494b7dc56e2	2026-01-08 07:53:27.02752	\N	pending	7417f4062c622ce848e22e8f58416aadd7fc4e1280f2c7a3c27bd9899a06cb9f	\N	\N
670d9760-cf99-40c5-8e29-7fd1801284c2	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 11:53:55.749943	\N	pending	ce9929f58e2367940e4934507617d8f89caadb32334ad57c2b5a7ef71e1229db	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}	\N
9e2849d1-fd54-4237-a145-b839f6196582	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 11:53:57.627234	\N	pending	81272329b11ea50b7239f222bd25346ca0de1ac7d789b3894acbf7fea72d7aab	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}	\N
673b8298-513b-4829-bd57-e1b60e12502a	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 12:06:11.152863	\N	pending	8049410d5995de8525d7d55c9564e0abc4152d8c6cf3d86435ecf21bff7049c1	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}	\N
41e77eaf-a76c-43e7-b7de-c1060cf299e0	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-01-08 12:06:13.483383	\N	pending	bab5c526ab3b3452dea325c741da5dcc56c31c0a124372b4e9cadefcc8c3f16a	{"teamId": "f8d11e8d-823d-43fb-86ad-d4069e0f051e", "useTeamPoints": true}	\N
1c2b97c5-0f07-4957-ac26-a7d0e7a8b4f6	ffe30495-7455-4198-a15d-56b44c289976	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-12 14:41:05.500813	COFFEE-ON-US	pending	42c9ac07361f22e50114fe2251bf4efac29eae84f61e8a0c05d394b5f0eb0d9c	\N	\N
59fc873a-caea-49e6-873d-dd15bebc41ae	ffe30495-7455-4198-a15d-56b44c289976	43585904-c504-4b47-8d97-5afc769eddfa	2026-01-12 15:12:37.545364	\N	pending	fe8c4392d05dc47528df616a05003f85b9d7c0323f5bd3d50ce4321636114761	\N	\N
0b45ca1c-5c29-4901-abbc-b9e35594fd1b	ffe30495-7455-4198-a15d-56b44c289976	43585904-c504-4b47-8d97-5afc769eddfa	2026-01-14 08:41:45.832386	\N	pending	4d20043c78a9739aaa329049bc6bee47166b450829f9013bd7836b697e659262	\N	\N
db8d525b-d635-4d5a-91d4-44c9db6b48cf	ffe30495-7455-4198-a15d-56b44c289976	e3d0d0cb-97bd-4e33-9000-53775168a095	2026-01-14 08:42:24.18087	FOOD-10OFF	pending	2fdc0fef90c7f0f345a8243cc1a53f5581cb65674dd973e199f0cfe5f658e9e3	\N	\N
599b0637-c8da-4b03-8584-0d9c9474f205	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-19 11:54:55.902155	COFFEE-ON-US	pending	a358181631ac93ee3066e237aa48f2b535673f97581abab1c64bc2c3c885143f	\N	\N
27118ca7-0d0b-4a8d-a336-f60efd29ab48	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-19 11:55:08.693369	COFFEE-ON-US	pending	f576b7f174cefa1bc6c4b9160160f446c2f91df82cd8f41dc47df51059e91805	\N	\N
a6775803-5783-4454-84b5-fcfbf60bcbe1	ffe30495-7455-4198-a15d-56b44c289976	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-17 16:56:27.265234	COFFEE-ON-US	pending	1c546779a419050f22f2ba37aceae30bdba32361893ae9ba1657c7a831f4225b	\N	\N
62550197-1061-4e70-8ff0-8c29ffd421e7	ffe30495-7455-4198-a15d-56b44c289976	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-19 15:03:13.53746	COFFEE-ON-US	pending	659153efd9afc5d1da10de0ab393b3a279f89aefd22cb2bc3467a1ae53917caa	\N	\N
413b6f34-4925-4417-a9a8-b98886882439	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-19 11:55:14.065804	COFFEE-ON-US	pending	ba92734590c9b7b3ea7d116281fa544a019e5bedc6dd4a0b26956f887831934a	\N	\N
c4b7b875-0ed1-4f71-bee7-eb3dbec9a508	ffe30495-7455-4198-a15d-56b44c289976	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-20 13:14:14.28269	COFFEE-ON-US	pending	7fc678f2209d554a1186acae739ff54a99977ea3d5e7c718ddce62701a91fb8b	\N	\N
2e7564ca-b5fa-43f1-a564-46b11e69092f	ffe30495-7455-4198-a15d-56b44c289976	43585904-c504-4b47-8d97-5afc769eddfa	2026-03-15 08:21:42.787951	\N	pending	c6d7e3278df7c22cb4ab1ab7caaa66be2d287eea0b3ca6ea7ea8318d77803676	\N	\N
ce054b52-3a08-4d25-982a-14c9c7194f6f	ffe30495-7455-4198-a15d-56b44c289976	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-03-15 08:21:57.724064	\N	pending	d5c89642477cab0355795c6f94791093fd3db45c186663052b3de1d26535a53d	\N	\N
e054d527-a57a-4cc6-bc13-1c4bfe2a82e9	ef4bfe44-a53e-4acf-8412-6a1a913da692	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-18 17:24:30.470403	COFFEE-ON-US	pending	1b5f1237e609f210eb245325872e02743f87affe59d7b89c07c66ed0e10e595b	\N	\N
48024d5f-1406-47e4-a74a-61696a5ab9b3	ef4bfe44-a53e-4acf-8412-6a1a913da692	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-18 17:24:30.482045	COFFEE-ON-US	pending	454baef04457fac55980f24568a1daf8d148708b8dc69adbf534bc9f6e8d41dd	\N	\N
d112b1fe-dcac-4e32-9246-e1106f7756c4	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-19 10:53:43.022068	COFFEE-ON-US	pending	c7a3adfb3955bfbc273d554a65691929e28005d4758303816308662013f8b8c4	\N	\N
adaa1e8b-47aa-4b4d-8f44-a404d840b47e	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-19 13:42:33.92128	COFFEE-ON-US	pending	46c5fc934bf6dab4edb63a2848d911a8353fb7450790894a16a2b6307cbd4bb6	\N	\N
8688aa67-66ef-49f0-b03e-9e06b8473410	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-19 14:48:10.195588	COFFEE-ON-US	pending	b46b3e12b05d46d36b0dd3e0f3b1401beff223b1d95c2353db641ddda5bc28be	\N	\N
89f2db88-3ad7-4c11-8ed9-9ba905ec632b	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-23 09:04:57.56639	COFFEE-ON-US	pending	023a24c219dd115cc0991b8d9fcf384771c89592e5e4870f710c6a5e07c0a86e	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
eb36f7d8-f1d9-4f8d-b588-559f27204552	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-23 09:07:14.190562	COFFEE-ON-US	pending	8beb5f0deb20986ab4f1d126f83400b40d830f6df41da026d4ae060c1a497c0b	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
7f807de7-9583-41d9-be53-807c95738c6a	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-23 09:07:14.191377	COFFEE-ON-US	pending	c88e465b0fea43cdf6163b8c31de30d0207bf3491dcc9a0d2fcf0e961cc778cd	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
05d64f66-da61-4979-a304-3f3f9afc9f4b	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-23 09:19:04.587763	COFFEE-ON-US	pending	09b2eceef1f67b5591fc7c16d17359046fda082a75b7a1aca38489d7bc963d1e	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
fe2fc462-6d51-49f8-b492-53e274660151	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-25 08:11:50.521104	COFFEE-ON-US	pending	0f8d77d8d84baebc74913a2d99fa1f8c0a6a91143be7dcd165ee5c335eaa1337	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
ca0efc07-bfdb-4767-8854-db5b144c7048	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-25 13:23:24.769992	COFFEE-ON-US	pending	530a3b31d3295fedae498848555f4b91cb34bcb2ed91f764abeb18ebc88e6a17	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
49360e69-8fb6-48c5-9233-70cdecb0863b	108873fe-b2e0-43a8-be0c-36f567e480cb	a56ba711-3277-497e-aeaf-3701d359c5fe	2026-03-25 13:23:28.122979	\N	pending	bdafcb92427e98eb287cada7a261606d1d27d3f51de8f199dc076a73a97ac313	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
f201af67-b523-49f7-8da8-9881304628f7	108873fe-b2e0-43a8-be0c-36f567e480cb	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-25 13:23:54.974691	COFFEE-ON-US	pending	77469801b8cae26b51eb753cfe68b96099439e4870f9cfcdc08152922ed8187e	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
4cb10803-fdb7-4857-a589-173cb48d5480	108873fe-b2e0-43a8-be0c-36f567e480cb	a56ba711-3277-497e-aeaf-3701d359c5fe	2026-03-25 14:43:18.44681	\N	pending	42446efc69b0c58d8220d5a634540f46dda467102b3af912762988c47ec7c1c6	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
d9164bc9-3013-4721-bcef-e8b58dc2d114	108873fe-b2e0-43a8-be0c-36f567e480cb	04919452-8903-4eb3-b395-f494b7dc56e2	2026-03-25 14:43:20.778717	\N	pending	257fd552ecaf13d8d908509a9c614c8167136544bcf499bfd43acab7397c01ca	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
946ed532-1872-4f14-8c47-db495703882c	108873fe-b2e0-43a8-be0c-36f567e480cb	1e691d8c-bdcf-4b77-9bdc-11ce4f0abbd7	2026-03-25 14:43:22.26366	\N	pending	2436fe0dc7d9ba44d8a28294de55c64b66f5b6583af59a93e9279b1f56d532c6	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
94e9c637-ed4b-439e-a8ac-5edf08e3dcfe	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-28 06:38:31.386335	COFFEE-ON-US	pending	ba9a2f62b679054c0206b2f7a9ddb98307e7b72b4bace39aa74d5c5a9bb9fee8	{"teamId": "cf1e2038-1479-4868-8566-6e02e1a105d7", "useTeamPoints": true}	\N
ab2fa46e-5ecb-496c-9d0c-9191806f84bc	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-28 18:43:37.537625	COFFEE-ON-US	pending	22d0436b62853d435c00219f9e46d13dfe270e6325422ddcdc46a6fee7b1740d	{"teamId": "cf1e2038-1479-4868-8566-6e02e1a105d7", "useTeamPoints": true}	\N
af12ed3e-b5af-418f-8972-b1cbf0c1a8f3	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-28 19:02:57.703582	COFFEE-ON-US	pending	0e61c4eca9dfe2c2cce82aa3ad1383db8efa76184d247c84288aec50f5a7e5a5	\N	\N
cded42d5-85d2-43be-954f-5d447db30841	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-04-02 14:46:45.781147	COFFEE-ON-US	pending	5d5a4f9471d1660414124e480bdf7e9559ff64e7d50100f93f5f083e99330bb2	\N	\N
b86caad9-22a7-45f6-9639-85586a826c33	ffe30495-7455-4198-a15d-56b44c289976	a56ba711-3277-497e-aeaf-3701d359c5fe	2026-04-10 12:14:57.657506	\N	pending	79ed4ceb22f3f455624e36282cceecdbb556de38b684b1c180c36cfb1a1a64d8	\N	\N
aa34c1d2-d344-4695-a910-26ff42296251	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:35:06.528658	COFFEE-ON-US	used	a04e1298903dda5c35a1d3fa9ee1ed3938934d889d8557ca5bc2ecfc2babc630	\N	2026-01-06 22:35:06.528658+00
6e32cc55-0822-4be6-b389-1c338a254cfa	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:38:47.465092	COFFEE-ON-US	used	76829d0711ef57572a3fac26343de89b1ab25795df58a5787915baddfb168032	\N	2026-01-06 22:38:47.465092+00
7746c8d6-4ab3-4557-8827-c22af685ca4e	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:49:21.884474	COFFEE-ON-US	used	da6682e805a4fc644a24324c045f61f5d4e63494d0d5aefae3a51de418febb12	\N	2026-01-06 22:49:21.884474+00
a548db0b-cfcb-41a9-a3c6-ee0fc0d94acd	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-06 22:58:22.019392	COFFEE-ON-US	used	34d80e052ebed03c0f6ca1a1670d2615c20adc9dafe8b2c240e8e83bba01ae86	\N	2026-01-06 22:58:22.019392+00
d16e9ebb-c65e-4664-b0cc-d7f71b0f84ae	ffe30495-7455-4198-a15d-56b44c289976	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-01-19 14:49:02.846977	COFFEE-ON-US	used	0bc87a08b51a6d6a6ae354caef89fe8cc592996670adad6f0039761021621166	\N	2026-01-19 14:49:02.846977+00
b2eb1190-fe9e-4bd2-8feb-d9a3184550cb	ffe30495-7455-4198-a15d-56b44c289976	a56ba711-3277-497e-aeaf-3701d359c5fe	2026-01-19 14:49:26.10213	\N	used	ecc7b5bcdfa16a94858b3d29c8addb6c5d2f62b0ed2a67f248d34764746b0521	\N	2026-01-19 14:49:26.10213+00
49258500-f2db-4851-b03b-6ef7aa6ee4ff	108873fe-b2e0-43a8-be0c-36f567e480cb	28523340-2397-4b85-991d-6115616f12a3	2026-03-26 12:53:17.587791	\N	used	76fe83691c08f738b11b562db893021bd7f30b071219a1714e39812d8be6b832	\N	2026-03-26 12:53:17.587791+00
b92e87f9-d704-4d4f-8acf-bffeb5a4ee94	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-04-07 10:30:13.13626	COFFEE-ON-US	used	afbb2f53d7e25a8adda36fa1d0360e2d4696aa6285389dc57017ed39640dafcd	\N	2026-04-07 10:30:13.13626+00
6e1fdbba-e4cb-4567-89e3-b5686d37c28d	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	a56ba711-3277-497e-aeaf-3701d359c5fe	2026-04-12 13:34:14.877672	\N	pending	41d874c83d36ccc30622ea59c897edace2296c591f091085353e88dae71504d0	\N	\N
f7dac86a-ba58-43b9-8da2-1e0f5143043c	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	04919452-8903-4eb3-b395-f494b7dc56e2	2026-04-12 18:19:52.234982	\N	pending	77a4243c28f146041a697132f6a74f612f37bc03da373fb6bae3b7e92281e5ce	\N	\N
545797de-d632-43a5-ae34-ba89486b1290	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	69506b05-c7ea-464b-8bf7-94abb7f72343	2026-04-12 20:02:00.959122	\N	pending	da4eb1e08a0898958a729c956d51df3f61050ff978e469bdcf0c9b3841a49a13	\N	\N
48107b65-fb5f-4aa0-89d1-72f00ce8b018	108873fe-b2e0-43a8-be0c-36f567e480cb	69506b05-c7ea-464b-8bf7-94abb7f72343	2026-04-13 08:39:37.412075	\N	pending	e8f7d0a21a0043ab98d22c751c752f2c3cfa305182e579d73d48af6bc5e0385f	\N	\N
756fb210-bbdf-4e07-80fc-b60922e7819f	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	a119fd67-72ba-4093-9863-9876ae403dd3	2026-04-13 11:54:47.400455	\N	pending	782868f0526f4c4beb6dd011c56fd1cbbb9ba55b10f6ef3b86b4ecaedba0d395	\N	\N
232068cd-47b2-46c9-8a41-698e62ab46f0	108873fe-b2e0-43a8-be0c-36f567e480cb	b6e79a8a-2369-41ee-810b-4daadfbe3b21	2026-04-13 12:27:07.664611	\N	pending	30915feea5414d70b67b6396592b3691e83b3b55ea2fb363ca1adfbc67ea2360	\N	\N
324909b7-1c51-4d8e-a51e-916300a3d30d	ffe30495-7455-4198-a15d-56b44c289976	054e63a8-b769-4608-a209-b6cf44dc521c	2026-04-13 19:09:23.974547	\N	pending	b2bddd3b4024b7958fe1f6148fddf4320baf56e45c054a6088b9cde63c453bd1	\N	\N
ac66cbcc-4c79-43ac-9abf-61a314e8553f	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	28523340-2397-4b85-991d-6115616f12a3	2026-04-15 04:35:23.587434	\N	pending	a61b7268a4faa5a66aff1bfade7668e48af10478b12848f6a6839f607b2973d5	\N	\N
e321f7b7-b285-4f59-bda8-30050c10c9da	108873fe-b2e0-43a8-be0c-36f567e480cb	cc59bf78-ce44-431d-8371-39e75cbc8c43	2026-04-15 12:05:11.239819	\N	pending	b76c6e74feae0bb543a5f50d54dda0cb448d3c7c79b1069416a28f3fd49c8e74	\N	\N
5069e938-75b8-47c3-a3f3-c15b2530d36e	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-03-28 18:53:23.003219	COFFEE-ON-US	pending	eb4aeea112c504cbe0a6871714c297adb429dce17177972115a18ccf7dfc1070	{"teamId": "cf1e2038-1479-4868-8566-6e02e1a105d7", "useTeamPoints": true}	\N
e0d9d792-8b19-4cbe-852f-ecdd2a95a36b	ffe30495-7455-4198-a15d-56b44c289976	c8aad02a-d1d9-466d-be45-fd3b0512fe8d	2026-04-10 12:15:00.92448	COFFEE-ON-US	pending	936ca4c58fb99a8c342cfdf500d8b136921c441e6db38cd4ddccac7d3238d3bd	\N	\N
794487ef-0e7d-489b-b608-5794237faf76	ffe30495-7455-4198-a15d-56b44c289976	28523340-2397-4b85-991d-6115616f12a3	2026-04-10 12:15:18.670307	\N	pending	6073ac138afe73c3f41455339681f99f6e4b6491eb7940cbe6922b73569a711c	\N	\N
138d5cfe-48d2-4077-9ae8-86f3e450bad3	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	1e691d8c-bdcf-4b77-9bdc-11ce4f0abbd7	2026-04-13 13:10:08.775886	\N	pending	cc0b942566c2943e9fd8076487b9030bcccbc3ab58627be525ca62d54ac76815	\N	\N
866f7922-7660-41e4-b94a-c02a126f9a14	108873fe-b2e0-43a8-be0c-36f567e480cb	43585904-c504-4b47-8d97-5afc769eddfa	2026-04-14 08:36:50.308624	\N	pending	c425c82c3dde95e389f4c9687d0fb2e5e412d98c337b22a51767cac3b9127d07	\N	\N
8fd39f07-8ae0-4a7d-a4b8-29bf70c83ded	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	43585904-c504-4b47-8d97-5afc769eddfa	2026-04-13 13:11:14.935345	\N	pending	1d24a806a50285677f75bb057c79cc477f8ad2939e3bcd10147f78d45cde4809	\N	\N
c44b34a4-ca86-415b-ad0b-f5e8df8af6ca	108873fe-b2e0-43a8-be0c-36f567e480cb	054e63a8-b769-4608-a209-b6cf44dc521c	2026-04-14 10:00:46.449338	\N	pending	a6a41e1d7df876ed10bc5e8d472daaa9d89ce2cf06a55a12682b54bf1d761b6a	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
5f5b4de0-5fbe-4410-93c4-0604fd50fff1	108873fe-b2e0-43a8-be0c-36f567e480cb	0f396d91-7561-472c-8cff-27d9719e98cd	2026-04-14 10:01:00.610015	\N	pending	71d6650be05486bd45dafa11b46734ff98de19628a8d0320f95b868b388cfa8c	\N	\N
c24a1c11-1110-414e-bf21-a2a85a25f228	108873fe-b2e0-43a8-be0c-36f567e480cb	52a5b7cb-a091-4027-99d7-5274ad067eaa	2026-04-14 10:01:10.29535	\N	pending	2986585ce210e60cd64e3b0039c8693a02bf35018299ee2c27dfd1b29d9a4d4b	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
a6ec1177-af84-47a3-91bf-7d4b4b725758	108873fe-b2e0-43a8-be0c-36f567e480cb	a56ba711-3277-497e-aeaf-3701d359c5fe	2026-03-25 14:43:18.446945	\N	pending	fc66ccd2dc30ad6d4933266482adade3f57a3602c11bcee20b291ec863a6fb7a	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
898b7d31-d68c-4fc3-8f62-e30b093d4c40	108873fe-b2e0-43a8-be0c-36f567e480cb	04919452-8903-4eb3-b395-f494b7dc56e2	2026-03-25 14:43:20.778588	\N	pending	f72fefafc58f8ffde1a0367e031fd2dd12d96f9c6f2e913656039e8f0659e0ca	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
edbd90b8-7ceb-447a-bb0a-7faaaadd8596	108873fe-b2e0-43a8-be0c-36f567e480cb	1e691d8c-bdcf-4b77-9bdc-11ce4f0abbd7	2026-03-25 14:43:22.2638	\N	pending	f65d3ef47501ae74a2f2fdc202abefdbfb90122dbafe4eadceb792f13933a73d	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
b90d2f57-5970-4d9e-9a44-e1f8be8f4d0e	108873fe-b2e0-43a8-be0c-36f567e480cb	a119fd67-72ba-4093-9863-9876ae403dd3	2026-03-25 14:43:23.44862	\N	pending	6664062abaaea7ef7f9a4468b01d98cb3b5fbfca16a3adcd89583350e3539b48	{"teamId": "e7a15685-970f-47f8-8a5c-8a6a52d7420c", "useTeamPoints": true}	\N
\.


--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rewards (id, title, description, points_cost, reward_type, voucher_code, external_api_id, active, created_at, updated_at, location_id, recurrence, last_generated_at, reward_art, kategorie, allowed_teams, allowed_contests, thumbnail_url, moegliche_punkte, zielgruppe, title_i18n, description_i18n, generated_from_reward_id) FROM stdin;
e3d0d0cb-97bd-4e33-9000-53775168a095	10% Restaurant Discount	Get 10% off at the hotel restaurant.	40	discount	FOOD-10OFF	\N	f	2025-12-04 11:14:44.33435	2026-01-19 12:15:09.499986	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Erlebnis	Hotel	{}	{}	\N	\N	\N	{"de": "10% Restaurant Discount", "en": "10% restaurant discount"}	{"de": "Get 10% off at the hotel restaurant.", "en": "Get 10% off at the hotel restaurant."}	\N
c8aad02a-d1d9-466d-be45-fd3b0512fe8d	Free Coffee	Enjoy one free coffee at the hotel bar.	35	voucher	COFFEE-ON-US	\N	t	2025-12-04 11:14:44.314907	2026-01-19 12:15:36.52028	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	Hotel	{}	{}	\N	\N	\N	{"de": "Free Coffee", "en": "Free Coffee"}	{"de": "Enjoy one free coffee at the hotel bar.", "en": "Enjoy one free coffee at the hotel bar."}	\N
69506b05-c7ea-464b-8bf7-94abb7f72343	Shoppingrabatt	Hotelshop 5%	70	discount	\N	\N	t	2026-01-04 14:26:59.824135	2026-01-06 19:08:21.315026	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Rabatt	nicht Hotel	{}	{}	\N	\N	\N	{"de": "Shoppingrabatt", "en": "Shopping discount"}	{"de": "Hotelshop 5%", "en": "Hotel shop 5%"}	\N
04919452-8903-4eb3-b395-f494b7dc56e2	Late Checkout	Enjoy late checkout until 2 PM. \nNach Verfügbarkeit.	60	benefit	\N	\N	t	2025-12-04 11:14:44.338973	2026-01-19 12:14:15.88448	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Add-on	Hotel	{}	{}	\N	\N	\N	{"de": "Late Checkout", "en": "Late checkout"}	{"de": "Enjoy late checkout until 2 PM. \\nNach Verfügbarkeit.", "en": "Enjoy late checkout until 2 PM. \\nSubject to availability."}	\N
1e691d8c-bdcf-4b77-9bdc-11ce4f0abbd7	Garagenplatz	Parkplatz in der Garage umsonst	80	benefit	\N	\N	t	2026-01-04 14:26:59.820641	2026-01-04 14:26:59.820641	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Rabatt	Hotel	{}	{}	\N	\N	\N	{"de": "Garagenplatz", "en": "Garage space"}	{"de": "Parkplatz in der Garage umsonst", "en": "Parking space in the garage for free"}	\N
054e63a8-b769-4608-a209-b6cf44dc521c	Freigetränk	Flasche Wein/Sekt	120	benefit	\N	\N	t	2026-01-04 14:26:59.819595	2026-01-19 12:11:52.1515	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	Hotel	{}	{}	\N	\N	\N	{"de": "Freigetränk", "en": "Free drink"}	{"de": "Flasche Wein/Sekt", "en": "Bottle of wine/champagne"}	\N
52a5b7cb-a091-4027-99d7-5274ad067eaa	Roll the Dice	Würfel. Bei einer 6 ist dein Aufenthalt/Eine Nacht umsonst (Nur Übernachtung)	400	discount	\N	\N	t	2026-01-04 14:26:59.814703	2026-01-19 12:13:10.752744	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Erlebnis	Hotel	{}	{}	\N	\N	\N	{"de": "Roll the Dice", "en": "Roll the dice"}	{"de": "Würfel. Bei einer 6 ist dein Aufenthalt/Eine Nacht umsonst (Nur Übernachtung)", "en": "Dice. With a 6 your stay/one night is free (overnight stay only)"}	\N
a119fd67-72ba-4093-9863-9876ae403dd3	Fahrrad	Fahrrad für einen Tag umsonst	80	benefit	\N	\N	t	2026-01-04 14:26:59.821669	2026-01-19 12:13:37.453446	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Add-on	Hotel	{}	{}	\N	\N	\N	{"de": "Fahrrad", "en": "Bicycle"}	{"de": "Fahrrad für einen Tag umsonst", "en": "Free bike for one day"}	\N
a56ba711-3277-497e-aeaf-3701d359c5fe	Freigetränk	Ein Freigetränk (Bier, Glas Wein, Limo)	50	benefit	\N	\N	t	2026-01-04 14:26:59.818462	2026-01-19 12:14:46.587858	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	Hotel	{}	{}	\N	\N	\N	{"de": "Freigetränk", "en": "Free drink"}	{"de": "Ein Freigetränk (Bier, Glas Wein, Limo)", "en": "One free drink (beer, glass of wine, soda)"}	\N
c6306434-7d67-4031-9acb-86b868266a94	Team Coffee Break	Organized team coffee break for your department.	120	team_event	\N	\N	f	2025-12-04 11:14:44.339994	2026-01-19 12:13:46.786299	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Add-on	nicht Hotel	{}	{}	\N	\N	\N	{"de": "Team Coffee Break", "en": "Team coffee break"}	{"de": "Organized team coffee break for your department.", "en": "Organized team coffee break for your department."}	\N
0f396d91-7561-472c-8cff-27d9719e98cd	Zimmerupgrade	Ein Zimmerupgrade bei der nächsten Übernachtung oder sofort (wenn bei Anreise eingelöst wird)	150	benefit	\N	\N	t	2026-01-04 14:26:59.817366	2026-01-04 14:26:59.817366	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	Hotel	{}	{}	\N	\N	\N	{"de": "Zimmerupgrade", "en": "Room upgrade"}	{"de": "Ein Zimmerupgrade bei der nächsten Übernachtung oder sofort (wenn bei Anreise eingelöst wird)", "en": "A room upgrade for the next overnight stay or immediately (if redeemed upon arrival)"}	\N
b6e79a8a-2369-41ee-810b-4daadfbe3b21	Aromabad	Genieße unser Aromabad im PrivateSpa	250	benefit	\N	\N	t	2026-01-04 14:26:59.825148	2026-03-23 07:04:45.18335	e24f97e1-81fb-496e-a48f-9ce29a6be570	weekly	2026-04-05 15:31:34.605326	Add-on	Hotel	{}	{}	https://luise.bio/uploads/reward-thumbnail-1768642425376-45571224.jpg	\N	\N	{"de": "Aromabad", "en": "Aroma bath"}	{"de": "Genieße unser Aromabad im PrivateSpa", "en": "Enjoy our aromatic bath in the PrivateSpa"}	\N
43585904-c504-4b47-8d97-5afc769eddfa	Snackbox	Snacks (Chips & Popcorn)	80	benefit	\N	\N	t	2026-01-04 14:26:59.822646	2026-01-19 12:14:59.365283	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	physisches Geschenk	Hotel	{}	{}	\N	\N	\N	{"de": "Snackbox", "en": "Snack box"}	{"de": "Snacks (Chips & Popcorn)", "en": "Snacks (chips & popcorn)"}	\N
cc59bf78-ce44-431d-8371-39e75cbc8c43	Freigetränk	Ein Freigetränk (Bier, Glas Wein, Limo)	50	benefit	\N	\N	t	2026-04-15 06:10:27.962131	2026-04-15 06:10:27.962131	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Freigetränk", "en": "Freigetränk"}	{"de": "Ein Freigetränk (Bier, Glas Wein, Limo)", "en": "Ein Freigetränk (Bier, Glas Wein, Limo)"}	\N
28523340-2397-4b85-991d-6115616f12a3	Freigetränk	Ein Freigetränk (Bier, Glas Wein, Limo)	120	benefit	\N	\N	t	2026-03-18 14:47:20.804994	2026-03-18 18:27:42.582079	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Freigetränk", "en": "Free drink"}	{"de": "Ein Freigetränk (Bier, Glas Wein, Limo)", "en": "One complimentary drink (beer, glass of wine, or soft drink)"}	\N
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
22	047_add_unique_constraint_qr_code	2026-01-17 11:09:24.169145
23	021_visit_location_task	2026-01-17 15:25:33.532056
24	022_article_quiz_task	2026-01-17 15:25:33.53472
25	023_survey_task	2026-01-17 15:25:33.536377
26	024_reward_location_categories	2026-01-17 15:25:33.538392
27	025_points_bonus_qr_tokens	2026-01-17 15:25:33.541377
28	026_task_prerequisites	2026-01-17 15:25:33.545746
29	027_task_metadata	2026-01-17 15:25:33.550059
30	028_populate_task_metadata	2026-01-17 15:25:33.559592
31	029_reward_metadata	2026-01-17 15:27:43.670666
32	030_populate_reward_metadata	2026-01-17 15:27:43.682567
33	031_task_zielgruppe	2026-01-17 15:30:22.308341
34	033_parameter_tables	2026-01-17 15:30:22.314198
35	034_add_parameter_weight	2026-01-17 15:30:22.3188
36	035_points_calculation_factor	2026-01-17 15:30:22.321322
37	036_reward_cost_calculation_factor	2026-01-17 15:30:22.322466
38	037_reward_model_simplification	2026-01-17 15:32:42.989986
39	038_task_model_simplification	2026-01-17 15:37:08.86548
40	039_remove_reward_kosten_moegliche_punkte	2026-01-17 15:37:08.869669
41	040_reward_zielgruppe	2026-01-17 15:39:33.146078
42	041_restore_moegliche_punkte	2026-01-17 15:39:33.149878
43	042_zielgruppe_multiselect	2026-01-17 15:39:33.159631
44	043_teams_contests	2026-01-17 15:39:33.164355
45	043_add_front_office_to_zielgruppe	2026-01-17 15:39:33.167098
46	044_replace_mitarbeitende_with_front_office	2026-01-17 15:39:33.173391
47	044_reward_redemption_metadata	2026-01-17 15:39:33.174625
48	045_remove_stakeholder_from_zielgruppe	2026-01-17 15:39:33.176307
49	046_contest_rewards_awarded	2026-01-17 15:39:33.177423
50	046_remove_duplicate_zielgruppe	2026-01-17 15:39:33.179449
51	047_task_reward_thumbnails	2026-01-17 15:39:33.180469
52	048_fix_user_role_enum	2026-01-17 15:42:58.863388
53	049_team_contest_registration_qr_codes	2026-01-17 15:42:58.882324
54	050_replace_front_office_with_rezeption_redaktion	2026-01-17 15:42:58.910348
55	051_replace_allowed_roles_with_teams_contests	2026-01-17 15:46:23.638875
56	052_photo_task_verification	2026-01-17 15:46:23.66219
57	053_mailbox_messages	2026-01-17 15:46:23.671919
58	054_remove_event_group	2026-01-19 15:38:50.045216
59	034_users_active	2026-03-13 12:59:05.095903
60	055_users_preferred_language	2026-03-13 12:59:05.102679
61	056_tasks_i18n	2026-03-13 12:59:05.110713
62	057_rewards_i18n	2026-03-13 12:59:05.404624
63	058_locations_i18n	2026-03-13 12:59:05.409867
64	059_contests_i18n	2026-03-13 12:59:05.415452
65	060_teams_i18n	2026-03-13 12:59:05.41921
66	061_luise_demo_accounts	2026-03-18 19:03:40.945488
67	062_tasks_quiz_survey_i18n	2026-03-19 14:45:57.20747
68	063_forest_category_points	2026-03-28 09:40:52.399077
69	064_player_profile	2026-03-31 08:58:40.922842
70	065_onboarding_config	2026-04-01 10:11:11.736147
71	066_backfill_forest_points_from_user_tasks	2026-04-01 10:59:29.498168
72	067_quiz_question_locks	2026-04-03 10:34:59.672384
73	068_guest_public_tasks	2026-04-03 10:34:59.683303
74	069_repair_survey_questions_nulls	2026-04-03 10:34:59.687061
75	070_backfill_forest_points_from_user_tasks_v2	2026-04-03 11:23:26.48591
76	071_reward_recurrence_template_link	2026-04-12 13:26:42.657359
77	072_reward_redemptions_verified_at	2026-04-12 13:28:44.702504
78	073_email_delivery_reliability	2026-04-13 07:37:44.766917
79	074_tasks_teaser_i18n	2026-04-13 07:37:44.769303
80	075_backfill_task_teasers	2026-04-13 07:37:44.78991
81	076_tasks_video_subtitles_i18n	2026-04-13 15:17:53.116429
82	077_backfill_video_subtitles_en	2026-04-13 15:17:53.125778
83	078_fix_video_subtitles_for_youtube	2026-04-13 15:29:23.660707
84	079_backfill_video_subtitles_text_vtt	2026-04-13 15:41:18.645942
85	080_daily_login_points	2026-04-14 10:23:00.776785
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
655d1246-813b-4ef3-a96e-324da5b48707	points_calculation_factor	5	Factor for calculating task points: (difficulty_weight * time_required_weight) * factor	2026-01-04 14:26:46.582898	2026-04-02 11:08:09.489935
5585bd6a-4123-413a-9452-82fd3a5a1fdb	onboarding_config	{"version":1,"dyadCount":4,"questionsPerDyad":1,"introSlides":[{"titleDe":"Schön, dass du hier bist!","titleEn":"Welcome!","bodyDe":"In dieser Welt steckt mehr, als man auf den ersten Blick sieht. Antworte auf ein paar kurze Fragen – und wir verraten dir, welches Wesen tief in dir schlummert.","bodyEn":"There is more to this world than meets the eye. Answer a few short questions and we will tell you which creature slumbers within you.","backgroundImageUrl":null},{"titleDe":"Zweite Seite","titleEn":"second page","bodyDe":"Nur ein weiterer Text","bodyEn":"just another text.","backgroundImageUrl":null}],"introTitleDe":"Schön, dass du hier bist!","introTitleEn":"Welcome!","introBodyDe":"In dieser Welt steckt mehr, als man auf den ersten Blick sieht. Antworte auf ein paar kurze Fragen – und wir verraten dir, welches Wesen tief in dir schlummert.","introBodyEn":"There is more to this world than meets the eye. Answer a few short questions and we will tell you which creature slumbers within you.","characterIcons":{},"steps":[{"scenarioDe":"Stell dir deine nächsten Wochen vor: Was gibt dir mehr Halt – klare Ziele und Meilensteine oder der offene Weg und die Momente unterwegs?","scenarioEn":"What gives you more stability in the coming weeks—clear goals and milestones, or the open road and moments along the way?","poleLowDe":"Eher zielorientiert","poleLowEn":"More goal-oriented","poleHighDe":"Eher erlebnisorientiert","poleHighEn":"More experience-oriented","backgroundImageUrl":"https://luise.bio/uploads/onboarding-bg-1775038553504-210184526.png"},{"scenarioDe":"Wenn du einen freien Tag planst: Suchst du lieber feste Struktur und feste Zeiten – oder viel Freiraum für Spontanes?","scenarioEn":"When you plan a free day: do you prefer fixed structure and times—or a lot of room for spontaneity?","poleLowDe":"Eher Struktur","poleLowEn":"More structure","poleHighDe":"Eher Freiheit","poleHighEn":"More freedom","backgroundImageUrl":"https://luise.bio/uploads/onboarding-bg-1775038560997-402617355.png"},{"scenarioDe":"In einer Gruppe: Übernimmst du gern die Richtung – oder fließt du lieber mit und stärkst das Miteinander?","scenarioEn":"In a group: do you prefer to lead—or go with the flow and strengthen togetherness?","poleLowDe":"Eher Führung / Kontrolle","poleLowEn":"More lead / control","poleHighDe":"Eher Annehmen / Mitgehen","poleHighEn":"More accept / follow","backgroundImageUrl":"https://luise.bio/uploads/onboarding-bg-1775038568611-371935493.png"},{"scenarioDe":"Bei Entscheidungen: Was wiegt für dich schwerer – dein eigenes Wohlbefinden oder das Wohl für alle Beteiligten?","scenarioEn":"What weighs more for you—your own well-being or the interests of everyone involved?","poleLowDe":"Eher Eigeninteresse","poleLowEn":"More self-interest","poleHighDe":"Eher Gemeinwohl","poleHighEn":"More common good","backgroundImageUrl":"https://luise.bio/uploads/onboarding-bg-1775038575700-437017124.png"}]}	Spieler-Onboarding: Dyaden, Fragen, Hintergrundbilder	2026-04-01 10:16:18.865506	2026-04-15 12:29:48.817282
\.


--
-- Data for Name: task_parameters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_parameters (id, parameter_type, value, display_order, active, created_at, updated_at, weight) FROM stdin;
c5e808d2-ee25-48fe-9e2f-138aa49b2c7a	type	video	1	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
de9c89bf-dcf2-4ce1-b514-23f78d379071	type	article_quiz	3	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
68deb7e6-626d-48e3-930a-78109a93ee2b	type	survey	4	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
213baa26-e7d5-438c-b424-19da7eacea40	type	qr	5	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
191fb82b-e4d2-4581-926d-3bdd71f11454	type	photo	6	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
2aac6c95-16df-4f91-93d2-483141b88363	type	visit_location	7	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
3d7f1bdd-6cac-414c-80de-61801c4080c4	category	Kommunikation & Netzwerke	1	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
c4f59ce4-2c9b-4824-93e6-0cbb5c6d3dc8	category	Mensch & soziales Umfeld	2	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
835b41e1-c270-4f78-a66b-f36f5918886d	category	Natur & Umweltschutz	3	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
14709367-d701-499e-b731-d2673f847122	category	Ressourcenverbrauch & Materialeinsatz	4	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
424efea1-5bbd-401f-a4a5-27885e573d41	location_tool	egal	3	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	0.00
9a681ed7-9879-4a5c-8981-e28d9f3cc6c1	difficulty	sehr einfach	1	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	1.00
4cff0610-e65e-4062-818d-df6963a6612c	difficulty	einfach	2	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	2.00
562ebe04-5a84-44ca-af7c-32c6e14b5de8	difficulty	mittel	3	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	3.00
360c1acd-c88a-4a2b-accb-6f029083caa2	difficulty	schwer	4	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	4.00
5c2920fe-a115-4166-ae97-2af58447268e	difficulty	sehr schwer	5	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	5.00
54e1a182-4ae6-476b-974c-c8b7ff64dfff	time_required	1-3 Min	1	t	2026-01-04 14:26:46.378272	2026-01-04 14:26:46.378272	1.00
9d210f45-88ef-457d-a453-1f7414ea8b66	zielgruppe	Gäste	1	t	2026-01-06 19:07:05.083652	2026-01-06 19:07:05.083652	1.00
746e7cf9-c9a0-4188-81ce-5453b1ef9e56	zielgruppe	Front Office	2	t	2026-01-06 19:07:14.118728	2026-01-06 19:07:14.118728	2.00
3b6b0f66-fbbc-458a-85cf-3ec0102ed3d8	time_required	3-10 Min	2	t	2026-01-04 14:26:46.378272	2026-01-19 09:36:44.760557	1.50
baf70939-f9ce-4bbc-ac48-2fc5bc39780f	time_required	10-30 Min	3	t	2026-01-04 14:26:46.378272	2026-01-19 09:36:53.670337	2.00
13189ce9-eecd-40f5-8119-b21a3495bfc2	time_required	30-60 Min	4	t	2026-01-04 14:26:46.378272	2026-01-19 09:37:04.689633	2.50
a164d597-9ca4-4fa4-95aa-bf2b1c76931c	time_required	60+ Min	5	t	2026-01-04 14:26:46.378272	2026-01-19 09:37:11.326357	3.00
c2c309ee-3887-4202-979b-b5a1a77193ae	location_tool	Hotel	1	t	2026-01-04 14:26:46.378272	2026-01-19 09:37:50.754016	0.00
07db5b50-a921-4a65-b126-d422eb7959a7	location_tool	Smartphone/PC	2	t	2026-01-04 14:26:46.378272	2026-01-19 09:38:01.756484	0.00
8e81b500-a4da-4459-8ca5-b2ce7c3f4ac4	location_tool	Umgebung	4	t	2026-01-04 14:26:46.378272	2026-01-19 09:38:08.17502	0.00
f0ec8e98-04fa-4deb-9f2b-5462419e73a2	type	Ucicicucjccjxjc	0	t	2026-03-26 13:48:40.976143	2026-03-26 13:48:40.976143	0.00
c0f47ffc-0bca-4dd5-b468-c56b4b928fab	difficulty	??))!?((???,??  Vv.  COVID.  Von.   	0	t	2026-03-26 14:14:08.730162	2026-03-26 14:14:08.730162	0.00
ab6bd66c-7cb2-4bfc-a630-2d776b53abbc	type	56,;(),:	22	t	2026-03-26 07:04:13.97682	2026-04-02 11:12:27.427213	0.00
26b499a3-1793-45ba-8304-ccf5b022375f	type	Tz	22	t	2026-04-02 11:16:43.137942	2026-04-02 11:16:43.137942	22.00
ac3c463e-8f77-46bc-814e-280ab23c5719	type	Zzzz	22	t	2026-04-02 11:17:19.36351	2026-04-02 11:17:19.36351	22.00
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, description, type, points, video_url, quiz_questions, qr_code, photo_required, co2_savings_kg, external_id, active, created_at, updated_at, location_id, recurrence, last_generated_at, category, difficulty, time_required, location_tool, target_latitude, target_longitude, article_url, article_content, survey_questions, survey_type, prerequisite_task_id, prerequisite_task_count, prerequisite_task_ids, allowed_teams, allowed_contests, thumbnail_url, zielgruppe, title_i18n, description_i18n, article_content_i18n, allow_public_completion, teaser, teaser_i18n, video_subtitles_i18n) FROM stdin;
58c15636-8828-4ac8-b5ce-ac33c0b900ef	Vegetarisches Frühstück	Wir sind neugierig, hast du bei uns vegetarisch gefrühstückt und wenn ja, wie hast du dir ein Menü zusammengestellt? Mache ein Bild von deinem Frühstücksteller, vielleicht inspiriert er auch andere...	photo	23	\N	\N	\N	t	0.00	\N	t	2026-01-19 13:11:16.174047	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	daily	\N	Natur & Umweltschutz	mittel	3-10 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Vegetarisches Frühstück", "en": "Vegetarian breakfast"}	{"de": "Wir sind neugierig, hast du bei uns vegetarisch gefrühstückt und wenn ja, wie hast du dir ein Menü zusammengestellt? Mache ein Bild von deinem Frühstücksteller, vielleicht inspiriert er auch andere...", "en": "We are curious, did you have a vegetarian breakfast with us and if so, how did you put together a menu? Take a picture of your breakfast plate, maybe it will inspire others too..."}	{}	f	Wir sind neugierig, hast du bei uns vegetarisch…	{"de": "Wir sind neugierig, hast du bei uns vegetarisch…", "en": "We are curious, did you have a vegetarian breakfast with…"}	\N
0b1a16a9-c712-4195-ad7d-e37abffa1074	Fair Fashion	Trägst du ein Fair Fashion Kleidungstück? Schicke uns ein Bild von deinem Look und der Marke!	photo	15	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.976274	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	einfach	3-10 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	https://luise.bio/uploads/task-thumbnail-1768595913025-462450656.png	{{Gäste}}	{"de": "Fair Fashion", "en": "Fair fashion"}	{"de": "Trägst du ein Fair Fashion Kleidungstück? Schicke uns ein Bild von deinem Look und der Marke!", "en": "Are you wearing fair fashion clothing? Send us a picture of your look and the brand!"}	{}	f	Trägst du ein Fair Fashion Kleidungstück? Schicke uns ein…	{"de": "Trägst du ein Fair Fashion Kleidungstück? Schicke uns ein…", "en": "Are you wearing fair fashion clothing? Send us a picture…"}	\N
bdfd714f-988e-47ba-9f92-181d2dd608d0	Unser Hotelname	Woher kommt eigentlich der Hotelname? 	video	10	https://www.youtube.com/shorts/sfdtSU7oBt0	[{"answers": [{"id": "a_1", "text": "Hannelore", "text_i18n": {"de": "Hannelore", "en": "Hannelore"}, "option_i18n": {"de": "Hannelore", "en": "Hannelore"}}, {"id": "a_2", "text": "Georg", "text_i18n": {"de": "Georg", "en": "George"}, "option_i18n": {"de": "Georg", "en": "George"}}, {"id": "a_3", "text": "Lisa", "text_i18n": {"de": "Lisa", "en": "Lisa"}, "option_i18n": {"de": "Lisa", "en": "Lisa"}}, {"id": "a_4", "text": "Benjamin", "text_i18n": {"de": "Benjamin", "en": "Benjamin"}, "option_i18n": {"de": "Benjamin", "en": "Benjamin"}}], "options": [{"id": "a_1", "text": "Hannelore", "text_i18n": {"de": "Hannelore", "en": "Hannelore"}, "option_i18n": {"de": "Hannelore", "en": "Hannelore"}}, {"id": "a_2", "text": "Georg", "text_i18n": {"de": "Georg", "en": "George"}, "option_i18n": {"de": "Georg", "en": "George"}}, {"id": "a_3", "text": "Lisa", "text_i18n": {"de": "Lisa", "en": "Lisa"}, "option_i18n": {"de": "Lisa", "en": "Lisa"}}, {"id": "a_4", "text": "Benjamin", "text_i18n": {"de": "Benjamin", "en": "Benjamin"}, "option_i18n": {"de": "Benjamin", "en": "Benjamin"}}], "question": "Welchen Namen hätte das Hotel fast bekommen?", "prompt_i18n": {"de": "Welchen Namen hätte das Hotel fast bekommen?", "en": "What name did the hotel almost get?"}, "correctAnswer": "Georg"}]	\N	f	0.00	\N	t	2026-01-13 15:56:56.789389	2026-04-13 15:29:23.651089	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{"Front Office",Gäste}	{"de": "Unser Hotelname", "en": "Our hotel name"}	{"de": "Woher kommt eigentlich der Hotelname? ", "en": "Where does the hotel name actually come from?"}	{}	f	Woher kommt eigentlich der Hotelname?	{"de": "Woher kommt eigentlich der Hotelname?", "en": "Where does the hotel name actually come from?"}	{}
42296565-9379-4c71-9050-ad241a982245	Cradle-to-Cradle	Was heißt denn eigentlich Cradle-to-Cradle und wofür steht es? 	video	5	https://luise.bio/uploads/task-video-1768817164682-446767678.mp4	[{"answers": [{"id": "a_1", "text": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "text_i18n": {"de": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "en": "Keeping raw materials in circulation and reusing them"}, "option_i18n": {"de": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "en": "Keeping raw materials in circulation and reusing them"}}, {"id": "a_2", "text": "Das ist der Name einer Rockband", "text_i18n": {"de": "Das ist der Name einer Rockband", "en": "That's the name of a rock band"}, "option_i18n": {"de": "Das ist der Name einer Rockband", "en": "That's the name of a rock band"}}, {"id": "a_3", "text": "Ist eine Sprungtechnik von Insekten", "text_i18n": {"de": "Ist eine Sprungtechnik von Insekten", "en": "Is a jumping technique used by insects"}, "option_i18n": {"de": "Ist eine Sprungtechnik von Insekten", "en": "Is a jumping technique used by insects"}}], "options": [{"id": "a_1", "text": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "text_i18n": {"de": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "en": "Keeping raw materials in circulation and reusing them"}, "option_i18n": {"de": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "en": "Keeping raw materials in circulation and reusing them"}}, {"id": "a_2", "text": "Das ist der Name einer Rockband", "text_i18n": {"de": "Das ist der Name einer Rockband", "en": "That's the name of a rock band"}, "option_i18n": {"de": "Das ist der Name einer Rockband", "en": "That's the name of a rock band"}}, {"id": "a_3", "text": "Ist eine Sprungtechnik von Insekten", "text_i18n": {"de": "Ist eine Sprungtechnik von Insekten", "en": "Is a jumping technique used by insects"}, "option_i18n": {"de": "Ist eine Sprungtechnik von Insekten", "en": "Is a jumping technique used by insects"}}], "question": "Was bedeutet Cradle-to-Cradle?", "prompt_i18n": {"de": "Was bedeutet Cradle-to-Cradle?", "en": "What does Cradle to Cradle mean?"}, "correctAnswer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden"}]	\N	f	0.00	\N	t	2026-01-19 10:06:07.784045	2026-04-13 15:53:26.627486	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Cradle-to-Cradle", "en": "Cradle to Cradle"}	{"de": "Was heißt denn eigentlich Cradle-to-Cradle und wofür steht es? ", "en": "What does Cradle-to-Cradle actually mean and what does it stand for?"}	{}	f	Was heißt denn eigentlich Cradle-to-Cradle und wofür steht…	{"de": "Was heißt denn eigentlich Cradle-to-Cradle und wofür steht…", "en": "What does Cradle-to-Cradle actually mean and what does it…"}	{"de": "https://luise.bio/uploads/task-video-1768817164682-446767678.de.vtt", "en": "https://luise.bio/uploads/task-video-1768817164682-446767678.en.vtt"}
0ca683a6-b0cc-4faf-94cf-811302a0c4c6	Schau mal auf's Dach	Im 4. Stock in unserem Haupthaus haben wir unsere Dachterrasse. Der Ausblick ist wirklich wundervoll, mit dem Aufzug gelangst du direkt dort hin. Wir haben im Vorraum dort einen QR Code versteckt. Finde und scanne ihn. 	qr	5	\N	\N	Dachgarten	f	0.00	\N	t	2026-01-20 10:08:20.187511	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Mensch & soziales Umfeld	sehr einfach	1-3 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Schau mal auf's Dach", "en": "Look at the roof"}	{"de": "Im 4. Stock in unserem Haupthaus haben wir unsere Dachterrasse. Der Ausblick ist wirklich wundervoll, mit dem Aufzug gelangst du direkt dort hin. Wir haben im Vorraum dort einen QR Code versteckt. Finde und scanne ihn. ", "en": "We have our roof terrace on the 4th floor of our main house. The view is really wonderful, you can take the elevator straight there. We have hidden a QR code in the anteroom. Find and scan him."}	{}	t	Im 4. Stock in unserem Haupthaus haben wir unsere…	{"de": "Im 4. Stock in unserem Haupthaus haben wir unsere…", "en": "We have our roof terrace on the 4th floor of our main…"}	\N
f212470c-195f-4d65-a9a8-d9015cce8bf3	Recycling Station Photo	Find the hotel recycling station and upload a photo as proof.	photo	8	\N	\N	\N	t	0.25	\N	f	2025-12-04 11:14:44.293906	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Mensch & soziales Umfeld	sehr einfach	3-10 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Recycling Station Photo", "en": "Recycling Station Photo"}	{"de": "Find the hotel recycling station and upload a photo as proof.", "en": "Find the hotel recycling station and upload a photo as proof."}	{}	f	Find the hotel recycling station and upload a photo as…	{"de": "Find the hotel recycling station and upload a photo as…", "en": "Find the hotel recycling station and upload a photo as…"}	\N
ce748baa-f09a-451b-8c04-7f1bd5ce8738	Ulf Sonntag	Kennst du Ulf Sonntag? 	video	5	https://luise.bio/uploads/task-video-1768909505356-915543934.mp4	[{"answers": [{"id": "a_1", "text": "ein krummer Finger", "text_i18n": {"de": "ein krummer Finger", "en": "a crooked finger"}, "option_i18n": {"de": "ein krummer Finger", "en": "a crooked finger"}}, {"id": "a_2", "text": "ein nordischer Quatschkopf", "text_i18n": {"de": "ein nordischer Quatschkopf", "en": "a Nordic idiot"}, "option_i18n": {"de": "ein nordischer Quatschkopf", "en": "a Nordic idiot"}}, {"id": "a_3", "text": "ein schräger Vogel", "text_i18n": {"de": "ein schräger Vogel", "en": "a strange bird"}, "option_i18n": {"de": "ein schräger Vogel", "en": "a strange bird"}}, {"id": "a_4", "text": "Sexiest Man Alive 2026", "text_i18n": {"de": "Sexiest Man Alive 2026", "en": "Sexiest Man Alive 2026"}, "option_i18n": {"de": "Sexiest Man Alive 2026", "en": "Sexiest Man Alive 2026"}}], "options": [{"id": "a_1", "text": "ein krummer Finger", "text_i18n": {"de": "ein krummer Finger", "en": "a crooked finger"}, "option_i18n": {"de": "ein krummer Finger", "en": "a crooked finger"}}, {"id": "a_2", "text": "ein nordischer Quatschkopf", "text_i18n": {"de": "ein nordischer Quatschkopf", "en": "a Nordic idiot"}, "option_i18n": {"de": "ein nordischer Quatschkopf", "en": "a Nordic idiot"}}, {"id": "a_3", "text": "ein schräger Vogel", "text_i18n": {"de": "ein schräger Vogel", "en": "a strange bird"}, "option_i18n": {"de": "ein schräger Vogel", "en": "a strange bird"}}, {"id": "a_4", "text": "Sexiest Man Alive 2026", "text_i18n": {"de": "Sexiest Man Alive 2026", "en": "Sexiest Man Alive 2026"}, "option_i18n": {"de": "Sexiest Man Alive 2026", "en": "Sexiest Man Alive 2026"}}], "question": "Ulf Sonntag ist", "prompt_i18n": {"de": "Ulf Sonntag ist", "en": "Ulf Sunday is"}, "correctAnswer": "ein schräger Vogel"}]	\N	f	0.00	\N	t	2026-01-20 11:45:06.611467	2026-04-13 15:53:34.063803	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Mensch & soziales Umfeld	sehr einfach	1-3 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{37aae118-ff19-4657-ae12-ef4b7f05aa5c}	\N	\N	{"de": "Ulf Sonntag", "en": "Ulf Sunday"}	{"de": "Kennst du Ulf Sonntag? ", "en": "Do you know Ulf Sonntag?"}	{}	f	Kennst du Ulf Sonntag?	{"de": "Kennst du Ulf Sonntag?", "en": "Do you know Ulf Sonntag?"}	{"de": "https://luise.bio/uploads/task-video-1768909505356-915543934.de.vtt", "en": "https://luise.bio/uploads/task-video-1768909505356-915543934.en.vtt"}
456c1be6-40da-4f3d-9810-ea8e87e72afc	Fehlerfinden	Hast du einen Fehler in unserer App gefunden? Dann schreibe ihn uns hier hinein oder lade einen Screenshot hoch.	photo	10	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.964919	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	weekly	\N	Kommunikation & Netzwerke	sehr einfach	10-30 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{{Gäste}}	{"de": "Fehlerfinden", "en": "Finding errors"}	{"de": "Hast du einen Fehler in unserer App gefunden? Dann schreibe ihn uns hier hinein oder lade einen Screenshot hoch.", "en": "Did you find an error in our app? Then write it here or upload a screenshot."}	{}	t	Hast du einen Fehler in unserer App gefunden? Dann…	{"de": "Hast du einen Fehler in unserer App gefunden? Dann…", "en": "Did you find an error in our app? Then write it here or…"}	\N
7efe0342-bf73-4bba-9c80-f0acba5019d2	Pflanze einen Baum	Hast du die Möglichkeit einen Baum zu Pflanzen? Dann schicke uns davon ein Bild mit einem Schild auf dem steht "XYZ noch zu definieren" und lade es hoch	photo	5	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.970157	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	sehr einfach	1-3 Min	egal	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Pflanze einen Baum", "en": "Plant a tree"}	{"de": "Hast du die Möglichkeit einen Baum zu Pflanzen? Dann schicke uns davon ein Bild mit einem Schild auf dem steht \\"XYZ noch zu definieren\\" und lade es hoch", "en": "Do you have the opportunity to plant a tree? Then send us a picture of it with a sign that says “XYZ still to be defined” and upload it"}	{}	f	Hast du die Möglichkeit einen Baum zu Pflanzen? Dann…	{"de": "Hast du die Möglichkeit einen Baum zu Pflanzen? Dann…", "en": "Do you have the opportunity to plant a tree? Then send us…"}	\N
a92d629c-e2a4-47ef-a3b4-825f69d8de54	Male uns ein Bild	Male ein Bild von einem Ort im Hotel, der dir besonders gut gefällt.	photo	30	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.971636	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	mittel	10-30 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Male uns ein Bild", "en": "Paint us a picture"}	{"de": "Male ein Bild von einem Ort im Hotel, der dir besonders gut gefällt.", "en": "Draw a picture of a place in the hotel that you particularly like."}	{}	f	Male ein Bild von einem Ort im Hotel, der dir besonders…	{"de": "Male ein Bild von einem Ort im Hotel, der dir besonders…", "en": "Draw a picture of a place in the hotel that you…"}	\N
b145ef6a-52a8-4b14-95d6-3cdbac6f9e11	Besuche "Hundsgemütlich"	Geschäft für Heimtierbedarf	visit_location	38	\N	\N	\N	f	0.00	\N	t	2026-01-07 15:46:50.337422	2026-04-13 07:37:44.769866	cf24c5e1-e427-46a2-a265-8ffa29ebb843	once	\N	Natur & Umweltschutz	mittel	30-60 Min	Umgebung	49.59880000	11.00381000	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Besuche \\"Hundsgemütlich\\"", "en": "Visit “Dog Cozy”"}	{"de": "Geschäft für Heimtierbedarf", "en": "Pet supply store"}	{}	f	Geschäft für Heimtierbedarf	{"de": "Geschäft für Heimtierbedarf", "en": "Pet supply store"}	\N
aa9e3701-fb93-48f8-a475-52de830e3b4b	Facebook	Folge uns auf Facebook und gebe den Code hier ein, der auf unserem Profil steht.	qr	10	\N	\N	89HL3Z	f	0.00	\N	t	2026-01-04 14:27:01.9625	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Facebook", "en": "Facebook"}	{"de": "Folge uns auf Facebook und gebe den Code hier ein, der auf unserem Profil steht.", "en": "Follow us on Facebook and enter the code here that is on our profile."}	{}	f	Folge uns auf Facebook und gebe den Code hier ein, der auf…	{"de": "Folge uns auf Facebook und gebe den Code hier ein, der auf…", "en": "Follow us on Facebook and enter the code here that is on…"}	\N
b22e00c6-b363-4f85-839c-1a7002bc8c3b	Lagerfeuer	Am Lagerfeuer in der Lounge 20 ist ein QR-Code versteckt. Finde und Scanne ihn. Und wenn du Lust hast, setz dich ans Feuer. Abends ist es besonders schön!	qr	15	\N	\N	Feuerfreiesfeuer	f	0.00	\N	t	2026-01-19 12:05:47.129639	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Mensch & soziales Umfeld	einfach	3-10 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Lagerfeuer", "en": "Campfire"}	{"de": "Am Lagerfeuer in der Lounge 20 ist ein QR-Code versteckt. Finde und Scanne ihn. Und wenn du Lust hast, setz dich ans Feuer. Abends ist es besonders schön!", "en": "There is a QR code hidden at the campfire in Lounge 20. Find and scan him. And if you feel like it, sit by the fire. It's especially beautiful in the evening!"}	{}	f	Am Lagerfeuer in der Lounge 20 ist ein QR-Code versteckt.…	{"de": "Am Lagerfeuer in der Lounge 20 ist ein QR-Code versteckt.…", "en": "There is a QR code hidden at the campfire in Lounge 20.…"}	\N
6cc95dc7-b514-460f-aa99-66d5efece4e7	Müll im Hotelbetrieb	Wir nehmen die Mülltrennung sehr ernst. Denn nur die Rohstoffe, die nicht wiedergenutzt werden können, nennt man Restmüll. Alles andere sind Wert- oder Rohstoffe. 	video	5	https://luise.bio/uploads/task-video-1768818060670-491559368.mp4	[{"answers": [{"id": "a_1", "text": "Eine Pappmaché Produktion aus Altkartonagen", "text_i18n": {"de": "Eine Pappmaché Produktion aus Altkartonagen", "en": "A papier-mâché production made from old cardboard"}, "option_i18n": {"de": "Eine Pappmaché Produktion aus Altkartonagen", "en": "A papier-mâché production made from old cardboard"}}, {"id": "a_2", "text": "Eine Weinflaschen-Entleerungsanlage", "text_i18n": {"de": "Eine Weinflaschen-Entleerungsanlage", "en": "A wine bottle emptying system"}, "option_i18n": {"de": "Eine Weinflaschen-Entleerungsanlage", "en": "A wine bottle emptying system"}}, {"id": "a_3", "text": "Wichtel für die Müllsortierung angestellt", "text_i18n": {"de": "Wichtel für die Müllsortierung angestellt", "en": "Gnomes hired to sort garbage"}, "option_i18n": {"de": "Wichtel für die Müllsortierung angestellt", "en": "Gnomes hired to sort garbage"}}, {"id": "a_4", "text": "Radarsensoren zur Füllstandsmessung der Restmülltonnen", "text_i18n": {"de": "Radarsensoren zur Füllstandsmessung der Restmülltonnen", "en": "Radar sensors for measuring the fill level of residual waste bins"}, "option_i18n": {"de": "Radarsensoren zur Füllstandsmessung der Restmülltonnen", "en": "Radar sensors for measuring the fill level of residual waste bins"}}], "options": [{"id": "a_1", "text": "Eine Pappmaché Produktion aus Altkartonagen", "text_i18n": {"de": "Eine Pappmaché Produktion aus Altkartonagen", "en": "A papier-mâché production made from old cardboard"}, "option_i18n": {"de": "Eine Pappmaché Produktion aus Altkartonagen", "en": "A papier-mâché production made from old cardboard"}}, {"id": "a_2", "text": "Eine Weinflaschen-Entleerungsanlage", "text_i18n": {"de": "Eine Weinflaschen-Entleerungsanlage", "en": "A wine bottle emptying system"}, "option_i18n": {"de": "Eine Weinflaschen-Entleerungsanlage", "en": "A wine bottle emptying system"}}, {"id": "a_3", "text": "Wichtel für die Müllsortierung angestellt", "text_i18n": {"de": "Wichtel für die Müllsortierung angestellt", "en": "Gnomes hired to sort garbage"}, "option_i18n": {"de": "Wichtel für die Müllsortierung angestellt", "en": "Gnomes hired to sort garbage"}}, {"id": "a_4", "text": "Radarsensoren zur Füllstandsmessung der Restmülltonnen", "text_i18n": {"de": "Radarsensoren zur Füllstandsmessung der Restmülltonnen", "en": "Radar sensors for measuring the fill level of residual waste bins"}, "option_i18n": {"de": "Radarsensoren zur Füllstandsmessung der Restmülltonnen", "en": "Radar sensors for measuring the fill level of residual waste bins"}}], "question": "Das Hotel Luise hat sogar", "prompt_i18n": {"de": "Das Hotel Luise hat sogar", "en": "The Hotel Luise even has"}, "correctAnswer": "Radarsensoren zur Füllstandsmessung der Restmülltonnen"}]	\N	f	0.00	\N	t	2026-01-19 10:21:02.924874	2026-04-13 15:53:39.600374	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Müll im Hotelbetrieb", "en": "Garbage in the hotel business"}	{"de": "Wir nehmen die Mülltrennung sehr ernst. Denn nur die Rohstoffe, die nicht wiedergenutzt werden können, nennt man Restmüll. Alles andere sind Wert- oder Rohstoffe. ", "en": "We take waste separation very seriously. Because only the raw materials that cannot be reused are called residual waste. Everything else is valuable or raw materials."}	{}	f	Wir nehmen die Mülltrennung sehr ernst. Denn nur die…	{"de": "Wir nehmen die Mülltrennung sehr ernst. Denn nur die…", "en": "We take waste separation very seriously. Because only the…"}	{"de": "https://luise.bio/uploads/task-video-1768818060670-491559368.de.vtt", "en": "https://luise.bio/uploads/task-video-1768818060670-491559368.en.vtt"}
d3237f56-375d-400f-a9df-abbb5b145c8d	Anreise	Wie bist du zu uns gekommen? Trage die Entfernung in KM, Ort und Verkehrmittel ein.	survey	60	\N	\N	\N	f	0.00	\N	f	2026-01-04 14:27:01.966088	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Mensch & soziales Umfeld	schwer	60+ Min	Umgebung	\N	\N	\N	\N	[{"type": "text", "options": [], "question": "Entfernung in KM", "required": true, "question_i18n": {"de": "Entfernung in KM", "en": "Distance in KM"}}, {"type": "text", "options": [], "question": "Ort", "required": true, "question_i18n": {"de": "Ort", "en": "Location"}}, {"type": "single_choice", "options": [{"id": "opt_1", "text": "Auto", "option_i18n": {"de": "Auto", "en": "car"}}, {"id": "opt_2", "text": "Zug", "option_i18n": {"de": "Zug", "en": "Train"}}, {"id": "opt_3", "text": "Bus", "option_i18n": {"de": "Bus", "en": "bus"}}, {"id": "opt_4", "text": "Fahrrad", "option_i18n": {"de": "Fahrrad", "en": "Bicycle"}}, {"id": "opt_5", "text": "Zu Fuß", "option_i18n": {"de": "Zu Fuß", "en": "On foot"}}, {"id": "opt_6", "text": "Anderes", "option_i18n": {"de": "Anderes", "en": "Other"}}], "question": "Verkehrsmittel", "required": true, "question_i18n": {"de": "Verkehrsmittel", "en": "Means of transport"}}]	mixed	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Anreise", "en": "Arrival"}	{"de": "Wie bist du zu uns gekommen? Trage die Entfernung in KM, Ort und Verkehrmittel ein.", "en": "How did you come to us? Enter the distance in km, location and means of transport."}	{}	f	Wie bist du zu uns gekommen? Trage die Entfernung in KM,…	{"de": "Wie bist du zu uns gekommen? Trage die Entfernung in KM,…", "en": "How did you come to us? Enter the distance in km, location…"}	\N
474e2c3e-e7f3-48c6-b60e-4107d890f5a4	Someone's calling...	In der Lounge 20 steht ein Holztelefon, lausche mal was der Anrufer zu sagen hat. 	quiz	15	\N	[{"answers": [{"id": "a_1", "text": "Infos über die Lounge 20", "text_i18n": {"de": "Infos über die Lounge 20", "en": "Information about Lounge 20"}, "option_i18n": {"de": "Infos über die Lounge 20", "en": "Information about Lounge 20"}}, {"id": "a_2", "text": "Offenbarung, dass Luise dich liebt.", "text_i18n": {"de": "Offenbarung, dass Luise dich liebt.", "en": "Revelation that Luise loves you."}, "option_i18n": {"de": "Offenbarung, dass Luise dich liebt.", "en": "Revelation that Luise loves you."}}, {"id": "a_3", "text": "Erklärung zu den Campingstühlen in der Lounge", "text_i18n": {"de": "Erklärung zu den Campingstühlen in der Lounge", "en": "Explanation of the camping chairs in the lounge"}, "option_i18n": {"de": "Erklärung zu den Campingstühlen in der Lounge", "en": "Explanation of the camping chairs in the lounge"}}, {"id": "a_4", "text": "Info zu einem geheimen Cocktail", "text_i18n": {"de": "Info zu einem geheimen Cocktail", "en": "Info about a secret cocktail"}, "option_i18n": {"de": "Info zu einem geheimen Cocktail", "en": "Info about a secret cocktail"}}], "options": [{"id": "a_1", "text": "Infos über die Lounge 20", "text_i18n": {"de": "Infos über die Lounge 20", "en": "Information about Lounge 20"}, "option_i18n": {"de": "Infos über die Lounge 20", "en": "Information about Lounge 20"}}, {"id": "a_2", "text": "Offenbarung, dass Luise dich liebt.", "text_i18n": {"de": "Offenbarung, dass Luise dich liebt.", "en": "Revelation that Luise loves you."}, "option_i18n": {"de": "Offenbarung, dass Luise dich liebt.", "en": "Revelation that Luise loves you."}}, {"id": "a_3", "text": "Erklärung zu den Campingstühlen in der Lounge", "text_i18n": {"de": "Erklärung zu den Campingstühlen in der Lounge", "en": "Explanation of the camping chairs in the lounge"}, "option_i18n": {"de": "Erklärung zu den Campingstühlen in der Lounge", "en": "Explanation of the camping chairs in the lounge"}}, {"id": "a_4", "text": "Info zu einem geheimen Cocktail", "text_i18n": {"de": "Info zu einem geheimen Cocktail", "en": "Info about a secret cocktail"}, "option_i18n": {"de": "Info zu einem geheimen Cocktail", "en": "Info about a secret cocktail"}}], "question": "Was ist die Botschaft?", "prompt_i18n": {"de": "Was ist die Botschaft?", "en": "What is the message?"}, "correctAnswer": "Offenbarung, dass Luise dich liebt."}]	\N	f	0.00	\N	t	2026-01-20 14:07:44.48219	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Kommunikation & Netzwerke	einfach	3-10 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Someone's calling...", "en": "Someone's calling..."}	{"de": "In der Lounge 20 steht ein Holztelefon, lausche mal was der Anrufer zu sagen hat. ", "en": "There is a wooden telephone in Lounge 20, listen to what the caller has to say."}	{}	f	In der Lounge 20 steht ein Holztelefon, lausche mal was…	{"de": "In der Lounge 20 steht ein Holztelefon, lausche mal was…", "en": "There is a wooden telephone in Lounge 20, listen to what…"}	\N
8987fd0c-2c2f-49fe-83e3-bc6985fd1985	Finde den Ben	Mache ein Bild mit Ben ;) 	photo	10	\N	\N	\N	t	0.00	\N	t	2026-01-20 11:47:30.563817	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Mensch & soziales Umfeld	einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{37aae118-ff19-4657-ae12-ef4b7f05aa5c}	\N	\N	{"de": "Finde den Ben", "en": "Find Ben"}	{"de": "Mache ein Bild mit Ben ;) ", "en": "Take a picture with Ben ;)"}	{}	f	Mache ein Bild mit Ben ;)	{"de": "Mache ein Bild mit Ben ;)", "en": "Take a picture with Ben ;)"}	\N
5073320b-3b03-41d8-84df-a5aa48ffbc01	Kondensstreifen sind ein Problem	Könnte das Fliegen auf einen Schlag viel klimafreundlicher sein? 	video	23	https://www.youtube.com/shorts/CaGXe1D9Lhc	[{"answers": [{"id": "a_1", "text": "Airlines müssen eine Checkbox anklicken", "text_i18n": {"de": "Airlines müssen eine Checkbox anklicken", "en": "Airlines have to click a checkbox"}, "option_i18n": {"de": "Airlines müssen eine Checkbox anklicken", "en": "Airlines have to click a checkbox"}}, {"id": "a_2", "text": "Mit guter Laune fliegen", "text_i18n": {"de": "Mit guter Laune fliegen", "en": "Fly in a good mood"}, "option_i18n": {"de": "Mit guter Laune fliegen", "en": "Fly in a good mood"}}, {"id": "a_3", "text": "Nur bei warmen Wetter fliegen", "text_i18n": {"de": "Nur bei warmen Wetter fliegen", "en": "Only fly in warm weather"}, "option_i18n": {"de": "Nur bei warmen Wetter fliegen", "en": "Only fly in warm weather"}}, {"id": "a_4", "text": "Aktuell gibt es keine Lösung", "text_i18n": {"de": "Aktuell gibt es keine Lösung", "en": "There is currently no solution"}, "option_i18n": {"de": "Aktuell gibt es keine Lösung", "en": "There is currently no solution"}}], "options": [{"id": "a_1", "text": "Airlines müssen eine Checkbox anklicken", "text_i18n": {"de": "Airlines müssen eine Checkbox anklicken", "en": "Airlines have to click a checkbox"}, "option_i18n": {"de": "Airlines müssen eine Checkbox anklicken", "en": "Airlines have to click a checkbox"}}, {"id": "a_2", "text": "Mit guter Laune fliegen", "text_i18n": {"de": "Mit guter Laune fliegen", "en": "Fly in a good mood"}, "option_i18n": {"de": "Mit guter Laune fliegen", "en": "Fly in a good mood"}}, {"id": "a_3", "text": "Nur bei warmen Wetter fliegen", "text_i18n": {"de": "Nur bei warmen Wetter fliegen", "en": "Only fly in warm weather"}, "option_i18n": {"de": "Nur bei warmen Wetter fliegen", "en": "Only fly in warm weather"}}, {"id": "a_4", "text": "Aktuell gibt es keine Lösung", "text_i18n": {"de": "Aktuell gibt es keine Lösung", "en": "There is currently no solution"}, "option_i18n": {"de": "Aktuell gibt es keine Lösung", "en": "There is currently no solution"}}], "question": "Wie könnte man einen großen Teil des CO2-Ausstoßes durch Kondensstreifen vermeiden?", "prompt_i18n": {"de": "Wie könnte man einen großen Teil des CO2-Ausstoßes durch Kondensstreifen vermeiden?", "en": "How could a large part of the CO2 emissions caused by contrails be avoided?"}, "correctAnswer": "Airlines müssen eine Checkbox anklicken"}]	\N	f	0.00	\N	t	2026-01-13 16:25:07.207792	2026-04-13 15:29:23.651089	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	mittel	3-10 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{"Front Office",Gäste}	{"de": "Kondensstreifen sind ein Problem", "en": "Contrails are a problem"}	{"de": "Könnte das Fliegen auf einen Schlag viel klimafreundlicher sein? ", "en": "Could flying suddenly be much more climate-friendly?"}	{}	f	Könnte das Fliegen auf einen Schlag viel klimafreundlicher…	{"de": "Könnte das Fliegen auf einen Schlag viel klimafreundlicher…", "en": "Could flying suddenly be much more climate-friendly?"}	{}
015c7128-73e4-4e0f-a34a-2d7b35ce1e89	Besuche Tortuuga Fair Fashion	Deine nachhaltige Modeboutique in Erlangen liegt in einem kleinen Shoppingviertel, etwas Abseits der Hauptstraße. Besuche doch mal diesen Shop und schaue dich in der Straße um. Vielleicht findest du ja etwas Schönes für dich oder deine Liebsten ;) 	visit_location	30	\N	\N	\N	f	0.00	\N	t	2026-01-19 11:51:02.009606	2026-04-13 07:37:44.769866	4176d288-0a11-4c63-ae49-8c52e24fb036	monthly	\N	Mensch & soziales Umfeld	mittel	10-30 Min	Umgebung	49.59673420	11.00854010	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://luise.bio/uploads/task-thumbnail-1768839462744-911039047.png	\N	{"de": "Besuche Tortuuga Fair Fashion", "en": "Visit Tortuuga Fair Fashion"}	{"de": "Deine nachhaltige Modeboutique in Erlangen liegt in einem kleinen Shoppingviertel, etwas Abseits der Hauptstraße. Besuche doch mal diesen Shop und schaue dich in der Straße um. Vielleicht findest du ja etwas Schönes für dich oder deine Liebsten ;) ", "en": "Your sustainable fashion boutique in Erlangen is located in a small shopping district, a little off the main street. Visit this shop and take a look around the street. Maybe you'll find something nice for yourself or your loved ones ;)"}	{}	f	Deine nachhaltige Modeboutique in Erlangen liegt in einem…	{"de": "Deine nachhaltige Modeboutique in Erlangen liegt in einem…", "en": "Your sustainable fashion boutique in Erlangen is located…"}	\N
218ebb52-1322-4f7f-9e84-6a92b6cb525e	Ist das erLAUBt? 	Manchmal werden wir gefragt, warum wir so einen "unordentlichen" Garten haben. 	video	5	https://luise.bio/uploads/task-video-1768818537327-112169731.mp4	[{"answers": [{"id": "a_1", "text": "Um unschöne Stellen im Garten zu verstecken", "text_i18n": {"de": "Um unschöne Stellen im Garten zu verstecken", "en": "To hide unsightly spots in the garden"}, "option_i18n": {"de": "Um unschöne Stellen im Garten zu verstecken", "en": "To hide unsightly spots in the garden"}}, {"id": "a_2", "text": "Zur Regenration des Bodens und Baustoff für Tiere", "text_i18n": {"de": "Zur Regenration des Bodens und Baustoff für Tiere", "en": "For the regeneration of the soil and building material for animals"}, "option_i18n": {"de": "Zur Regenration des Bodens und Baustoff für Tiere", "en": "For the regeneration of the soil and building material for animals"}}, {"id": "a_3", "text": "Wir wollen damit die Nachbarn ärgern", "text_i18n": {"de": "Wir wollen damit die Nachbarn ärgern", "en": "We want to annoy the neighbors"}, "option_i18n": {"de": "Wir wollen damit die Nachbarn ärgern", "en": "We want to annoy the neighbors"}}, {"id": "a_4", "text": "Wir machen daraus Laubhaufen und springen in der Mittagspause hinein", "text_i18n": {"de": "Wir machen daraus Laubhaufen und springen in der Mittagspause hinein", "en": "We make piles of leaves out of them and jump in them during our lunch break"}, "option_i18n": {"de": "Wir machen daraus Laubhaufen und springen in der Mittagspause hinein", "en": "We make piles of leaves out of them and jump in them during our lunch break"}}], "options": [{"id": "a_1", "text": "Um unschöne Stellen im Garten zu verstecken", "text_i18n": {"de": "Um unschöne Stellen im Garten zu verstecken", "en": "To hide unsightly spots in the garden"}, "option_i18n": {"de": "Um unschöne Stellen im Garten zu verstecken", "en": "To hide unsightly spots in the garden"}}, {"id": "a_2", "text": "Zur Regenration des Bodens und Baustoff für Tiere", "text_i18n": {"de": "Zur Regenration des Bodens und Baustoff für Tiere", "en": "For the regeneration of the soil and building material for animals"}, "option_i18n": {"de": "Zur Regenration des Bodens und Baustoff für Tiere", "en": "For the regeneration of the soil and building material for animals"}}, {"id": "a_3", "text": "Wir wollen damit die Nachbarn ärgern", "text_i18n": {"de": "Wir wollen damit die Nachbarn ärgern", "en": "We want to annoy the neighbors"}, "option_i18n": {"de": "Wir wollen damit die Nachbarn ärgern", "en": "We want to annoy the neighbors"}}, {"id": "a_4", "text": "Wir machen daraus Laubhaufen und springen in der Mittagspause hinein", "text_i18n": {"de": "Wir machen daraus Laubhaufen und springen in der Mittagspause hinein", "en": "We make piles of leaves out of them and jump in them during our lunch break"}, "option_i18n": {"de": "Wir machen daraus Laubhaufen und springen in der Mittagspause hinein", "en": "We make piles of leaves out of them and jump in them during our lunch break"}}], "question": "Wofür behalten wir das Laub?", "prompt_i18n": {"de": "Wofür behalten wir das Laub?", "en": "What do we keep the leaves for?"}, "correctAnswer": "Zur Regenration des Bodens und Baustoff für Tiere"}]	\N	f	0.00	\N	t	2026-01-19 10:28:59.427989	2026-04-13 15:53:46.116025	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Natur & Umweltschutz	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Ist das erLAUBt? ", "en": "Is that ALLOWED?"}	{"de": "Manchmal werden wir gefragt, warum wir so einen \\"unordentlichen\\" Garten haben. ", "en": "Sometimes we are asked why we have such a “messy” garden."}	{}	f	Manchmal werden wir gefragt, warum wir so einen…	{"de": "Manchmal werden wir gefragt, warum wir so einen…", "en": "Sometimes we are asked why we have such a “messy” garden."}	{"de": "https://luise.bio/uploads/task-video-1768818537327-112169731.de.vtt", "en": "https://luise.bio/uploads/task-video-1768818537327-112169731.en.vtt"}
1bab2d7d-d2ac-4887-b379-bd9fb6d8793b	Bring your reusable bottle	Fill your bottle at the lobby water station and scan the QR code.	qr	15	\N	\N	QR-LOBBY-WATER-001	f	0.15	\N	f	2026-01-04 14:26:50.031387	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Ressourcenverbrauch & Materialeinsatz	einfach	3-10 Min	Umgebung	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Bring your reusable bottle", "en": "Bring your reusable bottle"}	{"de": "Fill your bottle at the lobby water station and scan the QR code.", "en": "Fill your bottle at the lobby water station and scan the QR code."}	{}	f	Fill your bottle at the lobby water station and scan the…	{"de": "Fill your bottle at the lobby water station and scan the…", "en": "Fill your bottle at the lobby water station and scan the…"}	\N
8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	Apothekerschrank	In unserem kleinen Shop haben wir ein altes grünes Buch versteckt. 	quiz	15	\N	[{"answers": [{"id": "a_1", "text": "Naturheilpflanzen und Kräuterkunde", "text_i18n": {"de": "Naturheilpflanzen und Kräuterkunde", "en": "Natural medicinal plants and herbalism"}, "option_i18n": {"de": "Naturheilpflanzen und Kräuterkunde", "en": "Natural medicinal plants and herbalism"}}, {"id": "a_2", "text": "Das neue Naturheilverfahren", "text_i18n": {"de": "Das neue Naturheilverfahren", "en": "The new natural healing method"}, "option_i18n": {"de": "Das neue Naturheilverfahren", "en": "The new natural healing method"}}, {"id": "a_3", "text": "Leibesübungen für Jung und Alt", "text_i18n": {"de": "Leibesübungen für Jung und Alt", "en": "Physical exercises for young and old"}, "option_i18n": {"de": "Leibesübungen für Jung und Alt", "en": "Physical exercises for young and old"}}, {"id": "a_4", "text": "Basisch Kochen nach Hildegard von Bingen", "text_i18n": {"de": "Basisch Kochen nach Hildegard von Bingen", "en": "Basic cooking according to Hildegard von Bingen"}, "option_i18n": {"de": "Basisch Kochen nach Hildegard von Bingen", "en": "Basic cooking according to Hildegard von Bingen"}}], "options": [{"id": "a_1", "text": "Naturheilpflanzen und Kräuterkunde", "text_i18n": {"de": "Naturheilpflanzen und Kräuterkunde", "en": "Natural medicinal plants and herbalism"}, "option_i18n": {"de": "Naturheilpflanzen und Kräuterkunde", "en": "Natural medicinal plants and herbalism"}}, {"id": "a_2", "text": "Das neue Naturheilverfahren", "text_i18n": {"de": "Das neue Naturheilverfahren", "en": "The new natural healing method"}, "option_i18n": {"de": "Das neue Naturheilverfahren", "en": "The new natural healing method"}}, {"id": "a_3", "text": "Leibesübungen für Jung und Alt", "text_i18n": {"de": "Leibesübungen für Jung und Alt", "en": "Physical exercises for young and old"}, "option_i18n": {"de": "Leibesübungen für Jung und Alt", "en": "Physical exercises for young and old"}}, {"id": "a_4", "text": "Basisch Kochen nach Hildegard von Bingen", "text_i18n": {"de": "Basisch Kochen nach Hildegard von Bingen", "en": "Basic cooking according to Hildegard von Bingen"}, "option_i18n": {"de": "Basisch Kochen nach Hildegard von Bingen", "en": "Basic cooking according to Hildegard von Bingen"}}], "question": "Was steht darauf?", "prompt_i18n": {"de": "Was steht darauf?", "en": "What does it say?"}, "correctAnswer": "Das neue Naturheilverfahren"}]	\N	f	0.00	\N	t	2026-01-19 15:30:36.246144	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Mensch & soziales Umfeld	einfach	3-10 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Apothekerschrank", "en": "Apothecary cabinet"}	{"de": "In unserem kleinen Shop haben wir ein altes grünes Buch versteckt. ", "en": "We have an old green book hidden in our little shop."}	{}	f	In unserem kleinen Shop haben wir ein altes grünes Buch…	{"de": "In unserem kleinen Shop haben wir ein altes grünes Buch…", "en": "We have an old green book hidden in our little shop."}	\N
36e8f64d-341c-4c0b-86fa-531a28d5e98b	Cradle-to-Cradle 3	Last but not least... C2C	video	10	https://luise.bio/uploads/task-video-1768817705228-523942571.mp4	[{"answers": [{"id": "a_1", "text": "Geeignet für den Recyclinghof", "text_i18n": {"de": "Geeignet für den Recyclinghof", "en": "Suitable for the recycling center"}, "option_i18n": {"de": "Geeignet für den Recyclinghof", "en": "Suitable for the recycling center"}}, {"id": "a_2", "text": "Die Produkte wachsen mit", "text_i18n": {"de": "Die Produkte wachsen mit", "en": "The products grow with you"}, "option_i18n": {"de": "Die Produkte wachsen mit", "en": "The products grow with you"}}, {"id": "a_3", "text": "Sortenreine Auftrennung der Rohstoffe", "text_i18n": {"de": "Sortenreine Auftrennung der Rohstoffe", "en": "Separate separation of raw materials"}, "option_i18n": {"de": "Sortenreine Auftrennung der Rohstoffe", "en": "Separate separation of raw materials"}}, {"id": "a_4", "text": "Guter Merchandise der Cradle-to-Cradle Rockband", "text_i18n": {"de": "Guter Merchandise der Cradle-to-Cradle Rockband", "en": "Good merchandise from the Cradle-to-Cradle rock band"}, "option_i18n": {"de": "Guter Merchandise der Cradle-to-Cradle Rockband", "en": "Good merchandise from the Cradle-to-Cradle rock band"}}], "options": [{"id": "a_1", "text": "Geeignet für den Recyclinghof", "text_i18n": {"de": "Geeignet für den Recyclinghof", "en": "Suitable for the recycling center"}, "option_i18n": {"de": "Geeignet für den Recyclinghof", "en": "Suitable for the recycling center"}}, {"id": "a_2", "text": "Die Produkte wachsen mit", "text_i18n": {"de": "Die Produkte wachsen mit", "en": "The products grow with you"}, "option_i18n": {"de": "Die Produkte wachsen mit", "en": "The products grow with you"}}, {"id": "a_3", "text": "Sortenreine Auftrennung der Rohstoffe", "text_i18n": {"de": "Sortenreine Auftrennung der Rohstoffe", "en": "Separate separation of raw materials"}, "option_i18n": {"de": "Sortenreine Auftrennung der Rohstoffe", "en": "Separate separation of raw materials"}}, {"id": "a_4", "text": "Guter Merchandise der Cradle-to-Cradle Rockband", "text_i18n": {"de": "Guter Merchandise der Cradle-to-Cradle Rockband", "en": "Good merchandise from the Cradle-to-Cradle rock band"}, "option_i18n": {"de": "Guter Merchandise der Cradle-to-Cradle Rockband", "en": "Good merchandise from the Cradle-to-Cradle rock band"}}], "question": "Was ist das Ziel von Cradle-to-Cradle Produkten?", "prompt_i18n": {"de": "Was ist das Ziel von Cradle-to-Cradle Produkten?", "en": "What is the goal of Cradle-to-Cradle products?"}, "correctAnswer": "Sortenreine Auftrennung der Rohstoffe"}]	\N	f	0.00	\N	t	2026-01-19 10:15:08.894432	2026-04-13 15:53:53.287271	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	49154be8-0d8b-410d-a200-e0b7794271ef	\N	\N	{}	{}	\N	\N	{"de": "Cradle-to-Cradle 3", "en": "Cradle to Cradle 3"}	{"de": "Last but not least... C2C", "en": "Last but not least... C2C"}	{}	f	Last but not least... C2C	{"de": "Last but not least... C2C", "en": "Last but not least... C2C"}	{"de": "https://luise.bio/uploads/task-video-1768817705228-523942571.de.vtt", "en": "https://luise.bio/uploads/task-video-1768817705228-523942571.en.vtt"}
49a47427-e93f-439c-ac10-bf089760aa79	Sustainability Basics	Watch the 1-minute intro video and answer two quick questions.	video	30	https://www.w3schools.com/html/mov_bbb.mp4	[{"answers": [{"id": "a_1", "text": "Blue", "text_i18n": {"de": "Blue", "en": "Blue"}, "option_i18n": {"de": "Blue", "en": "Blue"}}, {"id": "a_2", "text": "Green", "text_i18n": {"de": "Green", "en": "Green"}, "option_i18n": {"de": "Green", "en": "Green"}}, {"id": "a_3", "text": "Red", "text_i18n": {"de": "Red", "en": "Red"}, "option_i18n": {"de": "Red", "en": "Red"}}], "options": [{"id": "a_1", "text": "Blue", "text_i18n": {"de": "Blue", "en": "Blue"}, "option_i18n": {"de": "Blue", "en": "Blue"}}, {"id": "a_2", "text": "Green", "text_i18n": {"de": "Green", "en": "Green"}, "option_i18n": {"de": "Green", "en": "Green"}}, {"id": "a_3", "text": "Red", "text_i18n": {"de": "Red", "en": "Red"}, "option_i18n": {"de": "Red", "en": "Red"}}], "question": "Which bin is for paper?", "prompt_i18n": {"de": "Which bin is for paper?", "en": "Which bin is for paper?"}, "correctAnswer": "Blue"}, {"answers": [{"id": "a_1", "text": "Leave on", "text_i18n": {"de": "Leave on", "en": "Leave on"}, "option_i18n": {"de": "Leave on", "en": "Leave on"}}, {"id": "a_2", "text": "Switch off", "text_i18n": {"de": "Switch off", "en": "Switch off"}, "option_i18n": {"de": "Switch off", "en": "Switch off"}}], "options": [{"id": "a_1", "text": "Leave on", "text_i18n": {"de": "Leave on", "en": "Leave on"}, "option_i18n": {"de": "Leave on", "en": "Leave on"}}, {"id": "a_2", "text": "Switch off", "text_i18n": {"de": "Switch off", "en": "Switch off"}, "option_i18n": {"de": "Switch off", "en": "Switch off"}}], "question": "What should you do with lights when leaving a room?", "prompt_i18n": {"de": "What should you do with lights when leaving a room?", "en": "What should you do with lights when leaving a room?"}, "correctAnswer": "Switch off"}]	\N	f	0.20	\N	f	2025-12-04 11:14:44.275197	2026-04-13 15:41:18.634602	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	schwer	3-10 Min	egal	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Sustainability Basics", "en": "Sustainability Basics"}	{"de": "Watch the 1-minute intro video and answer two quick questions.", "en": "Watch the 1-minute intro video and answer two quick questions."}	{}	f	Watch the 1-minute intro video and answer two quick…	{"de": "Watch the 1-minute intro video and answer two quick…", "en": "Watch the 1-minute intro video and answer two quick…"}	{"de": "data:text/vtt;base64,V0VCVlRUCgowMDowMDowMC4wMDAgLS0+IDk5OjAwOjAwLjAwMApTdXN0YWluYWJpbGl0eSBCYXNp\\nY3MgLSBXYXRjaCB0aGUgMS1taW51dGUgaW50cm8gdmlkZW8gYW5kIGFuc3dlciB0d28gcXVpY2sg\\ncXVlc3Rpb25zLgo=", "en": "data:text/vtt;base64,V0VCVlRUCgowMDowMDowMC4wMDAgLS0+IDk5OjAwOjAwLjAwMApTdXN0YWluYWJpbGl0eSBCYXNp\\nY3MgLSBXYXRjaCB0aGUgMS1taW51dGUgaW50cm8gdmlkZW8gYW5kIGFuc3dlciB0d28gcXVpY2sg\\ncXVlc3Rpb25zLgo="}
53966428-2831-47fb-b171-e7a405044c83	Bienenhotel Luise	Wir haben viele wilde Gäste in unserem Hotelgarten. Unter anderem auch sehr viele Honigbienen. 	video	10	https://luise.bio/uploads/task-video-1768771186503-399671967.mp4	[{"answers": [{"id": "a_1", "text": "1.000 - 2.500", "text_i18n": {"de": "1.000 - 2.500", "en": "1,000 - 2,500"}, "option_i18n": {"de": "1.000 - 2.500", "en": "1,000 - 2,500"}}, {"id": "a_2", "text": "10.000 - 15.000", "text_i18n": {"de": "10.000 - 15.000", "en": "10,000 - 15,000"}, "option_i18n": {"de": "10.000 - 15.000", "en": "10,000 - 15,000"}}, {"id": "a_3", "text": "20.000 - 30.000", "text_i18n": {"de": "20.000 - 30.000", "en": "20,000 - 30,000"}, "option_i18n": {"de": "20.000 - 30.000", "en": "20,000 - 30,000"}}], "options": [{"id": "a_1", "text": "1.000 - 2.500", "text_i18n": {"de": "1.000 - 2.500", "en": "1,000 - 2,500"}, "option_i18n": {"de": "1.000 - 2.500", "en": "1,000 - 2,500"}}, {"id": "a_2", "text": "10.000 - 15.000", "text_i18n": {"de": "10.000 - 15.000", "en": "10,000 - 15,000"}, "option_i18n": {"de": "10.000 - 15.000", "en": "10,000 - 15,000"}}, {"id": "a_3", "text": "20.000 - 30.000", "text_i18n": {"de": "20.000 - 30.000", "en": "20,000 - 30,000"}, "option_i18n": {"de": "20.000 - 30.000", "en": "20,000 - 30,000"}}], "question": "Wieviele Bienen wohnen im Winter in einem Bienenstock?", "prompt_i18n": {"de": "Wieviele Bienen wohnen im Winter in einem Bienenstock?", "en": "How many bees live in a hive in winter?"}, "correctAnswer": "10.000 - 15.000"}, {"answers": [{"id": "a_1", "text": "Schatz", "text_i18n": {"de": "Schatz", "en": "Treasure"}, "option_i18n": {"de": "Schatz", "en": "Treasure"}}, {"id": "a_2", "text": "Korb", "text_i18n": {"de": "Korb", "en": "Basket"}, "option_i18n": {"de": "Korb", "en": "Basket"}}, {"id": "a_3", "text": "Beute", "text_i18n": {"de": "Beute", "en": "prey"}, "option_i18n": {"de": "Beute", "en": "prey"}}, {"id": "a_4", "text": "Nest", "text_i18n": {"de": "Nest", "en": "nest"}, "option_i18n": {"de": "Nest", "en": "nest"}}], "options": [{"id": "a_1", "text": "Schatz", "text_i18n": {"de": "Schatz", "en": "Treasure"}, "option_i18n": {"de": "Schatz", "en": "Treasure"}}, {"id": "a_2", "text": "Korb", "text_i18n": {"de": "Korb", "en": "Basket"}, "option_i18n": {"de": "Korb", "en": "Basket"}}, {"id": "a_3", "text": "Beute", "text_i18n": {"de": "Beute", "en": "prey"}, "option_i18n": {"de": "Beute", "en": "prey"}}, {"id": "a_4", "text": "Nest", "text_i18n": {"de": "Nest", "en": "nest"}, "option_i18n": {"de": "Nest", "en": "nest"}}], "question": "Wie heißt ein Bienenstock eigentlich?", "prompt_i18n": {"de": "Wie heißt ein Bienenstock eigentlich?", "en": "What is a beehive actually called?"}, "correctAnswer": "Beute"}]	\N	f	0.00	\N	t	2026-01-18 21:19:53.05151	2026-04-13 15:53:59.776184	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Natur & Umweltschutz	einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Bienenhotel Luise", "en": "Bee Hotel Luise"}	{"de": "Wir haben viele wilde Gäste in unserem Hotelgarten. Unter anderem auch sehr viele Honigbienen. ", "en": "We have many wild guests in our hotel garden. Among other things, lots of honey bees."}	{}	f	Wir haben viele wilde Gäste in unserem Hotelgarten. Unter…	{"de": "Wir haben viele wilde Gäste in unserem Hotelgarten. Unter…", "en": "We have many wild guests in our hotel garden. Among other…"}	{"de": "https://luise.bio/uploads/task-video-1768771186503-399671967.de.vtt", "en": "https://luise.bio/uploads/task-video-1768771186503-399671967.en.vtt"}
b01d3854-960a-4c5e-a92b-ae0b8118c654	Müllsammeln	Sammle Müll bei einem Spaziergang. An der Rezeption erzählst du von uns eine Mülltüte und Karte. Gib den Müllbeutel bei uns ab, wenn du wieder zurück bist.	photo	30	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.967371	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Mensch & soziales Umfeld	mittel	10-30 Min	egal	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{Gäste,"Front Office"}	{"de": "Müllsammeln", "en": "Collecting garbage"}	{"de": "Sammle Müll bei einem Spaziergang. An der Rezeption erzählst du von uns eine Mülltüte und Karte. Gib den Müllbeutel bei uns ab, wenn du wieder zurück bist.", "en": "Collect trash while taking a walk. At the reception you tell us a garbage bag and a card. Drop off the trash bag with us when you get back."}	{}	f	Sammle Müll bei einem Spaziergang. An der Rezeption…	{"de": "Sammle Müll bei einem Spaziergang. An der Rezeption…", "en": "Collect trash while taking a walk. At the reception you…"}	\N
821ce0c1-3caf-4b3f-8194-a51e402e3ff9	Instagram	Folge uns auf Instagram und gebe den Code hier ein, der auf unserem Profil steht.	qr	10	\N	\N	3BA5X	f	0.00	\N	t	2026-01-04 14:27:01.957856	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{Gäste,"Front Office"}	{"de": "Instagram", "en": "Instagram"}	{"de": "Folge uns auf Instagram und gebe den Code hier ein, der auf unserem Profil steht.", "en": "Follow us on Instagram and enter the code here that is on our profile."}	{}	t	Folge uns auf Instagram und gebe den Code hier ein, der…	{"de": "Folge uns auf Instagram und gebe den Code hier ein, der…", "en": "Follow us on Instagram and enter the code here that is on…"}	\N
b40f5772-38e3-4ee4-a0f4-f6f9c4ddc0e1	Besuche das Naturschutzgebiet	Der Exerzierplatz ist ein auf einem ehemaligen Militärgelände in der Stadt Erlangen gelegenes Naturschutzgebiet. Es ist eines der wenigen Naturschutzgebiete innerhalb einer deutschen Großstadt und Teil der Sandachse Franken. 	visit_location	38	\N	\N	\N	f	0.00	\N	t	2026-01-19 12:21:53.866423	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	monthly	\N	Natur & Umweltschutz	mittel	30-60 Min	Umgebung	49.58708117	11.02699041	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Besuche das Naturschutzgebiet", "en": "Visit the nature reserve"}	{"de": "Der Exerzierplatz ist ein auf einem ehemaligen Militärgelände in der Stadt Erlangen gelegenes Naturschutzgebiet. Es ist eines der wenigen Naturschutzgebiete innerhalb einer deutschen Großstadt und Teil der Sandachse Franken. ", "en": "The parade ground is a nature reserve located on a former military site in the city of Erlangen. It is one of the few nature reserves within a major German city and part of the Franconian sand axis."}	{}	f	Der Exerzierplatz ist ein auf einem ehemaligen…	{"de": "Der Exerzierplatz ist ein auf einem ehemaligen…", "en": "The parade ground is a nature reserve located on a former…"}	\N
6da2f0d2-d40d-4222-b308-6c2efc4cbb02	Margalädla	Kaufe etwas in unserem Hotelshop und du erhältst den Einkaufswert als Punkte	survey	20	\N	\N	\N	f	0.00	\N	f	2026-01-04 14:27:01.963685	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	einfach	10-30 Min	Smartphone/PC	\N	\N	\N	\N	[{"type": "text", "options": [], "question": "Wie hoch war der Einkaufswert?", "required": true, "question_i18n": {"de": "Wie hoch war der Einkaufswert?", "en": "How much was the purchase value?"}}]	mixed	\N	\N	\N	{}	{}	\N	{Gäste,"Front Office"}	{"de": "Margalädla", "en": "Margaladla"}	{"de": "Kaufe etwas in unserem Hotelshop und du erhältst den Einkaufswert als Punkte", "en": "Buy something in our hotel shop and you will receive the purchase value as points"}	{}	f	Kaufe etwas in unserem Hotelshop und du erhältst den…	{"de": "Kaufe etwas in unserem Hotelshop und du erhältst den…", "en": "Buy something in our hotel shop and you will receive the…"}	\N
a9a29dc6-7c51-4be2-87c9-c3e7cc145b33	Google	Bewerte uns auf Google und schicke uns einen Screenshot.	photo	23	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.974627	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	mittel	3-10 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Google", "en": "Google"}	{"de": "Bewerte uns auf Google und schicke uns einen Screenshot.", "en": "Rate us on Google and send us a screenshot."}	{}	f	Bewerte uns auf Google und schicke uns einen Screenshot.	{"de": "Bewerte uns auf Google und schicke uns einen Screenshot.", "en": "Rate us on Google and send us a screenshot."}	\N
feeab851-92a6-4209-ba8b-eecc2bb9cc06	Duschen wie ein Astronaut?	Eine Handvoll unserer Zimmer haben eine Astronautendusche.\nIn dieser kannst du ewig Duschen ohne mehr Energie & Wasser zu brauchen als ein paar Minuten in der Dusche zuhause!	video	10	https://luise.bio/uploads/task-video-1768593099808-385410425.mp4	[{"answers": [{"id": "a_1", "text": "NASA", "text_i18n": {"de": "NASA", "en": "NASA"}, "option_i18n": {"de": "NASA", "en": "NASA"}}, {"id": "a_2", "text": "Orbital Systems", "text_i18n": {"de": "Orbital Systems", "en": "Orbital Systems"}, "option_i18n": {"de": "Orbital Systems", "en": "Orbital Systems"}}, {"id": "a_3", "text": "Orbima Istmen", "text_i18n": {"de": "Orbima Istmen", "en": "Orbima Istmen"}, "option_i18n": {"de": "Orbima Istmen", "en": "Orbima Istmen"}}, {"id": "a_4", "text": "Starshower", "text_i18n": {"de": "Starshower", "en": "Starshower"}, "option_i18n": {"de": "Starshower", "en": "Starshower"}}], "options": [{"id": "a_1", "text": "NASA", "text_i18n": {"de": "NASA", "en": "NASA"}, "option_i18n": {"de": "NASA", "en": "NASA"}}, {"id": "a_2", "text": "Orbital Systems", "text_i18n": {"de": "Orbital Systems", "en": "Orbital Systems"}, "option_i18n": {"de": "Orbital Systems", "en": "Orbital Systems"}}, {"id": "a_3", "text": "Orbima Istmen", "text_i18n": {"de": "Orbima Istmen", "en": "Orbima Istmen"}, "option_i18n": {"de": "Orbima Istmen", "en": "Orbima Istmen"}}, {"id": "a_4", "text": "Starshower", "text_i18n": {"de": "Starshower", "en": "Starshower"}, "option_i18n": {"de": "Starshower", "en": "Starshower"}}], "question": "Wie heißt der Hersteller der Dusche?", "prompt_i18n": {"de": "Wie heißt der Hersteller der Dusche?", "en": "What is the name of the manufacturer of the shower?"}, "correctAnswer": "Orbital Systems"}]	\N	f	0.00	\N	t	2026-01-04 14:27:01.979504	2026-04-13 15:54:05.429115	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "Duschen wie ein Astronaut?", "en": "Shower like an astronaut?"}	{"de": "Eine Handvoll unserer Zimmer haben eine Astronautendusche.\\nIn dieser kannst du ewig Duschen ohne mehr Energie & Wasser zu brauchen als ein paar Minuten in der Dusche zuhause!", "en": "A handful of our rooms have an astronaut shower.\\nIn this you can shower forever without needing more energy and water than a few minutes in the shower at home!"}	{}	f	Eine Handvoll unserer Zimmer haben eine Astronautendusche.…	{"de": "Eine Handvoll unserer Zimmer haben eine Astronautendusche.…", "en": "A handful of our rooms have an astronaut shower. In this…"}	{"de": "https://luise.bio/uploads/task-video-1768593099808-385410425.de.vtt", "en": "https://luise.bio/uploads/task-video-1768593099808-385410425.en.vtt"}
7b097c73-5180-4538-b41e-6d115bfffbe1	Unsere Tische	Unsere Tische im Frühstücksraum und in der Lounge sind aus einem ganz ungewöhnlichen Material!	video	5	https://www.youtube.com/watch?v=hXUdgJbDz6I	[{"answers": [{"id": "a_1", "text": "Schweden", "text_i18n": {"de": "Schweden", "en": "Sweden"}, "option_i18n": {"de": "Schweden", "en": "Sweden"}}, {"id": "a_2", "text": "Deutschland", "text_i18n": {"de": "Deutschland", "en": "Germany"}, "option_i18n": {"de": "Deutschland", "en": "Germany"}}, {"id": "a_3", "text": "Ukraine", "text_i18n": {"de": "Ukraine", "en": "Ukraine"}, "option_i18n": {"de": "Ukraine", "en": "Ukraine"}}, {"id": "a_4", "text": "Türkei", "text_i18n": {"de": "Türkei", "en": "Türkiye"}, "option_i18n": {"de": "Türkei", "en": "Türkiye"}}], "options": [{"id": "a_1", "text": "Schweden", "text_i18n": {"de": "Schweden", "en": "Sweden"}, "option_i18n": {"de": "Schweden", "en": "Sweden"}}, {"id": "a_2", "text": "Deutschland", "text_i18n": {"de": "Deutschland", "en": "Germany"}, "option_i18n": {"de": "Deutschland", "en": "Germany"}}, {"id": "a_3", "text": "Ukraine", "text_i18n": {"de": "Ukraine", "en": "Ukraine"}, "option_i18n": {"de": "Ukraine", "en": "Ukraine"}}, {"id": "a_4", "text": "Türkei", "text_i18n": {"de": "Türkei", "en": "Türkiye"}, "option_i18n": {"de": "Türkei", "en": "Türkiye"}}], "question": "In welchem Land wurden die Tischplatten hergestellt?", "prompt_i18n": {"de": "In welchem Land wurden die Tischplatten hergestellt?", "en": "In which country were the table tops manufactured?"}, "correctAnswer": "Ukraine"}]	\N	f	0.00	\N	t	2026-01-13 15:51:03.728794	2026-04-13 15:29:23.651089	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{"Front Office",Gäste}	{"de": "Unsere Tische", "en": "Our tables"}	{"de": "Unsere Tische im Frühstücksraum und in der Lounge sind aus einem ganz ungewöhnlichen Material!", "en": "Our tables in the breakfast room and lounge are made of a very unusual material!"}	{}	f	Unsere Tische im Frühstücksraum und in der Lounge sind aus…	{"de": "Unsere Tische im Frühstücksraum und in der Lounge sind aus…", "en": "Our tables in the breakfast room and lounge are made of a…"}	{}
1f208e67-5c08-49bb-9cb3-9b2599c12a8b	Kaffee am Morgen...	... vertreibt nicht immer Sorgen. Es ist wichtig, dass man auf Qualität, Herkunft und Lieferwege achtet. 	video	5	https://luise.bio/uploads/task-video-1768822928738-334665892.mp4	[{"answers": [{"id": "a_1", "text": "Weil er aus Haselnüssen ist.", "text_i18n": {"de": "Weil er aus Haselnüssen ist.", "en": "Because it's made from hazelnuts."}, "option_i18n": {"de": "Weil er aus Haselnüssen ist.", "en": "Because it's made from hazelnuts."}}, {"id": "a_2", "text": "Weil er von Rapunzel ist.", "text_i18n": {"de": "Weil er von Rapunzel ist.", "en": "Because it's from Rapunzel."}, "option_i18n": {"de": "Weil er von Rapunzel ist.", "en": "Because it's from Rapunzel."}}, {"id": "a_3", "text": "Weil der Kaffee in Bayern angebaut wurde.", "text_i18n": {"de": "Weil der Kaffee in Bayern angebaut wurde.", "en": "Because the coffee was grown in Bavaria."}, "option_i18n": {"de": "Weil der Kaffee in Bayern angebaut wurde.", "en": "Because the coffee was grown in Bavaria."}}, {"id": "a_4", "text": "Weil er von gestern ist.", "text_i18n": {"de": "Weil er von gestern ist.", "en": "Because he is from yesterday."}, "option_i18n": {"de": "Weil er von gestern ist.", "en": "Because he is from yesterday."}}], "options": [{"id": "a_1", "text": "Weil er aus Haselnüssen ist.", "text_i18n": {"de": "Weil er aus Haselnüssen ist.", "en": "Because it's made from hazelnuts."}, "option_i18n": {"de": "Weil er aus Haselnüssen ist.", "en": "Because it's made from hazelnuts."}}, {"id": "a_2", "text": "Weil er von Rapunzel ist.", "text_i18n": {"de": "Weil er von Rapunzel ist.", "en": "Because it's from Rapunzel."}, "option_i18n": {"de": "Weil er von Rapunzel ist.", "en": "Because it's from Rapunzel."}}, {"id": "a_3", "text": "Weil der Kaffee in Bayern angebaut wurde.", "text_i18n": {"de": "Weil der Kaffee in Bayern angebaut wurde.", "en": "Because the coffee was grown in Bavaria."}, "option_i18n": {"de": "Weil der Kaffee in Bayern angebaut wurde.", "en": "Because the coffee was grown in Bavaria."}}, {"id": "a_4", "text": "Weil er von gestern ist.", "text_i18n": {"de": "Weil er von gestern ist.", "en": "Because he is from yesterday."}, "option_i18n": {"de": "Weil er von gestern ist.", "en": "Because he is from yesterday."}}], "question": "Warum kannst du den Kaffee bei uns sorglos genießen?", "prompt_i18n": {"de": "Warum kannst du den Kaffee bei uns sorglos genießen?", "en": "Why can you enjoy coffee with us without any worries?"}, "correctAnswer": "Weil er von Rapunzel ist."}]	\N	f	0.00	\N	t	2026-01-18 21:14:41.390593	2026-04-13 15:54:13.535309	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Kaffee am Morgen...", "en": "Coffee in the morning..."}	{"de": "... vertreibt nicht immer Sorgen. Es ist wichtig, dass man auf Qualität, Herkunft und Lieferwege achtet. ", "en": "... doesn't always drive away worries. It is important to pay attention to quality, origin and delivery routes."}	{}	f	... vertreibt nicht immer Sorgen. Es ist wichtig, dass man…	{"de": "... vertreibt nicht immer Sorgen. Es ist wichtig, dass man…", "en": "... doesn't always drive away worries. It is important to…"}	{"de": "https://luise.bio/uploads/task-video-1768822928738-334665892.de.vtt", "en": "https://luise.bio/uploads/task-video-1768822928738-334665892.en.vtt"}
29bcad8b-4816-46ed-9b55-68ecb72eed73	Kunstwerk "Universum der Farben"	Auf der Treppe hinunter zu unserem Frühstücksraum hängt ein Gemälde. Stellt man sich genau davor, kann man mehrere versteckte Botschaften finden, auch wenn manche kaum zu finden sind. Eine Botschaft kann man relativ einfach erkennen. 	quiz	10	\N	[{"answers": [{"id": "a_1", "text": "Earth in a sea of colours", "text_i18n": {"de": "Earth in a sea of colours", "en": "Earth in a sea of ​​colors"}, "option_i18n": {"de": "Earth in a sea of colours", "en": "Earth in a sea of ​​colors"}}, {"id": "a_2", "text": "Earthlings unite", "text_i18n": {"de": "Earthlings unite", "en": "Earthlings unite"}, "option_i18n": {"de": "Earthlings unite", "en": "Earthlings unite"}}, {"id": "a_3", "text": "Earth is precious", "text_i18n": {"de": "Earth is precious", "en": "Earth is precious"}, "option_i18n": {"de": "Earth is precious", "en": "Earth is precious"}}, {"id": "a_4", "text": "Black is the sum of all colours", "text_i18n": {"de": "Black is the sum of all colours", "en": "Black is the sum of all colors"}, "option_i18n": {"de": "Black is the sum of all colours", "en": "Black is the sum of all colors"}}, {"id": "a_5", "text": "Golden earth", "text_i18n": {"de": "Golden earth", "en": "Golden earth"}, "option_i18n": {"de": "Golden earth", "en": "Golden earth"}}], "options": [{"id": "a_1", "text": "Earth in a sea of colours", "text_i18n": {"de": "Earth in a sea of colours", "en": "Earth in a sea of ​​colors"}, "option_i18n": {"de": "Earth in a sea of colours", "en": "Earth in a sea of ​​colors"}}, {"id": "a_2", "text": "Earthlings unite", "text_i18n": {"de": "Earthlings unite", "en": "Earthlings unite"}, "option_i18n": {"de": "Earthlings unite", "en": "Earthlings unite"}}, {"id": "a_3", "text": "Earth is precious", "text_i18n": {"de": "Earth is precious", "en": "Earth is precious"}, "option_i18n": {"de": "Earth is precious", "en": "Earth is precious"}}, {"id": "a_4", "text": "Black is the sum of all colours", "text_i18n": {"de": "Black is the sum of all colours", "en": "Black is the sum of all colors"}, "option_i18n": {"de": "Black is the sum of all colours", "en": "Black is the sum of all colors"}}, {"id": "a_5", "text": "Golden earth", "text_i18n": {"de": "Golden earth", "en": "Golden earth"}, "option_i18n": {"de": "Golden earth", "en": "Golden earth"}}], "question": "Wie lautet diese Botschaft?", "prompt_i18n": {"de": "Wie lautet diese Botschaft?", "en": "What is this message?"}, "correctAnswer": "Earthlings unite"}]	\N	f	0.00	\N	t	2026-01-19 15:41:28.412109	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Mensch & soziales Umfeld	einfach	1-3 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Kunstwerk \\"Universum der Farben\\"", "en": "Artwork “Universe of Colors”"}	{"de": "Auf der Treppe hinunter zu unserem Frühstücksraum hängt ein Gemälde. Stellt man sich genau davor, kann man mehrere versteckte Botschaften finden, auch wenn manche kaum zu finden sind. Eine Botschaft kann man relativ einfach erkennen. ", "en": "There is a painting hanging on the stairs down to our breakfast room. If you stand right in front of it, you can find several hidden messages, even if some are difficult to find. It is relatively easy to recognize a message."}	{}	f	Auf der Treppe hinunter zu unserem Frühstücksraum hängt…	{"de": "Auf der Treppe hinunter zu unserem Frühstücksraum hängt…", "en": "There is a painting hanging on the stairs down to our…"}	\N
a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	Wall of Change 	Unsere analoge Wall of Change in der Lobby macht Nachhaltigkeit sichtbar und greifbar. Sie zeigt transparent, welche konkreten Maßnahmen wir im Hotel Luise bereits umgesetzt haben – ökologisch, sozial und wirtschaftlich. Kein Marketing, sondern echte Veränderungen zum Anfassen. Die über 200 Blätter an der Wand musst du aber nicht alle zählen und lesen. 	quiz	5	\N	[{"answers": [{"id": "a_1", "text": "AROMA & KRÄUTER", "text_i18n": {"de": "AROMA & KRÄUTER", "en": "AROMA & HERBS"}, "option_i18n": {"de": "AROMA & KRÄUTER", "en": "AROMA & HERBS"}}, {"id": "a_2", "text": "KLIMAPOSITIVE TAGUNGEN", "text_i18n": {"de": "KLIMAPOSITIVE TAGUNGEN", "en": "CLIMATE POSITIVE CONFERENCES"}, "option_i18n": {"de": "KLIMAPOSITIVE TAGUNGEN", "en": "CLIMATE POSITIVE CONFERENCES"}}, {"id": "a_3", "text": "KLEIDERSPENDEN", "text_i18n": {"de": "KLEIDERSPENDEN", "en": "CLOTHING DONATIONS"}, "option_i18n": {"de": "KLEIDERSPENDEN", "en": "CLOTHING DONATIONS"}}, {"id": "a_4", "text": "NATURE GRAFITTI ART", "text_i18n": {"de": "NATURE GRAFITTI ART", "en": "NATURE GRAFITTI ART"}, "option_i18n": {"de": "NATURE GRAFITTI ART", "en": "NATURE GRAFITTI ART"}}, {"id": "a_5", "text": "ECO BÜRO", "text_i18n": {"de": "ECO BÜRO", "en": "ECO OFFICE"}, "option_i18n": {"de": "ECO BÜRO", "en": "ECO OFFICE"}}, {"id": "a_6", "text": "CHARTA DER VIELFALT", "text_i18n": {"de": "CHARTA DER VIELFALT", "en": "CHARTER OF DIVERSITY"}, "option_i18n": {"de": "CHARTA DER VIELFALT", "en": "CHARTER OF DIVERSITY"}}], "options": [{"id": "a_1", "text": "AROMA & KRÄUTER", "text_i18n": {"de": "AROMA & KRÄUTER", "en": "AROMA & HERBS"}, "option_i18n": {"de": "AROMA & KRÄUTER", "en": "AROMA & HERBS"}}, {"id": "a_2", "text": "KLIMAPOSITIVE TAGUNGEN", "text_i18n": {"de": "KLIMAPOSITIVE TAGUNGEN", "en": "CLIMATE POSITIVE CONFERENCES"}, "option_i18n": {"de": "KLIMAPOSITIVE TAGUNGEN", "en": "CLIMATE POSITIVE CONFERENCES"}}, {"id": "a_3", "text": "KLEIDERSPENDEN", "text_i18n": {"de": "KLEIDERSPENDEN", "en": "CLOTHING DONATIONS"}, "option_i18n": {"de": "KLEIDERSPENDEN", "en": "CLOTHING DONATIONS"}}, {"id": "a_4", "text": "NATURE GRAFITTI ART", "text_i18n": {"de": "NATURE GRAFITTI ART", "en": "NATURE GRAFITTI ART"}, "option_i18n": {"de": "NATURE GRAFITTI ART", "en": "NATURE GRAFITTI ART"}}, {"id": "a_5", "text": "ECO BÜRO", "text_i18n": {"de": "ECO BÜRO", "en": "ECO OFFICE"}, "option_i18n": {"de": "ECO BÜRO", "en": "ECO OFFICE"}}, {"id": "a_6", "text": "CHARTA DER VIELFALT", "text_i18n": {"de": "CHARTA DER VIELFALT", "en": "CHARTER OF DIVERSITY"}, "option_i18n": {"de": "CHARTA DER VIELFALT", "en": "CHARTER OF DIVERSITY"}}], "question": "Was steht auf dem Blatt ganz oben links?", "prompt_i18n": {"de": "Was steht auf dem Blatt ganz oben links?", "en": "What does it say on the top left of the sheet?"}, "correctAnswer": "NATURE GRAFITTI ART"}]	\N	f	0.00	\N	t	2026-01-19 15:34:12.098334	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Kommunikation & Netzwerke	sehr einfach	1-3 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	\N	{"de": "Wall of Change ", "en": "Wall of Change"}	{"de": "Unsere analoge Wall of Change in der Lobby macht Nachhaltigkeit sichtbar und greifbar. Sie zeigt transparent, welche konkreten Maßnahmen wir im Hotel Luise bereits umgesetzt haben – ökologisch, sozial und wirtschaftlich. Kein Marketing, sondern echte Veränderungen zum Anfassen. Die über 200 Blätter an der Wand musst du aber nicht alle zählen und lesen. ", "en": "Our analog Wall of Change in the lobby makes sustainability visible and tangible. It shows transparently which concrete measures we have already implemented at the Hotel Luise - ecological, social and economic. No marketing, just real changes you can touch. But you don't have to count and read all of the more than 200 sheets of paper on the wall."}	{}	f	Unsere analoge Wall of Change in der Lobby macht…	{"de": "Unsere analoge Wall of Change in der Lobby macht…", "en": "Our analog Wall of Change in the lobby makes…"}	\N
ee640e48-bad4-43b3-aa1c-e3881ccd93e7	Pasta Fantastica	Wir lieben die Pasta im Salz und Pfeffer. Was gab es denn diese Woche? Schicke uns ein Bild von deinem Teller aus dem Restaurant. :)	photo	15	\N	\N	\N	t	0.00	\N	t	2026-03-17 17:42:31.853584	2026-04-13 07:37:44.769866	1f3f610a-bbe3-4bf4-82a2-d948a48fb78a	once	\N	Ressourcenverbrauch & Materialeinsatz	einfach	3-10 Min	Smartphone/PC	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Pasta Fantastica", "en": "Pasta Fantastica"}	{"de": "Wir lieben die Pasta im Salz und Pfeffer. Was gab es denn diese Woche? Schicke uns ein Bild von deinem Teller aus dem Restaurant. :)", "en": "We love the pasta in salt and pepper. What was there this week? Send us a picture of your plate from the restaurant. :)"}	{"de": "", "en": ""}	f	Wir lieben die Pasta im Salz und Pfeffer. Was gab es denn…	{"de": "Wir lieben die Pasta im Salz und Pfeffer. Was gab es denn…", "en": "We love the pasta in salt and pepper. What was there this…"}	\N
d23b70e4-ab37-4c2a-a8fa-717869ff7338	Burgerinitiative	Bist du auf den Geschmack gekommen und hast dir einen schönen Burger im Hempels bestellt? Beweisfoto! \n\nAch und Dienstags ist Veggie-Day mit besonders feinen veggie Burgerpreisen!	photo	15	\N	\N	\N	t	0.00	\N	t	2026-03-17 17:48:41.960831	2026-04-13 07:37:44.769866	4f2e6075-ab6f-4f37-9882-e31f01cabfe5	monthly	\N	Ressourcenverbrauch & Materialeinsatz	einfach	3-10 Min	Smartphone/PC	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Burgerinitiative", "en": "Burger initiative"}	{"de": "Bist du auf den Geschmack gekommen und hast dir einen schönen Burger im Hempels bestellt? Beweisfoto! \\n\\nAch und Dienstags ist Veggie-Day mit besonders feinen veggie Burgerpreisen!", "en": "Have you got a taste for it and ordered a nice burger at Hempels? Photo evidence! \\n\\nOh and Tuesdays are Veggie Day with particularly fine veggie burger prices!"}	{"de": "", "en": ""}	f	Bist du auf den Geschmack gekommen und hast dir einen…	{"de": "Bist du auf den Geschmack gekommen und hast dir einen…", "en": "Have you got a taste for it and ordered a nice burger at…"}	\N
7e613eb6-ce9d-48ee-94f9-c3418383ccba	TripAdvisor	Bewerte uns auf TripAdvisor und schicke uns einen Screenshot	photo	30	\N	\N	\N	t	0.00	\N	t	2026-01-04 14:27:01.973072	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	mittel	10-30 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "TripAdvisor", "en": "TripAdvisor"}	{"de": "Bewerte uns auf TripAdvisor und schicke uns einen Screenshot", "en": "Rate us on TripAdvisor and send us a screenshot"}	{}	f	Bewerte uns auf TripAdvisor und schicke uns einen…	{"de": "Bewerte uns auf TripAdvisor und schicke uns einen…", "en": "Rate us on TripAdvisor and send us a screenshot"}	\N
31dd768d-262c-4545-9bd7-37451bd97469	Regeneration	Nachhaltigkeit ist out. Zumindest ist Coach und Speaker Andreas Koch der Meinung. Wir eigentlich auch ;) 	video	5	https://luise.bio/uploads/task-video-1768909216551-459432883.mp4	[{"answers": [{"id": "a_1", "text": "Neue Generationen zu schaffen", "text_i18n": {"de": "Neue Generationen zu schaffen", "en": "To create new generations"}, "option_i18n": {"de": "Neue Generationen zu schaffen", "en": "To create new generations"}}, {"id": "a_2", "text": "Die Muskeln zu Entspannen", "text_i18n": {"de": "Die Muskeln zu Entspannen", "en": "Relax the muscles"}, "option_i18n": {"de": "Die Muskeln zu Entspannen", "en": "Relax the muscles"}}, {"id": "a_3", "text": "Eine Situation besser zu machen", "text_i18n": {"de": "Eine Situation besser zu machen", "en": "To make a situation better"}, "option_i18n": {"de": "Eine Situation besser zu machen", "en": "To make a situation better"}}, {"id": "a_4", "text": "Generationsübergreifende Aufbereitung zu leisten", "text_i18n": {"de": "Generationsübergreifende Aufbereitung zu leisten", "en": "To provide cross-generational preparation"}, "option_i18n": {"de": "Generationsübergreifende Aufbereitung zu leisten", "en": "To provide cross-generational preparation"}}], "options": [{"id": "a_1", "text": "Neue Generationen zu schaffen", "text_i18n": {"de": "Neue Generationen zu schaffen", "en": "To create new generations"}, "option_i18n": {"de": "Neue Generationen zu schaffen", "en": "To create new generations"}}, {"id": "a_2", "text": "Die Muskeln zu Entspannen", "text_i18n": {"de": "Die Muskeln zu Entspannen", "en": "Relax the muscles"}, "option_i18n": {"de": "Die Muskeln zu Entspannen", "en": "Relax the muscles"}}, {"id": "a_3", "text": "Eine Situation besser zu machen", "text_i18n": {"de": "Eine Situation besser zu machen", "en": "To make a situation better"}, "option_i18n": {"de": "Eine Situation besser zu machen", "en": "To make a situation better"}}, {"id": "a_4", "text": "Generationsübergreifende Aufbereitung zu leisten", "text_i18n": {"de": "Generationsübergreifende Aufbereitung zu leisten", "en": "To provide cross-generational preparation"}, "option_i18n": {"de": "Generationsübergreifende Aufbereitung zu leisten", "en": "To provide cross-generational preparation"}}], "question": "Regeneration versucht", "prompt_i18n": {"de": "Regeneration versucht", "en": "Regeneration attempted"}, "correctAnswer": "Eine Situation besser zu machen"}]	\N	f	0.00	\N	t	2026-01-20 11:40:19.803127	2026-04-13 15:54:22.813475	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Mensch & soziales Umfeld	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Regeneration", "en": "regeneration"}	{"de": "Nachhaltigkeit ist out. Zumindest ist Coach und Speaker Andreas Koch der Meinung. Wir eigentlich auch ;) ", "en": "Sustainability is out. At least that’s what coach and speaker Andreas Koch thinks. Actually, us too ;)"}	{}	f	Nachhaltigkeit ist out. Zumindest ist Coach und Speaker…	{"de": "Nachhaltigkeit ist out. Zumindest ist Coach und Speaker…", "en": "Sustainability is out. At least that’s what coach and…"}	{"de": "https://luise.bio/uploads/task-video-1768909216551-459432883.de.vtt", "en": "https://luise.bio/uploads/task-video-1768909216551-459432883.en.vtt"}
80097d7b-8e1d-414e-96ed-f24ccbd10edd	Ausgrabung in der Zukunft	Im Untergeschoss vor dem Frühstücksraum gibt es ein Kunstwerk in Form eine Tunnels. \nDas Kunstwerk stellt die Frage: Was wird man über unser Jahrhundert finden, wenn man in einigen Jahrtausend eine Ausgrabung macht. Aus der Antike oder Steinzeit findet man oft Tonscherben und "Müll" aus der jeweiligen Zeit. Teil des Kunstwerkes sind Recyclat-Rohlinge für Kunststoffflaschen (Sehen aus wie Reagenzgläser). Der Fels wurde aus Reststücken von Dämmstoffen hergestellt. 	quiz	10	\N	[{"answers": [{"id": "a_1", "text": "23", "text_i18n": {"de": "23", "en": "23"}, "option_i18n": {"de": "23", "en": "23"}}, {"id": "a_2", "text": "20", "text_i18n": {"de": "20", "en": "20"}, "option_i18n": {"de": "20", "en": "20"}}, {"id": "a_3", "text": "18", "text_i18n": {"de": "18", "en": "18"}, "option_i18n": {"de": "18", "en": "18"}}, {"id": "a_4", "text": "16", "text_i18n": {"de": "16", "en": "16"}, "option_i18n": {"de": "16", "en": "16"}}, {"id": "a_5", "text": "14", "text_i18n": {"de": "14", "en": "14"}, "option_i18n": {"de": "14", "en": "14"}}], "options": [{"id": "a_1", "text": "23", "text_i18n": {"de": "23", "en": "23"}, "option_i18n": {"de": "23", "en": "23"}}, {"id": "a_2", "text": "20", "text_i18n": {"de": "20", "en": "20"}, "option_i18n": {"de": "20", "en": "20"}}, {"id": "a_3", "text": "18", "text_i18n": {"de": "18", "en": "18"}, "option_i18n": {"de": "18", "en": "18"}}, {"id": "a_4", "text": "16", "text_i18n": {"de": "16", "en": "16"}, "option_i18n": {"de": "16", "en": "16"}}, {"id": "a_5", "text": "14", "text_i18n": {"de": "14", "en": "14"}, "option_i18n": {"de": "14", "en": "14"}}], "question": "Wieviele Recyclat-Rohlinge wurden verwendet?", "prompt_i18n": {"de": "Wieviele Recyclat-Rohlinge wurden verwendet?", "en": "How many recycled blanks were used?"}, "correctAnswer": "18"}]	\N	f	0.00	\N	t	2026-01-20 10:49:51.187691	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Kommunikation & Netzwerke	einfach	1-3 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Ausgrabung in der Zukunft", "en": "Excavation in the future"}	{"de": "Im Untergeschoss vor dem Frühstücksraum gibt es ein Kunstwerk in Form eine Tunnels. \\nDas Kunstwerk stellt die Frage: Was wird man über unser Jahrhundert finden, wenn man in einigen Jahrtausend eine Ausgrabung macht. Aus der Antike oder Steinzeit findet man oft Tonscherben und \\"Müll\\" aus der jeweiligen Zeit. Teil des Kunstwerkes sind Recyclat-Rohlinge für Kunststoffflaschen (Sehen aus wie Reagenzgläser). Der Fels wurde aus Reststücken von Dämmstoffen hergestellt. ", "en": "In the basement in front of the breakfast room there is a work of art in the form of a tunnel. \\nThe work of art asks the question: What will you find about our century if you do an excavation in a few millennia. From antiquity or the Stone Age you can often find pottery shards and \\"rubbish\\" from the respective period. Part of the work of art are recycled blanks for plastic bottles (look like test tubes). The rock was made from leftover pieces of insulation material."}	{}	f	Im Untergeschoss vor dem Frühstücksraum gibt es ein…	{"de": "Im Untergeschoss vor dem Frühstücksraum gibt es ein…", "en": "In the basement in front of the breakfast room there is a…"}	\N
9278c916-8a13-4013-ab69-5f0697395202	Schlemmerschuppen	Wir möchten als Teil unserer Nachbarschaft auch einen Beitrag leisten und haben deshalb einen Lebensmittelautomaten vor dem Hotel stehen. Die Produkte werden sind überwiegend in Mehrweg-Verpackungen und sind regional und/oder bio-zertifiziert. Wir haben dort einen QR-Code versteckt, finde ihn. 	qr	5	\N	\N	MARGA	f	0.00	\N	t	2026-01-20 10:12:44.240949	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Mensch & soziales Umfeld	sehr einfach	1-3 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"de": "Schlemmerschuppen", "en": "Gourmet Shed"}	{"de": "Wir möchten als Teil unserer Nachbarschaft auch einen Beitrag leisten und haben deshalb einen Lebensmittelautomaten vor dem Hotel stehen. Die Produkte werden sind überwiegend in Mehrweg-Verpackungen und sind regional und/oder bio-zertifiziert. Wir haben dort einen QR-Code versteckt, finde ihn. ", "en": "We would like to make a contribution as part of our neighborhood and that is why we have a food vending machine in front of the hotel. The products are predominantly in reusable packaging and are regional and/or organic certified. We have hidden a QR code there, find it."}	{}	f	Wir möchten als Teil unserer Nachbarschaft auch einen…	{"de": "Wir möchten als Teil unserer Nachbarschaft auch einen…", "en": "We would like to make a contribution as part of our…"}	\N
0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	Was sind die IDGs?	Kurzvideo über die IDGs mit Fragen am Ende	video	15	https://www.youtube.com/watch?v=KJhOw98S45U	[{"answers": [{"id": "a_1", "text": "Option 1", "text_i18n": {"de": "Option 1", "en": "Option 1"}, "option_i18n": {"de": "Option 1", "en": "Option 1"}}, {"id": "a_2", "text": "Option 2", "text_i18n": {"de": "Option 2", "en": "Option 2"}, "option_i18n": {"de": "Option 2", "en": "Option 2"}}, {"id": "a_3", "text": "Option 3", "text_i18n": {"de": "Option 3", "en": "Option 3"}, "option_i18n": {"de": "Option 3", "en": "Option 3"}}], "options": [{"id": "a_1", "text": "Option 1", "text_i18n": {"de": "Option 1", "en": "Option 1"}, "option_i18n": {"de": "Option 1", "en": "Option 1"}}, {"id": "a_2", "text": "Option 2", "text_i18n": {"de": "Option 2", "en": "Option 2"}, "option_i18n": {"de": "Option 2", "en": "Option 2"}}, {"id": "a_3", "text": "Option 3", "text_i18n": {"de": "Option 3", "en": "Option 3"}, "option_i18n": {"de": "Option 3", "en": "Option 3"}}], "question": "Was sind die IDGs?", "prompt_i18n": {"de": "Was sind die IDGs?", "en": "What are the IDGs?"}, "correctAnswer": "Option 1"}]	\N	f	0.00	\N	f	2026-01-04 14:27:01.977881	2026-04-13 15:29:23.651089	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Mensch & soziales Umfeld	mittel	1-3 Min	Hotel	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{Gäste,"Front Office"}	{"de": "Was sind die IDGs?", "en": "What are the IDGs?"}	{"de": "Kurzvideo über die IDGs mit Fragen am Ende", "en": "Short video about the IDGs with questions at the end"}	{}	f	Kurzvideo über die IDGs mit Fragen am Ende	{"de": "Kurzvideo über die IDGs mit Fragen am Ende", "en": "Short video about the IDGs with questions at the end"}	{}
bc73bf39-0c3b-4e6b-8bba-372f4fbe59d4	LinkedIn	Folge uns auf LinkedIn und gebe den Code hier ein, der auf unserem Profil steht. \nDu findest uns unter: https://www.linkedin.com/company/hotel-luise	qr	15	\N	\N	L73EW2	f	0.00	\N	t	2026-01-04 14:27:01.961302	2026-04-13 07:37:44.769866	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Kommunikation & Netzwerke	einfach	3-10 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	\N	{{Gäste}}	{"de": "LinkedIn", "en": "LinkedIn"}	{"de": "Folge uns auf LinkedIn und gebe den Code hier ein, der auf unserem Profil steht. \\nDu findest uns unter: https://www.linkedin.com/company/hotel-luise", "en": "Follow us on LinkedIn and enter the code here that is on our profile. \\nYou can find us at: https://www.linkedin.com/company/hotel-luise"}	{}	f	Folge uns auf LinkedIn und gebe den Code hier ein, der auf…	{"de": "Folge uns auf LinkedIn und gebe den Code hier ein, der auf…", "en": "Follow us on LinkedIn and enter the code here that is on…"}	\N
12999df0-1c40-4d9a-af5c-c7ceb082bc2b	Support your local shops	Wir haben bei einigen Shops QR-Codes hinterlegt. Besuche Sie und du bekommst dafür von uns Punkte :)\nBeende die Shopping-Tour in der Hotel-Lobby.	visit_location	5	\N	\N	\N	f	0.00	\N	f	2026-01-04 14:27:01.968812	2026-04-13 07:37:44.769866	e24f97e1-81fb-496e-a48f-9ce29a6be570	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	1-3 Min	Smartphone/PC	49.58961400	11.01469200	\N	\N	\N	\N	\N	1	{b145ef6a-52a8-4b14-95d6-3cdbac6f9e11}	{}	{}	\N	{{Gäste}}	{"de": "Support your local shops", "en": "Support your local shops"}	{"de": "Wir haben bei einigen Shops QR-Codes hinterlegt. Besuche Sie und du bekommst dafür von uns Punkte :)\\nBeende die Shopping-Tour in der Hotel-Lobby.", "en": "We have stored QR codes in some shops. Visit them and you will get points from us :)\\nEnd the shopping tour in the hotel lobby."}	{}	f	Wir haben bei einigen Shops QR-Codes hinterlegt. Besuche…	{"de": "Wir haben bei einigen Shops QR-Codes hinterlegt. Besuche…", "en": "We have stored QR codes in some shops. Visit them and you…"}	\N
49154be8-0d8b-410d-a200-e0b7794271ef	Cradle-to-Cradle 2	C2C - Weiter geht's! 	video	5	https://luise.bio/uploads/task-video-1768817447209-172234198.mp4	[{"answers": [{"id": "a_1", "text": "... wieder in den Wald legen und verrotten lassen.", "text_i18n": {"de": "... wieder in den Wald legen und verrotten lassen.", "en": "...put it back in the forest and let it rot."}, "option_i18n": {"de": "... wieder in den Wald legen und verrotten lassen.", "en": "...put it back in the forest and let it rot."}}, {"id": "a_2", "text": "... für den Gerüstbau verwenden.", "text_i18n": {"de": "... für den Gerüstbau verwenden.", "en": "... use for scaffolding."}, "option_i18n": {"de": "... für den Gerüstbau verwenden.", "en": "... use for scaffolding."}}, {"id": "a_3", "text": "... als Upcyling-Projekt zu einem Boot machen.", "text_i18n": {"de": "... als Upcyling-Projekt zu einem Boot machen.", "en": "...make it into a boat as an upcycling project."}, "option_i18n": {"de": "... als Upcyling-Projekt zu einem Boot machen.", "en": "...make it into a boat as an upcycling project."}}, {"id": "a_4", "text": "... klimapositiv verfeuern.", "text_i18n": {"de": "... klimapositiv verfeuern.", "en": "... burn in a climate-positive way."}, "option_i18n": {"de": "... klimapositiv verfeuern.", "en": "... burn in a climate-positive way."}}], "options": [{"id": "a_1", "text": "... wieder in den Wald legen und verrotten lassen.", "text_i18n": {"de": "... wieder in den Wald legen und verrotten lassen.", "en": "...put it back in the forest and let it rot."}, "option_i18n": {"de": "... wieder in den Wald legen und verrotten lassen.", "en": "...put it back in the forest and let it rot."}}, {"id": "a_2", "text": "... für den Gerüstbau verwenden.", "text_i18n": {"de": "... für den Gerüstbau verwenden.", "en": "... use for scaffolding."}, "option_i18n": {"de": "... für den Gerüstbau verwenden.", "en": "... use for scaffolding."}}, {"id": "a_3", "text": "... als Upcyling-Projekt zu einem Boot machen.", "text_i18n": {"de": "... als Upcyling-Projekt zu einem Boot machen.", "en": "...make it into a boat as an upcycling project."}, "option_i18n": {"de": "... als Upcyling-Projekt zu einem Boot machen.", "en": "...make it into a boat as an upcycling project."}}, {"id": "a_4", "text": "... klimapositiv verfeuern.", "text_i18n": {"de": "... klimapositiv verfeuern.", "en": "... burn in a climate-positive way."}, "option_i18n": {"de": "... klimapositiv verfeuern.", "en": "... burn in a climate-positive way."}}], "question": "Das heißt, man könnte ein Cradle-to-Cradle Holzregal sogar...", "prompt_i18n": {"de": "Das heißt, man könnte ein Cradle-to-Cradle Holzregal sogar...", "en": "This means that you could even use a cradle-to-cradle wooden shelf..."}, "correctAnswer": "... wieder in den Wald legen und verrotten lassen."}]	\N	f	0.00	\N	t	2026-01-19 10:10:49.610752	2026-04-13 15:54:28.659968	50cfe2f2-a82e-43cb-8366-aaa7235d58e1	once	\N	Ressourcenverbrauch & Materialeinsatz	sehr einfach	1-3 Min	Smartphone/PC	\N	\N	\N	\N	\N	\N	42296565-9379-4c71-9050-ad241a982245	\N	\N	{}	{}	\N	\N	{"de": "Cradle-to-Cradle 2", "en": "Cradle to Cradle 2"}	{"de": "C2C - Weiter geht's! ", "en": "C2C - Let's move on!"}	{}	f	C2C - Weiter geht's!	{"de": "C2C - Weiter geht's!", "en": "C2C - Let's move on!"}	{"de": "https://luise.bio/uploads/task-video-1768817447209-172234198.de.vtt", "en": "https://luise.bio/uploads/task-video-1768817447209-172234198.en.vtt"}
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_members (id, team_id, user_id, joined_at, points_contributed) FROM stdin;
f9f10c8a-6e7b-44d4-ad2a-2715ffdf2a71	e7a15685-970f-47f8-8a5c-8a6a52d7420c	108873fe-b2e0-43a8-be0c-36f567e480cb	2026-03-20 09:04:33.76408	0
d7fa9c53-f0a3-4588-9508-c90384bd4b7b	b244c152-12a4-4cbd-b081-e59abae168b5	ef4bfe44-a53e-4acf-8412-6a1a913da692	2026-03-27 20:48:07.516112	0
f2e56429-cff0-4bef-8399-b748053d68c3	b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85	874490b4-c9c0-4f89-a460-b0d460a9387e	2026-03-30 08:12:52.858795	0
b4d49d11-abf7-47df-9ffc-ddf379c8d48f	b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85	230d6d19-eba9-4fc9-bc43-7ffa3d4425f6	2026-04-02 07:56:43.722595	0
4b3181e6-8519-4f31-949d-db838d54edbe	e7a15685-970f-47f8-8a5c-8a6a52d7420c	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	2026-04-02 11:30:13.413088	0
\.


--
-- Data for Name: team_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_qr_codes (id, team_id, qr_token, created_at) FROM stdin;
c75aa006-f862-4463-89e6-0a551b1aaed7	f8d11e8d-823d-43fb-86ad-d4069e0f051e	0a391c58ad8aca418ea7fb4e5b566048d1a5b03cce0093341d54aba899984049	2026-01-08 11:00:03.442873
61868e9d-2540-45fc-a5b9-b7eb3f2b71f7	ae04ca7b-0a57-4bfc-8510-3280c4215085	1182f464b553a71cebb92b97e07ced109a9abbfce705fc3f6e6cc33f92bb20c2	2026-01-08 12:21:09.383651
d17a6862-72e6-4d4d-98e2-54fa0649b029	97fe7586-b58e-4423-9860-38dae9781aa1	83bb17cb565441859f08a9e6b8c79eab7d50b5c96c11cf753fbf660a8f6967e5	2026-01-08 12:52:46.545614
109524f5-da36-4d99-8856-67cb3b717d1b	e7a15685-970f-47f8-8a5c-8a6a52d7420c	776486b82c5e5cba477d5f2d289ee9904fa7af8a1afc0fc111b35a3ae9f3ab6a	2026-03-20 09:04:33.766704
1a47314e-906a-4a96-8a3a-6284d4a9c6c2	b244c152-12a4-4cbd-b081-e59abae168b5	d4f477d236f57052afcfb03a1c99b1eefa4a71f8048851bf93a4bbd6e6db513b	2026-03-27 20:48:07.517839
50e4633f-2c9e-472d-9fd0-d6ee21880fc8	b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85	1dc5c001c77247072d762beebc7e2b398b03b1a55fc9d2a8659f774e7d19531a	2026-03-30 08:12:52.860354
\.


--
-- Data for Name: team_registration_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_registration_qr_codes (id, team_id, qr_token, enabled, created_at) FROM stdin;
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name, created_by, points_pool, created_at, updated_at, active, name_i18n) FROM stdin;
f8d11e8d-823d-43fb-86ad-d4069e0f051e	Familie	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-01-08 11:00:03.43675	2026-01-16 20:12:32.073177	f	{"de": "Familie", "en": "Family"}
ae04ca7b-0a57-4bfc-8510-3280c4215085	Testteam	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0	2026-01-08 12:21:09.372869	2026-01-16 20:12:32.073177	f	{"de": "Testteam", "en": "Test team"}
97fe7586-b58e-4423-9860-38dae9781aa1	Familie	8af2afba-1be0-4951-b066-790a31718076	0	2026-01-08 12:52:46.535834	2026-01-16 20:12:32.073177	f	{"de": "Familie", "en": "Family"}
e7a15685-970f-47f8-8a5c-8a6a52d7420c	Team Jason	108873fe-b2e0-43a8-be0c-36f567e480cb	0	2026-03-20 09:04:33.762526	2026-03-20 09:04:33.762526	t	{"de": "Team Jason", "en": "Team Jason"}
b244c152-12a4-4cbd-b081-e59abae168b5	Team Demo Gast	ef4bfe44-a53e-4acf-8412-6a1a913da692	0	2026-03-27 20:48:07.514791	2026-03-27 20:48:07.514791	t	{"de": "Team Demo Gast", "en": "Team Demo Gast"}
b4c84fbc-c0ff-453f-84e8-6c7c0e44ac85	Thowe's Team	874490b4-c9c0-4f89-a460-b0d460a9387e	0	2026-03-30 08:12:52.857723	2026-03-30 08:12:52.857723	t	{"de": "Thowe's Team", "en": "Thowe's Team"}
\.


--
-- Data for Name: user_consent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_consent (user_id, consent_data, created_at, updated_at) FROM stdin;
ffe30495-7455-4198-a15d-56b44c289976	{"analytics": true, "marketing": true, "dataProcessing": true}	2026-03-17 17:36:11.904567	2026-03-17 17:36:15.836215
874490b4-c9c0-4f89-a460-b0d460a9387e	{"analytics": false, "marketing": false, "dataProcessing": false}	2026-03-19 13:57:41.208535	2026-03-20 09:03:43.919694
108873fe-b2e0-43a8-be0c-36f567e480cb	{"analytics": false, "marketing": false, "dataProcessing": false}	2026-03-20 09:03:15.50986	2026-03-20 09:03:45.864317
de6756c2-06f2-412b-bbdc-d498a406d0b8	{"analytics": false, "marketing": false, "dataProcessing": true}	2026-04-03 16:24:18.876871	2026-04-03 16:24:18.876871
96042c9f-31f5-4e70-bd74-5bf514b7f0ba	{"analytics": false, "marketing": false, "dataProcessing": true}	2026-04-03 16:24:59.404853	2026-04-03 16:24:59.404853
25b3474d-3d76-4f58-8494-c169d3160e7f	{"analytics": false, "marketing": false, "dataProcessing": true}	2026-04-03 16:27:02.715814	2026-04-03 16:27:02.715814
1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	{"analytics": false, "marketing": false, "dataProcessing": true}	2026-04-07 10:16:29.239458	2026-04-07 10:16:29.239458
e503c22a-ac49-4154-b7d3-648f0f08ccc7	{"analytics": false, "marketing": false, "dataProcessing": true}	2026-04-07 19:03:00.935073	2026-04-07 19:03:00.935073
d0e016fa-2f5c-4606-9df1-719713d5d520	{"analytics": false, "marketing": false, "dataProcessing": true}	2026-04-10 09:56:59.433006	2026-04-10 09:56:59.433006
276ab066-e6de-4957-ae0c-ccea7b590ac9	{"analytics": false, "marketing": false, "dataProcessing": true}	2026-04-13 11:36:52.184277	2026-04-13 11:36:52.184277
\.


--
-- Data for Name: user_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_qr_codes (id, user_id, qr_token, created_at, expires_at) FROM stdin;
d303a29b-4043-463d-b6bf-8ad30245e366	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	384bc9210f2deafe8933e0e98e25a9dcfdfc3b3a20b887d7a63b42a9aa4f6175	2026-01-08 10:33:29.232464	\N
\.


--
-- Data for Name: user_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_tasks (id, user_id, task_id, completed_at, photo_url, quiz_answers, points_earned, survey_responses, verification_status, rejection_reason, verified_at, verified_by, task_category) FROM stdin;
9ed897eb-411d-4971-aabd-7035d3b37465	de6756c2-06f2-412b-bbdc-d498a406d0b8	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2026-04-03 16:28:45.26078	\N	[{"answer": "Zur Regenration des Bodens und Baustoff für Tiere", "answerId": "a_2", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	natur
d66ed7d3-950e-4c4f-bd68-54990768f3b6	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	bdfd714f-988e-47ba-9f92-181d2dd608d0	2026-04-03 16:35:26.295771	\N	[{"answer": "Georg", "answerId": "a_2", "questionIndex": 0}]	10	\N	\N	\N	\N	\N	kommunikation
82768c6f-ab22-4b1f-8d39-35a0881047cb	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-04-03 16:38:51.970084	\N	[{"answer": "Weil er von Rapunzel ist.", "answerId": "a_2", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
1a39147b-3c4f-4234-a1c6-989c8394a1d8	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	31dd768d-262c-4545-9bd7-37451bd97469	2026-04-05 21:26:44.678617	\N	[{"answer": "Eine Situation besser zu machen", "answerId": "a_3", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	mensch
8152f973-07db-4222-9974-27bc3e7986fb	e503c22a-ac49-4154-b7d3-648f0f08ccc7	d23b70e4-ab37-4c2a-a8fa-717869ff7338	2026-04-07 19:07:54.97311	https://luise.bio/uploads/task-photo-1775588874098-127947399.jpg	\N	15	\N	approved	\N	2026-04-10 10:06:23.986923	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	ressourcen
fe7754c6-4811-4d34-817f-ad1413da93c8	276ab066-e6de-4957-ae0c-ccea7b590ac9	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	2026-04-13 11:37:51.345856	\N	\N	10	\N	\N	\N	\N	\N	kommunikation
ed229da5-172d-4f35-9cd6-4ae0036d7fd1	ef4bfe44-a53e-4acf-8412-6a1a913da692	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-04-15 09:08:42.620644	\N	[{"answer": "Weil er von Rapunzel ist.", "answerId": "a_2", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
93be938f-b970-4f1d-b50c-3e470a38eff1	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-04-15 15:36:33.360767	\N	[{"answer": "Weil er von Rapunzel ist.", "answerId": "a_2", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
56fe4e07-ac04-4205-8ff8-a79b195464ec	9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	42296565-9379-4c71-9050-ad241a982245	2026-04-15 15:40:02.600828	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "answerId": "a_1", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
06bb25c7-67c4-4efa-b737-4e00b6a87d8c	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	53966428-2831-47fb-b171-e7a405044c83	2026-04-01 18:00:08.173619	\N	[{"answer": "10.000 - 15.000", "answerId": "a_2", "questionIndex": 0}, {"answer": "Beute", "answerId": "a_3", "questionIndex": 1}]	10	\N	\N	\N	\N	\N	natur
2211e9bb-67c4-41a5-ac99-7de7aa711db0	de6756c2-06f2-412b-bbdc-d498a406d0b8	31dd768d-262c-4545-9bd7-37451bd97469	2026-04-03 16:35:38.650587	\N	[{"answer": "Eine Situation besser zu machen", "answerId": "a_3", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	mensch
6cce976f-8c30-4652-8f8c-25cdc321af6b	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	42296565-9379-4c71-9050-ad241a982245	2026-04-03 16:39:46.330364	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "answerId": "a_1", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
e3eaf184-8e82-4a90-8cd7-5d4f73c17e82	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	456c1be6-40da-4f3d-9810-ea8e87e72afc	2026-04-03 16:30:01.986087	https://luise.bio/uploads/task-photo-1775233800768-881350761.png	\N	10	\N	approved	\N	2026-04-03 16:41:56.380576	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	kommunikation
0ea1cc35-2251-4346-b644-d5f1fd391624	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2026-04-07 10:23:16.14216	\N	[{"answer": "Zur Regenration des Bodens und Baustoff für Tiere", "answerId": "a_2", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	natur
1fc13903-4ca7-4804-aaca-556d1c249570	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	2026-04-07 10:39:15.025578	\N	\N	10	\N	\N	\N	\N	\N	kommunikation
e5dc48d4-1da0-41b8-b7ef-c381c5802d9e	ffe30495-7455-4198-a15d-56b44c289976	8987fd0c-2c2f-49fe-83e3-bc6985fd1985	2026-04-15 08:41:35.58964	https://luise.bio/uploads/task-photo-1776242493861-387851231.jpeg	\N	10	\N	approved	\N	2026-04-15 08:44:25.145493	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	mensch
f3995a3f-cc16-48e9-a353-2ce08e8237cb	ef4bfe44-a53e-4acf-8412-6a1a913da692	42296565-9379-4c71-9050-ad241a982245	2026-04-15 09:10:34.095997	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "answerId": "a_1", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
c4ec9487-b33f-48d7-9642-5391e1be250a	4763666e-100e-4e28-a0e5-31f0f0fe6b31	ce748baa-f09a-451b-8c04-7f1bd5ce8738	2026-01-20 15:43:10.848073	\N	[{"answer": "ein schräger Vogel", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
18152e3d-62f4-456d-a5b9-fc67be924a44	de6756c2-06f2-412b-bbdc-d498a406d0b8	7b097c73-5180-4538-b41e-6d115bfffbe1	2026-04-03 16:30:17.954907	\N	[{"answer": "Ukraine", "answerId": "a_3", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
242dbe08-e41c-4aa2-80c9-e67919124bd2	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2026-04-03 16:36:29.306333	\N	[{"answer": "Zur Regenration des Bodens und Baustoff für Tiere", "answerId": "a_2", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	natur
18d29fe6-2793-48c1-9b80-1b58a1eae40e	25b3474d-3d76-4f58-8494-c169d3160e7f	0b1a16a9-c712-4195-ad7d-e37abffa1074	2026-04-03 16:42:44.012843	https://luise.bio/uploads/task-photo-1775234561563-638456829.jpg	\N	15	\N	approved	\N	2026-04-03 16:43:32.481662	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	ressourcen
0818d035-2174-4bcb-a71b-eac0e3f37003	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	31dd768d-262c-4545-9bd7-37451bd97469	2026-04-07 10:25:09.112719	\N	[{"answer": "Eine Situation besser zu machen", "answerId": "a_3", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	mensch
548c0f1e-4e5c-4114-a153-97d725a95a09	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	b22e00c6-b363-4f85-839c-1a7002bc8c3b	2026-04-07 10:25:47.441964	\N	\N	15	\N	\N	\N	\N	\N	mensch
1727936d-ef61-460b-93e0-5e1a942ef9ee	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	42296565-9379-4c71-9050-ad241a982245	2026-04-07 10:42:23.111905	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "answerId": "a_1", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
3984ab86-4d9a-4d81-819f-ca99d1c7b03d	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	2026-04-15 08:42:41.261865	\N	\N	10	\N	\N	\N	\N	\N	kommunikation
eac8aafe-5ea7-4ae6-9337-483d6c1d8c1f	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	49a47427-e93f-439c-ac10-bf089760aa79	2025-12-04 12:03:52.229802	\N	[{"answer": "Blue", "questionIndex": 0}, {"answer": "Switch off", "questionIndex": 1}]	25	\N	pending	\N	\N	\N	ressourcen
5b4db523-e3b8-4e7d-80d1-4fa429cde98f	8af2afba-1be0-4951-b066-790a31718076	49a47427-e93f-439c-ac10-bf089760aa79	2025-12-05 08:51:19.618158	\N	[{"answer": "Blue", "questionIndex": 0}, {"answer": "Switch off", "questionIndex": 1}]	25	\N	pending	\N	\N	\N	ressourcen
06dcce84-3ba8-41c2-93e8-0c6e41b75d05	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	2026-01-06 21:48:26.103332	\N	[{"answer": "Option 1", "questionIndex": 0}]	32	\N	pending	\N	\N	\N	mensch
010a865f-951d-48a0-ad89-22bb1910d1a9	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2026-01-06 21:50:53.968372	\N	[{"answer": "Option 1", "questionIndex": 0}]	4	\N	pending	\N	\N	\N	ressourcen
b07ceeb2-a28b-48c7-9c04-95d89efc8886	ffe30495-7455-4198-a15d-56b44c289976	49a47427-e93f-439c-ac10-bf089760aa79	2026-01-13 15:30:51.910777	\N	[{"answer": "Blue", "questionIndex": 0}, {"answer": "Switch off", "questionIndex": 1}]	12	\N	pending	\N	\N	\N	ressourcen
3b34d855-4017-4b3b-9283-697e5f0cf998	ffe30495-7455-4198-a15d-56b44c289976	5073320b-3b03-41d8-84df-a5aa48ffbc01	2026-01-14 08:40:03.470239	\N	[{"answer": "Airlines müssen eine Checkbox anklicken", "questionIndex": 0}]	4	\N	pending	\N	\N	\N	ressourcen
cfbb01e7-9a79-485e-b691-e5cfe3acf9d3	ffe30495-7455-4198-a15d-56b44c289976	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2026-01-14 18:11:47.359207	\N	[{"answer": "Orbital Systems", "questionIndex": 0}]	4	\N	pending	\N	\N	\N	ressourcen
54616a4a-a19c-4446-8b4c-31558cc4c4bd	ffe30495-7455-4198-a15d-56b44c289976	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	2026-01-09 09:39:03.743751	\N	[{"answer": "Option 1", "questionIndex": 0}]	32	\N	pending	\N	\N	\N	mensch
3b91583a-d36d-4a25-8b14-c3ea61c96089	ffe30495-7455-4198-a15d-56b44c289976	6da2f0d2-d40d-4222-b308-6c2efc4cbb02	2026-01-12 14:21:44.334374	\N	\N	12	[{"answer": "43,59", "questionId": "undefined"}]	pending	\N	\N	\N	kommunikation
a3611ae2-807c-4392-bc56-9620a503de12	f28e1527-f696-4a20-b952-ea567e5fc67d	49a47427-e93f-439c-ac10-bf089760aa79	2026-01-16 16:24:56.343315	\N	[{"answer": "Blue", "questionIndex": 0}, {"answer": "Switch off", "questionIndex": 1}]	12	\N	pending	\N	\N	\N	ressourcen
af5c67e2-7d87-4f02-9535-9e925674ff19	ef4bfe44-a53e-4acf-8412-6a1a913da692	49a47427-e93f-439c-ac10-bf089760aa79	2026-01-12 18:37:16.758943	\N	\N	12	\N	pending	\N	\N	\N	ressourcen
a290d0b4-9e3a-4d95-b25e-870afb395992	ef4bfe44-a53e-4acf-8412-6a1a913da692	f212470c-195f-4d65-a9a8-d9015cce8bf3	2025-12-27 05:10:10.436859	\N	\N	6	\N	pending	\N	\N	\N	mensch
fdc285d9-caf9-4113-8b71-6d9b95546f56	ef4bfe44-a53e-4acf-8412-6a1a913da692	b145ef6a-52a8-4b14-95d6-3cdbac6f9e11	2026-01-11 03:39:20.808346	\N	\N	4	\N	pending	\N	\N	\N	natur
500c6d47-d8d8-4bac-99dc-82b232c5e2c0	ef4bfe44-a53e-4acf-8412-6a1a913da692	7b097c73-5180-4538-b41e-6d115bfffbe1	2025-12-28 00:58:24.443871	\N	\N	2	\N	pending	\N	\N	\N	ressourcen
19778831-4952-4d77-9b7a-e00afd98a025	ef4bfe44-a53e-4acf-8412-6a1a913da692	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	2026-01-09 19:42:44.097482	\N	\N	2	\N	pending	\N	\N	\N	kommunikation
d2189e44-998f-42bd-a9a1-07eb419edcd7	ef4bfe44-a53e-4acf-8412-6a1a913da692	456c1be6-40da-4f3d-9810-ea8e87e72afc	2026-01-14 17:05:03.595763	\N	\N	32	\N	pending	\N	\N	\N	kommunikation
719b9de0-93d1-4460-a1c8-658909c798d0	ef4bfe44-a53e-4acf-8412-6a1a913da692	d3237f56-375d-400f-a9df-abbb5b145c8d	2026-01-13 23:28:33.585389	\N	\N	8	\N	pending	\N	\N	\N	mensch
0d7be1aa-a3b9-4f34-a475-7ff4513fa606	ef4bfe44-a53e-4acf-8412-6a1a913da692	a92d629c-e2a4-47ef-a3b4-825f69d8de54	2026-01-02 03:55:43.568244	\N	\N	20	\N	pending	\N	\N	\N	kommunikation
85385a89-7a67-4dea-873f-5bec8c0543ab	ef4bfe44-a53e-4acf-8412-6a1a913da692	1bab2d7d-d2ac-4887-b379-bd9fb6d8793b	2026-01-02 11:32:12.449689	\N	\N	8	\N	pending	\N	\N	\N	ressourcen
b8bb3ed8-48c7-4940-bf67-cc7580cdd418	ef4bfe44-a53e-4acf-8412-6a1a913da692	bc73bf39-0c3b-4e6b-8bba-372f4fbe59d4	2026-01-09 14:30:42.24483	\N	\N	6	\N	pending	\N	\N	\N	kommunikation
6f7ab963-916e-4c65-acfc-815eaf068f54	ef4bfe44-a53e-4acf-8412-6a1a913da692	aa9e3701-fb93-48f8-a475-52de830e3b4b	2026-01-11 23:06:37.85096	\N	\N	16	\N	pending	\N	\N	\N	kommunikation
1227fb17-fc40-493b-8e36-ced58e55f27e	ef4bfe44-a53e-4acf-8412-6a1a913da692	6da2f0d2-d40d-4222-b308-6c2efc4cbb02	2026-01-08 19:27:17.05002	\N	\N	12	\N	pending	\N	\N	\N	kommunikation
c3e59672-ca8d-4fac-8911-2f690087764f	ef4bfe44-a53e-4acf-8412-6a1a913da692	b01d3854-960a-4c5e-a92b-ae0b8118c654	2025-12-19 06:27:05.277416	\N	\N	18	\N	pending	\N	\N	\N	mensch
305b2f08-fe28-430c-9e3a-08bfc8a57803	ef4bfe44-a53e-4acf-8412-6a1a913da692	bdfd714f-988e-47ba-9f92-181d2dd608d0	2025-12-25 10:44:51.068238	\N	\N	2	\N	pending	\N	\N	\N	kommunikation
21e10127-a25c-4ea1-9622-27e68512db73	ef4bfe44-a53e-4acf-8412-6a1a913da692	0ca0e2fd-c4ed-467b-bf3c-52a8672409fe	2025-12-25 03:00:32.646237	\N	\N	32	\N	pending	\N	\N	\N	mensch
7d33bf44-1f2f-45c0-9d96-0073cfbd219c	ef4bfe44-a53e-4acf-8412-6a1a913da692	7efe0342-bf73-4bba-9c80-f0acba5019d2	2025-12-27 09:37:29.717686	\N	\N	16	\N	pending	\N	\N	\N	kommunikation
02d5dfbb-8923-43bd-afa4-daf6e111f3cb	ef4bfe44-a53e-4acf-8412-6a1a913da692	7e613eb6-ce9d-48ee-94f9-c3418383ccba	2026-01-02 09:17:52.779	\N	\N	18	\N	pending	\N	\N	\N	kommunikation
07482eaf-3f56-4398-b33b-1d7536eb7e52	ef4bfe44-a53e-4acf-8412-6a1a913da692	a9a29dc6-7c51-4be2-87c9-c3e7cc145b33	2026-01-04 10:21:16.140421	\N	\N	30	\N	pending	\N	\N	\N	kommunikation
7d4e6aa0-2131-404b-bddc-c2d01d974a27	ef4bfe44-a53e-4acf-8412-6a1a913da692	12999df0-1c40-4d9a-af5c-c7ceb082bc2b	2025-12-21 23:40:44.315101	\N	\N	24	\N	pending	\N	\N	\N	ressourcen
66f90136-ef2c-4ff1-8e17-9deb65a92324	ef4bfe44-a53e-4acf-8412-6a1a913da692	5073320b-3b03-41d8-84df-a5aa48ffbc01	2025-12-21 07:51:26.193078	\N	\N	4	\N	pending	\N	\N	\N	ressourcen
e059a879-bfdf-4c60-82a7-c3e7a58bed79	ef4bfe44-a53e-4acf-8412-6a1a913da692	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2025-12-31 22:05:42.166245	\N	\N	4	\N	pending	\N	\N	\N	ressourcen
6848fa7f-455c-44a2-8975-bfb5548fa872	ef4bfe44-a53e-4acf-8412-6a1a913da692	0b1a16a9-c712-4195-ad7d-e37abffa1074	2025-12-29 15:39:26.662656	\N	\N	2	\N	pending	\N	\N	\N	ressourcen
39d4627a-91ad-4b29-aee5-4233986fefcd	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	f212470c-195f-4d65-a9a8-d9015cce8bf3	2025-12-05 09:59:59.859122	http://localhost:5000/uploads/task-photo-1764928799820-243641514.png	\N	30	\N	approved	\N	\N	\N	mensch
135712b7-5eee-4578-8831-36b8bd2723d4	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	0b1a16a9-c712-4195-ad7d-e37abffa1074	2026-01-06 21:48:11.441271	http://localhost:5001/uploads/task-photo-1767736090962-763878775.png	\N	2	\N	approved	\N	\N	\N	ressourcen
b4247232-036c-42cc-9b73-e7529d4ec21f	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	456c1be6-40da-4f3d-9810-ea8e87e72afc	2026-01-06 21:48:42.597645	http://localhost:5001/uploads/task-photo-1767736122567-687115207.png	\N	32	\N	approved	\N	\N	\N	kommunikation
4b620d13-2e3e-4c7f-9819-83628d3a904e	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	7e613eb6-ce9d-48ee-94f9-c3418383ccba	2026-01-06 21:50:37.503053	http://localhost:5001/uploads/task-photo-1767736236934-426904224.png	\N	18	\N	approved	\N	\N	\N	kommunikation
4f5d7f6c-c9d3-497d-9fc3-5a30ae134b15	ffe30495-7455-4198-a15d-56b44c289976	0b1a16a9-c712-4195-ad7d-e37abffa1074	2026-01-13 15:30:04.045327	http://localhost:5001/uploads/task-photo-1768318202972-716445406.jpg	\N	2	\N	approved	\N	\N	\N	ressourcen
c08c4fbd-963d-4e9c-ad40-6e9502c8ad25	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	0b1a16a9-c712-4195-ad7d-e37abffa1074	2026-01-14 21:16:40.698363	http://localhost:5001/uploads/task-photo-1768425399735-639674741.jpg	\N	2	\N	approved	\N	\N	\N	ressourcen
2624ecff-3ffb-4d3a-9af5-e4752c8ceb40	ffe30495-7455-4198-a15d-56b44c289976	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2026-01-19 10:32:43.065674	\N	[{"answer": "Zur Regenration des Bodens und Baustoff für Tiere", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	natur
8c8e2537-512a-4d69-93da-0c913566bc73	ffe30495-7455-4198-a15d-56b44c289976	a92d629c-e2a4-47ef-a3b4-825f69d8de54	2026-01-19 11:38:44.83054	https://luise.bio/uploads/task-photo-1768822723888-276511100.jpg	\N	20	\N	approved	\N	2026-01-19 11:39:16.615425	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	kommunikation
4f19c53b-85a2-4124-ac1a-4df0334d2202	ffe30495-7455-4198-a15d-56b44c289976	42296565-9379-4c71-9050-ad241a982245	2026-01-19 12:09:53.008145	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
a11ed503-303e-4874-9f26-8f770e198908	ffe30495-7455-4198-a15d-56b44c289976	49154be8-0d8b-410d-a200-e0b7794271ef	2026-01-19 12:10:09.775716	\N	[{"answer": "... wieder in den Wald legen und verrotten lassen.", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
8358b73d-5170-4289-aa4b-b10ba1bfe6af	ffe30495-7455-4198-a15d-56b44c289976	36e8f64d-341c-4c0b-86fa-531a28d5e98b	2026-01-19 12:10:17.197283	\N	[{"answer": "Sortenreine Auftrennung der Rohstoffe", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	ressourcen
957ef0f5-1d07-4d31-95d7-5242882624b1	ffe30495-7455-4198-a15d-56b44c289976	6cc95dc7-b514-460f-aa99-66d5efece4e7	2026-01-19 12:27:18.434303	\N	[{"answer": "Radarsensoren zur Füllstandsmessung der Restmülltonnen", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
e4f331f6-3f9a-4347-975c-c65a099b646c	ffe30495-7455-4198-a15d-56b44c289976	456c1be6-40da-4f3d-9810-ea8e87e72afc	2026-01-19 15:04:20.153085	https://luise.bio/uploads/task-photo-1768835059798-967506220.png	\N	6	\N	approved	\N	2026-01-19 15:04:57.745024	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	kommunikation
a234bec7-2ea3-4ee1-8611-9fe3e3afbd2b	ffe30495-7455-4198-a15d-56b44c289976	b22e00c6-b363-4f85-839c-1a7002bc8c3b	2026-01-19 15:26:02.511569	\N	\N	6	\N	\N	\N	\N	\N	mensch
82053887-69b1-4a10-abf8-e882b5857cc0	ffe30495-7455-4198-a15d-56b44c289976	29bcad8b-4816-46ed-9b55-68ecb72eed73	2026-01-19 15:43:37.032094	\N	[{"answer": "Earthlings unite", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	mensch
bc20202d-834d-4568-a8ae-9a1ccb702883	ffe30495-7455-4198-a15d-56b44c289976	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	2026-01-20 10:08:38.64721	\N	\N	2	\N	\N	\N	\N	\N	mensch
252744cc-831c-4c2f-8c4f-846252db5df4	4763666e-100e-4e28-a0e5-31f0f0fe6b31	015c7128-73e4-4e0f-a34a-2d7b35ce1e89	2026-01-20 14:06:24.131395	\N	\N	12	\N	\N	\N	\N	\N	mensch
b06fa47c-771a-4570-980b-ecaa87f2d244	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2026-01-20 14:10:56.082634	\N	[{"answer": "Offenbarung, dass Luise dich liebt.", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	kommunikation
93d0bbe9-0871-4add-b229-17ef562809e9	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	29bcad8b-4816-46ed-9b55-68ecb72eed73	2026-01-20 14:22:29.390969	\N	[{"answer": "Earthlings unite", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	mensch
457e654d-d1d0-47d3-a003-a15e8e1ac07a	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	80097d7b-8e1d-414e-96ed-f24ccbd10edd	2026-01-20 14:23:27.653853	\N	[{"answer": "18", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	kommunikation
656f7b61-8d9e-4bf6-ba78-5406bff99ea9	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	2026-01-20 14:26:03.805165	\N	[{"answer": "Das neue Naturheilverfahren", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	mensch
d4e42267-f656-4579-95e4-3eecddce768a	4763666e-100e-4e28-a0e5-31f0f0fe6b31	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-01-20 15:38:16.594319	\N	[{"answer": "Weil er von Rapunzel ist.", "questionIndex": 0}]	3	\N	\N	\N	\N	\N	ressourcen
3364e424-3efd-43ed-be78-48732ae497c7	4763666e-100e-4e28-a0e5-31f0f0fe6b31	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	2026-01-20 15:40:32.970996	\N	\N	4	\N	\N	\N	\N	\N	kommunikation
0f15c666-4af3-4bca-8d51-adbfd1061352	969815d1-4be3-4634-a93e-ac7f4deb8706	42296565-9379-4c71-9050-ad241a982245	2026-01-20 15:40:38.612421	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
a2011ec0-4a58-467e-a383-d8234e681fca	174f733f-81e5-40e4-8cbc-79393d695328	ce748baa-f09a-451b-8c04-7f1bd5ce8738	2026-01-20 15:43:18.046903	\N	[{"answer": "ein schräger Vogel", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
44b88afa-aea9-4d1b-8967-0c40fe926faa	0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	ce748baa-f09a-451b-8c04-7f1bd5ce8738	2026-01-20 15:43:25.646609	\N	[{"answer": "ein schräger Vogel", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
fa9210f5-c911-4a87-9ca7-539f1dd2ce52	ffe30495-7455-4198-a15d-56b44c289976	ce748baa-f09a-451b-8c04-7f1bd5ce8738	2026-01-20 15:43:41.488025	\N	[{"answer": "ein schräger Vogel", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
da15e847-ef64-479f-8cfe-ca29dcf841c5	969815d1-4be3-4634-a93e-ac7f4deb8706	ce748baa-f09a-451b-8c04-7f1bd5ce8738	2026-01-20 15:43:43.735797	\N	[{"answer": "ein schräger Vogel", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
5954ee9e-6c51-409e-839a-3a73cab268f9	040878d8-f0e3-48bc-919c-89c7814b8641	ce748baa-f09a-451b-8c04-7f1bd5ce8738	2026-01-20 15:43:56.0734	\N	[{"answer": "ein schräger Vogel", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
c9c779aa-78b5-4ee3-b15c-f47f69877e05	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	ce748baa-f09a-451b-8c04-7f1bd5ce8738	2026-01-20 15:43:58.526906	\N	[{"answer": "ein schräger Vogel", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
46a7bfdd-8ba8-4fa7-83ef-d1f6eee0b438	040878d8-f0e3-48bc-919c-89c7814b8641	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-01-20 15:45:47.252827	\N	[{"answer": "Weil er von Rapunzel ist.", "questionIndex": 0}]	3	\N	\N	\N	\N	\N	ressourcen
a2c813ec-79ec-484e-b656-5a51599b2752	040878d8-f0e3-48bc-919c-89c7814b8641	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2026-01-20 15:46:08.43795	\N	[{"answer": "Zur Regenration des Bodens und Baustoff für Tiere", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	natur
c56abe9e-ab54-4f9a-99db-1e2ecf91ba42	4763666e-100e-4e28-a0e5-31f0f0fe6b31	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2026-01-20 15:46:35.4214	\N	[{"answer": "Zur Regenration des Bodens und Baustoff für Tiere", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	natur
f9edd498-601b-4dae-a711-506bd8e9ce2e	040878d8-f0e3-48bc-919c-89c7814b8641	29bcad8b-4816-46ed-9b55-68ecb72eed73	2026-01-20 15:46:47.61054	\N	[{"answer": "Earthlings unite", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	mensch
7efb5940-c874-46ff-86d6-ab2a5c20f315	4763666e-100e-4e28-a0e5-31f0f0fe6b31	42296565-9379-4c71-9050-ad241a982245	2026-01-20 15:46:51.38816	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
c8fa9b22-8635-4bf9-a79e-9d28b7a276ee	969815d1-4be3-4634-a93e-ac7f4deb8706	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-01-20 15:47:08.538483	\N	[{"answer": "Weil er von Rapunzel ist.", "questionIndex": 0}]	3	\N	\N	\N	\N	\N	ressourcen
50166fb6-7d77-4834-8673-7cb4443ce288	4763666e-100e-4e28-a0e5-31f0f0fe6b31	49154be8-0d8b-410d-a200-e0b7794271ef	2026-01-20 15:47:11.396549	\N	[{"answer": "... wieder in den Wald legen und verrotten lassen.", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
dfad0165-6711-47c5-b151-60387cfa3a17	174f733f-81e5-40e4-8cbc-79393d695328	821ce0c1-3caf-4b3f-8194-a51e402e3ff9	2026-01-20 15:47:16.610759	\N	\N	4	\N	\N	\N	\N	\N	kommunikation
9380c2bb-9b87-4fd9-a80b-39b683f3e035	040878d8-f0e3-48bc-919c-89c7814b8641	31dd768d-262c-4545-9bd7-37451bd97469	2026-01-20 15:47:24.614657	\N	[{"answer": "Eine Situation besser zu machen", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
20867882-392d-44db-8756-091dbc8837eb	4763666e-100e-4e28-a0e5-31f0f0fe6b31	36e8f64d-341c-4c0b-86fa-531a28d5e98b	2026-01-20 15:47:36.236428	\N	[{"answer": "Sortenreine Auftrennung der Rohstoffe", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	ressourcen
d0dca2d5-9462-4186-a156-ba6e3487e98b	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	42296565-9379-4c71-9050-ad241a982245	2026-01-20 15:47:39.421011	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
28aa488b-a063-4187-a132-d1a9ce20f4be	4763666e-100e-4e28-a0e5-31f0f0fe6b31	5073320b-3b03-41d8-84df-a5aa48ffbc01	2026-01-20 15:48:00.174033	\N	[{"answer": "Airlines müssen eine Checkbox anklicken", "questionIndex": 0}]	12	\N	\N	\N	\N	\N	ressourcen
8b194f69-4f12-4701-a1a6-9be3c7d38366	969815d1-4be3-4634-a93e-ac7f4deb8706	31dd768d-262c-4545-9bd7-37451bd97469	2026-01-20 15:48:07.142708	\N	[{"answer": "Eine Situation besser zu machen", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
c6b1f44d-666c-4b71-900a-e72ef809470b	174f733f-81e5-40e4-8cbc-79393d695328	bdfd714f-988e-47ba-9f92-181d2dd608d0	2026-01-20 15:51:08.78596	\N	[{"answer": "Georg", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	kommunikation
ed335fec-3e37-45e4-8efb-c5b7ded97bd4	969815d1-4be3-4634-a93e-ac7f4deb8706	49154be8-0d8b-410d-a200-e0b7794271ef	2026-01-20 15:51:23.169427	\N	[{"answer": "... wieder in den Wald legen und verrotten lassen.", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
02d032d5-7926-41bf-81b8-fa52edda598e	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	bdfd714f-988e-47ba-9f92-181d2dd608d0	2026-01-20 15:55:56.646729	\N	[{"answer": "Georg", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	kommunikation
badb5275-58a2-4946-a6b9-1e845fbe0fd9	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-01-20 15:56:20.979671	\N	[{"answer": "Weil er von Rapunzel ist.", "questionIndex": 0}]	3	\N	\N	\N	\N	\N	ressourcen
e93e3ed1-76dc-4840-863e-7fa2b2092fa6	174f733f-81e5-40e4-8cbc-79393d695328	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	2026-01-20 15:59:52.327328	\N	\N	2	\N	\N	\N	\N	\N	mensch
3d12f5d9-5e48-4e35-ac77-99edb6514885	040878d8-f0e3-48bc-919c-89c7814b8641	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	2026-01-20 16:00:06.171117	\N	\N	2	\N	\N	\N	\N	\N	mensch
ebb22276-11ac-4759-b3f2-e8c62c90cf78	969815d1-4be3-4634-a93e-ac7f4deb8706	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	2026-01-20 16:00:10.222517	\N	\N	2	\N	\N	\N	\N	\N	mensch
fbe23c11-d157-49bf-bc3d-b434ec24fa42	0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	2026-01-20 16:00:14.714814	\N	\N	2	\N	\N	\N	\N	\N	mensch
2956f14f-d693-460d-a39b-bdd2a3e0b1e4	4763666e-100e-4e28-a0e5-31f0f0fe6b31	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	2026-01-20 16:00:51.05776	\N	\N	2	\N	\N	\N	\N	\N	mensch
c575a16a-d084-4c57-882e-6006b1c6348d	174f733f-81e5-40e4-8cbc-79393d695328	b22e00c6-b363-4f85-839c-1a7002bc8c3b	2026-01-20 16:11:40.871204	\N	\N	6	\N	\N	\N	\N	\N	mensch
cd87e599-5ab4-439a-a1fb-76ab9c66ccb3	969815d1-4be3-4634-a93e-ac7f4deb8706	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2026-01-20 16:12:46.26372	\N	[{"answer": "Offenbarung, dass Luise dich liebt.", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	kommunikation
a3d0365a-d17f-4cb7-b55e-e9dfdeb506a0	040878d8-f0e3-48bc-919c-89c7814b8641	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2026-01-20 16:13:03.819384	\N	[{"answer": "Offenbarung, dass Luise dich liebt.", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	kommunikation
7e75b524-09f3-4364-8916-b8ed2838e125	174f733f-81e5-40e4-8cbc-79393d695328	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2026-01-20 16:13:45.355028	\N	[{"answer": "Offenbarung, dass Luise dich liebt.", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	kommunikation
01d6cc82-f979-44bb-a0b7-256b5a2a70c9	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2026-01-20 16:14:19.863475	\N	[{"answer": "Offenbarung, dass Luise dich liebt.", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	kommunikation
bcb99864-2431-4cf8-91b6-40d1f362b6bf	0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2026-01-20 16:15:15.760142	\N	[{"answer": "Offenbarung, dass Luise dich liebt.", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	kommunikation
a501d00e-cbfb-4c80-8724-10fd5f43b95a	4763666e-100e-4e28-a0e5-31f0f0fe6b31	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2026-01-20 16:17:09.293269	\N	[{"answer": "Offenbarung, dass Luise dich liebt.", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	kommunikation
ca9731f7-ecbe-4434-a942-9ad029c5ae39	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	49154be8-0d8b-410d-a200-e0b7794271ef	2026-01-20 16:17:11.025322	\N	[{"answer": "... wieder in den Wald legen und verrotten lassen.", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
4f6850aa-8887-4bc4-a176-974d3d6f8709	969815d1-4be3-4634-a93e-ac7f4deb8706	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2026-01-20 16:17:30.927632	\N	[{"answer": "Orbital Systems", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	ressourcen
b625e707-c325-418f-a770-53c49e0b6ec5	174f733f-81e5-40e4-8cbc-79393d695328	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2026-01-20 16:17:37.468017	\N	[{"answer": "Orbital Systems", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	ressourcen
d8ccc915-cc9d-4101-8e86-8b9b6f31ccf8	969815d1-4be3-4634-a93e-ac7f4deb8706	b22e00c6-b363-4f85-839c-1a7002bc8c3b	2026-01-20 16:17:45.521777	\N	\N	6	\N	\N	\N	\N	\N	mensch
60108bff-b332-4662-a816-0eec53337a8b	174f733f-81e5-40e4-8cbc-79393d695328	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	2026-01-20 16:19:27.687134	\N	[{"answer": "NATURE GRAFITTI ART", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	kommunikation
e9e0e76f-4e3f-4254-8be5-575195746edd	969815d1-4be3-4634-a93e-ac7f4deb8706	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	2026-01-20 16:21:09.472725	\N	[{"answer": "NATURE GRAFITTI ART", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	kommunikation
6c17be7c-06d2-4248-80c3-e997d07d42d6	040878d8-f0e3-48bc-919c-89c7814b8641	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2026-01-20 16:22:55.853728	\N	[{"answer": "Orbital Systems", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	ressourcen
d8f63db9-3e0c-4c65-8396-e89a068f6a6e	969815d1-4be3-4634-a93e-ac7f4deb8706	8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	2026-01-20 16:23:26.07096	\N	[{"answer": "Das neue Naturheilverfahren", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	mensch
04f94501-32dc-42d5-b59a-f6e77d55e883	174f733f-81e5-40e4-8cbc-79393d695328	aa9e3701-fb93-48f8-a475-52de830e3b4b	2026-01-20 16:38:33.646772	\N	\N	4	\N	\N	\N	\N	\N	kommunikation
1cb714b5-73a2-443e-af1f-8f6855378df4	4763666e-100e-4e28-a0e5-31f0f0fe6b31	0b1a16a9-c712-4195-ad7d-e37abffa1074	2026-01-20 15:46:07.324152	https://luise.bio/uploads/task-photo-1768923966561-165480125.jpeg	\N	8	\N	approved	\N	2026-01-21 16:34:14.627743	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	ressourcen
1f019af9-2ae0-47fd-9084-c88278b91f3b	009d21fa-f28e-4b65-a427-1d9df6dd8b7c	0b1a16a9-c712-4195-ad7d-e37abffa1074	2026-01-20 15:45:07.830472	https://luise.bio/uploads/task-photo-1768923907334-293958618.jpeg	\N	8	\N	approved	\N	2026-01-21 16:34:19.576936	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	ressourcen
a77c6a00-9849-4199-b2d0-0f70231698c8	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	7b097c73-5180-4538-b41e-6d115bfffbe1	2026-01-20 20:11:43.482644	\N	[{"answer": "Ukraine", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	ressourcen
3fd8103a-2910-42d1-b170-ad19e136c59e	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	53966428-2831-47fb-b171-e7a405044c83	2026-01-20 20:12:33.253222	\N	[{"answer": "10.000 - 15.000", "questionIndex": 0}, {"answer": "Beute", "questionIndex": 1}]	4	\N	\N	\N	\N	\N	natur
7be79e76-1c4f-4fb8-9480-2f83e5cbe9bb	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	feeab851-92a6-4209-ba8b-eecc2bb9cc06	2026-01-20 20:15:22.393654	\N	[{"answer": "Orbital Systems", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	ressourcen
abfa21a4-15d3-46b8-8f79-339460bc24ed	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	31dd768d-262c-4545-9bd7-37451bd97469	2026-01-20 20:16:46.40392	\N	[{"answer": "Eine Situation besser zu machen", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
3a3d49b9-ddd1-42cd-a355-214198fa6ce8	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2026-01-20 20:17:12.953019	\N	[{"answer": "Zur Regenration des Bodens und Baustoff für Tiere", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	natur
524643b9-9d76-406f-a3f4-7069168d1c06	174f733f-81e5-40e4-8cbc-79393d695328	9278c916-8a13-4013-ab69-5f0697395202	2026-01-20 22:38:02.106586	\N	\N	2	\N	\N	\N	\N	\N	mensch
1650c01c-3054-46f7-9555-1fce35ad007e	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	42296565-9379-4c71-9050-ad241a982245	2026-01-21 12:20:06.936014	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
70f9d24c-1196-44ca-ba92-c65133a84a32	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	49154be8-0d8b-410d-a200-e0b7794271ef	2026-01-21 12:21:26.615551	\N	[{"answer": "... wieder in den Wald legen und verrotten lassen.", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
4aa96e22-7744-4a89-aee8-d310d58c874c	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	36e8f64d-341c-4c0b-86fa-531a28d5e98b	2026-01-21 12:22:08.637699	\N	[{"answer": "Sortenreine Auftrennung der Rohstoffe", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	ressourcen
ea062d14-6d21-4197-8714-fcedcf252997	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	5073320b-3b03-41d8-84df-a5aa48ffbc01	2026-01-21 12:24:17.558641	\N	[{"answer": "Airlines müssen eine Checkbox anklicken", "questionIndex": 0}]	12	\N	\N	\N	\N	\N	ressourcen
c880c9bf-214f-4fb6-a88b-f77791f6a4c5	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	6cc95dc7-b514-460f-aa99-66d5efece4e7	2026-01-21 12:24:55.450908	\N	[{"answer": "Radarsensoren zur Füllstandsmessung der Restmülltonnen", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
6e370ed6-3ead-4499-b6a0-0e161dbd03e7	174f733f-81e5-40e4-8cbc-79393d695328	8987fd0c-2c2f-49fe-83e3-bc6985fd1985	2026-01-20 15:50:09.768355	https://luise.bio/uploads/task-photo-1768924209402-86981607.jpg	\N	4	\N	approved	\N	2026-01-21 16:34:10.255155	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	mensch
33774082-feb6-42da-9bc6-d33d078524fd	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2026-03-07 16:20:02.729653	\N	[{"answer": "Zur Regenration des Bodens und Baustoff für Tiere", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	natur
eb3a282f-5e05-4c10-a0e7-266c0484f721	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	456c1be6-40da-4f3d-9810-ea8e87e72afc	2026-01-21 12:27:32.873187	https://luise.bio/uploads/task-photo-1768998452421-973110856.jpg	\N	6	\N	approved	\N	2026-03-17 17:40:03.267716	cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	kommunikation
157a8fd2-b0e1-4726-88ce-6fd920c7858a	ffe30495-7455-4198-a15d-56b44c289976	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2026-03-18 14:53:52.702402	\N	[{"answer": "Offenbarung, dass Luise dich liebt.", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	kommunikation
2c151ea7-66ea-4d9f-98e2-df356b4eda9f	ffe30495-7455-4198-a15d-56b44c289976	31dd768d-262c-4545-9bd7-37451bd97469	2026-03-18 14:54:14.345528	\N	[{"answer": "Eine Situation besser zu machen", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
6ce08527-2275-4a36-b9c7-d499d16cac73	ffe30495-7455-4198-a15d-56b44c289976	7b097c73-5180-4538-b41e-6d115bfffbe1	2026-03-18 14:54:22.393276	\N	[{"answer": "Ukraine", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	ressourcen
c87f3a0e-3ca7-4434-94e9-f7fbf53f026c	ffe30495-7455-4198-a15d-56b44c289976	80097d7b-8e1d-414e-96ed-f24ccbd10edd	2026-03-18 14:54:30.808499	\N	[{"answer": "18", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	kommunikation
d58bef88-5deb-411b-bc26-31170582cfd6	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	b22e00c6-b363-4f85-839c-1a7002bc8c3b	2026-03-18 16:07:34.2141	\N	\N	6	\N	\N	\N	\N	\N	mensch
839f9c02-53ac-48c8-ad62-01256f071d09	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	9278c916-8a13-4013-ab69-5f0697395202	2026-03-18 16:15:29.419711	\N	\N	2	\N	\N	\N	\N	\N	mensch
af419065-5f20-402d-841f-1362d78d5f54	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	0ca683a6-b0cc-4faf-94cf-811302a0c4c6	2026-03-18 16:20:33.733136	\N	\N	2	\N	\N	\N	\N	\N	mensch
720f2e11-6af1-4193-8261-ddcc66606d95	9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	2026-03-18 18:08:23.310314	\N	[{"answer": "NATURE GRAFITTI ART", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	kommunikation
ba0f8fed-75ff-4655-b84d-ee20aa2e3adb	874490b4-c9c0-4f89-a460-b0d460a9387e	ee640e48-bad4-43b3-aa1c-e3881ccd93e7	2026-03-18 13:41:20.803203	https://luise.bio/uploads/task-photo-1773841280576-520684489.webp	\N	6	\N	approved	\N	2026-03-19 06:45:00.008978	b03443d3-fa3e-407d-9dcf-ad0e1b246b04	ressourcen
77982c0b-62a9-4080-9ed3-960388662bda	108873fe-b2e0-43a8-be0c-36f567e480cb	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-03-19 10:24:25.299205	\N	[{"answer": "Weil er von Rapunzel ist.", "questionIndex": 0}]	3	\N	\N	\N	\N	\N	ressourcen
9340b5a2-1155-41aa-a3b3-ed143b841708	108873fe-b2e0-43a8-be0c-36f567e480cb	29bcad8b-4816-46ed-9b55-68ecb72eed73	2026-03-19 10:30:13.694261	\N	[{"answer": "Earthlings unite", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	mensch
5171bb97-f711-4afd-958a-d8817aa13075	108873fe-b2e0-43a8-be0c-36f567e480cb	474e2c3e-e7f3-48c6-b60e-4107d890f5a4	2026-03-19 10:49:28.166473	\N	[{"answer": "Offenbarung, dass Luise dich liebt.", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	kommunikation
9f98f609-0751-4a0c-ac92-bcf7fa35e529	108873fe-b2e0-43a8-be0c-36f567e480cb	8c1eb5b5-de31-4a0e-8d9e-8c276d7ebf0e	2026-03-19 10:49:49.690408	\N	[{"answer": "Das neue Naturheilverfahren", "questionIndex": 0}]	6	\N	\N	\N	\N	\N	mensch
f97a8a2b-2c6b-420c-8bf3-8adb02d0d616	108873fe-b2e0-43a8-be0c-36f567e480cb	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	2026-03-19 10:50:34.079383	\N	[{"answer": "NATURE GRAFITTI ART", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	kommunikation
f7244e9b-62e6-430f-867c-650bdd0cb6c6	108873fe-b2e0-43a8-be0c-36f567e480cb	5073320b-3b03-41d8-84df-a5aa48ffbc01	2026-03-19 10:51:55.854806	\N	[{"answer": "Airlines müssen eine Checkbox anklicken", "questionIndex": 0}]	12	\N	\N	\N	\N	\N	ressourcen
ce297d77-606b-45db-8b9e-b4d5a2486cd1	108873fe-b2e0-43a8-be0c-36f567e480cb	218ebb52-1322-4f7f-9e84-6a92b6cb525e	2026-03-19 10:52:27.79463	\N	[{"answer": "Zur Regenration des Bodens und Baustoff für Tiere", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	natur
105d6c92-f5e2-4c56-bfdc-b9b5d8784efd	108873fe-b2e0-43a8-be0c-36f567e480cb	31dd768d-262c-4545-9bd7-37451bd97469	2026-03-19 14:12:48.029209	\N	[{"answer": "Eine Situation besser zu machen", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	mensch
cccf90b7-fc4b-4aaf-8418-ca7d6409558f	108873fe-b2e0-43a8-be0c-36f567e480cb	80097d7b-8e1d-414e-96ed-f24ccbd10edd	2026-03-20 09:16:14.508473	\N	[{"answer": "18", "answerId": "a_3", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	kommunikation
5084c86a-74e7-4bd9-889a-3df87af71546	874490b4-c9c0-4f89-a460-b0d460a9387e	29bcad8b-4816-46ed-9b55-68ecb72eed73	2026-03-20 09:17:34.210314	\N	[{"answer": "Earthlings unite", "answerId": "a_2", "questionIndex": 0}]	4	\N	\N	\N	\N	\N	mensch
54725251-4508-46a8-8501-ff47a4d67d02	108873fe-b2e0-43a8-be0c-36f567e480cb	42296565-9379-4c71-9050-ad241a982245	2026-03-20 09:18:45.396991	\N	[{"answer": "Rohstoffe im Kreislauf zu halten und wiederzuverwenden", "answerId": "a_1", "questionIndex": 0}]	2	\N	\N	\N	\N	\N	ressourcen
fd52524e-a6cc-4e10-b8ae-08432f3acad8	ffe30495-7455-4198-a15d-56b44c289976	a8bb8195-2ae3-43b4-acd6-1f65886b0ae9	2026-04-02 10:53:39.657986	\N	[{"answer": "NATURE GRAFITTI ART", "answerId": "a_4", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	kommunikation
51567780-f92d-49e1-a2a5-a6cfaafc912b	de6756c2-06f2-412b-bbdc-d498a406d0b8	53966428-2831-47fb-b171-e7a405044c83	2026-04-03 16:35:05.437322	\N	[{"answer": "10.000 - 15.000", "answerId": "a_2", "questionIndex": 0}, {"answer": "Beute", "answerId": "a_3", "questionIndex": 1}]	10	\N	\N	\N	\N	\N	natur
6f0c97e3-1b67-4f2c-9934-a927b8f71f8f	96042c9f-31f5-4e70-bd74-5bf514b7f0ba	53966428-2831-47fb-b171-e7a405044c83	2026-04-03 16:37:07.547872	\N	[{"answer": "10.000 - 15.000", "answerId": "a_2", "questionIndex": 0}, {"answer": "Beute", "answerId": "a_3", "questionIndex": 1}]	10	\N	\N	\N	\N	\N	natur
6ddca3ae-0468-421b-b256-0b9edc4c758e	75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-04-05 21:25:06.676954	\N	[{"answer": "Weil er von Rapunzel ist.", "answerId": "a_2", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
4ed84d8b-172c-4de6-94fc-ad57ecedf7c5	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	1f208e67-5c08-49bb-9cb3-9b2599c12a8b	2026-04-07 10:27:30.004035	\N	[{"answer": "Weil er von Rapunzel ist.", "answerId": "a_2", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
0586a9d3-b1b8-4db1-aed4-bb885f0d9449	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	6cc95dc7-b514-460f-aa99-66d5efece4e7	2026-04-07 10:29:00.76803	\N	[{"answer": "Radarsensoren zur Füllstandsmessung der Restmülltonnen", "answerId": "a_4", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
288db294-7821-409b-8a1c-91de90ae6bf3	1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	49154be8-0d8b-410d-a200-e0b7794271ef	2026-04-07 10:42:52.095612	\N	[{"answer": "... wieder in den Wald legen und verrotten lassen.", "answerId": "a_1", "questionIndex": 0}]	5	\N	\N	\N	\N	\N	ressourcen
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, name, role, user_type, points, avatar_url, created_at, updated_at, oauth_provider, oauth_id, oauth_email, sihot_guest_id, sihot_guest_data, email_verified, email_verification_token, email_verification_expires, password_reset_token, password_reset_expires, email_notifications_enabled, login_code, login_code_expires, active, deleted_at, preferred_language, forest_points_kommunikation, forest_points_mensch, forest_points_natur, forest_points_ressourcen, player_profile_status, dyad_scale_1, dyad_scale_2, dyad_scale_3, dyad_scale_4, dominant_dyad, profile_display_name, player_profile_completed_at, dyad_scale_values, player_profile_answers) FROM stdin;
f28e1527-f696-4a20-b952-ea567e5fc67d	franzi@die-hempels.de	$2a$10$wW7DnMSZGy8stMIdyCXmDuEtY/BUFuEJneA/ptWEYXq5skcNH757C	Franzi H.	guest	explorer	12	\N	2026-01-16 16:21:04.966373	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	f	6d13517e71209ab1d197555f9cc8c230b6a30201d0bf3f68f4a9490536368a94	2026-01-17 16:21:04.969	\N	\N	t	\N	\N	t	\N	de	0	0	0	12	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
8af2afba-1be0-4951-b066-790a31718076	employee@example.com	$2a$10$RiucIKVRS3kyYqxOnLBvfubLtxTqGyXB48JTXzN400ZlBqxk2BImK	employee	rezeption	explorer	0	\N	2025-12-04 11:14:44.357971	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	7144b1881d06e8d77aa48d4cd72efbc5ecdccc1aa277aa84c4be49267f2672a9	2026-01-16 18:24:59.723	t	\N	\N	f	\N	de	0	0	0	25	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
1ba01f9b-9d81-4dc4-8aeb-b46e1a32c875	janinalowak@gmx.de	$2a$10$EPYHqJeGrrMsHHdSTdVTW.L0wfUxTMpiT26Qv3jt9541Z/IDZiCwe	Janina	guest	explorer	55	\N	2026-04-07 10:16:29.237074	2026-04-10 09:53:05.166005	\N	\N	\N	\N	\N	f	dd02d331272489b36d9919a9d6976915bac84f3719e3b65f997929bc3534162d	2026-04-08 10:16:29.244	\N	\N	t	\N	\N	t	\N	de	10	55	5	20	completed	3	3	3	4	4	Janina	2026-04-07 10:18:03.536055+00	[3, 3, 3, 4]	[3, 3, 3, 4]
e503c22a-ac49-4154-b7d3-648f0f08ccc7	jakob.falke@mailbox.org	$2a$10$nAL2X.1gxnPPmW.f91gJTO0QhU2FPFfyaSnkP3/tphY/XBUNz/Cpy	Tschaei	guest	explorer	15	\N	2026-04-07 19:03:00.932894	2026-04-10 10:06:23.993103	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	en	0	0	0	15	completed	0	4	2	3	2	Tschaei	2026-04-07 19:03:44.240046+00	[0, 4, 2, 3]	[0, 4, 2, 3]
de6756c2-06f2-412b-bbdc-d498a406d0b8	secretes@haive.de	$2a$10$nln9CZXDZ2hZKzGD1WfXd.VwNHgykZe6CrMQJpghNVj.sUMYqwfZC	Daniel	guest	explorer	25	\N	2026-04-03 16:24:18.874312	2026-04-03 16:35:38.653258	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	0	5	15	5	completed	4	3	0	3	1	Bensen	2026-04-03 16:25:24.805384+00	[4, 3, 0, 3]	[4, 3, 0, 3]
276ab066-e6de-4957-ae0c-ccea7b590ac9	thomas.rossner@imbus.de	$2a$10$y4MqW3EmxoqDgsUJx1bb9OPDdBp21CJnpybqMZKrXLGm3SfzJCp4i	Thomas Rossner	guest	explorer	10	\N	2026-04-13 11:36:52.181872	2026-04-13 11:37:51.349217	\N	\N	\N	\N	\N	f	50dfd5846c70da70f4ecf305b386273c8c0974f4bf64d3ca3273861dce3d5ab6	2026-04-14 11:36:52.188	\N	\N	t	\N	\N	t	\N	de	10	0	0	0	completed	0	0	0	0	1	\N	2026-04-13 11:37:09.302305+00	[0, 0, 0, 0]	[0, 0, 0, 0]
cbf3100d-36a8-4bb3-adc2-41ee8ff42a4b	bf@hotel-luise.de	$2a$10$SVoIQWtrK0SNxWIilZ1HauGrFIHcXoLdL69NdTmkNa7OZT45EeCsu	Ben Admin	administrator	explorer	12	\N	2026-01-12 14:07:42.419221	2026-04-15 08:42:41.265222	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	10	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
64b927ec-1d37-421e-be21-93e08af2e5a8	stakeholder@example.com	$2a$10$xoD0hRUkZeviz7OoGxX33O/SAnFNuFn2S0h4vu6tup3XcedWJm0CW	Test Stakeholder	guest	explorer	0	\N	2025-12-04 11:14:44.357971	2026-01-16 17:22:51.562138	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	f	2026-01-16 17:22:51.562138	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
2cd07be9-0790-414c-b638-e689a79e1fe8	test-new-user@example.com	$2a$10$/M1FW/SmNdmI1v68V.R.2uDYaw3tOtz9mOuyE374wYP7q51EGT86q	Test User	guest	explorer	0	\N	2026-01-19 15:03:03.11669	2026-01-19 15:05:52.439576	\N	\N	\N	\N	\N	f	f64251de4d9510e88699a49d725b69e7b328f4f03fd6ff7ee5ace0809a1b473d	2026-01-20 15:03:03.118	\N	\N	t	\N	\N	f	2026-01-19 15:05:52.439576	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
d1a9cd91-4116-4c02-8a05-12a795a99a19	berit.weiss@nit-kiel.de	$2a$10$7svWrBAhlROgV1DUFTnzleohNnAD6EY6uvxyWp0ktdTnB7OV.P/tC	Berit	guest	explorer	0	\N	2026-01-20 15:29:31.938381	2026-01-20 15:29:31.938381	\N	\N	\N	\N	\N	f	c3bba9a4cb5c979013d8dd761874c8708daca1f9326785cf5c7b950c6f3dfe1c	2026-01-21 15:29:31.94	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
e0986b9c-89a9-4131-a7b2-9b785c8c31d3	ulf.sonntag@nit-kiel.de	$2a$10$Q2IRsD1YjBo7mQM66zMrc.9PaU.5J3qJlGLRTuXsGNBakaYF076pu	Ulf 	guest	explorer	0	\N	2026-01-20 15:29:59.515304	2026-01-20 15:29:59.515304	\N	\N	\N	\N	\N	f	62a4f9044ca1ed464e159380d6a35b05bc062747e3e32e4c85d53dfe2b176674	2026-01-21 15:29:59.517	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
0cc86858-16de-459b-8ef6-6b8b5d5772f8	h.jaich@im-jaich.de	$2a$10$csRHcBCiFkOlRZv0TnJRi.1kT8cHwYLMcGni7rDLJQdgYeCioPshC	Hans	guest	explorer	0	\N	2026-01-20 15:30:16.969646	2026-01-20 15:30:16.969646	\N	\N	\N	\N	\N	f	f35df4be837a261eb8010e5f2864e89645808fdc2a72fc183ed84f1cf6ee0109	2026-01-21 15:30:16.971	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
7171b298-8e9f-4c8a-8886-f5f49dc61fdc	info@hotel-luise.de	$2a$10$XyjqOIVmsKHIyz0uL40RhOBoDBzGV6Pd5R3LP1ilAjoCjfHiNP4j6	Rezeption Hotel Luise	rezeption	explorer	0	\N	2026-01-19 14:25:11.970415	2026-01-19 14:27:54.949894	\N	\N	\N	\N	\N	f	1aba9bdb0d276fcf6c479c51c50b1f76ddee382ba48ca7c73f2be70331c09902	2026-01-20 14:25:11.973	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
34297ec6-7aaa-4ef2-b1bb-7b52f1f8abe1	dirk.unland@imbus.de	$2a$10$OuMBSsMS2bD.psckguuU/.n65ZqqQug3Lhjglx78BpPtF/CSIPjum	Dirk	guest	explorer	0	\N	2026-01-30 11:44:24.967226	2026-04-03 10:46:50.746567	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	f	2026-04-03 10:46:50.746567	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
d0e016fa-2f5c-4606-9df1-719713d5d520	meet@hotel-luise.de	$2a$10$F1p7zSmKATixXKnF/4cO6O6Zqi9f1pVl4W9llAS1TrIYabR5x/nzK	Janina 	administrator	explorer	0	\N	2026-04-10 09:56:59.431214	2026-04-10 10:00:04.059184	\N	\N	\N	\N	\N	f	ca415656f037b9bd241479132fd6cfe7d869f629a409485fd41fd51a7f1f7ce8	2026-04-11 09:56:59.435	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N
230d6d19-eba9-4fc9-bc43-7ffa3d4425f6	jasonhollidy@gmx.de	$2a$10$O1KXiatP7CbvdO8jhefmT.FjOrwx7Uu/Bw64QpPFelJub8twptOra	Jason	guest	explorer	0	\N	2026-03-19 09:16:14.801088	2026-03-19 09:16:14.801088	\N	\N	\N	\N	\N	f	126b4f287a7fde795c2be027526fb148adab996707080ef9d4ad3a053378c85d	2026-03-20 09:16:14.804	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
0a9ed294-2c40-41c1-b2a0-c0bb012e95af	boris@staygood.de	$2a$10$mn/pPD7mRzjzsE1hR.Q0P.3pIYbG6YdfStqbomrYeGPZAv.r.6wha	Boris	guest	explorer	0	\N	2026-01-20 13:06:31.652816	2026-01-20 13:06:31.652816	\N	\N	\N	\N	\N	f	9234e3a9cc36ccf64aa7de38fdbc5ddccc271754ccea92c39adfd13c47864c91	2026-01-21 13:06:31.655	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
7eeda12b-78ca-47d2-bad9-20b258dd8cce	redaktion@example.com	$2a$10$9kGOgbOQtbsYO4wKMFsCqODqTAokO0eOkeYapuNS5BY8vn18JSLKq	Demo Redaktion	redaktion	explorer	0	\N	2026-03-18 15:27:52.737671	2026-03-18 19:03:40.941959	\N	\N	\N	\N	\N	t	e9aaf65661b97f97824274ea7cbf5b571ef49a79ffc87ecaa0e48b6d9466402c	2026-03-19 15:27:52.739	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
040878d8-f0e3-48bc-919c-89c7814b8641	a.koch@bluecontec.com	$2a$10$qHZcGN2LLGglsnNQWchhZejreHTco1K4Ir1Lr3oSPn8WWQVBwhCv.	Andreas	guest	explorer	25	\N	2026-01-20 15:34:03.54121	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	6	10	2	7	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
96042c9f-31f5-4e70-bd74-5bf514b7f0ba	info@keksmann.net	$2a$10$bRQzZuUzldAx5TX1TVsBSuT5LenAjg9sxAzr5uqqNGWiOknhNdX8C	Felix Seyer	guest	explorer	5045	\N	2026-04-03 16:24:59.402708	2026-04-03 16:47:41.972968	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	20	5000	15	10	completed	2	4	2	3	2	Keksmann	2026-04-03 16:26:43.870827+00	[2, 4, 2, 3]	[2, 4, 2, 3]
75ca8ea2-2ec9-4a56-a85b-98d0d2d63e7f	markus1dippold@gmail.com	$2a$10$qxvozlPm.I9vg31nRY29FuAsOVrQ35LhtVnWzsziZY6o2QBrGHMwS	Markus 	guest	explorer	22	\N	2026-03-07 16:15:58.083997	2026-04-05 21:26:44.68157	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	0	5	12	5	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
015fb208-a385-40d0-a289-c073acec8e0b	rezeption@example.com	$2a$10$9kGOgbOQtbsYO4wKMFsCqODqTAokO0eOkeYapuNS5BY8vn18JSLKq	Demo Rezeption	rezeption	explorer	2	\N	2026-03-18 15:27:52.621768	2026-03-18 19:03:40.941959	\N	\N	\N	\N	\N	t	5fb204431f3174d855bd4426c29b19958ebbfe1fdae4a5765e4e35d44321a1f4	2026-03-19 15:27:52.624	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
108873fe-b2e0-43a8-be0c-36f567e480cb	jasonholliday@gmx.de	$2a$10$BMdjRbIAcmbdDW9uD53bx.skSOKSeVSE2tAcduVUAdK8o47GNgjKu	Jason	guest	explorer	99887	\N	2026-03-19 09:19:16.039564	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	12	12	2	17	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
53772231-8597-43ae-8e77-d36b6f23ab2c	admin@example.com	$2a$10$9kGOgbOQtbsYO4wKMFsCqODqTAokO0eOkeYapuNS5BY8vn18JSLKq	Demo Admin	administrator	explorer	4	\N	2025-12-04 11:14:44.357971	2026-03-18 19:03:40.941959	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	0	0	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
b03443d3-fa3e-407d-9dcf-ad0e1b246b04	test@example.com	$2a$10$xoD0hRUkZeviz7OoGxX33O/SAnFNuFn2S0h4vu6tup3XcedWJm0CW	Test User	rezeption	explorer	247	\N	2025-12-04 11:14:44.357971	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	525728	2026-01-19 15:06:21.235	t	\N	de	50	62	0	31	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
ef4bfe44-a53e-4acf-8412-6a1a913da692	demo@example.com	$2a$10$9kGOgbOQtbsYO4wKMFsCqODqTAokO0eOkeYapuNS5BY8vn18JSLKq	Demo Gast	guest	explorer	314	\N	2026-01-17 11:38:18.155538	2026-04-15 09:10:34.099217	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	154	64	4	66	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
25b3474d-3d76-4f58-8494-c169d3160e7f	pa_ule@web.de	$2a$10$lJ5LbiK/tdyhOfHpiVkTYOZse9tq9l1.ArBBJVQbh./fvBKQv09HG	Paul 	guest	explorer	10015	\N	2026-04-03 16:27:02.7133	2026-04-03 16:45:11.266888	\N	\N	\N	\N	\N	f	0ec474a9855d07591dcb6eb009498feb299786b6c94bf3c6d48846fa0033061f	2026-04-04 16:27:02.718	\N	\N	t	\N	\N	t	\N	en	0	0	10000	15	completed	1	2	2	3	4	\N	2026-04-03 16:29:30.638568+00	[1, 2, 2, 3]	[1, 2, 2, 3]
009d21fa-f28e-4b65-a427-1d9df6dd8b7c	wiedenmann@allgaeu.de	$2a$10$qT5Pfs83gJfgm8aQ2ygB6OPY9lG1Mgv1GlrYKOtSYYP2Q4CJFn2am	Sybille	guest	explorer	1028	\N	2026-01-20 15:40:13.670365	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	6	2	0	12	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
4763666e-100e-4e28-a0e5-31f0f0fe6b31	boris@posteo.de	$2a$10$DqMC0RDCizOAUIg4Ym449uunLdz1cisbkWT.mUuZgpQxDmdd4GooO	Boris	guest	explorer	89	\N	2026-01-20 13:07:55.150412	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	10	16	2	31	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
0ae84c2d-5931-4d6c-ba5a-787b4949c1fd	info@davonstart.com	$2a$10$1ZLSUiMv1lPLnlW4s5YJpuQ7LGsop2RetIH3hDsJLxEL/YvAqXGza	Hans	guest	explorer	10	\N	2026-01-20 15:34:56.289856	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	6	4	0	0	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
9a66bdfd-ec15-48c5-a58c-c8968cdc9e22	b.wersdoerfer@hotmail.de	$2a$10$pNqevVklDEAg/FXWJ0MvUuPu.d4tpshx7A3Yh3/LgpjWsIl7m9PBi	Benedikt Wersdörfer 	guest	explorer	91	\N	2026-01-14 19:29:37.284647	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	22	22	6	35	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
174f733f-81e5-40e4-8cbc-79393d695328	weiss.berit@gmail.com	$2a$10$VipxQLqK8Zx3.VGK56KzuOFAnKbBxMziw30.h0Z5ss08KYaSUsYYq	Berit	guest	explorer	60	\N	2026-01-20 15:31:34.758289	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	20	16	0	4	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
969815d1-4be3-4634-a93e-ac7f4deb8706	ulf_sonntag@yahoo.de	$2a$10$BFgycpIkGnZUJqFVA74l3uQ92ZRfb8DXDIxxHwxdzF.C2faqg8hZC	Ulf	guest	explorer	47	\N	2026-01-20 15:32:17.907917	2026-04-03 11:23:26.472771	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	8	18	0	11	skipped	\N	\N	\N	\N	\N	\N	\N	\N	\N
874490b4-c9c0-4f89-a460-b0d460a9387e	thomas.weigel@mnet-mail.de	$2a$10$9qAlNF6J78Mwgz8RBWEphuRcfjWxwn30PknF7mYcPWFac1mIXuVJG	Thowe	guest	explorer	10	\N	2026-03-18 13:32:42.434015	2026-04-10 09:09:39.24814	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	0	4	0	6	completed	2	4	0	1	2	\N	2026-04-10 09:09:04.223784+00	[2, 4, 0, 1]	[2, 4, 0, 1]
9a54ef44-0c1f-4de6-a54d-a29a88f30c1e	thomas@rossner.tk	$2a$10$6C8Aery/U7AFy2hmTlNIeeY4OhX3MgnefpCXM4vizrx1pdxZ2ehkm	Thomas Roßner	guest	explorer	165	\N	2026-01-19 16:35:01.305057	2026-04-15 15:40:02.622088	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	60	15	28	58	completed	1	3	1	2	2	\N	2026-04-13 15:03:42.91547+00	[1, 3, 1, 2]	[1, 3, 1, 2]
ffe30495-7455-4198-a15d-56b44c289976	ben@haive.de	$2a$10$r/RYpVbrRAZVyfKGBePV5.jK0cTKVJQUpQ3BRsmHYR7e1SXj6zB8K	Ben	guest	explorer	486	\N	2026-01-09 09:33:33.406007	2026-04-15 08:44:25.150996	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	t	\N	\N	t	\N	de	53	58	2	36	completed	3	3	0	3	1	Luise	2026-04-03 16:38:23.957509+00	[3, 3, 0, 3]	[3, 3, 0, 3]
\.


--
-- Name: email_delivery_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_delivery_log_id_seq', 3, true);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.schema_migrations_id_seq', 85, true);


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
-- Name: contest_registration_qr_codes contest_registration_qr_codes_contest_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_registration_qr_codes
    ADD CONSTRAINT contest_registration_qr_codes_contest_id_key UNIQUE (contest_id);


--
-- Name: contest_registration_qr_codes contest_registration_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_registration_qr_codes
    ADD CONSTRAINT contest_registration_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: contest_registration_qr_codes contest_registration_qr_codes_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_registration_qr_codes
    ADD CONSTRAINT contest_registration_qr_codes_qr_token_key UNIQUE (qr_token);


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
-- Name: daily_login_points daily_login_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_login_points
    ADD CONSTRAINT daily_login_points_pkey PRIMARY KEY (id);


--
-- Name: daily_login_points daily_login_points_user_id_login_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_login_points
    ADD CONSTRAINT daily_login_points_user_id_login_date_key UNIQUE (user_id, login_date);


--
-- Name: email_delivery_log email_delivery_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_delivery_log
    ADD CONSTRAINT email_delivery_log_pkey PRIMARY KEY (id);


--
-- Name: email_suppressions email_suppressions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_suppressions
    ADD CONSTRAINT email_suppressions_pkey PRIMARY KEY (recipient_email);


--
-- Name: forest_trees forest_trees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_trees
    ADD CONSTRAINT forest_trees_pkey PRIMARY KEY (id);


--
-- Name: gallery_images gallery_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_pkey PRIMARY KEY (id);


--
-- Name: guest_task_completions guest_task_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_task_completions
    ADD CONSTRAINT guest_task_completions_pkey PRIMARY KEY (id);


--
-- Name: guest_task_completions guest_task_completions_unique_session_task; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_task_completions
    ADD CONSTRAINT guest_task_completions_unique_session_task UNIQUE (guest_session_id, task_id);


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
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


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
-- Name: quiz_question_locks quiz_question_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_question_locks
    ADD CONSTRAINT quiz_question_locks_pkey PRIMARY KEY (user_id, task_id, question_index);


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
-- Name: team_registration_qr_codes team_registration_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_registration_qr_codes
    ADD CONSTRAINT team_registration_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: team_registration_qr_codes team_registration_qr_codes_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_registration_qr_codes
    ADD CONSTRAINT team_registration_qr_codes_qr_token_key UNIQUE (qr_token);


--
-- Name: team_registration_qr_codes team_registration_qr_codes_team_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_registration_qr_codes
    ADD CONSTRAINT team_registration_qr_codes_team_id_key UNIQUE (team_id);


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
-- Name: idx_contest_registration_qr_codes_contest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contest_registration_qr_codes_contest_id ON public.contest_registration_qr_codes USING btree (contest_id);


--
-- Name: idx_contest_registration_qr_codes_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contest_registration_qr_codes_enabled ON public.contest_registration_qr_codes USING btree (enabled);


--
-- Name: idx_contest_registration_qr_codes_qr_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contest_registration_qr_codes_qr_token ON public.contest_registration_qr_codes USING btree (qr_token);


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
-- Name: idx_daily_login_points_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_login_points_user_date ON public.daily_login_points USING btree (user_id, login_date);


--
-- Name: idx_email_delivery_log_email_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_delivery_log_email_created ON public.email_delivery_log USING btree (recipient_email, created_at DESC);


--
-- Name: idx_email_delivery_log_type_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_delivery_log_type_status ON public.email_delivery_log USING btree (message_type, status, created_at DESC);


--
-- Name: idx_email_suppressions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_suppressions_expires_at ON public.email_suppressions USING btree (expires_at);


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
-- Name: idx_gallery_images_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gallery_images_task_id ON public.gallery_images USING btree (task_id);


--
-- Name: idx_gallery_images_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gallery_images_user_id ON public.gallery_images USING btree (user_id);


--
-- Name: idx_gallery_images_user_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gallery_images_user_task_id ON public.gallery_images USING btree (user_task_id);


--
-- Name: idx_guest_task_completions_merged; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_task_completions_merged ON public.guest_task_completions USING btree (merged_at) WHERE (merged_at IS NULL);


--
-- Name: idx_guest_task_completions_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_task_completions_session ON public.guest_task_completions USING btree (guest_session_id);


--
-- Name: idx_locations_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_active ON public.locations USING btree (active);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_messages_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_read ON public.messages USING btree (read);


--
-- Name: idx_messages_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_type ON public.messages USING btree (type);


--
-- Name: idx_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_user_id ON public.messages USING btree (user_id);


--
-- Name: idx_messages_user_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_user_read ON public.messages USING btree (user_id, read);


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
-- Name: idx_quiz_question_locks_locked_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_question_locks_locked_until ON public.quiz_question_locks USING btree (locked_until);


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
-- Name: idx_rewards_generated_from_reward_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_generated_from_reward_id ON public.rewards USING btree (generated_from_reward_id);


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
-- Name: idx_tasks_qr_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tasks_qr_code_unique ON public.tasks USING btree (qr_code) WHERE (qr_code IS NOT NULL);


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
-- Name: idx_team_registration_qr_codes_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_registration_qr_codes_enabled ON public.team_registration_qr_codes USING btree (enabled);


--
-- Name: idx_team_registration_qr_codes_qr_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_registration_qr_codes_qr_token ON public.team_registration_qr_codes USING btree (qr_token);


--
-- Name: idx_team_registration_qr_codes_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_registration_qr_codes_team_id ON public.team_registration_qr_codes USING btree (team_id);


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
-- Name: idx_user_tasks_photo_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tasks_photo_url ON public.user_tasks USING btree (photo_url) WHERE (photo_url IS NOT NULL);


--
-- Name: idx_user_tasks_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tasks_task_id ON public.user_tasks USING btree (task_id);


--
-- Name: idx_user_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tasks_user_id ON public.user_tasks USING btree (user_id);


--
-- Name: idx_user_tasks_verification_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tasks_verification_status ON public.user_tasks USING btree (verification_status);


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
-- Name: contests trigger_deactivate_rewards_on_contest_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_deactivate_rewards_on_contest_delete AFTER DELETE ON public.contests FOR EACH ROW EXECUTE FUNCTION public.deactivate_rewards_for_deleted_contest();


--
-- Name: contests trigger_deactivate_rewards_on_contest_end; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_deactivate_rewards_on_contest_end AFTER UPDATE OF end_date ON public.contests FOR EACH ROW WHEN (((new.end_date IS NOT NULL) AND (new.end_date < CURRENT_DATE))) EXECUTE FUNCTION public.deactivate_rewards_for_ended_contest();


--
-- Name: teams trigger_deactivate_rewards_on_team_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_deactivate_rewards_on_team_delete AFTER DELETE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.deactivate_rewards_for_deleted_team();


--
-- Name: contests trigger_deactivate_tasks_on_contest_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_deactivate_tasks_on_contest_delete AFTER DELETE ON public.contests FOR EACH ROW EXECUTE FUNCTION public.deactivate_tasks_for_deleted_contest();


--
-- Name: contests trigger_deactivate_tasks_on_contest_end; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_deactivate_tasks_on_contest_end AFTER UPDATE OF end_date ON public.contests FOR EACH ROW WHEN (((new.end_date IS NOT NULL) AND (new.end_date < CURRENT_DATE))) EXECUTE FUNCTION public.deactivate_tasks_for_ended_contest();


--
-- Name: teams trigger_deactivate_tasks_on_team_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_deactivate_tasks_on_team_delete AFTER DELETE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.deactivate_tasks_for_deleted_team();


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
-- Name: contest_registration_qr_codes contest_registration_qr_codes_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_registration_qr_codes
    ADD CONSTRAINT contest_registration_qr_codes_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON DELETE CASCADE;


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
-- Name: daily_login_points daily_login_points_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_login_points
    ADD CONSTRAINT daily_login_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: gallery_images gallery_images_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: gallery_images gallery_images_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: gallery_images gallery_images_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: gallery_images gallery_images_user_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_user_task_id_fkey FOREIGN KEY (user_task_id) REFERENCES public.user_tasks(id) ON DELETE CASCADE;


--
-- Name: guest_task_completions guest_task_completions_merged_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_task_completions
    ADD CONSTRAINT guest_task_completions_merged_user_id_fkey FOREIGN KEY (merged_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: guest_task_completions guest_task_completions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_task_completions
    ADD CONSTRAINT guest_task_completions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: messages messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: quiz_question_locks quiz_question_locks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_question_locks
    ADD CONSTRAINT quiz_question_locks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: quiz_question_locks quiz_question_locks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_question_locks
    ADD CONSTRAINT quiz_question_locks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: rewards rewards_generated_from_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_generated_from_reward_id_fkey FOREIGN KEY (generated_from_reward_id) REFERENCES public.rewards(id) ON DELETE SET NULL;


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
-- Name: team_registration_qr_codes team_registration_qr_codes_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_registration_qr_codes
    ADD CONSTRAINT team_registration_qr_codes_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


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
-- Name: user_tasks user_tasks_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tasks
    ADD CONSTRAINT user_tasks_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict RHRT7ixyldHIn9w1QHh3vWgZD0jnNT2aYZocOprO2wS4gCIZbdoygyhzgMBT0GV

