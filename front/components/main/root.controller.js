export default class rootController {
  constructor($scope) {
    this.$scope = $scope;
    this.roomName = "";
    this.placeholderData = ["E","n","t","e","r"," ","y","o","u","r"," ","r","o","o","m"," ","k","e","y"];
    this.placeholderIndex = 0;
    this.placeholder = "";
    this.update();
  };
  update(){
    this.timeout_job = setTimeout(()=>{
      this.$scope.$apply(() => {
        if (this.placeholderIndex < this.placeholderData.length) {
          this.placeholder += this.placeholderData[this.placeholderIndex];
          this.placeholderIndex++;
        }
        if(this.placeholderIndex == this.placeholderData.length){
          // this.placeholderIndex = 0;
          clearTimeout(this.timeout_job);
          console.log(this.timeout_job);
          this.timeout_job = null;
          this.placeholder = "Enter your room key";
        };
      });
      return this.update();
    },100);
  };
  clear(){
    if(this.timeout_job !== null){
    	// setTimeout() メソッドの動作をキャンセルする
    	clearTimeout(this.timeout_job);
    	this.timeout_job = null;
    };
  }
}
