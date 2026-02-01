SELECT id,
       chunk_id,
       embedding,
       created_at
FROM uptc_llm.embeddings
WHERE id = ANY(:ids);"uptc_llm"."alerts"