// hmt-lib.js
(function(window) {
    'use strict';

    if (typeof window.HMTLib === 'undefined') {
        window.HMTLib = {};
    }

    // --- CLASSES ---
    class DSERecord {
        constructor(passage, imageroi, surface) {
            this.passage = passage;
            this.imageroi = imageroi;
            this.surface = surface;
        }
    }

    class Scholion {
        constructor(scholionUrn, iliadUrn) {
            this.scholion = scholionUrn;
            this.iliad = iliadUrn;
        }
    }

    /**
     * Represents a page in a codex.
     */
    class CodexPage {
        /**
         * Creates an instance of CodexPage.
         * @param {number} sequence - The sequence number of the page.
         * @param {string} image - The CITE2 URN of the image for this page.
         * @param {string} urn - The CITE2 URN of this page object itself.
         * @param {string} rv - The recto/verso indicator (e.g., 'r', 'v').
         * @param {string} label - The human-readable label for the page.
         */
        constructor(sequence, image, urn, rv, label) {
            this.sequence = sequence; // numeric
            this.image = image;     // CITE2 URN
            this.urn = urn;         // CITE2 URN of the page
            this.rv = rv;           // string (e.g., 'r', 'v')
            this.label = label;     // string
        }
    }

    // --- CORE HMT FUNCTIONS ---
    function hmtcurrent() {
        const hmtCurrentCexUrl = "https://raw.githubusercontent.com/homermultitext/hmt-archive/refs/heads/master/releases-cex/hmt-current.cex";
        if (typeof CEXParser === 'undefined') {
            console.error("CEXParser not defined.");
            return Promise.reject(new Error("CEXParser not defined."));
        }
        const parser = new CEXParser();
        return parser.loadFromUrl(hmtCurrentCexUrl);
    }

    // ... (hmtnormalized, hmtdiplomatic, hmtdse, recordsforpage, recordforpassage, imageforpage, hmtscholia, passageforscholion, scholiaforpassage functions remain unchanged) ...
    function hmtnormalized(parserInstance) {
        if (typeof URNTools === 'undefined') { console.error("URNTools not defined."); return []; }
        if (!(parserInstance instanceof CEXParser)) { console.error("Invalid parserInstance."); return []; }
        const filteredRecords = [];
        const ctsDataBlockContents = parserInstance.getBlockContents('ctsdata');
        ctsDataBlockContents.forEach(blockContent => {
            const lines = blockContent.split('\n');
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine === '' || trimmedLine.startsWith('//')) return;
                const parts = trimmedLine.split('|');
                if (parts.length >= 1) {
                    const urnString = parts[0];
                    const workComponent = URNTools.workcomponent(urnString);
                    if (workComponent && workComponent.endsWith('.normalized')) {
                        filteredRecords.push(trimmedLine);
                    }
                }
            });
        });
        return filteredRecords;
    }

    function hmtdiplomatic(parserInstance) {
        if (typeof URNTools === 'undefined') { console.error("URNTools not defined."); return []; }
        if (!(parserInstance instanceof CEXParser)) { console.error("Invalid parserInstance."); return []; }
        const filteredRecords = [];
        const ctsDataBlockContents = parserInstance.getBlockContents('ctsdata');
        ctsDataBlockContents.forEach(blockContent => {
            const lines = blockContent.split('\n');
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine === '' || trimmedLine.startsWith('//')) return;
                const parts = trimmedLine.split('|');
                if (parts.length >= 1) {
                    const urnString = parts[0];
                    const workComponent = URNTools.workcomponent(urnString);
                    if (workComponent && workComponent.endsWith('.diplomatic')) {
                        filteredRecords.push(trimmedLine);
                    }
                }
            });
        });
        return filteredRecords;
    }
    
    function hmtdse(parserInstance) {
        const dseRecords = [];
        const targetRelationSetUrn = "urn:cite2:hmt:hmtdse.v1:all";
        const expectedHeader = "passage|imageroi|surface";
        if (!(parserInstance instanceof CEXParser)) { console.error("Invalid parserInstance to hmtdse."); return []; }
        const citeRelationSetBlockContents = parserInstance.getBlockContents("citerelationset");
        for (const blockContent of citeRelationSetBlockContents) {
            const lines = blockContent.split('\n');
            const processedLines = [];
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine !== '' && !trimmedLine.startsWith('//')) processedLines.push(trimmedLine);
            }
            if (processedLines.length < 3) continue;
            let currentBlockUrn = processedLines[0].startsWith("urn|") ? processedLines[0].substring("urn|".length) : null;
            if (!currentBlockUrn) continue;
            if (currentBlockUrn === targetRelationSetUrn) {
                const headerLine = processedLines[2];
                if (headerLine !== expectedHeader) { console.warn(`DSE Header mismatch in ${currentBlockUrn}`); continue; }
                for (let i = 3; i < processedLines.length; i++) {
                    const columns = processedLines[i].split('|');
                    if (columns.length === 3) dseRecords.push(new HMTLib.DSERecord(columns[0], columns[1], columns[2]));
                    else console.warn(`DSE wrong column count in ${currentBlockUrn}, row: "${processedLines[i]}"`);
                }
            }
        }
        return dseRecords;
    }

    function recordsforpage(pageUrn, dseRecordsArray) {
        if (!pageUrn || !Array.isArray(dseRecordsArray)) return [];
        return dseRecordsArray.filter(r => r instanceof HMTLib.DSERecord && r.surface === pageUrn);
    }

    function recordforpassage(passageUrn, dseRecordsArray) {
        if (!passageUrn || !Array.isArray(dseRecordsArray)) return null;
        return dseRecordsArray.find(r => r instanceof HMTLib.DSERecord && r.passage === passageUrn) || null;
    }

    function imageforpage(pageUrn, dseRecordsArray) {
        if (!pageUrn || !Array.isArray(dseRecordsArray)) return null;
        const recs = HMTLib.recordsforpage(pageUrn, dseRecordsArray);
        if (recs.length > 0 && recs[0].imageroi) {
            const idx = recs[0].imageroi.lastIndexOf('@');
            return idx !== -1 ? recs[0].imageroi.substring(0, idx) : recs[0].imageroi;
        }
        return null;
    }

    function hmtscholia(parserInstance) {
        const scholiaRecords = [];
        const targetUrn = "urn:cite2:hmt:commentary.v1:all";
        const expectedHeader = "scholion|iliad";
        if (!(parserInstance instanceof CEXParser)) { console.error("Invalid parserInstance to hmtscholia."); return []; }
        const blocks = parserInstance.getBlockContents("citerelationset");
        for (const blockContent of blocks) {
            const lines = blockContent.split('\n');
            const processed = [];
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed !== '' && !trimmed.startsWith('//')) processed.push(trimmed);
            }
            if (processed.length < 3) continue;
            let blockUrn = processed[0].startsWith("urn|") ? processed[0].substring("urn|".length) : null;
            if (!blockUrn || blockUrn !== targetUrn) continue;
            if (processed[2] !== expectedHeader) { console.warn(`Scholia Header mismatch in ${blockUrn}`); continue; }
            for (let i = 3; i < processed.length; i++) {
                const cols = processed[i].split('|');
                if (cols.length === 2) scholiaRecords.push(new HMTLib.Scholion(cols[0], cols[1]));
                else console.warn(`Scholia wrong column count in ${blockUrn}, row: "${processed[i]}"`);
            }
        }
        return scholiaRecords;
    }

    function passageforscholion(scholionUrn, scholiaArray) {
        if (!scholionUrn || !Array.isArray(scholiaArray)) return null;
        const found = scholiaArray.find(s => s instanceof HMTLib.Scholion && s.scholion === scholionUrn);
        return found ? found.iliad : null;
    }

    function scholiaforpassage(iliadUrn, scholiaArray) {
        if (!iliadUrn || !Array.isArray(scholiaArray)) return [];
        return scholiaArray.filter(s => s instanceof HMTLib.Scholion && s.iliad === iliadUrn).map(s => s.scholion);
    }

    // --- NEW CODEX FUNCTIONS ---

    /**
     * Extracts CodexPage objects from 'citedata' blocks that match a given codex URN prefix.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @param {string} codexUrnPrefix - The CITE2 URN prefix identifying the codex (e.g., "urn:cite2:hmt:msA.v1:").
     * @returns {HMTLib.CodexPage[]} An array of CodexPage objects.
     */
    function codex(parserInstance, codexUrnPrefix) {
        const codexPagesResult = [];
        const requiredColumns = ['urn', 'sequence', 'image', 'rv', 'label'];

        if (!(parserInstance instanceof CEXParser)) {
            console.error("codex: Invalid parserInstance provided.");
            return [];
        }
        if (typeof codexUrnPrefix !== 'string' || !codexUrnPrefix.endsWith(':')) {
            console.error("codex: codexUrnPrefix must be a string ending with a colon (e.g., 'urn:cite2:namespace:collection:').");
            return [];
        }
        if (typeof URNTools === 'undefined') {
            console.error("codex: URNTools is not defined. Ensure urn-lib.js is loaded.");
            return [];
        }


        const citeDataBlocks = parserInstance.getBlockContents("citedata");

        for (const blockContent of citeDataBlocks) {
            const lines = blockContent.split('\n');
            let headerLine = null;
            let dataLinesStartIdx = -1;
            const columnIndexMap = {};

            // Find header and data start
            for (let i = 0; i < lines.length; i++) {
                const trimmedLine = lines[i].trim();
                if (trimmedLine === '' || trimmedLine.startsWith('//')) {
                    continue;
                }
                if (!headerLine) {
                    headerLine = trimmedLine;
                    const headerParts = headerLine.split('|');
                    headerParts.forEach((name, idx) => {
                        columnIndexMap[name.trim()] = idx;
                    });
                    dataLinesStartIdx = i + 1;
                    break; 
                }
            }

            if (!headerLine) {
                // console.warn("codex: Skipping citedata block - no header found.");
                continue;
            }

            // Check if all required columns are in the header
            let missingColumn = false;
            for (const colName of requiredColumns) {
                if (typeof columnIndexMap[colName] === 'undefined') {
                    console.warn(`codex: Skipping citedata block - header missing required column '${colName}'. Header: "${headerLine}"`);
                    missingColumn = true;
                    break;
                }
            }
            if (missingColumn) {
                continue;
            }

            // Process data lines
            for (let i = dataLinesStartIdx; i < lines.length; i++) {
                const trimmedLine = lines[i].trim();
                if (trimmedLine === '' || trimmedLine.startsWith('//')) {
                    continue;
                }

                const columnValues = trimmedLine.split('|');
                
                // Ensure the row has enough columns as per header
                // This simple check assumes no pipes within quoted fields; CEX is usually simpler.
                if (columnValues.length < Object.keys(columnIndexMap).length) {
                     // console.warn(`codex: Skipping data row due to insufficient columns compared to header. Row: "${trimmedLine}"`);
                     continue;
                }

                const currentRowFullUrn = columnValues[columnIndexMap['urn']].trim();

                if (!URNTools.isValidCite2Urn(currentRowFullUrn)) {
                    // console.warn(`codex: Skipping row with invalid CITE2 URN: ${currentRowFullUrn}`);
                    continue;
                }
                
                const rowNamespace = URNTools.cite2namespace(currentRowFullUrn);
                const rowCollection = URNTools.collectioncomponent(currentRowFullUrn);

                if (!rowNamespace || !rowCollection) {
                    // console.warn(`codex: Could not extract namespace or collection from URN: ${currentRowFullUrn}`);
                    continue;
                }

                const currentRowPrefix = `urn:cite2:${rowNamespace}:${rowCollection}:`;

                if (currentRowPrefix === codexUrnPrefix) {
                    try {
                        const sequenceStr = columnValues[columnIndexMap['sequence']].trim();
                        const sequence = parseFloat(sequenceStr);
                        if (isNaN(sequence)) {
                           // console.warn(`codex: Invalid sequence number "${sequenceStr}" for URN ${currentRowFullUrn}. Skipping.`);
                           continue;
                        }

                        const image = columnValues[columnIndexMap['image']].trim();
                        const rv = columnValues[columnIndexMap['rv']].trim();
                        const label = columnValues[columnIndexMap['label']].trim();

                        const page = new HMTLib.CodexPage(sequence, image, currentRowFullUrn, rv, label);
                        codexPagesResult.push(page);
                    } catch (e) {
                        console.error(`codex: Error creating CodexPage for row "${trimmedLine}". Error: ${e.message}`);
                    }
                }
            }
        }
        return codexPagesResult;
    }


    // Expose classes and functions
    window.HMTLib.DSERecord = DSERecord;
    window.HMTLib.Scholion = Scholion;
    window.HMTLib.CodexPage = CodexPage; // New class

    window.HMTLib.hmtcurrent = hmtcurrent;
    window.HMTLib.hmtnormalized = hmtnormalized;
    window.HMTLib.hmtdiplomatic = hmtdiplomatic;
    window.HMTLib.hmtdse = hmtdse;
    window.HMTLib.recordsforpage = recordsforpage;
    window.HMTLib.recordforpassage = recordforpassage;
    window.HMTLib.imageforpage = imageforpage;
    window.HMTLib.hmtscholia = hmtscholia;
    window.HMTLib.passageforscholion = passageforscholion;
    window.HMTLib.scholiaforpassage = scholiaforpassage;
    window.HMTLib.codex = codex; // New function

})(window);