-- =====================================================
-- KANBAN TASK PLANNER
-- Migration: Add tasks table for Kanban board
-- Created: 2025-12-15
-- =====================================================

-- =====================================================
-- 1. CREATE TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text,
    "status" text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    "priority" text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    "due_date" timestamp with time zone,
    "position" integer NOT NULL DEFAULT 0,
    "color" text DEFAULT 'default' CHECK (color IN ('default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink')),
    "created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    CONSTRAINT "tasks_title_check" CHECK (length(title) > 0 AND length(title) <= 200)
);

COMMENT ON TABLE "public"."tasks" IS 'Kanban tasks for personal task management';
COMMENT ON COLUMN "public"."tasks"."status" IS 'Kanban column: todo, in_progress, done';
COMMENT ON COLUMN "public"."tasks"."position" IS 'Order within the column (lower = higher)';
COMMENT ON COLUMN "public"."tasks"."priority" IS 'Task priority: low, medium, high';
COMMENT ON COLUMN "public"."tasks"."color" IS 'Color label for visual organization';

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX "idx_tasks_user_id" ON "public"."tasks" ("user_id");
CREATE INDEX "idx_tasks_status" ON "public"."tasks" ("status");
CREATE INDEX "idx_tasks_user_status" ON "public"."tasks" ("user_id", "status");
CREATE INDEX "idx_tasks_position" ON "public"."tasks" ("user_id", "status", "position");
CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" ("due_date") WHERE due_date IS NOT NULL;

-- =====================================================
-- 3. CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_tasks_updated_at"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER "trigger_tasks_updated_at"
    BEFORE UPDATE ON "public"."tasks"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_tasks_updated_at"();

-- Function to auto-set position for new tasks
CREATE OR REPLACE FUNCTION "public"."set_task_position"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Set position to max + 1 for the column
    SELECT COALESCE(MAX(position), -1) + 1 INTO NEW.position
    FROM tasks
    WHERE user_id = NEW.user_id AND status = NEW.status;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auto position
CREATE TRIGGER "trigger_set_task_position"
    BEFORE INSERT ON "public"."tasks"
    FOR EACH ROW
    WHEN (NEW.position = 0)
    EXECUTE FUNCTION "public"."set_task_position"();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

-- Users can only view their own tasks
CREATE POLICY "Users can view their own tasks"
    ON "public"."tasks"
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own tasks
CREATE POLICY "Users can create their own tasks"
    ON "public"."tasks"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update their own tasks"
    ON "public"."tasks"
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete their own tasks"
    ON "public"."tasks"
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";

-- =====================================================
-- 6. TASK LIMITS TABLE (for premium tracking)
-- =====================================================

-- Track task counts for premium limits
CREATE TABLE IF NOT EXISTS "public"."task_usage" (
    "id" serial PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE UNIQUE,
    "task_count" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT timezone('utc', now())
);

-- Function to update task count
CREATE OR REPLACE FUNCTION "public"."update_task_count"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO task_usage (user_id, task_count)
        VALUES (NEW.user_id, 1)
        ON CONFLICT (user_id)
        DO UPDATE SET task_count = task_usage.task_count + 1, updated_at = now();
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE task_usage
        SET task_count = GREATEST(task_count - 1, 0), updated_at = now()
        WHERE user_id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$;

-- Create triggers for task count
CREATE TRIGGER "trigger_task_count_insert"
    AFTER INSERT ON "public"."tasks"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_task_count"();

CREATE TRIGGER "trigger_task_count_delete"
    AFTER DELETE ON "public"."tasks"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_task_count"();

-- RLS for task_usage
ALTER TABLE "public"."task_usage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
    ON "public"."task_usage"
    FOR SELECT
    USING (auth.uid() = user_id);

GRANT SELECT ON TABLE "public"."task_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."task_usage" TO "service_role";
GRANT USAGE, SELECT ON SEQUENCE "public"."task_usage_id_seq" TO "service_role";

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

DO $$
DECLARE
    tables_count INTEGER;
    indexes_count INTEGER;
    policies_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('tasks', 'task_usage');
    
    -- Count indexes
    SELECT COUNT(*) INTO indexes_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks';
    
    -- Count policies
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE tablename IN ('tasks', 'task_usage');
    
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'KANBAN TASKS MIGRATION COMPLETE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Tables created: %/2', tables_count;
    RAISE NOTICE 'Indexes created: %', indexes_count;
    RAISE NOTICE 'RLS policies created: %', policies_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Columns:';
    RAISE NOTICE '  - todo: Tasks to be done';
    RAISE NOTICE '  - in_progress: Tasks being worked on';
    RAISE NOTICE '  - done: Completed tasks';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  - Auto-positioning for new tasks';
    RAISE NOTICE '  - Task count tracking for premium limits';
    RAISE NOTICE '  - Priority levels (low, medium, high)';
    RAISE NOTICE '  - Color labels';
    RAISE NOTICE '  - Due dates';
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

