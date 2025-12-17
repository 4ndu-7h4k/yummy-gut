# QR Code Feature Setup

This guide explains how to set up the QR code feature for the POS system.

## Database Setup

### Step 1: Run the Schema Update

The QR code table is already included in `schema.sql`. If you've already run the schema, the `qr_codes` table should exist. If not, run this SQL in your Supabase SQL Editor:

```sql
-- QR codes table
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_path VARCHAR(500),
  public_url TEXT,
  qr_text TEXT,
  type VARCHAR(50) DEFAULT 'generated' CHECK (type IN ('generated', 'uploaded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX idx_qr_codes_created_at ON qr_codes(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations
CREATE POLICY "Allow all operations on qr_codes" ON qr_codes
  FOR ALL USING (true) WITH CHECK (true);
```

### Step 2: Set Up Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `qr-codes`
5. Check **Public bucket** (so QR codes can be accessed via URL)
6. Click **Create bucket**

Alternatively, run the SQL in `storage-setup.sql`:

```sql
-- Create storage bucket for QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for qr-codes bucket
CREATE POLICY "Public Access for QR Codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

CREATE POLICY "Authenticated users can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'qr-codes');

CREATE POLICY "Authenticated users can update QR codes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qr-codes');

CREATE POLICY "Authenticated users can delete QR codes"
ON storage.objects FOR DELETE
USING (bucket_id = 'qr-codes');
```

## Usage

### Generate QR Code from Text

1. Click the QR code icon (📱) in the POS header
2. Click **"Generate QR"**
3. Enter any text, URL, or data
4. Click **"Generate"**
5. The QR code will display for 5 seconds automatically
6. The QR code is automatically saved to Supabase storage

### Upload QR Code Image

1. Click the QR code icon (📱) in the POS header
2. Click **"Upload Image"**
3. Select an image file from your device
4. The QR code will display for 5 seconds automatically
5. The image is automatically uploaded to Supabase storage

## Features

- **5-Second Auto-Close**: QR codes automatically close after 5 seconds
- **Manual Close**: Users can close the modal anytime
- **Countdown Timer**: Shows remaining seconds before auto-close
- **Storage Integration**: QR codes are saved to Supabase storage
- **Database Tracking**: All QR codes are tracked in the `qr_codes` table

## Notes

- If Supabase storage is not configured, QR codes will still display but won't be saved
- Generated QR codes can encode any text, URLs, or data
- Uploaded images can be any image format (PNG, JPG, etc.)

