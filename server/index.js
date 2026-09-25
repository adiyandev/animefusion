import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import pg from "pg";

const {Pool}=pg;
const app=express();
const port=Number(process.env.PORT||8787);
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:false}});

app.use(cors({origin:(process.env.FRONTEND_ORIGIN||"").split(",").filter(Boolean),credentials:true}));
app.use(express.json({limit:"2mb"}));

const hash=(value)=>crypto.createHash("sha256").update(value).digest("hex");
const token=()=>crypto.randomBytes(32).toString("hex");

async function auth(req,res,next){
  const raw=req.headers.authorization?.replace(/^Bearer\s+/i,"");
  if(!raw)return res.status(401).json({error:"Authentication required"});
  const {rows}=await pool.query("select u.* from sessions s join users u on u.id=s.user_id where s.token_hash=$1 and s.expires_at>now()",[hash(raw)]);
  if(!rows[0])return res.status(401).json({error:"Invalid or expired session"});
  req.user=rows[0];
  req.token=raw;
  next();
}

app.get("/health",async(_req,res)=>{
  try{await pool.query("select 1");res.json({ok:true,service:"anifuze-api",database:"connected"});}
  catch(error){res.status(503).json({ok:false,service:"anifuze-api",database:"unavailable",error:error.message});}
});

app.post("/api/auth/signup",async(req,res)=>{
  const {name,email,password}=req.body||{};
  if(!name||!email||!password||password.length<8)return res.status(400).json({error:"Name, email and an 8+ character password are required"});
  try{
    const passwordHash=hash(password);
    const {rows}=await pool.query("insert into users(name,email,password_hash) values($1,$2,$3) returning id,name,email,role,created_at",[name.trim(),email.trim().toLowerCase(),passwordHash]);
    const user=rows[0], raw=token();
    await pool.query("insert into profiles(user_id,display_name) values($1,$2) on conflict(user_id) do nothing",[user.id,user.name]);
    await pool.query("insert into sessions(user_id,token_hash,expires_at,last_seen_at) values($1,$2,now()+interval '30 days',now())",[user.id,hash(raw)]);
    res.status(201).json({token:raw,user});
  }catch(error){
    if(error.code==="23505")return res.status(409).json({error:"An account with that email already exists"});
    res.status(500).json({error:"Unable to create account"});
  }
});

app.post("/api/auth/login",async(req,res)=>{
  const {email,password}=req.body||{};
  if(!email||!password)return res.status(400).json({error:"Email and password are required"});
  const {rows}=await pool.query("select id,name,email,role,password_hash,created_at from users where email=$1",[email.trim().toLowerCase()]);
  if(!rows[0]||!rows[0].password_hash||hash(password)!==rows[0].password_hash)return res.status(401).json({error:"Invalid email or password"});
  const user=rows[0];delete user.password_hash;const raw=token();
  await pool.query("insert into sessions(user_id,token_hash,expires_at,last_seen_at) values($1,$2,now()+interval '30 days',now())",[user.id,hash(raw)]);
  res.json({token:raw,user});
});

app.post("/api/auth/logout",auth,async(req,res)=>{
  await pool.query("delete from sessions where token_hash=$1",[hash(req.token)]);res.status(204).end();
});

app.put("/api/me",auth,async(req,res)=>{const {name,displayName,bio,avatarUrl,bannerUrl,preferences}=req.body||{};const nextName=String(name||req.user.name).trim();await pool.query("update users set name=$1,updated_at=now() where id=$2",[nextName,req.user.id]);await pool.query("insert into profiles(user_id,display_name,bio,avatar_url,banner_url,preferences) values($1,$2,$3,$4,$5,$6) on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,avatar_url=excluded.avatar_url,banner_url=excluded.banner_url,preferences=excluded.preferences,updated_at=now()",[req.user.id,displayName||nextName,bio||null,avatarUrl||null,bannerUrl||null,preferences||{}]);const {rows}=await pool.query("select u.id,u.name,u.email,u.role,u.created_at,p.display_name,p.avatar_url,p.banner_url,p.bio,p.preferences from users u left join profiles p on p.user_id=u.id where u.id=$1",[req.user.id]);res.json(rows[0]);});

