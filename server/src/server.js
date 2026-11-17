import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'datatree-local-dev-secret-change-me';
const db = new Database(path.join(DATA_DIR, 'datatree.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

// ---------- Database ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  bio TEXT DEFAULT '', role TEXT DEFAULT 'Usuário', city TEXT DEFAULT '', website TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '', public_profile INTEGER NOT NULL DEFAULT 1,
  show_on_map INTEGER NOT NULL DEFAULT 0, latitude REAL, longitude REAL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL, following_id TEXT NOT NULL,
  created_at TEXT NOT NULL, PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, author_id TEXT NOT NULL, content TEXT DEFAULT '',
  file_id TEXT, created_at TEXT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS likes (
  post_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL,
  text TEXT NOT NULL, created_at TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL, mime_type TEXT DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'private',
  folder TEXT DEFAULT '', description TEXT DEFAULT '', tags TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL,
  text TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, actor_id TEXT, type TEXT NOT NULL,
  message TEXT NOT NULL, link TEXT DEFAULT '', read_at TEXT, created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id, created_at DESC);
`);

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const bool = v => Boolean(Number(v));
const publicUser = row => row ? ({
  id: row.id, name: row.name, username: row.username, bio: row.bio || '', role: row.role || 'Usuário',
  city: row.city || '', website: row.website || '', avatarUrl: row.avatar_url || '',
  publicProfile: bool(row.public_profile), showOnMap: bool(row.show_on_map),
  latitude: row.latitude, longitude: row.longitude, createdAt: row.created_at
}) : null;
const getUser = userId => db.prepare('SELECT * FROM users WHERE id=?').get(userId);
const followersCount = userId => db.prepare('SELECT COUNT(*) n FROM follows WHERE following_id=?').get(userId).n;
const followingCount = userId => db.prepare('SELECT COUNT(*) n FROM follows WHERE follower_id=?').get(userId).n;
const isFollowing = (a,b) => !!db.prepare('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?').get(a,b);
const canSeeUser = (viewerId, ownerId) => {
  const u = getUser(ownerId);
  return !!u && (u.id === viewerId || bool(u.public_profile));
};
const canAccessFile = (viewerId, file) => {
  if (!file) return false;
  if (file.owner_id === viewerId || file.visibility === 'public') return true;
  if (file.visibility === 'followers') return isFollowing(viewerId, file.owner_id);
  return false;
};
const createNotification = (userId, actorId, type, message, link='') => {
  if (userId === actorId) return;
  db.prepare('INSERT INTO notifications (id,user_id,actor_id,type,message,link,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(id(), userId, actorId, type, message, link, now());
};

// Seed demo data only once.
if (db.prepare('SELECT COUNT(*) n FROM users').get().n === 0) {
  const insert = db.prepare(`INSERT INTO users
    (id,name,username,email,password_hash,bio,role,city,website,public_profile,show_on_map,latitude,longitude,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const ana = 'u1', lucas = 'u2';
  insert.run(ana,'Ana Clara','anaclara','ana@datatree.local',bcrypt.hashSync('123456',10),'Designer e criadora de conteúdo.','Designer','Natal, RN','',1,1,-5.7945,-35.2110,now());
  insert.run(lucas,'Lucas Martins','lucasm','lucas@datatree.local',bcrypt.hashSync('123456',10),'Desenvolvedor apaixonado por produtos digitais.','Desenvolvedor','Natal, RN','',1,1,-5.8050,-35.2050,now());
  db.prepare('INSERT INTO follows (follower_id,following_id,created_at) VALUES (?,?,?)').run(ana,lucas,now());
  db.prepare('INSERT INTO follows (follower_id,following_id,created_at) VALUES (?,?,?)').run(lucas,ana,now());
  db.prepare('INSERT INTO posts (id,author_id,content,created_at) VALUES (?,?,?,?)').run(id(),ana,'Bem-vindo ao DataTree 2.0 🌳 Agora o conteúdo realmente fica salvo no banco.',now());
  db.prepare('INSERT INTO posts (id,author_id,content,created_at) VALUES (?,?,?,?)').run(id(),lucas,'Você pode publicar, seguir pessoas, conversar e compartilhar arquivos com permissões.',now());
}

function auth(req,res,next){
  const header=req.headers.authorization || '';
  const token=header.startsWith('Bearer ') ? header.slice(7) : null;
  if(!token) return res.status(401).json({error:'Faça login para continuar.'});
  try { req.user=jwt.verify(token,JWT_SECRET); next(); }
  catch { return res.status(401).json({error:'Sessão expirada. Faça login novamente.'}); }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_,__,cb)=>cb(null,UPLOAD_DIR),
    filename: (_,file,cb)=>cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 50 * 1024 * 1024 }
});

