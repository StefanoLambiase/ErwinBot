// Import required types from libraries
const {
    ActionTypes,
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

// Imports for Slack
const SampleFidelityMessage = require('../botResources/slack/SampleFidelityMessage.json');


// Dialogs names
const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

/**
 * Implement the first dialog in the chain.
 */
class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(MAIN_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

        //  Add used dialog.
        // ! if you want to add a new dialog in the steps, first add it here.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.startStep.bind(this),
            this.optionsStep.bind(this),
            this.loopStep.bind(this)
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

    /**
     * Implement the first bot message.
     * @param {*} step 
     */
    async startStep(step) {
        if (!this.luisRecognizer.isConfigured) {
            let errorText = 'ATTENZIONE: LUIS non configurato. Controlla il file .env!';
            await step.context.sendActivity(errorText, null, InputHints.IgnoringInput);
            return await step.next();
        }

        let messageText = step.options.restartMsg ? step.options.restartMsg : 'Write something to start';
        const welcomeMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        return await step.prompt(TEXT_PROMPT, {
            prompt: welcomeMessage
        });
    }

    /**
     * Implement the step selection on LuisRecognizer intent.
     * @param {*} step 
     */
    async optionsStep(step) {
        // Set the activity.
        const reply = { type: ActivityTypes.Message };

        // Text from the previous step.
        const specifiedOption = step.result;

        // Luis result from LuisRecognizer.
        const luisResult = await this.luisRecognizer.executeLuisQuery(step.context);

        // Part to select the dialogs.
        if (specifiedOption === 'slack') {
            await step.context.sendActivities([
                { type: 'message', text: 'Slack Message' },
                { channelData: SampleFidelityMessage }
            ]);
        } else if (LuisRecognizer.topIntent(luisResult) === 'Ticketing') {
            await step.context.sendActivity(MessageFactory.text("ticketing", "ticketing"));
            // return await step.beginDialog(TICKET_DIALOG);
        } else {
            // The user did not enter input that this bot was built to handle.
            reply.text = 'Sorry! I can\'t recognize your command. Retry!';
            await step.context.sendActivity(reply);
        }

        return await step.replaceDialog(this.id);
    }

    async loopStep(step) {
        return await step.replaceDialog(this.id);
    }

}

module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;
