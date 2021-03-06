/*
 * Object representing the list of questions to send in a slack channel
 */
class Question {
    constructor(user, questionsList) {
        this.user = user;
        this.questionsList = questionsList;
    }

    /**
     * Return the list of questions to the problem as a formatted string.
     */
    getQuestionsAsString() {
        let questionsString = '';
        if (this.questionsList.length > 0) {
            this.questionsList.forEach((element, index) => {
                questionsString = questionsString.concat('\n' + (index + 1) + '.' + element);
            });
        } else {
            questionsString = questionsString.concat('No questions defined');
        }
        return questionsString;
    }

    toString() {
        let questionsString = '';
        if (this.questionsList.length > 0) {
            this.questionsList.forEach((element, index) => {
                questionsString = questionsString.concat('\n' + (index + 1) + '.' + element);
            });
        } else {
            questionsString = questionsString.concat('No questions defined');
        }

        return 'Your lovely manager ' + this.user + ' sent you these simple questions! :D' +
                '\n' + questionsString;
    }
}

module.exports.Question = Question;
