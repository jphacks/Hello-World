var diff = require('diff');
class jsDiff {
	// Create an instance so that we can access this inside link
  static jsDiffService() {
    return diff;
  }
}

// Inject dependencies
jsDiff.jsDiffService.$inject = ["$window"];

export default jsDiff.jsDiffService;