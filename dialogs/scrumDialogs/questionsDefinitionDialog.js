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

        this.finishOption = "finish";

        this.questionInserted = "value-questionInserted";

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

        //check if the value inserted is an array and continue the process with it
        //if not instance a new one
        const questionsList = Array.isArray(step.option) ? step.option : [];
        step.values[this.questionInserted] = questionsList;

        let informativeText = "";
        if(questionsList.length === 0){
            informativeText = "Please define the first question";
        }else{
            informativeText = "You've defined " + questionsList.length + " questions. Type " + this.finishOption + " to end the process or define another question."
        }

        return await step.prompt(TEXT_PROMPT, {
            prompt: informativeText
        });
    }

    async loopStep(step){
        // Take the user input
        const questionsList = step.values[this.questionInserted];
        const input = step.result;

        const isFinish = (input === this.finishOption);

        if(!isFinish){
            // Only if it's a question we take it
            questionsList.push(input);
        }

        if(isFinish && questionsList.length > 0){
            // If the user typed "finish" and we've enough questions 
            return await step.endDialog(questionsList);
        }else{
            // Continue to cycle
            return await step.replaceDialog(QUESTION_DEFINITION_DIALOG, questionsList);
        }
    }
}

module.exports.QuestionsDefinitionDialog = QuestionsDefinitionDialog;
module.exports.QUESTION_DEFINITION_DIALOG = QUESTION_DEFINITION_DIALOG;