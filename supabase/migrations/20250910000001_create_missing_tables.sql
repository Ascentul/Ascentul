-- Create missing tables for API functionality
-- Migration: 20250910000001_create_missing_tables.sql

-- Projects table for portfolio functionality
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    role TEXT,
    start_date DATE,
    end_date DATE,
    company TEXT,
    url TEXT,
    description TEXT,
    type TEXT DEFAULT 'personal',
    image_url TEXT,
    technologies TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cover letters table
CREATE TABLE IF NOT EXISTS cover_letters (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company_name TEXT,
    template TEXT DEFAULT 'standard',
    content TEXT,
    closing TEXT DEFAULT 'Sincerely,',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'medium',
    department TEXT DEFAULT 'support',
    contact_person TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    ticket_type TEXT DEFAULT 'regular',
    assigned_to UUID REFERENCES auth.users(id),
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Career paths table for generated career paths
CREATE TABLE IF NOT EXISTS career_paths (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    current_level TEXT,
    estimated_timeframe TEXT,
    steps JSONB,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job searches table to track user job searches
CREATE TABLE IF NOT EXISTS job_searches (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keywords TEXT,
    location TEXT,
    remote_only BOOLEAN DEFAULT FALSE,
    results_count INTEGER DEFAULT 0,
    search_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_created_at ON cover_letters(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_career_paths_user_id ON career_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_career_paths_status ON career_paths(status);

CREATE INDEX IF NOT EXISTS idx_job_searches_user_id ON job_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_job_searches_created_at ON job_searches(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for cover letters
CREATE POLICY "Users can view their own cover letters" ON cover_letters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cover letters" ON cover_letters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cover letters" ON cover_letters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cover letters" ON cover_letters
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for support tickets
CREATE POLICY "Users can view their own support tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policy for support tickets
CREATE POLICY "Admins can view all support tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type IN ('admin', 'super_admin', 'staff')
        )
    );

-- Create RLS policies for career paths
CREATE POLICY "Users can view their own career paths" ON career_paths
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career paths" ON career_paths
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career paths" ON career_paths
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career paths" ON career_paths
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for job searches
CREATE POLICY "Users can view their own job searches" ON job_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job searches" ON job_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cover_letters_updated_at 
    BEFORE UPDATE ON cover_letters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_paths_updated_at 
    BEFORE UPDATE ON career_paths 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
