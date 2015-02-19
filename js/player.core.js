window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var IllyPlayerStatus = {
	
	LOAD_START 		: 'loadstart',
	CANPLAYTHROUGH  : 'canplaythrough',
	CANPLAY 		: 'canplay',
	ENDED		    : 'ended',
	SEEKING 		: 'seeking',
	PROGRESS		: 'progress',
	VOLUME_CHANGE	: 'volumechange',
	WAITING			: 'waiting',
	SEEKED			: 'seeked',
	PLAY			: 'play',
	PAUSE			: 'pause',
	ERROR			: 'error',
	TIME_UPDATE		: 'timeupdate'
	
};

var IllyNetworkState = {
	
	NETWORK_EMPTY 		: 0,
	NETWORK_IDLE  		: 1,
	NETWORK_LOADING 	: 2,
	NETWORK_NO_SOURCE 	: 3
	
};

var IllyPlayer = Class.create(EventDispatcher,{
					initialize: function($super,target,video,audio,options){
						$super();
						console.log('IllyPlayer Core : setup ',[video,audio,options]);
						
						this.className   = 'IllyPlayer';
						this.classId     = target;
						
						//default dimensions
						this.width 		 = 640;
						this.height      = 480;
						this.scale       = 1;
						
						this.setupBase(target);
						this.holder      = document.getElementById('illyPlayer'+this.classId);
						
						this.videoUrl    = video;
						this.audioUrl    = (audio) ? audio : '';
						this.audioType   = '';
						this.bufferRepository = [];
						this.currentSrc  = {audio: this.audioUrl, video: this.videoUrl};
						
						this.videoSize   = 0;
						this.audioSize   = 0;
						//this.assetLoader = new AssetLoader(this.assetUrl,'video');
	
						
						//default media properties
						this._seeking     = false;
						this._loaded      = false;
						this._muted       = false;
						this._currentTime = 0;
						this._playing     = false;
						this._buffered    = 0;
						this._duration    = 0;
						this._ended       = false;
						this._volume      = 1;
						this._paused      = true;
						this.autoPlay     = false;
						
						this.playerReady   = false;
						this.audioActive   = false;
						this.controlsActive= true;
						this._networkState = IllyNetworkState.NETWORK_EMPTY;
						this.audioContext  =  new webkitAudioContext();
						this.lastFrameTime = 0;
						
						//Ensure we can proceed with playback loading
						if(this.videoUrl == ""){
							
							this._networkState = IllyNetworkState.NETWORK_NO_SOURCE;
							var error = {message : 'missing an audio or video source url'};
							this.dispatchEvent(IllyPlayerStatus.ERROR,error);
							
							return;
						}
						
						
						if(options){
							this.extend(options);
						}
						

						
						//:TODO:: Whether or not blob can be used doesnt determine the type of audio used
						this.blob     = ((this.hasOwnProperty('loadType') && this.loadType == 'arraybuffer') || this.audioType == 'webkit') ? false : this.determineOS();
						this.controls = (this.controlsActive && this.controlsActive != 0) ? new PlayerControls(this) : {};
						
						
						this.videoNode   = this.createVideoElement();
						this.mediaCanvas = this.createCanvasElement(); 
						this.audioNode   = this.createAudioElement();
						
						this.setupCoreEvents();
						
					},
					
					setupCoreEvents : function(){
						var self= this;
						
						this.addEventListener(IllyPlayerStatus.PROGRESS,function(e){
							
							if(e == 1){
								console.log(self.className + ' : notifying the system its ready for playback');
								self.playbackReady();
							}
							
							
						});
					},
					
					determineOS : function(){
						
						var agent   = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
		                var version = (agent === null) ? 9 : parseInt(agent[1], 10);  //parse agent information to detect iOS version
		                    
						//determine if there is already another digiplayer in use
						var vidItems = document.querySelectorAll('input[id^="illyPlayer"]');
				
							
		                if (version < 8 || vidItems.length > 0){
							console.log(this.className + ' : webkit audio activated');
							this.audioType = 'webkit';
		                    return false;
		                }else{
							this.audioType = "html5";
		                	return true;
		                }
						
					},
					
					
					playerStateDispatcher : function(state,val){
						//a catch all makes it easy to capture all player events through a single event
						this.dispatchEvent('PlayerStateUpdate',{state:state,event:val});
						
						this.dispatchEvent(state,val);
					},
					
					setupBase : function(target){
						
						if( document.getElementById(target) === null){
							throw(this.className + ' [ERROR] target element is not present in the DOM');
						}
						
						var playbase = document.createElement('div');
						playbase.setAttribute('style','width:'+this.width+'px;height:'+this.height+'px;');
						playbase.id  = 'illyPlayer'+this.classId;
						playbase.className = 'illyplayer';
						
						document.getElementById(target).appendChild(playbase);

					},
					
					createVideoElement : function(){
						var video    = document.createElement('video');
						video.width  = this.width;
						video.height = this.height;
						
						video.setAttribute('class','player active right');
						
						return video;
					},
					
					createAudioElement : function(){
						var audio = '';
						
						if(this.audioType != "webkit"){
							
							audio     = new Audio();
							audio.type    = 'audio/mp4';
							audio.preload ='auto';
						
						}else{
							
							this.audioContextVolume = this.audioContext.createGain();
							this.audioContextVolume.gain.value = 1;//streamPlayer.targetVolume;
							
							audio                   = this.audioContext.createBufferSource();
							audio.playbackRate.value = 1;
							
							audio.connect(this.audioContextVolume);

							this.audioContextVolume.connect(this.audioContext.destination);
						}
						
						return audio;
					},
					
					createCanvasElement : function(){
						var canvas    = document.createElement('canvas');
						canvas.width  = this.width;
						canvas.height = this.height;
						canvas.id     = 'mediacan'+this.classId;
						
						canvas.setAttribute('class','player');
						
						this.holder.appendChild(canvas);
						var context = document.getElementById('mediacan'+this.classId).getContext('2d');
						
						
						
						return context;
					},
				
					reinitAudio : function(){
	
						this.audioNode                  = this.audioContext.createBufferSource();
						this.audioNode.playbackRate.value = 1;
						this.audioNode.buffer = this.bufferRepository[0];
						this.audioNode.connect(this.audioContextVolume);
						
						this.audioContextVolume.connect(this.audioContext.destination);
						
					},
					
					preload : function(mediaType){
						if(this.loaded)
							return;
							
						//var loadType     = (this.blob) ? 'blob' : mediaType;
						var objectType      = (mediaType == 'video') ? '' : this.audioType;
						
						console.log(this.className + ' : loading an ' + mediaType + ' file ');
						
						this[mediaType + 'AssetLoader'] = new AssetLoader(this,this[mediaType+'Url'],mediaType,objectType);
						this[mediaType + 'AssetLoader'].mediaType = mediaType;
						this[mediaType + 'AssetLoader'].addEventListener('loaded',this.assetReady.bind(this),false);
						this[mediaType + 'AssetLoader'].addEventListener('progress',this[mediaType+'AssetProgress'].bind(this),false);
						this[mediaType + 'AssetLoader'].addEventListener('error',this.playerError.bind(this),false);
						
					},
					
					playerError : function(e){
						this.dispatchEvent('error',e);
						throw(this.className + ' : critical error, player has stopped loading / playing content');
					},
			
					init : function(){
						this.playerStateDispatcher(IllyPlayerStatus.LOAD_START,4);
						
						if(this.audioUrl != ''){
							console.log(this.className + ': initialize audio asset load');
							this.preload('audio');
						}
						
						console.log(this.className + ': initialize video asset load');
						this.preload('video');
						
						this._networkState = IllyNetworkState.NETWORK_LOADING;
					},
					
					//:TODO:: consolidate the progress functions into one method
					audioAssetProgress : function(e){
						this.audioSize     = e.total;
						this.audioProgress = e.loaded;
						
						if(this.videoSize != 0){
							this._progress = (this.audioProgress + this.videoProgress) / (this.audioSize+this.videoSize);
							
							this.playerStateDispatcher(IllyPlayerStatus.PROGRESS,this._progress);
							//:TODO:: this is also where the buffer variable would come in
						}
					},
					
					videoAssetProgress : function(e){
						this.videoSize     = e.total;
						this.videoProgress = e.loaded;
						
						if(this.audioSize != 0){
							this._progress = (this.audioProgress + this.videoProgress) / (this.audioSize+this.videoSize);
							this.playerStateDispatcher(IllyPlayerStatus.PROGRESS,this._progress);
						}
					},
					
					assetReady : function(e){
						console.log(this.className + ': '+e.parent.mediaType+' asset ready');
						var updatedUrl = e.parent.assetUrl;
						var mediaType  = e.parent.mediaType;
						
						this._networkState = IllyNetworkState.NETWORK_IDLE;
						
						//:TODO:: Add correct detection of load type here, this is a hack
						if (event && event.currentTarget.response && event.target.response instanceof Blob) {
				      
				     	    var webBlobMethod = window.webkitURL.createObjectURL;
				            
				            updatedUrl = webBlobMethod(event.currentTarget.response);

							this.holder.appendChild(this[mediaType + 'Node']);
 							console.log(this.className + ' : ' + mediaType + 'Node appended to page');
							this[mediaType + 'Node'].innerHTML = '<source src="'+updatedUrl+'" type="'+mediaType+'/mp4" />';
							
							//this[mediaType + 'Node'].addEventListener('loadedmetadata',this.playbackReady.bind(this),false);
	
							this[mediaType + 'Node'].load();
							
			            }else{
							console.log(this.className + ' : ' + mediaType + 'Node is webkit and is ready for play via memory');
							this[mediaType + 'Node'].buffer = e.buffer;	//load the data into the source and begin building webkit nodes to destination
							
							this.bufferRepository.push(e.buffer);
						}
				        
				        
						//:NOTE:: We need a robust way to always have duration
						if(mediaType == 'audio' && this.audioUrl != ''){
							this._duration = (this.audioType == "webkit") ? this[mediaType + 'Node'].buffer.duration : this[mediaType + 'Node'].duration;
						}else{
							this._duration = (!isNaN(this.videoNode.duration) && this._duration == 0) ? this.videoNode.duration : this._duration;
						}
					},
					
				
					playbackReady : function(){
						if(this.playerReady)
							return;
					
						this.playerReady = true;
						console.log(this.className + ': media asset ready for playback');
						this.playerStateDispatcher(IllyPlayerStatus.CANPLAYTHROUGH);
						
						if(this.autoPlay){
							this.play();
						}
					},
					
					
					
					//playback logic
					
					dislayFrame : function(){
						if(!this._playing)
							return;
							
						if(this._currentTime + (1/30) > this._duration)
							return;
						
						var time = new Date().getTime() - this.actualTimeStart;
						this.syncTimeElapsed = time / 1000;

						
						if(this.audioType == "html5"){
							this.videoNode.currentTime = this._currentTime = this.audioNode.currentTime;
						}else{
							this.videoNode.currentTime = this._currentTime = this._currentTime + (1/30);
							
							//:NOTE:: if duration is not given, we check on the video time to determine if we've reached the end
							if(this._duration == 0){
								this._duration = this.videoNode.duration;
							}
							
							//NOTE:: Keep audio in sync with video based on the abritrary 1/30s ticker
							if(this.audioActive && this.audioType == 'webkit' && Math.round(this._currentTime) % 2 == 0){
								//this.audioNode.stop(0);
								//this.reinitAudio();
								console.log(this.className + ' : match playback time ' + this.syncTimeElapsed +' to video time ' +this.videoNode.currentTime + ' total duration is ');
								//this.audioNode.playbackRate.value += .1;
								//this.audioNode.start(0,this.videoNode.currentTime);
							}
						}
						
						requestAnimFrame( this.dislayFrame.bind(this) );
						this.mediaCanvas.drawImage(this.videoNode,0,0,640,480);

						this.playerStateDispatcher(IllyPlayerStatus.TIME_UPDATE,this._currentTime);
						
						if(!this.audioActive){
							
							this.audioActive = true;
							
							if(this.audioType == "html5"){
								this.audioNode.play();
							}else if(this.audioType == "webkit"){
								this.audioNode.start(0,0);
							}
						} 
						
					},
					
					playCycleStart : function(){
						//:TODO:: going to have to be more meticulous about how we determine if things are playing
						this.actualTimeStart = new Date().getTime();
						
							
						this.videoNode.currentTime = this.syncTimeElapsed = this._currentTime;
						this.dislayFrame();
						
					},
					
					play : function(){
						if(this._playing)
							return;
						//TODO:: trigger play button on UI
						this.playerStateDispatcher(IllyPlayerStatus.PLAY,this._currentTime);
						
						this._playing = true;
						this.playCycleStart();
						
					},
					
					pause : function(){
						if(!this._playing)
							return;
						
						this.playerStateDispatcher(IllyPlayerStatus.PAUSE,this._currentTime);
						
						this._playing = false;
						this.audioNode.pause();
					},
					
					seekTo : function(time){
						console.log(this.className + ": seekto request " + time);

						this.playerStateDispatcher(IllyPlayerStatus.SEEKING,time);

						this.pause();
						this.audioNode.currentTime = time;
						
						//ensure the time changed
						this._currentTime = (this.audioNode.currentTime == time) ? this.audioNode.currentTime : this.seekTo(time);
						this.play();
					},
					
					mute : function(cmd){
						console.log(this.className + ": mute request " + cmd);
						
						var volume = (cmd) ? 0 : this.volume;

						this.playerStateDispatcher(IllyPlayerStatus.VOLUME_CHANGE,volume);

						this.audioNode.muted = this._muted = cmd;
					}
					

});


