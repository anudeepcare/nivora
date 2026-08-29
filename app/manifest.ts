import type {MetadataRoute} from "next";
export default function manifest():MetadataRoute.Manifest{return {name:"NIVORA — Market Intelligence",short_name:"NIVORA",description:"Decision intelligence for stocks and crypto.",start_url:"/dashboard",display:"standalone",background_color:"#f7f9fc",theme_color:"#101828",icons:[{src:"/icon.svg",sizes:"any",type:"image/svg+xml"}]}}
