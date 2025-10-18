-- Enable RLS for storage bucket 'tasks-images'
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tasks-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tasks-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tasks-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tasks-images' AND auth.uid() IS NOT NULL);