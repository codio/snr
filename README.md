# Search and Replace [![Build Status](https://travis-ci.org/Dignifiedquire/search.png)](https://travis-ci.org/Dignifiedquire/search)

Simple search and replace through commandline tools (`ack` and `sed`).


## Installation

```bash
$ npm install -g Dignifiedquire/search
```

## Usage

Search for all `console` statements in all JavaScript files in the folders `src/core` and
`src/ext` and stop the search after `100` items.

```bash
$ search --max-result-count 100 --literal console "src/core/**/*.js" "src/ext/**/*.js"
```

Replace all these statements with `hello`:
```bash
$ search --max-result-count 100 --literal --replace hello console "src/core/**/*.js" "src/ext/**/*.js"
```


## Options

```bash
usage: search [OPTION]... PATTERN [FILES OR DIRECTORIES OR GLOBS]
options:
    -i, --ignore-case       Ignore case distinctions in PATTERN.
    -Q, --literal           Quote all metacharacters; PATTERN is literal.
    --max-result-count=NUM  Stop after NUM results.
    --replace=REPlACE       Replace all matches with REPLACE.
    -h, --help              Print this help and exit.
    -C NUM, --context=NUM   Print NUM lines of output context.
    -w, --word-regexp       Force PATTERN to match only whole words.
    --color-lineno=COLOR    Set the color for filenames, matches, and line
                            numbers.
```



## Globs


### Basic Rules

> From `man bash`

Any character that appears in a pattern, other than the special pattern characters described below,
matches itself. The NUL character may not occur in a pattern. A backslash escapes the following
character; the escaping backslash is discarded when matching. The special pattern characters must
be quoted if they are to be matched literally.

The special pattern characters have the following meanings:

* `*` Matches any string, including the null string. When the globstar shell option is enabled,
  and `*` is used in a filename expansion context, two adjacent `*`s used as a single pattern will
  match all files and zero or more directories and subdirectories. If followed by a `/`, two adjacent
  `*`s will match only directories and subdirectories.

* `?` Matches any single character.

* `[…]` Matches any one of the enclosed characters. A pair of characters separated by a hyphen denotes a
  range expression; any character that sorts between those two characters, inclusive, using the current locale's
  collating sequence and character set, is matched. If the first character following the `[` is a `!` or a `^`
  then any character not enclosed is matched. A `-` may be matched by including it as the first or last character
  in the set. A `]` may be matched by including it as the first character in the set.

  A character class matches any character belonging to that class. The word character class matches letters, digits,
  and the character `_`.

  Within `[` and `]`, an equivalence class can be specified using the syntax `[=c=]`, which matches all characters with
  the same collation weight (as defined by the current locale) as the character c.

  Within `[` and `]`, the syntax [.symbol.] matches the collating symbol symbol.

* `?(pattern-list)` Matches zero or one occurrence of the given patterns.

* `*(pattern-list)` Matches zero or more occurrences of the given patterns.

* `+(pattern-list)` Matches one or more occurrences of the given patterns.

* `@(pattern-list)` Matches one of the given patterns.

* `!(pattern-list)` Matches anything except one of the given patterns.

### Comparisons to other glob implementations

> From the readme of node-glob.


While strict compliance with the existing standards is a worthwhile
goal, some discrepancies exist between node-glob and other
implementations, and are intentional.

If the pattern starts with a `!` character, then it is negated. Multiple `!`
characters at the start of a pattern will negate the pattern multiple
times.

If a pattern starts with `#`, then it is treated as a comment, and
will not match anything.  Use `\#` to match a literal `#` at the
start of a line.

The double-star character `**` is supported. This is supported in the manner of
bsdglob and bash 4.1, where `**` only has special significance if it is the only
thing in a path part.  That is, `a/**/b` will match `a/x/y/b`, but
`a/**b` will not.

