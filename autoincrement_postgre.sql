-- Ensure sequences are attached (create if missing) and set DEFAULT nextval
DO $$
BEGIN
  -- account(id)
  IF pg_get_serial_sequence('budget_database_schema.account','id') IS NULL THEN
    CREATE SEQUENCE budget_database_schema.account_id_seq OWNED BY budget_database_schema.account.id;
    ALTER TABLE budget_database_schema.account
      ALTER COLUMN id SET DEFAULT nextval('budget_database_schema.account_id_seq');
  END IF;

  -- approval_workflow(id)
  IF pg_get_serial_sequence('budget_database_schema.approval_workflow','id') IS NULL THEN
    CREATE SEQUENCE budget_database_schema.approval_workflow_id_seq OWNED BY budget_database_schema.approval_workflow.id;
    ALTER TABLE budget_database_schema.approval_workflow
      ALTER COLUMN id SET DEFAULT nextval('budget_database_schema.approval_workflow_id_seq');
  END IF;

  -- approval_progress(id)
  IF pg_get_serial_sequence('budget_database_schema.approval_progress','id') IS NULL THEN
    CREATE SEQUENCE budget_database_schema.approval_progress_id_seq OWNED BY budget_database_schema.approval_progress.id;
    ALTER TABLE budget_database_schema.approval_progress
      ALTER COLUMN id SET DEFAULT nextval('budget_database_schema.approval_progress_id_seq');
  END IF;

  -- history(history_id)
  IF pg_get_serial_sequence('budget_database_schema.history','history_id') IS NULL THEN
    CREATE SEQUENCE budget_database_schema.history_history_id_seq OWNED BY budget_database_schema.history.history_id;
    ALTER TABLE budget_database_schema.history
      ALTER COLUMN history_id SET DEFAULT nextval('budget_database_schema.history_history_id_seq');
  END IF;

  -- attachments(id)
  IF pg_get_serial_sequence('budget_database_schema.attachments','id') IS NULL THEN
    CREATE SEQUENCE budget_database_schema.attachments_id_seq OWNED BY budget_database_schema.attachments.id;
    ALTER TABLE budget_database_schema.attachments
      ALTER COLUMN id SET DEFAULT nextval('budget_database_schema.attachments_id_seq');
  END IF;

  -- budget_amendments(amendment_id)
  IF pg_get_serial_sequence('budget_database_schema.budget_amendments','amendment_id') IS NULL THEN
    CREATE SEQUENCE budget_database_schema.budget_amendments_amendment_id_seq OWNED BY budget_database_schema.budget_amendments.amendment_id;
    ALTER TABLE budget_database_schema.budget_amendments
      ALTER COLUMN amendment_id SET DEFAULT nextval('budget_database_schema.budget_amendments_amendment_id_seq');
  END IF;

  -- amendment_attachments(id)
  IF pg_get_serial_sequence('budget_database_schema.amendment_attachments','id') IS NULL THEN
    CREATE SEQUENCE budget_database_schema.amendment_attachments_id_seq OWNED BY budget_database_schema.amendment_attachments.id;
    ALTER TABLE budget_database_schema.amendment_attachments
      ALTER COLUMN id SET DEFAULT nextval('budget_database_schema.amendment_attachments_id_seq');
  END IF;

  -- dept_lookup(id)
  IF pg_get_serial_sequence('budget_database_schema.dept_lookup','id') IS NULL THEN
    CREATE SEQUENCE budget_database_schema.dept_lookup_id_seq OWNED BY budget_database_schema.dept_lookup.id;
    ALTER TABLE budget_database_schema.dept_lookup
      ALTER COLUMN id SET DEFAULT nextval('budget_database_schema.dept_lookup_id_seq');
  END IF;
END $$;

-- Align sequences: use 1 when empty (is_called=false), else MAX(id) (is_called=true)
SELECT setval(
  pg_get_serial_sequence('budget_database_schema.account','id'),
  COALESCE((SELECT MAX(id) FROM budget_database_schema.account), 1),
  (SELECT COUNT(*) > 0 FROM budget_database_schema.account)
);

SELECT setval(
  pg_get_serial_sequence('budget_database_schema.approval_workflow','id'),
  COALESCE((SELECT MAX(id) FROM budget_database_schema.approval_workflow), 1),
  (SELECT COUNT(*) > 0 FROM budget_database_schema.approval_workflow)
);

SELECT setval(
  pg_get_serial_sequence('budget_database_schema.approval_progress','id'),
  COALESCE((SELECT MAX(id) FROM budget_database_schema.approval_progress), 1),
  (SELECT COUNT(*) > 0 FROM budget_database_schema.approval_progress)
);

SELECT setval(
  pg_get_serial_sequence('budget_database_schema.history','history_id'),
  COALESCE((SELECT MAX(history_id) FROM budget_database_schema.history), 1),
  (SELECT COUNT(*) > 0 FROM budget_database_schema.history)
);

SELECT setval(
  pg_get_serial_sequence('budget_database_schema.attachments','id'),
  COALESCE((SELECT MAX(id) FROM budget_database_schema.attachments), 1),
  (SELECT COUNT(*) > 0 FROM budget_database_schema.attachments)
);

SELECT setval(
  pg_get_serial_sequence('budget_database_schema.budget_amendments','amendment_id'),
  COALESCE((SELECT MAX(amendment_id) FROM budget_database_schema.budget_amendments), 1),
  (SELECT COUNT(*) > 0 FROM budget_database_schema.budget_amendments)
);

SELECT setval(
  pg_get_serial_sequence('budget_database_schema.amendment_attachments','id'),
  COALESCE((SELECT MAX(id) FROM budget_database_schema.amendment_attachments), 1),
  (SELECT COUNT(*) > 0 FROM budget_database_schema.amendment_attachments)
);

SELECT setval(
  pg_get_serial_sequence('budget_database_schema.dept_lookup','id'),
  COALESCE((SELECT MAX(id) FROM budget_database_schema.dept_lookup), 1),
  (SELECT COUNT(*) > 0 FROM budget_database_schema.dept_lookup)
);