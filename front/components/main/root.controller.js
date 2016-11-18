export default class rootController {
  constructor($scope,$state) {
    this.$scope = $scope;
    this.$state = $state;
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
          console.log("hi")
        }
        if(this.placeholderIndex == this.placeholderData.length){
          clearTimeout(this.timeout_job);
          this.timeout_job = null;
          this.placeholder = "Enter your room key";
        };
      });
      return this.update();
    },100);
  };
  enterRoom(){
    if(this.roomName){
      this.$state.go("root.room",{"roomKey": this.roomName});
    }else{
      console.log("there is no room key!")
    }
  }
}
