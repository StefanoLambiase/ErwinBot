// Use this simple app to query the Bing Web Search API and get a JSON response.
// Usage: node search.js "your query".
const https = require('https');

// Setup trello keys
const apiKey = process.env.TrelloAPIKey;
const oAuthToken = process.env.TrelloOAuthToken;
const token = process.env.StefanoTrelloToken; // ToDo: modify it with the user's token.

if (!apiKey || !oAuthToken || !token) {
    throw new Error('Trello credentials are not set.');
}

/**
 * The function for the http key.
 * @param {string} url - The url for the http key.
 */
function executeTrelloCall(url) {
    return new Promise((resolve, reject) => {
        https.get(
            url,
            response => {
                let body = '';

                response.on('data', part => { body += part; });

                response.on('end', () => {
                    // Return an object in JSON form.
                    const responseAsJSON = JSON.parse(body);
                    console.log('\nJSON Response:\n');
                    console.dir(responseAsJSON, { colors: true, depth: null });

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
 * Returns all the user's board as a JSON.
 */
async function getAllMyBoards() {
    console.log('TRELLO ADAPTER - getAllBoards');

    try {
        let url = 'https://api.trello.com/1/members/me/boards';
        url = url + '?key=' + apiKey + '&token=' + token;

        const httpPromise = executeTrelloCall(url);
        const responseBody = await httpPromise;

        return responseBody;
    } catch {
        return undefined;
    }
}

/**
 * Returns all the cards lists in a board as a JSON.
 */
async function getAllListInBoard(boardId) {
    console.log('TRELLO ADAPTER - getAllCards');

    try {
        let url = 'https://api.trello.com/1/boards/' + boardId + '/lists';
        url = url + '?key=' + apiKey + '&token=' + token;

        const httpPromise = executeTrelloCall(url);
        const responseBody = await httpPromise;

        return responseBody;
    } catch {
        return undefined;
    }
}

module.exports = { getAllMyBoards, getAllListInBoard };
