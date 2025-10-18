CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  assigned_to uuid REFERENCES profiles ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo' NOT NULL,
  due_date timestamp with time zone,
  is_completed boolean DEFAULT FALSE NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Individual tasks are viewable by creator or assignee."
  ON tasks FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can create tasks."
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks or assigned tasks."
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete their own tasks."
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);