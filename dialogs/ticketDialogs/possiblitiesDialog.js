// Import required types from libraries.
const {
    TextPrompt,
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');

const {
    LuisRecognizer
} = require('botbuilder-ai');

// Dialogs names.
const POSSIBILITIES_DIALOG = 'POSSIBILITIES_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class PossibilitiesDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(POSSIBILITIES_DIALOG);

        if (!luisRecognizer) throw new Error('[PossibilitiesDialog]: Missing parameter \'luisRecognizer\' is required');
        this.LuisRecognizer = LuisRecognizer;

        // Define a "done" response for the company selection prompt.
        this.doneOption = 'done';

        // Define value names for values tracked inside the dialogs.
        this.possibilitiesInserted = 'value-possibilitiesInserted';

        // Add used dialogs.
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.possibilityStep.bind(this),
            this.loopStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async possibilityStep(stepContext) {
        // Continue using the same selection list, if any, from the previous iteration of this dialog.
        const list = Array.isArray(stepContext.options) ? stepContext.options : [];
        stepContext.values[this.possibilitiesInserted] = list;

        // Create a prompt message.
        let message = '';
        if (list.length === 0) {
            message = 'Type the first solution to the problem';
        } else {
            message = 'You have typed ' + list.length + ' options. Type \'done\' to end or an other solution to continue';
        }

        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    async loopStep(stepContext) {
        // Retrieve their selection list, the choice they made, and whether they chose to finish.
        const list = stepContext.values[this.possibilitiesInserted];
        const userInput = stepContext.result;

        console.log(userInput);
        const done = userInput === this.doneOption;

        if (!done) {
            // If the user inserts a solution, push it in the array.
            list.push(userInput);
        }

        if (done && list.length > 1) {
            // If they're done, exit and return their list.
            return await stepContext.endDialog(list);
        } else {
            // Otherwise, repeat this dialog, passing in the list from this iteration.
            return await stepContext.replaceDialog(POSSIBILITIES_DIALOG, list);
        }
    }
}

module.exports.PossibilitiesDialog = PossibilitiesDialog;
module.exports.POSSIBILITIES_DIALOG = POSSIBILITIES_DIALOG;
