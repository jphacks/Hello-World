judgeApp.controller("Controller", Controller);

function Controller($scope,$http,$window,$rootScope) {

	$scope.init = function (){
		console.log("init");
    $scope.team = [
      {
        name : "KIM",
        img : "/img/avatar1.png",
        url : "https://github.com/kdrl",
        id : "kdrl"
      },
      {
        name : "###",
        img : "/img/avatar2.png",
        url : "https://github.com/mmitti",
        id : "mmitti"
      },
      {
        name : "SHIBATA",
        img : "/img/avatar3.png",
        url : "https://github.com/wezard706",
        id : "wezard706"
      },
      {
        name : "SAKAI",
        img : "/img/avatar4.png",
        url : "https://github.com/sakaihiroyuki",
        id : "sakaihiroyuki"
      }
    ];
		$scope.labels =["0","10","20","30","40","50","60","70","80","90","100"];
	  $scope.data = [[0,0,0,0,0,0,0,0,0,0,0]];
		$scope.labels2 =["80-100","60-80","40-60","20-40","0-20"];
	  $scope.data2 = [0,0,0,0,0];
	  $scope.options = {
			scales: {
					xAxes: [{
							ticks: {
									beginAtZero:true,
									max:100
							}
					}],
	        yAxes: [{
	            ticks: {
	                beginAtZero:true,
									max:90
	            }
	        }]
        }
		}

		$scope.status = false;
	}

	$scope.init();

  $scope.searchWithText = function(){
    if(!$scope.text){
      console.log("ERROR no text!");
    }else{
			$scope.status = false;
			$scope.data = [[0,0,0,0,0,0,0,0,0,0,0]];
			$scope.data2 = [0,0,0,0,0];
			Materialize.fadeInImage('#result');
      $http.post("http://judge.japaneast.cloudapp.azure.com/api/text", {
        text : $scope.text
      })
     .then(
         function(response){
           // success callback
           $scope.success(response);
         },
         function(response){
           // failure callback
           $scope.fail(response);
         }
      );
    }
  }

  $scope.searchWithImage = function(){
    if(!$scope.text || !$scope.image){
      console.log("ERROR no text or image!");
    }else{
			$scope.status = false;
			$scope.data = [[0,0,0,0,0,0,0,0,0,0,0]];
			$scope.data2 = [0,0,0,0,0];
			Materialize.fadeInImage('#result');
      $http.post("http://judge.japaneast.cloudapp.azure.com/api/picture", {
        text : $scope.text,
        image : $scope.image
      })
     .then(
         function(response){
           // success callback
           $scope.success(response);
         },
         function(response){
           // failure callback
           $scope.fail(response);
         }
      );
    }
  }

  $scope.success = function(response){
		Materialize.toast('SUCCESS!', 4000);
    console.log(response);
    $scope.result = response.data;
		$scope.status = true;

		for(let d in response.data.individual_detail){
			let d_num = response.data.individual_detail[d];

			$scope.data[0].push(d_num);
			//data
			if(d_num>95){
				$scope.data[0][10]++;
			}else if(d_num>85){
				$scope.data[0][9]++;
			}else if(d_num>75){
				$scope.data[0][8]++;
			}else if(d_num>65){
				$scope.data[0][7]++;
			}else if(d_num>55){
				$scope.data[0][6]++;
			}else if(d_num>45){
				$scope.data[0][5]++;
			}else if(d_num>35){
				$scope.data[0][4]++;
			}else if(d_num>25){
				$scope.data[0][3]++;
			}else if(d_num>15){
				$scope.data[0][2]++;
			}else if(d_num>5){
				$scope.data[0][1]++;
			}else{
				$scope.data[0][0]++;
			}
			//data2
			if(d_num>=80){
				$scope.data2[0]++;
			}else if(d_num>=60){
				$scope.data2[1]++;
			}else if(d_num>=40){
				$scope.data2[2]++;
			}else if(d_num>=20){
				$scope.data2[3]++;
			}else{
				$scope.data2[4]++;
			}
		}
  }

  $scope.fail = function(response){
		Materialize.toast('FAIL!', 4000);
    console.log(response);
  }

}
