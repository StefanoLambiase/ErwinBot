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

    /**
     * Return the list of possible solutions to the problem as a formatted string.
     */
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

    /**
     * Return the object informations as an HTML formatted string.
     */
    getAsHTMLString() {
        // Create the solutions sub-string.
        let solutionsString = '';
        if (this.problemPossibilities.length > 0) {
            solutionsString = '<ol>';
            this.problemPossibilities.forEach((item, index) => {
                solutionsString = solutionsString.concat('<li> ' + item + '</li>');
            });
            solutionsString = solutionsString.concat('</ol>');
        } else {
            solutionsString = solutionsString.concat('<p>    No solutions</p>');
        }

        const s = '<h2>Ticket information</h2>' +
            '<p><strong>Team member name:</strong> ' + this.user + '</p>' +
            '<p><strong>Problem definition:</strong> ' + this.problemDefinition + '</p>' +
            '<p><strong>Problem cause:</strong> ' + this.problemCause + '</p>' +
            '<p><strong>Possible solutions:</strong></p> ' + solutionsString +
            '<p><strong>Favourite solution:</strong> ' + this.problemSolution + '</p>';

        return s;
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
