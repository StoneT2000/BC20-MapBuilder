/*
const fs = require('fs');
var flatbuffers = require('./flatbuffers').flatbuffers;
//var MyGame = require('./WaterBot.map20').MyGame;

var battlecode = require('./battlecode_generated').battlecode;

var data = new Uint8Array(fs.readFileSync('./WaterBot.map20'));
var buf = new flatbuffers.ByteBuffer(data);
let gameMap = battlecode.schema.GameMap.getRootAsGameMap(buf)
*/
function serializeMap(map) {
  let builder = new flatbuffers.Builder();

  // serialize with builder
  let mapRef = serializeMapWithBuilder(builder, map);
  builder.finish(mapRef);

  let buf = builder.asUint8Array();
  // write this buffer to disk or return to user, it is our .map20 file
  return buf;
}

// map: LiveMap
function serializeMapWithBuilder(builder, gameMap) {
  let name = builder.createString(gameMap.getMapName());
  let randomSeed = gameMap.getSeed();
  let soupArray = gameMap.getSoupArray();
  let pollutionArray = gameMap.getPollutionArray();
  let waterArray = gameMap.getWaterArray();
  let dirtArray = gameMap.getDirtArray();
  let waterLevel = gameMap.getWaterLevel();
  // Make body tables
  let bodyIDs = []; //new ArrayList<>();
  let bodyTeamIDs = []; //new ArrayList<>();
  let bodyTypes = []; //new ArrayList<>();
  let bodyLocsXs = []; //new ArrayList<>();
  let bodyLocsYs = []; //new ArrayList<>();
  let soupArrayList = []; //new ArrayList<>();
  let pollutionArrayList = []; //new ArrayList<>();
  let waterArrayList = []; //new ArrayList<>();
  let dirtArrayList = []; //new ArrayList<>();

  for (let i = 0; i < gameMap.getWidth() * gameMap.getHeight(); i++) {
      soupArrayList.push(soupArray[i]);
      pollutionArrayList.push(pollutionArray[i]);
      waterArrayList.push(waterArray[i]);
      dirtArrayList.push(dirtArray[i]);
  }

// FIXME:
  // gameMap.getInitialBodies(); make this function
  for (let robot of gameMap.initialBodies) {
    bodyIDs.push(robot.ID);
    bodyTeamIDs.push(TeamMapping.id(robot.team));
    bodyTypes.push(FlatHelpers.getBodyTypeFromRobotType(robot.type));
    bodyLocsXs.push(robot.location.x);
    bodyLocsYs.push(robot.location.y);
  }

  //what are ArrayUtils.toPrimitive(bodyIDs.toArray(new Integer[bodyIDs.size()]))??
  let robotIDs = battlecode.schema.SpawnedBodyTable.createRobotIDsVector(builder, bodyIDs);//ArrayUtils.toPrimitive(bodyIDs.toArray(new Integer[bodyIDs.size()])));
  let teamIDs = battlecode.schema.SpawnedBodyTable.createTeamIDsVector(builder, bodyTeamIDs);//ArrayUtils.toPrimitive(bodyTeamIDs.toArray(new Byte[bodyTeamIDs.size()])));
  let types = battlecode.schema.SpawnedBodyTable.createTypesVector(builder, bodyTypes); //ArrayUtils.toPrimitive(bodyTypes.toArray(new Byte[bodyTypes.size()])));
  let locs = battlecode.schema.VecTable.createVecTable(builder, bodyLocsXs, bodyLocsYs);
          //battlecode.schema.VecTable.createXsVector(builder, ArrayUtils.toPrimitive(bodyLocsXs.toArray(new Integer[bodyLocsXs.size()]))),
          //battlecode.schema.VecTable.createYsVector(builder, ArrayUtils.toPrimitive(bodyLocsYs.toArray(new Integer[bodyLocsYs.size()]))));
  battlecode.schema.SpawnedBodyTable.startSpawnedBodyTable(builder);
  battlecode.schema.SpawnedBodyTable.addRobotIDs(builder, robotIDs);
  battlecode.schema.SpawnedBodyTable.addTeamIDs(builder, teamIDs);
  battlecode.schema.SpawnedBodyTable.addTypes(builder, types);
  battlecode.schema.SpawnedBodyTable.addLocs(builder, locs);
  let bodies = battlecode.schema.SpawnedBodyTable.endSpawnedBodyTable(builder);
  let soupArrayInt = battlecode.schema.GameMap.createSoupVector(builder, soupArrayList);//ArrayUtils.toPrimitive(soupArrayList.toArray(new Integer[soupArrayList.size()])));
  let pollutionArrayInt = battlecode.schema.GameMap.createPollutionVector(builder, pollutionArrayList);//ArrayUtils.toPrimitive(pollutionArrayList.toArray(new Integer[pollutionArrayList.size()])));
  let waterArrayInt = battlecode.schema.GameMap.createWaterVector(builder, waterArrayList);//ArrayUtils.toPrimitive(waterArrayList.toArray(new Boolean[waterArrayList.size()])));
  let dirtArrayInt = battlecode.schema.GameMap.createDirtVector(builder, dirtArrayList);//ArrayUtils.toPrimitive(dirtArrayList.toArray(new Integer[dirtArrayList.size()])));
  // Build LiveMap for flatbuffer
  battlecode.schema.GameMap.startGameMap(builder);
  battlecode.schema.GameMap.addName(builder, name);
  battlecode.schema.GameMap.addMinCorner(builder, battlecode.schema.Vec.createVec(builder, gameMap.getOrigin().x, gameMap.getOrigin().y));
  battlecode.schema.GameMap.addMaxCorner(builder, battlecode.schema.Vec.createVec(builder, gameMap.getOrigin().x + gameMap.getWidth(),
          gameMap.getOrigin().y + gameMap.getHeight()));
  battlecode.schema.GameMap.addBodies(builder, bodies);
  battlecode.schema.GameMap.addRandomSeed(builder, randomSeed);
  battlecode.schema.GameMap.addSoup(builder, soupArrayInt);
  battlecode.schema.GameMap.addPollution(builder, pollutionArrayInt);
  battlecode.schema.GameMap.addWater(builder, waterArrayInt);
  battlecode.schema.GameMap.addDirt(builder, dirtArrayInt);
  battlecode.schema.GameMap.addInitialWater(builder, waterLevel);
  return battlecode.schema.GameMap.endGameMap(builder);
}


