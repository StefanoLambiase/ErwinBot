// Use this simple app to query the Bing Web Search API and get a JSON response.
// Usage: node search.js "your query".
const https = require('https');

// Gets the credentials of the Bing Search API.
const SUBSCRIPTION_KEY = process.env.BingSearchKey1;
if (!SUBSCRIPTION_KEY) {
    throw new Error('AZURE_SUBSCRIPTION_KEY is not set.');
}

/**
 * Implements the functionality that search websites based on a query.
 * @param {string} query - The string used to search.
 * @param {boolean} onStackoverflow - Indicates if the search must be done on StackOverflow.
 */
function executeBingSearchAsPromise(query, onStackoverflow) {
    // Sets default query params.
    // Checks if the search must be done on StackOverflow.
    let siteOperator = '';
    if (onStackoverflow) {
        siteOperator = '+site%3Astackoverflow.com';
    }
    const responseFilterParam = '&responseFilter=webpages';
    const answerCountParam = '&answerCount=7';

    return new Promise((resolve, reject) => {
        // Does the call.
        https.get(
            {
                hostname: process.env.BingSearchEndpoint,
                path: '/v7.0/search?q=' + encodeURIComponent(query) + siteOperator + responseFilterParam + answerCountParam,
                headers: { 'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY }
            },
            response => {
                let body = '';

                response.on('data', part => { body += part; });

                response.on('end', () => {
                    for (var header in response.headers) {
                        if (header.startsWith('bingapis-') || header.startsWith('x-msedge-')) {
                            console.log(header + ': ' + response.headers[header]);
                        }
                    }

                    // Return an object in JSON form.
                    const responseAsJSON = JSON.parse(body);
                    console.log('\nJSON Response:\n');
                    console.dir(responseAsJSON, { colors: false, depth: null });

                    resolve(responseAsJSON);
                });

                response.on('error', error => {
                    console.log('Error: ' + error.message);
                    reject(error);
                });
            }
        );
    });
}

/**
 * Implements an async function to make http request.
 */
async function bingWebSearch(query, onStackoverflow) {
    try {
        const httpPromise = executeBingSearchAsPromise(query, onStackoverflow);
        const responseBody = await httpPromise;

        return responseBody;
    } catch {
        return '';
    }
}

module.exports = { bingWebSearch };
