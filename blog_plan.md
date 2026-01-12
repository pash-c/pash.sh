# Plan: Add Hakyll Blog to website/

## Goal
Set up a full-featured Hakyll blog in `website/` with all features from `mazzo.li/site.hs`:
- KaTeX math rendering
- Literate Haskell support (.lhs files)
- RSS/Atom feeds
- Tags system
- Markdown in post titles
- Draft/published system
- Section anchor links
- Sidenotes (footnotes as margin notes)

## Haskell Tooling
Already installed via ghcup:
- GHC 9.2.8
- Cabal 3.6.2.0

## Files to Create

### 1. `website/blog.cabal`
Haskell project file with dependencies:
- hakyll, pandoc, pandoc-types, text, process, blaze-html, blaze-markup

### 2. `website/Setup.hs`
Standard Cabal setup file (2 lines).

### 3. `website/site.hs`
Main Hakyll configuration adapted from mazzo.li:
- Compiles `posts/*.md` and `posts/*.lhs` to `_site/writing/`
- Generates `writing.html` (archive/index of all posts)
- Generates `rss.xml` and `atom.xml` feeds
- Copies existing static files through unchanged

### 4. `website/KaTeXify.hs`
Module for server-side KaTeX math rendering (copied from mazzo.li).

### 5. `website/templates/` (4 files)
- `default.html` - Base HTML wrapper (customized for your site)
- `post.html` - Individual post layout
- `archive.html` - Blog index page
- `post-item.html` - Post listing in archive

### 6. `website/posts/` directory
With a sample post: `2024-01-11-hello-world.md`

### 7. Update `website/package.json`
Add `katex` CLI dependency for math rendering.

## Build/Run Commands
```bash
cd website
npm install           # Install katex CLI
cabal build           # Build the site generator
cabal run site build  # Generate the blog
cabal run site watch  # Dev server with live reload
```

## Output Structure
```
website/_site/
├── writing/
│   └── hello-world.html
├── writing.html          (blog index)
├── rss.xml
├── atom.xml
├── index.html            (your existing file)
├── css/, js/, images/    (existing assets)
└── ...
```

## Verification
1. Run `cabal build` - should compile without errors
2. Run `cabal run site build` - should generate `_site/` directory
3. Run `cabal run site watch` - should start dev server on localhost:8000
4. Visit `http://localhost:8000/writing.html` - should show blog index
5. Visit `http://localhost:8000/writing/hello-world.html` - should render sample post
