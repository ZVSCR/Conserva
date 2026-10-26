-- Execute em um banco existente antes de utilizar o login com sessões.
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS user_sessions_expire_idx ON user_sessions (expire);
