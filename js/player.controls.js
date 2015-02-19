var PlayerControls = Class.create(EventDispatcher,{
					initialize: function($super,parent){
						$super();
						this.className = "PlayerControls";
						this.parent = parent;
						
						console.log('Init DigiControls: user interface init ');
						
						//all UI control items to be build
						this.playBtn 	= '';
						this.pauseBtn   = '';
						this.progressBar= '';
						this.bufferBar  = '';
						this.seekHandle = '';
						this.muteButton = '';
						this.loadSpinner= '';
						this.uiLayer    = '';
						
						this.controlLayer = this.buildControlLayer();
						
						this.parent.addEventListener('networkState',this.networkStateUpdate.bind(this),false);
						this.parent.addEventListener('PlayerStateUpdate',this.playerStateUpdate.bind(this),false);
					},
					
					buildControlLayer : function(){
						
						var ch 		 = document.createElement('div');
						ch.id        = 'PlayerControlHolder'+this.parent.classId ;
						ch.className = 'control_holder offOnTrans';
						
						
						var mr     = document.createElement('div');
						mr.className = 'midctrl';
							
							if(!this.parent.autoPlay){
								var play     = document.createElement('div');
								play.id      = "PlayInitButton"+this.parent.classId ;
								play.className = 'init_play';
								
								mr.appendChild(play);
							}
							
						ch.appendChild(mr);
						
						return ch;
					},
					
					playerStateUpdate : function(obj){
						var self = this;
						
						switch(obj.state){
							
							case 'play' :
							break;
							
							case 'canplaythrough' :
								
								this.parent.holder.appendChild(this.controlLayer);
								
								if(!this.parent.autoPlay){
								
									document.getElementById('PlayInitButton'+this.parent.classId ).addEventListener('click',function(e){
										console.log(self.className + ' :request playback');
										document.getElementById('PlayInitButton'+self.parent.classId ).className = document.getElementById('PlayInitButton'+self.parent.classId ).className + ' off';
										self.parent.play();
									});
								
								}
								
							break;
							
							case 'ended' :
							break;
							
						}
					},
					
					networkStateUpdate : function(state){
						var self = this;
						switch(state){
							
							case 1 :
							break;
							
							case 2 :
							break;
							
							case 3 :
							break;
							
							case 4 :
								
								
							break;
							
						}
					}
					

});