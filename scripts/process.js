var DIRT = 0;
var WATER = 1;
var SOUP = 2;

var SOUPAMOUNT = 100;
var BRUSHSIZE = 12;

// brush options
var ELEVATE = 0;
var LOWER = 1;
var SOUPUP = 2;

// brush look
var DIAMOND = 0;
var CIRCLE = 1;

var VERTICAL = 0;
var HORIZONTAL = 1;
var ROTATION = 2;

var brushType = ELEVATE;
var brushSizeType = CIRCLE;
var mapSymmetry = HORIZONTAL;

var DIRTCOLOR = 'rgb(56,150,30)',
    WATERCOLOR = 'rgb(56,90,190)'
var gameMapTiles = [];
var MAP_WIDTH = 32;
var MAP_HEIGHT = 32;
var gameMap;
async function readFile() {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader(); // This example uses the HTML5 FileReader.
    var file = document.getElementById(
        'file_input').files[0]; // "monster.dat" from the HTML <input> field.
    reader.onload = function() { // Executes after the file is read.
      var data = new Uint8Array(reader.result);
      var buf = new flatbuffers.ByteBuffer(data);
      let gameMapRaw = battlecode.schema.GameMap.getRootAsGameMap(buf)
      gameMap = deserializeRawMap(gameMapRaw);
      resolve(gameMap);
    }
    reader.readAsArrayBuffer(file);
  });
}
$(document).ready(function () {

  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });
  $("#file_input").on("change", function() {
    readFile().then(function() {
      console.log("Loaded map");
      loadMapToDisplay(gameMap);
    });
  })

});
function loadMapToDisplay(map) {
  $(".map").html("<div class='botDisplay'><div class='castle'></div></div>");
  MAP_HEIGHT=map.height;
  MAP_WIDTH=map.width;
  console.log(gameMap.dirtArray[locationToIndex(34,28)]);
  for (let y = MAP_HEIGHT - 1; y >= 0; y--) {
    gameMapTiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      gameMapTiles[y].push({elevation: map.dirtArray[locationToIndex(x,y)], soup: map.soupArray[locationToIndex(x,y)], element: null});
    }
  }
  console.log(gameMap.dirtArray[locationToIndex(34,28)]);
  for (let y = MAP_HEIGHT - 1; y >= 0; y--) for (let x = 0; x < MAP_WIDTH; x++) {

    $(".map").append("<div class='tile' id='" + x + "_" + y + "'><div class='soup' id='s"+ x + "_" + y +"'></div></div>")
    let tileElementSoup = $("#s" + x + "_" + y);
    tileElementSoup.css("display", "none");
    let tileElement = $("#" + x + "_" + y);
    tileElement.css('background-color', DIRTCOLOR);
    //data-toggle='tooltip' data-trigger='hover' data-title='test'
    let desc = 'E: ' + map.dirtArray[locationToIndex(x,y)] + ' | S: ' + map.soupArray[locationToIndex(x,y)];
    gameMapTiles[y][x].element = tileElement;
    tileElement.attr('data-toggle','tooltip');
    tileElement.attr('data-trigger','hover');
    tileElement.attr('data-title',desc + ' (' + x + ', ' + y + ')');
    tileElement.on("click", function() {
      changeTile(y, x);
    });
    updateTile(y, x);
  }
  var draw_width = 20;
  var draw_height = 20;
  $(".tile").css('width', draw_width + "px");
  $(".tile").css('height', draw_height + "px");
  $(".map").css("width", 20 * map.width);
  $(".map").css("height", 20 * map.height);
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });
}
function saveMap() {
  // go through edits on gameMapTiles
  // and put themin gameMap2
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      gameMap.dirtArray[locationToIndex(x,y)] = gameMapTiles[y][x].elevation;
      gameMap.soupArray[locationToIndex(x,y)] = gameMapTiles[y][x].soup;
      gameMap.waterArray[locationToIndex(x,y)] = gameMapTiles[y][x].elevation > 0 ? false : true;
    }
  }
  gameMap.mapName = "newmap";
  console.log(gameMap.getMapName());
  var bytes = serializeMap(gameMap);
  saveByteArray([bytes], 'newmap.map20');
}
function saveByteArray(data, name) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
      var blob = new Blob(data, {type: "octet/stream"}),
          url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
};


function dist(x1,y1,x2,y2) {
  return Math.abs(x2-x1) + Math.abs(y2 -y1);
}
function dist2(x1,y1,x2,y2) {
  return (x2-x1)*(x2-x1) + (y2 - y1)*(y2-y1);
}
function changeTile(y,x) {
  switch (brushType) {
    case ELEVATE:
      bfs(x,y,BRUSHSIZE, function(tile) {
        gameMapTiles[tile.y][tile.x].elevation += 1;
        updateTile(tile.y, tile.x);
      });
      break;
    case LOWER:
      bfs(x,y,BRUSHSIZE, function(tile) {
        gameMapTiles[tile.y][tile.x].elevation -= 1;
        updateTile(tile.y, tile.x);
      });
      break;
    case SOUPUP:

      break;
  }
  updateTile(y, x);
  //changeSymmetricTile(y,x);
}
function changeSymmetricTile(y,x) {
  switch (mapSymmetry) {
    case VERTICAL:
      changeTile(MAP_HEIGHT - y, x);
    break;
    case HORIZONTAL:
      changeTile(y, MAP_WIDTH - x);
    break;
    case ROTATION:
      changeTile(MAP_HEIGHT - y, MAP_WIDTH - x);
    break;
  }
}
function bfs(x, y, distance, func) {
  let queue = [{x: x, y: y}];
  let visited = new Set();
  while (queue.length) {

    let tile = queue.shift();

    if (tile.x < 0 || tile.y < 0 || tile.y >= MAP_HEIGHT || tile.x >= MAP_WIDTH || visited.has(locationToIndex(tile.x,tile.y))) {
      continue;
    }
    if (brushSizeType == DIAMOND && dist(x,y,tile.x, tile.y) > distance) {
      continue;
    }
    if (brushSizeType == CIRCLE && dist2(x,y,tile.x, tile.y) > distance) {
      continue;
    }

    visited.add(locationToIndex(tile.x,tile.y));
    queue.push({x: tile.x+1, y: tile.y});
    queue.push({x: tile.x, y: tile.y+1});
    queue.push({x: tile.x-1, y: tile.y});
    queue.push({x: tile.x, y: tile.y-1});
    func(Object.assign({}, tile));
  }
}

function getDirtColor(elevation) {
  return 'rgb(' + (16 + (15*elevation))+', 180, 30)';
}
function updateTile(y, x) {
  if (gameMapTiles[y][x].elevation < 0) {
    gameMapTiles[y][x].element.css("background-color", WATERCOLOR);
  }
  else {
    gameMapTiles[y][x].element.css("background-color", getDirtColor(gameMapTiles[y][x].elevation));
  }
  if (gameMapTiles[y][x].soup > 0) {
    $("#s" + x +"_" + y).css("display", "block");
  }
  let desc = 'E: ' + gameMapTiles[y][x].elevation + ' | S: ' + gameMapTiles[y][x].soup;
  let tileElement = gameMapTiles[y][x].element;
  //tileElement.attr('data-toggle','tooltip');
  //tileElement.attr('data-trigger','hover');
  tileElement.attr('data-original-title',desc + ' (' + x + ', ' + y + ')');
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });

}
function locationToIndex(x, y) {
    return x + y * MAP_WIDTH;
}
