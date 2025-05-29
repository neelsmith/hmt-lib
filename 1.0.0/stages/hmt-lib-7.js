// hmt-lib.js
(function(window) {
    'use strict';

    // Create a namespace for the library if it doesn't exist
    if (typeof window.HMTLib === 'undefined') {
        window.HMTLib = {};
    }

    /**
     * Represents a DSE (Document-Surface-Element) record.
     */
    class DSERecord {
        constructor(passage, imageroi, surface) {
            this.passage = passage;
            this.imageroi = imageroi;
            this.surface = surface;
        }
    }

    /**
     * Represents a Scholion record, linking a scholion URN to an Iliad passage URN.
     */
    class Scholion {
        /**
         * Creates an instance of Scholion.
         * @param {string} scholionUrn - The CTS URN of the scholion text.
         * @param {string} iliadUrn - The CTS URN of the Iliad passage the scholion refers to.
         */
        constructor(scholionUrn, iliadUrn) {
            this.scholion = scholionUrn; // CTS URN of the scholion
            this.iliad = iliadUrn;     // CTS URN of the Iliad passage
        }
    }


    /**
     * Loads the HMT current CEX data source from a predefined URL.
     * @returns {Promise<CEXParser>} A Promise that resolves with the CEXParser instance.
     */
    function hmtcurrent() {
        const hmtCurrentCexUrl = "https://raw.githubusercontent.com/homermultitext/hmt-archive/refs/heads/master/releases-cex/hmt-current.cex";

        if (typeof CEXParser === 'undefined') {
            console.error("CEXParser is not defined. Ensure cex-lib.js is loaded before hmt-lib.js.");
            return Promise.reject(new Error("CEXParser is not defined. Ensure cex-lib.js is loaded."));
        }

        const parser = new CEXParser();
        return parser.loadFromUrl(hmtCurrentCexUrl);
    }

    // ... (hmtnormalized, hmtdiplomatic, hmtdse functions remain unchanged) ...
    /**
     * Filters records from 'ctsdata' blocks where the CTS URN's work component
     * ends with '.normalized'.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @returns {string[]} An array of matching delimited-text lines.
     */
    function hmtnormalized(parserInstance) {
        if (typeof URNTools === 'undefined') {
            console.error("URNTools is not defined. Ensure urn-lib.js is loaded.");
            return [];
        }
        if (!(parserInstance instanceof CEXParser)) {
            console.error("Invalid parserInstance provided to hmtnormalized.");
            return [];
        }

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

    /**
     * Filters records from 'ctsdata' blocks where the CTS URN's work component
     * ends with '.diplomatic'.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @returns {string[]} An array of matching delimited-text lines.
     */
    function hmtdiplomatic(parserInstance) {
        if (typeof URNTools === 'undefined') {
            console.error("URNTools is not defined. Ensure urn-lib.js is loaded.");
            return [];
        }
        if (!(parserInstance instanceof CEXParser)) {
            console.error("Invalid parserInstance provided to hmtdiplomatic.");
            return [];
        }

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

    /**
     * Extracts DSE (Document-Surface-Element) records from 'citerelationset' blocks
     * specifically from 'urn:cite2:hmt:hmtdse.v1:all'.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @returns {DSERecord[]} An array of DSERecord objects.
     */
    function hmtdse(parserInstance) {
        const dseRecords = [];
        const targetRelationSetUrn = "urn:cite2:hmt:hmtdse.v1:all";
        const expectedHeader = "passage|imageroi|surface";

        if (!(parserInstance instanceof CEXParser)) {
            console.error("Invalid parserInstance provided to hmtdse.");
            return [];
        }

        const citeRelationSetBlockContents = parserInstance.getBlockContents("citerelationset");

        for (const blockContent of citeRelationSetBlockContents) {
            const lines = blockContent.split('\n');
            const processedLines = []; 

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine !== '' && !trimmedLine.startsWith('//')) {
                    processedLines.push(trimmedLine);
                }
            }

            if (processedLines.length < 3) {
                continue;
            }

            let currentBlockUrn = null;
            if (processedLines[0].startsWith("urn|")) {
                currentBlockUrn = processedLines[0].substring("urn|".length);
            } else {
                continue;
            }

            if (currentBlockUrn === targetRelationSetUrn) {
                const headerLine = processedLines[2];
                if (headerLine !== expectedHeader) {
                    console.warn(`Skipping DSE block ${currentBlockUrn}: Header mismatch. Expected "${expectedHeader}", found "${headerLine}".`);
                    continue;
                }

                for (let i = 3; i < processedLines.length; i++) {
                    const dataLine = processedLines[i];
                    const columns = dataLine.split('|');

                    if (columns.length === 3) { 
                        const record = new HMTLib.DSERecord(columns[0], columns[1], columns[2]);
                        dseRecords.push(record);
                    } else {
                        console.warn(`Skipping data row in DSE block ${currentBlockUrn}: Incorrect number of columns. Expected 3, found ${columns.length}. Row: "${dataLine}"`);
                    }
                }
            }
        }
        return dseRecords;
    }
     /**
     * Finds all DSERecords where the 'surface' property matches the given page URN.
     * @param {string} pageUrn - The CITE2 URN of the page.
     * @param {HMTLib.DSERecord[]} dseRecordsArray - An array of DSERecord objects.
     * @returns {HMTLib.DSERecord[]} An array of matching DSERecord objects.
     */
    function recordsforpage(pageUrn, dseRecordsArray) {
        if (!pageUrn || typeof pageUrn !== 'string' || !Array.isArray(dseRecordsArray)) {
            console.error("recordsforpage: Invalid input.");
            return [];
        }
        return dseRecordsArray.filter(record => record instanceof HMTLib.DSERecord && record.surface === pageUrn);
    }

    /**
     * Finds the first DSERecord where the 'passage' property matches the given CTS URN.
     * @param {string} passageUrn - The CTS URN of the passage.
     * @param {HMTLib.DSERecord[]} dseRecordsArray - An array of DSERecord objects.
     * @returns {HMTLib.DSERecord | null} The matching DSERecord object, or null.
     */
    function recordforpassage(passageUrn, dseRecordsArray) {
        if (!passageUrn || typeof passageUrn !== 'string' || !Array.isArray(dseRecordsArray)) {
            console.error("recordforpassage: Invalid input.");
            return null;
        }
        return dseRecordsArray.find(record => record instanceof HMTLib.DSERecord && record.passage === passageUrn) || null;
    }

    /**
     * Finds the image URN for a given page URN from an array of DSERecords.
     * @param {string} pageUrn - The CITE2 URN identifying the page.
     * @param {HMTLib.DSERecord[]} dseRecordsArray - An array of DSERecord objects.
     * @returns {string | null} The image URN (without ROI), or null.
     */
    function imageforpage(pageUrn, dseRecordsArray) {
        if (!pageUrn || typeof pageUrn !== 'string' || !Array.isArray(dseRecordsArray)) {
            console.error("imageforpage: Invalid input.");
            return null;
        }
        const matchingPageRecords = HMTLib.recordsforpage(pageUrn, dseRecordsArray);
        if (matchingPageRecords.length > 0) {
            const firstRecord = matchingPageRecords[0];
            if (firstRecord && firstRecord.imageroi && typeof firstRecord.imageroi === 'string') {
                const imageroi = firstRecord.imageroi;
                const roiSeparatorIndex = imageroi.lastIndexOf('@');
                return roiSeparatorIndex !== -1 ? imageroi.substring(0, roiSeparatorIndex) : imageroi;
            }
        }
        return null;
    }


    // --- NEW SCHOLIA FUNCTIONS ---

    /**
     * Extracts Scholion objects from 'citerelationset' blocks,
     * specifically from 'urn:cite2:hmt:commentary.v1:all'.
     * @param {CEXParser} parserInstance - The CEXParser instance.
     * @returns {HMTLib.Scholion[]} An array of Scholion objects.
     */
    function hmtscholia(parserInstance) {
        const scholiaRecords = [];
        const targetRelationSetUrn = "urn:cite2:hmt:commentary.v1:all";
        const expectedHeader = "scholion|iliad";

        if (!(parserInstance instanceof CEXParser)) {
            console.error("Invalid parserInstance provided to hmtscholia.");
            return [];
        }

        const citeRelationSetBlockContents = parserInstance.getBlockContents("citerelationset");

        for (const blockContent of citeRelationSetBlockContents) {
            const lines = blockContent.split('\n');
            const processedLines = [];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine !== '' && !trimmedLine.startsWith('//')) {
                    processedLines.push(trimmedLine);
                }
            }

            // Need at least URN line, label line, and header line
            if (processedLines.length < 3) {
                continue;
            }

            let currentBlockUrn = null;
            if (processedLines[0].startsWith("urn|")) {
                currentBlockUrn = processedLines[0].substring("urn|".length);
            } else {
                continue; // Malformed block, missing URN line
            }

            // Optional: check label line
            // if (!processedLines[1].startsWith("label|")) { ... }

            if (currentBlockUrn === targetRelationSetUrn) {
                const headerLine = processedLines[2]; // Header is the third processed line
                if (headerLine !== expectedHeader) {
                    console.warn(`Skipping commentary block ${currentBlockUrn}: Header mismatch. Expected "${expectedHeader}", found "${headerLine}".`);
                    continue;
                }

                // Data rows start from index 3 of processedLines (i.e., the 4th processed line onwards)
                for (let i = 3; i < processedLines.length; i++) {
                    const dataLine = processedLines[i];
                    const columns = dataLine.split('|');

                    if (columns.length === 2) { // scholion_urn, iliad_urn
                        const scholionRecord = new HMTLib.Scholion(columns[0], columns[1]);
                        scholiaRecords.push(scholionRecord);
                    } else {
                        console.warn(`Skipping data row in commentary block ${currentBlockUrn}: Incorrect number of columns. Expected 2, found ${columns.length}. Row: "${dataLine}"`);
                    }
                }
            }
        }
        return scholiaRecords;
    }

    /**
     * Finds the Iliad passage URN that a specific scholion URN refers to.
     * @param {string} scholionUrnToFind - The CTS URN of the scholion.
     * @param {HMTLib.Scholion[]} scholiaArray - An array of Scholion objects.
     * @returns {string | null} The CTS URN of the Iliad passage, or null if not found.
     */
    function passageforscholion(scholionUrnToFind, scholiaArray) {
        if (!scholionUrnToFind || typeof scholionUrnToFind !== 'string' || !Array.isArray(scholiaArray)) {
            console.error("passageforscholion: Invalid input.");
            return null;
        }
        const foundScholion = scholiaArray.find(s => s instanceof HMTLib.Scholion && s.scholion === scholionUrnToFind);
        return foundScholion ? foundScholion.iliad : null;
    }

    /**
     * Finds all scholia URNs that refer to a specific Iliad passage URN.
     * @param {string} iliadPassageUrnToFind - The CTS URN of the Iliad passage.
     * @param {HMTLib.Scholion[]} scholiaArray - An array of Scholion objects.
     * @returns {string[]} An array of scholion CTS URNs (possibly empty).
     */
    function scholiaforpassage(iliadPassageUrnToFind, scholiaArray) {
        if (!iliadPassageUrnToFind || typeof iliadPassageUrnToFind !== 'string' || !Array.isArray(scholiaArray)) {
            console.error("scholiaforpassage: Invalid input.");
            return [];
        }
        return scholiaArray
            .filter(s => s instanceof HMTLib.Scholion && s.iliad === iliadPassageUrnToFind)
            .map(s => s.scholion);
    }


    // Expose functions and classes via the HMTLib namespace
    window.HMTLib.DSERecord = DSERecord;
    window.HMTLib.Scholion = Scholion; // Expose new class

    window.HMTLib.hmtcurrent = hmtcurrent;
    window.HMTLib.hmtnormalized = hmtnormalized;
    window.HMTLib.hmtdiplomatic = hmtdiplomatic;
    window.HMTLib.hmtdse = hmtdse;
    window.HMTLib.recordsforpage = recordsforpage;
    window.HMTLib.recordforpassage = recordforpassage;
    window.HMTLib.imageforpage = imageforpage;

    window.HMTLib.hmtscholia = hmtscholia; // Expose new functions
    window.HMTLib.passageforscholion = passageforscholion;
    window.HMTLib.scholiaforpassage = scholiaforpassage;


})(window);