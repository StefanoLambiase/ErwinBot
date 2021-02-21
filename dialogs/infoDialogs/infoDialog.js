const { ActivityHandler, CardFactory } = require('botbuilder');

const {
    TextPrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Imports for Slack
const InfoOptions = require('../../botResources/slack/InfoOptions.json');

const infoCard = require('../../botResources/adaptiveCardStructures/infoCards/infoCard.json');

// Dialogs names
const INFO_DIALOG = 'INFO_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class InfoDialog extends ComponentDialog {
    constructor(userState) {
        super(INFO_DIALOG);

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.optionStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async optionStep(step) {
        if (step.context.activity.channelId === 'slack') {
            return await step.context.sendActivity({ channelData: InfoOptions });
        } else {
            return await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(infoCard)] });
        }
    }
}

module.exports.InfoDialog = InfoDialog;
module.exports.INFO_DIALOG = INFO_DIALOG;
