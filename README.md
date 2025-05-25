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



## Caveats and technical information

I built this library, but I don't (and won't) write javascript, so I gave in completely to what Anrej Karpathy has called [vibe coding](https://x.com/karpathy/status/1886192184808149383?lang=en). The javascript, the markdown documentation (including the quoted summary at the top of this page), and the HTML apps were all written by gemini-2.5-pro. I've made sure that the library passes a handful of sanity tests, but I have not looked at the code at all. When I ran into errors, I let gemini fix them. Use the code as you like, but be aware that I have no idea what it does or how it works.

### How I build it

If you're curious about how I built the library, the file `chat.txt` has a complete transcript of the conversation I had with gemini-2.5-pro. The `stages` directory has the functioning intermediate versions of the library. The numbers in the filenames correspond to the sequence of the library in the conversation, culminating in `hmt-lib-15.js`, which is the final version of the library, and identical to `hmt-lib.js` in this repository. 


## License

This repository is licensed under the [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.en.html) license. You can use the code in this repository for any purpose, but you must include a copy of the GPL-3.0 license in any distribution of the code or derivative works. See the [LICENSE](./LICENSE) file for more details.