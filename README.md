# Search


Simple wrapper around the silver searcher.


## Installation

Install the silver searcher as instructed [here].

```bash
$ npm install git://github.com/Dignifiedquire/search.git
```

## Usage

Search for all `console` statements in all JavaScript files in the folders `src/core` and
`src/ext`.

```bash
$ search console src/core/**/*.js src/ext/**/*.js
```
Sample Output

```bash
src/core/storage.js
100-            return JSON.parse(text);
101-        } catch (e) {
102:            console.log('Objectify Error', e);
103-        }
104-    };
--
117-            return JSON.stringify(obj);
118-        } catch (e) {
119:            console.log('Stringify Erorr', e);
120-        }
121-    };
```


[here]: https://github.com/ggreer/the_silver_searcher