function issueToken(user){ return jwt.sign({id:user.id,username:user.username},JWT_SECRET,{expiresIn:'7d'}); }
function userWithStats(user, viewerId=user.id){
  const p=publicUser(user);
  return {...p, followers:followersCount(user.id), following:followingCount(user.id), isFollowing:viewerId ? isFollowing(viewerId,user.id) : false};
}
function serializeFile(f){
  return { id:f.id, name:f.original_name, type:f.mime_type, size:f.size_bytes, visibility:f.visibility,
    folder:f.folder || '', description:f.description || '', tags:f.tags || '', createdAt:f.created_at,
    ownerId:f.owner_id, downloadUrl:`/api/files/${f.id}/download`, previewUrl:`/api/files/${f.id}/preview` };
}
function serializePost(p, viewerId){
  const author=getUser(p.author_id);
  const likeCount=db.prepare('SELECT COUNT(*) n FROM likes WHERE post_id=?').get(p.id).n;
  const commentCount=db.prepare('SELECT COUNT(*) n FROM comments WHERE post_id=?').get(p.id).n;
  const liked=!!db.prepare('SELECT 1 FROM likes WHERE post_id=? AND user_id=?').get(p.id,viewerId);
  const file=p.file_id ? db.prepare('SELECT * FROM files WHERE id=?').get(p.file_id) : null;
  return {id:p.id,content:p.content,createdAt:p.created_at,author:userWithStats(author,viewerId),likes:likeCount,comments:commentCount,liked,file:file?serializeFile(file):null};
}

app.get('/api/health',(req,res)=>res.json({ok:true,service:'datatree-api',version:'2.0.0'}));

// ---------- Auth ----------
app.post('/api/auth/register', async (req,res)=>{
  const {name,username,email,password}=req.body || {};
  if(!name||!username||!email||!password) return res.status(400).json({error:'Preencha nome, usuário, email e senha.'});
  if(password.length<6) return res.status(400).json({error:'A senha precisa ter pelo menos 6 caracteres.'});
  const cleanUsername=String(username).replace(/^@/,'').trim().toLowerCase();
  if(!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) return res.status(400).json({error:'Usuário: use 3–30 caracteres (a-z, 0-9, ponto, _ ou -).'});
  if(db.prepare('SELECT 1 FROM users WHERE lower(email)=lower(?) OR username=?').get(email,cleanUsername)) return res.status(409).json({error:'Email ou usuário já cadastrado.'});
  const user={id:id(),name:String(name).trim(),username:cleanUsername,email:String(email).trim().toLowerCase(),password_hash:await bcrypt.hash(password,10),bio:'',role:'Usuário',city:'',website:'',avatar_url:'',public_profile:1,show_on_map:0,latitude:null,longitude:null,created_at:now()};
  try {
    db.prepare(`INSERT INTO users (id,name,username,email,password_hash,bio,role,city,website,avatar_url,public_profile,show_on_map,latitude,longitude,created_at)
      VALUES (@id,@name,@username,@email,@password_hash,@bio,@role,@city,@website,@avatar_url,@public_profile,@show_on_map,@latitude,@longitude,@created_at)`).run(user);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({error:'Email ou usuário já cadastrado.'});
    throw error;
  }
  res.status(201).json({token:issueToken(user),user:userWithStats(user,user.id)});
});

app.post('/api/auth/login',async(req,res)=>{
  const {email,password}=req.body || {};
  const user=db.prepare('SELECT * FROM users WHERE lower(email)=lower(?)').get(String(email||'').trim());
  if(!user || !(await bcrypt.compare(String(password||''),user.password_hash))) return res.status(401).json({error:'Email ou senha inválidos.'});
  res.json({token:issueToken(user),user:userWithStats(user,user.id)});
});

