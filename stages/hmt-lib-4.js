// hmt-lib.js
(function(window) {
    'use strict';

    // Create a namespace for the library if it doesn't exist
    if (typeof window.HMTLib === 'undefined') {
        window.HMTLib = {};
    }

    /**
     * Loads the HMT current CEX data source from a predefined URL.
     * This function utilizes CEXParser.loadFromUrl from cex-lib.js.
     *
     * It assumes CEXParser is available in the global scope (from including cex-lib.js).
     *
     * @returns {Promise<CEXParser>} A Promise that resolves with the CEXParser instance
     *                               loaded with the HMT data. If loading fails or
     *                               CEXParser is not found, the Promise will be rejected
     *                               with an Error.
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
     *
     * Assumes URNTools is available in the global scope (from including urn-lib.js).
     *
     * @param {CEXParser} parserInstance - The CEXParser instance containing parsed CEX data.
     * @returns {string[]} An array of matching delimited-text lines (records).
     *                     Returns an empty array if URNTools or parserInstance is invalid,
     *                     or no matching records are found.
     */
    function hmtnormalized(parserInstance) {
        if (typeof URNTools === 'undefined') {
            console.error("URNTools is not defined. Ensure urn-lib.js is loaded before hmt-lib.js.");
            return [];
        }
        if (!(parserInstance instanceof CEXParser)) {
            console.error("Invalid parserInstance provided to hmtnormalized.");
            return [];
        }

        const filteredRecords = [];
        // getBlockContents returns an array of strings, where each string is the
        // content of one 'ctsdata' block.
        const ctsDataBlockContents = parserInstance.getBlockContents('ctsdata');

        ctsDataBlockContents.forEach(blockContent => {
            const lines = blockContent.split('\n');
            lines.forEach(line => {
                const trimmedLine = line.trim();
                // Ignore empty lines and comments
                if (trimmedLine === '' || trimmedLine.startsWith('//')) {
                    return;
                }

                const parts = trimmedLine.split('|');
                if (parts.length >= 1) { // We need at least the URN
                    const urnString = parts[0];
                    const workComponent = URNTools.workcomponent(urnString); // Retrieves the 4th component

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
     *
     * Assumes URNTools is available in the global scope (from including urn-lib.js).
     *
     * @param {CEXParser} parserInstance - The CEXParser instance containing parsed CEX data.
     * @returns {string[]} An array of matching delimited-text lines (records).
     *                     Returns an empty array if URNTools or parserInstance is invalid,
     *                     or no matching records are found.
     */
    function hmtdiplomatic(parserInstance) {
        if (typeof URNTools === 'undefined') {
            console.error("URNTools is not defined. Ensure urn-lib.js is loaded before hmt-lib.js.");
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
                // Ignore empty lines and comments
                if (trimmedLine === '' || trimmedLine.startsWith('//')) {
                    return;
                }

                const parts = trimmedLine.split('|');
                if (parts.length >= 1) { // We need at least the URN
                    const urnString = parts[0];
                    const workComponent = URNTools.workcomponent(urnString); // Retrieves the 4th component

                    if (workComponent && workComponent.endsWith('.diplomatic')) {
                        filteredRecords.push(trimmedLine);
                    }
                }
            });
        });
        return filteredRecords;
    }

    // Expose functions via the HMTLib namespace
    window.HMTLib.hmtcurrent = hmtcurrent;
    window.HMTLib.hmtnormalized = hmtnormalized;
    window.HMTLib.hmtdiplomatic = hmtdiplomatic;

})(window);