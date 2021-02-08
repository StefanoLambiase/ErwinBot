// Import required types from libraries
const {
    ChoicePrompt,
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Import utils.
const bingSearch = require('../../utils/bingSearch');

// Dialogs names
const BING_SEARCH_DIALOG = 'BING_SEARCH_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

class BingSearchDialog extends ComponentDialog {
    constructor() {
        super(BING_SEARCH_DIALOG);

        // Add used dialogs.
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.askForStackOverflowStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async askForStackOverflowStep(stepContext) {
        console.log('**BING SEARCH DIALOG: askForStackOverflowStep**\n');

        stepContext.values.queryForBing = stepContext.options;
        console.log(stepContext.values.queryForBing);

        // Create the list of options to choose from.
        const options = ['Yes', 'No'];
        const message = 'Do you want to search only on StackOverflow? 😎';
        // Prompt the user for a choice.
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: message,
            retryPrompt: 'Please choose an option below.',
            choices: options
        });
    }

    async finalStep(stepContext) {
        console.log('**BING SEARCH DIALOG: finalStep**\n');

        // Get the favourite user solution to the problem.
        const userOption = stepContext.result.value;

        let responseAsJSON = '';
        if (userOption === 'Yes') {
            responseAsJSON = bingSearch.bingWebSearch(stepContext.values.queryForBing, true);
        } else {
            responseAsJSON = bingSearch.bingWebSearch(stepContext.values.queryForBing, false);
        }

        console.log(responseAsJSON);

        return await stepContext.endDialog(responseAsJSON);
    }
}

module.exports.BingSearchDialog = BingSearchDialog;
module.exports.BING_SEARCH_DIALOG = BING_SEARCH_DIALOG;
