# 174C-proj
Kirby Escape
Paurush Pandey, Thomas Lin, Jerry Yao, Kevin Xue


Project overview:
For our final project, we made Kirby Escape, a movement-based, spiderman-like game where you spawn in a city where you try to survive as long as possible. You play as the main character, Kirby, and are able to shoot webs with (left mouse click). This will cause you to lift off the ground and swing toward where your web has attached! Use your ability to quickly launch into the air and jump off walls to avoid the spiders. There exists one huge spider, who has no collision and cannot climb, and one small spider, who can climb walls to reach you! These are your enemies, and once they touch you, the game ends! Your score will be higher the longer you are able to avoid getting caught by the spiders.

Model/Environment: We built and textured custom models inside of Maya and imported them in three.js. They are manually placed inside of the scene with randomized heights that help to vary the gameplay. We modeled Kirby and exported it as an obj with parts to draw Kirby in our game.


Algorithms:
Spring Mass Damper System(swinging movement)
Kirby’s webs are spring mass damper systems. They anchor Kirby and allow him to swing about the attachment point on the wall. We implement this by using the raycasting algorithm to find the point where Kirby’s web intersects. From there we simulate creating a spring between kirby’s center and the point where the web intersects. We also add an additional downward gravity force to ensure that the spring does not overpower the gravity present, making it so kirby looks like he is swinging. We also add a sideways normal force to simulate swinging on one arm adding a sideways motion. This is implemented in player.js

Collision detection
To make the game seem more realistic, we also implement collision detection between the player and collidable objects, such as the building and the floor. This is primarily done in player.js’s run() function. This is done by first running a broad collision check using the objects’ bounding boxes. Then, a precise collision check using raycasting toward the negation of the player’s velocity to approximate the point of penetration. A penalty force is then applied using the normal of the penetrated surface and a spring damper equation. This system gives a good approximation of precise mesh collision while maintaining reasonable performance. However, it is not entirely accurate and can cause instability and false collisions, especially at lower time steps. This can be attributed to the player being within an object’s bounding box, not colliding with the mesh, yet the raycast connects. One major improvement to our game would be making our collision system more stable.

Symplectic Euler Integration
We implemented symplectic euler integration for more accurate and stable physics simulations. This is done in player.js’s update() function. For performance, this is currently set at 10 simulations per frame, but can be set higher for more stable and accurate collision.

Ray casting (aiming webs)
A raycaster algorithm is used to place the end of Kirby’s webs. The ray is cast from the player model and stops when it intersects with an environment mesh. The web has a maximum length of 100 units meaning it only checks intersections within that range. Once a valid target is hit, the web is generated between Kirby and this point on the wall. We add a crosshair in the middle of the screen (index.html) in order for the player to know where in the world their web will hit. This is implemented in player.js

Procedural IK Solver
The spider has each of its limbs procedurally animated using cyclic coordinate descent inverse kinematics. This solver allows for reasonable stability and performance, as well as controlled joint restraints The spider has 4 joints on its front legs and 3 on its other legs, all with rotational constraints to simulate realistic articulation, with rotational constraints based on the articulation of a real spider’s joints. The solver controls a skinned mesh, obtained here. This works very well and is very stable. This is initialized in spider.js’s addToScene() function.

Behavioral Simulation
Our spider’s walk cycle is an instance of algorithmic behavioral simulation. The spider’s movement is defined by a set of rules:
Legs locate a rest position based on the original rest position and current velocity
Once legs are too far from the rest position, lift & move sinusoidally to new rest position
Legs cannot move unless adjacent legs are grounded (done through raycasting opposite to the up vector)
Adjust pitch based on relative height difference between front and back legs
Move toward look vector
This simple set of rules allows for a realistic walk cycle, as well as the foundations of wall climbing. However, at the moment, wall climbing is still very unstable. This can be attributed to the drawbacks of raycasting to find the surface the spider is climbing on, as if the spider’s leg penetrates the surface, the algorithm becomes unstable. Other potential improvements include obstacle and singularity avoidance, as well as an introduction of a third degree of freedom to the body (tilt). This is primarily implemented in spider.js’s tick() function.

Forward Kinematics (Kirby limbs animation)
Kirby’s limbs don’t articulate much, but they rotate off a pivot within Kirby’s torso. We use these pivots to create running and jumping animations for Kirby as he glides around the map. The limbs are parented to the torso geometry and inherit its transformation.

Scoreboard and Game Management:
The scoreboard is implemented in index.html, passing a document element to be updated in the gamemanager.js file by the GameManager. The game manager handles updating the score, telling everyone when to reset the game after the game ends, and when the game should end.
