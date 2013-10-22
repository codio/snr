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
```

