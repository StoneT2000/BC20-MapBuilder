var DIRT = 0;
var WATER = 1;
var SOUP = 2;

var AMOUNT = 2;
var BRUSHSIZE = 12;

// brush options
var ELEVATE = 0;
var LOWER = 1;
var SOUPUP = 2;
var SOUPDOWN = 3;
var TOGGLEWATER = 4;
var MOVEREDHQ = 5;
var MOVEBLUEHQ = 6;

// brush look
var DIAMOND = 0;
var CIRCLE = 1;

var VERTICAL = 0;
var HORIZONTAL = 1;
var ROTATION = 2;

var brushType = ELEVATE;
var brushSizeType = CIRCLE;
var mapSymmetry = HORIZONTAL;

var REDTEAM = 1;
var BLUETEAM = 2;

var DIRTCOLOR = 'rgb(56,150,30)',
    WATERCOLOR = 'rgb(56,90,190)'
    REDTEAM_COLOR = 'rgb(220,92,10)';
    BLUETEAM_COLOR = 'rgb(10,92,220)';
var gameMapTiles = [];
var MAP_WIDTH = 33;
var MAP_HEIGHT = 33;

var MAP_SEED = 9999;

var bodyID = 0;
var MAP_RED_HQ;
var MAP_BLUE_HQ;
//var initialBodies = [];
var gameMap;
function addHQ(team, loc) {
  gameMap.initialBodies.push(new RobotInfo(bodyID++, team, 0, loc));
  return gameMap.initialBodies[gameMap.initialBodies.length - 1];
}

