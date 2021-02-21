const { LuisRecognizer } = require('botbuilder-ai');

class ErwinRecognizer {
    constructor(config) {
        const luisIsConfigured = config && config.applicationId && config.endpointKey && config.endpoint;
        if (luisIsConfigured) {
            const recognizerOptions = {
                apiVersion: 'v3'
            };

            this.recognizer = new LuisRecognizer(config, recognizerOptions);
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
        return await this.recognizer.recognize(context);
    }

    // #######################################################################
    // ###################### CreateTrelloCard entities ######################
    // #######################################################################

    getTrelloCardName(result) {
        let trelloCardName;
        if (result.entities.$instance.TrelloCardName) {
            trelloCardName = result.entities.$instance.TrelloCardName[0].text;
        }

        return trelloCardName;
    }

    getTrelloCardDescription(result) {
        let trelloCardDescription;
        if (result.entities.$instance.trelloCardDescription) {
            trelloCardDescription = result.entities.$instance.trelloCardDescription[0].text;
        }

        return trelloCardDescription;
    }

    getTrelloCardDeadline(result) {
        let trelloCardDeadline;
        if (result.entities.$instance.trelloCardDeadline) {
            trelloCardDeadline = result.entities.$instance.trelloCardDeadline[0].text;
        }

        if (trelloCardDeadline) return undefined;

        const timex = trelloCardDeadline[0].timex;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
}

module.exports.ErwinRecognizer = ErwinRecognizer;