// ---------- Profile ----------
app.get('/api/me',auth,(req,res)=>{
  const u=getUser(req.user.id); if(!u) return res.status(404).json({error:'Usuário não encontrado.'});
  res.json({...userWithStats(u,req.user.id),email:u.email});
});
app.patch('/api/me/profile',auth,(req,res)=>{
  const u=getUser(req.user.id); if(!u) return res.status(404).json({error:'Usuário não encontrado.'});
  const allowed=['name','bio','role','city','website','avatarUrl','publicProfile','showOnMap','latitude','longitude'];
  const body=req.body || {};
  const data={
    name:body.name ?? u.name, bio:body.bio ?? u.bio, role:body.role ?? u.role, city:body.city ?? u.city, website:body.website ?? u.website,
    avatar_url:body.avatarUrl ?? u.avatar_url, public_profile:typeof body.publicProfile==='boolean'?Number(body.publicProfile):u.public_profile,
    show_on_map:typeof body.showOnMap==='boolean'?Number(body.showOnMap):u.show_on_map,
    latitude:body.latitude ?? u.latitude, longitude:body.longitude ?? u.longitude
  };
  db.prepare(`UPDATE users SET name=@name,bio=@bio,role=@role,city=@city,website=@website,avatar_url=@avatar_url,
    public_profile=@public_profile,show_on_map=@show_on_map,latitude=@latitude,longitude=@longitude WHERE id=@id`).run({...data,id:req.user.id});
  res.json(userWithStats(getUser(req.user.id),req.user.id));
});

