-- AI 読み取り（/extract）の回数制限用。1日より古い行は消す。
CREATE TABLE extract_requests (
  ip TEXT NOT NULL,
  requested_at INTEGER NOT NULL
);
CREATE INDEX extract_requests_ip ON extract_requests (ip, requested_at);
