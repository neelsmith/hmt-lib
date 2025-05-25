# A vibe-coded javascript library for working with published releases of the Homer Multitext project

> *`hmtlib.js` is a JavaScript library designed to work with publications from the Homer Multitext project (HMT). It leverages `cex-lib.js` for parsing and manipulating HMT data in CiteEXchange (CEX) format, and `urn-lib.js` for working with CTS and CITE2 URNs. This library provides functions to load HMT data, extract specific datasets like DSE records, scholia, codex information, and retrieve metadata labels.*



## Motivation


The Homer Multitext project (HMT) publishes releases of its archival data in a single plain-text file. The relations among the different kinds of different are complex. 
The javascript library in [hmt-lib.js](./hmt-lib.js) is designed to facilitate the manipulation and analysis of published releases of the HMT archive. The library is fully documented in [this markdown file](./apis.md).





## Contents of this repository

In addition to the library itself (`hmt-lib.js`) and the documentation (`apis.md`), this repository includes the following web illustrations of the library's functionality:

- `1.hmt-load.html`: illustrates how to load the current release of the Homer Multitext project into a parsed object.
- `4.hmt-texts.html`: illustrates how to load either a normalized or diplomatic corpus of the texts in the HMT archive. 
- `5.hmt-dse.html`: illustrates how to load the DSE records from the HMT archive.
- `6.hmt-dse.html`: illustrates how to load the DSE records from the HMT archive.
- `7.hmt-scholia.html`: illustrates how to load and query an index linking *Iliad* passages and *scholia*.
- `8.hmt-codex.html`: illustrates how load a list of `CodexPage` objects for a given manuscript.
- `9.hmt-catalogs.html`: illustrates how to find human-readable labels for objects cited by CITE2 URN or CTS URN.
- `14.hmt-codex.html`: illustrates how to use the `codexlist` function to find URNs of all documented codices.
- `15.hmt-codex-menu.html`: illustrates how to add a menu of HMT manuscripts to a web page using the `codexmenu` function.




## Applications

HTML files illustrating usage of the library:

- `1.hmt-load.html`: illustrates how to load the current release of the Homer Multitext project into a parsed object.