app.get('/api/users',auth,(req,res)=>{
  const q=String(req.query.q||'').trim().toLowerCase();
  const rows=db.prepare(`SELECT * FROM users WHERE public_profile=1 AND (lower(name) LIKE ? OR lower(username) LIKE ? OR lower(role) LIKE ? OR lower(city) LIKE ?) ORDER BY name LIMIT 30`)
    .all(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`);
  res.json(rows.map(u=>userWithStats(u,req.user.id)));
});
app.get('/api/users/:username',auth,(req,res)=>{
  const u=db.prepare('SELECT * FROM users WHERE username=?').get(req.params.username.toLowerCase());
  if(!u || (!bool(u.public_profile) && u.id!==req.user.id)) return res.status(404).json({error:'Perfil não encontrado.'});
  res.json(userWithStats(u,req.user.id));
});
app.post('/api/users/:id/follow',auth,(req,res)=>{
  const target=getUser(req.params.id);
  if(!target || !bool(target.public_profile)) return res.status(404).json({error:'Usuário não encontrado.'});
  if(target.id===req.user.id) return res.status(400).json({error:'Você não pode seguir a si mesmo.'});
  const exists=isFollowing(req.user.id,target.id);
  if(exists) db.prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').run(req.user.id,target.id);
  else { db.prepare('INSERT INTO follows (follower_id,following_id,created_at) VALUES (?,?,?)').run(req.user.id,target.id,now()); createNotification(target.id,req.user.id,'follow','começou a seguir você.'); }
  res.json({following:!exists,user:userWithStats(target,req.user.id)});
});

// ---------- Feed / posts ----------
app.get('/api/feed',auth,(req,res)=>{
  const rows=db.prepare(`SELECT p.* FROM posts p JOIN users u ON u.id=p.author_id
    WHERE p.author_id=? OR p.author_id IN (SELECT following_id FROM follows WHERE follower_id=?) OR u.public_profile=1
    ORDER BY p.created_at DESC LIMIT 50`).all(req.user.id,req.user.id);
  res.json(rows.map(p=>serializePost(p,req.user.id)));
});
app.post('/api/posts',auth,(req,res)=>{
  const {content='',fileId=null}=req.body || {};
  if(!String(content).trim() && !fileId) return res.status(400).json({error:'Escreva algo ou anexe um arquivo.'});
  if(fileId){ const f=db.prepare('SELECT * FROM files WHERE id=?').get(fileId); if(!f || f.owner_id!==req.user.id) return res.status(403).json({error:'Arquivo inválido.'}); }
  const post={id:id(),author_id:req.user.id,content:String(content).trim(),file_id:fileId,created_at:now()};
  db.prepare('INSERT INTO posts (id,author_id,content,file_id,created_at) VALUES (@id,@author_id,@content,@file_id,@created_at)').run(post);
  res.status(201).json(serializePost(post,req.user.id));
});
app.delete('/api/posts/:id',auth,(req,res)=>{
  const p=db.prepare('SELECT * FROM posts WHERE id=? AND author_id=?').get(req.params.id,req.user.id);
  if(!p) return res.status(404).json({error:'Publicação não encontrada.'});
  db.prepare('DELETE FROM posts WHERE id=?').run(p.id); res.status(204).end();
});
app.post('/api/posts/:id/like',auth,(req,res)=>{
  const p=db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id); if(!p) return res.status(404).json({error:'Publicação não encontrada.'});
  const exists=!!db.prepare('SELECT 1 FROM likes WHERE post_id=? AND user_id=?').get(p.id,req.user.id);
  if(exists) db.prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').run(p.id,req.user.id);
  else { db.prepare('INSERT INTO likes (post_id,user_id,created_at) VALUES (?,?,?)').run(p.id,req.user.id,now()); createNotification(p.author_id,req.user.id,'like','curtiu sua publicação.',`post:${p.id}`); }
  res.json({liked:!exists,likes:db.prepare('SELECT COUNT(*) n FROM likes WHERE post_id=?').get(p.id).n});
});
app.get('/api/posts/:id/comments',auth,(req,res)=>{
  const rows=db.prepare(`SELECT c.*,u.name,u.username FROM comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? ORDER BY c.created_at ASC`).all(req.params.id);
  res.json(rows.map(c=>({id:c.id,text:c.text,createdAt:c.created_at,user:{id:c.user_id,name:c.name,username:c.username}})));
});
app.post('/api/posts/:id/comments',auth,(req,res)=>{
  const text=String(req.body?.text||'').trim(); const p=db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if(!p) return res.status(404).json({error:'Publicação não encontrada.'}); if(!text) return res.status(400).json({error:'Comentário vazio.'});
  const c={id:id(),post_id:p.id,user_id:req.user.id,text,created_at:now()}; db.prepare('INSERT INTO comments (id,post_id,user_id,text,created_at) VALUES (@id,@post_id,@user_id,@text,@created_at)').run(c);
  createNotification(p.author_id,req.user.id,'comment','comentou na sua publicação.',`post:${p.id}`); res.status(201).json(c);
});

// ---------- Files ----------
app.get('/api/files',auth,(req,res)=>{
  const rows=db.prepare('SELECT * FROM files WHERE owner_id=? ORDER BY created_at DESC').all(req.user.id); res.json(rows.map(serializeFile));
});
app.post('/api/files/upload',auth,upload.single('file'),(req,res)=>{
  if(!req.file) return res.status(400).json({error:'Selecione um arquivo.'});
  const visibility=['public','followers','private'].includes(req.body.visibility)?req.body.visibility:'private';
  const f={id:id(),owner_id:req.user.id,original_name:req.file.originalname,stored_name:req.file.filename,mime_type:req.file.mimetype,size_bytes:req.file.size,visibility,
    folder:String(req.body.folder||''),description:String(req.body.description||''),tags:String(req.body.tags||''),created_at:now()};
  db.prepare(`INSERT INTO files (id,owner_id,original_name,stored_name,mime_type,size_bytes,visibility,folder,description,tags,created_at)
    VALUES (@id,@owner_id,@original_name,@stored_name,@mime_type,@size_bytes,@visibility,@folder,@description,@tags,@created_at)`).run(f);
  res.status(201).json(serializeFile(f));
});
app.patch('/api/files/:id',auth,(req,res)=>{
  const f=db.prepare('SELECT * FROM files WHERE id=? AND owner_id=?').get(req.params.id,req.user.id); if(!f) return res.status(404).json({error:'Arquivo não encontrado.'});
  const visibility=['public','followers','private'].includes(req.body.visibility)?req.body.visibility:f.visibility;
  db.prepare('UPDATE files SET original_name=?,visibility=?,folder=?,description=?,tags=? WHERE id=?').run(
    String(req.body.name||f.original_name),visibility,String(req.body.folder ?? (f.folder || '')),String(req.body.description ?? (f.description || '')),String(req.body.tags ?? (f.tags || '')),f.id);
  res.json(serializeFile(db.prepare('SELECT * FROM files WHERE id=?').get(f.id)));
});
app.delete('/api/files/:id',auth,(req,res)=>{
  const f=db.prepare('SELECT * FROM files WHERE id=? AND owner_id=?').get(req.params.id,req.user.id); if(!f) return res.status(404).json({error:'Arquivo não encontrado.'});
  db.prepare('DELETE FROM files WHERE id=?').run(f.id); try{fs.unlinkSync(path.join(UPLOAD_DIR,f.stored_name));}catch{} res.status(204).end();
});
app.get('/api/files/:id/preview',auth,(req,res)=>{
  const f=db.prepare('SELECT * FROM files WHERE id=?').get(req.params.id);
  if(!f || !canAccessFile(req.user.id,f)) return res.status(403).json({error:'Você não tem permissão para visualizar este arquivo.'});
  if(!String(f.mime_type||'').startsWith('image/')) return res.status(415).json({error:'Este arquivo não é uma imagem.'});
  const absolute=path.join(UPLOAD_DIR,f.stored_name);
  if(!fs.existsSync(absolute)) return res.status(404).json({error:'Imagem não está disponível no servidor.'});
  res.setHeader('Content-Type',f.mime_type);res.setHeader('Cache-Control','private, no-store');res.sendFile(absolute);
});
app.get('/api/files/:id/download',auth,(req,res)=>{
  const f=db.prepare('SELECT * FROM files WHERE id=?').get(req.params.id); if(!f || !canAccessFile(req.user.id,f)) return res.status(403).json({error:'Você não tem permissão para acessar este arquivo.'});
  const absolute=path.join(UPLOAD_DIR,f.stored_name); if(!fs.existsSync(absolute)) return res.status(404).json({error:'Arquivo não está disponível no servidor.'});
  res.download(absolute,f.original_name);
});
app.get('/api/users/:username/files',auth,(req,res)=>{
  const u=db.prepare('SELECT * FROM users WHERE username=?').get(req.params.username.toLowerCase()); if(!u || (!bool(u.public_profile)&&u.id!==req.user.id)) return res.status(404).json({error:'Perfil não encontrado.'});
  const rows=db.prepare('SELECT * FROM files WHERE owner_id=? ORDER BY created_at DESC').all(u.id).filter(f=>canAccessFile(req.user.id,f)); res.json(rows.map(serializeFile));
});

// ---------- Messages ----------
app.get('/api/conversations',auth,(req,res)=>{
  const rows=db.prepare(`SELECT u.id,u.name,u.username,u.avatar_url,
    (SELECT text FROM messages m2 WHERE (m2.sender_id=u.id AND m2.receiver_id=?) OR (m2.sender_id=? AND m2.receiver_id=u.id) ORDER BY m2.created_at DESC LIMIT 1) lastText,
    (SELECT created_at FROM messages m3 WHERE (m3.sender_id=u.id AND m3.receiver_id=?) OR (m3.sender_id=? AND m3.receiver_id=u.id) ORDER BY m3.created_at DESC LIMIT 1) lastAt
    FROM users u WHERE u.id IN (SELECT receiver_id FROM messages WHERE sender_id=? UNION SELECT sender_id FROM messages WHERE receiver_id=?) ORDER BY lastAt DESC`).all(req.user.id,req.user.id,req.user.id,req.user.id,req.user.id,req.user.id);
  res.json(rows);
});
app.get('/api/messages/:userId',auth,(req,res)=>{
  const other=getUser(req.params.userId); if(!other) return res.status(404).json({error:'Usuário não encontrado.'});
  db.prepare('UPDATE messages SET read_at=? WHERE sender_id=? AND receiver_id=? AND read_at IS NULL').run(now(),other.id,req.user.id);
  const rows=db.prepare('SELECT * FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY created_at ASC').all(req.user.id,other.id,other.id,req.user.id);
  res.json(rows);
});
app.post('/api/messages',auth,(req,res)=>{
  const to=String(req.body?.to||''); const text=String(req.body?.text||'').trim(); const other=getUser(to);
  if(!other || !text) return res.status(400).json({error:'Destinatário e mensagem são obrigatórios.'});
  const m={id:id(),sender_id:req.user.id,receiver_id:other.id,text,created_at:now(),read_at:null};
  db.prepare('INSERT INTO messages (id,sender_id,receiver_id,text,created_at) VALUES (@id,@sender_id,@receiver_id,@text,@created_at)').run(m);
  createNotification(other.id,req.user.id,'message','enviou uma mensagem.'); res.status(201).json(m);
});

// ---------- Notifications / map ----------
app.get('/api/notifications',auth,(req,res)=>{
  const rows=db.prepare(`SELECT n.*,u.name,u.username FROM notifications n LEFT JOIN users u ON u.id=n.actor_id WHERE n.user_id=? ORDER BY n.created_at DESC LIMIT 50`).all(req.user.id);
  res.json(rows.map(n=>({id:n.id,type:n.type,message:n.message,link:n.link,read:!!n.read_at,createdAt:n.created_at,actor:n.actor_id?{name:n.name,username:n.username}:null})));
});
app.post('/api/notifications/read',auth,(req,res)=>{ db.prepare('UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL').run(now(),req.user.id); res.json({ok:true}); });
app.get('/api/map',auth,(req,res)=>{
  const rows=db.prepare('SELECT * FROM users WHERE public_profile=1 AND show_on_map=1 AND latitude IS NOT NULL AND longitude IS NOT NULL').all();
  res.json(rows.map(u=>({id:u.id,name:u.name,username:u.username,role:u.role,city:u.city,latitude:u.latitude,longitude:u.longitude})));
});

app.use((err,req,res,next)=>{
  if(err instanceof multer.MulterError) return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'Arquivo muito grande. Limite: 50 MB.':err.message});
  console.error(err); res.status(500).json({error:'Erro interno do servidor.'});
});
app.listen(PORT,()=>console.log(`DataTree API 2.0 rodando em http://localhost:${PORT}`));
