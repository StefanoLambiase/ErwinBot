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
const SEND_EMAIL_DIALOG = 'SEND_EMAIL_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class SendEmailDialog extends ComponentDialog {
    constructor(luisRecognizer) {
        super(SEND_EMAIL_DIALOG);

        if (!luisRecognizer) throw new Error('[SendEmailDialog]: Missing parameter \'luisRecognizer\' is required');
        this.LuisRecognizer = LuisRecognizer;

        // Add used dialogs.
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.insertEmailStep.bind(this),
            this.loopStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async insertEmailStep(stepContext) {
        const message = 'Insert the receiver email';
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    async loopStep(stepContext) {
        const emailInserted = stepContext.result;

        let reply = '';
        const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (emailInserted.match(regexEmail)) {
            reply = 'I\'ll send an email to ' + emailInserted;
            stepContext.context.sendActivity(reply);

            return await stepContext.endDialog(emailInserted);
        } else {
            reply = 'The email inserted doesn\'t match the email format. Please retry.';
            stepContext.context.sendActivity(reply);

            return await stepContext.replaceDialog(SEND_EMAIL_DIALOG);
        }
    }
}

module.exports.SendEmailDialog = SendEmailDialog;
module.exports.SEND_EMAIL_DIALOG = SEND_EMAIL_DIALOG;
