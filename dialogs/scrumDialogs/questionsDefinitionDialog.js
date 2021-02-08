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
const QUESTION_DEFINITION_DIALOG = 'QUESTION_DEFINITION_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class QuestionsDefinitionDialog extends ComponentDialog{
    constructor(userState) {
        super(QUESTION_DEFINITION_DIALOG);

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.definitionStep.bind(this),
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

    async definitionStep(step){
        //const questionsList = Array.isArray(step.questions)
    }

    async loopStep(step){

    }
}

module.exports.QuestionsDefinitionDialog = QuestionsDefinitionDialog;
module.exports.QUESTION_DEFINITION_DIALOG = QUESTION_DEFINITION_DIALOG;