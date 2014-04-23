/**
 * @name escapeRegex:
 */
exports.escapeRegex = function (input) {
    return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};