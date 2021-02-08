// Use this simple app to query the Bing Web Search API and get a JSON response.
// Usage: node search.js "your query".
const https = require('https');

// Gets the credentials of the Bing Search API.
const SUBSCRIPTION_KEY = process.env.BingSearchKey1;
if (!SUBSCRIPTION_KEY) {
    throw new Error('AZURE_SUBSCRIPTION_KEY is not set.');
}

function bingWebSearch(query) {
    https.get({
        hostname: process.env.BingSearchEndpoint,
        path: 'v7.0/search?q=' + encodeURIComponent(query),
        headers: { 'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY }
    }, res => {
        let body = '';
        res.on('data', part => body += part);
        res.on('end', () => {
            for (var header in res.headers) {
                if (header.startsWith('bingapis-') || header.startsWith('x-msedge-')) {
                    console.log(header + ': ' + res.headers[header]);
                }
            }
            console.log('\nJSON Response:\n');
            console.dir(JSON.parse(body), { colors: false, depth: null });
        });
        res.on('error', e => {
            console.log('Error: ' + e.message);
            throw e;
        });
    });
}

module.exports = { bingWebSearch };
