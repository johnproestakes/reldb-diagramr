var PaperHelperClass= function(paper){
  this.paper = paper;
};
PaperHelperClass.prototype.drawX = function(start, end){

  var left = new paper.Path.Rectangle(end, new paper.Size(6, 18));
  var right = new paper.Path.Rectangle(end, new paper.Size(6, 18));
  left.rotate(-45);
  right.rotate(45);
  var b = left.unite(right);
  b.position.x = b.position.x-3;
  b.position.y = b.position.y-9;
  b.fillColor = 'red';
  b.strokeColor = 'white';
  b.strokeWidth = 3;

  return b;
};
PaperHelperClass.prototype.drawArrow = function(end, direction, rotation){
  if(rotation===undefined) rotation = 0;
  var arr = new this.paper.Path();
  var offset = 0;
  if(direction=="left") {
    arr.moveTo([end.x-6,end.y-6]);
    arr.lineTo([end.x, end.y]);
    arr.lineTo([end.x-6,end.y+6]);
  } else {
    arr.moveTo([end.x+6, end.y-6]);
    arr.lineTo([end.x, end.y]);
    arr.lineTo([end.x+6, end.y+6]);
  }
  arr.strokeWidth = 2;
  arr.closed = true;
  arr.strokeColor = "#545454";
  arr.fillColor= "#545454";
  return arr;
};
PaperHelperClass.prototype.drawEndPoint = function(end){
  var stCircle = new paper.Path.Circle(end, 5);
  stCircle.fillColor = '#545454';
  return stCircle;
};
PaperHelperClass.prototype.drawLineBtwnPoints = function(start, end){
  var side = start.x < end.x ? "left" : "right";
  var seg1 = new paper.Segment(
    start, null,
    new paper.Point(
      (side=="left" ? 1 : -1) * Math.abs(start.y-end.y)/2, 0 )
  );
  var seg2 = new paper.Segment(
    end,
    new paper.Point(
      (side=="left" ? -1 : 1)*
      Math.abs(end.y-start.y)/2,0 ),
      null);
      var path = new paper.Path(seg1,seg2)
      path.strokeColor = '#545454';
      path.strokeWidth = 3;
  return path;
};
PaperHelperClass.prototype.getHtmlNodeBounds = function(el){
  var output = {
    width: el.parent().width(),
    height: el.height(),
    x: el.offset().left,
    y: el.offset().top
  };
  return output;
};
