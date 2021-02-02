
// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
const { WebClient, LogLevel } = require('@slack/web-api');

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
            this.firstStep.bind(this),
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
    async firstStep(step) {
        if (!this.luisRecognizer.isConfigured) {
            const errorText = 'WARNING: There are problems in the Luis configuration';
            await step.context.sendActivity(errorText, null, InputHints.IgnoringInput);
            return await step.next();
        }

        const messageText = step.options.restartMsg ? step.options.restartMsg : 'Write something to start';
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

        // Unix timestamp for tomorrow morning at 9AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate());
        tomorrow.setHours(16, 43, 0);

        const channelId = 'C01LQ3DG8DR';

        // Part to select the dialogs.
        if (specifiedOption === 'slack') {
            await step.context.sendActivities([
                { type: 'message', text: 'Slack Message' },
                { channelData: SampleFidelityMessage },
                {
                    channelData: {
                        channel: channelId,
                        text: 'Looking towards the future',
                        // Time to post message, in Unix Epoch timestamp format
                        post_at: tomorrow.getTime() / 1000
                    }
                }
            ]);

            console.log('Skaten');

            // WebClient insantiates a client that can call API methods
            // When using Bolt, you can use either `app.client` or the `client` passed to listeners.
            const client = new WebClient({
                token: 'xoxb-1647940083028-1627029901863-zugYhdUjXZRXSf1IPZrHDnDI',
                // LogLevel can be imported and used to make debugging simpler
                logLevel: LogLevel.DEBUG
            });

            console.log('Skaten2');

            console.log('Skaten3');

            try {
                // Call the chat.scheduleMessage method using the WebClient
                const result = await client.chat.scheduleMessage({
                    channel: channelId,
                    text: 'Looking towards the future',
                    // Time to post message, in Unix Epoch timestamp format
                    post_at: tomorrow.getTime() / 1000
                });

                console.log(result);
            } catch (error) {
                console.error(error);
            }
        } else if (specifiedOption === 'ticket' || LuisRecognizer.topIntent(luisResult) === 'Ticketing') {
            await step.context.sendActivity(MessageFactory.text('ticketing', 'ticketing'));
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