function deserializeRawMap(raw) {
    let width = raw.maxCorner().x() - raw.minCorner().x(); // FIXME POSSIBLY A FLOAT
    let height = raw.maxCorner().y() - raw.minCorner().y();
    let origin = {x: raw.minCorner().x(), y: raw.minCorner().y()};//new MapLocation((int) raw.minCorner().x(), (int) raw.minCorner().y());
    let seed = raw.randomSeed();
    let rounds = 100000; //GameConstants.GAME_MAX_NUMBER_OF_ROUNDS;
    let mapName = raw.name();
    let initialWater = raw.initialWater();
    let soupArray = []; //new int[width * height];
    let pollutionArray = []; //new int[width * height];
    let waterArray = []; //new boolean[width * height];
    let dirtArray = []; //new int[width * height];
    for (let i = 0; i < width * height; i++) {
        soupArray[i] = raw.soup(i);
        pollutionArray[i] = raw.pollution(i);
        waterArray[i] = raw.water(i);
        dirtArray[i] = raw.dirt(i);
    }
    let initBodies = []; //new ArrayList<>();ArrayList<RobotInfo>
    let bodyTable = raw.bodies(); // SpawnedBodyTable
    initInitialBodiesFromSchemaBodyTable(bodyTable, initBodies);

    let initialBodies = initBodies; //initBodies.toArray(new RobotInfo[initBodies.size()]);

    return new LiveMap(
        width, height, origin, seed, rounds, mapName, initialBodies,
        soupArray, pollutionArray, waterArray, dirtArray, initialWater
    );
}

// initialBodies = RobotInfo[]
function LiveMap(width, height, origin, seed, rounds, mapName, initialBodies,
soupArray, pollutionArray, waterArray, dirtArray, initialWater) {
  this.width = width;
  this.height = height;
  this.origin = origin;
  this.seed = seed;
  this.rounds = rounds;
  this.mapName = mapName;
  this.initialBodies = Object.assign([], initialBodies); //Arrays.copyOf(initialBodies, initialBodies.length);
  this.soupArray = []; //new int[width * height];
  this.pollutionArray = []; //new int[width * height];
  this.waterArray = []; // new boolean[width * height];
  this.dirtArray = []; //new int[width * height];

  this.waterLevel = initialWater;

  for (let i = 0; i < soupArray.length; i++) {
      this.soupArray[i] = soupArray[i];
      this.pollutionArray[i] = pollutionArray[i];
      this.waterArray[i] = waterArray[i];
      this.dirtArray[i] = dirtArray[i];
  }

  // invariant: bodies is sorted by id
  this.initialBodies = this.initialBodies.sort(function(a, b) {
    return a.getID() - b.getID();
  });
  this.getSeed = function () {
    return this.seed;
  }
  this.getSoupArray = function () {
    return this.soupArray;
  }
  this.getPollutionArray = function () { return this.pollutionArray }
  this.getDirtArray = function () { return this.dirtArray }
  this.getWaterArray = function () { return this.waterArray }
  this.getWaterLevel = function () { return this.waterLevel}
  this.getWidth = function () {
    return this.width;
  }
  this.getHeight = function () {
    return this.height;
  }
  this.getOrigin =  function () {
    return origin;
  }
  this.getMapName = function () {
      return mapName;
  }
}
function initInitialBodiesFromSchemaBodyTable(bodyTable, initialBodies) {
    let locs = bodyTable.locs(); // VecTable
    for (let i = 0; i < bodyTable.robotIDsLength(); i++) {
        let bodyType = FlatHelpers.getRobotTypeFromBodyType(bodyTable.types(i));
        let bodyID = bodyTable.robotIDs(i);
        let bodyX = locs.xs(i);
        let bodyY = locs.ys(i);
        let bodyTeam = TeamMapping.team(bodyTable.teamIDs(i));
        if (bodyType != null)
            initialBodies.push(new RobotInfo(bodyID, bodyTeam, bodyType, {x:bodyX, y:bodyY}));
    }
}
function RobotInfo(bodyID, bodyTeam, bodyType, mapLoc) {
  this.ID = bodyID;
  this.team = bodyTeam;
  this.type = bodyType;
  this.location = mapLoc;
  this.getID = function () {
    return this.ID;
  }
}

function FlatHelpers() {

}
FlatHelpers.getRobotTypeFromBodyType = function(i) {
  return i;
}
FlatHelpers.getBodyTypeFromRobotType = function(i) {
  return i;
}
function TeamMapping() {

}
TeamMapping.team = function(i) {
  return i;
}
TeamMapping.id = function(i) {
  return i;
}

//let deserializedMap = deserializeRawMap(gameMap)
//let bytes = serializeMap(deserializedMap);
//console.log(bytes, bytes.length);
//console.log(buf.length);
/*
var buf2 = new flatbuffers.ByteBuffer(bytes);
let gameMap2 = battlecode.schema.GameMap.getRootAsGameMap(buf2);
let deserializedMap2 = deserializeRawMap(gameMap2);
let bytes2 = serializeMap(deserializedMap2);
*/
