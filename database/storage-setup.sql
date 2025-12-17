-- Supabase Storage Setup for QR Codes
-- Run this in your Supabase SQL Editor after creating the qr_codes table

-- Create storage bucket for QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for qr-codes bucket
-- Allow public read access
CREATE POLICY "Public Access for QR Codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'qr-codes');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update QR codes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qr-codes');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete QR codes"
ON storage.objects FOR DELETE
USING (bucket_id = 'qr-codes');

