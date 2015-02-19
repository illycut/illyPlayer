// JavaScript Document

var AssetLoader =  Class.create(EventDispatcher,{
	
						initialize: function($super,parent,assetUrl,type,audiotype){
						 	$super();
							 var self = this;
							
							 this.parent  = parent;
							 this.type    = type;
							 this.audioType = (audiotype) ? audiotype : '';
							 
							 this.assetUrl = assetUrl;
							 
							 this.request = new XMLHttpRequest();

							 this.request.open("GET", assetUrl, true);
							 this.request.responseType = this.getResponseType(type);
	
							 this.request.addEventListener("load", this.onLoadComplete.bind(this), false);
							 this.request.addEventListener("progress", this.loadProgress.bind(this), false);
							 this.request.addEventListener("error", this.onLoadError.bind(this), false);
							 this.request.addEventListener("timeout", this.onLoadTimeout.bind(this), false);
							 
							 this.request.send(null);
							 
							 return this;
					
						},
						
						onLoadComplete : function(e){
							console.log('assetLoader : asset load complete',e.target);
							e.parent = this;
							
							switch(e.target.status){
							
								case 404 : 
									this.onLoadError({message : this.type+' file could not be found on server'});
								break;
								
								case 200 :
									
									if( this.audioType == 'webkit' && this.type == 'audio'){
										this.savedHTTPresponse = e;
										this.parent.audioContext.decodeAudioData(e.currentTarget.response, this.onStreamReady.bind(this), this.onStreamError);
									}else {
										this.dispatchEvent('loaded',e);
									}
									
								break;
								
							}
							
							
							
						},
						
						
						
						onLoadError : function(e){
							this.dispatchEvent('error',e);
						},
						
						onLoadTimeout : function(e){
							//:NOTE:: add functionality to reload after time out
							this.dispatchEvent('error',e);
						},
						
						
						onStreamReady : function(buffer){
							this.savedHTTPresponse.buffer = buffer;
							console.log('assetLoader : buffer data decoded');
							this.dispatchEvent('loaded',this.savedHTTPresponse);
						},
						onStreamError : function(error){
							console.log('assetLoader : Audio Decoding Error');
							this.dispatchEvent('error',error);
						},
						
						
						getResponseType : function(fileType){
							
							switch(fileType){
								
								case('video'):
									return "blob";
								break;
								case('audio'):
									if(this.audioType == 'webkit'){
										return "arraybuffer";
									}else{
										return "blob";
									}
								break;

							}
							
						},
						loadProgress: function(e){
							
							this.dispatchEvent('progress',e);
							if(e.loaded/e.total > .8){
									
								this.dispatchEvent('canplaythrough',true);
							}
								
						}
						
				   });