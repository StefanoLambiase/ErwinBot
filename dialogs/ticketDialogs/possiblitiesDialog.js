// Import required types from libraries
const {
    ActivityTypes,
    MessageFactory,
    InputHints
} = require('botbuilder');

const {
    TextPrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

const {
    LuisRecognizer
} = require('botbuilder-ai');

// Dialogs names
const POSSIBILITIES_DIALOG = 'POSSIBILITIES_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class PossibilitiesDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(POSSIBILITIES_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.LuisRecognizer = LuisRecognizer;

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

        const message = 'What are all possible solutions of the problem?';

        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    async loopStep(stepContext) {

    }
}

module.exports.PossibilitiesDialog = PossibilitiesDialog;
module.exports.POSSIBILITIES_DIALOG = POSSIBILITIES_DIALOG;
