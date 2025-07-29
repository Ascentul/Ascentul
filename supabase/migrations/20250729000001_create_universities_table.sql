-- Create universities table for admin portal
CREATE TABLE public.universities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  license_plan VARCHAR(50) NOT NULL CHECK (license_plan IN ('Starter', 'Basic', 'Pro', 'Enterprise')),
  license_seats INTEGER NOT NULL DEFAULT 50,
  license_used INTEGER NOT NULL DEFAULT 0,
  license_start DATE NOT NULL,
  license_end DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'trial', 'suspended')),
  admin_email VARCHAR(255),
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX idx_universities_slug ON public.universities(slug);

-- Create index on status for filtering
CREATE INDEX idx_universities_status ON public.universities(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to access all universities
CREATE POLICY "Super admins can access all universities" ON public.universities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin')
    )
  );

-- Create policy for university admins to access their own university
CREATE POLICY "University admins can access their university" ON public.universities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'university_admin'
      AND users.university_id = universities.id
    )
  );

-- Add university_id column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN university_id INTEGER REFERENCES public.universities(id);
    CREATE INDEX idx_users_university_id ON public.users(university_id);
  END IF;
END $$;

-- Update the license_used count trigger
CREATE OR REPLACE FUNCTION update_university_license_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- User added to university
    IF NEW.university_id IS NOT NULL THEN
      UPDATE public.universities 
      SET license_used = license_used + 1,
          updated_at = NOW()
      WHERE id = NEW.university_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- User moved between universities or university assignment changed
    IF OLD.university_id IS DISTINCT FROM NEW.university_id THEN
      -- Decrease count for old university
      IF OLD.university_id IS NOT NULL THEN
        UPDATE public.universities 
        SET license_used = license_used - 1,
            updated_at = NOW()
        WHERE id = OLD.university_id;
      END IF;
      -- Increase count for new university
      IF NEW.university_id IS NOT NULL THEN
        UPDATE public.universities 
        SET license_used = license_used + 1,
            updated_at = NOW()
        WHERE id = NEW.university_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- User removed from university
    IF OLD.university_id IS NOT NULL THEN
      UPDATE public.universities 
      SET license_used = license_used - 1,
          updated_at = NOW()
      WHERE id = OLD.university_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update license usage
DROP TRIGGER IF EXISTS trigger_update_university_license_usage ON public.users;
CREATE TRIGGER trigger_update_university_license_usage
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_university_license_usage();

-- Insert some sample universities for testing
INSERT INTO public.universities (name, slug, license_plan, license_seats, license_start, license_end, status, admin_email) VALUES
  ('Harvard University', 'harvard-university', 'Enterprise', 500, '2024-01-01', '2024-12-31', 'active', 'admin@harvard.edu'),
  ('Stanford University', 'stanford-university', 'Pro', 300, '2024-01-01', '2024-12-31', 'active', 'admin@stanford.edu'),
  ('MIT', 'mit', 'Enterprise', 400, '2024-01-01', '2024-12-31', 'active', 'admin@mit.edu'),
  ('UC Berkeley', 'uc-berkeley', 'Basic', 200, '2024-01-01', '2024-12-31', 'active', 'admin@berkeley.edu');
