const API_BASE=(import.meta.env.VITE_API_URL||"https://animefusion.onrender.com").replace(/\/$/,"");

export function getAuthToken(){return sessionStorage.getItem("anifuze_api_token")||"";}
export function setAuthSession(data){
  if(data?.token)sessionStorage.setItem("anifuze_api_token",data.token);\n  window.dispatchEvent(new Event("authchange"));
  if(data?.user)localStorage.setItem("anifuze_customer_name",data.user.name||"Customer");
}
export function clearAuthSession(){sessionStorage.removeItem("anifuze_api_token");window.dispatchEvent(new Event("authchange"));}

export async function api(path,options={}){
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  const token=getAuthToken();
  if(token)headers.Authorization="Bearer "+token;
  const response=await fetch(API_BASE+"/api"+path,{...options,headers});
  const text=await response.text();
  let data=null;try{data=text?JSON.parse(text):null;}catch{data={error:text};}
  if(!response.ok)throw new Error(data?.error||"Request failed");
  return data;
}
