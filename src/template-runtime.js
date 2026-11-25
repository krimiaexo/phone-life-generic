/* Blank edition: no cast, historical posts, message plot or unsolicited replies. */
function templateDefaultPin(){return CONFIG.template.app.defaultPin;}
function templateInitialPinLabel(){return '初始密码 '+templateDefaultPin();}
Object.assign(STORY_PROFILE_FIELDS,{stageName:'显示名',koreanName:'其他语言名',company:'工作/学习地点',groupName:'团队/社群',roleInGroup:'职责',debutYears:'参与年数',popularityTier:'使用情景',fandomName:'社群名称',publicImage:'对外介绍',privatePersonality:'自己的性格'});
Object.assign(STORY_SLOTS,{boyfriend:'伴侣',exPartners:'过去的关系',flirtTargets:'想进一步认识的人',secretAdmirers:'尚未表明心意',maleIdolsWhoInitiateContact:'新认识的人',groupMembers:'团队同伴',industryFriends:'同事与同行',manager:'协调人',staff:'项目伙伴',brandContacts:'合作联系人',pdDirectorsProducers:'策划与创作'});
Object.assign(STORY_MODES,{semi:'自由生活',au:'自定义世界',realistic:'贴近日常'});
const templateOriginalInitializeStory=initializeStory;
initializeStory=function(){
 const fresh=!state.templateConfigured&&!state.story?.configured;
 templateOriginalInitializeStory();
 if(fresh){const s=storyState();Object.assign(s.player,CONFIG.template.player);state.profileName=s.player.stageName;state.profileBio=CONFIG.template.profileBio;Object.assign(state.weverse.profile,{name:s.player.stageName,bio:CONFIG.template.profileBio,community:s.player.groupName||'我的社区'});state.deviceSecurity||={pin:templateDefaultPin()};
  for(const person of CONFIG.template.contacts){const c=storyRegisterCharacter({...person,id:'custom-'+person.key});c.bio=person.bio||'';c.userEdited=true;}
  for(const [i,event] of CONFIG.template.calendar.entries())state.events.push({id:'custom-event-'+i,...event});
 }
 state.templateConfigured=true;
};
/* Generic opening UI is defined in landing.js, after the content studio. */
function templateContact(key){return storyState().characters['custom-'+key];}
function initializeTemplateMainline(){
 const s=storyState(),scenario=CONFIG.template.scenario;if(!s.enabled||s.mainline||!scenario?.nodes.length)return;
 const nodes=scenario.nodes.map((item,i)=>{
  const person=templateContact(item.contact);if(!person)throw Error('找不到剧情联系人：'+item.contact);
  const app=item.app||'kakao',ctx=app==='kakao'?{channel:'kakao',chatId:person.chatId,npcId:person.id}:app==='weverse'?{channel:'wv',peer:person.handle,npcId:person.id}:{channel:'dm',platform:app==='x'?'X':'Instagram',accountIndex:0,peer:person.handle,npcId:person.id};
  return {...JSON.parse(JSON.stringify(item)),index:i,ctx,priority:item.priority??100-i,dependsOn:item.dependsOn||(!i?[]:[scenario.nodes[i-1].id]),lines:item.lines.map(l=>({from:l.role==='player'?'나':'상대',text:l.text,translation:l.translation||''})),status:'locked',cursor:0,messageIds:[]};
 });
 s.mainline={version:1,id:s.season.instanceId+':'+scenario.id,title:scenario.title,status:'running',startedAt:Date.now(),choices:{},queue:nodes};resolveMessageNodes();
}
function templateApplyHistory(n){for(const v of n.variants||[])if(storyState().mainline.choices[v.nodeId]===v.value){n.lines[v.lineIndex].text=v.text;n.lines[v.lineIndex].translation=v.translation||'';}}
storyStartSeason=function(){return storyAtomic(()=>{const s=storyState();s.configured=true;s.enabled=true;const custom=CONFIG.template.scenario;if(custom?.nodes.length&&!s.season)s.season={id:custom.id,instanceId:uid('custom'),title:custom.title,durationWeeks:8,startedAt:storyNow(),endsAt:storyNow()+56*86400000,status:'running',week:1};ensureMessageMainline();return s.season;});};
storyEnsureAutonomy=function(){};storyAmbient=function(){};
initializeSocialWorld=function(){const s=storyState();s.socialWorld||={version:1,step:0,nextAt:0,flags:{},eggs:{},visits:{}};};
tickSocialWorld=function(){};worldInteraction=function(){};ensureFanCircles=function(){};
worldStoryFlag=function(flag,text){const content=CONFIG.template.scenario?.publicTexts?.[flag];if(!content)return;const w=storyState().socialWorld;if(w.flags[flag])return;w.flags[flag]=true;for(const platform of ['Instagram','X','Threads','TikTok'])storyPost(platform,{id:'custom-flag-'+flag,display:state.profileName,handle:CONFIG.template.accountHandle,text:content,translation:'',attachments:[]});};
// Free chat and broadcasts do not invent counterpart messages. Authors may implement replies here.
storyHandleInput=function(){return true;};scheduleKakaoGroupReply=function(){return conversation()?.category==='group';};
const templateOriginalTickWeverse=tickWeverse;
tickWeverse=function(now){if(!CONFIG.creator.fans.length){state.weverse.pending=[];return;}return templateOriginalTickWeverse(now);};
const templateOriginalTickYouTube=tickYouTube;
tickYouTube=function(now){if(!CONFIG.creator.fans.length){state.youtube.pending=[];return;}return templateOriginalTickYouTube(now);};
storyWorldPanel=function(){return `<section class="st-card"><h2>我的世界</h2><p>人物、内容和生活记录由你创建。</p>${mainlineSummary()}<p>在自己的节奏里，开始新的一天。</p></section>`;};
storyCompanyPanel=function(){return `<section class="st-company"><h2>${esc(storyState().player.company||'生活计划')}</h2><p>日历、待办与自己的安排。</p>${mainlineSummary()}${button('st-open','人物与世界','','st-inline-action')}</section>`;};
// User-imported track metadata follows the save; Blob bytes use the isolated asset DB.
const templateBaseTracks=JSON.parse(JSON.stringify(CONFIG.spotify.tracks));
const templateInitializeWorld=initializeWorld;
initializeWorld=function(){CONFIG.spotify.tracks=[...templateBaseTracks,...(state.localMusicTracks||[])];templateInitializeWorld();};
const templateSpotifyMore=spotifyMore;
spotifyMore=function(index=Math.max(0,state.currentTrack)){if(!CONFIG.spotify.tracks[index]){audioUploadTrack=-1;$('#audioUpload').click();return;}return templateSpotifyMore(index);};
const templateUploadAudio=uploadAudio;
uploadAudio=async function(file){if(!file)return;if(audioUploadTrack>=0&&CONFIG.spotify.tracks[audioUploadTrack])return templateUploadAudio(file);const metadata=await readCreatorMetadata(file);if(metadata.type!=='audio')throw Error('请选择音频文件');const assetId=await dbPut(file),track={title:file.name.replace(/\.[^.]+$/,''),artist:'本地导入',duration:metadata.duration||1,audio:''},index=CONFIG.spotify.tracks.length;state.localMusicTracks||=[];state.localMusicTracks.push(track);CONFIG.spotify.tracks.push(track);state.audioAssetIds[index]=assetId;saveState();invalidate();renderApp('spotify');};
ACTIONS['am-more']=()=>sheet('音乐',button('template-import-audio','导入新歌曲')+button('spotify-queue','播放队列')+button('am-new-playlist','新建播放列表')+button('am-import-video','导入音乐视频'));
ACTIONS['template-import-audio']=()=>{audioUploadTrack=-1;closeSheet();$('#audioUpload').click();};
const templateKKFriends=renderKKFriends;
renderKKFriends=function(){return templateKKFriends().replace(/<section[^>]*>\s*<button[^>]*data-action="kk-collapse"[^>]*data-id="plus"[\s\S]*?<\/section>/,'');};
renderCompany=function(){return page('生活计划',`${storyCompanyPanel()}<div class="toolbar">${button('new-event','新增日程')}${button('company-calendar','打开日历')}</div>${state.events.filter(e=>e.date===localDate()).map(e=>`<button class="event-row" data-action="edit-event" data-id="${e.id}"><time>${esc(e.time)}</time><strong>${esc(e.title)}</strong></button>`).join('')||empty('今天还没有安排')}`);};
renderXReferenceExplore=function(){currentSocial='X';const query=routeParams.query||'',posts=seedPosts('X').filter(p=>(p.text+' '+p.display+' '+p.handle).toLowerCase().includes(query.toLowerCase()));return xRefShell(`<div class="xr-search-box">${input('xrSearchInput','搜索动态或用户',query)}</div><h2 class="section-title">${query?'搜索结果':'探索'}</h2>${posts.map(renderXReferencePost).join('')||empty(query?'没有匹配的动态':'还没有动态，发布第一条记录吧')}`,'search','探索');};


