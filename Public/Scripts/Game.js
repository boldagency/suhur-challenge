//@input Asset.ObjectPrefab[] objectPrefab
//@input float spawnFrequency{"widget":"slider","min":0.1, "max":4, "step":0.02}
//@input float spawnRandomizer{"widget":"slider","min":0, "max":0.5, "step":0.02}
//@input float spawnRange {"widget":"slider","min":0, "max":1, "step":0.1}
//@input float fallingSpeedMin
//@input float fallingSpeedMax
//@input SceneObject mouthPositionObject
//@input Component.Camera camera
//@input SceneObject startButton
//@input Component.Text score
//@input Component.Text result
//@input Component.Text counter
//@input int timer

//game state related
//@input SceneObject StartScreen
//@input SceneObject ScoreScreen
//@input SceneObject EndScreen

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Sounds"}
//@input Component.AudioComponent Sound_BGM


//0--BeforeGameStart 1--DuringGame 2--GameEnded
var startgame = false;
var gameState = 0;
var currentScore = 0;
global.behaviorSystem.addCustomTriggerResponse("START_GAME", onGameStart);
setState(0);

var spawnedObjects = [];

var countDownDate = script.timer;
var timerOn= false;

var spawnTimer = 0;
var spawnFrequency =  script.spawnFrequency; //reverse spawnFrequency so higher number would produce more frequent result, not necessary for our game but easier to understand.
var spawnRange = script.spawnRange;
var audioComponent = script.getSceneObject().getComponent("Component.AudioComponent");

//get screen position of this aka ObjectSpawner object
var screenTransform = script.getSceneObject().getComponent("Component.ScreenTransform");    
var myScreenPos = screenTransform.anchors.getCenter();


script.createEvent("UpdateEvent").bind(function(){
    if(script.camera && startgame ){
      if(spawnTimer < spawnFrequency){
        spawnTimer += getDeltaTime();
        }else{
            spawnObject();
            spawnTimer = 0;
            spawnFrequency = script.spawnFrequency + Math.random()*script.spawnRandomizer*2 - script.spawnRandomizer;
        }    
    }
});

//Detect if mouthh is open
global.isMouthOpened = false;
script.createEvent("MouthOpenedEvent").bind(function(){
    global.isMouthOpened = true;
});
script.createEvent("MouthClosedEvent").bind(function(){
    global.isMouthOpened = false;
});


function spawnObject(){

        //creating a copy of the prefab   
    var randomIndex = Math.floor(Math.random()*script.objectPrefab.length);
    var newObj = script.objectPrefab[randomIndex].instantiate(script.getSceneObject().getParent());
    newObj.name = "Cookie" + spawnedObjects.length.toString();
    spawnedObjects.push(newObj);
    
   //randomize position with range
    var randomXpos = myScreenPos.x + Math.random()*script.spawnRange*3 - script.spawnRange;
    var newObjPosition = new vec2(randomXpos, myScreenPos.y);
    
    //set screen position of newObj aka ObjectPrefab object
    var objScreenTransform = newObj.getComponent("Component.ScreenTransform");
    objScreenTransform.anchors.setCenter(newObjPosition);

}

function addPrefab(prefabObject){
    var newObj = prefabObject.instantiate(script.getSceneObject().getParent());  
    
    
    var meshVisual = prefabObject.getComponent("Component.Image"); 
    prefabObject
//   var randomTextureIndex= getRandomInt(0, script.texture.length);
//    var randomTexture=script.texture[randomTextureIndex];
//    meshVisual.mainMaterial.mainPass.baseTex = randomTexture;
//
    
    
    
   //get screen position of this aka ObjectSpawner object
   var screenTransform = script.getSceneObject().getComponent("Component.ScreenTransform");   
   var myScreenPos = screenTransform.anchors.getCenter();

    //randomize position with range
    var randomXpos =  myScreenPos.x + Math.random()*spawnRange*2 - spawnRange;
    var newObjPosition =  new vec2(randomXpos, myScreenPos.y) ;
    
   //set screen position of newObj aka ObjectPrefab object
   var objScreenTransform =   newObj.getComponent("Component.ScreenTransform");
   objScreenTransform.anchors.setCenter(newObjPosition);
}

function getMouthPosition(){
   var mouthWorldPos = script.mouthPositionObject.getTransform().getWorldPosition() ;
   var mouthPos =  script.camera.worldSpaceToScreenSpace(mouthWorldPos);
   mouthPos = new vec2(mouthPos.x*2-1, 1-mouthPos.y*2);
   return mouthPos;
}


var aspectRatio = script.camera ? script.camera.aspect : 0;
function getDistanceFromMouth(pos1){
    var pos2= getMouthPosition();
    //get x y distance (screen space) between 2 points
        var xDistance = Math.abs(pos1.x - pos2.x);
        var yDistance = Math.abs(pos1.y - pos2.y);
        
        //multiplies aspect ratio to y
        yDistance /= aspectRatio;
        
        //get diagonal distance
        return Math.sqrt(xDistance*xDistance + yDistance*yDistance);
}

function getFallingSpeed(){
   return Math.random() * (script.fallingSpeedMax - script.fallingSpeedMin) + script.fallingSpeedMin;
}

//Play Audio
function play(){
    audioComponent.play(1);
}

//Update User Score
function updateScore(number){
    if(gameState==1){
       currentScore += number;
       script.score.text = currentScore.toString();
    }
}



function onGameStart(){
    if(script.camera){
           startgame = true;
            timerOn= true;
            countdownStart(); 
    
           setState(1);
           currentScore = 0;
           missedScore = 0;   
    }

}

function onGameEnd(){
    startgame = false;
    script.result.text = currentScore.toString();
    global.showCheeks();
    if(currentScore>1){
        global.showCrown();
    }
    setState(2);
}


function setState(gameStateInt){
  gameState= gameStateInt;
  if(script.camera)
   switch(gameStateInt){
       case 0://before game start
           script.StartScreen.enabled = true;
           script.ScoreScreen.enabled = false;
           script.EndScreen.enabled = false;
           script.Sound_BGM.stop(false);
       break;
       case 1://during game
           script.StartScreen.enabled = false;
           script.ScoreScreen.enabled = true;
          script.EndScreen.enabled = false;
          script.Sound_BGM.play(-1);
       break;
       case 2://after game ended
           script.StartScreen.enabled = false;
           script.ScoreScreen.enabled = false;
           script.EndScreen.enabled = true;
          script.Sound_BGM.stop(false);
       break;
   }
}


//Enable Counter
function countdownStart() {
    // Update the count down every 1 second
    var delayedEvent = script.createEvent('DelayedCallbackEvent')
    delayedEvent.bind(function(eventData) {
    countDownDate  = countDownDate - 1;
    script.counter.text=countDownDate+ 's ';
      if (countDownDate <= 0) {
        countdownFinished()
      } else {
        delayedEvent.reset(1)
      }
    })
    delayedEvent.reset(0)
}

//Function that will run when countdowun is over
function countdownFinished() {
      // Add your own functions/code here to run when the countdown is over
      // Remove next two lines
        timerOn=false;
        onGameEnd();
}

script.api.play= play;
script.api.getFallingSpeed = getFallingSpeed;
script.api.getDistanceFromMouth = getDistanceFromMouth;
script.api.updateScore = updateScore;