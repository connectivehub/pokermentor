-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  initial_balance DECIMAL(10, 2) NOT NULL,
  final_balance DECIMAL(10, 2) NOT NULL,
  hands_played INTEGER NOT NULL DEFAULT 0,
  hands_won INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create hands table
CREATE TABLE IF NOT EXISTS hands (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  initial_stack DECIMAL(10, 2) NOT NULL,
  final_stack DECIMAL(10, 2) NOT NULL,
  profit DECIMAL(10, 2) NOT NULL,
  correct_decisions INTEGER NOT NULL DEFAULT 0,
  incorrect_decisions INTEGER NOT NULL DEFAULT 0,
  final_hand_rank VARCHAR(50),
  was_winner BOOLEAN NOT NULL DEFAULT FALSE,
  pot_size DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create actions table
CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  hand_id VARCHAR(255) NOT NULL REFERENCES hands(id),
  action_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2),
  player_id VARCHAR(255) NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create advice table
CREATE TABLE IF NOT EXISTS advice (
  id SERIAL PRIMARY KEY,
  hand_id VARCHAR(255) NOT NULL REFERENCES hands(id),
  advice_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  importance INTEGER NOT NULL,
  suggested_action VARCHAR(50),
  suggested_amount DECIMAL(10, 2),
  hand_strength DECIMAL(5, 2),
  win_probability DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create missed opportunities table
CREATE TABLE IF NOT EXISTS missed_opportunities (
  id SERIAL PRIMARY KEY,
  hand_id VARCHAR(255) NOT NULL REFERENCES hands(id),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create good plays table
CREATE TABLE IF NOT EXISTS good_plays (
  id SERIAL PRIMARY KEY,
  hand_id VARCHAR(255) NOT NULL REFERENCES hands(id),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hands_session_id ON hands(session_id);
CREATE INDEX IF NOT EXISTS idx_hands_user_id ON hands(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_hand_id ON actions(hand_id);
CREATE INDEX IF NOT EXISTS idx_advice_hand_id ON advice(hand_id);
CREATE INDEX IF NOT EXISTS idx_missed_opportunities_hand_id ON missed_opportunities(hand_id);
CREATE INDEX IF NOT EXISTS idx_good_plays_hand_id ON good_plays(hand_id); 