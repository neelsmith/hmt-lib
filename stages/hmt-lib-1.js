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
        // CEXParser.loadFromUrl loads the data and then resolves the promise with the parser instance itself.
        return parser.loadFromUrl(hmtCurrentCexUrl);
    }

    // Expose the hmtcurrent function via the HMTLib namespace
    window.HMTLib.hmtcurrent = hmtcurrent;

})(window);