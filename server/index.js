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

const adminOnly=(permission)=>async(req,res,next)=>{
 if(!req.user||!["owner","admin","support","developer","finance"].includes(req.user.role))return res.status(403).json({error:"Admin access required"});
 if(req.user.role==="owner")return next();
 const {rows}=await pool.query("select 1 from admin_permissions where role=$1 and (permission=$2 or permission='*') limit 1",[req.user.role,permission]);
 if(!rows[0])return res.status(403).json({error:"Insufficient admin permission"});
 next();
};

async function audit(req,action,entityType=null,entityId=null,metadata={}){
 try{await pool.query("insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata,ip_address,user_agent) values($1,$2,$3,$4,$5,$6,$7)",[req.user?.id||null,action,entityType,entityId,JSON.stringify(metadata),req.ip,req.get("user-agent")||null]);}catch{}
}

app.get("/api/admin/me",auth,adminOnly("system.read"),async(req,res)=>{
 const {rows}=await pool.query("select id,name,email,role,created_at from users where id=$1",[req.user.id]);
 await audit(req,"admin.session.view");
 res.json(rows[0]);
});

app.get("/api/admin/dashboard",auth,adminOnly("system.read"),async(req,res)=>{
 const [customers,orders,pending,support,licenses,installations]=await Promise.all([
  pool.query("select count(*)::int as count from users where role='customer'"),
  pool.query("select count(*)::int as count,coalesce(sum(total_cents),0)::bigint as revenue from orders where status in ('approved','paid')"),
  pool.query("select count(*)::int as count from orders where status='pending'"),
  pool.query("select count(*)::int as count from support_cases where status in ('OPEN','IN_PROGRESS','WAITING')"),
  pool.query("select count(*)::int as count from licenses where status='ACTIVE'"),
  pool.query("select 0::int as count")
 ]);
 await audit(req,"admin.dashboard.view");
 res.json({customers:customers.rows[0],orders:orders.rows[0],pendingOrders:pending.rows[0],support:support.rows[0],licenses:licenses.rows[0],installations:installations.rows[0]});
});

app.get("/api/admin/activity",auth,adminOnly("system.read"),async(_req,res)=>{
 const {rows}=await pool.query("select a.id,a.action,a.entity_type,a.entity_id,a.metadata,a.created_at,u.name as actor_name from audit_logs a left join users u on u.id=a.actor_user_id order by a.created_at desc limit 25");
 res.json(rows);
});

app.get("/api/admin/health",auth,adminOnly("system.read"),async(_req,res)=>{
 const started=Date.now();await pool.query("select 1");
 res.json({api:"operational",database:"connected",latencyMs:Date.now()-started,environment:process.env.NODE_ENV||"development"});
});

