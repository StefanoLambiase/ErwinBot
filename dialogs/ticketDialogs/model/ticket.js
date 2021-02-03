/**
 * @description Rapresents the ticket to send to the manager.
 */
class Ticket {
    constructor(user, problemDefinition, problemCause, problemPossibilities, problemSolution) {
        this.user = user;
        this.problemDefinition = problemDefinition;
        this.problemCause = problemCause;
        this.problemPossibilities = problemPossibilities;
        this.problemSolution = problemSolution;
    }

    getPossibilitiesAsString() {
        // Create the solutions sub-string.
        let solutionsString = '';
        if (this.problemPossibilities.length > 0) {
            this.problemPossibilities.forEach((item, index) => {
                solutionsString = solutionsString.concat('\n  ' + (index + 1) + '. ' + item);
            });
        } else {
            solutionsString = solutionsString.concat('\nNo solutions');
        }
        return solutionsString;
    }

    toString() {
        // Create the solutions sub-string.
        let solutionsString = '';
        if (this.problemPossibilities.length > 0) {
            this.problemPossibilities.forEach((item, index) => {
                solutionsString = solutionsString.concat('\n  ' + (index + 1) + '. ' + item);
            });
        } else {
            solutionsString = solutionsString.concat('\nNo solutions');
        }

        const s = 'User name: ' + this.user +
            '\nProblem definition: ' + this.problemDefinition +
            '\nProblem cause: ' + this.problemCause +
            '\nPossible solutions: ' + solutionsString +
            '\nFavourite solution: ' + this.problemSolution;

        return s;
    }
}

module.exports.Ticket = Ticket;
