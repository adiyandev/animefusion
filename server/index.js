import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import pg from "pg";

const {Pool}=pg;
const app=express();
const port=Number(process.env.PORT||8787);
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:false}});

const allowedOrigins=[...new Set(["https://adiyandev.github.io",...(process.env.FRONTEND_ORIGIN||"").split(",").map(value=>value.trim().replace(/\/$/,"")).filter(Boolean))];
const corsOptions={
  origin:(origin,callback)=>{
    if(!origin||allowedOrigins.includes(origin))return callback(null,true);
    return callback(null,false);
  },
  credentials:true,
  methods:["GET","HEAD","PUT","PATCH","POST","DELETE","OPTIONS"],
  allowedHeaders:["Content-Type","Authorization"]
};
app.use(cors(corsOptions));
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
app.patch("/api/admin/orders/:id",auth,adminOnly("orders.manage"),async(req,res)=>{const {status,paymentStatus,paymentReference}=req.body||{};const allowed=["pending","approved","rejected","paid","cancelled","refunded"];if(status&&!allowed.includes(status))return res.status(400).json({error:"Invalid order status"});const paymentAllowed=["unpaid","pending","paid","failed","refunded"];if(paymentStatus&&!paymentAllowed.includes(paymentStatus))return res.status(400).json({error:"Invalid payment status"});const {rows}=await pool.query("update orders set status=coalesce($1,status),payment_status=coalesce($2,payment_status),payment_reference=coalesce($3,payment_reference),updated_at=now() where id=$4 returning *",[status||null,paymentStatus||null,paymentReference?.trim()||null,req.params.id]);if(!rows[0])return res.status(404).json({error:"Order not found"});
 if((rows[0].status==="approved"||rows[0].status==="paid")&&rows[0].product_id){
   const existing=await pool.query("select id from licenses where order_id=$1 limit 1",[rows[0].id]);
   if(!existing.rows[0]){
     const key=makeLicenseKey();
     const issued=await pool.query("insert into licenses(user_id,order_id,product_id,license_key,license_type,status,scope,max_activations) values($1,$2,$3,$4,'platform','ACTIVE','Production deployment',1) returning id",[rows[0].user_id,rows[0].id,rows[0].product_id,key]);
     const release=await pool.query("select id from releases where status='published' order by published_at desc nulls last limit 1");
     await pool.query("insert into deliveries(user_id,order_id,license_id,release_id,delivery_type,status,metadata) values($1,$2,$3,$4,'release','pending',$5)",[rows[0].user_id,rows[0].id,issued.rows[0].id,release.rows[0]?.id||null,JSON.stringify({product_id:rows[0].product_id})]);
     await audit(req,"license.auto_issue","license",issued.rows[0].id,{order_id:rows[0].id,user_id:rows[0].user_id});
   }
 }
 await audit(req,"admin.order.update","order",rows[0].id,{status:rows[0].status,payment_status:rows[0].payment_status});res.json(rows[0]);});
app.get("/api/admin/payments",auth,adminOnly("orders.read"),async(req,res)=>{const {rows}=await pool.query(`select o.id as order_id,o.payment_method,o.payment_provider,o.payment_reference,o.payment_status,o.total_cents,o.currency,o.status,o.created_at,u.name as customer_name,u.email as customer_email from orders o join users u on u.id=o.user_id order by o.created_at desc`);await audit(req,"admin.payments.view");res.json(rows);});

// Phase Three — Licensing, Entitlements, Activations & Installations
const makeLicenseKey=()=>{const raw=crypto.randomBytes(18).toString("base64url").toUpperCase();return "ANIFUZE-"+raw.match(/.{1,6}/g).join("-")};

app.get("/api/admin/licenses",auth,adminOnly("licenses.read"),async(req,res)=>{
 const {rows}=await pool.query(`select l.*,u.name as customer_name,u.email as customer_email,p.name as product_name,s.name as service_name,
 (select count(*)::int from license_activations a where a.license_id=l.id and a.status='ACTIVE') as active_activations
 from licenses l join users u on u.id=l.user_id left join products p on p.id=l.product_id left join services s on s.id=l.service_id order by l.issued_at desc`);
 await audit(req,"admin.licenses.view");res.json(rows);
});

app.post("/api/admin/licenses",auth,adminOnly("licenses.manage"),async(req,res)=>{
 const {userId,productId,serviceId,orderId,licenseType="platform",scope="Production deployment",maxActivations=1,expiresAt}=req.body||{};
 if(!userId)return res.status(400).json({error:"Customer is required"});
 const user=await pool.query("select id from users where id=$1 and role='customer'",[userId]);
 if(!user.rows[0])return res.status(404).json({error:"Customer not found"});
 const key=makeLicenseKey();
 const {rows}=await pool.query("insert into licenses(user_id,service_id,order_id,product_id,license_key,license_type,status,scope,max_activations,expires_at) values($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$8,$9) returning *",[userId,serviceId||null,orderId||null,productId||null,key,licenseType,scope,Math.max(1,Number(maxActivations)||1),expiresAt||null]);
 await audit(req,"admin.license.create","license",rows[0].id,{user_id:userId});
 res.status(201).json(rows[0]);
});

app.patch("/api/admin/licenses/:id",auth,adminOnly("licenses.manage"),async(req,res)=>{
 const {status,scope,maxActivations,expiresAt}=req.body||{};
 if(status&&!["ACTIVE","SUSPENDED","REVOKED","EXPIRED"].includes(status))return res.status(400).json({error:"Invalid license status"});
 const {rows}=await pool.query("update licenses set status=coalesce($1,status),scope=coalesce($2,scope),max_activations=coalesce($3,max_activations),expires_at=coalesce($4,expires_at),revoked_at=case when $1='REVOKED' then now() when $1='ACTIVE' then null else revoked_at end,updated_at=now() where id=$5 returning *",[status||null,scope||null,Number.isInteger(Number(maxActivations))?Math.max(1,Number(maxActivations)):null,expiresAt||null,req.params.id]);
 if(!rows[0])return res.status(404).json({error:"License not found"});
 await audit(req,"admin.license.update","license",req.params.id,{status:rows[0].status});res.json(rows[0]);
});

app.get("/api/admin/activations",auth,adminOnly("activations.read"),async(req,res)=>{
 const {rows}=await pool.query(`select a.id,a.license_id,a.user_id,a.label,a.fingerprint_hash,a.status,a.activated_at,a.last_seen_at,a.revoked_at,
 u.name as customer_name,u.email as customer_email,l.license_key from license_activations a join users u on u.id=a.user_id join licenses l on l.id=a.license_id order by a.activated_at desc`);
 await audit(req,"admin.activations.view");res.json(rows);
});

app.patch("/api/admin/activations/:id",auth,adminOnly("activations.manage"),async(req,res)=>{
 const {status}=req.body||{};if(!["ACTIVE","REVOKED"].includes(status))return res.status(400).json({error:"Invalid activation status"});
 const {rows}=await pool.query("update license_activations set status=$1,revoked_at=case when $1='REVOKED' then now() else null end where id=$2 returning *",[status,req.params.id]);
 if(!rows[0])return res.status(404).json({error:"Activation not found"});
 await pool.query("update licenses l set activation_count=(select count(*) from license_activations a where a.license_id=l.id and a.status='ACTIVE'),updated_at=now() where l.id=$1",[rows[0].license_id]);
 await audit(req,"admin.activation.update","license_activation",rows[0].id,{status});res.json(rows[0]);
});

app.get("/api/admin/installations",auth,adminOnly("installations.read"),async(req,res)=>{
 const {rows}=await pool.query(`select i.*,u.name as customer_name,u.email as customer_email,l.license_key from installations i join users u on u.id=i.user_id left join licenses l on l.id=i.license_id order by i.updated_at desc`);
 await audit(req,"admin.installations.view");res.json(rows);
});

app.patch("/api/admin/installations/:id",auth,adminOnly("installations.manage"),async(req,res)=>{
 const {status,version,domain}=req.body||{};if(status&&!["ACTIVE","INACTIVE","SUSPENDED"].includes(status))return res.status(400).json({error:"Invalid installation status"});
 const {rows}=await pool.query("update installations set status=coalesce($1,status),version=coalesce($2,version),domain=coalesce($3,domain),updated_at=now() where id=$4 returning *",[status||null,version||null,domain||null,req.params.id]);
 if(!rows[0])return res.status(404).json({error:"Installation not found"});
 await audit(req,"admin.installation.update","installation",rows[0].id,{status:rows[0].status});res.json(rows[0]);
});

app.get("/api/licenses",auth,async(req,res)=>{
 const {rows}=await pool.query("select l.id,l.license_key,l.license_type,l.status,l.scope,l.max_activations,l.activation_count,l.issued_at,l.expires_at,p.name as product_name,s.name as service_name from licenses l left join products p on p.id=l.product_id left join services s on s.id=l.service_id where l.user_id=$1 order by l.issued_at desc",[req.user.id]);
 res.json(rows);
});

app.post("/api/license/activate",auth,async(req,res)=>{
 const {licenseKey,fingerprint,label,domain,version,environment="production"}=req.body||{};
 if(!licenseKey||!fingerprint)return res.status(400).json({error:"License key and installation fingerprint are required"});
 const license=await pool.query("select l.*,p.name as product_name from licenses l left join products p on p.id=l.product_id where l.license_key=$1 and l.user_id=$2",[licenseKey.trim().toUpperCase(),req.user.id]);
 const l=license.rows[0];
 if(!l)return res.status(404).json({error:"License not found"});
 if(l.status!=="ACTIVE"|| (l.expires_at&&new Date(l.expires_at)<new Date()))return res.status(403).json({error:"License is not active"});
 const fp=hash(String(fingerprint));
 const existing=await pool.query("select * from license_activations where license_id=$1 and fingerprint_hash=$2",[l.id,fp]);
 if(existing.rows[0]){
   await pool.query("update license_activations set last_seen_at=now(),status='ACTIVE',revoked_at=null,label=coalesce($1,label) where id=$2",[label||null,existing.rows[0].id]);
   return res.json({activationId:existing.rows[0].id,licenseId:l.id,status:"ACTIVE",product:l.product_name});
 }
 const count=await pool.query("select count(*)::int as count from license_activations where license_id=$1 and status='ACTIVE'",[l.id]);
 if(count.rows[0].count>=l.max_activations)return res.status(409).json({error:"Activation limit reached"});
 const activationToken=token(),activation=await pool.query("insert into license_activations(license_id,user_id,activation_token_hash,fingerprint_hash,label) values($1,$2,$3,$4,$5) returning id",[l.id,req.user.id,hash(activationToken),fp,label||null]);
 const installation=await pool.query("insert into installations(user_id,license_id,activation_id,domain,version,environment,status,last_seen_at) values($1,$2,$3,$4,$5,$6,'ACTIVE',now()) returning id",[req.user.id,l.id,activation.rows[0].id,domain||null,version||null,environment]);
 await pool.query("update license_activations set installation_id=$1 where id=$2",[installation.rows[0].id,activation.rows[0].id]);
 await pool.query("update licenses set activation_count=activation_count+1,updated_at=now() where id=$1",[l.id]);
 res.status(201).json({activationId:activation.rows[0].id,installationId:installation.rows[0].id,activationToken,licenseId:l.id,status:"ACTIVE",product:l.product_name});
});

app.post("/api/license/heartbeat",auth,async(req,res)=>{
 const {activationToken,fingerprint}=req.body||{};if(!activationToken||!fingerprint)return res.status(400).json({error:"Activation token and fingerprint are required"});
 const {rows}=await pool.query("select a.id,a.license_id,a.status,l.status as license_status,l.expires_at from license_activations a join licenses l on l.id=a.license_id where a.activation_token_hash=$1 and a.user_id=$2 and a.fingerprint_hash=$3",[hash(activationToken),req.user.id,hash(String(fingerprint))]);
 if(!rows[0]||rows[0].status!=="ACTIVE"||rows[0].license_status!=="ACTIVE")return res.status(403).json({error:"Activation is not valid"});
 if(rows[0].expires_at&&new Date(rows[0].expires_at)<new Date())return res.status(403).json({error:"License has expired"});
 await pool.query("update license_activations set last_seen_at=now() where id=$1",[rows[0].id]);
 await pool.query("update installations set last_seen_at=now(),updated_at=now() where activation_id=$1",[rows[0].id]);
 res.json({valid:true,status:"ACTIVE"});
});

// Phase Four — Platform, Providers, Releases, Delivery & Marketplace
app.get("/api/admin/providers",auth,adminOnly("providers.read"),async(req,res)=>{
 const {rows}=await pool.query("select id,slug,name,provider_type,endpoint,priority,enabled,health_status,last_checked_at,created_at,updated_at from providers order by enabled desc,priority asc,name");
 await audit(req,"admin.providers.view");res.json(rows);
});
app.post("/api/admin/providers",auth,adminOnly("providers.manage"),async(req,res)=>{
 const {slug,name,providerType="api",endpoint,priority=100,enabled=true,config={}}=req.body||{};
 if(!slug?.trim()||!name?.trim())return res.status(400).json({error:"Slug and name are required"});
 try{const {rows}=await pool.query("insert into providers(slug,name,provider_type,endpoint,priority,enabled,config) values($1,$2,$3,$4,$5,$6,$7) returning id,slug,name,provider_type,endpoint,priority,enabled,health_status,last_checked_at,created_at,updated_at",[slug.trim().toLowerCase(),name.trim(),providerType,endpoint?.trim()||null,Number(priority)||100,Boolean(enabled),JSON.stringify(config)]);await audit(req,"admin.provider.create","provider",rows[0].id);res.status(201).json(rows[0]);}catch(e){if(e.code==="23505")return res.status(409).json({error:"Provider slug already exists"});res.status(500).json({error:"Unable to create provider"});}});
app.patch("/api/admin/providers/:id",auth,adminOnly("providers.manage"),async(req,res)=>{
 const {name,endpoint,priority,enabled,healthStatus,config}=req.body||{};
 if(healthStatus&&!["unknown","healthy","degraded","offline"].includes(healthStatus))return res.status(400).json({error:"Invalid health status"});
 const {rows}=await pool.query("update providers set name=coalesce($1,name),endpoint=coalesce($2,endpoint),priority=coalesce($3,priority),enabled=coalesce($4,enabled),health_status=coalesce($5,health_status),config=coalesce($6,config),updated_at=now() where id=$7 returning id,slug,name,provider_type,endpoint,priority,enabled,health_status,last_checked_at,created_at,updated_at",[name?.trim()||null,endpoint?.trim()||null,Number.isInteger(Number(priority))?Number(priority):null,typeof enabled==="boolean"?enabled:null,healthStatus||null,config?JSON.stringify(config):null,req.params.id]);
 if(!rows[0])return res.status(404).json({error:"Provider not found"});await audit(req,"admin.provider.update","provider",req.params.id);res.json(rows[0]);
});
app.post("/api/admin/providers/:id/health",auth,adminOnly("providers.manage"),async(req,res)=>{
 const p=await pool.query("select * from providers where id=$1",[req.params.id]);if(!p.rows[0])return res.status(404).json({error:"Provider not found"});
 const started=Date.now();let status="healthy",statusCode=200,error=null;
 if(!p.rows[0].endpoint)status="unknown";else try{const response=await fetch(p.rows[0].endpoint,{method:"GET",signal:AbortSignal.timeout(8000)});statusCode=response.status;status=response.ok?"healthy":"degraded";if(!response.ok)error="Provider returned "+response.status;}catch(e){status="offline";statusCode=null;error=e.message;}
 await pool.query("update providers set health_status=$1,last_checked_at=now(),updated_at=now() where id=$2",[status,req.params.id]);
 await pool.query("insert into provider_requests(provider_id,user_id,action,success,status_code,latency_ms,error) values($1,$2,'health_check',$3,$4,$5,$6)",[req.params.id,req.user.id,status==="healthy",statusCode,Date.now()-started,error]);
 await audit(req,"admin.provider.health_check","provider",req.params.id,{status});res.json({status,statusCode,latencyMs:Date.now()-started,error});
});

app.get("/api/admin/provider-requests",auth,adminOnly("providers.read"),async(req,res)=>{
 const {rows}=await pool.query("select r.*,p.name as provider_name from provider_requests r join providers p on p.id=r.provider_id order by r.created_at desc limit 200");res.json(rows);
});

app.get("/api/admin/releases",auth,adminOnly("releases.read"),async(req,res)=>{
 const {rows}=await pool.query("select r.*,u.name as created_by_name from releases r left join users u on u.id=r.created_by order by r.created_at desc");await audit(req,"admin.releases.view");res.json(rows);
});
app.post("/api/admin/releases",auth,adminOnly("releases.manage"),async(req,res)=>{
 const {version,channel="stable",releaseNotes="",artifactUrl,checksumSha256,signature}=req.body||{};
 if(!version?.trim())return res.status(400).json({error:"Version is required"});
 try{const {rows}=await pool.query("insert into releases(version,channel,release_notes,artifact_url,checksum_sha256,signature,created_by) values($1,$2,$3,$4,$5,$6,$7) returning *",[version.trim(),channel,releaseNotes?.trim()||null,artifactUrl?.trim()||null,checksumSha256?.trim()||null,signature?.trim()||null,req.user.id]);await audit(req,"admin.release.create","release",rows[0].id);res.status(201).json(rows[0]);}catch(e){if(e.code==="23505")return res.status(409).json({error:"Release version already exists"});res.status(500).json({error:"Unable to create release"});}});
app.patch("/api/admin/releases/:id",auth,adminOnly("releases.manage"),async(req,res)=>{
 const {status,releaseNotes,artifactUrl,checksumSha256,signature}=req.body||{};if(status&&!["draft","ready","published","revoked"].includes(status))return res.status(400).json({error:"Invalid release status"});
 const {rows}=await pool.query("update releases set status=coalesce($1,status),release_notes=coalesce($2,release_notes),artifact_url=coalesce($3,artifact_url),checksum_sha256=coalesce($4,checksum_sha256),signature=coalesce($5,signature),published_at=case when $1='published' then coalesce(published_at,now()) else published_at end,updated_at=now() where id=$6 returning *",[status||null,releaseNotes??null,artifactUrl??null,checksumSha256??null,signature??null,req.params.id]);
 if(!rows[0])return res.status(404).json({error:"Release not found"});await audit(req,"admin.release.update","release",req.params.id,{status:rows[0].status});res.json(rows[0]);
});

app.get("/api/admin/templates",auth,adminOnly("templates.read"),async(req,res)=>{const {rows}=await pool.query("select * from templates order by active desc,created_at desc");await audit(req,"admin.templates.view");res.json(rows);});
app.post("/api/admin/templates",auth,adminOnly("templates.manage"),async(req,res)=>{
 const {slug,name,description,version="1.0.0",priceCents=0,previewUrl,packageUrl,checksumSha256}=req.body||{};if(!slug?.trim()||!name?.trim())return res.status(400).json({error:"Slug and name are required"});
 try{const {rows}=await pool.query("insert into templates(slug,name,description,version,price_cents,preview_url,package_url,checksum_sha256) values($1,$2,$3,$4,$5,$6,$7,$8) returning *",[slug.trim().toLowerCase(),name.trim(),description?.trim()||null,version,Math.max(0,Number(priceCents)||0),previewUrl||null,packageUrl||null,checksumSha256||null]);await audit(req,"admin.template.create","template",rows[0].id);res.status(201).json(rows[0]);}catch(e){if(e.code==="23505")return res.status(409).json({error:"Template slug already exists"});res.status(500).json({error:"Unable to create template"});}});
app.patch("/api/admin/templates/:id",auth,adminOnly("templates.manage"),async(req,res)=>{const {active,priceCents,packageUrl,previewUrl}=req.body||{};const {rows}=await pool.query("update templates set active=coalesce($1,active),price_cents=coalesce($2,price_cents),package_url=coalesce($3,package_url),preview_url=coalesce($4,preview_url),updated_at=now() where id=$5 returning *",[typeof active==="boolean"?active:null,Number.isInteger(Number(priceCents))?Math.max(0,Number(priceCents)):null,packageUrl||null,previewUrl||null,req.params.id]);if(!rows[0])return res.status(404).json({error:"Template not found"});await audit(req,"admin.template.update","template",req.params.id);res.json(rows[0]);});

app.get("/api/templates",auth,async(req,res)=>{const {rows}=await pool.query("select id,slug,name,description,version,price_cents,currency,active,presentation_only,preview_url,checksum_sha256,metadata from templates where active=true order by created_at desc");res.json(rows);});
app.get("/api/deliveries",auth,async(req,res)=>{const {rows}=await pool.query("select d.id,d.delivery_type,d.status,d.created_at,d.downloaded_at,r.version,t.name as template_name from deliveries d left join releases r on r.id=d.release_id left join templates t on t.id=d.template_id where d.user_id=$1 order by d.created_at desc",[req.user.id]);res.json(rows);});
app.post("/api/admin/deliveries/:id/authorize",auth,adminOnly("delivery.manage"),async(req,res)=>{
 const delivery=await pool.query("select * from deliveries where id=$1",[req.params.id]);if(!delivery.rows[0])return res.status(404).json({error:"Delivery not found"});
 const raw=token();const {rows}=await pool.query("update deliveries set status='authorized',download_token_hash=$1,download_expires_at=now()+interval '24 hours' where id=$2 returning id,status,download_expires_at",[hash(raw),req.params.id]);await audit(req,"admin.delivery.authorize","delivery",req.params.id);res.json({...rows[0],downloadToken:raw});
});
app.get("/api/admin/deliveries",auth,adminOnly("delivery.read"),async(req,res)=>{const {rows}=await pool.query("select d.*,u.name as customer_name,u.email as customer_email,r.version,t.name as template_name from deliveries d join users u on u.id=d.user_id left join releases r on r.id=d.release_id left join templates t on t.id=d.template_id order by d.created_at desc");res.json(rows);});

// Phase Five — Operations, Analytics, Notifications, Security, Settings, Backups & Updates
app.post("/api/analytics/events",async(req,res)=>{
 const {eventName,path,sessionId,metadata={}}=req.body||{};if(!eventName)return res.status(400).json({error:"eventName is required"});
 try{await pool.query("insert into analytics_events(user_id,event_name,path,session_id,ip_address,user_agent,metadata) values($1,$2,$3,$4,$5,$6,$7)",[req.user?.id||null,eventName,path||null,sessionId||null,req.ip,req.get("user-agent")||null,JSON.stringify(metadata)]);res.status(202).json({accepted:true});}catch(e){res.status(500).json({error:"Unable to record analytics event"});}
});
app.get("/api/notifications",auth,async(req,res)=>{const {rows}=await pool.query("select * from notifications where user_id=$1 order by created_at desc limit 100",[req.user.id]);res.json(rows);});
app.patch("/api/notifications/:id/read",auth,async(req,res)=>{const {rows}=await pool.query("update notifications set read_at=coalesce(read_at,now()) where id=$1 and user_id=$2 returning *",[req.params.id,req.user.id]);if(!rows[0])return res.status(404).json({error:"Notification not found"});res.json(rows[0]);});
app.post("/api/security/change-password",auth,async(req,res)=>{
 const {currentPassword,newPassword}=req.body||{};if(!currentPassword||!newPassword||newPassword.length<8)return res.status(400).json({error:"Current password and an 8+ character new password are required"});
 const user=await pool.query("select password_hash from users where id=$1",[req.user.id]);if(!user.rows[0]||user.rows[0].password_hash!==hash(currentPassword))return res.status(401).json({error:"Current password is incorrect"});
 await pool.query("update users set password_hash=$1,password_changed_at=now(),updated_at=now() where id=$2",[hash(newPassword),req.user.id]);
 await pool.query("delete from sessions where user_id=$1 and token_hash<>$2",[req.user.id,hash(req.token)]);
 await pool.query("insert into security_events(user_id,event_type,severity,ip_address,user_agent,metadata) values($1,'password_changed','info',$2,$3,$4)",[req.user.id,req.ip,req.get("user-agent")||null,JSON.stringify({sessions_revoked:true})]);
 res.json({ok:true});
});

app.get("/api/admin/analytics",auth,adminOnly("analytics.read"),async(req,res)=>{
 const [totals,events,users,orders]=await Promise.all([
  pool.query("select count(*)::int as events,count(distinct user_id)::int as unique_users from analytics_events where created_at>now()-interval '30 days'"),
  pool.query("select event_name,count(*)::int as count from analytics_events where created_at>now()-interval '30 days' group by event_name order by count desc limit 20"),
  pool.query("select count(*)::int as count from users where created_at>now()-interval '30 days'"),
  pool.query("select count(*)::int as count,coalesce(sum(total_cents),0)::bigint as revenue_cents from orders where created_at>now()-interval '30 days' and status in ('approved','paid')")
 ]);await audit(req,"admin.analytics.view");res.json({totals:totals.rows[0],events:events.rows,recentCustomers:users.rows[0].count,revenueCents:orders.rows[0].revenue_cents,orders:orders.rows[0].count});
});
app.get("/api/admin/notifications",auth,adminOnly("notifications.manage"),async(req,res)=>{const {rows}=await pool.query("select n.*,u.name as customer_name,u.email as customer_email from notifications n join users u on u.id=n.user_id order by n.created_at desc limit 200");res.json(rows);});
app.post("/api/admin/notifications",auth,adminOnly("notifications.manage"),async(req,res)=>{
 const {userId,title,body,type="system",metadata={}}=req.body||{};if(!userId||!title||!body)return res.status(400).json({error:"Customer, title and body are required"});
 const {rows}=await pool.query("insert into notifications(user_id,title,body,type,metadata) values($1,$2,$3,$4,$5) returning *",[userId,title,body,type,JSON.stringify(metadata)]);await audit(req,"notification.create","notification",rows[0].id,{user_id:userId});res.status(201).json(rows[0]);
});
app.get("/api/admin/security",auth,adminOnly("security.read"),async(req,res)=>{const {rows}=await pool.query("select s.*,u.name as user_name,u.email from security_events s left join users u on u.id=s.user_id order by s.created_at desc limit 200");res.json(rows);});
app.get("/api/admin/settings",auth,adminOnly("settings.read"),async(req,res)=>{const {rows}=await pool.query("select key,value,secret,updated_at from system_settings order by key");res.json(rows.map(x=>({...x,value:x.secret?"[REDACTED]":x.value})));});
app.patch("/api/admin/settings/:key",auth,adminOnly("settings.manage"),async(req,res)=>{
 const {value,secret}=req.body||{};if(value===undefined)return res.status(400).json({error:"value is required"});
 const {rows}=await pool.query("insert into system_settings(key,value,secret,updated_by,updated_at) values($1,$2,coalesce($3,false),$4,now()) on conflict(key) do update set value=excluded.value,secret=excluded.secret,updated_by=excluded.updated_by,updated_at=now() returning key,value,secret,updated_at",[req.params.key,JSON.stringify(value),Boolean(secret),req.user.id]);await audit(req,"setting.update","system_setting",null,{key:req.params.key});res.json({...rows[0],value:rows[0].secret?"[REDACTED]":rows[0].value});
});
app.get("/api/admin/backups",auth,adminOnly("backups.read"),async(req,res)=>{const {rows}=await pool.query("select * from backup_jobs order by created_at desc limit 100");res.json(rows);});
app.post("/api/admin/backups",auth,adminOnly("backups.manage"),async(req,res)=>{const {backupType="database"}=req.body||{};const {rows}=await pool.query("insert into backup_jobs(status,backup_type,created_by) values('queued',$1,$2) returning *",[backupType,req.user.id]);await audit(req,"backup.create","backup_job",rows[0].id);res.status(201).json(rows[0]);});
app.get("/api/admin/updates",auth,adminOnly("updates.read"),async(req,res)=>{const {rows}=await pool.query("select j.*,r.version as release_version from update_jobs j left join releases r on r.id=j.release_id order by j.created_at desc limit 100");res.json(rows);});
app.post("/api/admin/updates",auth,adminOnly("updates.manage"),async(req,res)=>{
 const {releaseId,target="platform"}=req.body||{};if(!releaseId)return res.status(400).json({error:"releaseId is required"});
 const release=await pool.query("select version from releases where id=$1 and status='published'",[releaseId]);if(!release.rows[0])return res.status(404).json({error:"Published release not found"});
 const {rows}=await pool.query("insert into update_jobs(release_id,status,target,version_to,created_by) values($1,'queued',$2,$3,$4) returning *",[releaseId,target,release.rows[0].version,req.user.id]);await audit(req,"update.queue","update_job",rows[0].id,{release_id:releaseId});res.status(201).json(rows[0]);
});
app.get("/api/admin/audit",auth,adminOnly("system.read"),async(req,res)=>{const {rows}=await pool.query("select a.*,u.name as actor_name,u.email as actor_email from audit_logs a left join users u on u.id=a.actor_user_id order by a.created_at desc limit 300");res.json(rows);});
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