// Phase Two — Commerce & Customer Management
app.get("/api/admin/customers",auth,adminOnly("customers.read"),async(req,res)=>{const {rows}=await pool.query(`select u.id,u.name,u.email,u.role,u.created_at,u.email_verified_at,(select count(*)::int from orders o where o.user_id=u.id) as order_count,(select coalesce(sum(o.total_cents),0)::bigint from orders o where o.user_id=u.id and o.status in ('approved','paid')) as paid_total_cents,(select count(*)::int from licenses l where l.user_id=u.id) as license_count from users u where u.role='customer' order by u.created_at desc`);await audit(req,"admin.customers.view");res.json(rows);});
app.get("/api/admin/customers/:id",auth,adminOnly("customers.read"),async(req,res)=>{const [customer,orders,licenses]=await Promise.all([pool.query("select id,name,email,role,created_at,email_verified_at from users where id=$1 and role='customer'",[req.params.id]),pool.query("select * from orders where user_id=$1 order by created_at desc",[req.params.id]),pool.query("select l.*,s.name as service_name from licenses l left join services s on s.id=l.service_id where l.user_id=$1 order by l.issued_at desc",[req.params.id])]);if(!customer.rows[0])return res.status(404).json({error:"Customer not found"});await audit(req,"admin.customer.view","user",req.params.id);res.json({customer:customer.rows[0],orders:orders.rows,licenses:licenses.rows});});
app.patch("/api/admin/customers/:id",auth,adminOnly("customers.manage"),async(req,res)=>{const {name,email,emailVerified}=req.body||{};if(!name?.trim()||!email?.trim())return res.status(400).json({error:"Name and email are required"});const {rows}=await pool.query("update users set name=$1,email=$2,email_verified_at=$3,updated_at=now() where id=$4 and role='customer' returning id,name,email,role,created_at,email_verified_at",[name.trim(),email.trim().toLowerCase(),emailVerified?new Date():null,req.params.id]);if(!rows[0])return res.status(404).json({error:"Customer not found"});await audit(req,"admin.customer.update","user",req.params.id,{email:rows[0].email});res.json(rows[0]);});
app.get("/api/admin/products",auth,adminOnly("products.read"),async(req,res)=>{const {rows}=await pool.query("select * from products order by active desc,created_at desc");await audit(req,"admin.products.view");res.json(rows);});
app.post("/api/admin/products",auth,adminOnly("products.manage"),async(req,res)=>{const {slug,name,description,priceCents,currency="USD",productType="platform",active=true}=req.body||{};if(!slug?.trim()||!name?.trim()||!Number.isInteger(Number(priceCents))||Number(priceCents)<0)return res.status(400).json({error:"Slug, name and a valid non-negative price are required"});try{const {rows}=await pool.query("insert into products(slug,name,description,price_cents,currency,product_type,active) values($1,$2,$3,$4,$5,$6,$7) returning *",[slug.trim().toLowerCase(),name.trim(),description?.trim()||null,Number(priceCents),currency,productType,Boolean(active)]);await audit(req,"admin.product.create","product",rows[0].id,{slug:rows[0].slug});res.status(201).json(rows[0]);}catch(error){if(error.code==="23505")return res.status(409).json({error:"A product with that slug already exists"});res.status(500).json({error:"Unable to create product"});}});
app.patch("/api/admin/products/:id",auth,adminOnly("products.manage"),async(req,res)=>{const {name,description,priceCents,currency,productType,active}=req.body||{};const {rows}=await pool.query("update products set name=coalesce($1,name),description=coalesce($2,description),price_cents=coalesce($3,price_cents),currency=coalesce($4,currency),product_type=coalesce($5,product_type),active=coalesce($6,active),updated_at=now() where id=$7 returning *",[name?.trim()||null,description??null,Number.isInteger(Number(priceCents))?Number(priceCents):null,currency||null,productType||null,typeof active==="boolean"?active:null,req.params.id]);if(!rows[0])return res.status(404).json({error:"Product not found"});await audit(req,"admin.product.update","product",req.params.id);res.json(rows[0]);});
app.get("/api/admin/orders",auth,adminOnly("orders.read"),async(req,res)=>{const {rows}=await pool.query(`select o.*,u.name as customer_name,u.email as customer_email,p.name as product_name from orders o join users u on u.id=o.user_id left join products p on p.id=o.product_id order by o.created_at desc`);await audit(req,"admin.orders.view");res.json(rows);});
app.patch("/api/admin/orders/:id",auth,adminOnly("orders.manage"),async(req,res)=>{const {status,paymentStatus,paymentReference}=req.body||{};const allowed=["pending","approved","rejected","paid","cancelled","refunded"];if(status&&!allowed.includes(status))return res.status(400).json({error:"Invalid order status"});const paymentAllowed=["unpaid","pending","paid","failed","refunded"];if(paymentStatus&&!paymentAllowed.includes(paymentStatus))return res.status(400).json({error:"Invalid payment status"});const {rows}=await pool.query("update orders set status=coalesce($1,status),payment_status=coalesce($2,payment_status),payment_reference=coalesce($3,payment_reference),updated_at=now() where id=$4 returning *",[status||null,paymentStatus||null,paymentReference?.trim()||null,req.params.id]);if(!rows[0])return res.status(404).json({error:"Order not found"});await audit(req,"admin.order.update","order",rows[0].id,{status:rows[0].status,payment_status:rows[0].payment_status});res.json(rows[0]);});
app.get("/api/admin/payments",auth,adminOnly("orders.read"),async(req,res)=>{const {rows}=await pool.query(`select o.id as order_id,o.payment_method,o.payment_provider,o.payment_reference,o.payment_status,o.total_cents,o.currency,o.status,o.created_at,u.name as customer_name,u.email as customer_email from orders o join users u on u.id=o.user_id order by o.created_at desc`);await audit(req,"admin.payments.view");res.json(rows);});

app.get("/api/services",auth,async(_req,res)=>{
  const {rows}=await pool.query("select * from services order by name");res.json(rows);
});

app.get("/api/licenses",auth,async(req,res)=>{
  const {rows}=await pool.query("select l.id,l.license_key,l.license_type,l.status,l.scope,l.issued_at,l.expires_at,s.name as service_name from licenses l left join services s on s.id=l.service_id where l.user_id=$1 order by l.issued_at desc",[req.user.id]);
  res.json(rows);
});

app.post("/api/orders",auth,async(req,res)=>{
 const {template="Complete Package",paymentMethod="card"}=req.body||{};
 const product=await pool.query("select id,name,price_cents,currency from products where slug='complete-package' and active=true limit 1");
 if(!product.rows[0])return res.status(503).json({error:"The AniFuze product catalog is not configured"});
 const p=product.rows[0];
 const subtotalCents=7000;
 const discountCents=Math.max(0,subtotalCents-p.price_cents);
 const totalCents=p.price_cents;
 const {rows}=await pool.query("insert into orders(user_id,status,currency,subtotal_cents,discount_cents,total_cents,payment_provider,payment_method,payment_status,product_id,metadata) values($1,'pending',$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10) returning *",[req.user.id,p.currency,subtotalCents,discountCents,totalCents,paymentMethod==="whatsapp"?"whatsapp":"checkout",paymentMethod,p.id,JSON.stringify({template,product:p.name})]);
 res.status(201).json({...rows[0],template});
});

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
