/*
 * Object representing the list of questions to send in a slack channel
 */
class Question {
    constructor (user, questionsList){
        this.user = user;
        this.questionsList = questionsList;
    }

     /**
     * Return the list of questions to the problem as a formatted string.
     */
    getQuestionsAsString() {
        let questionsString = "";
        if(this.questionsList > 0){
            this.questionsList.array.forEach((element, index) => {
                questionsString.concat("\n" + (index+1) + "." + element);
            });
        }else{
            questionsString = questionsString.concat("No questions defined")
        }
    }

    toString(){
        const wellFormattedString = "";
        wellFormattedString.getQuestionsAsString();

        return "Your lovely manager " + this.user +" sent you these simple questions! :D" + 
                "\n" + wellFormattedString;
    }
}

module.exports.Question = Question;