app.get("/api/me",auth,async(req,res)=>{
  const {rows}=await pool.query("select u.id,u.name,u.email,u.role,u.created_at,p.display_name,p.avatar_url,p.banner_url,p.bio,p.preferences from users u left join profiles p on p.user_id=u.id where u.id=$1",[req.user.id]);
  res.json(rows[0]);
});

app.get("/api/services",auth,async(_req,res)=>{
  const {rows}=await pool.query("select * from services order by name");res.json(rows);
});

app.get("/api/licenses",auth,async(req,res)=>{
  const {rows}=await pool.query("select l.id,l.license_key,l.license_type,l.status,l.scope,l.issued_at,l.expires_at,s.name as service_name from licenses l left join services s on s.id=l.service_id where l.user_id=$1 order by l.issued_at desc",[req.user.id]);
  res.json(rows);
});

app.post("/api/orders",auth,async(req,res)=>{const {subtotalCents=5600,discountCents=1400,totalCents=4200,currency="USD",template="Complete Package"}=req.body||{};const {rows}=await pool.query("insert into orders(user_id,status,currency,subtotal_cents,discount_cents,total_cents,payment_provider) values($1,'pending',$2,$3,$4,$5,$6) returning *",[req.user.id,currency,subtotalCents,discountCents,totalCents,"checkout"]);res.status(201).json({...rows[0],template});});

app.get("/api/orders",auth,async(req,res)=>{
  const {rows}=await pool.query("select * from orders where user_id=$1 order by created_at desc",[req.user.id]);res.json(rows);
});

app.get("/api/support/cases",auth,async(req,res)=>{
  const {rows}=await pool.query("select c.*,coalesce((select count(*) from support_messages m where m.case_id=c.id),0)::int as message_count from support_cases c where c.user_id=$1 order by c.updated_at desc",[req.user.id]);res.json(rows);
});

app.post("/api/support/cases",auth,async(req,res)=>{
  const {subject,body}=req.body||{};
  if(!subject||!body)return res.status(400).json({error:"Subject and message are required"});
  const client=await pool.connect();
  try{
    await client.query("begin");
    const caseNumber="CASE-"+crypto.randomInt(100000,999999);
    const c=await client.query("insert into support_cases(case_number,user_id,subject) values($1,$2,$3) returning *",[caseNumber,req.user.id,subject.trim()]);
    await client.query("insert into support_messages(case_id,sender_user_id,body) values($1,$2,$3)",[c.rows[0].id,req.user.id,body.trim()]);
    await client.query("commit");res.status(201).json(c.rows[0]);
  }catch(error){await client.query("rollback");res.status(500).json({error:"Unable to create support case"});}
  finally{client.release();}
});

app.get("/api/support/cases/:id/messages",auth,async(req,res)=>{
  const {rows}=await pool.query("select m.*,u.name as sender_name from support_messages m left join users u on u.id=m.sender_user_id join support_cases c on c.id=m.case_id where m.case_id=$1 and c.user_id=$2 order by m.created_at",[req.params.id,req.user.id]);
  res.json(rows);
});

app.post("/api/support/cases/:id/messages",auth,async(req,res)=>{
  const {body}=req.body||{};if(!body?.trim())return res.status(400).json({error:"Message is required"});
  const {rows}=await pool.query("insert into support_messages(case_id,sender_user_id,body) select c.id,$2,$3 from support_cases c where c.id=$1 and c.user_id=$2 returning *",[req.params.id,req.user.id,body.trim()]);
  if(!rows[0])return res.status(404).json({error:"Case not found"});
  await pool.query("update support_cases set updated_at=now() where id=$1",[req.params.id]);res.status(201).json(rows[0]);
});

app.listen(port,()=>console.log("AniFuze API listening on "+port));
