import { en } from "@/lib/locales/en";
import { zh } from "@/lib/locales/zh";

export const i18nBootScript = `window.__CURIALY_I18N=${JSON.stringify({ en, zh }).replace(/</g, "\\u003c")};
(function(){
  var KEY="curialy.locale";
  var MSG=window.__CURIALY_I18N;
  function read(){
    try{
      var l=localStorage.getItem(KEY);
      if(l==="zh"||l==="en") return l;
    }catch(e){}
    return (navigator.language||"").toLowerCase().indexOf("zh")===0?"zh":"en";
  }
  function apply(l){
    if(!MSG||(l!=="en"&&l!=="zh")) return;
    var html=document.documentElement;
    html.setAttribute("data-locale", l);
    html.setAttribute("lang", l==="zh"?"zh-CN":"en");
    var to=MSG[l]||MSG.en;
    var map={};
    for(var k in MSG.en){
      map[MSG.en[k]]=to[k];
      map[MSG.zh[k]]=to[k];
    }
    if(document.body){
      var w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode:function(n){
          var p=n.parentElement;
          if(!p) return 2;
          var tag=p.tagName;
          if(tag==="SCRIPT"||tag==="STYLE"||tag==="NOSCRIPT") return 2;
          if(p.closest("[data-set-locale]")) return 2;
          return 1;
        }
      });
      var node;
      while((node=w.nextNode())){
        var raw=node.nodeValue;
        var s=raw&&raw.trim();
        if(s&&map[s]!=null) node.nodeValue=raw.replace(s, map[s]);
      }
      document.querySelectorAll("[aria-label],[placeholder]").forEach(function(el){
        var a=el.getAttribute("aria-label");
        if(a&&map[a]!=null) el.setAttribute("aria-label", map[a]);
        var ph=el.getAttribute("placeholder");
        if(ph&&map[ph]!=null) el.setAttribute("placeholder", map[ph]);
      });
    }
    document.querySelectorAll("[data-set-locale]").forEach(function(btn){
      btn.setAttribute("aria-pressed", btn.getAttribute("data-set-locale")===l?"true":"false");
    });
    try{
      localStorage.setItem(KEY, l);
      document.cookie="curialy_locale="+l+";path=/;max-age=31536000;samesite=lax";
    }catch(e){}
  }
  window.__curialyApplyLocale=apply;
  var start=read();
  try{
    var t=localStorage.getItem("curialy.theme");
    if(t==="light"||t==="dark") document.documentElement.setAttribute("data-theme", t);
  }catch(e){}
  document.documentElement.setAttribute("data-locale", start);
  document.documentElement.setAttribute("lang", start==="zh"?"zh-CN":"en");
  function boot(){ apply(start); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  document.addEventListener("click", function(e){
    var t=e.target;
    if(!t) return;
    if(!t.closest) t=t.parentElement;
    if(!t||!t.closest) return;
    var b=t.closest("[data-set-locale]");
    if(!b) return;
    var l=b.getAttribute("data-set-locale");
    if(l!=="en"&&l!=="zh") return;
    e.preventDefault();
    apply(l);
    if(window.__CURIALY_SET_LOCALE) window.__CURIALY_SET_LOCALE(l);
  }, true);
})();`;
