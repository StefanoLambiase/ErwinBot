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

// Imports for Slack
const SampleFidelityMessage = require('../../botResources/slack/SampleFidelityMessage.json');
const DatepickerSlack = require('../../botResources/slack/DatepickerSlack.json');
const TimepickerSlack = require('../../botResources/slack/TimepickerSlack.json');

// Dialogs names
const SCRUM_DIALOG = 'SCRUM_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class ScrumDialog extends ComponentDialog {
    constructor(userState){
        super(SCRUM_DIALOG);

         // Adding used dialogs
         this.addDialog(new TextPrompt(TEXT_PROMPT));
         this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
             this.dateStep.bind(this),
             this.timeStep.bind(this),
             this.questionStep.bind(this),
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

    async dateStep(step){
        await step.context.sendActivities([
            { type: 'message', text: 'Set up you daily scrum' },
            { channelData: SampleFidelityMessage },
        ]);
    }

    async timeStep(step){
        await step.context.sendActivities([
            { type: 'message', text: 'Set up you daily scrum' },
            { channelData: DatepickerSlack },
        ]);
    }

    async questionStep(step){
        
    }
}

module.exports.ScrumDialog = ScrumDialog;
module.exports.SCRUM_DIALOG = SCRUM_DIALOG;