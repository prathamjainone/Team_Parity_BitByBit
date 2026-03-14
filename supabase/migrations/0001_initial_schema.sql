-- Create Enum types
CREATE TYPE project_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED');
CREATE TYPE milestone_status AS ENUM ('PENDING', 'SUBMITTED', 'COMPLETED_FULL', 'COMPLETED_PARTIAL', 'UNMET');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Or references auth.users for real auth
    role VARCHAR(50) NOT NULL, -- 'EMPLOYER' or 'FREELANCER'
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    wallet_balance DECIMAL DEFAULT 0.0,
    pfi_score DECIMAL DEFAULT 500.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    total_budget DECIMAL NOT NULL,
    escrow_balance DECIMAL DEFAULT 0.0,
    status project_status DEFAULT 'OPEN',
    employer_id UUID REFERENCES users(id),
    freelancer_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones Table
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    deliverables JSONB NOT NULL, -- Storing text array as JSONB
    payout_amount DECIMAL NOT NULL,
    estimated_days INTEGER NOT NULL DEFAULT 3,
    status milestone_status DEFAULT 'PENDING',
    submission_data TEXT, -- URL or PR link
    ai_evaluation JSONB, -- AI reasoning state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction Ledger
CREATE TABLE transaction_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    amount DECIMAL NOT NULL,
    type VARCHAR(50) NOT NULL, -- DEPOSIT_TO_ESCROW, MICRO_PAYOUT, SUCCESS_FEE, REFUND
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS & Policies (simplified for hackathon)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_ledger ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for hackathon rapid prototyping purposes
-- In production, these would be strictly scoped to auth.uid()
CREATE POLICY "Enable all for users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for projects" ON projects FOR ALL USING (true);
CREATE POLICY "Enable all for milestones" ON milestones FOR ALL USING (true);
CREATE POLICY "Enable all for transaction_ledger" ON transaction_ledger FOR ALL USING (true);