function initializeEmptyMap(width, height, symmetry) {
  MAP_WIDTH = width;
  MAP_HEIGHT = height;
  var emptyWaterArray = [];
  var emptySoupArray = [];
  var emptyDirtArray = [];
  var emptyPollutionArray = [];
  for (let i = 0; i < MAP_WIDTH * MAP_HEIGHT; i++) {
    emptyDirtArray.push(0);
    emptySoupArray.push(0);
    emptyPollutionArray.push(0);
    emptyWaterArray.push(false);
  }
  var initialWater = 0;
  gameMap = new LiveMap(
      MAP_WIDTH, MAP_HEIGHT, {x: 0, y: 0}, MAP_SEED, 10000, "newmap", [], emptySoupArray, emptyPollutionArray, emptyWaterArray, emptyDirtArray, initialWater
  );
  gameMap.redHQ = addHQ(REDTEAM, {x:10,y:10});
  mapSymmetry = symmetry;
  switch (mapSymmetry) {
    case ROTATION:
      gameMap.blueHQ = addHQ(BLUETEAM, {x:width - 1 - 10,y:height - 1 - 10});
      break;
    case VERTICAL:
      gameMap.blueHQ = addHQ(BLUETEAM, {x:10, y:height - 1 - 10});
      break;
    case HORIZONTAL:
      gameMap.blueHQ = addHQ(BLUETEAM, {x:width - 1 - 10,y:10});
      break;
  }


}
function addCow() {

}
initializeEmptyMap(33, 33, ROTATION);
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
  $("#brushType").val("Elevate");
  $("#brushmagnitude").val(AMOUNT);
  $("#brushsize").val(BRUSHSIZE);
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });
  $("#file_input").on("change", function() {
    readFile().then(function() {
      console.log("Loaded map");
      loadMapToDisplay(gameMap);
    });
  })
  $("#downloadMap").on('click', function(){
    saveMap();
  });
  $("#createMap").on('click', function() {
    let symChoice = $("#mapSymmetryChoice").val();
    switch(symChoice) {
      case "Rotation":
        mapSymmetry = ROTATION;
      break;
      case "Vertical":
        mapSymmetry = VERTICAL;
      break;
      case "Horizontal":
        mapSymmetry = HORIZONTAL;
      break;
    }
    $("#mapSymmetry").text(symChoice);
    let newWidth = parseInt($("#inputWidth").val());
    let newHeight = parseInt($("#inputHeight").val());
    $("#mapsymmetry").text(symChoice);
    $("#mapsize").text(newWidth + "x" + newHeight);
    initializeEmptyMap(newWidth, newHeight, mapSymmetry);
    loadMapToDisplay(gameMap);
  });
  // [] is initialBodies
  loadMapToDisplay(gameMap);
  $("#brushType").on("change", function() {
    switch ($("#brushType").val()) {
      case "Elevate":
        brushType = ELEVATE;
        break;
      case "Lower":
        brushType = LOWER;
        break;
      case "SoupUp":
        brushType = SOUPUP;
        break;
      case "SoupDown":
        brushType = SOUPDOWN;
        break;
      case "ToggleWater":
        brushType = TOGGLEWATER;
        break;
      case "MoveRedHQ":
      brushType = MOVEREDHQ;
        break;
      case "MoveBlueHQ":
      brushType = MOVEBLUEHQ;
        break;
    }

  });
  $("#brushsize").on("change", function() {
    BRUSHSIZE = parseInt($("#brushsize").val());
  });
  $("#brushmagnitude").on("change", function() {
    AMOUNT = parseInt($("#brushmagnitude").val());
  });

});
function loadMapToDisplay(map) {
  // clear previous map
  $(".map").html("<div class='botDisplay'><div class='castle'></div></div>");
  MAP_HEIGHT=map.height;
  MAP_WIDTH=map.width;

  // load most map data into gameMapTiles
  for (let y = MAP_HEIGHT - 1; y >= 0; y--) {
    gameMapTiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      gameMapTiles[y].push({body: null, elevation: map.dirtArray[locationToIndex(x,y)], soup: map.soupArray[locationToIndex(x,y)], element: null, water: map.waterArray[locationToIndex(x,y)]});
    }
  }
  // load bodies (units)
  for (let body of map.initialBodies) {
    gameMapTiles[body.location.y][body.location.x].body = body;
    if (body.type == 0) {
      if (body.team == BLUETEAM) {
        gameMap.blueHQ = body;
      }
      else if (body.team == REDTEAM){
        gameMap.redHQ = body;
      }
    }
  }

  // load map colors and hovers and what not
  for (let y = MAP_HEIGHT - 1; y >= 0; y--) for (let x = 0; x < MAP_WIDTH; x++) {

    $(".map").append("<div class='tile' id='" + x + "_" + y + "'><div class='soup' id='s"+ x + "_" + y +"'></div></div>")
    let tileElementSoup = $("#s" + x + "_" + y);
    tileElementSoup.css("display", "none");
    let tileElement = $("#" + x + "_" + y);
    tileElement.css('background-color', DIRTCOLOR);
    //data-toggle='tooltip' data-trigger='hover' data-title='test'
    let desc = 'E: ' + map.dirtArray[locationToIndex(x,y)] + ' | Soup: ' + map.soupArray[locationToIndex(x,y)];
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
      gameMap.waterArray[locationToIndex(x,y)] = gameMapTiles[y][x].water;
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
function changeTile(y,x, calledBySelf = false) {
  console.log("change tile " + x + ", " + y);
  switch (brushType) {
    case ELEVATE:
      bfs(x,y,BRUSHSIZE, function(tile) {
        gameMapTiles[tile.y][tile.x].elevation += AMOUNT;
        updateTile(tile.y, tile.x);
      });
      break;
    case LOWER:
      bfs(x,y,BRUSHSIZE, function(tile) {
        gameMapTiles[tile.y][tile.x].elevation -= AMOUNT;
        updateTile(tile.y, tile.x);
      });
      break;
    case SOUPUP:
      bfs(x,y,BRUSHSIZE, function(tile) {
        gameMapTiles[tile.y][tile.x].soup += AMOUNT;
        updateTile(tile.y, tile.x);
      });
      break;
    case SOUPDOWN:
      bfs(x,y,BRUSHSIZE, function(tile) {
        gameMapTiles[tile.y][tile.x].soup -= AMOUNT;
        if (gameMapTiles[tile.y][tile.x].soup < 0) {
            gameMapTiles[tile.y][tile.x].soup = 0;
        }
        updateTile(tile.y, tile.x);
      });
      break;
    case TOGGLEWATER:
      bfs(x,y,BRUSHSIZE, function(tile) {
        gameMapTiles[tile.y][tile.x].water = !gameMapTiles[tile.y][tile.x].water;
        updateTile(tile.y, tile.x);
      });
      break;
    case MOVEREDHQ:
      gameMapTiles[gameMap.redHQ.location.y][gameMap.redHQ.location.x].body = null;
      updateTile(gameMap.redHQ.location.y, gameMap.redHQ.location.x);
      gameMapTiles[y][x].body = gameMap.redHQ;
      gameMap.redHQ.location.x = x;
      gameMap.redHQ.location.y = y;
      updateTile(y, x);
      return;
      break;
    case MOVEBLUEHQ:

      gameMapTiles[gameMap.blueHQ.location.y][gameMap.blueHQ.location.x].body = null;
      updateTile(gameMap.blueHQ.location.y, gameMap.blueHQ.location.x);
      gameMapTiles[y][x].body = gameMap.blueHQ;
      gameMap.blueHQ.location.x = x;
      gameMap.blueHQ.location.y = y;
      updateTile(y, x);
      return;
      break;
  }
  updateTile(y, x);
  if (!calledBySelf) {
    changeSymmetricTile(y,x);
  }
}
function changeSymmetricTile(y,x) {
  switch (mapSymmetry) {
    case VERTICAL:
      changeTile(MAP_HEIGHT - y - 1, x, true);
      break;
    case HORIZONTAL:
      changeTile(y, MAP_WIDTH - x - 1, true);
      break;
    case ROTATION:
      changeTile(MAP_HEIGHT - y - 1, MAP_WIDTH - x - 1, true);
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
    if (brushSizeType == DIAMOND && dist(x,y,tile.x, tile.y) >= distance) {
      continue;
    }
    if (brushSizeType == CIRCLE && dist2(x,y,tile.x, tile.y) >= distance) {
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
  return 'rgb(' + (35 + (10*elevation))+', 180, 30)';
}
function updateTile(y, x) {
  let tile = gameMapTiles[y][x];
  let unitInfo = "";

  if (tile.body) {
    if (tile.body.type === 0) {
      if (tile.body.team == REDTEAM) {
          tile.element.css("background-color", REDTEAM_COLOR);
          unitInfo = "Red HQ | "
      }
      else {
        tile.element.css("background-color", BLUETEAM_COLOR);
        unitInfo = "Blue HQ | "
      }
    }
    else if (tile.body.type === 9) {
        tile.element.css("background-color", "white");
        unitInfo = "Some Cow | "
    }
  }
  else {
    if (tile.water) {
      tile.element.css("background-color", WATERCOLOR);
    }
    else {
      tile.element.css("background-color", getDirtColor(tile.elevation));
    }
  }
  if (tile.soup > 0) {
    $("#s" + x +"_" + y).css("display", "block");
  }
  else {
    $("#s" + x +"_" + y).css("display", "none");
  }

  let desc = unitInfo + 'E: ' + tile.elevation + ' | Soup: ' + tile.soup;
  let tileElement = tile.element;
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
