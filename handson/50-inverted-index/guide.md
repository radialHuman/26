# Inverted Index

## What it is
The data structure that powers full-text search. Instead of storing "document → words," an inverted index stores "word → list of documents containing that word." To answer "find all documents containing 'python'," you look up 'python' in the index — one lookup, no scanning.

## Why it matters
Every search system uses one: Google, Twitter search, Elasticsearch, Postgres full-text search. Interviewers ask "how would you implement search?" in any content-heavy system design (Twitter, Stack Overflow, document search). Understanding the data structure is fundamental.

## What to know before starting
- What a hash map is and O(1) lookup
- What tokenization is: splitting text into terms ("The Quick Fox" → ["the", "quick", "fox"])
- What normalization is: lowercasing, removing punctuation, stemming ("running" → "run")

## How to approach it
Build the index: for each document, tokenize its text, normalize each token, and for each token add the document ID to the token's posting list.

```
index = {
    "python": [doc1, doc3, doc7],
    "cache": [doc1, doc2, doc5],
}
```

Query "python AND cache": intersect the two posting lists → [doc1].
Query "python OR cache": union the two posting lists.

For ranking: TF-IDF. Term Frequency (how often the word appears in this document) × Inverse Document Frequency (how rare the word is across all documents). Words that appear in few documents are more informative.

## What to build (minimal working version)
- Tokenizer: lowercase, remove punctuation, split on whitespace
- `InvertedIndex` class: `add_document(doc_id, text)` builds the index
- `search(query)` → list of doc_ids: tokenize query, look up each token, intersect posting lists
- Test: 10 documents, search for a word that appears in 3 of them
- Add TF-IDF scoring: rank results by relevance, not just presence
- Test: "Python is great" — "Python" appears in 3 docs, "is" in all 10. Confirm "Python" has higher IDF.

## Knobs to turn
- Add phrase search: "machine learning" must appear as consecutive words (positional index needed)
- Add stemming: "running" and "run" match the same token. Use `nltk` Porter stemmer.
- Index 10,000 documents. Measure index build time and search time vs. naive linear scan.
- Add document deletion: remove a doc from all posting lists. How expensive is this?

## How it connects to other components
- `26-bloom-filter` — databases use bloom filters to quickly skip files that don't contain a search term
- `18-pagination` — search results are paginated; cursor-based pagination over ranked results
- `08-consistent-hash-ring` — distributed search shards the index by term or by document

## Real tool / production system
Elasticsearch: distributed inverted index with JSON documents and a rich query DSL. PostgreSQL `tsvector`/`tsquery` for basic full-text search. Whoosh (pure Python search library) for local experiments. What you're missing: distributed index sharding, real-time indexing (documents searchable immediately after write), fuzzy matching (typo tolerance), and synonym handling.
