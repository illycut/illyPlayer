# illyPlayer
iOS inline video playback and multiple video playback polyfill library

# Developer Notes
This is a work in progress. I had been building a media player for a while and iOS releases kept making it more challenging to use video in Safari, especially on iPhone.  With the release of iOS8 and the html5 compliance update to allow for canvas usage on the iPhone, I came up with this idea to recreate video playback.   This library is the result.  At its completion, this library will have all the same events as normal video tag, all the same controls and more capabilities.

<b> Prototype JS </b> is required to use this library. I have included it in this repository

# How It Works
You can use example.html found in the repository to get an idea, but here are the specifics

1.  Create a new instance of player core<Br>
    <h4>var myPlayer = new IllyPlayer(targetElement,videoPath,audioPath,options)<br><br></h4>
    
    <b>targetElement [string] </b>: <font size="12">The id of the div you want the player to exist within *required </font> <Br>
   <b>videoPath     [string] </b>: relative or absolute url to video of choice  *required <br>
   <b>audioPath     [string] </b> : relative or absolute url to audio of choice  (note : if you want options just enter '' here)<br>
   <b> options       [object] </b>: a set of attributes that can alternate the features of the player (note : see below for available options)<br>

2.  Add any event listeners you're interested in getting data from<br>
    <h4>myPlayer.addEventListener('progress',functionOfChoice,false)</h4>
    <br>
3.  Initiate the loading of the media you passed in.  (note : When you use audio with your video, the autoplay feature won't be available, since mobile OS implementation block the ability to init audio without a touch gesture) <br>
    <h4>myPlayer.init();</h4>
<br>

4.  Click the play button that appears on the screen


# Release Notes
This is currently an alpha version, let's call this v0.1.  It allows for multiple videos one a single page to be played back inline.  Controls aren't finished, nor are all the events you'd expect from the video player.  However, this is great for creating webpages with video backgrounds on mobile, or something along the lines of TasteMade where you have an infinite scroll of thumbnail videos you want to activate.  Please do leave notes and features requests. I'll be working on this over the next couple months to get it right.

- OPTIONS  <br>
    <i>autoplay : true or false  [default : false]</i><br>
    <i>width    : integer  [default : 640]</i><br>
    <i>height   : integer  [default : 480]</i>  (in the future, ill have it size to the target element by default)<br>
    <i>audioType: 'webkit' or 'html5'  [default : 'html5']</i> (webkit is required for multiple video instances)<br>

- EVENTS <br> 
    <i>error : understand why the player might not be working</i><br>
    <i>progress : how much the media has loaded, amount loaded dispatched with event</i><br>
    <i>loadstart : loading has begun</i><br>
    <i>canplaythrough : entire video can now playthrough</i><br>
    <i>timeupdate : dispatched ever timer tick, current time dispatched with this event</i><br>
    <i>play : video is entering playback, current time dispatched with this event</i><br>
    <i>pause : video has been paused, current time dispatched with this event</i><br>

# Coming Soon
1. All common player events as stated by W3C standards
2. All common player attributes as stated by W3C standards
3. Better sizing options
4. Player controls layer with API, enabling you to build your own control layer if you so choose
