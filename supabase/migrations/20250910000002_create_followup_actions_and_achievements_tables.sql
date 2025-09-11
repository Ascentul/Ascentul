-- Create followup_actions table
CREATE TABLE IF NOT EXISTS followup_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'follow_up',
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR(100) DEFAULT 'general',
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table for tracking user achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 100,
    UNIQUE(user_id, achievement_id)
);

-- Add RLS policies for followup_actions
ALTER TABLE followup_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own followup actions" ON followup_actions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own followup actions" ON followup_actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own followup actions" ON followup_actions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own followup actions" ON followup_actions
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for achievements (read-only for all authenticated users)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view achievements" ON achievements
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add RLS policies for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_followup_actions_user_id ON followup_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_followup_actions_contact_id ON followup_actions(contact_id);
CREATE INDEX IF NOT EXISTS idx_followup_actions_due_date ON followup_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Insert some default achievements
INSERT INTO achievements (name, description, icon, category, points) VALUES
('First Login', 'Welcome to Ascentul! You''ve successfully logged in for the first time.', '🎉', 'onboarding', 10),
('Profile Complete', 'You''ve completed your profile with all basic information.', '👤', 'profile', 25),
('First Application', 'You''ve submitted your first job application through Ascentul.', '📝', 'applications', 50),
('Network Builder', 'You''ve added your first contact to your network.', '🤝', 'networking', 30),
('Goal Setter', 'You''ve set your first career goal.', '🎯', 'goals', 20),
('Resume Ready', 'You''ve created and saved your first resume.', '📄', 'resume', 40),
('Interview Prep', 'You''ve completed your first interview preparation session.', '💼', 'interviews', 35),
('Cover Letter Pro', 'You''ve generated your first cover letter.', '✉️', 'cover_letters', 30),
('Weekly Warrior', 'You''ve been active on Ascentul for 7 consecutive days.', '🔥', 'engagement', 75),
('Monthly Master', 'You''ve been active on Ascentul for 30 consecutive days.', '🏆', 'engagement', 200)
ON CONFLICT DO NOTHING;
