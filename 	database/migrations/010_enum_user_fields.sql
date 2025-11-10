DO $$
BEGIN
  CREATE TYPE user_role_enum AS ENUM ('guest', 'employee', 'stakeholder', 'administrator');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE user_type_enum AS ENUM ('explorer', 'guest_in_house', 'observer', 'advocate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE hotel_id_enum AS ENUM ('ROI-BER', 'ROI-VIE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum,
  ALTER COLUMN role SET DEFAULT 'stakeholder';

ALTER TABLE users
  ALTER COLUMN user_type DROP DEFAULT,
  ALTER COLUMN user_type TYPE user_type_enum
    USING (CASE
      WHEN user_type IN ('explorer', 'guest_in_house', 'observer', 'advocate')
        THEN user_type::user_type_enum
      ELSE 'explorer'::user_type_enum
    END),
  ALTER COLUMN user_type SET DEFAULT 'explorer';

DO $$
DECLARE
  _role TEXT;
BEGIN
  CREATE TEMP TABLE pg_temp.tmp_roles(col TEXT);
  INSERT INTO pg_temp.tmp_roles
  SELECT DISTINCT unnest(allowed_roles)
  FROM tasks
  WHERE allowed_roles IS NOT NULL;

  DELETE FROM pg_temp.tmp_roles WHERE col IS NULL;

  FOR _role IN SELECT col FROM pg_temp.tmp_roles LOOP
    IF _role NOT IN (SELECT unnest(enum_range(NULL::user_role_enum))) THEN
      RAISE EXCEPTION 'Invalid role value % detected in tasks.allowed_roles', _role;
    END IF;
  END LOOP;
END $$;

ALTER TABLE tasks
  ALTER COLUMN allowed_roles DROP DEFAULT,
  ALTER COLUMN allowed_roles TYPE user_role_enum[] USING allowed_roles::user_role_enum[],
  ALTER COLUMN allowed_roles SET DEFAULT ARRAY[]::user_role_enum[];

DO $$
DECLARE
  _type TEXT;
BEGIN
  CREATE TEMP TABLE pg_temp.tmp_types(col TEXT);
  INSERT INTO pg_temp.tmp_types
  SELECT DISTINCT unnest(allowed_user_types)
  FROM tasks
  WHERE allowed_user_types IS NOT NULL;

  DELETE FROM pg_temp.tmp_types WHERE col IS NULL;

  FOR _type IN SELECT col FROM pg_temp.tmp_types LOOP
    IF _type NOT IN (SELECT unnest(enum_range(NULL::user_type_enum))) THEN
      RAISE EXCEPTION 'Invalid user type value % detected in tasks.allowed_user_types', _type;
    END IF;
  END LOOP;
END $$;

ALTER TABLE tasks
  ALTER COLUMN allowed_user_types DROP DEFAULT,
  ALTER COLUMN allowed_user_types TYPE user_type_enum[] USING allowed_user_types::user_type_enum[],
  ALTER COLUMN allowed_user_types SET DEFAULT ARRAY[]::user_type_enum[];

DO $$
DECLARE
  _hotel TEXT;
BEGIN
  CREATE TEMP TABLE pg_temp.tmp_hotels(col TEXT);
  INSERT INTO pg_temp.tmp_hotels
  SELECT DISTINCT unnest(allowed_hotel_ids)
  FROM tasks
  WHERE allowed_hotel_ids IS NOT NULL;

  DELETE FROM pg_temp.tmp_hotels WHERE col IS NULL;

  FOR _hotel IN SELECT col FROM pg_temp.tmp_hotels LOOP
    IF _hotel NOT IN (SELECT unnest(enum_range(NULL::hotel_id_enum))) THEN
      RAISE EXCEPTION 'Invalid hotel id value % detected in tasks.allowed_hotel_ids', _hotel;
    END IF;
  END LOOP;
END $$;

ALTER TABLE tasks
  ALTER COLUMN allowed_hotel_ids DROP DEFAULT,
  ALTER COLUMN allowed_hotel_ids TYPE hotel_id_enum[] USING allowed_hotel_ids::hotel_id_enum[],
  ALTER COLUMN allowed_hotel_ids SET DEFAULT ARRAY[]::hotel_id_enum[];

-- Repeat validation for rewards and reward_templates
DO $$
DECLARE
  _role TEXT;
BEGIN
  CREATE TEMP TABLE pg_temp.tmp_reward_roles(col TEXT);
  INSERT INTO pg_temp.tmp_reward_roles
  SELECT DISTINCT unnest(allowed_roles)
  FROM rewards
  WHERE allowed_roles IS NOT NULL;

  DELETE FROM pg_temp.tmp_reward_roles WHERE col IS NULL;

  FOR _role IN SELECT col FROM pg_temp.tmp_reward_roles LOOP
    IF _role NOT IN (SELECT unnest(enum_range(NULL::user_role_enum))) THEN
      RAISE EXCEPTION 'Invalid role value % detected in rewards.allowed_roles', _role;
    END IF;
  END LOOP;
END $$;

ALTER TABLE rewards
  ALTER COLUMN allowed_roles DROP DEFAULT,
  ALTER COLUMN allowed_roles TYPE user_role_enum[] USING allowed_roles::user_role_enum[],
  ALTER COLUMN allowed_roles SET DEFAULT ARRAY[]::user_role_enum[];

DO $$
DECLARE
  _type TEXT;
BEGIN
  CREATE TEMP TABLE pg_temp.tmp_reward_types(col TEXT);
  INSERT INTO pg_temp.tmp_reward_types
  SELECT DISTINCT unnest(allowed_user_types)
  FROM rewards
  WHERE allowed_user_types IS NOT NULL;

  DELETE FROM pg_temp.tmp_reward_types WHERE col IS NULL;

  FOR _type IN SELECT col FROM pg_temp.tmp_reward_types LOOP
    IF _type NOT IN (SELECT unnest(enum_range(NULL::user_type_enum))) THEN
      RAISE EXCEPTION 'Invalid user type value % detected in rewards.allowed_user_types', _type;
    END IF;
  END LOOP;
END $$;

ALTER TABLE rewards
  ALTER COLUMN allowed_user_types DROP DEFAULT,
  ALTER COLUMN allowed_user_types TYPE user_type_enum[] USING allowed_user_types::user_type_enum[],
  ALTER COLUMN allowed_user_types SET DEFAULT ARRAY[]::user_type_enum[];

DO $$
DECLARE
  _hotel TEXT;
BEGIN
  CREATE TEMP TABLE pg_temp.tmp_reward_hotels(col TEXT);
  INSERT INTO pg_temp.tmp_reward_hotels
  SELECT DISTINCT unnest(allowed_hotel_ids)
  FROM rewards
  WHERE allowed_hotel_ids IS NOT NULL;

  DELETE FROM pg_temp.tmp_reward_hotels WHERE col IS NULL;

  FOR _hotel IN SELECT col FROM pg_temp.tmp_reward_hotels LOOP
    IF _hotel NOT IN (SELECT unnest(enum_range(NULL::hotel_id_enum))) THEN
      RAISE EXCEPTION 'Invalid hotel id value % detected in rewards.allowed_hotel_ids', _hotel;
    END IF;
  END LOOP;
END $$;

ALTER TABLE rewards
  ALTER COLUMN allowed_hotel_ids DROP DEFAULT,
  ALTER COLUMN allowed_hotel_ids TYPE hotel_id_enum[] USING allowed_hotel_ids::hotel_id_enum[],
  ALTER COLUMN allowed_hotel_ids SET DEFAULT ARRAY[]::hotel_id_enum[];

-- reward_templates
DO $$
DECLARE
  _role TEXT;
BEGIN
  CREATE TEMP TABLE pg_temp.tmp_template_roles(col TEXT);
  INSERT INTO pg_temp.tmp_template_roles
  SELECT DISTINCT unnest(allowed_roles)
  FROM reward_templates
  WHERE allowed_roles IS NOT NULL;

  DELETE FROM pg_temp.tmp_template_roles WHERE col IS NULL;

  FOR _role IN SELECT col FROM pg_temp.tmp_template_roles LOOP
    IF _role NOT IN (SELECT unnest(enum_range(NULL::user_role_enum))) THEN
      RAISE EXCEPTION 'Invalid role value % detected in reward_templates.allowed_roles', _role;
    END IF;
  END LOOP;
END $$;

ALTER TABLE reward_templates
  ALTER COLUMN allowed_roles DROP DEFAULT,
  ALTER COLUMN allowed_roles TYPE user_role_enum[] USING allowed_roles::user_role_enum[],
  ALTER COLUMN allowed_roles SET DEFAULT ARRAY[]::user_role_enum[];

DO $$
DECLARE
  _type TEXT;
BEGIN
  CREATE TEMP TABLE pg_temp.tmp_template_types(col TEXT);
  INSERT INTO pg_temp.tmp_template_types
  SELECT DISTINCT unnest(allowed_user_types)
  FROM reward_templates
  WHERE allowed_user_types IS NOT NULL;

  DELETE FROM pg_temp.tmp_template_types WHERE col IS NULL;

  FOR _type IN SELECT col FROM pg_temp.tmp_template_types LOOP
    IF _type NOT IN (SELECT unnest(enum_range(NULL::user_type_enum))) THEN
      RAISE EXCEPTION 'Invalid user type value % detected in reward_templates.allowed_user_types', _type;
    END IF;
  END LOOP;
END $$;

ALTER TABLE reward_templates
  ALTER COLUMN allowed_user_types DROP DEFAULT,
  ALTER COLUMN allowed_user_types TYPE user_type_enum[] USING allowed_user_types::user_type_enum[],
  ALTER COLUMN allowed_user_types SET DEFAULT ARRAY[]::user_type_enum[];

DO $$
DECLARE
  _hotel TEXT;
BEGIN
  CREATE TEMP TABLE pg_temp.tmp_template_hotels(col TEXT);
  INSERT INTO pg_temp.tmp_template_hotels
  SELECT DISTINCT unnest(allowed_hotel_ids)
  FROM reward_templates
  WHERE allowed_hotel_ids IS NOT NULL;

  DELETE FROM pg_temp.tmp_template_hotels WHERE col IS NULL;

  FOR _hotel IN SELECT col FROM pg_temp.tmp_template_hotels LOOP
    IF _hotel NOT IN (SELECT unnest(enum_range(NULL::hotel_id_enum))) THEN
      RAISE EXCEPTION 'Invalid hotel id value % detected in reward_templates.allowed_hotel_ids', _hotel;
    END IF;
  END LOOP;
END $$;

ALTER TABLE reward_templates
  ALTER COLUMN allowed_hotel_ids DROP DEFAULT,
  ALTER COLUMN allowed_hotel_ids TYPE hotel_id_enum[] USING allowed_hotel_ids::hotel_id_enum[],
  ALTER COLUMN allowed_hotel_ids SET DEFAULT ARRAY[]::hotel_id_enum[];
