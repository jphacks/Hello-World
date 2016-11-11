class onReadFile {
  /*@ngInject*/
  constructor($parse) {
    this.restrict = 'A';
    this.scope = false;
    // etc. for the usual config options

    // allows us to use the injected dependencies
    // elsewhere in the directive (e.g. compile or link function)
    this.$parse = $parse;
  }

  // optional link function
  link(scope, element, attrs) {
		var fn = this.$parse(attrs.onReadFile);
		element.on('change', (onChangeEvent) => {
			var reader = new FileReader();
			reader.onload = function(onLoadEvent) {
				scope.$apply(function() {
          console.log("$$$$",onChangeEvent,onLoadEvent)
          //fileを読んでから、最後の.以後の格調しのところは除去する
          var fileName = onChangeEvent.target.files[0].name;
          var lastIndex = fileName.lastIndexOf(".");
          fileName = fileName.substring(0, lastIndex);
					fn(scope, {$fileContent:{
            "name" : fileName,
            "content" : onLoadEvent.target.result
          }});
				});
			};
			reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
		});
  }

	// Create an instance so that we can access this inside link
  static directiveFactory($parse) {
      onReadFile.instance = new onReadFile($parse);
      return onReadFile.instance;
  }
}

// Inject dependencies
onReadFile.directiveFactory.$inject = ["$parse"];

export default onReadFile.directiveFactory;