/* YIJUN custom scenario seed: local-only messages, social profiles and scripted call. */
function yjScenarioDate(hour, minute) {
 const d = new Date(2026, 10, 20, hour, minute, 0, 0);
 return {time:String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'),sentAt:d.toISOString(),createdAt:d.getTime()};
}
function yjSeedMessage(chatId, from, text, hour, minute, id) {
 const c=state.conversations[chatId]; if(!c) return null;
 const stamp=yjScenarioDate(hour,minute);
 const m={id,text,translation:'',from,time:stamp.time,sentAt:stamp.sentAt,read:true,initial:true};
 c.messages.push(m); c.updatedAt=stamp.createdAt; return m;
}
function yjPushChatLine(chatId, from, text, hour, minute, id) {
 const c=state.conversations[chatId]; if(!c) return null;
 const stamp=yjScenarioDate(hour,minute);
 const m={id,text,translation:'',from,time:stamp.time,sentAt:stamp.sentAt,read:from==='나',initial:true};
 c.messages.push(m); c.updatedAt=stamp.createdAt;
 if(from!=='나') addNotification('KakaoTalk',c.name,text,'',{chatId,read:false});
 saveState(); invalidate('kakao-chats'); return m;
}
const yjBaseInitializeWorld=initializeWorld;
initializeWorld=function(){
 yjBaseInitializeWorld();
 if(state.yjScenarioSeedVersion===1) return;
 if(!state.story || !state.templateConfigured) initializeStory();
 const zaixi=state.story?.characters?.['custom-zaixi'];
 const noisy=state.story?.characters?.['custom-noisy-person'];
 if(!zaixi || !noisy) throw new Error('尹伊俊场景联系人初始化失败');
 const chatA=state.conversations[zaixi.chatId], chatB=state.conversations[noisy.chatId];
 chatA.messages=[];
 chatB.messages=[];
 yjSeedMessage(zaixi.chatId,'나','明天休息日对不对？',14,0,'yj-kkt-a-01');
 yjSeedMessage(zaixi.chatId,'상대','嗯哼',14,2,'yj-kkt-a-02');
 yjSeedMessage(zaixi.chatId,'나','要不要出去玩？',14,11,'yj-kkt-a-03');
 yjSeedMessage(zaixi.chatId,'상대','好啊!150件小事还没做完呢',14,13,'yj-kkt-a-04');
 yjSeedMessage(zaixi.chatId,'나','好~不过明天我安排哦~',14,16,'yj-kkt-a-05');
 yjSeedMessage(zaixi.chatId,'나','晚上接你下班~',14,19,'yj-kkt-a-06');
 yjSeedMessage(noisy.chatId,'나','你说明天要不要直接去济州岛？她正好要休息',16,0,'yj-kkt-b-01');
 yjSeedMessage(noisy.chatId,'상대','哇~我们家宝贝真厉害，为什么不直接去马尔代夫呢',16,3,'yj-kkt-b-02');
 yjSeedMessage(noisy.chatId,'나','你说的也有道理',16,6,'yj-kkt-b-03');
 yjSeedMessage(noisy.chatId,'상대','然后姜在熙就会在那么美好的地方告诉你我们分手吧，不要哭哦~😊',16,9,'yj-kkt-b-04');
 state.browser.history=(CONFIG.template.safariHistory||[]).map((url,i)=>({url,time:new Date(2026,10,20,10,i*3,0,0).getTime()}));
 state.browser.tabs||=[];
 state.notifications||=[];
 state.xMutuals=JSON.parse(JSON.stringify(CONFIG.template.xMutuals||[]));
 const x=state.accounts.X?.[0];
 if(x){
  x.profile.name='윤이준'; x.profile.handle='yinyijun';
  x.following||={};
  state.xMutuals.forEach(p=>{x.following[p.handle]=true;});
 }
 const ig=state.accounts.Instagram?.[0];
 if(ig && !ig.posts.some(p=>p.id==='yj-zaixi-ig-post')){
  ig.posts.unshift({id:'yj-zaixi-ig-post',display:'在熙❤️',handle:'jiangzaixi',text:'明天也要拍',translation:'',likes:0,date:'11月20日',createdAt:new Date(2026,10,20,19,30).getTime(),replies:0,reposts:0,comments:[]});
 }
 state.yjScenarioSeedVersion=1;
 state.yjScenario={unlockPopupPending:true,callTriggered:false,zaixiChatId:zaixi.chatId};
 saveState();
};

/* Show the scripted incoming KakaoTalk message only after the first successful unlock. */
const yjBaseAddDigit=addDigit;
addDigit=function(d){
 const wasUnlocked=state.unlocked;
 yjBaseAddDigit(d);
 if(!wasUnlocked && state.unlocked && state.yjScenario?.unlockPopupPending){
  state.yjScenario.unlockPopupPending=false;
  const chatId=state.yjScenario.zaixiChatId;
  yjPushChatLine(chatId,'상대','晚上想吃什么吗？',19,35,'yj-kkt-a-07');
  saveState();
  setTimeout(()=>sheet('KakaoTalk · 在熙❤️',`<div class="world-form"><p><strong>在熙❤️</strong></p><p>晚上想吃什么吗？</p>${button('yj-quick-reply','在熙要吃什么？我还在想明天要做什么呢')}</div>`),180);
 }
};
ACTIONS['yj-quick-reply']=()=>{
 closeSheet();
 const id=state.yjScenario?.zaixiChatId;if(!id)return;
 yjPushChatLine(id,'나','在熙要吃什么？我还在想明天要做什么呢',19,40,'yj-kkt-a-08');
 setTimeout(()=>yjPushChatLine(id,'상대','哎一古，吃炸酱面吧？',19,43,'yj-kkt-a-09'),850);
 setTimeout(()=>yjPushChatLine(id,'상대','不要想这么多，去做什么都可以!',19,46,'yj-kkt-a-10'),2100);
};

/* Liking the specified text-only Instagram post starts a fictional incoming call. */
const yjBaseToggleLike=toggleLike;
toggleLike=function(platform,id){
 const wasLiked=!!activeAccount(platform)?.liked?.[id];
 yjBaseToggleLike(platform,id);
 if(platform==='Instagram' && id==='yj-zaixi-ig-post' && !wasLiked && activeAccount('Instagram')?.liked?.[id] && !state.yjScenario?.callTriggered){
  state.yjScenario.callTriggered=true; saveState();
  setTimeout(()=>beginLocalCall({platform:'Instagram',video:false,direction:'incoming',peer:'jiangzaixi',name:'在熙❤️'}),220);
 }
};
const yjBaseScheduleCallMessages=scheduleCallMessages;
scheduleCallMessages=function(s){
 if(s.peer!=='jiangzaixi'){yjBaseScheduleCallMessages(s);return;}
 if(s.scriptStarted)return;s.scriptStarted=true;
 const lines=[
  {from:'상대',text:'呀尹伊俊，不是来接我吗？'},
  {from:'나',text:'在路上了在熙呀，我刚刚一直在想穿些什么呢'},
  {from:'상대',text:'可爱，快来吧我饿了'},
  {from:'나',text:'好~'}
 ];
 lines.forEach((line,i)=>callLater(()=>{if(activeCallSession?.id===s.id&&s.phase==='connected')showIgMessage(line.from,line.text);},700+i*1900));
};

/* X-only mutual accounts; they do not become extra KakaoTalk contacts. */
const yjBaseSocialProfile=renderSocialProfile;
renderSocialProfile=function(){
 const platform=routeParams.platform||currentSocial,handle=routeParams.handle||'';
 const person=platform==='X'?(state.xMutuals||[]).find(p=>p.handle===handle):null;
 if(!person)return yjBaseSocialProfile();
 const posts=seedPosts('X').filter(p=>p.handle===handle);
 return `<section class="social-page world-page dark">${renderHeader('个人主页')}<div class="app-scroll"><div class="profile-social"><div class="profile-banner"></div><div class="profile-social-row">${friendAvatarHtml({name:person.name})}<span class="primary-outline" style="padding:8px 14px;border-radius:18px">互相关注</span></div><h2>${esc(person.name)}</h2><div class="handle">@${esc(person.handle)}</div><p>${esc(person.bio||'')}</p><div class="profile-stats"><span><b>${posts.length}</b> 帖子</span><span><b>${esc(person.followers||'0')}</b> 粉丝</span><span><b>互关</b> 关系</span></div></div><div class="profile-tabs"><span class="active">帖子</span></div>${posts.map((p,i)=>socialPostHtml(p,'X',i)).join('')||empty('还没有内容')}</div>${renderSocialBottom('X','me')}</section>`;
};
const yjBaseXExplore=renderXReferenceExplore;
renderXReferenceExplore=function(){
 const query=routeParams.query||'',q=query.toLowerCase();
 const people=(state.xMutuals||[]).filter(p=>!q||(p.name+' '+p.handle).toLowerCase().includes(q));
 const posts=seedPosts('X').filter(p=>(p.text+' '+p.display+' '+p.handle).toLowerCase().includes(q));
 return xRefShell(`<div class="xr-search-box">${input('xrSearchInput','搜索账号或动态',query)}</div><h2 class="section-title">互关账号</h2>${people.map(p=>`<button class="list-row" data-action="visit-profile" data-platform="X" data-handle="${esc(p.handle)}">${friendAvatarHtml({name:p.name})}<span class="list-main"><strong>${esc(p.name)}</strong><small>@${esc(p.handle)} · 互相关注</small></span></button>`).join('')||empty('没有匹配的互关账号')}<h2 class="section-title">帖子</h2>${posts.map(p=>renderXReferencePost(p)).join('')||empty('没有匹配的动态')}`,'search','探索');
};
