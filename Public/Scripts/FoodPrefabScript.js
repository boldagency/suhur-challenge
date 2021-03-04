//@input Component.ScriptComponent objectSpawner
//@input int points 


var threshold = 0.1;
var distanceFromMouth = 0;

var screenTransform = script.getSceneObject() ? script.getSceneObject().getComponent("Component.ScreenTransform") : undefined;
var fallingSpeed =  script.objectSpawner ? script.objectSpawner.api.getFallingSpeed() : undefined;

script.createEvent("UpdateEvent").bind(function(){
    if(script.objectSpawner){
         var currentpos =  screenTransform.anchors.getCenter();
    
          currentpos.y -= fallingSpeed * getDeltaTime();      
          screenTransform.anchors.setCenter(currentpos);
         
            //if the status of the mouth is open, we calculate the distance to detect collisions.
            if(global.isMouthOpened == true) {
                distanceFromMouth = script.objectSpawner.api.getDistanceFromMouth(currentpos);
                if(distanceFromMouth < threshold){
                
                    //update user score
                    script.objectSpawner.api.updateScore(script.points);
                   //play sound
                    script.objectSpawner.api.play();
                    //attach point added to user's mouth
                    script.objectSpawner.api.showPointsOnMouth(script.points);
                    //destroy the object
                    script.getSceneObject().destroy();
               }
            }
            
            if(currentpos.y < -1.5){
                script.getSceneObject().destroy();
            }
    }

  
});