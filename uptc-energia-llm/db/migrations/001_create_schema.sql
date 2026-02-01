-- Migration 001: Create schema and enable pgvector extension
-- Idempotent: Safe to run multiple times

-- Create schema for LLM engine
CREATE SCHEMA IF NOT EXISTS uptc_llm;

-- Enable vector extension for embeddings (requires pgvector installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Set search path
SET search_path TO uptc_llm, public;

COMMENT ON SCHEMA uptc_llm IS 'Schema for LLM-based energy analysis and domotic simulation';
