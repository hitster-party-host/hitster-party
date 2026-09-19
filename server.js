import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import crypto from 'node:crypto';

export const songs = [
 {id:'dQw4w9WgXcQ',title:'Never Gonna Give You Up',artist:'Rick Astley',year:1987},
 {id:'9bZkp7q19f0',title:'Gangnam Style',artist:'PSY',year:2012},
 {id:'kJQP7kiw5Fk',title:'Despacito',artist:'Luis Fonsi ft. Daddy Yankee',year:2017},
 {id:'fJ9rUzIMcZQ',title:'Bohemian Rhapsody',artist:'Queen',year:1975},
 {id:'YQHsXMglC9A',title:'Hello',artist:'Adele',year:2015},
 {id:'OPf0YbXqDm0',title:'Uptown Funk',artist:'Mark Ronson ft. Bruno Mars',year:2014},
 {id:'Zi_XLOBDo_Y',title:'Billie Jean',artist:'Michael Jackson',year:1982},
 {id:'hTWKbfoikeg',title:'Smells Like Teen Spirit',artist:'Nirvana',year:1991},
 {id:'RgKAFK5djSk',title:'See You Again',artist:'Wiz Khalifa ft. Charlie Puth',year:2015},
 {id:'JGwWNGJdvx8',title:'Shape of You',artist:'Ed Sheeran',year:2017}
];
const rooms=new Map();
const code=()=>{let s='';const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';for(let i=0;i<5;i++)s+=a[crypto.randomInt(a.length)];return s};
function publicRoom(r,viewer){return {code:r.code,phase:r.phase,round:r.round,hostId:r.hostId,current:r.current&&viewer===r.hostId?{id:r.current.id}:null,reveal:r.phase==='reveal'?r.current:null,players:[...r.players].map(([id,p])=>({id,name:p.name,score:p.score,timeline:p.timeline,guess:p.guess,ready:p.guess!=null}))}}
function emit(r){for(const id of r.players.keys())io.to(id).emit('state',publicRoom(r,id))}
function roomOf(socket){return rooms.get(socket.data.room)}
export function makeApp(){const app=express();app.use(express.static('public'));app.get('/health',(_,res)=>res.json({ok:true,rooms:rooms.size}));return app}
const app=makeApp(), http=createServer(app), io=new Server(http,{cors:{origin:true}});
io.on('connection',socket=>{
 socket.on('create',({name},cb)=>{let c;do c=code();while(rooms.has(c));const r={code:c,hostId:socket.id,players:new Map(),phase:'lobby',round:0,current:null,used:[]};r.players.set(socket.id,{name:clean(name)||'המארח',score:0,timeline:[],guess:null});rooms.set(c,r);socket.join(c);socket.data.room=c;cb?.({ok:true,code:c,id:socket.id});emit(r)});
 socket.on('join',({code:c,name},cb)=>{const r=rooms.get(String(c||'').toUpperCase());if(!r)return cb?.({ok:false,error:'החדר לא נמצא'});if(r.phase!=='lobby')return cb?.({ok:false,error:'המשחק כבר התחיל'});r.players.set(socket.id,{name:clean(name)||'שחקן',score:0,timeline:[],guess:null});socket.join(r.code);socket.data.room=r.code;cb?.({ok:true,code:r.code,id:socket.id});emit(r)});
 socket.on('start',()=>{const r=roomOf(socket);if(!r||r.hostId!==socket.id)return;r.phase='playing';next(r)});
 socket.on('playback',()=>{const r=roomOf(socket);if(r&&r.hostId===socket.id)io.to(r.code).emit('playback-started')});
 socket.on('guess',({year})=>{const r=roomOf(socket),p=r?.players.get(socket.id);const y=Number(year);if(!r||r.phase!=='playing'||!p||!Number.isInteger(y)||y<1950||y>2026)return;p.guess=y;emit(r)});
 socket.on('reveal',()=>{const r=roomOf(socket);if(!r||r.hostId!==socket.id||r.phase!=='playing')return;r.phase='reveal';for(const p of r.players.values()){if(p.guess==null)continue;const diff=Math.abs(p.guess-r.current.year);const pts=diff===0?3:diff<=2?2:diff<=5?1:0;p.score+=pts;p.timeline.push({year:r.current.year,title:r.current.title,artist:r.current.artist,correct:p.guess===r.current.year,guess:p.guess});p.timeline.sort((a,b)=>a.year-b.year)}emit(r)});
 socket.on('next',()=>{const r=roomOf(socket);if(r&&r.hostId===socket.id&&r.phase==='reveal')next(r)});
 socket.on('disconnect',()=>{const r=roomOf(socket);if(!r)return;r.players.delete(socket.id);if(!r.players.size)rooms.delete(r.code);else {if(r.hostId===socket.id)r.hostId=r.players.keys().next().value;emit(r)}})
});
function clean(s){return String(s||'').trim().slice(0,24)}
function next(r){let pool=songs.filter(s=>!r.used.includes(s.id));if(!pool.length){r.phase='finished';emit(r);return}r.current=pool[crypto.randomInt(pool.length)];r.used.push(r.current.id);r.round++;r.phase='playing';for(const p of r.players.values())p.guess=null;emit(r)}
if(process.env.NODE_ENV!=='test')http.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log(`Hitster Party on ${process.env.PORT||3000}`));
export {http,io,rooms};
