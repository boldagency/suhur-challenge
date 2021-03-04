//@ui {"widget":"label", "label":"Prefabs Foods"}
//@input Asset.ObjectPrefab[] objectPrefab

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Game Controller"}
//@input float spawnFrequency{"widget":"slider","min":0.1, "max":4, "step":0.02}
//@input float spawnRandomizer{"widget":"slider","min":0, "max":0.5, "step":0.02}
//@input float spawnRange {"widget":"slider","min":0, "max":1, "step":0.1}
//@input float fallingSpeedMin
//@input float fallingSpeedMax

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Mouth Position"}
//@input SceneObject mouthPositionObject
//@input Component.Text mouthPositionNumber

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Camera"}
//@input Component.Camera camera

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Trigger Game Button"}
//@input SceneObject startButton

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Scores"}
//@input Component.Text score
//@input Component.Text result
//@input Component.Text counter

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Game Duration"}
//@input int timer

//game state related
//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Game Screens"}
//@input SceneObject StartScreen
//@input SceneObject ScoreScreen
//@input SceneObject EndScreen

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Text Colors"}
// @input vec4 error_color = {1,1,1,1} {"widget":"color"}
// @input vec4 correct_color = {1,1,1,1} {"widget":"color"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Sounds"}
//@input Component.AudioComponent Sound_BGM


//0--BeforeGameStart 1--DuringGame 2--GameEnded
var startGame = false;
var gameState = 0;
var currentScore = 0;
setState(0);

var spawnedObjects = [];

var countDownDate = script.timer;

var spawnTimer = 0;
var spawnFrequency =  script.spawnFrequency; //reverse spawnFrequency so higher number would produce more frequent result, not necessary for our game but easier to understand.
var spawnRange = script.spawnRange;

//Get audio of the game
var audioComponent = script.getSceneObject().getComponent("Component.AudioComponent");

//get screen position of this aka ObjectSpawner object
var screenTransform = script.getSceneObject().getComponent("Component.ScreenTransform");    
var myScreenPos = screenTransform.anchors.getCenter();

var aspectRatio = script.camera ? script.camera.aspect : 0;

script.createEvent("UpdateEvent").bind(function(){
    if(script.camera && startGame ){
        
      //Create Prefabs
      if(spawnTimer < spawnFrequency){
        spawnTimer += getDeltaTime();
        }else{
            spawnObject();
            spawnTimer = 0;
            spawnFrequency = script.spawnFrequency + Math.random()*script.spawnRandomizer*2 - script.spawnRandomizer;
        }    
    }
});

//Create Prefabs
function spawnObject(){
    //creating a copy of the prefab   
    var randomIndex = Math.floor(Math.random()*script.objectPrefab.length);
    var newObj = script.objectPrefab[randomIndex].instantiate(script.getSceneObject().getParent());
    newObj.name = "food" + spawnedObjects.length.toString();
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

//Generate Random Number for Food Prefab Speeds
function getFallingSpeed(){
   return Math.random() * (script.fallingSpeedMax - script.fallingSpeedMin) + script.fallingSpeedMin;
}

//Detect if mouthh is open
global.isMouthOpened = false;
script.createEvent("MouthOpenedEvent").bind(function(){
    global.isMouthOpened = true;
});
script.createEvent("MouthClosedEvent").bind(function(){
    global.isMouthOpened = false;
});

//Get Mouth Position
function getMouthPosition(){
   var mouthWorldPos = script.mouthPositionObject.getTransform().getWorldPosition() ;
   var mouthPos =  script.camera.worldSpaceToScreenSpace(mouthWorldPos);
   mouthPos = new vec2(mouthPos.x*2-1, 1-mouthPos.y*2);
   return mouthPos;
}

//Calculate distance of an object from the mouth
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

//Show points that will be added/removeed from the total score
//The points will be shown on top of the user's mouth
function showPointsOnMouth(point){
    if(point<0){
      script.mouthPositionNumber.textFill.color=script.error_color;
    }
    else{
        point='+'+point;
      script.mouthPositionNumber.textFill.color=script.correct_color;
    }

    script.mouthPositionNumber.text=point.toString();
    if(global.tweenManager){
            global.tweenManager.startTween(script.mouthPositionNumber.getSceneObject(), "tweenText");

    }
}

//Update User Score
function updateScore(number){
    if(gameState==1){
        //minimum score is zero
        if(!(number<0 && currentScore==0) ){
           currentScore += number;
           script.score.text = currentScore.toString();
        }
    }
}


//Enable Game Region
function onGameStart(){
    startGame = true;
    countdownStart();  //start count down 
    setState(1);//update game state
    currentScore = 0; //reset user's score   
}

//Enable End Screen
function onGameEnd(){
    startGame = false;
    script.result.text = currentScore.toString();
   
    //if the user score is >= to 1, show the crown on user's head
    if(currentScore>1){
        global.showCrown();
    }
    setState(2); //show end screen
   global.showCheeks(); //add blush to user's cheeks
}

//Set State of the App
// 1--Start Screen  2--Game Screen 3-- End Screen
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
    onGameEnd();
}

//Trigger Event to start game
global.behaviorSystem.addCustomTriggerResponse("START_GAME", onGameStart);

//Make Functions Accessible 
script.api.getFallingSpeed = getFallingSpeed;
script.api.getDistanceFromMouth = getDistanceFromMouth;
script.api.updateScore = updateScore;
script.api.showPointsOnMouth=showPointsOnMouth;