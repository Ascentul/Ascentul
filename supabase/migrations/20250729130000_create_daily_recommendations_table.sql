-- Create daily_recommendations table for storing AI-generated career recommendations
CREATE TABLE IF NOT EXISTS daily_recommendations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'ai_generated',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 1,
  related_entity_id BIGINT,
  related_entity_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_recommendations_user_id ON daily_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_recommendations_created_at ON daily_recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_recommendations_completed ON daily_recommendations(completed);
CREATE INDEX IF NOT EXISTS idx_daily_recommendations_type ON daily_recommendations(type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_recommendations_updated_at 
    BEFORE UPDATE ON daily_recommendations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE daily_recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own recommendations" ON daily_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations" ON daily_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" ON daily_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations" ON daily_recommendations
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON daily_recommendations TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE daily_recommendations_id_seq TO authenticated;
