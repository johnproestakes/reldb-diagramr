angular.module("RelDBDiagramr",["ngSanitize"])
.controller("MainController", ["$scope",function($scope){
  $scope.hello ="YES";

  $scope.inputCode = `Table content_lib {
  id int
  url varchar
  tags varchar
  description varchar
  validity boolean
  status varchar
  created_at varchar
}
Table products {
  id int
  user_id int
  status varchar
  created_at varchar
}

Position: content_lib 368, 156

Position: products 144, 130

Link: products.id > content_lib.id`;
var PaperHelpers;
var Workspace = function(text, $scope){
  var _this = this;
  this.$scope = $scope;
  this.tables = [];
  this.connections = [{
    t1: "content_lib.id",
    t2:"products.id",
    type:"left_join"
  }];
  this.positions = {};
  this.__tablePattern = /Table\s(.*)\s+{((.|\n)*?)}/gm;
  this.connectionTypes=[{type: "left_join",  symbol: ">"},
    {type: "right_join",  symbol: "<"},
    {type: "inner_join",  symbol: "="}];

  this.setupCanvas(function(){
    _this.$scope.$apply(function(){
      _this.updateInputText(_this.$scope.inputCode);
      _this.drawConnections();
    });

  });

};
Workspace.prototype.setupCanvas = function(complete){

  var _this = this;
  var debounce = null;
  var onWindowResize = function(){
    clearTimeout(debounce);
    var canvas = document.getElementById('maincanvas');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    debounce= setTimeout(function(){
      canvas.style.height = "100%";
      canvas.style.width = "100%";
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      setTimeout(function(){
        _this.drawConnections();
      },10);
    },100);

  };
  $(window).ready(function(){
    var canvas = document.getElementById('maincanvas');
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    paper.setup(canvas);
    PaperHelpers = new PaperHelperClass(paper);
    $(window).on("resize", onWindowResize);
    onWindowResize();
    complete();
  })
};

Workspace.prototype.drawConnections = function(){
  paper.project.activeLayer.removeChildren();
  this.connections.forEach(function(xtion){
    var t1 = $("#field--"+xtion.t1.replace(".", "--"));
    var t2 = $("#field--"+xtion.t2.replace(".", "--"));

    if(t1.length>0 && t2.length>0){
      var off1 = 0, off2=0;


      var el1, el2;
      el1 = PaperHelpers.getHtmlNodeBounds(t1);
      el2 = PaperHelpers.getHtmlNodeBounds(t2);

      var parentContainerLeft = $('#right').offset().left;
      var start = new paper.Point(
        el1.x - parentContainerLeft + (el1.x < el2.x ? el1.width : 0 ),
        el1.y + el1.height*1/2);
      var end = new paper.Point(
        el2.x- parentContainerLeft + (el1.x < el2.x ? 0 : el2.width ),
        el2.y+ el2.height*1/2);

      var side = start.x < end.x ? "left" : "right";
      PaperHelpers.drawLineBtwnPoints(start, end);

      if(xtion.type=="left_join"){
        PaperHelpers.drawArrow(end, side);
        PaperHelpers.drawEndPoint(start);
      } else if (xtion.type=="right_join") {
        var a = PaperHelpers.drawArrow(start, side);
        a.rotate(180);
        a.position = [start.x+ (3 *(start.x<end.x ? 1 : -1)),start.y];
        paper.view.draw();
        PaperHelpers.drawEndPoint(end);
      } else {
        PaperHelpers.drawEndPoint(start);
        PaperHelpers.drawEndPoint(end);
      }

    }

  });
  paper.view.draw();
};
Workspace.prototype.exportTableText = function(){
  var output = [];
  var position = [];
  var connections = [];
  var _this = this;
  _this.connections.forEach(function(connection){
    var xtion = _this.connectionTypes.filter(function(i){ return i.type==connection.type});
    if(xtion[0]){
      connections.push("Link: " + connection.t1 + " " + xtion[0].symbol + " " + connection.t2);
    }

  });
  _this.tables.forEach(function(table){
    var fields = [];
    table.fields.forEach(function(field){
      fields.push("  "+field.name+" "+field.type);
    });

    position.push("Position: " + table.name.trim() + " " + Math.round(table.positionx) + ", " + Math.round(table.positiony))
    output.push("Table " + table.name.trim() + " {\n" +fields.join("\n") + "\n}");
  });

  return output.join("\n") + "\n\n" + position.join("\n\n") + "\n\n" + connections.join("\n\n");
};
Workspace.prototype.updateInputText = function(s){

  //find positions first;
  var posRe = /Position: (.*) (-?[0-9]{1,}), (-?[0-9]{1,})/g;
  do {
      m = posRe.exec(s);
      if (m) {
          this.positions[m[1]] = {x: parseInt(m[2]), y: parseInt(m[3])};
          // console.log(m[1], m[2]);
      }
  } while (m);

  var linkRe = /Link: ([^\s]*) ([^\s]*) ([^\s]*)/g;
  this.connections = [];
  do {
      m = linkRe.exec(s);
      if (m) {
        var xtion = this.connectionTypes.filter(function(i){ return i.symbol==m[2]})[0];
          this.connections.push({t1: m[1], t2: m[3],type: xtion.type });
          // console.log(m[1], m[2]);
      }
  } while (m);


  this.tables = [];
  var m;
  console.log("updated")
  do {
      m = this.__tablePattern.exec(s);
      if (m) {

          this.tables.push(new TableClass(m[1],m[2],this))
          // console.log(m[1], m[2]);
      }
  } while (m);
  var _this = this;
  setTimeout(function(){
    _this.drawConnections();
  },100);
};

var TableClass = function(name, blob,parent){
  this.name = name;
  this.fields = [];
  this.parent = parent;
  if(this.parent.positions.hasOwnProperty(this.name)){
    this.positionx = parseInt(this.parent.positions[this.name].x);
    this.positiony = parseInt(this.parent.positions[this.name].y);
  } else {
    this.positionx = Math.random() * (window.innerWidth - 300);
    this.positiony = Math.random() * (window.innerHeight - 300);
  }


  this.__fieldPattern = /([^\s]*)\s([^\s]*)/i;
  var _this = this;
  blob.split("\n").forEach(function(a){
    if(_this.__fieldPattern.test(a) && a.trim().length>0){
      _this.fields.push(new FieldClass(a, _this));
    }
  });
};
TableClass.prototype.updatePosition = function(x,y){

  this.parent.positions[this.name]={x:x, y: y};
  this.positionx = x;
  this.positiony = y;
  console.log(this.parent.positions[this.name]);
  this.parent.$scope.inputCode = this.parent.exportTableText();
  this.parent.drawConnections();
};

var FieldClass = function(field, parent){
  this.connections=[];
  field = field.trim();

  var m = parent.__fieldPattern.exec(field);
  if(m){
    this.name=m[1];
    this.type=m[2];
    this.id = "field--" + parent.name.replace(/\s/g,"_")+"--"+m[1].replace(/\s/g,"_");
  }

}



var debounce = null;
$scope.updateText = function(){
  clearTimeout(debounce);
  debounce = setTimeout(function(){
    $scope.$apply(function(){
      $scope.workspace.updateInputText($scope.inputCode)
      $scope.inputCode = $scope.workspace.exportTableText();
    });

  }, 3000);

};


$scope.workspace = new Workspace($scope.inputCode, $scope);


$scope.drawConnections = function(){
  console.warn("STOP")
};



}]);
angular.module("RelDBDiagramr").directive("codeEditor", ["$timeout", function($timeout){
  return {
    restrict: "E",
    scope: {content: "=",ontextupdated:"&"},
    template: `<div class="code-editor">
    <div class="rendered-code" ng-bind-html="code_render"></div>
    <textarea autocomplete="off" autocorrect="off" autocapitalize="off" ng-keyup="updateText()" spellcheck="false" rows="10" ng-model="content" ng-change="ontextupdated()" ></textarea>
    </div>`,
    link: function(scope, el, attr){
      scope.updateText = function(){


        scope.code_render = scope.content.replace(/Table\s(.*)(\s+){((.|\n)*?)}/gm, "<span class='method'>Table</span> <span>$1</span>$2{$3}");
        scope.code_render = scope.code_render.replace(/\n/g, "<br/>").replace(/\s\s/g,"&nbsp;&nbsp;");
      };
      $timeout(function(){
        scope.updateText();
        $(el).find("textarea").on('scroll', function(){

          $(el).find(".rendered-code").scrollTop($(this).scrollTop());
        });

        scope.$on("$destroy", function(){
          //destroy
        });
      });
    }
  }
}]);
angular.module("RelDBDiagramr").directive("tblClass", ["$timeout", function($timeout){
  return {
    restrict: "A",
    scope: {table:"=", positionx:"=", positiony:"=",workspace:"="},
    link: function(scope, el, attr){
      $timeout(function(){
        el[0].style.position = "absolute"
        el[0].style.left = Math.max(scope.positionx,0) + "px";
        el[0].style.top = Math.max(scope.positiony,0) + "px";
        //$(el).attr("draggable", "true");

        var offsetx= 0,offsety= 0,isdragging= false;
        $(el).on("mousedown", function(evt){
          if(evt.target.className.indexOf("handle")>-1){
            isdragging = true;
            offsetx = evt.offsetX;
            offsety = evt.offsetY;
          } else {
            offsetx= 0;
            offsety= 0;
          }


        });
        $("#right").on("mousemove", function(evt){
          if(isdragging){
            el[0].style.left = Math.max(0,((evt.pageX - offsetx) - $("#maincanvas").offset().left)) + "px";
            el[0].style.top = Math.max(0,(evt.pageY - offsety)) + "px";
            scope.workspace.drawConnections();
          }

          return false;
        });
        $(el).on("mouseup", function(evt){
          if(isdragging){
            var newPositionX = Math.max(0,((evt.pageX- offsetx) - $("#right").offset().left));
            var newPositionY = (evt.pageY-offsety);
            el[0].style.left =  newPositionX + "px";
            el[0].style.top = newPositionY + "px";
            offsetx= 0;
            offsety= 0;
            isdragging=false;

            scope.$apply(function(){
              scope.table.updatePosition(newPositionX,newPositionY);
              scope.workspace.drawConnections();
            });
          }




          return false;
        })
      });

    }
  };
}]);
