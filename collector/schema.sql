-- One row per word people wrote that Describble did not understand. Nothing else is stored.
CREATE TABLE IF NOT EXISTS words (
  lang TEXT NOT NULL CHECK (lang IN ('it', 'en')),
  word TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lang, word)
);