Object.defineProperty(IllyPlayer.prototype, "ended", {
    get : function () { return this._ended; }
});

Object.defineProperty(IllyPlayer.prototype, "loaded", {
    get : function () { return this._loaded; }
});

Object.defineProperty(IllyPlayer.prototype, "seeking", {
    get : function () { return this._seeking; }
});

Object.defineProperty(IllyPlayer.prototype, "currentTime", {
    get : function () { return this._currentTime; },
    set : function (time) { //:TODO:: seek to requested time
    	 	this.seekTo(time);
    	 }
});

Object.defineProperty(IllyPlayer.prototype, "muted", {
    get : function () { return this._muted; },
    set : function (mute) { //:TODO:: set muted based on true or false provided
    	 	this.mute(mute);
    	 }
});

Object.defineProperty(IllyPlayer.prototype, "duration", {
    get : function () { return this._duration; }
});

Object.defineProperty(IllyPlayer.prototype, "buffered", {
    get : function () { return this._buffered; }
});



Object.defineProperty(IllyPlayer.prototype, "volume", {
    get : function () { return this._volume; }
});

Object.defineProperty(IllyPlayer.prototype, "networkState", {
    get : function () { return this._networkState; }
});

Object.defineProperty(IllyPlayer.prototype, "_playReady", {
    get : function () { return this._playReady; },
	set : function (val) { //:TODO:: seek to requested time
			if(val){
				this.dispatchEvent(IllyPlayerStatus.CANPLAYTHROUGH);
			}
			
    	 	this._playReady = val
    	 }
});


Object.prototype.extend = function(obj) {
       for(var i in obj)
          this[i] = obj[i];
};