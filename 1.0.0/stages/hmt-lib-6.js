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
        /**
         * Creates an instance of DSERecord.
         * @param {string} passage - The passage identifier (CTS URN).
         * @param {string} imageroi - The image ROI (Region of Interest) identifier (CITE2 URN with optional ROI).
         * @param {string} surface - The surface identifier (CITE2 URN, often a page).
         */
        constructor(passage, imageroi, surface) {
            this.passage = passage;
            this.imageroi = imageroi;
            this.surface = surface; // This property is matched against 'page' URNs
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

            if (processedLines.length < 3) { // Need at least URN, label, header
                continue;
            }

            let currentBlockUrn = null;
            if (processedLines[0].startsWith("urn|")) {
                currentBlockUrn = processedLines[0].substring("urn|".length);
            } else {
                continue;
            }

            // Optional: Check label line, though not strictly necessary for this function's logic
            // if (!processedLines[1].startsWith("label|")) continue;


            if (currentBlockUrn === targetRelationSetUrn) {
                const headerLine = processedLines[2]; // Header is the 3rd processed line
                if (headerLine !== expectedHeader) {
                    console.warn(`Skipping DSE block ${currentBlockUrn}: Header mismatch. Expected "${expectedHeader}", found "${headerLine}".`);
                    continue;
                }

                for (let i = 3; i < processedLines.length; i++) { // Data starts from 4th processed line
                    const dataLine = processedLines[i];
                    const columns = dataLine.split('|');

                    if (columns.length === 3) { // passage, imageroi, surface
                        const record = new DSERecord(columns[0], columns[1], columns[2]);
                        dseRecords.push(record);
                    } else {
                        console.warn(`Skipping data row in DSE block ${currentBlockUrn}: Incorrect number of columns. Expected 3, found ${columns.length}. Row: "${dataLine}"`);
                    }
                }
            }
        }
        return dseRecords;
    }

    // --- NEW DSE Record Query FUNCTIONS ---

    /**
     * Finds all DSERecords where the 'surface' property matches the given page URN.
     *
     * @param {string} pageUrn - The CITE2 URN of the page to search for.
     * @param {HMTLib.DSERecord[]} dseRecordsArray - An array of DSERecord objects.
     * @returns {HMTLib.DSERecord[]} An array of matching DSERecord objects (possibly empty).
     */
    function recordsforpage(pageUrn, dseRecordsArray) {
        if (!pageUrn || typeof pageUrn !== 'string' || !Array.isArray(dseRecordsArray)) {
            console.error("recordsforpage: Invalid input. pageUrn must be a non-empty string and dseRecordsArray an array.");
            return [];
        }
        return dseRecordsArray.filter(record => record instanceof DSERecord && record.surface === pageUrn);
    }

    /**
     * Finds the first DSERecord where the 'passage' property matches the given CTS URN.
     *
     * @param {string} passageUrn - The CTS URN of the passage to search for.
     * @param {HMTLib.DSERecord[]} dseRecordsArray - An array of DSERecord objects.
     * @returns {HMTLib.DSERecord | null} The matching DSERecord object, or null if not found.
     */
    function recordforpassage(passageUrn, dseRecordsArray) {
        if (!passageUrn || typeof passageUrn !== 'string' || !Array.isArray(dseRecordsArray)) {
            console.error("recordforpassage: Invalid input. passageUrn must be a non-empty string and dseRecordsArray an array.");
            return null;
        }
        return dseRecordsArray.find(record => record instanceof DSERecord && record.passage === passageUrn) || null;
    }

    /**
     * Finds the image URN for a given page URN from an array of DSERecords.
     * It first finds records for the page using `recordsforpage`, then extracts 
     * and processes the imageroi property of the first matching record by 
     * removing the ROI suffix (part after the last '@').
     *
     * @param {string} pageUrn - The CITE2 URN identifying the page.
     * @param {HMTLib.DSERecord[]} dseRecordsArray - An array of DSERecord objects.
     * @returns {string | null} The image URN (without ROI), or null if no matching record
     *                          is found or if the imageroi property is missing/invalid.
     */
    function imageforpage(pageUrn, dseRecordsArray) {
        if (!pageUrn || typeof pageUrn !== 'string' || !Array.isArray(dseRecordsArray)) {
            console.error("imageforpage: Invalid input. pageUrn must be a non-empty string and dseRecordsArray an array.");
            return null;
        }

        const matchingPageRecords = recordsforpage(pageUrn, dseRecordsArray);

        if (matchingPageRecords.length > 0) {
            const firstRecord = matchingPageRecords[0];
            if (firstRecord && firstRecord.imageroi && typeof firstRecord.imageroi === 'string') {
                const imageroi = firstRecord.imageroi;
                const roiSeparatorIndex = imageroi.lastIndexOf('@');
                
                if (roiSeparatorIndex !== -1) {
                    return imageroi.substring(0, roiSeparatorIndex);
                }
                // If no '@' is found, the entire string is considered the image identifier.
                return imageroi; 
            } else {
                // console.warn(`imageforpage: First record for page ${pageUrn} has missing, null, or invalid imageroi property.`);
                return null; 
            }
        }
        return null; // No records found for the page
    }

    // Expose functions and class via the HMTLib namespace
    window.HMTLib.DSERecord = DSERecord;
    window.HMTLib.hmtcurrent = hmtcurrent;
    window.HMTLib.hmtnormalized = hmtnormalized;
    window.HMTLib.hmtdiplomatic = hmtdiplomatic;
    window.HMTLib.hmtdse = hmtdse;
    window.HMTLib.recordsforpage = recordsforpage;
    window.HMTLib.recordforpassage = recordforpassage;
    window.HMTLib.imageforpage = imageforpage;

})(window);